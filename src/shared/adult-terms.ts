/**
 * Weighted vocabulary for the page classifier. Weights: 3 = explicit on its own, 2 = strong hint,
 * 1 = common word that only matters next to others. Each term counts once per page, so a news
 * article repeating one word stays far below the threshold while a porn site's stuffed title,
 * description and keywords add up quickly.
 *
 * Entries are lowercase, NFKC-normalized. Multi-word entries are matched as whole-token phrases.
 * Words deliberately left out because they are routine in news, health and reference pages:
 * "pornography", "porn addiction", "sexual", "sex education", "adult content".
 */
export const TOKEN_TERMS: Readonly<Record<string, number>> = {
  // English. Site brand names are only strong hints: news about them is common.
  porn: 3,
  porno: 3,
  pornhub: 2,
  xvideos: 2,
  xnxx: 2,
  xhamster: 2,
  pornstar: 3,
  pornstars: 3,
  hentai: 3,
  milf: 3,
  milfs: 3,
  blowjob: 3,
  blowjobs: 3,
  cumshot: 3,
  creampie: 3,
  bukkake: 3,
  gangbang: 3,
  handjob: 3,
  deepthroat: 3,
  camgirl: 3,
  camgirls: 3,
  xxx: 2,
  nsfw: 2,
  onlyfans: 2,
  threesome: 2,
  escorts: 2,
  sex: 1,
  sexy: 1,
  nude: 1,
  nudes: 1,
  naked: 1,
  erotic: 1,
  erotica: 1,
  adult: 1,
  '18+': 1,
  // Russian
  порно: 3,
  порнуха: 3,
  порнушка: 3,
  минет: 3,
  хентай: 3,
  ебля: 3,
  трах: 3,
  шлюхи: 3,
  сиськи: 2,
  секс: 1,
  эротика: 1,
  голые: 1,
  интим: 1,
  // Arabic
  سكس: 3,
  نيك: 3,
  بورن: 3,
  سكسي: 2,
  // Spanish / Portuguese / Turkish
  putas: 3,
  sexo: 1,
  // Indonesian / Malay, Hindi (Latin script)
  bokep: 3,
  ngentot: 3,
  chudai: 3,
};

export const PHRASE_TERMS: Readonly<Record<string, number>> = {
  'porn video': 3,
  'porn videos': 3,
  'porn tube': 3,
  'hd porn': 3,
  'free porn': 3,
  'xxx video': 3,
  'xxx videos': 3,
  'sex video': 3,
  'sex videos': 3,
  'sex tube': 3,
  'sex cam': 3,
  'sex cams': 3,
  'live sex': 3,
  'free sex': 3,
  'adult video': 3,
  'adult videos': 3,
  'nude girls': 3,
  'naked girls': 3,
  'leaked nudes': 3,
  'порно видео': 3,
  'секс видео': 3,
  'домашнее порно': 3,
  'голые девушки': 3,
  'эротическое видео': 3,
  'افلام سكس': 3,
  'فيديو سكس': 3,
  'videos porno': 3,
  'video mesum': 3,
  'desi sex': 3,
  'phim sex': 3,
};

/** Scripts without spaces between words (CJK) are matched as substrings of the text. */
export const SUBSTRING_TERMS: Readonly<Record<string, number>> = {
  色情: 3,
  成人视频: 3,
  黄色网站: 3,
  無修正: 3,
  av女優: 3,
  エロ動画: 3,
  エロ: 2,
  アダルト: 2,
};

/** Matched as substrings of the hostname: adult sites love compound names like freeporn-tube. */
export const HOSTNAME_STEMS: Readonly<Record<string, number>> = {
  porn: 3,
  xxx: 3,
  hentai: 3,
  xvideo: 3,
  xnxx: 3,
  xhamster: 3,
  bokep: 3,
  sexcam: 3,
};
