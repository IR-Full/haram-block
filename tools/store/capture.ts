/**
 * Renders store graphics from the built extension into store-assets/: 1280×800 screenshots of the
 * real pages (ru, en), the 440×280 / 1400×560 promo tiles, and the 300×300 logo Edge Add-ons asks for.
 *
 *   npm run store:assets
 *
 * Every hostname resolves to a closed local port, so nothing is fetched from the network:
 * the block page is reached through the extension's own DNR redirect.
 */
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type BrowserContext, type Page } from '@playwright/test';

const ROOT = join(import.meta.dirname, '..', '..');
const EXTENSION = join(ROOT, '.output', 'chrome-mv3');
const OUT = join(ROOT, 'store-assets');
const SCREEN = { width: 1280, height: 800 };

const COPY = {
  ru: {
    popup: 'Всегда включено. Всё работает локально.',
    promo: 'Защита взора в браузере',
  },
  en: {
    popup: 'Always on. Everything runs locally.',
    promo: 'Guard your gaze in the browser',
  },
} as const;
type Locale = keyof typeof COPY;

async function launch(locale: Locale): Promise<{ context: BrowserContext; extensionId: string }> {
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    locale,
    viewport: SCREEN,
    deviceScaleFactor: 1,
    // Chromium on Linux takes its UI language (and so chrome.i18n) from LANGUAGE, not --lang.
    env: { ...process.env, LANGUAGE: locale },
    args: [
      `--disable-extensions-except=${EXTENSION}`,
      `--load-extension=${EXTENSION}`,
      `--lang=${locale}`,
      '--no-proxy-server',
      '--host-resolver-rules=MAP * 127.0.0.1:9',
    ],
  });
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const extensionId = new URL(worker.url()).host;
  // The welcome tab opens on install; screenshots use their own tabs.
  for (const page of context.pages()) if (page.url().includes('welcome')) await page.close();
  return { context, extensionId };
}

/** A plausible state after some weeks of use, so the popup does not show zeros. */
async function seedStats(page: Page): Promise<void> {
  await page.evaluate(async () => {
    type Local = { set(items: Record<string, unknown>): Promise<void> };
    const local = (globalThis as unknown as { chrome: { storage: { local: Local } } }).chrome.storage.local;
    const now = Date.now();
    await local.set({
      blockedCount: 41,
      learnedHosts: { 'a.invalid': now, 'b.invalid': now, 'c.invalid': now },
    });
  });
}

/** Chrome shows an Incognito warning until the user allows it; store shots show the configured state. */
const HIDE_INCOGNITO_WARNING = '[role="alert"] { display: none !important; }';

async function screenshots(locale: Locale): Promise<void> {
  const { context, extensionId } = await launch(locale);
  const base = `chrome-extension://${extensionId}`;
  const page = await context.newPage();

  await page.goto(`${base}/popup.html`);
  await seedStats(page);

  await page.goto('http://pornhub.com/');
  await page.waitForURL(`${base}/blocked.html`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: join(OUT, `screenshot-1-blocked-${locale}.png`) });

  await page.goto(`${base}/popup.html`);
  await page.addStyleTag({
    content: `${HIDE_INCOGNITO_WARNING}
      html, body { height: 100%; }
      body { display: grid; place-content: center; justify-items: center; gap: 36px;
             background: radial-gradient(circle at 30% 20%, #10b981, #047857 70%); }
      main { background: var(--color-canvas); border-radius: 20px; zoom: 1.45;
             box-shadow: 0 30px 80px -20px rgb(0 0 0 / .45); }
      .caption { color: white; font: 600 34px/1.2 system-ui, 'Segoe UI', sans-serif; letter-spacing: -.01em; }`,
  });
  await page.evaluate((text) => {
    const caption = document.createElement('p');
    caption.className = 'caption';
    caption.textContent = text;
    document.body.prepend(caption);
  }, COPY[locale].popup);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, `screenshot-2-popup-${locale}.png`) });

  await page.goto(`${base}/welcome.html`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: join(OUT, `screenshot-3-welcome-${locale}.png`) });

  await context.close();
}

async function promoTiles(): Promise<void> {
  const icon = await readFile(join(ROOT, 'src', 'assets', 'icon.svg'), 'utf8');
  const browser = await chromium.launch({ channel: 'chromium' });
  const tiles = [
    { name: 'promo-small.png', width: 440, height: 280, icon: 96, title: 44, tagline: 18 },
    { name: 'promo-marquee.png', width: 1400, height: 560, icon: 220, title: 104, tagline: 38 },
  ];
  for (const tile of tiles) {
    const page = await browser.newPage({ viewport: { width: tile.width, height: tile.height } });
    await page.setContent(`<!doctype html>
      <style>
        body { margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center;
               gap: ${tile.icon * 0.28}px; background: radial-gradient(circle at 25% 25%, #10b981, #047857 75%);
               font-family: system-ui, 'Segoe UI', sans-serif; color: white; }
        svg { width: ${tile.icon}px; height: ${tile.icon}px; filter: drop-shadow(0 10px 24px rgb(0 0 0 / .3)); }
        svg path:first-of-type { fill: #ffffff26; }
        h1 { margin: 0; font-size: ${tile.title}px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
        p { margin: ${tile.tagline * 0.5}px 0 0; font-size: ${tile.tagline}px; opacity: .9; }
      </style>
      ${icon}
      <div><h1>Block Haram</h1><p>${COPY.en.promo}</p></div>`);
    await page.screenshot({ path: join(OUT, tile.name) });
    await page.close();
  }

  // Edge Add-ons wants a square store logo; the shield on a transparent background, like the toolbar icon.
  const logo = await browser.newPage({ viewport: { width: 300, height: 300 } });
  await logo.setContent(`<!doctype html>
    <style>
      body { margin: 0; height: 100vh; display: grid; place-items: center; background: transparent; }
      svg { width: 280px; height: 280px; }
    </style>
    ${icon}`);
  await logo.screenshot({ path: join(OUT, 'logo-300.png'), omitBackground: true });
  await logo.close();
  await browser.close();
}

await mkdir(OUT, { recursive: true });
for (const locale of Object.keys(COPY) as Locale[]) await screenshots(locale);
await promoTiles();
console.log(`✓ store graphics in ${OUT}`);
