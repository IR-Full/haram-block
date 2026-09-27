import type { BrowserContext } from '@playwright/test';
import { expect, test, type Origin } from './fixtures';

const page = (url: string, head: Record<string, string> = {}) => {
  const query = new URLSearchParams(head).toString();
  return query === '' ? url : `${url}?${query}`;
};

/** Scores well above the domain threshold. */
const EXPLICIT = {
  title: 'Free HD Porn Videos - Best XXX Tube',
  description: 'Watch free porn videos and xxx movies, milf, hentai.',
};
/** Scores above the page threshold only. */
const BORDERLINE = { title: 'Порно видео онлайн бесплатно' };

const reached = (origin: Origin, since: number, hostname: string) =>
  origin.requests.slice(since).some((r) => r.url.hostname === hostname);

/**
 * The page is hidden at once, but the domain is stored by the service worker, which may still be
 * cold-starting when the content script stops waiting (1 s). Wait for it before relying on DNR.
 */
async function learned(context: BrowserContext, extensionId: string, host: string): Promise<void> {
  const probe = await context.newPage();
  await probe.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect
    .poll(() =>
      probe.evaluate(async (h) => {
        type Local = { get(key: string): Promise<Record<string, Record<string, number> | undefined>> };
        const local = (globalThis as unknown as { chrome: { storage: { local: Local } } }).chrome.storage.local;
        const { learnedHosts } = await local.get('learnedHosts');
        return learnedHosts !== undefined && h in learnedHosts;
      }, host),
    )
    .toBe(true);
  await probe.close();
}

test.describe('page heuristics', () => {
  test('hides a self-labelled RTA page and blocks its domain from then on', async ({
    page: tab,
    extContext,
    extensionId,
    origin,
  }) => {
    const blocked = `chrome-extension://${extensionId}/blocked.html`;
    await tab.goto(page('http://rta-site.test/', { rating: 'RTA-5042-1996-1400-1577-RTA' }));
    await expect(tab).toHaveURL(blocked);
    await learned(extContext, extensionId, 'rta-site.test');

    const since = origin.requests.length;
    await tab.goto('http://rta-site.test/another-page');
    await expect(tab).toHaveURL(blocked);
    await tab.goto('http://cdn.rta-site.test/');
    await expect(tab).toHaveURL(blocked);
    // Learned domains are blocked by DNR before any request leaves the browser.
    expect(reached(origin, since, 'rta-site.test') || reached(origin, since, 'cdn.rta-site.test')).toBe(false);
  });

  test('learns an explicit site under its bare domain', async ({ page: tab, extContext, extensionId }) => {
    const blocked = `chrome-extension://${extensionId}/blocked.html`;
    await tab.goto(page('http://www.fresh-tube.test/', EXPLICIT));
    await expect(tab).toHaveURL(blocked);
    await learned(extContext, extensionId, 'fresh-tube.test');
    await tab.goto('http://fresh-tube.test/');
    await expect(tab).toHaveURL(blocked);
  });

  test('hides a borderline page without blocking the whole site', async ({ page: tab, extensionId }) => {
    await tab.goto(page('http://borderline.test/video', BORDERLINE));
    await expect(tab).toHaveURL(`chrome-extension://${extensionId}/blocked.html`);
    await tab.goto('http://borderline.test/');
    await expect(tab).toHaveTitle('ok borderline.test');
  });

  test('"Go back" skips the hidden page', async ({ page: tab }) => {
    await tab.goto('http://example.com/');
    await tab.goto(page('http://another-borderline.test/', BORDERLINE));
    await tab.getByRole('button').first().click();
    await expect(tab).toHaveTitle('ok example.com');
  });

  test('never learns a search engine, only hides the page', async ({ page: tab, extensionId }) => {
    await tab.goto(page('https://www.google.com/search', { q: 'x', ...EXPLICIT }));
    await expect(tab).toHaveURL(`chrome-extension://${extensionId}/blocked.html`);
    await tab.goto('https://www.google.com/about');
    await expect(tab).toHaveTitle('ok www.google.com');
  });

  test('leaves pages that merely mention the topic alone', async ({ page: tab }) => {
    const title = 'Porn addiction: signs and how to quit';
    await tab.goto(page('http://health-news.test/article', { title, description: 'Treatment and support.' }));
    await expect(tab).toHaveTitle(title);
  });

  test('popup counts learned domains', async ({ page: tab, extensionId }) => {
    await tab.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(tab.locator('dd').nth(2)).toHaveText(/^[1-9]/);
  });
});
