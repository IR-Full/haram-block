/**
 * Builds the static DNR rulesets: the adult blocklist from upstream lists, and the SafeSearch rules.
 *
 *   node tools/build-lists/index.ts               use cached downloads younger than CACHE_TTL
 *   node tools/build-lists/index.ts --refresh     re-download every source
 *   node tools/build-lists/index.ts --if-missing  do nothing when the ruleset already exists (for `dev`)
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collapseSubdomains, isCovered, subtractAllowlist } from './collapse.ts';
import { normalizeHostname } from './normalize.ts';
import { parseList } from './parse.ts';
import { buildRules } from './rules.ts';
import { buildSafeSearchRules, SAFE_SEARCH_ENGINES } from './safesearch.ts';
import { SOURCES, type Source } from './sources.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const CACHE_DIR = join(HERE, '.cache');
const OUT_DIR = join(ROOT, 'public', 'rules');
const RULESET_PATH = join(OUT_DIR, 'adult.json');
const SAFESEARCH_PATH = join(OUT_DIR, 'safesearch.json');
const META_PATH = join(OUT_DIR, 'meta.json');

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 120_000;
const FETCH_ATTEMPTS = 3;
const CHUNK_SIZE = 5_000;
const BLOCKED_PAGE_PATH = '/blocked.html';

const args = new Set(process.argv.slice(2));

async function readLines(file: string): Promise<string[]> {
  const text = await readFile(join(HERE, file), 'utf8');
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, '').trim())
    .filter(Boolean);
}

async function download(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (error) {
      lastError = error;
      if (attempt < FETCH_ATTEMPTS) await new Promise((r) => setTimeout(r, 2_000 * attempt));
    }
  }
  throw new Error(`Failed to download ${url}: ${String(lastError)}`);
}

async function loadSource(source: Source): Promise<string> {
  const cacheFile = join(CACHE_DIR, `${source.id}.txt`);
  const cached = existsSync(cacheFile) ? await stat(cacheFile) : null;
  const fresh = cached !== null && Date.now() - cached.mtimeMs < CACHE_TTL_MS;
  if (fresh && !args.has('--refresh')) return readFile(cacheFile, 'utf8');

  try {
    const text = await download(source.url);
    await writeFile(cacheFile, text);
    return text;
  } catch (error) {
    // A stale list is better than no build when an upstream mirror is briefly down; CI still
    // surfaces the warning, and the minEntries check below catches truncated downloads.
    if (cached === null) throw error;
    console.warn(`! ${source.id}: ${String(error)}; using cache from ${cached.mtime.toISOString()}`);
    return readFile(cacheFile, 'utf8');
  }
}

async function main(): Promise<void> {
  if (args.has('--if-missing') && [RULESET_PATH, SAFESEARCH_PATH, META_PATH].every((p) => existsSync(p))) return;

  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const started = performance.now();
  const safeSearchRules = buildSafeSearchRules();
  await writeFile(SAFESEARCH_PATH, JSON.stringify(safeSearchRules));

  const texts = await Promise.all(SOURCES.map(loadSource));

  const union = new Set<string>();
  const sourceStats = SOURCES.map((source, i) => {
    const raw = parseList(texts[i]!, source.format);
    let valid = 0;
    for (const entry of raw) {
      const host = normalizeHostname(entry);
      if (host === null) continue;
      union.add(host);
      valid++;
    }
    if (valid < source.minEntries) {
      throw new Error(
        `${source.id}: only ${valid} valid entries (expected ≥ ${source.minEntries}); upstream looks broken`,
      );
    }
    console.log(`  ${source.id.padEnd(18)} raw ${String(raw.length).padStart(8)}  valid ${String(valid).padStart(8)}`);
    return { id: source.id, name: source.name, homepage: source.homepage, license: source.license, entries: valid };
  });

  const allowlist = (await readLines('allowlist.txt')).map((d) => {
    const host = normalizeHostname(d);
    if (host === null) throw new Error(`allowlist.txt: invalid hostname "${d}"`);
    return host;
  });
  const removed = subtractAllowlist(union, allowlist);
  const domains = collapseSubdomains(union);
  const domainSet = new Set(domains);

  const missing = (await readLines('must-block.txt')).filter((d) => !isCovered(domainSet, d));
  if (missing.length > 0) {
    throw new Error(`must-block.txt: not covered by the ruleset: ${missing.join(', ')}`);
  }

  const rules = buildRules(domains, { chunkSize: CHUNK_SIZE, blockedPagePath: BLOCKED_PAGE_PATH });
  const json = JSON.stringify(rules);
  await writeFile(RULESET_PATH, json);
  await writeFile(
    META_PATH,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      domainCount: domains.length,
      sources: sourceStats,
      safeSearch: SAFE_SEARCH_ENGINES.map((e) => e.name),
    }),
  );

  console.log(`  union ${union.size + removed.length} → allowlisted −${removed.length} → collapsed ${domains.length}`);
  if (removed.length > 0) console.log(`  allowlist removed: ${removed.join(', ')}`);
  console.log(`✓ safesearch: ${safeSearchRules.length} rules`);
  console.log(
    `✓ adult: ${rules.length} rules, ${(json.length / 1024 / 1024).toFixed(1)} MB, ${((performance.now() - started) / 1000).toFixed(1)} s`,
  );
}

await main();
