---
title: "How to skip a site header and keep keyboard focus in the article"
description: "Test a keyboard shortcut past a repeated site header by following the next Tab stop. A visible jump to the heading alone tells only half the story."
date: 2026-11-25
tags: ["Web accessibility", "HTML", "Keyboard navigation"]
draft: false
sources:
  - title: "W3C WAI technique G1 and its keyboard test"
    url: "https://www.w3.org/WAI/WCAG22/Techniques/general/G1"
---

Open a long article and put the mouse aside. Before you can follow the first reference, how many times do you have to press Tab? A skip link can turn a row of repeated navigation controls into a single choice. The interesting part of the test comes immediately after you activate it.

![A close-up of the Tab key on a keyboard beside a monitor displaying an article.](../../../assets/articles/skip-link-keyboard-main-content/en-hero.webp)

## Put the shortcut where a visitor can discover it

Start with a fresh page load. Press Tab and watch the top edge of the viewport. A shortcut that is visually hidden between visits needs to become visible when it receives keyboard focus. Check that its text can be read against the header and that a sticky banner does not cover the focus indicator.

## Where should a skip link land on an article page?

Pick the start of the main content for this particular view. An article heading is a useful visual landmark. An in-page link needs a matching, unique target identifier in the document. If the navigation is shared across templates, check a search page as well: its results occupy a different part of the page than an article does.

## The second keypress is the revealing one

Activate the shortcut, note where the page landed, and press Tab again. You should now be able to proceed into the article’s interactive content. Seeing the heading scroll into view tells you where the viewport moved. Landing back on the language menu on the next keypress tells you that the actual keyboard journey still needs attention.

## Test the narrow header too

At a narrow width a persistent header may cover the landed-on heading. Check the viewport and the next focus stop separately. A layout adjustment can clear space above the target; it cannot repair a broken destination. Repeat the test with a second article so that a coincidentally working template does not mask a missing target.

## Does a main landmark replace the skip link?

Landmark navigation and sequential keyboard navigation reach different visitors. A person browsing with a keyboard and no screen reader can use the visible shortcut without knowing any landmark commands. Give the skip link a label in the language of the page that explains the destination.

## A short acceptance test you can repeat

Load the page, reveal the shortcut, activate it, then record the next reachable control. Retain those observations alongside the URL and viewport size. The next time a header redesign ships, anyone can replay the same sequence and tell whether the skip link still saves the reader a trip through the menu.



Related reading: [Can a native FAQ disclosure work with a keyboard?](https://lijiabao.dev/en/articles/native-details-summary-keyboard-access/) · [Hidden, aria-hidden and inert solve different interface problems](https://lijiabao.dev/en/articles/hidden-aria-hidden-inert-visibility-accessibility/)
