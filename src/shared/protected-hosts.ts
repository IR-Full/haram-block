import allowlistText from '~~/tools/build-lists/allowlist.txt?raw';

/**
 * Hosts whose domain is never learned from page heuristics: the reviewed blocklist allowlist
 * (mainstream platforms) and search engines, whose result pages echo whatever was searched.
 * An explicit page on them is still hidden, just not the whole site.
 */
const ALLOWLIST = allowlistText
  .split(/\r?\n/)
  .map((line) => line.replace(/#.*/, '').trim())
  .filter(Boolean);

const SEARCH_ENGINE =
  /(^|\.)(google|bing|yandex|ya|duckduckgo|yahoo|startpage|ecosia|qwant|baidu|naver|brave)\.[a-z.]+$/;

export function isProtectedHost(host: string): boolean {
  return SEARCH_ENGINE.test(host) || ALLOWLIST.some((domain) => host === domain || host.endsWith(`.${domain}`));
}
