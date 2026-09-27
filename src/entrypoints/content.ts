import { BLOCKED_PAGE_PATH } from '~/shared/block-rules';
import { classifyPage, type PageSignals } from '~/shared/classifier';
import type { AdultPageMessage } from '~/shared/learned';

/** How long to wait for the worker to store a learned domain before leaving the page anyway. */
const LEARN_TIMEOUT_MS = 1_000;

function readSignals(): PageSignals {
  const meta = (name: string) =>
    Array.from(document.querySelectorAll(`meta[name="${name}" i]`), (m) => m.getAttribute('content') ?? '').join(' ');
  return {
    hostname: location.hostname,
    title: document.title,
    description: meta('description'),
    keywords: meta('keywords'),
    rating: meta('rating'),
  };
}

// lib.dom types document.body as non-null, but it is null until the parser reaches <body>.
const bodyStarted = () => (document.body as HTMLElement | null) !== null;

/**
 * Runs `callback` once the <head> is parsed (the moment <body> starts), before most of the page
 * renders. The observer only lives while the head streams in, so steady-state cost is zero.
 */
function whenHeadParsed(callback: () => void): void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    observer.disconnect();
    callback();
  };
  const observer = new MutationObserver(() => {
    if (bodyStarted()) run();
  });
  if (bodyStarted() || document.readyState !== 'loading') {
    run();
    return;
  }
  observer.observe(document, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', run, { once: true });
}

async function hidePage(learn: boolean): Promise<void> {
  window.stop();
  document.documentElement.style.setProperty('visibility', 'hidden', 'important');
  const message: AdultPageMessage = { type: 'adult-page', learn };
  await Promise.race([
    browser.runtime.sendMessage(message).catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, LEARN_TIMEOUT_MS)),
  ]);
  // replace(), not assign(): "Back" on the block page must not return here.
  location.replace(browser.runtime.getURL(BLOCKED_PAGE_PATH));
}

/**
 * Second line of defence for adult sites missing from the blocklists: reads the page's own
 * title, description, keywords and rating labels, and hides it when they are explicit.
 */
export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_start',
  allFrames: false,
  main() {
    if (document.contentType !== 'text/html') return;
    whenHeadParsed(() => {
      const verdict = classifyPage(readSignals());
      if (verdict.decision !== 'allow') void hidePage(verdict.decision === 'block-domain');
    });
  },
});
