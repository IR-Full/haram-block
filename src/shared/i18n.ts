import type messages from '~~/public/_locales/ru/messages.json';

export type MessageKey = keyof typeof messages;

export function t(key: MessageKey, ...substitutions: string[]): string {
  return browser.i18n.getMessage(key, substitutions);
}

export const uiLanguage = (): string => browser.i18n.getUILanguage();

export const isRtl = (): boolean => browser.i18n.getMessage('@@bidi_dir') === 'rtl';

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(uiLanguage()).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(uiLanguage(), { dateStyle: 'medium' }).format(new Date(iso));
}
