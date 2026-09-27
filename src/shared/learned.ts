import { storage } from '#imports';

/** Hosts learned from page heuristics → time learned (ms). Mirrored into two dynamic DNR rules. */
export const learnedHosts = storage.defineItem<Record<string, number>>('local:learnedHosts', { fallback: {} });

/**
 * Learned hosts expire so a rare false positive heals itself; a site that is still adult is
 * simply learned again on the next visit.
 */
export const LEARNED_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Well under Chrome's dynamic-rule budget; the oldest entries go first. */
export const MAX_LEARNED_HOSTS = 20_000;

/** Sent by the content script when it hides a page. */
export interface AdultPageMessage {
  type: 'adult-page';
  /** Whether the evidence is strong enough to block the whole domain from now on. */
  learn: boolean;
}

export function isAdultPageMessage(message: unknown): message is AdultPageMessage {
  return typeof message === 'object' && message !== null && (message as { type?: unknown }).type === 'adult-page';
}

/** Removes expired entries and, past the cap, the oldest ones. */
export function pruneLearned(hosts: Record<string, number>, now: number): Record<string, number> {
  const live = Object.entries(hosts)
    .filter(([, learnedAt]) => now - learnedAt < LEARNED_TTL_MS)
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_LEARNED_HOSTS);
  return Object.fromEntries(live);
}
