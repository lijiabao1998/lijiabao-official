---
title: "Passing tests is a start: what proves a feature is complete?"
description: "Connect acceptance criteria to observable behavior, real dependencies, persisted data and the deployed revision. Report what passing tests actually establish."
date: 2026-10-20
tags: ["AI engineering", "Acceptance", "Testing"]
draft: false
sources:
  - title: "Playwright Best Practices"
    url: "https://playwright.dev/docs/best-practices"
  - title: "Playwright Assertions"
    url: "https://playwright.dev/docs/test-assertions"
  - title: "Google Engineering Practices: What to look for in a code review"
    url: "https://google.github.io/eng-practices/review/reviewer/looking-for.html"
---

A coding agent reports that every test passed. Before closing the task, ask what those tests observed. A green indicator after clicking Save establishes very little if the test never checks the stored value. Acceptance connects a requirement to a result another person can verify. The preference-setting example below is hypothetical; it does not describe a test run or a feature change performed on this website.

![A small constructed model and independent review tools](../../../assets/articles/passing-tests-versus-feature-acceptance-evidence/en-hero.webp)

## Describe completion from outside the implementation

“Add saving” leaves several questions unanswered. A more useful description might say that an authorized user can change a preference, reopen the page and retrieve the same value. An unauthorized user cannot change it. If saving fails, the interface reports the actual outcome. These are example requirements, not a demand for a large acceptance framework around every small edit.

Identify the observable result and its prerequisites. Calling a function with a particular name is usually weaker evidence than retrieving the required state. When the intended permission rule or failure behavior is undecided, keep it open for a decision. Do not let an agent quietly define the requirement around whichever implementation was easiest to write.

## Read the assertions behind the test names

A case called “saves successfully” may only assert that a success message appears. Inspect what makes it pass: does it observe the intended result, or merely accept a value supplied by the implementation? [Playwright's best-practice guidance](https://playwright.dev/docs/best-practices) emphasizes user-visible behavior. Using Playwright, by itself, does not establish that a particular test follows that guidance.

Unit tests can establish valuable properties of a small component. Integration tests and browser tests answer other questions. They can complement one another without one category becoming a universal substitute for the others. Report the layer that passed, and avoid extending its conclusion to dependencies it never exercised.

## Make replaced dependencies visible

A test double can make a scenario repeatable and isolate a defect. It also creates a boundary. If the data service always returns a prepared success response, the test has not verified production credentials, network access or persistent storage. Record which dependencies were replaced so the next reviewer can understand where the evidence stops.

When a scenario needs the real integration, use an appropriate environment and authorized test data. A customer record is not an interchangeable test fixture. Missing access or an unavailable dependency should produce an explicit verification gap, rather than an assumption that some other green test must cover it.

## Wait for the relevant result in asynchronous flows

The interface may update before a background write completes. A useful check can retrieve the value again or reopen the page, while understanding whether the observation still comes from local memory or a cache. Five quiet seconds after a click do not define successful persistence.

[Playwright's assertion documentation](https://playwright.dev/docs/test-assertions) distinguishes retrying web assertions from other assertion forms. Retrying a well-chosen condition helps synchronize an observation. Retrying the wrong condition does not improve its meaning: waiting until a decorative icon changes still does not verify the stored preference.

## Check that failures do not become false success

In a suitable environment, introduce a controlled failure and inspect the resulting message and state. Does the application preserve or change previous data as required? This can reveal a different class of defect from running the happy path repeatedly. Permission-sensitive behavior also needs an appropriate boundary check; a hidden button alone is not evidence that a write is protected.

Use authorized test identities and agreed methods. Testing a rule does not justify obtaining another person's account or bypassing a system. Preserve the prerequisites and the observed outcome. Scenarios that were not exercised remain unverified, even when the surrounding checklist contains many completed items.

## Associate the result with the deployed revision

Tests describe a revision, configuration and environment. Production may differ in any of those dimensions. Connect the result to a version identifier, then perform release checks appropriate to the change. A green screenshot without an environment or date makes later investigation unnecessarily difficult.

This does not mean rerunning everything after every minor update. Choose checks that address the material release risks. For published pages, see the distinction between [successful HTTP responses and actual article content](/en/articles/http-success-article-verification/). If URLs change, [redirect and canonical verification](/en/articles/article-url-move-redirect-versus-canonical/) adds another concern. A test suite's name does not automatically perform either job.

## Deliver a bounded completion claim

A short handoff can state the requirement, revision, environment, result and remaining limitation, with reproducible steps or sanitized evidence. Credentials, customer information and complete private logs do not belong in a public acceptance report. Include what is needed to assess the conclusion, with access to additional evidence handled appropriately.

Code review contributes another perspective; [Google's review guidance](https://google.github.io/eng-practices/review/reviewer/looking-for.html) offers useful questions about a change. It does not replace runtime observation. “Local logic passed; real persistence is unverified” is more informative than an unqualified claim that all tests succeeded. A feature is ready to call complete when the required claims have suitable evidence and the handoff accurately identifies any work that remains.
