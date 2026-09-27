import type { DnrRule, QueryParam, ResourceType } from './dnr.ts';

/**
 * Search engines whose strict mode can be forced per request.
 *
 * URL-parameter engines get a `redirect` with a query transform. Chrome ignores a redirect whose
 * target equals the request URL, so once the parameter is in place the rule stops firing and there
 * is no loop; a user-supplied opposite value (`safe=off`) is overwritten.
 */
export interface SafeSearchEngine {
  id: string;
  name: string;
  /**
   * Which requests to touch. Parameter engines use an anchored RE2 pattern for search-result URLs
   * only, so the rest of the site is never redirected; header engines match whole domains.
   */
  match: { regexFilter: string } | { requestDomains: string[] };
  resourceTypes: ResourceType[];
  enforce: { param: QueryParam } | { header: { name: string; value: string } };
  /** Example URLs the pattern must (and must not) match; checked by unit tests. */
  examples: { match: string[]; skip: string[] };
}

/** Search pages load as documents; result pages and infinite scroll also fetch via XHR. */
const PAGE_AND_XHR: ResourceType[] = ['main_frame', 'sub_frame', 'xmlhttprequest'];

export const SAFE_SEARCH_ENGINES: readonly SafeSearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    // Every Google ccTLD (google.com, google.co.uk, google.com.tr…); images/video/news are /search with tbm/udm.
    match: { regexFilter: String.raw`^https?://(www\.)?google(\.[a-z]{2,3}){1,2}/(complete/)?search` },
    resourceTypes: PAGE_AND_XHR,
    enforce: { param: { key: 'safe', value: 'active' } },
    examples: {
      match: [
        'https://www.google.com/search?q=x',
        'https://www.google.co.uk/search?q=x&tbm=isch',
        'https://google.com.tr/search?q=x&safe=off',
        'https://www.google.ru/complete/search?q=x',
      ],
      skip: [
        'https://www.google.com/',
        'https://www.google.com/maps?q=x',
        'https://notgoogle.com/search?q=x',
        'https://www.google.com.evil.example/search?q=x',
      ],
    },
  },
  {
    id: 'bing',
    name: 'Bing',
    match: { regexFilter: String.raw`^https?://(www\.)?bing\.com/((images|videos|news|shop)/)?(search|async)` },
    resourceTypes: PAGE_AND_XHR,
    enforce: { param: { key: 'adlt', value: 'strict' } },
    examples: {
      match: [
        'https://www.bing.com/search?q=x',
        'https://www.bing.com/images/search?q=x',
        'https://www.bing.com/images/async?q=x&first=40',
        'https://www.bing.com/videos/search?q=x',
      ],
      skip: ['https://www.bing.com/', 'https://www.bing.com/maps?q=x', 'https://www.bing.com/fd/ls/l?x=1'],
    },
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    // `/?q=` is the web UI; d.js/i.js/v.js/news.js are the result APIs; html/lite are the no-JS versions.
    match: {
      regexFilter: String.raw`^https?://((html|lite|links)\.)?duckduckgo\.com/(\?|(html|lite)/?\?|[div]\.js|news\.js)`,
    },
    resourceTypes: [...PAGE_AND_XHR, 'script'],
    enforce: { param: { key: 'kp', value: '1' } },
    examples: {
      match: [
        'https://duckduckgo.com/?q=x',
        'https://links.duckduckgo.com/d.js?q=x&kp=-2',
        'https://duckduckgo.com/i.js?q=x',
        'https://html.duckduckgo.com/html/?q=x',
        'https://lite.duckduckgo.com/lite/?q=x',
      ],
      skip: ['https://duckduckgo.com/', 'https://duckduckgo.com/settings', 'https://duckduckgo.com/dist/app.js'],
    },
  },
  {
    id: 'yandex',
    name: 'Yandex',
    match: { regexFilter: String.raw`^https?://(www\.)?(yandex(\.[a-z]{2,3}){1,2}|ya\.ru)/((images|video)/)?search` },
    resourceTypes: PAGE_AND_XHR,
    enforce: { param: { key: 'family', value: 'yes' } },
    examples: {
      match: [
        'https://yandex.ru/search/?text=x',
        'https://ya.ru/search/?text=x',
        'https://yandex.com.tr/search/?text=x',
        'https://yandex.ru/images/search?text=x',
        'https://yandex.kz/video/search?text=x',
      ],
      skip: ['https://yandex.ru/', 'https://yandex.ru/maps/?text=x', 'https://music.yandex.ru/search?text=x'],
    },
  },
  {
    id: 'brave',
    name: 'Brave Search',
    match: { regexFilter: String.raw`^https?://search\.brave\.com/(search|images|videos|news)` },
    resourceTypes: PAGE_AND_XHR,
    enforce: { param: { key: 'safesearch', value: 'strict' } },
    examples: {
      match: ['https://search.brave.com/search?q=x', 'https://search.brave.com/images?q=x'],
      skip: ['https://search.brave.com/', 'https://brave.com/search'],
    },
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    match: { regexFilter: String.raw`^https?://([a-z]{2}\.)?((images|video)\.)?search\.yahoo\.com/search` },
    resourceTypes: PAGE_AND_XHR,
    enforce: { param: { key: 'vm', value: 'r' } },
    examples: {
      match: [
        'https://search.yahoo.com/search?p=x',
        'https://images.search.yahoo.com/search/images?p=x',
        'https://uk.search.yahoo.com/search?p=x',
      ],
      skip: ['https://www.yahoo.com/', 'https://search.yahoo.com/'],
    },
  },
  {
    id: 'startpage',
    name: 'Startpage',
    match: { regexFilter: String.raw`^https?://(www\.)?startpage\.com/(sp|do)/search` },
    resourceTypes: PAGE_AND_XHR,
    enforce: { param: { key: 'qadf', value: 'heavy' } },
    examples: {
      match: ['https://www.startpage.com/sp/search?query=x', 'https://www.startpage.com/do/search?q=x'],
      skip: ['https://www.startpage.com/'],
    },
  },
  {
    id: 'youtube',
    name: 'YouTube',
    // Google's documented network-level switch for Restricted Mode; covers the web app, embeds and its APIs.
    match: {
      requestDomains: ['youtube.com', 'youtube-nocookie.com', 'youtubei.googleapis.com', 'youtube.googleapis.com'],
    },
    resourceTypes: PAGE_AND_XHR,
    enforce: { header: { name: 'YouTube-Restrict', value: 'Strict' } },
    examples: {
      match: [
        'https://www.youtube.com/watch?v=x',
        'https://m.youtube.com/',
        'https://youtubei.googleapis.com/youtubei/v1/search',
        'https://www.youtube-nocookie.com/embed/x',
      ],
      skip: ['https://notyoutube.com/', 'https://www.google.com/search?q=youtube.com/'],
    },
  },
];

export function buildSafeSearchRules(engines: readonly SafeSearchEngine[] = SAFE_SEARCH_ENGINES): DnrRule[] {
  return engines.map(({ match, resourceTypes, enforce }, i) => ({
    id: i + 1,
    priority: 1,
    action:
      'param' in enforce
        ? { type: 'redirect', redirect: { transform: { queryTransform: { addOrReplaceParams: [enforce.param] } } } }
        : {
            type: 'modifyHeaders',
            requestHeaders: [{ header: enforce.header.name, operation: 'set', value: enforce.header.value }],
          },
    condition: { ...match, resourceTypes },
  }));
}
