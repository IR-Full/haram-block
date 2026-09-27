import { describe, expect, it } from 'vitest';
import { isAdultPageMessage, LEARNED_TTL_MS, MAX_LEARNED_HOSTS, pruneLearned } from '~/shared/learned';
import { isProtectedHost } from '~/shared/protected-hosts';

describe('pruneLearned', () => {
  const now = 1_000_000_000_000;

  it('drops hosts learned longer ago than the TTL', () => {
    expect(pruneLearned({ fresh: now - 1_000, stale: now - LEARNED_TTL_MS - 1 }, now)).toEqual({ fresh: now - 1_000 });
  });

  it('keeps the newest hosts when over the cap', () => {
    const hosts = Object.fromEntries(Array.from({ length: MAX_LEARNED_HOSTS + 5 }, (_, i) => [`h${i}.test`, now - i]));
    const pruned = pruneLearned(hosts, now);
    expect(Object.keys(pruned)).toHaveLength(MAX_LEARNED_HOSTS);
    expect(pruned).toHaveProperty('h0.test');
    expect(pruned).not.toHaveProperty(`h${MAX_LEARNED_HOSTS + 4}.test`);
  });
});

describe('isAdultPageMessage', () => {
  it.each([
    [{ type: 'adult-page', learn: true }, true],
    [{ type: 'other' }, false],
    [null, false],
    ['adult-page', false],
  ])('%j → %s', (message, expected) => {
    expect(isAdultPageMessage(message)).toBe(expected);
  });
});

describe('isProtectedHost', () => {
  it.each([
    ['www.google.com', true],
    ['google.co.uk', true],
    ['yandex.ru', true],
    ['ya.ru', true],
    ['search.brave.com', true],
    ['reddit.com', true],
    ['old.reddit.com', true],
    ['kinopoisk.ru', true],
    ['fresh-tube.test', false],
    ['notreddit.com', false],
    ['googleporn.test', false],
  ])('%s → %s', (host, expected) => {
    expect(isProtectedHost(host)).toBe(expected);
  });
});
