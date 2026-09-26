import { useEffect, useState } from 'preact/hooks';
import { formatNumber, t } from '~/shared/i18n';

/** Uthmani text of An-Nur 24:30, first sentence. Shown in every locale. */
const AYAH = 'قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ وَيَحْفَظُوا فُرُوجَهُمْ ۚ ذَٰلِكَ أَزْكَىٰ لَهُمْ';

interface Props {
  /** Pending updated counter, or null when rendered inside an iframe and not counted. */
  count: Promise<number> | null;
}

async function closeTab(): Promise<void> {
  const tab = await browser.tabs.getCurrent();
  if (tab?.id !== undefined) await browser.tabs.remove(tab.id);
}

export function BlockedPage({ count }: Props) {
  const [total, setTotal] = useState<number | null>(null);
  const canGoBack = window.history.length > 1;
  const translation = t('ayahTranslation');

  useEffect(() => {
    void count?.then(setTotal);
  }, [count]);

  return (
    <main class="flex min-h-screen items-center justify-center p-6">
      <div class="w-full max-w-xl text-center">
        <div class="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <svg
            viewBox="0 0 24 24"
            class="size-9"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path d="M12 3 20 6v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6Z" stroke-linejoin="round" />
            <path d="m9 12 2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <h1 class="text-3xl font-semibold tracking-tight">{t('blockedTitle')}</h1>
        <p class="mt-3 text-lg text-balance text-muted">{t('blockedLead')}</p>

        <figure class="mt-10 rounded-2xl border border-line bg-surface px-6 pt-9 pb-7 shadow-sm">
          <blockquote>
            <p lang="ar" dir="rtl" class="font-quran text-3xl leading-[1.9] text-ink">
              {AYAH}
            </p>
            {translation !== '' && <p class="mt-4 text-base text-balance text-muted italic">{translation}</p>}
          </blockquote>
          <figcaption class="mt-4 text-sm font-medium text-brand-strong">{t('ayahSource')}</figcaption>
        </figure>

        <div class="mt-10 flex flex-wrap justify-center gap-3">
          {canGoBack && (
            <button
              type="button"
              onClick={() => {
                window.history.back();
              }}
              class="rounded-xl bg-brand px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:text-canvas"
            >
              {t('goBack')}
            </button>
          )}
          <button
            type="button"
            onClick={() => void closeTab()}
            class="rounded-xl border border-line bg-surface px-5 py-2.5 font-medium transition hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t('closeTab')}
          </button>
        </div>

        {total !== null && (
          <p class="mt-8 text-sm text-muted tabular-nums">{t('blockedCounter', formatNumber(total))}</p>
        )}
      </div>
    </main>
  );
}
