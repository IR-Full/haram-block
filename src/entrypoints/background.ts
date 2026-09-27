import { blockRulePair } from '~/shared/block-rules';
import { isAdultPageMessage, learnedHosts, pruneLearned } from '~/shared/learned';
import { isProtectedHost } from '~/shared/protected-hosts';

// Dynamic-ruleset IDs; static rulesets have their own ID spaces.
const LEARNED_REDIRECT_RULE_ID = 1;
const LEARNED_BLOCK_RULE_ID = 2;

// Blocking itself is declarative. The worker wakes only for lifecycle events and for the rare
// page the content script flags, to fold its domain into the learned rules.
export default defineBackground(() => {
  let queue: Promise<unknown> = Promise.resolve();

  /** Storage and rule updates are read-modify-write; run them one at a time. */
  function serialized(task: () => Promise<void>): Promise<void> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  }

  function syncLearned(update: (hosts: Record<string, number>) => void = () => undefined): Promise<void> {
    return serialized(async () => {
      const hosts = { ...(await learnedHosts.getValue()) };
      update(hosts);
      const live = pruneLearned(hosts, Date.now());
      await learnedHosts.setValue(live);

      // Two rules whose requestDomains hold every learned host, rewritten as a whole.
      const domains = Object.keys(live).sort();
      await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [LEARNED_REDIRECT_RULE_ID, LEARNED_BLOCK_RULE_ID],
        addRules: domains.length > 0 ? blockRulePair(domains, LEARNED_REDIRECT_RULE_ID, LEARNED_BLOCK_RULE_ID) : [],
      });
    });
  }

  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') void browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
    void syncLearned();
  });

  browser.runtime.onStartup.addListener(() => void syncLearned());

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isAdultPageMessage(message)) return;
    if (!message.learn || sender.frameId !== 0 || sender.url === undefined) {
      sendResponse(false);
      return;
    }
    const { protocol, hostname } = new URL(sender.url);
    const host = hostname.replace(/^www\./, '');
    if (!protocol.startsWith('http') || isProtectedHost(host)) {
      sendResponse(false);
      return;
    }
    void syncLearned((hosts) => {
      hosts[host] = Date.now();
    }).then(
      () => {
        sendResponse(true);
      },
      () => {
        sendResponse(false);
      },
    );
    return true; // keep the channel open for the async response
  });
});
