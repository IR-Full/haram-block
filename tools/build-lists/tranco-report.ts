/**
 * False-positive review: lists every site in the Tranco top-N that the built ruleset blocks.
 * Popular adult sites are expected here; anything else belongs in allowlist.txt.
 *
 *   node tools/build-lists/tranco-report.ts [N=10000]
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isCovered } from './collapse.ts';
import type { DnrRule } from './rules.ts';

const TOP_N = Number(process.argv[2] ?? 10_000);
const RULESET_PATH = join(import.meta.dirname, '..', '..', 'public', 'rules', 'adult.json');

const rules = JSON.parse(await readFile(RULESET_PATH, 'utf8')) as DnrRule[];
const domains = new Set(rules.filter((r) => r.action.type === 'redirect').flatMap((r) => r.condition.requestDomains));

const latest = (await (await fetch('https://tranco-list.eu/api/lists/date/latest')).json()) as { list_id: string };
const csv = await (await fetch(`https://tranco-list.eu/download/${latest.list_id}/${TOP_N}`)).text();

const hits: string[] = [];
for (const line of csv.split(/\r?\n/)) {
  const [rank, host] = line.split(',');
  if (host !== undefined && isCovered(domains, host.trim())) hits.push(`${rank!.padStart(6)}  ${host.trim()}`);
}

console.log(`Tranco ${latest.list_id} top ${TOP_N}: ${hits.length} blocked\n${hits.join('\n')}`);
