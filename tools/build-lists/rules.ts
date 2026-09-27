import { blockRulePair } from '../../src/shared/block-rules.ts';
import type { DnrRule } from './dnr.ts';

/** Domains per rule pair. One rule holds many domains, so ~700k domains fit in a few hundred rules. */
export function buildRules(domains: readonly string[], chunkSize: number): DnrRule[] {
  const rules: DnrRule[] = [];
  for (let i = 0; i < domains.length; i += chunkSize) {
    const id = rules.length + 1;
    rules.push(...blockRulePair(domains.slice(i, i + chunkSize), id, id + 1));
  }
  return rules;
}
