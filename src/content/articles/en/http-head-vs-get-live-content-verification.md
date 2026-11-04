---
title: "HEAD returned 200. Why a live release still needs GET"
description: "Use HEAD for response metadata and GET for delivery evidence. A practical release checklist for redirects, article bodies, assets, and cache observations."
date: 2026-11-04
tags: ["Web development", "Technical SEO", "Release verification"]
draft: false
sources:
  - title: "RFC 9110: HEAD"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#name-head"
  - title: "MDN: HEAD request method"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/HEAD"
---
## Start with the question you want the request to answer

A release dashboard shows a successful deployment. A command-line check with curl -I also returns 200. Both are useful. Neither check has downloaded the article a reader is supposed to see. Treat HEAD as a quick probe and reserve a separate GET for the part of release verification that depends on the content.

![A metadata card and a larger response document beside a server](../../../assets/articles/http-head-vs-get-live-content-verification/en-hero.webp)

HTTP defines HEAD in relation to GET, without the response content. A server should generally send the same headers it would send for GET, although the specification permits it to omit fields that would only be known after generating the content. Look at the response status, declared media type, cache directives, or a redirect target. Record the request method so someone reading the results will know that no document body was available to inspect.

## Preserve the first response as well as the final URL

Send an ordinary GET using the public URL and a reader's access conditions. Check whether it redirects before you examine the body. A browser might silently take an English article request to the Chinese home page, where the final response is still 200. On the other hand, a redirect from a bare path to the same article with a trailing slash may be the intended result. Compare the whole trip to the site's routing rules and identify the page at the end of it.

## Choose a marker that belongs to this release

Check a sentence unique to the new version in the main content area. The article title could also appear in a navigation menu, a related link, or a metadata tag, so a text match anywhere in the response can give you false confidence. For pages expected to render on the server, look for the passage in the HTML. For a client-rendered article, examine the rendered page as a separate check. Write down which surface you verified so the result is reproducible.

## Verify the asset as an independent resource

Follow the actual image URL referenced by the article. The server may respond successfully with an HTML fallback where an image is expected. The extension is another clue, but the decoder is what tells you whether a usable image came back. Inspect the media type and confirm the fetched image is the version you shipped. A lightweight HEAD probe can help triage a long list of resources before you fetch the few that matter to the release.

## Keep comparisons fair when cache enters the picture

Method, hostname, redirects, credentials, language, and conditional headers can change what you observe. Record them before comparing responses. If a conditional request returns 304, identify which stored representation is being reused. If two observations differ, avoid labeling the CDN as the cause based on a single response header. Compare the deployment commit and the actual body served at the relevant URL. Keep the observations scoped to the paths and conditions you checked.

## Include one negative control when it fits the site

Try a path you know was never created. If that route and the real article both yield the same success status, you have a useful clue about fallback routing. The important distinction is visible when you inspect the GET bodies. A valid article should contain the expected material and a missing route should behave the way the site intends. Make that comparison in each published language when the paths have different routing behavior.

## Leave the next person a release record they can use

A useful note might say that HEAD returned 200, the anonymous GET resolved to the expected English path, the HTML contained the new paragraph, and the hero image decoded. If you could only check headers on the other language version, label that check as incomplete. Keep search indexing and release verification as separate observations. The result should make it clear which request to repeat and which evidence to examine when the page changes again.

HEAD is a fast way to understand how the server describes a resource. When the deliverable is the resource itself, fetch it, identify it, and save enough detail for another person to repeat the check.

Related reading: [no-cache does not mean no storage: tracing stale browser and CDN responses](https://lijiabao.dev/en/articles/cache-control-no-cache-browser-cdn-revalidation/); [A 200 response does not prove an article was published](https://lijiabao.dev/en/articles/http-success-article-verification/)
