import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';

const EXTENSION_PATH = join(import.meta.dirname, '..', '..', '.output', 'chrome-mv3');

export interface Origin {
  port: number;
  /** Hosts the local server was asked for, i.e. requests that were NOT blocked by the extension. */
  requestedHosts: Set<string>;
}

/**
 * Every hostname resolves to a local server, so tests exercise real navigation to
 * `pornhub.com` etc. without any traffic leaving the machine.
 */
export const test = base.extend<{ page: Page }, { origin: Origin; extContext: BrowserContext; extensionId: string }>({
  origin: [
    // Playwright requires an object pattern here to detect fixture dependencies.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const requestedHosts = new Set<string>();
      const server: Server = createServer((req, res) => {
        const host = (req.headers.host ?? '').split(':')[0]!;
        requestedHosts.add(host);
        const url = new URL(req.url ?? '/', `http://${host}`);
        const embed = url.searchParams.get('embed');
        const body =
          embed === null
            ? `<title>ok ${host}</title><h1>ok ${host}</h1>`
            : `<title>embed</title><img id="img" src="http://${embed}/pic.png"><iframe id="frame" src="http://${embed}/"></iframe>`;
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(body);
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      await use({ port: (server.address() as AddressInfo).port, requestedHosts });
      await new Promise((resolve) => server.close(resolve));
    },
    { scope: 'worker' },
  ],

  extContext: [
    async ({ origin }, use) => {
      const context = await chromium.launchPersistentContext('', {
        channel: 'chromium',
        args: [
          `--disable-extensions-except=${EXTENSION_PATH}`,
          `--load-extension=${EXTENSION_PATH}`,
          `--host-resolver-rules=MAP * 127.0.0.1:${origin.port}`,
        ],
      });
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  extensionId: [
    async ({ extContext }, use) => {
      // No background worker yet, so read the ID from the extensions page instead of serviceWorkers().
      const page = await extContext.newPage();
      await page.goto('chrome://extensions');
      const id = await page.evaluate(async () => {
        type DeveloperPrivate = { getExtensionsInfo(): Promise<{ id: string }[]> };
        const api = (globalThis as unknown as { chrome: { developerPrivate: DeveloperPrivate } }).chrome
          .developerPrivate;
        const [ext] = await api.getExtensionsInfo();
        return ext!.id;
      });
      await page.close();
      await use(id);
    },
    { scope: 'worker' },
  ],

  page: async ({ extContext }, use) => {
    const page = await extContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
