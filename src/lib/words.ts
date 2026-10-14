// src/lib/words.ts — a zh-Hant post title as runs of text and whole words.
//
// A browser may break a line between any two Han characters, so a large title can split a word across lines
// (「擋訓／練」, 「留搜／尋」). views/Post.astro and views/PostIndex.astro wrap each word of two or more Han characters
// (Intl.Segmenter, as scripts/og.mjs does for share cards) in a white-space: nowrap span. Spaces and punctuation stay
// in the plain runs between those spans: a space inside a nowrap box is no longer a place to break (CSS Text 3), so
// gluing it to a word could weld 「AI 爬蟲 robots.txt」 into one unbreakable piece. CSS line breaking already keeps
// 「、」「：」 off the start of a line. Each span carries data-md-glue, so the page's Markdown version
// (scripts/lib/markdown.mjs) reads the title as one run of text. Without Intl.Segmenter the title stays one run.

export type TitlePart = { text: string; word: boolean };

const HAN = /\p{Script=Han}/u;

export function titleParts(text: string, locale = 'zh-Hant'): TitlePart[] {
  if (typeof Intl.Segmenter !== 'function') return [{ text, word: false }];
  const parts: TitlePart[] = [];
  for (const { segment, isWordLike } of new Intl.Segmenter(locale, { granularity: 'word' }).segment(text)) {
    const word = Boolean(isWordLike) && HAN.test(segment) && [...segment].length > 1;
    const last = parts.at(-1);
    if (!word && last && !last.word) last.text += segment;
    else parts.push({ text: segment, word });
  }
  return parts;
}
