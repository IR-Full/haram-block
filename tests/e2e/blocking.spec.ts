import { expect, test } from './fixtures';

test.describe('network blocking', () => {
  for (const host of ['pornhub.com', 'www.xvideos.com', 'rt.pornhub.com', 'onlyfans.com']) {
    test(`redirects ${host} to the block page`, async ({ page, extensionId, origin }) => {
      await page.goto(`http://${host}/some/path?q=1`);
      await expect(page).toHaveURL(`chrome-extension://${extensionId}/blocked.html`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(origin.requestedHosts.has(host)).toBe(false);
    });
  }

  // Hosts on Chrome's HSTS preload list (youtube.com, wikipedia.org…) are upgraded to HTTPS and
  // can't reach the plain-HTTP test server, so the allow checks use hosts that aren't preloaded.
  for (const host of ['example.com', 'kinopoisk.ru', 'www.mail.ru', 'jut.su']) {
    test(`lets ${host} through`, async ({ page }) => {
      await page.goto(`http://${host}/`);
      await expect(page).toHaveTitle(`ok ${host}`);
    });
  }

  test('blocks adult sub-resources and iframes embedded in a normal site', async ({ page, extensionId, origin }) => {
    await page.goto('http://example.com/?embed=xhamster.com');
    const frame = page.frameLocator('#frame');
    await expect(frame.getByRole('heading', { level: 1 })).toBeVisible();
    expect(page.frames().some((f) => f.url() === `chrome-extension://${extensionId}/blocked.html`)).toBe(true);
    expect(await page.locator('#img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(0);
    expect(origin.requestedHosts.has('xhamster.com')).toBe(false);
  });
});

test.describe('block page', () => {
  test('counts top-level blocks and shows the counter', async ({ page }) => {
    await page.goto('http://pornhub.com/');
    const first = await page.getByText(/\d/).last().textContent();
    await page.goto('http://xnxx.com/');
    const second = await page.getByText(/\d/).last().textContent();
    const n = (s: string | null) => Number(s?.replace(/\D/g, ''));
    expect(n(second)).toBe(n(first) + 1);
  });

  test('"Go back" returns to the previous page', async ({ page }) => {
    await page.goto('http://example.com/');
    await page.goto('http://pornhub.com/');
    await page.getByRole('button').first().click();
    await expect(page).toHaveTitle('ok example.com');
  });
});

test('popup shows list size and blocked count', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  const values = page.locator('dd');
  await expect(values.first()).toHaveText(/^\d[\d\s,.\u00a0]{5,}$/);
  await expect(values.nth(1)).not.toHaveText('—');
  await expect(page.getByText('Google · Bing')).toBeVisible();
});
