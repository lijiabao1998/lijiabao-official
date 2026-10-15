---
title: Sitemap lastmod should not become today on every build
description: Separate meaningful page changes from deployment time, choose a trustworthy date source, and verify both changed and unchanged URLs in the built and live sitemap.
date: 2026-10-16
tags: [Technical SEO, sitemap, lastmod, publishing]
draft: false
sources:
  - title: Google Search Central — Build and submit a sitemap
    url: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
  - title: Sitemaps.org — XML protocol
    url: https://www.sitemaps.org/protocol.html
  - title: Astro — Content collections
    url: https://docs.astro.build/en/guides/content-collections/
---

Publishing one new article can rebuild an entire static website. If every old URL then receives today's lastmod value, the sitemap may be reporting the build clock rather than meaningful page changes. A fresh-looking date is useful only when its meaning is clear. Start by identifying the event the field represents, then verify the source and output separately.

![A changed document separated from stable publication records](../../../assets/articles/sitemap-lastmod-content-updates/en-hero.webp)

## Keep content dates separate from release time

A first publication, an editorial revision, and a deployment are different events. Adding another article or changing shared navigation can regenerate an old page's HTML without revising that article's main content. Keep publication and update fields in the content model; keep release timestamps in the deployment record. One call to the current clock should not silently stand in for all three.

File timestamps need scrutiny too. Copying a checkout, restoring a backup, or running a formatter can change local filesystem metadata. That is not sufficient evidence of a substantive editorial revision. Compare the content record with version history before using a convenient timestamp as the source of truth.

## Describe a significant page update

Google says it uses lastmod when the value is consistently and verifiably accurate. Its guidance associates the field with a significant update to the page: main content, structured data, or links can be relevant; a copyright-year change is not equivalent.

This does not make every keystroke a new publication, and it does not limit meaningful updates to body paragraphs alone. Establish an editorial rule appropriate to the page. A reviewer should be able to explain which change the date describes, rather than pointing only to a successful build that happened that morning.

## Derive the value from structured content

A content collection might provide a required publication date and an optional update date. A generator can use those fields according to a documented rule, instead of substituting the build time. That is an implementation example, not a claim that a particular snippet has been tested on every framework or site.

Astro's content collections provide structured data and schema validation that can support this approach. Check the actual field types, draft filtering, and date handling in the project. Define what happens when an update is missing or predates publication. HTML metadata, feeds, and sitemap generation should not independently invent three different answers for the same editorial event.

## Leave an unsupported optional date out

The sitemap protocol makes lastmod optional and distinguishes a page's modification time from the generation time of the sitemap file. When historical content has no trustworthy update source, omission is preferable to filling every entry with today for visual completeness.

A project may treat a verified publication date as the initial content version, but that assumption needs a real source. Imported sites and backdated articles require additional care. A visible date on a page is not automatically a verified publishing record. Preserve the uncertainty so that a future maintainer understands what is known and what remains unconfirmed.

## Test an unchanged URL as well as a revised one

Checking that the new article appears is only half the validation. Select an old page that was not edited in the release, compare its sitemap entry before and after the build, and confirm that its lastmod remains stable. Then inspect a page with a meaningful revision and connect its value to the actual change.

Check canonical production URLs, draft exclusion, and language editions individually. Updating Chinese text does not prove that the English translation changed on the same date. Save the observed output and source revision. A schema containing an updated field does not by itself establish that the sitemap reads it correctly.

## Read the production file after deployment

Correct local output is not proof that the production domain serves the same sitemap. Fetch the public file after deployment and compare URL membership, dates, and response status. If the result is stale or ambiguous, inspect the release and caching evidence before republishing content.

The date in a sitemap is not Google's crawl date either. Discovery, an accepted submission, an actual fetch, indexation, and search performance require different evidence. Keeping those states separate makes later SEO observations easier to interpret and prevents a release log from claiming work that has not been verified.

## Prefer an update signal that can be explained

A sitemap helps search engines discover and understand URLs; it does not guarantee indexation. Stable dates for unchanged content and traceable dates for genuine revisions provide a clearer maintenance model than refreshing every value on each deployment. They also make a regression easier to locate in the content, generator, or delivery stage.

For a related but separate navigation mechanism, see the site's [llms.txt guide](/en/articles/what-is-llms-txt/). Language relationships are covered in the [bilingual canonical and hreflang article](/en/articles/bilingual-articles-hreflang-canonical/). Neither mechanism replaces accurate modification data in a sitemap.
