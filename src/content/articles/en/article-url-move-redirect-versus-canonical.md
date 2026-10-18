---
title: "Moving an article URL: redirects and canonical tags have different jobs"
description: "A permanent redirect moves requests; a canonical tag identifies a preferred version. Verify the destination, internal links and sitemap before calling an article URL move complete."
date: 2026-10-19
tags: [Technical SEO, HTTP, Redirects, URL management]
draft: false
sources:
  - title: Google Search Central — Redirects and Google Search
    url: https://developers.google.com/search/docs/crawling-indexing/301-redirects
  - title: Google Search Central — Canonical URLs
    url: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
  - title: Google Search Central — Site moves with URL changes
    url: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes
  - title: MDN — 301 Moved Permanently
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/301
  - title: RFC 9110 — HTTP Semantics
    url: https://www.rfc-editor.org/rfc/rfc9110.html
  - title: Google Search Central — Build a sitemap
    url: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
---

An article has a new permanent address. Does adding a canonical tag to the new page finish the move? Readers may still arrive through an old bookmark, newsletter or external link. Those requests need a working route to the article, while search systems need consistent signals about its preferred address. This guide uses hypothetical paths; it does not describe a migration currently being performed on this site or claim that any search results have already changed.

![A document moving from an old location to a new destination](../../../assets/articles/article-url-move-redirect-versus-canonical/en-hero.webp)

## Decide whether the article is moving or both versions remain useful

A permanent change of address is different from keeping two similar pages available for separate user needs. In the first case, someone following the old address should normally reach the corresponding article at its new location. In the second, retaining access while specifying a preferred version may be part of the design. Establish that relationship before choosing an implementation.

Create a precise old-to-new mapping. A homepage is not a useful replacement merely because it responds successfully. Google's migration guidance warns against sending many unrelated old URLs to one irrelevant destination. If content has disappeared without an appropriate replacement, handle its absence honestly instead of inventing a connection.

## A redirect changes the request path; a canonical tag does not

A server-side 301 response with a Location header tells the client that the resource has moved permanently. Browsers normally request the destination next. Google also treats suitable permanent redirects as a strong canonicalization signal. Its documentation includes 308 and other approaches; the correct choice must also respect HTTP behavior and the application's requirements. The examples here concern ordinary article GET requests, not a rule to copy blindly onto forms or APIs.

A canonical tag identifies a preferred representative for duplicate or very similar content. It does not automatically navigate the reader elsewhere. An old URL that returns a 200 page containing a canonical reference is therefore a different arrangement from a permanent HTTP redirect. Verification should reflect the behavior actually intended.

## Make the destination usable before connecting the old address

Publish and inspect the destination first. Confirm its heading, main paragraphs, images and required links. Its canonical reference should use the intended new address, and temporary staging restrictions such as noindex should not remain accidentally. A successful status alone cannot establish that the correct article is present.

For a hypothetical move from `https://example.com/old-guide` to `https://example.com/current-guide`, inspect the latter as an article before switching the former. This is a planning example, not a reported test. The distinction between a successful response and delivered content is explored in [article publication verification](/en/articles/http-success-article-verification/).

## Align internal links, discovery files and language equivalents

Update links under the site's control to point directly to the intended destination. Readers should not need an avoidable redirect every time they use the site's own navigation. Sitemaps should identify the URLs intended as canonical, consistent with the pages themselves. A single-page path change, a section move and a domain migration may require different additional work.

For translated articles, map each old language version to its appropriate new counterpart and inspect reciprocal language references. Sending every English URL to a Chinese homepage does not preserve that relationship. Include images and downloadable resources if their addresses also change. Moving the HTML does not ensure that embedded content survives, and unnecessary asset renaming adds work without improving the reader's experience.

## Inspect the old URL's first response, then the complete journey

A browser that follows redirects automatically may show only the final page. Record the first response, its destination, any intermediate hops and the final address separately. Then inspect the destination's main content. This reveals loops, wrong-language destinations and chains through outdated addresses that a simple screenshot of the last page would miss.

Prefer a direct path from a known old address to its relevant final destination. Test examples that should match and paths that should remain outside the rule. An overly broad mapping can quietly redirect unrelated articles. Seeing the rule in a configuration file is only source evidence; reading its behavior from the production domain establishes another part of the result.

## Check the deployed layer and account for caching

Redirects may be implemented by the application, hosting platform or CDN. Identify which layer owns the rule and verify the version actually deployed. A local test or successful source push does not prove what a visitor receives from the public hostname. If the response differs, investigate the environment and cache before adding a competing rule somewhere else.

Permanent redirects can also be cached. Prepare accurate mappings and a verification method before release, and retain sufficient operational evidence to diagnose later reports. A working new page today does not mean every external reference has been updated or that the old entry point can immediately be discarded.

## Separate a working redirect from Google's processing

Reaching the correct live article confirms useful navigation. Recrawling, canonical selection and changes to search results are subsequent processes. Inspect the exact URLs and current Search Console evidence rather than treating an indexing request as proof that every signal has transferred. No redirect configuration guarantees unchanged rankings.

Keep the observed response chain, destination-content checks and deployed version together. Use migration tools only where their documented scope applies; a single article path change does not automatically call for a whole-domain procedure. A reliable conclusion describes what was verified and what still depends on later search processing.
