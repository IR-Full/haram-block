/** Written by tools/build-lists alongside the ruleset. */
export interface ListMeta {
  generatedAt: string;
  domainCount: number;
  sources: { id: string; name: string; homepage: string; license: string; entries: number }[];
  /** Display names of search engines whose strict mode is enforced. */
  safeSearch: string[];
}

export async function loadListMeta(): Promise<ListMeta> {
  const res = await fetch(browser.runtime.getURL('/rules/meta.json'));
  return (await res.json()) as ListMeta;
}
