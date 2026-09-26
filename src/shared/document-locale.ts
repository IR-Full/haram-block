import { isRtl, t, uiLanguage, type MessageKey } from './i18n';

/** Sets lang/dir/title from the browser UI locale so screen readers and RTL layout work. */
export function applyDocumentLocale(titleKey: MessageKey): void {
  document.documentElement.lang = uiLanguage();
  document.documentElement.dir = isRtl() ? 'rtl' : 'ltr';
  document.title = t(titleKey);
}
