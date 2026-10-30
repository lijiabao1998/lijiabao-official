---
title: "Renaming an image to .webp does not optimize it: verify the encoding and delivery"
description: "Verify an image conversion from the encoded file through the production page. Separate dimensions, compression choices, selected resources, file size, and measured network transfer."
date: 2026-10-30
tags: ["Web development", "Image optimization", "Verification"]
draft: false
sources:
  - title: "WebP container specification"
    url: "https://developers.google.com/speed/webp/docs/riff_container"
  - title: "WebP frequently asked questions"
    url: "https://developers.google.com/speed/webp/faq"
  - title: "HTML picture element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture"
  - title: "Resource timing: encoded body size"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/encodedBodySize"
  - title: "Resource timing: transfer size"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize"
---
## A new extension does not re-encode the contents

A cover image is renamed from photo.png to photo.webp, and the asset folder now looks ready. That does not establish that the image was converted, that the page uses it, or that a first-time visitor downloads fewer bytes. Image optimization needs evidence about both the output file and the resource actually delivered. Those checks answer different questions and should remain distinct.

![Abstract stages of source image, encoded asset, and network delivery without invented benchmark figures](../../../assets/articles/webp-extension-encoding-transfer-size-validation/en-hero.webp)

An image format has an internal structure. Google's WebP container specification describes a RIFF container with a WEBP identifier, among other requirements. Renaming PNG bytes does not create that structure. A viewer may still open the renamed file by detecting its contents, so successful viewing alone does not prove conversion.

Use a decoder to check the output format, dimensions, and readability. A signature check can provide an early clue, but a matching header does not establish that the whole file is valid. Preserve the source and write a separate output rather than overwriting the only original during an experiment.

## Choose useful dimensions before comparing compression

A small article card and an image intended for detailed inspection have different requirements. Consider display size, pixel density, and cropping before deciding how many pixels to deliver. Keeping every source at full resolution can waste bandwidth; reducing it until fine text becomes unreadable misses the purpose of the asset.

Record dimensions alongside bytes. Comparing a half-size image with a full-size PNG can demonstrate a smaller deliverable, but it cannot attribute the entire difference to WebP. To compare encoding choices, keep the content, dimensions, and acceptable visual quality reasonably aligned, then state the limits of that comparison.

## WebP is a family of choices, not a fixed saving

WebP supports lossy and lossless encoding as well as transparency. Photographs, diagrams, small text, and transparent edges can respond differently to those choices. A quality setting in one encoder also need not be equivalent to the same number in another.

Published format comparisons are useful context, not a promise for every asset. Re-encoding an already compact image may produce a larger file. Keep the measured result, inspect its quality, and adjust the actual settings if needed. The extension cannot serve as a pass condition, and a smaller file is not useful if it loses information that readers need.

## Confirm that the build selects the new resource

Adding a file to the repository does not make an article use it. Check imports, paths, capitalization, and generated output. A framework may create derivative files with different names, sizes, or formats, so the source path is not always the URL that appears in production.

Responsive markup introduces another selection step. A picture element or srcset can offer several candidates, and the browser chooses a resource under its current conditions. Inspect the selected URL rather than assuming the first src is universal. If the template or preload still fetches the original PNG, the unused WebP does not reduce that request.

## Inspect the production response as well as its label

Open the actual page and check that the intended image renders. Then verify the response for that image URL, including its content and declared media type. Content-Type describes what the server claims to send; it can be misconfigured. A successful HTTP response containing an error page is not a valid image delivery.

A CDN may also transform images or negotiate different representations. Record the exact URL, relevant request conditions, and observation time. When the response differs from the expected asset, investigate that difference before purging unrelated caches. This is a targeted verification step, not evidence that every visitor has already received an identical representation.

## Distinguish file bytes from observed transfer

A local file size measures stored bytes. Network measurements can also reflect content encoding, headers, validation, and cache reuse. Resource Timing exposes encodedBodySize and transferSize for different purposes, while cross-origin restrictions can hide information. A zero value does not, by itself, establish a zero-cost image.

Compare under controlled conditions and measure normal cache reuse separately. A warm-cache observation cannot stand in for a first visit. Report the output file size, the initial-load observation, and subsequent reuse as separate results. Avoid a single percentage that mixes unlike measurements or attributes a cache hit to a better image encoder.

## Review the picture at its intended use size

Inspect faces, small lettering, gradients, and transparent edges in the real layout. Tiny previews can conceal artifacts, while extreme magnification may impose a requirement the page does not have. Where several display sizes matter, review the relevant candidates rather than judging every use from one thumbnail.

Fewer bytes alone also do not prove a faster page. Loading order, connection conditions, caching, and layout still matter. Performance claims require suitable metrics and a reproducible environment. A file-format change is not evidence of a ranking improvement, and this article does not claim to have measured a speed gain for a particular production website.

## Keep a result that another maintainer can reproduce

A useful handoff can retain the source reference, dimensions, encoder settings, output hash, and byte count. Add the production asset URL and the conditions of the response check. Keep credentials, private photographs, and unrelated personal information out of shared execution records.

Record conversion, build selection, and public delivery separately. If one remains unverified, check that stage rather than regenerating every asset or rewriting historical articles. The next maintainer can then distinguish a missed conversion from a stale reference, an unexpected delivery path, or a change in measurement conditions. That is a stronger completion criterion than a folder full of correctly named files.

A useful optimized image is correctly encoded, appropriate for its display, selected by the built page, and delivered as expected. Its visual quality and measured size need clear conditions. Calling a file WebP is only the start of that verification.

Related reading: [no-cache does not mean no storage: tracing stale browser and CDN responses](https://lijiabao.dev/en/articles/cache-control-no-cache-browser-cdn-revalidation/); [A 200 response does not prove an article was published](https://lijiabao.dev/en/articles/http-success-article-verification/)
