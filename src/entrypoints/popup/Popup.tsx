import { useEffect, useState } from 'preact/hooks';
import { formatDate, formatNumber, t, type MessageKey } from '~/shared/i18n';
import { openExtensionSettings, useIncognitoAllowed } from '~/shared/incognito';
import { loadListMeta, type ListMeta } from '~/shared/list-meta';
import { learnedHosts } from '~/shared/learned';
import { blockedCount } from '~/shared/stats';

interface StatProps {
  label: MessageKey;
  value: string | null;
  detail?: string | undefined;
}

function Stat({ label, value, detail }: StatProps) {
  return (
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5">
      <dt class="text-sm text-muted">{t(label)}</dt>
      <dd class="font-semibold tabular-nums">{value ?? '—'}</dd>
      {detail !== undefined && <dd class="mt-0.5 basis-full text-xs text-muted">{detail}</dd>}
    </div>
  );
}

export function Popup() {
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [blocked, setBlocked] = useState<number | null>(null);
  const [learned, setLearned] = useState<number | null>(null);
  const incognitoAllowed = useIncognitoAllowed();

  useEffect(() => {
    const countLearned = (hosts: Record<string, number>) => {
      setLearned(Object.keys(hosts).length);
    };
    void loadListMeta().then(setMeta);
    void blockedCount.getValue().then(setBlocked);
    void learnedHosts.getValue().then(countLearned);
    const unwatchBlocked = blockedCount.watch(setBlocked);
    const unwatchLearned = learnedHosts.watch(countLearned);
    return () => {
      unwatchBlocked();
      unwatchLearned();
    };
  }, []);

  return (
    <main class="w-80 p-4">
      <header class="flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
        <span class="relative flex size-3 shrink-0">
          <span class="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
          <span class="relative inline-flex size-3 rounded-full bg-brand" />
        </span>
        <div>
          <h1 class="font-semibold text-brand-strong">{t('popupStatus')}</h1>
          <p class="text-xs text-muted">{t('popupStatusHint')}</p>
        </div>
      </header>

      {incognitoAllowed === false && (
        <div
          role="alert"
          class="mt-3 flex items-center justify-between gap-3 rounded-xl bg-warn-soft px-4 py-3 text-warn"
        >
          <span class="text-sm font-medium">{t('incognitoWarning')}</span>
          <button
            type="button"
            onClick={openExtensionSettings}
            class="shrink-0 rounded-lg border border-current px-3 py-1 text-xs font-semibold transition hover:bg-warn hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warn"
          >
            {t('incognitoWarningAction')}
          </button>
        </div>
      )}

      <dl class="mt-3 divide-y divide-line px-1">
        <Stat label="statDomains" value={meta && formatNumber(meta.domainCount)} />
        <Stat label="statBlocked" value={blocked === null ? null : formatNumber(blocked)} />
        <Stat label="statLearned" value={learned === null ? null : formatNumber(learned)} />
        <Stat label="statSafeSearch" value={t('statOn')} detail={meta?.safeSearch.join(' · ')} />
        <Stat label="statUpdated" value={meta && formatDate(meta.generatedAt)} />
      </dl>

      <footer class="mt-3 border-t border-line px-1 pt-3 text-xs text-muted">
        {t('popupPrivacy')}
        <span class="mt-1 block opacity-70">v{browser.runtime.getManifest().version}</span>
      </footer>
    </main>
  );
}
