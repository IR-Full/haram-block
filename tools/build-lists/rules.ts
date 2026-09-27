import type { DnrRule, ResourceType } from './dnr.ts';

export interface RuleOptions {
  /** Domains per rule. One rule holds many domains, so ~700k domains fit in a few hundred rules. */
  chunkSize: number;
  blockedPagePath: string;
}

const DOCUMENT_TYPES: ResourceType[] = ['main_frame', 'sub_frame'];

/**
 * Each chunk becomes two rules: documents are redirected to the extension's block page, while
 * sub-resources (images, video, scripts from adult CDNs embedded elsewhere) are dropped outright.
 * Both are matched natively by the browser's network stack; no extension JS runs per request.
 */
export function buildRules(domains: readonly string[], { chunkSize, blockedPagePath }: RuleOptions): DnrRule[] {
  const rules: DnrRule[] = [];
  let id = 1;
  for (let i = 0; i < domains.length; i += chunkSize) {
    const requestDomains = domains.slice(i, i + chunkSize);
    rules.push(
      {
        id: id++,
        priority: 1,
        action: { type: 'redirect', redirect: { extensionPath: blockedPagePath } },
        condition: { requestDomains, resourceTypes: DOCUMENT_TYPES },
      },
      {
        id: id++,
        priority: 1,
        action: { type: 'block' },
        condition: { requestDomains, excludedResourceTypes: DOCUMENT_TYPES },
      },
    );
  }
  return rules;
}
