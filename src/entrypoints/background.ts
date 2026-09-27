// All blocking is declarative (DNR rulesets), so the worker only wakes for lifecycle events.
export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') void browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
  });
});
