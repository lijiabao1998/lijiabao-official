---
title: Hreflang and canonical for bilingual articles
description: Give each language page a clear preferred URL, connect genuine translations, and verify the built and live outputs before calling a release complete.
date: 2026-10-15
tags: [Technical SEO, hreflang, canonical, multilingual sites]
draft: false
sources:
  - title: Google Search Central — Tell Google about localized versions
    url: https://developers.google.com/search/docs/specialty/international/localized-versions
  - title: Google Search Central — Canonical URLs
    url: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
  - title: Google Search Central — Managing multilingual sites
    url: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
  - title: Astro — Content collections
    url: https://docs.astro.build/en/guides/content-collections/
---

An English translation and a Traditional Chinese article can share a subject while remaining two distinct published pages. Making both canonical tags point to the Chinese URL confuses two decisions: which URL represents this page, and which pages are its language alternatives. Treat those decisions separately before adding more SEO markup.

![Separate language pages linked as alternate versions](../../../assets/articles/bilingual-articles-hreflang-canonical/en-hero.webp)

## Start with actual translated content

A translated menu around an unchanged article does not create a complete English version. Google identifies a page's language from visible content, so review the heading, summary, and substantive body together. Each version should explain the material for its readers, including sources, dates, and relevant limits.

Keep an unfinished translation as a draft. A language link should not advertise an empty page or present a short summary as the equivalent of a full guide. Editorial readiness comes before the relationship between URLs.

## Canonical identifies the preferred URL

Canonicalization expresses a preference among duplicate or closely similar URLs. It is a signal, not a command that guarantees Google's final choice. A genuinely translated body should not be consolidated into another language merely because the topic matches.

Google's canonical guidance calls for a canonical in the same language when using language annotations, or a suitable substitute when no such canonical exists. For two complete, separately published translations, a common arrangement gives each page its own preferred URL. The English page points to the English path; the Chinese page points to the Chinese path.

## Hreflang connects corresponding versions

Hreflang describes a language or regional relationship. Each corresponding page should identify itself and the other versions, using full URLs. A declaration on only one side leaves the pair incomplete.

Build the relationship from a stable article identity and locale, rather than matching similar titles. A link to an English article index can help readers when no translation exists, but the index is not that article's English alternative. Keep navigation fallbacks separate from translation membership.

## Script and fallback labels mean different things

The `zh-Hant` value identifies Traditional Chinese. Region targeting is a separate choice that should reflect the intended content; a country code alone is not a language. English can use `en` or a more specific value when the content justifies it.

An `x-default` destination provides a fallback for unmatched language settings. It is not an extra translation and cannot complete a missing version. Choose a destination deliberately, then check that the fallback and language URLs actually serve what their labels imply.

## Derive outputs from the same publication data

Astro content collections can support one source of truth for published entries. Find related locales by article identity, apply the same draft filter, and derive page links and sitemap entries consistently. This is an implementation approach, not a claim that an untested site already passes it.

Keep publication dates, canonical URLs, and translation identity separate. A new date in the slug does not solve a relationship error. Inspect the generated output as well as the source records: two entries in a collection are not proof that two complete pages were built.

## Verify the build and the public release

Read both built HTML files. Confirm substantive text, self-referencing canonical URLs, reciprocal language annotations, working internal links, and the appropriate images and alternative text. Finding a title in source is insufficient when the body appears only after JavaScript execution.

After deployment, repeat the checks on the production domain and its sitemap. A source commit, a successful build, and live content are separate pieces of evidence. Matching them establishes the release's scope; none alone establishes Google indexation.

## Let readers choose, then track pages separately

Google advises against automatically redirecting visitors based on a guessed language and recommends links between versions. For an article, a link to the same subject preserves reading context. If that version is absent, offer an honest index fallback rather than an invented article URL.

Measure the two URLs separately when search data becomes available. Chinese impressions do not establish English visibility, and accepted indexing requests do not establish indexation. The site's [llms.txt guide](/en/articles/what-is-llms-txt/) covers another kind of content navigation; it does not replace these language relationships.
