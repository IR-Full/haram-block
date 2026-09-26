function* ancestors(host: string): Generator<string> {
  let dot = host.indexOf('.');
  while (dot !== -1) {
    const parent = host.slice(dot + 1);
    yield parent;
    dot = host.indexOf('.', dot + 1);
  }
}

/**
 * Drops every entry whose parent domain is also listed, since DNR `requestDomains` already
 * matches subdomains. Output is sorted for deterministic, diff-friendly builds.
 */
export function collapseSubdomains(domains: Iterable<string>): string[] {
  const set = new Set(domains);
  const kept: string[] = [];
  outer: for (const host of set) {
    for (const parent of ancestors(host)) {
      if (set.has(parent)) continue outer;
    }
    kept.push(host);
  }
  return kept.sort();
}

/**
 * Removes entries that would block an allowlisted host: the host itself and any of its parents.
 * Subdomains of an allowlisted host stay blocked, so `nsfw-blog.tumblr.com` is still caught
 * while `tumblr.com` as a whole is not.
 */
export function subtractAllowlist(domains: Set<string>, allowlist: Iterable<string>): string[] {
  const removed: string[] = [];
  for (const allowed of allowlist) {
    for (const candidate of [allowed, ...ancestors(allowed)]) {
      if (domains.delete(candidate)) removed.push(candidate);
    }
  }
  return removed.sort();
}

/** True when `host` or one of its parents is in `domains`, i.e. DNR would block it. */
export function isCovered(domains: ReadonlySet<string>, host: string): boolean {
  if (domains.has(host)) return true;
  for (const parent of ancestors(host)) {
    if (domains.has(parent)) return true;
  }
  return false;
}
