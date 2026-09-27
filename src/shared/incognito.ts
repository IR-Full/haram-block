import { useEffect, useState } from 'preact/hooks';

/**
 * Chrome does not run extensions in Incognito unless the user flips the per-extension switch, and
 * an extension cannot flip it itself. Pages surface the state and deep-link to the switch.
 */
export function openExtensionSettings(): void {
  void browser.tabs.create({ url: `chrome://extensions/?id=${browser.runtime.id}` });
}

/** Incognito access; re-checked when the page regains focus, i.e. after the user returns from settings. */
export function useIncognitoAllowed(): boolean | null {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => void browser.extension.isAllowedIncognitoAccess().then(setAllowed);
    check();
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  return allowed;
}
