export type SourceFormat = 'hosts' | 'domains' | 'wildcard';

export interface Source {
  id: string;
  name: string;
  url: string;
  format: SourceFormat;
  license: string;
  homepage: string;
  /** Sanity floor: a download with fewer entries means the upstream is broken, not that the web got cleaner. */
  minEntries: number;
}

/**
 * Curated for a low false-positive rate. The Block List Project porn list (~950k raw hostnames) is
 * deliberately not included: it has a record of whole-platform false positives. Run
 * `npm run lists:report` before adding any new source.
 */
export const SOURCES: readonly Source[] = [
  {
    id: 'oisd-nsfw',
    name: 'oisd nsfw',
    url: 'https://nsfw.oisd.nl/domainswild',
    format: 'wildcard',
    license: 'GPL-3.0',
    homepage: 'https://oisd.nl',
    minEntries: 200_000,
  },
  {
    id: 'hagezi-nsfw',
    name: "HaGeZi's NSFW",
    url: 'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/nsfw-onlydomains.txt',
    format: 'domains',
    license: 'GPL-3.0',
    homepage: 'https://github.com/hagezi/dns-blocklists',
    minEntries: 30_000,
  },
  {
    id: 'stevenblack-porn',
    name: 'StevenBlack porn-only',
    url: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn-only/hosts',
    format: 'hosts',
    license: 'MIT',
    homepage: 'https://github.com/StevenBlack/hosts',
    minEntries: 30_000,
  },
  {
    id: 'sinfonietta-porn',
    name: 'Sinfonietta pornography-hosts',
    url: 'https://raw.githubusercontent.com/Sinfonietta/hostfiles/master/pornography-hosts',
    format: 'hosts',
    license: 'MIT',
    homepage: 'https://github.com/Sinfonietta/hostfiles',
    minEntries: 20_000,
  },
];
