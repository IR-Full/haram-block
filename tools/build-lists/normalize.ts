import { domainToASCII } from 'node:url';
import { parse } from 'tldts';

const LABEL = /^[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$/;

/**
 * Returns the canonical punycode hostname DNR expects, or null when the entry cannot be a
 * navigable site: IPs, unknown TLDs, and bare public suffixes such as `blogspot.com` or
 * `github.io` (blocking those would take down every site hosted on them).
 */
export function normalizeHostname(raw: string): string | null {
  let host = raw.trim().toLowerCase();
  if (host.endsWith('.')) host = host.slice(0, -1);
  if (host === '' || host.length > 253) return null;

  host = domainToASCII(host);
  if (host === '') return null;
  if (!host.split('.').every((label) => LABEL.test(label))) return null;

  const info = parse(host, { allowPrivateDomains: true });
  if (info.isIp) return null;
  if (!info.isIcann && !info.isPrivate) return null;
  if (info.domain === null || host === info.publicSuffix) return null;

  return host;
}
