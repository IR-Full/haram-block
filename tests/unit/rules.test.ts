import { describe, expect, it } from 'vitest';
import { buildRules } from '../../tools/build-lists/rules.ts';

describe('buildRules', () => {
  const domains = ['a.example', 'b.example', 'c.example'];
  const rules = buildRules(domains, 2);

  it('emits a redirect and a block rule per chunk with unique sequential ids', () => {
    expect(rules.map((r) => [r.id, r.action.type])).toEqual([
      [1, 'redirect'],
      [2, 'block'],
      [3, 'redirect'],
      [4, 'block'],
    ]);
  });

  it('redirects documents and blocks every other resource type for the same domains', () => {
    const [redirect, block] = rules;
    expect(redirect).toMatchObject({
      action: { redirect: { extensionPath: '/blocked.html' } },
      condition: { requestDomains: ['a.example', 'b.example'], resourceTypes: ['main_frame', 'sub_frame'] },
    });
    expect(block?.condition).toEqual({
      requestDomains: ['a.example', 'b.example'],
      excludedResourceTypes: ['main_frame', 'sub_frame'],
    });
  });

  it('covers every domain exactly once per action', () => {
    const redirected = rules
      .filter((r) => r.action.type === 'redirect')
      .flatMap((r) => r.condition.requestDomains ?? []);
    expect(redirected).toEqual(domains);
  });
});
