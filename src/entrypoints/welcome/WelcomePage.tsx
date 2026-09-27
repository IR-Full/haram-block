import type { ComponentChildren } from 'preact';
import { ShieldIcon } from '~/components/ShieldIcon';
import { t, type MessageKey } from '~/shared/i18n';
import { openExtensionSettings, useIncognitoAllowed } from '~/shared/incognito';

interface StepProps {
  n: number;
  title: MessageKey;
  text: MessageKey;
  done?: boolean;
  children?: ComponentChildren;
}

function Step({ n, title, text, done = false, children }: StepProps) {
  return (
    <li class="flex gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <span
        class={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          done ? 'bg-brand text-white dark:text-canvas' : 'bg-brand-soft text-brand-strong'
        }`}
        aria-hidden="true"
      >
        {done ? '✓' : n}
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="font-semibold">{t(title)}</h2>
        <p class="mt-1 text-sm text-muted">{t(text)}</p>
        {children}
      </div>
    </li>
  );
}

export function WelcomePage() {
  const incognitoAllowed = useIncognitoAllowed();

  return (
    <main class="mx-auto flex min-h-screen max-w-2xl flex-col justify-center p-6">
      <header class="text-center">
        <div class="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <ShieldIcon class="size-9" />
        </div>
        <h1 class="text-3xl font-semibold tracking-tight">{t('welcomeTitle')}</h1>
        <p class="mt-3 text-lg text-balance text-muted">{t('welcomeLead')}</p>
      </header>

      <ol class="mt-10 space-y-3">
        <Step n={1} title="stepIncognitoTitle" text="stepIncognitoText" done={incognitoAllowed === true}>
          {incognitoAllowed === false && (
            <button
              type="button"
              onClick={openExtensionSettings}
              class="mt-3 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:text-canvas"
            >
              {t('stepIncognitoButton')}
            </button>
          )}
          {incognitoAllowed === true && (
            <p class="mt-2 text-sm font-medium text-brand-strong" data-testid="incognito-done">
              {t('stepDone')}
            </p>
          )}
        </Step>
        <Step n={2} title="stepPinTitle" text="stepPinText" />
        <Step n={3} title="stepLockTitle" text="stepLockText" />
      </ol>
    </main>
  );
}
