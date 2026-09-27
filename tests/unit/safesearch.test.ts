import { describe, expect, it } from 'vitest';
import { isCovered } from '../../tools/build-lists/collapse.ts';
import {
  buildSafeSearchRules,
  SAFE_SEARCH_ENGINES,
  type SafeSearchEngine,
} from '../../tools/build-lists/safesearch.ts';

function matches(engine: SafeSearchEngine, url: string): boolean {
  if ('regexFilter' in engine.match) return new RegExp(engine.match.regexFilter).test(url);
  return isCovered(new Set(engine.match.requestDomains), new URL(url).hostname);
}

describe.each(SAFE_SEARCH_ENGINES.map((e) => [e.id, e] as const))('%s', (_id, engine) => {
  it.each(engine.examples.match)('enforces on %s', (url) => {
    expect(matches(engine, url)).toBe(true);
  });

  it.each(engine.examples.skip)('leaves %s alone', (url) => {
    expect(matches(engine, url)).toBe(false);
  });

  if ('regexFilter' in engine.match) {
    const { regexFilter } = engine.match;
    it('uses an anchored, RE2-compatible pattern', () => {
      expect(regexFilter.startsWith('^https?://')).toBe(true);
      // Chrome compiles regexFilter with RE2, which rejects lookarounds and backreferences.
      expect(regexFilter).not.toMatch(/\(\?[=!<]|\[1-9]/);
    });
  }
});

describe('buildSafeSearchRules', () => {
  const rules = buildSafeSearchRules();

  it('emits one rule per engine with unique ids', () => {
    expect(rules).toHaveLength(SAFE_SEARCH_ENGINES.length);
    expect(new Set(rules.map((r) => r.id)).size).toBe(rules.length);
  });

  it('maps parameter engines to query transforms and header engines to modifyHeaders', () => {
    const google = rules[SAFE_SEARCH_ENGINES.findIndex((e) => e.id === 'google')];
    expect(google?.action).toEqual({
      type: 'redirect',
      redirect: { transform: { queryTransform: { addOrReplaceParams: [{ key: 'safe', value: 'active' }] } } },
    });
    const youtube = rules[SAFE_SEARCH_ENGINES.findIndex((e) => e.id === 'youtube')];
    expect(youtube?.action).toEqual({
      type: 'modifyHeaders',
      requestHeaders: [{ header: 'YouTube-Restrict', operation: 'set', value: 'Strict' }],
    });
  });
});
