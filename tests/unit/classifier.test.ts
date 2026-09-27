import { describe, expect, it } from 'vitest';
import { classifyPage, type Decision, type PageSignals } from '../../src/shared/classifier.ts';

const page = (p: Partial<PageSignals>): PageSignals => ({
  hostname: 'example.com',
  title: '',
  description: '',
  keywords: '',
  rating: '',
  ...p,
});

const cases: [string, Partial<PageSignals>, Decision][] = [
  // Self-labelled adult sites
  ['RTA label', { rating: 'RTA-5042-1996-1400-1577-RTA' }, 'block-domain'],
  ['rating=adult', { rating: 'adult' }, 'block-domain'],
  ['rating=general', { rating: 'general' }, 'allow'],

  // Typical adult sites that are not in the blocklists yet
  [
    'English tube site',
    {
      hostname: 'newtube.example',
      title: 'Free HD Porn Videos - Best XXX Tube',
      description: 'Watch free porn videos and xxx movies, milf, hentai, amateur sex.',
    },
    'block-domain',
  ],
  ['compound hostname', { hostname: 'freeporn-hub.example', title: 'Free Porn Videos' }, 'block-domain'],
  [
    'Russian tube site',
    { title: 'Порно видео онлайн бесплатно', description: 'Смотреть домашнее порно, секс видео и минет' },
    'block-domain',
  ],
  ['Russian title only', { title: 'Порно видео онлайн бесплатно' }, 'block-page'],
  ['Arabic', { title: 'افلام سكس عربي' }, 'block-page'],
  ['Indonesian', { title: 'Bokep Indo Terbaru', description: 'nonton bokep video mesum' }, 'block-page'],
  ['Japanese', { title: '無修正エロ動画' }, 'block-page'],

  // Mainstream pages that talk about the topic must stay open
  ['Wikipedia article', { hostname: 'en.wikipedia.org', title: 'Pornography - Wikipedia' }, 'allow'],
  [
    'health article',
    {
      title: 'Porn addiction: signs and how to quit',
      description: 'Learn about porn addiction, its effects on relationships, and treatment.',
    },
    'allow',
  ],
  ['news about a ban', { title: 'Роскомнадзор заблокировал Pornhub', description: 'Сайт с порно недоступен' }, 'allow'],
  ['TV series', { title: 'Sex Education (TV series)', description: 'British teen comedy-drama' }, 'allow'],
  ['search results page', { hostname: 'www.google.com', title: 'porno - Поиск в Google' }, 'allow'],
  ['creator economy news', { title: 'OnlyFans creators earned $6bn last year' }, 'allow'],
  ['Essex is not sex', { hostname: 'essex.ac.uk', title: 'University of Essex' }, 'allow'],
  ['adult education', { title: 'Adult education courses', description: 'Evening classes for adults' }, 'allow'],
  ['empty page', {}, 'allow'],
];

describe('classifyPage', () => {
  it.each(cases)('%s → %s', (_name, signals, expected) => {
    const verdict = classifyPage(page(signals));
    expect(verdict.decision, `score ${verdict.score}: ${verdict.reasons.join(', ')}`).toBe(expected);
  });

  it('counts each term once, so repetition does not add up', () => {
    const once = classifyPage(page({ title: 'porn' }));
    const repeated = classifyPage(page({ title: 'porn porn porn', description: 'porn', keywords: 'porn, porn' }));
    expect(repeated.score).toBe(once.score);
  });

  it('matches whole words only', () => {
    expect(classifyPage(page({ title: 'Sextant navigation and Pornichet beach' })).score).toBe(0);
  });

  it('is case- and width-insensitive', () => {
    expect(classifyPage(page({ title: 'ＰＯＲＮ' })).reasons).toContain('porn');
  });
});
