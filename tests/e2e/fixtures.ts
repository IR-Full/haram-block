import http, { type IncomingHttpHeaders, type RequestListener } from 'node:http';
import https from 'node:https';
import net, { type AddressInfo } from 'node:net';
import { join } from 'node:path';
import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import { generate } from 'selfsigned';

const EXTENSION_PATH = join(import.meta.dirname, '..', '..', '.output', 'chrome-mv3');

export interface ReceivedRequest {
  url: URL;
  headers: IncomingHttpHeaders;
}

export interface Origin {
  port: number;
  /** Hosts the local server was asked for, i.e. requests that were NOT blocked by the extension. */
  requestedHosts: Set<string>;
  /** Every request that reached the server, oldest first. */
  requests: ReceivedRequest[];
}

/**
 * One port that speaks both HTTP and HTTPS, told apart by the first byte (0x16 opens a TLS handshake).
 * Needed because `--host-resolver-rules` maps every host to a single port, while HSTS-preloaded hosts
 * such as google.com and youtube.com are always upgraded to HTTPS by Chrome.
 */
async function listenDualProtocol(handler: RequestListener): Promise<net.Server> {
  const { private: key, cert } = await generate([{ name: 'commonName', value: 'block-haram-e2e' }], {
    keyType: 'ec',
    algorithm: 'sha256',
  });
  const plain = http.createServer(handler);
  const secure = https.createServer({ key, cert }, handler);
  const server = net.createServer((socket) => {
    socket.once('data', (chunk) => {
      socket.pause();
      socket.unshift(chunk);
      (chunk[0] === 0x16 ? secure : plain).emit('connection', socket);
      process.nextTick(() => socket.resume());
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server;
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
      const requests: ReceivedRequest[] = [];
      const server = await listenDualProtocol((req, res) => {
        const host = (req.headers.host ?? '').split(':')[0]!;
        const scheme = 'encrypted' in req.socket ? 'https' : 'http';
        const url = new URL(req.url ?? '/', `${scheme}://${host}`);
        requestedHosts.add(host);
        requests.push({ url, headers: req.headers });
        const embed = url.searchParams.get('embed');
        const body =
          embed === null
            ? `<title>ok ${host}</title><h1>ok ${host}</h1>`
            : `<title>embed</title><img id="img" src="http://${embed}/pic.png"><iframe id="frame" src="http://${embed}/"></iframe>`;
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(body);
      });
      await use({ port: (server.address() as AddressInfo).port, requestedHosts, requests });
      await new Promise((resolve) => server.close(resolve));
    },
    { scope: 'worker' },
  ],

  extContext: [
    async ({ origin }, use) => {
      const context = await chromium.launchPersistentContext('', {
        channel: 'chromium',
        ignoreHTTPSErrors: true,
        args: [
          '--ignore-certificate-errors',
          // A system/env proxy would receive CONNECT for every host instead of the mapped test server.
          '--no-proxy-server',
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
