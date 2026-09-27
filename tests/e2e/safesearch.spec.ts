import { expect, test, type Origin } from './fixtures';

/** Last request for this page; matching the path skips Chrome's own follow-ups such as /favicon.ico. */
function lastRequest(origin: Origin, pageUrl: string) {
  const { hostname, pathname } = new URL(pageUrl);
  const request = origin.requests.findLast((r) => r.url.hostname === hostname && r.url.pathname === pathname);
  if (request === undefined) throw new Error(`no request reached ${hostname}${pathname}`);
  return request;
}

const PARAM_CASES = [
  { url: 'https://www.google.com/search?q=test', param: ['safe', 'active'] },
  { url: 'https://www.google.co.uk/search?q=test&tbm=isch', param: ['safe', 'active'] },
  { url: 'https://www.bing.com/images/search?q=test', param: ['adlt', 'strict'] },
  { url: 'https://duckduckgo.com/?q=test', param: ['kp', '1'] },
  { url: 'https://yandex.ru/search/?text=test', param: ['family', 'yes'] },
  { url: 'https://search.brave.com/search?q=test', param: ['safesearch', 'strict'] },
] as const;

test.describe('SafeSearch', () => {
  for (const { url, param } of PARAM_CASES) {
    const [key, value] = param;
    test(`adds ${key}=${value} to ${url}`, async ({ page, origin }) => {
      await page.goto(url);
      const host = new URL(url).hostname;
      await expect(page).toHaveTitle(`ok ${host}`);
      expect(new URL(page.url()).searchParams.get(key)).toBe(value);
      const received = lastRequest(origin, url).url;
      expect(received.searchParams.get(key)).toBe(value);
      expect(received.searchParams.get('q') ?? received.searchParams.get('text')).toBe('test');
    });
  }

  test('overrides an explicit safe=off without a redirect loop', async ({ page, origin }) => {
    const before = origin.requests.length;
    await page.goto('https://www.google.com/search?q=loop&safe=off');
    await expect(page).toHaveTitle('ok www.google.com');
    expect(new URL(page.url()).searchParams.getAll('safe')).toEqual(['active']);
    // The redirect happens inside Chrome before any request is sent, so exactly one request arrives.
    const arrived = origin.requests.slice(before).filter((r) => r.url.searchParams.get('q') === 'loop');
    expect(arrived).toHaveLength(1);
  });

  test('leaves non-search pages of a search engine untouched', async ({ page, origin }) => {
    await page.goto('https://www.google.com/maps?q=test');
    expect(lastRequest(origin, 'https://www.google.com/maps').url.searchParams.has('safe')).toBe(false);
  });

  test('sends YouTube-Restrict: Strict to YouTube', async ({ page, origin }) => {
    await page.goto('https://www.youtube.com/watch?v=test');
    await expect(page).toHaveTitle('ok www.youtube.com');
    expect(lastRequest(origin, 'https://www.youtube.com/watch').headers['youtube-restrict']).toBe('Strict');
  });

  test('does not send the YouTube header elsewhere', async ({ page, origin }) => {
    await page.goto('http://example.com/');
    expect(lastRequest(origin, 'http://example.com/').headers['youtube-restrict']).toBeUndefined();
  });
});
