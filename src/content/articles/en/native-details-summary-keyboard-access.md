---
title: "Can a native FAQ disclosure work with a keyboard?"
description: "Check the native FAQ path from summary focus and the Space key to answer links, visible focus, and assistive technology support."
date: 2026-11-20
tags: ["Web development", "Accessibility", "Browsers"]
draft: false
sources:
  - title: "MDN: details disclosure behaviour"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details"
  - title: "WHATWG HTML: details and summary"
    url: "https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element"
  - title: "MDN: summary and accessibility support"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary"
  - title: "W3C WAI: Focus Visible"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html"
---

Yes. A details element with a summary provides a browser-managed disclosure, so a basic FAQ does not need a JavaScript component library just to open an answer. The remaining question is whether the finished design preserves that behaviour and makes each question understandable.

![A hand near the Space key on a keyboard beside a softly focused web page](../../../assets/articles/native-details-summary-keyboard-access/en-hero.webp)

## Where is the control inside a details element?

Put the question in the first summary child, followed by its answer. The HTML standard defines this as a way to reveal additional information; activating the summary changes the open state. A specific question such as “Can I change my booking time?” gives readers a useful choice before they expand anything. A repeated label such as “More” does much less.

## Follow the keyboard path through one answer

MDN documents opening and closing the disclosure by focusing it and pressing Space. A useful acceptance check starts with the pointer left alone: reach the question with Tab, locate the focus indicator, activate it, then visit any answer links and return with Shift+Tab. These are proposed checks, not results from a completed cross-browser test. Although a details element supplies native interaction, record the operating system’s keyboard navigation settings, browser and assistive technology used for the actual check.

## Keep the focus indicator when changing the design

An arrow can be redesigned, but the person using the keyboard still needs to see which question will respond. W3C’s Focus Visible guidance explains that purpose. If a stylesheet removes the default outline, provide a clear replacement; a hover colour alone does not identify keyboard focus. Also check that a custom icon follows the actual open state. Otherwise the answer and its visual cue may disagree.

## Does a details element need custom key handlers?

Ordinary disclosure does not need a second keyboard implementation. A handler that switches open while the browser also performs its default action can interfere with that behaviour, so diagnose the actual event sequence before adding another fix. Observe toggle when the application needs to react to a state change. The details element also has a specific semantic purpose: the HTML standard distinguishes disclosure from tabs and menus. Sharing an arrow-shaped icon does not make those controls interchangeable.

## Does successful toggling prove the whole FAQ is accessible?

No. MDN notes that browsers can expose summary roles differently, affecting the semantics of headings placed inside them. Check the announced name and state in the combinations your audience uses. Giving several disclosures the same name creates an exclusive group, but readers may want two answers open for comparison. The standard explicitly asks authors to consider that tradeoff. Leave independent questions open together when exclusivity has no useful purpose.

A useful handover records whether questions can be reached, focus remains visible, answers can be read and followed, and which browser and assistive technology combinations were checked. That gives the next maintainer more to work with than a screenshot of clickable rows.

Related reading: [Hidden, aria-hidden and inert solve different interface problems](https://lijiabao.dev/en/articles/hidden-aria-hidden-inert-visibility-accessibility/), [Image alt text and visible captions are different CMS outputs](https://lijiabao.dev/en/articles/image-alt-text-visible-caption-field-mapping/)
