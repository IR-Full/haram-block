import { storage } from '#imports';

/** Number of times the block page was shown as a top-level document. Kept locally only. */
export const blockedCount = storage.defineItem<number>('local:blockedCount', { fallback: 0 });

export async function recordBlock(): Promise<number> {
  const next = (await blockedCount.getValue()) + 1;
  await blockedCount.setValue(next);
  return next;
}
