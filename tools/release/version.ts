/**
 * Prints the extension version for a release build.
 *
 *   node tools/release/version.ts                 code release: package.json version (x.y.z)
 *   node tools/release/version.ts --list-refresh  list-only refresh of that release: x.y.z.N
 *
 * N is the number of days since LIST_EPOCH, so every refresh sorts after its code release and after
 * earlier refreshes (Chrome compares versions part by part), and the next code release x.y.(z+1)
 * sorts after all of them. Chrome caps each part at 65535, which N reaches in the year 2205.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const LIST_EPOCH = Date.UTC(2026, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

export function releaseVersion(codeVersion: string, listRefresh: boolean, now: Date): string {
  if (!/^\d+\.\d+\.\d+$/.test(codeVersion)) {
    throw new Error(`package.json version must be x.y.z, got "${codeVersion}"`);
  }
  if (!listRefresh) return codeVersion;
  const days = Math.floor((now.getTime() - LIST_EPOCH) / DAY_MS);
  if (days < 1 || days > 65_535) throw new Error(`list refresh build number out of range: ${days}`);
  return `${codeVersion}.${days}`;
}

if (import.meta.main) {
  const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'package.json'), 'utf8')) as {
    version: string;
  };
  console.log(releaseVersion(pkg.version, process.argv.includes('--list-refresh'), new Date()));
}
