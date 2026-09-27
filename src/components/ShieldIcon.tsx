export function ShieldIcon({ class: className }: { class?: string }) {
  return (
    <svg viewBox="0 0 24 24" class={className} fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
      <path d="M12 3 20 6v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6Z" stroke-linejoin="round" />
      <path d="m9 12 2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}
