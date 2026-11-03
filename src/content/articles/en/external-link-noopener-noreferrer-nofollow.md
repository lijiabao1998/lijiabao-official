---
title: "Noopener, noreferrer and nofollow solve different link problems"
description: "Separate opener access, referral information and search relationship signals before choosing rel values. Verify rendered links and each intended behavior independently instead of applying one unexplained string everywhere."
date: 2026-11-03
tags: ["Web development", "Technical SEO", "Web security"]
draft: false
sources:
  - title: "MDN: rel=noopener"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener"
  - title: "MDN: rel=noreferrer"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noreferrer"
  - title: "Google Search Central: qualify outbound links"
    url: "https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links"
---
## Start with three requirements, not a familiar attribute string

A site can add the same rel string to every external link and still leave the actual requirement unclear. Preventing a newly opened page from accessing its opener, withholding referral information, and describing a commercial relationship are separate decisions. They can share one HTML element without becoming the same feature. The examples below describe a fictional editorial site and a possible verification workflow. They are not a claim that any particular production site or third-party destination has been tested.

![A padlock and separated metal rings on a modern desk beside a frosted divider](../../../assets/articles/external-link-noopener-noreferrer-nofollow/en-hero.webp)

Write down the intended opening behavior, the information that may leave with the request, and the relationship the publisher wants to describe. A documentation citation may need a different decision from an advertisement. Ask which behavior is required before choosing the values. A successful click demonstrates navigation, but says little about the other requirements. Likewise, finding rel in a source file proves that some text exists in the implementation; it does not prove that the final page preserves it or that every intended outcome has been observed. Keeping separate acceptance criteria makes disagreements easier to locate.

## Noopener concerns the opener relationship

MDN describes noopener as opening the destination without giving the new browsing context access through Window.opener. It does not itself remove the Referer header. Current HTML also gives ordinary target=_blank links the corresponding implicit behavior. State the requirement as isolation from the originating page, then check the actual implementation and supported environments. A controlled pair of test pages can be useful here. There is no reason to expose a signed-in production session to an unfamiliar destination just to see what that destination might do. Use only a test environment and actions that are within the authorized scope.

## Noreferrer changes referral disclosure as well

MDN explains that noreferrer withholds referrer information and also supplies the noopener behavior. Choosing it therefore makes a different decision from opener isolation alone. Decide whether withholding that information is wanted instead of treating the two words as interchangeable decoration. An analytics report with less referral detail is also different from a report proving that fewer people clicked. Before changing a shared component, identify who relies on the available reporting and what comparison would remain meaningful. A privacy decision can be entirely appropriate while still requiring a clear description of its reporting consequences. Neither consequence should be invented from a missing field alone.

## Nofollow describes a search relationship

Google documents nofollow, sponsored and ugc for different link relationships. These values do not provide opener isolation or authentication, and a destination can still be discovered elsewhere. The practical task is to describe the relationship that actually exists. Do not turn an ordinary editorial reference into a paid placement in the metadata merely because both lead outside the site. If the real requirement is to protect private content, address access control at that content instead. If it concerns search presentation, use the appropriate indexing controls. Those are separate work items with different evidence, rather than additional meanings hidden inside a link attribute.

## Combine values only when the requirements justify them

Consider a fictional article that opens an official reference in another tab while retaining ordinary referral information. Its opening and opener requirements can be handled without automatically deciding to suppress referral data. If a separate requirement calls for withholding that data, evaluate noreferrer for that purpose. A paid reference needs its own relationship decision. This example is a way to reason about configuration, not a universal recipe for every website. Several values may appear together, but each should have a reason that a future maintainer can explain. Record that reason alongside the implementation rather than leaving an unexplained string copied from another project.

## Inspect the generated anchor, not only the editor field

Markdown, CMS serialization and frontend components can all participate in creating the final link. Identify which layer produces each link in scope, then inspect the built anchor, its destination, its target and its rel values. If client-side code changes the element, inspect the resulting DOM as well. A template may override a value that looked correct in an editor, or a second transformation may append values unexpectedly. Keep the investigation limited to the current change. Discovering an unrelated old link or form does not make it part of the authorized edit. Save a small representative example and the observed output so that another maintainer can reproduce the check.

## Report navigation, referral behavior and search markup separately

In a controlled environment, confirm the destination and opening behavior first. Use a receiving page you control when observing opener or referral behavior, and avoid sending private paths, personal information or credentials to a public testing service. For the search relationship, inspect the emitted markup and explain why it matches the publisher's actual relationship. A single browser visit cannot prove how Google has processed the link. Label an unavailable observation as unverified instead of filling the gap with a successful navigation result. These distinctions make a short report more useful: it tells the reader exactly which claim each observation supports.

## Keep representative cases when the shared component changes

A site with a centralized link component can review a few real link types after a change: an editorial citation, an existing paid placement, or a user contribution where those cases actually exist. Do not create a fictional production advertisement just to satisfy a checklist. After release, inspect the production page too, because a local build and a cached public response can differ. Preserve the intended requirement, the limited edit and the checks that were completed. This is a proposed maintenance practice, not a claim that monitoring or automatic site-wide rewriting has been installed. The objective is understandable behavior that can be checked again when the relevant code changes.

Treat every rel value as an answer to a specific requirement. Choose opener isolation, referral disclosure and search relationship marking independently, then gather evidence for each outcome. That produces a more maintainable implementation than one attribute string applied everywhere without explanation.

Related reading: [Robots.txt does not lock an admin page: verify access control separately](https://lijiabao.dev/en/articles/robots-txt-not-admin-access-control/); [Hreflang and canonical for bilingual articles](https://lijiabao.dev/en/articles/bilingual-articles-hreflang-canonical/)
