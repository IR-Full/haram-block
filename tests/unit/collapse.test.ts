import { describe, expect, it } from 'vitest';
import { collapseSubdomains, isCovered, subtractAllowlist } from '../../tools/build-lists/collapse.ts';

describe('collapseSubdomains', () => {
  it('drops entries covered by a listed parent and sorts the rest', () => {
    expect(collapseSubdomains(['b.example', 'x.a.example', 'a.example', 'y.x.a.example', 'nota.example'])).toEqual([
      'a.example',
      'b.example',
      'nota.example',
    ]);
  });

  it('does not treat a shared suffix as a parent', () => {
    expect(collapseSubdomains(['ample.com', 'example.com'])).toEqual(['ample.com', 'example.com']);
  });
});

describe('subtractAllowlist', () => {
  it('removes the allowed host and its parents but keeps its subdomains', () => {
    const set = new Set(['tumblr.com', 'nsfw.tumblr.com', 'm.site.example', 'site.example', 'other.example']);
    const removed = subtractAllowlist(set, ['tumblr.com', 'm.site.example']);
    expect(removed).toEqual(['m.site.example', 'site.example', 'tumblr.com']);
    expect([...set].sort()).toEqual(['nsfw.tumblr.com', 'other.example']);
  });
});

describe('isCovered', () => {
  const set = new Set(['a.example']);
  it.each([
    ['a.example', true],
    ['deep.sub.a.example', true],
    ['ba.example', false],
    ['example', false],
  ])('%s → %s', (host, expected) => {
    expect(isCovered(set, host)).toBe(expected);
  });
});
