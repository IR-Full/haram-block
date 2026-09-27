/**
 * Subset of chrome.declarativeNetRequest types used by the build, kept local so tools don't
 * depend on browser typings. Field names match the manifest ruleset JSON format exactly.
 */
export type ResourceType =
  | 'main_frame'
  | 'sub_frame'
  | 'stylesheet'
  | 'script'
  | 'image'
  | 'font'
  | 'object'
  | 'xmlhttprequest'
  | 'ping'
  | 'media'
  | 'websocket'
  | 'other';

export interface DnrCondition {
  requestDomains?: string[];
  /** RE2 syntax: no lookarounds or backreferences. Chrome caps each ruleset at 1000 regex rules. */
  regexFilter?: string;
  resourceTypes?: ResourceType[];
  excludedResourceTypes?: ResourceType[];
}

export interface QueryParam {
  key: string;
  value: string;
}

export type DnrAction =
  | { type: 'block' }
  | { type: 'redirect'; redirect: { extensionPath: string } }
  | { type: 'redirect'; redirect: { transform: { queryTransform: { addOrReplaceParams: QueryParam[] } } } }
  | { type: 'modifyHeaders'; requestHeaders: { header: string; operation: 'set'; value: string }[] };

export interface DnrRule {
  id: number;
  priority: number;
  action: DnrAction;
  condition: DnrCondition;
}
