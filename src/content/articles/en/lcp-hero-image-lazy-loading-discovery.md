---
title: "Should a hero image use lazy loading? Start with LCP image discovery"
description: "A small hero image can still arrive late. Identify the actual LCP element, inspect resource discovery, and distinguish eager loading, fetch priority, and preload before measuring a change."
date: 2026-11-02
tags: ["Web performance", "Image loading", "Web development"]
draft: false
sources:
  - title: "Web platform primary documentation"
    url: "https://web.dev/articles/optimize-lcp"
  - title: "Web platform primary documentation"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img"
  - title: "Web platform primary documentation"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/fetchPriority"
  - title: "Web platform primary documentation"
    url: "https://developer.chrome.com/docs/performance/insights/lcp-discovery"
  - title: "Web platform primary documentation"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload"
  - title: "Web platform primary documentation"
    url: "https://web.dev/articles/browser-level-image-lazy-loading"
---
## Identify the element that actually becomes LCP

An article cover has been converted to a compact WebP, yet the main picture still appears noticeably late. The remaining delay may begin before the image is downloaded: the browser first needs to discover a usable source. Delivering fewer bytes and starting the necessary request promptly are separate jobs. This guide follows that distinction through LCP identification, image loading, priority hints, and verification. It describes an investigation method, without claiming that a particular production website has been changed or that a performance gain has already been measured.

![A laptop displaying an abstract page with its main landscape image visible, beside photo cards on a desk](../../../assets/articles/lcp-hero-image-lazy-loading-discovery/en-hero.webp)

Largest Contentful Paint concerns the rendering of the largest eligible content element in the viewport. That element is not automatically the asset a design system calls the hero. It may be another image or a text block. Inspect the relevant page under the intended conditions before deciding which resource deserves attention. A prominent homepage picture does not establish the candidate on every article page.

Mobile and desktop layouts can produce different candidates. Record the exact URL, viewport, test conditions, and identified element. That information keeps subsequent work attached to an observed problem. A single run is evidence about that run, rather than proof that every visitor waits for the same asset.

## Avoid delaying the image needed for the initial view

The web.dev LCP optimization guide specifically advises against lazy-loading the LCP image. Native `loading="lazy"` allows the browser to defer an image according to its loading policy. It is not merely a visual effect that hides an already downloaded picture. Applying the same lazy default to all images can therefore delay a resource needed for the initial experience.

Check component defaults and the rendered production output, rather than assuming the source template is the final markup. Removing lazy loading from an identified critical image does not imply that all images farther down the page should become eager. Keep the change focused, and inspect the resulting requests instead of treating one attribute as a complete performance solution.

## Give the browser an early usable source

An image URL stored only in a custom data attribute may not become a fetchable image source until JavaScript runs. A CSS background can depend on stylesheet discovery and parsing. In both cases, the final page may look correct while the browser received the important URL relatively late. Visual presence at the end of loading does not establish early discovery.

Inspect the initial response, the generated HTML, and the actual request sequence. Determine whether the image is a normal image element, a background, or content inserted by a script. When appropriate, expose its usable source earlier. Also verify the generated asset path and response: promptly discovering the wrong URL does not help the page render its intended content.

## Use fetch priority as a hint, not as discovery

For an image already identified as important, `fetchpriority="high"` can express a relative priority preference. MDN describes this as a hint, with actual handling left to the browser and its circumstances. It is not a guarantee that one request always runs first. Nor does it create a URL that the browser has not yet discovered.

Marking every thumbnail and decoration as high priority weakens the distinction the hint is meant to communicate. Identify the important resource, then inspect when its request begins and what competes with it. Priority does not replace suitable dimensions, encoding, server behavior, or the other parts of image delivery. Its value should be assessed within the whole request sequence.

## Preload the resource the page will really select

Preload can be useful when a critical image is otherwise difficult to discover early. It should target an actual need, rather than become a mandatory list added to every template. If ordinary HTML already exposes the image promptly, first establish where the remaining delay occurs. Another hint is not necessarily the missing step.

Responsive images require particular care. A preload that selects one asset while the image element selects another can cause unnecessary downloading. Check the relationship with `srcset`, `sizes`, format selection, and the requests made at the relevant viewport. If a change brings extra resources into early competition, record that result honestly instead of counting additional requests as evidence of successful optimization.

## Separate request delay, transfer, and rendering

A late image can involve several stages: the document response, resource discovery, the transfer itself, or the conditions required to render it. A total score alone does not reveal which stage changed. The LCP breakdown in web.dev provides a way to relate timings to the network sequence and the visible result.

For example, a smaller file may still be requested only after a script executes. That remaining wait should not automatically be blamed on insufficient compression. An image already downloaded but not yet displayed points toward another part of the investigation. Keeping these stages separate makes it easier to choose the next change without simultaneously altering quality, loading behavior, and unrelated page features.

## Preserve layout space and useful image quality

Image dimensions and reserved layout space address movement when content arrives. They are related to a good loading experience, but they are not the same question as resource discovery. Check both. An improvement in LCP should not hide a new layout problem, and a stable layout does not establish that its main image started loading promptly.

Inspect the final selected asset at the size readers will use. A severely degraded image is not a satisfactory outcome simply because fewer bytes were transferred. The earlier guide to WebP encoding and delivery covers that side of verification. Here, the focus remains timing: neither renaming a file nor reserving its space proves that the browser obtained its source at the right stage.

## Measure comparable conditions and report the scope

Compare the same URL under recorded device and network conditions, with more than one observation where needed. Separate first-load behavior from cache reuse. One warm-cache result does not describe a new visitor. Confirm the production build and deployment as well; a source change is not evidence that the live page uses it.

A useful report can state which image stopped using lazy loading, whether its source became discoverable earlier, and how the observed timing stages changed. Keep unmeasured visitor conditions unknown. Do not turn a loading adjustment into an unsupported claim about search rankings. The goal is a traceable explanation of what improved, what remained unchanged, and which bottleneck deserves the next investigation.

A critical image needs both an appropriate file and timely discovery. Identify the real LCP candidate, inspect how its source reaches the browser, and distinguish loading policy from priority and preload. Then verify the delivered page under clear conditions so that the performance conclusion matches the evidence.

Related reading: [Renaming an image to .webp does not optimize it: verify the encoding and delivery](https://lijiabao.dev/en/articles/webp-extension-encoding-transfer-size-validation/); [no-cache does not mean no storage: tracing stale browser and CDN responses](https://lijiabao.dev/en/articles/cache-control-no-cache-browser-cdn-revalidation/)
