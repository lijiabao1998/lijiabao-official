---
title: A 200 response does not prove an article was published
description: Verify the exact URL, main content, rendered page and production version before treating an HTTP 200 response as evidence of a successful article release.
date: 2026-10-17
tags: [Technical SEO, HTTP, soft 404, Release verification]
draft: false
sources:
  - title: Google Search Central — HTTP status codes and network errors
    url: https://developers.google.com/crawling/docs/troubleshooting/http-status-codes
  - title: Google Search Central — Troubleshoot crawling errors
    url: https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors
  - title: Google Search Central — Fix search-related JavaScript problems
    url: https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript
---

An article URL responds with HTTP 200 after a release. Is publication complete? The answer still depends on the content. That response might contain the home page, a “not found” message, or an application shell without the article. A useful release check connects the exact address, the main content and the production version instead of treating one status code as proof of all three.

![Conceptual illustration of checking a web response separately from article content](../../../assets/articles/http-success-article-verification/en-hero.webp)

## A successful response has a limited meaning

HTTP status codes describe how a request was handled. A 2xx response indicates successful handling, but does not certify the topic, completeness or search eligibility of the returned document. Google also distinguishes receiving a successful response from deciding whether to index its content. A 200 response does not guarantee indexation.

Consider a server that sends its home page for every unknown article path. The request succeeds at the transport level, while the visitor never receives the intended article. Verification therefore needs a second question after checking availability: does this response contain the document that was actually released?

## A soft 404 concerns the mismatch between content and status

Google discusses soft 404 errors when a page returns a success status even though its content indicates that the resource is missing or an error occurred. Empty main content and error messages are examples that may contribute to this classification. It is not a label that a maintainer can assign to every short article; the actual search assessment should be checked in the relevant inspection report.

The repair depends on the intended resource. A genuinely removed page without a suitable replacement needs an appropriate response. An article that should exist needs its routing or content delivery repaired. Redirecting every failed article to the home page merely to clear a report can preserve the original problem for visitors.

## Check the exact address and the main article

Use the full public URL, including its language prefix and established trailing-slash convention. Record redirects and the final destination. Then compare the main heading, the beginning of the body and a distinctive passage with the approved article. Finding the site name or an excerpt in a listing is insufficient.

A simple title search can also produce a false positive. A broken article view may still show the same title in a sidebar or related-content card. Inspect the main content region, confirm that its paragraphs are readable, and check that its image loads. The evidence should correspond to what a visitor can read, rather than to incidental text elsewhere on the page.

## Separate the original response from the JavaScript result

Some sites send an HTML application shell and load the article through JavaScript. This does not establish that search engines are unable to process the site. However, a failed data request or script can leave a successful HTTP response with no article. The verification record needs to identify which layer was actually checked.

Inspect the original HTML and then open the page in a browser. If the publishing architecture requires a pre-rendered article, verify that the source contains the required body. If the page uses client-side rendering, retain evidence of the completed visible result as well. Choose any technical repair from the architecture and search evidence; the mere presence of JavaScript is not a reason to rebuild an entire site.

## Confirm which release the public domain serves

Pushing a commit, completing a build and serving that commit from the public domain are separate events. Deployment records can identify the source revision. The public page provides evidence of what readers currently receive. If they disagree, investigate the environment, cache or domain mapping before attempting another publication.

Report partial results accurately. “Build passed; production body not yet verified” is more useful than declaring the entire release successful. A timeout should remain an unconfirmed check with a next step. It does not prove that the article is absent and does not justify creating a duplicate post.

## Test a valid article and a genuinely missing path

A bounded test can compare a known valid article with a deliberately nonexistent path. The first should return its own content. The second should produce the intended missing-resource behavior. If both resolve to the same successful home page, the difference between valid and invalid routes has not been demonstrated. A test path does not need to enter navigation or a sitemap.

For bilingual publishing, open both language versions independently. An English address can appear available while actually resolving to the Chinese home page. The article on [canonical and hreflang for bilingual articles](https://lijiabao.dev/en/articles/bilingual-articles-hreflang-canonical/) covers language relationships separately. Correct annotations still cannot replace evidence that the requested article exists.

## Track search processing as a separate outcome

A verified public page proves that readers can retrieve the released article. Requesting indexing, receiving confirmation that a request was accepted, and observing an indexed URL are different outcomes. When Search Console reports a soft 404, investigate the exact URL, inspection time and available details. Do not attribute every weak traffic result to that classification without evidence.

A sitemap supports discovery, but cannot guarantee indexing or certify the contents of a URL. For the date signal specifically, see [sitemap lastmod and real content updates](https://lijiabao.dev/en/articles/sitemap-lastmod-content-updates/). Keeping release, public-content and search-processing evidence separate makes the next failure easier to locate, without repeatedly publishing an article that may already be online.
