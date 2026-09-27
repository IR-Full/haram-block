import { expect, test } from './fixtures';

test.describe('onboarding', () => {
  test('opens the welcome page right after install', async ({ extContext, extensionId }) => {
    await expect
      .poll(() => extContext.pages().some((p) => p.url() === `chrome-extension://${extensionId}/welcome.html`))
      .toBe(true);
  });

  // Test browsers load the extension without Incognito access, like a fresh install does.
  test('welcome page asks to allow Incognito and links to the extension settings', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/welcome.html`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('listitem')).toHaveCount(3);
    await expect(page.getByTestId('incognito-done')).toHaveCount(0);

    const settings = page.context().waitForEvent('page');
    await page.getByRole('listitem').first().getByRole('button').click();
    expect((await settings).url()).toBe(`chrome://extensions/?id=${extensionId}`);
  });

  test('popup warns when Incognito is not covered', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
