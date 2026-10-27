---
title: "Choosing 301, 302, 307, or 308: methods and caching"
description: "Understand how redirect status codes affect request methods, caching and search signals before changing a URL."
date: 2026-10-27
tags: ["Web development", "HTTP", "Technical SEO"]
draft: false
sources:
  - title: "RFC 9110: HTTP Semantics"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4"
  - title: "RFC 9111: HTTP Caching"
    url: "https://www.rfc-editor.org/rfc/rfc9111.html"
  - title: "Google Search Central: Redirects and Google Search"
    url: "https://developers.google.com/search/docs/crawling-indexing/301-redirects"
---
A redirect can send a visitor to a new URL, but choosing the status code requires more than asking whether the destination works. A POST request, a browser cache and a search crawler each respond to different parts of the HTTP message. This guide separates redirect duration, request method, caching and search signals so a migration can be tested before it reaches production.

![A laptop and abstract objects representing redirect routing](../../../assets/articles/http-redirect-status-method-and-cache/en-hero.webp)

## Start with duration

A 301 or 308 indicates that the resource has a new permanent location. A 302 or 307 indicates a temporary change. For a confirmed article URL migration, a server-side permanent redirect is often appropriate; for a short-lived experiment, a temporary redirect may fit the actual intent. [Google Search Central](https://developers.google.com/search/docs/crawling-indexing/301-redirects) describes a permanent redirect as a signal in favour of the target URL becoming canonical. A temporary redirect does not provide the same signal, although other canonicalization signals can still affect the result.

## Understand the POST compatibility caveat

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4) allows a user agent to change POST to GET when automatically following 301 or 302, due to historical behaviour. That does not mean every client will do so. Test the clients that actually use the endpoint instead of treating one browser as proof of all behaviour. The distinction matters when a redirect occurs in a form, an API write or another operation that carries a request body.

## 307 and 308 preserve the request method

For automatic redirection, 307 and 308 require the user agent not to change the request method. A POST is therefore not meant to turn into a GET merely because it follows one of these responses. The target server can still reject the request, and older clients may behave differently. If the desired flow is to submit a form and then retrieve a separate result page, evaluate 303 See Other for that purpose rather than choosing a code only by its duration.

## Caching is a separate decision

The HTTP specification describes 301 and 308 as heuristically cacheable. Whether a response is stored and for how long also depends on response headers, request conditions and the cache implementation. A 302 or 307 can also be cached when applicable requirements and explicit caching information permit it. Do not assume that temporary means never cached, or that editing an origin rule immediately invalidates every browser and CDN copy. Set an intentional Cache-Control policy and verify the actual response at each layer.

## Inspect every hop

Check that the Location header points to the intended scheme, host, path and query string. Follow the chain from the original URL to the final response and look for loops. Rules can be applied in an application, a reverse proxy or a CDN; one layer may redirect before another receives the request. A final page that loads is useful evidence, but it does not explain which intermediate status codes were returned or whether the request method changed.

## Test safely before and after release

Use non-sensitive test data in a staging environment. Verify GET and any supported POST flow, including the method and body received at the destination. For cross-origin redirects, also review authentication, cookies, CORS and the handling of sensitive data; client behaviour and security controls vary. After release, inspect response headers and the final resource with safe requests rather than repeatedly submitting real transactions. Account for stale cache entries when comparing the old and new rule.

## Separate HTTP success from search indexing

A valid redirect response does not mean Google has already updated its index. Permanent redirects can contribute a canonicalization signal, while indexing and search presentation depend on additional information. Update relevant internal links and sitemaps to the intended URL, then monitor Search Console. A successful HTTP response or an indexing request is not a promise of ranking.

Choose the code for the intended lifetime and method semantics, then verify caching and search behaviour separately. The useful evidence is the complete request path, not just the final page that appears.

Further reading: [Article moves: redirects and canonical tags](https://lijiabao.dev/en/articles/article-url-move-redirect-versus-canonical/); [Tracing browser and CDN revalidation](https://lijiabao.dev/en/articles/cache-control-no-cache-browser-cdn-revalidation/).
