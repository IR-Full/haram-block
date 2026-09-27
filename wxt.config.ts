import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
    developmentIndicator: false,
  },
  vite: () => ({
    plugins: [preact(), tailwindcss()],
  }),
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'ru',
    minimum_chrome_version: '120',
    // Split mode would need a second copy of the ruleset index in incognito; spanning shares one.
    incognito: 'spanning',
    permissions: ['declarativeNetRequest', 'storage'],
    // DNR `redirect` (block page, SafeSearch parameters) and `modifyHeaders` (YouTube Restricted Mode)
    // require host access to the affected URLs.
    host_permissions: ['<all_urls>'],
    declarative_net_request: {
      rule_resources: [
        { id: 'adult', enabled: true, path: 'rules/adult.json' },
        { id: 'safesearch', enabled: true, path: 'rules/safesearch.json' },
      ],
    },
    web_accessible_resources: [{ resources: ['blocked.html'], matches: ['<all_urls>'] }],
  },
});
