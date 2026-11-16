---
title: "Why does text disappear while a web font loads?"
description: "Choose a web-font display policy by testing readable fallback text, late swaps and layout changes under cold-cache and failed-request conditions."
date: 2026-11-16
tags: ["Web development", "Technical SEO", "Release verification"]
draft: false
sources:
  - title: "MDN\uff1a\u7db2\u9801\u5b57\u578b\u986f\u793a\u63cf\u8ff0\u5b50"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display"
  - title: "Chrome Developers\uff1a\u5b57\u578b\u8f09\u5165\u8207\u6587\u5b57\u53ef\u898b\u6027"
    url: "https://developer.chrome.com/docs/lighthouse/performance/font-display"
  - title: "CSS Fonts Level 4\u7de8\u8f2f\u8349\u6848\uff1a\u5b57\u578b\u986f\u793a\u6642\u9593\u8ef8"
    url: "https://drafts.csswg.org/css-fonts-4/#font-display-desc"
---
## What does font-display control?

Text can already exist in the document while remaining temporarily invisible on screen. A downloaded font may not be ready, and the browser must decide whether to wait or show a fallback. The font-display descriptor governs that decision. It does not compress the font or guarantee faster network delivery, so diagnose the waiting stage before choosing a policy.

![Abstract letterforms on translucent panels suggest a transition from blurred to crisp type](../../../assets/articles/web-font-display-text-visibility-loading/en-hero.webp)

The font timeline distinguishes a block period, a swap period and eventual failure handling. During a block period, the browser can reserve space using an invisible fallback. During a swap period, it can show fallback text and replace it when the requested face becomes ready.

These stages are different from receiving the HTML or finishing a network request. Observe when the text becomes readable as well as what the final page looks like. A successful font response alone does not establish a good reading experience.

## Compare waiting with visible replacement

The block strategy allows a short initial wait and a later swap. The swap strategy makes the initial block extremely short while retaining the opportunity to replace the fallback. Exact timing is browser-dependent; a fixed duration is not a universal promise.

Early text is valuable, but replacement can change line breaks. A heading that moves from two lines to three can shift nearby controls. Evaluate both initial readability and the stability of the resulting layout rather than treating either as the entire outcome.

## Understand the limited swap window

The fallback strategy provides a short opportunity to swap. The optional strategy has no later swap period. Neither should be described as a universal switch that prevents every font request. They control display behaviour under the browser's loading conditions.

A first visit may therefore retain a fallback appearance. Decide whether that is acceptable for the content and brand. Letting the browser choose its automatic policy is also a decision, rather than proof that the same behaviour will occur everywhere.

## Test the fallback with the actual language

An English sample heading is insufficient for a site with Traditional Chinese articles. Character coverage, punctuation and line wrapping can differ. Missing glyphs may come from another face, so the visible paragraph is not necessarily explained by a single downloaded file.

Use real headings, numerals and body text. Check emphasis as well as regular weight. Removing invisible text is useful, but it does not settle whether the fallback is comfortable to read or suitably close to the intended layout.

## Where should font-display be declared?

For an individual downloaded face, configure the descriptor in its face declaration, rather than adding it only to a paragraph selector. This structural example uses an illustrative asset path and is not a deployed change:

```css
@font-face {
  font-family: "ArticleText";
  src: url("/fonts/article-text.woff2") format("woff2");
  font-display: swap;
}
```

Match the file's weight and style as well. A build tool or hosted stylesheet can produce the final rules, so inspect the delivered stylesheet instead of assuming that a source edit reached production.

## Diagnose discovery before adding preloads

Separate a late reference to a font from a slow transfer after discovery. A preload can help a specific discovery problem, but preloading every weight can compete with other important resources. Chrome's guidance explicitly warns against excessive preloading.

Record which resource the change targets and when its request begins. More early requests are not evidence of improvement. A smaller font also does not explain a delay that occurs before the browser learns that it needs the resource.

## Verify cold-cache and failure behaviour

Compare an uncached visit with a warm-cache visit under recorded device and network conditions. Observe a failed font request too: the page should still have a readable, acceptable fallback. One quick reload with a cached font cannot represent a new visitor.

Inspect layout movement separately, especially around multiline headings and clickable controls. This article describes a verification approach; it reports no site deployment, measured speed gain or ranking improvement.

## Common questions

### Is a system font always preferable?
No. It can remove a download dependency, but appearance, language coverage and product requirements still matter. Compare those trade-offs with the actual content.

### Why does an edited page still show the previous face?
Confirm the deployed stylesheet and selected face before attributing the result to caching. Coverage, matching rules and loading conditions can each affect what appears.

A font policy should answer when reading can begin and what changes afterwards. Test font-display alongside fallback design and delivered resources, keeping each conclusion tied to an observed loading condition.

Related reading: [Image dimensions and aspect ratio: reserving space before pictures load](https://lijiabao.dev/en/articles/image-dimensions-aspect-ratio-layout-shift/); [Should a hero image use lazy loading? Start with LCP image discovery](https://lijiabao.dev/en/articles/lcp-hero-image-lazy-loading-discovery/)
