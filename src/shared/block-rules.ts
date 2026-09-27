/**
 * Shared by the build (static adult ruleset) and the background worker (learned domains), so both
 * block the same way. Dependency-free on purpose: tools/ imports it under plain Node.
 */
export const BLOCKED_PAGE_PATH = '/blocked.html';

const DOCUMENT_TYPES: ('main_frame' | 'sub_frame')[] = ['main_frame', 'sub_frame'];

/**
 * Two rules for one domain list: documents are redirected to the block page, while sub-resources
 * (images, video, scripts from adult CDNs embedded elsewhere) are dropped outright. Both are matched
 * natively by the browser's network stack; no extension JS runs per request.
 */
export function blockRulePair(requestDomains: string[], redirectId: number, blockId: number) {
  return [
    {
      id: redirectId,
      priority: 1,
      action: { type: 'redirect' as const, redirect: { extensionPath: BLOCKED_PAGE_PATH } },
      condition: { requestDomains, resourceTypes: DOCUMENT_TYPES },
    },
    {
      id: blockId,
      priority: 1,
      action: { type: 'block' as const },
      condition: { requestDomains, excludedResourceTypes: DOCUMENT_TYPES },
    },
  ];
}
