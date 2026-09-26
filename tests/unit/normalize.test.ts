import { describe, expect, it } from 'vitest';
import { normalizeHostname } from '../../tools/build-lists/normalize.ts';

describe('normalizeHostname', () => {
  it.each([
    ['Example.COM.', 'example.com'],
    ['  sub.example.com ', 'sub.example.com'],
    ['пример.рф', 'xn--e1afmkfd.xn--p1ai'],
    ['under_score.example.com', 'under_score.example.com'],
    ['nsfw-blog.tumblr.com', 'nsfw-blog.tumblr.com'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeHostname(input)).toBe(expected);
  });

  it.each([
    ['', 'empty'],
    ['1.2.3.4', 'IPv4'],
    ['com', 'bare TLD'],
    ['blogspot.com', 'private public suffix'],
    ['github.io', 'private public suffix'],
    ['example.notarealtld', 'unknown TLD'],
    ['bad..example.com', 'empty label'],
    ['-dash.example.com', 'label starting with a hyphen'],
    ['sp ace.example.com', 'whitespace'],
    [`${'a'.repeat(64)}.example.com`, 'label over 63 chars'],
  ])('rejects %s (%s)', (input) => {
    expect(normalizeHostname(input)).toBeNull();
  });
});
