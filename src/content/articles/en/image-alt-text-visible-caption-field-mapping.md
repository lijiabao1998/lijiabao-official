---
title: "Image alt text and visible captions are different CMS outputs"
description: "Alternative text and visible captions serve different purposes. Trace CMS fields through templates and published HTML before removing unexpected image descriptions."
date: 2026-11-13
tags: ["Web development", "Technical SEO", "Release verification"]
draft: false
sources:
  - title: "MDN\uff1aThe Image Embed element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img"
  - title: "MDN\uff1aThe Figure Caption element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figcaption"
---
## Alternative text is a replacement, not a default label underneath

An editor has one image-description field. After publishing, the description appears beneath the image as well as in its alternative text. That does not necessarily mean the browser has exposed a hidden attribute. The content system may be sending one stored value to two different destinations. Understanding the result starts with separating the purpose of the text from the name of the field and the markup produced by the template.

![A picture card with a separate visible caption strip and a connected metadata card](../../../assets/articles/image-alt-text-visible-caption-field-mapping/en-hero.webp)

The HTML img element can carry alternative text in its alt attribute. MDN documents this separately from the image source and dimensions. Assistive technologies may use the alternative, and browsers may present replacement content when an image cannot be displayed. Calling alt permanently invisible is therefore misleading.

However, a persistent line beneath a successfully displayed image does not prove that the browser is rendering the attribute there. Inspect the elements responsible for the line. Alternative text should also reflect the image's role in context: an informative diagram, a functional image link and a decorative flourish need different decisions. A list of location and service keywords is not a substitute for that decision.

## A visible caption has its own structure

The figcaption element supplies a caption for a figure. A template that outputs a figure containing an image and a figcaption can expose that explanation to readers while expressing their relationship in markup. This is different from putting the same string in alt.

Not every site uses figcaption. A component may create a plain paragraph or another visible structure. Absence of that particular element does not prove there is no caption, and proximity alone does not establish that the semantic relationship is appropriate. Identify the actual output before deciding what needs to change.

## One field can have two consumers

Imagine a field called imageDescription. A component reads it once for the image's alt attribute and again for a paragraph below. The repeated text comes from the mapping, not spontaneous browser duplication. Renaming the editor label to Alternative text does not change those two consumers.

Likewise, separate altText and caption fields do not guarantee separate output if the component still connects them incorrectly. Follow the value from the editing form through storage, transformations and rendering. This is an illustrative data flow, not a claim that every CMS or this website has that implementation.

## Related text does not have to be identical text

A caption might explain provenance, context or why an illustration matters. Alternative text should preserve the information needed when the image is unavailable to a reader. Those purposes can overlap without requiring identical sentences. Decide what the image contributes alongside the surrounding content.

Do not erase meaningful alternatives simply to remove an unwanted visible line. Decorative images can warrant an empty alternative in the appropriate context, but that is a semantic choice, not a blanket cleanup technique. Nor should a caption become a place to repeat the title, paste a fragment of the article or add another cluster of search terms.

## Separate future fields without silently rewriting the archive

If the purposes need independent values, a content model can expose separate fields and connect each to the appropriate output. First examine existing records. Some may have only one value; others may depend on a visible explanation. A global migration can change published meaning as well as layout.

Clear guidance for new entries can explain which text appears on the page and which provides a replacement. Existing content needs its own agreed scope and validation if migration is warranted. This article describes that boundary; it does not report an archive migration or changes to existing articles.

## Preview, source HTML and rendered output answer different questions

A corrected editor preview establishes only that preview's behavior. Production may use another template or transformation. Inspect the built HTML for the alt value and the element carrying the visible text, then verify the published page. If JavaScript adds content, distinguish the initial response from the resulting document.

Counting occurrences in source code is insufficient. A string may also live in serialized data or other non-visible locations. Three source matches do not automatically mean a reader sees the sentence three times. Conversely, correct initial HTML does not establish that a later component leaves it unchanged.

## Check the component's actual reach

A shared image component may appear in article pages, listing cards and other layouts. Test the affected uses rather than assuming one article proves all of them. A long caption suited to an essay may overwhelm a card; an absent value might leave an unnecessary empty container.

Inspect narrow and wide layouts, reading order and accessible names where relevant. Visual tidiness is useful evidence for layout, but it is not complete accessibility validation. Results should state which assistive-technology checks were performed, rather than turning one successful observation into a claim of universal compliance.

## Report the mapping and the deployment separately

A useful handover distinguishes prepared fields, revised mapping, verified build output and confirmed production behavior. If only a local preview has been tested, say so. If a published page differs, investigate the deployed source and caching conditions instead of repeatedly editing content until something appears to change.

Improved alternative text also does not establish a ranking increase. Its content and accessibility purposes are valuable without an unmeasured SEO promise. Precise verification helps the next maintainer identify whether an unexpected line belongs to the stored content, the template or an older deployed version.

Alternative text, visible captions and CMS fields are connected but distinct. Define the reader's need, trace each value to its output and verify the published result. That preserves useful replacements while keeping visible explanations where they actually help.

Related reading: [Should a hero image use lazy loading? Start with LCP image discovery](https://lijiabao.dev/en/articles/lcp-hero-image-lazy-loading-discovery/); [Renaming an image to .webp does not optimize it: verify the encoding and delivery](https://lijiabao.dev/en/articles/webp-extension-encoding-transfer-size-validation/)
