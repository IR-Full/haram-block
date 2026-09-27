import { describe, expect, it } from 'vitest';
import { releaseVersion } from '../../tools/release/version.ts';

/** Chrome's ordering: numeric, part by part, missing parts count as 0. */
function compareChromeVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

describe('releaseVersion', () => {
  const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

  it('uses the package version for code releases', () => {
    expect(releaseVersion('0.1.0', false, day('2026-10-01'))).toBe('0.1.0');
  });

  it('appends days since the epoch for list refreshes', () => {
    expect(releaseVersion('0.1.0', true, day('2026-01-02'))).toBe('0.1.0.1');
    expect(releaseVersion('0.1.0', true, day('2026-09-28'))).toBe('0.1.0.270');
  });

  it('orders refreshes after their release and before the next one', () => {
    const sequence = [
      releaseVersion('0.1.0', false, day('2026-09-28')),
      releaseVersion('0.1.0', true, day('2026-10-05')),
      releaseVersion('0.1.0', true, day('2026-10-12')),
      releaseVersion('0.1.1', false, day('2026-10-13')),
      releaseVersion('0.1.1', true, day('2026-10-19')),
    ];
    for (let i = 1; i < sequence.length; i++) {
      expect(compareChromeVersions(sequence[i]!, sequence[i - 1]!)).toBeGreaterThan(0);
    }
  });

  it('rejects versions Chrome cannot use as a base', () => {
    expect(() => releaseVersion('0.1.0-beta.1', false, day('2026-10-01'))).toThrow();
    expect(() => releaseVersion('0.1', true, day('2026-10-01'))).toThrow();
  });
});
