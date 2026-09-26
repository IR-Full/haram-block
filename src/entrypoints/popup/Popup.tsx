import { useEffect, useState } from 'preact/hooks';
import { formatDate, formatNumber, t, type MessageKey } from '~/shared/i18n';
import { loadListMeta, type ListMeta } from '~/shared/list-meta';
import { blockedCount } from '~/shared/stats';

function Stat({ label, value }: { label: MessageKey; value: string | null }) {
  return (
    <div class="flex items-baseline justify-between gap-4 py-2.5">
      <dt class="text-sm text-muted">{t(label)}</dt>
      <dd class="font-semibold tabular-nums">{value ?? '—'}</dd>
    </div>
  );
}

export function Popup() {
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [blocked, setBlocked] = useState<number | null>(null);

  useEffect(() => {
    void loadListMeta().then(setMeta);
    void blockedCount.getValue().then(setBlocked);
    return blockedCount.watch(setBlocked);
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

      <dl class="mt-3 divide-y divide-line px-1">
        <Stat label="statDomains" value={meta && formatNumber(meta.domainCount)} />
        <Stat label="statBlocked" value={blocked === null ? null : formatNumber(blocked)} />
        <Stat label="statUpdated" value={meta && formatDate(meta.generatedAt)} />
      </dl>

      <footer class="mt-3 border-t border-line px-1 pt-3 text-xs text-muted">
        {t('popupPrivacy')}
        <span class="mt-1 block opacity-70">v{browser.runtime.getManifest().version}</span>
      </footer>
    </main>
  );
}
