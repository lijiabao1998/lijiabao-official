// OG cards of the content sections (scripts/og.mjs output, imported so Astro emits them as hashed /_astro/ files):
//   src/assets/og/{zh,en}-{articles,views}.png            the section cards (committed)
//   src/assets/og/posts/<section>-<zh|en>-<slug>.png       one card per published post
// og.mjs needs the fonts of the owner's machine, so a post can ship before its card exists: it then falls back to
// its section card (check-dist warns about the missing card; it never fails the build for it).
import type { ImageMetadata } from 'astro';
import type { Locale } from '@i18n/types';
import type { PostSection } from '@lib/posts';
import { localeTag } from './i18n';

const SECTION_CARDS = import.meta.glob<ImageMetadata>('../../assets/og/*-{articles,views}.png', { eager: true, import: 'default' });
const POST_CARDS = import.meta.glob<ImageMetadata>('../../assets/og/posts/*.png', { eager: true, import: 'default' });

/** File name (without folder) of a post card: `<section>-<zh|en>-<slug>.png`. Same rule as scripts/og.mjs. */
export const postCardName = (section: PostSection, locale: Locale, slug: string): string => `${section}-${localeTag(locale)}-${slug}.png`;

export function sectionCard(section: PostSection, locale: Locale): ImageMetadata {
  const card = SECTION_CARDS[`../../assets/og/${localeTag(locale)}-${section}.png`];
  if (!card) throw new Error(`[og] missing section card ${localeTag(locale)}-${section}.png — run \`npm run og\``);
  return card;
}

/** The post's own card, else its section card. */
export function postCard(section: PostSection, locale: Locale, slug: string): ImageMetadata {
  return POST_CARDS[`../../assets/og/posts/${postCardName(section, locale, slug)}`] ?? sectionCard(section, locale);
}
