import type { SourceFormat } from './sources.ts';

const HOSTS_SINK_ADDRESSES = new Set(['0.0.0.0', '127.0.0.1', '::', '::1']);
const HOSTS_RESERVED_NAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'local',
  'broadcasthost',
  'ip6-localhost',
  'ip6-loopback',
  '0.0.0.0',
]);

function stripComment(line: string): string {
  const hash = line.indexOf('#');
  return (hash === -1 ? line : line.slice(0, hash)).trim();
}

/** Extracts raw hostnames from a list. No validation here; see normalize.ts. */
export function parseList(text: string, format: SourceFormat): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = stripComment(rawLine);
    if (line === '' || line.startsWith('!')) continue;

    if (format === 'hosts') {
      const [address, ...names] = line.split(/\s+/);
      if (address === undefined || !HOSTS_SINK_ADDRESSES.has(address)) continue;
      for (const name of names) {
        if (!HOSTS_RESERVED_NAMES.has(name.toLowerCase())) out.push(name);
      }
      continue;
    }

    // `domains` and `wildcard` are both one entry per line; wildcard entries carry a `*.` prefix
    // that means "this domain and every subdomain", which is exactly how DNR requestDomains matches.
    const entry = format === 'wildcard' && line.startsWith('*.') ? line.slice(2) : line;
    if (!/\s/.test(entry)) out.push(entry);
  }
  return out;
}
