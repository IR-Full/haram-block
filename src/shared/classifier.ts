import { HOSTNAME_STEMS, PHRASE_TERMS, SUBSTRING_TERMS, TOKEN_TERMS } from './adult-terms';

/** What the content script reads from a page's <head>. */
export interface PageSignals {
  hostname: string;
  title: string;
  description: string;
  keywords: string;
  /** Contents of every <meta name="rating">, joined. */
  rating: string;
}

export type Decision = 'allow' | 'block-page' | 'block-domain';

export interface Verdict {
  decision: Decision;
  score: number;
  /** Matched signals, for tests and debugging. */
  reasons: string[];
}

/** Score at which this page is hidden. */
export const PAGE_THRESHOLD = 6;
/**
 * Score at which the whole domain is learned and blocked at the network level. Higher than the page
 * threshold: a false positive here costs a whole site (for 30 days), so it needs overwhelming evidence.
 */
export const DOMAIN_THRESHOLD = 10;

/** Restricted To Adults label; adult sites self-apply it so filters can find them. */
const RTA_LABEL = 'rta-5042-1996-1400-1577-rta';

function normalize(text: string): string {
  return text.normalize('NFKC').toLowerCase();
}

function tokenize(text: string): string[] {
  return text.split(/[^\p{L}\p{N}+]+/u).filter(Boolean);
}

export function classifyPage(signals: PageSignals): Verdict {
  const rating = normalize(signals.rating);
  if (rating.includes(RTA_LABEL) || /(^|[^a-z])adult([^a-z]|$)/.test(rating)) {
    return { decision: 'block-domain', score: Infinity, reasons: [`rating:${rating.trim()}`] };
  }

  const text = normalize(`${signals.title} ${signals.description} ${signals.keywords}`);
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);
  const phraseText = ` ${tokens.join(' ')} `;
  const hostname = normalize(signals.hostname);

  let score = 0;
  const reasons: string[] = [];
  const add = (reason: string, weight: number) => {
    score += weight;
    reasons.push(reason);
  };

  for (const [term, weight] of Object.entries(TOKEN_TERMS)) {
    if (tokenSet.has(term)) add(term, weight);
  }
  for (const [phrase, weight] of Object.entries(PHRASE_TERMS)) {
    if (phraseText.includes(` ${phrase} `)) add(phrase, weight);
  }
  for (const [term, weight] of Object.entries(SUBSTRING_TERMS)) {
    if (text.includes(term)) add(term, weight);
  }
  for (const [stem, weight] of Object.entries(HOSTNAME_STEMS)) {
    if (hostname.includes(stem)) add(`host:${stem}`, weight);
  }

  const decision: Decision =
    score >= DOMAIN_THRESHOLD ? 'block-domain' : score >= PAGE_THRESHOLD ? 'block-page' : 'allow';
  return { decision, score, reasons };
}
