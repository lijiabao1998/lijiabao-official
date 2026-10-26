---
title: "no-cache does not mean no storage: tracing stale browser and CDN responses"
description: "Separate storage, revalidation and cache layers when a deployed page still looks old. Understand ETag, 304 responses and the limits of browser reloads and targeted CDN purges."
date: 2026-10-26
tags: ["Web development", "HTTP", "Deployment verification"]
draft: false
sources:
  - title: "RFC 9111 — HTTP Caching"
    url: "https://www.rfc-editor.org/rfc/rfc9111.html"
  - title: "MDN — HTTP caching"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching"
  - title: "MDN — ETag"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag"
  - title: "MDN — 304 Not Modified"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304"
  - title: "MDN — Request cache"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Request/cache"
  - title: "Cloudflare — Origin Cache Control"
    url: "https://developers.cloudflare.com/cache/concepts/cache-control/"
  - title: "Cloudflare — Purge by single-file"
    url: "https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/"
---

A deployment finishes, yet refreshing an article still shows an old paragraph. Disabling every cache may feel like the fastest answer, but storage and reuse happen at different layers. A response marked no-cache can still be stored. First identify the exact resource, the request conditions and the response being observed. This guide describes an investigation; it does not claim to have changed or tested any reader's production configuration.

![Separate storage layers and a reference check represented by physical objects](../../../assets/articles/cache-control-no-cache-browser-cdn-revalidation/en-hero.webp)

## Identify the exact resource and the expected change

Record the final URL, observation time and a distinctive passage from the new body. Language paths, redirects and trailing slashes can lead to different resources. A new image or a changed listing excerpt does not prove that the article itself has changed.

Check the source and deployed revision first, using the [Git-to-production verification guide](/en/articles/git-commit-cloudflare-production-verification/). If the build never included the paragraph, caching is only an unconfirmed explanation. Keeping that alternative open prevents a deployment investigation from becoming a search for evidence of one predetermined cause.

## no-cache requires validation before reuse

[RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html) defines the unqualified no-cache response directive in terms of successful validation before reuse. It does not simply prohibit storage. Retaining a representation and checking whether it remains valid can avoid downloading an unchanged body again.

Seeing a stored response is therefore insufficient to declare the directive broken. Inspect the request and validation result. Also distinguish a newly issued network request from a page restored through browser history; the [MDN caching guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) discusses that distinction. An old-looking screen alone does not reveal which operation occurred.

## no-store and private address different constraints

Storage restrictions and restrictions on shared caches are separate policy decisions. no-store concerns storage, while private restricts shared-cache storage. Neither encrypts a page or implements the application's authorization rules. Personalized responses still require a deliberate decision about who may receive them.

Adding a new header is also not a remote deletion command for every copy already stored elsewhere. If a response was improperly shared, investigate the actual platform and existing copies. Do not report an incident resolved merely because one configuration line changed; cache policy and access control need their own evidence.

## ETag and 304 provide validation evidence

The [ETag reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag) explains how a validator can be carried in a conditional request. The recipient can evaluate whether the selected representation has changed. Treat the tag as a representation validator, rather than assuming it is a Git revision.

A [304 Not Modified response](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304) avoids retransmitting the resource body under the applicable conditions. It is neither a deployment certificate nor an automatic failure. If an expected change is missing, investigate the validator, resource and responding source instead of repeatedly publishing the same article.

## Observe browser and CDN behavior separately

A browser may retain a local response, while an intermediary CDN applies its own configuration. Developer tools can distinguish local cache use from network activity. A second browser showing different content is useful evidence, but does not by itself identify the failing layer.

Compare the same exact URL, body, Cache-Control, ETag and relevant platform headers, recording the environment. [Cloudflare's origin cache control documentation](https://developers.cloudflare.com/cache/concepts/cache-control/) distinguishes platform behavior and source directives. Actual behavior depends on the project configuration; one header cannot prove that every visitor used the same node or revision.

## Reload controls are not global purge commands

Normal reloads, force reloads and fetch cache modes should not be treated as interchangeable based on their names. The [Request.cache reference](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache) describes browser HTTP cache behavior. Those modes do not instruct every CDN location to delete its stored objects.

Record the diagnostic method before interpreting the result. Disabling local cache in developer tools may help isolate an observation, but does not change the production policy for all visitors. A fresh page in that test environment supports a narrowly described success, rather than a claim that the entire network has synchronized.

## Target a purge only after identifying its scope

When evidence points to a stale CDN resource, select an appropriate invalidation method within the authorized maintenance scope. Purging a whole site after seeing one old article discards useful distinctions. Cloudflare's [single-file purge documentation](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/) also explains why custom cache keys affect how an object must be targeted.

After the platform accepts the operation, fetch the production resource again and inspect the actual body and assets. Acceptance, updated output and identical results for every visitor are different claims. This article describes the process without claiming to have performed any purge.

## Report the observation and its remaining limits

A useful handoff states which deployment was checked, which request returned the expected body, and whether associated assets were verified. Leave inaccessible layers unverified. An uncertain log upload or one stale view is not automatic justification for publishing another copy.

The same principle appears in [HTTP success versus article verification](/en/articles/http-success-article-verification/) and [tests versus feature acceptance](/en/articles/passing-tests-versus-feature-acceptance-evidence/). Investigating HTTP caching means connecting each observation to its source and conditions, so the next action addresses an identified gap.
