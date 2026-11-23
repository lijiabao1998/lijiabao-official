---
title: "Why does Show password try to submit the form?"
description: "Trace an unexpected submission to the native button type, then test the password toggle and the real submit action separately."
date: 2026-11-23
tags: ["Web development", "HTML", "Forms"]
draft: false
sources:
  - title: "MDN: The button element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button"
  - title: "MDN: SubmitEvent.submitter"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent/submitter"
---

Check the rendered HTML of the password toggle. An ordinary form button with no explicit type normally acts as a submit button when it has a form owner. Give the toggle type="button" and the sign-in control type="submit". Each control now has a distinct job, even before JavaScript runs.

![A developer checks two controls on a laptop form](../../../assets/articles/html-button-type-implicit-form-submit/en-hero.webp)

## What makes a form button a submitter?

The visible label helps the person filling out the form. The browser instead looks at the element, its type and its form owner. Clicking an eye icon next to an empty required password field may show a validation message. That is a useful clue. A submission attempt can trigger validation before there is anything to see in the network panel.

## Check the owner as well as the type

In the browser inspector, select the actual form button. Look at its type attribute and its form association. A button can sit outside a form and still belong to it through a form attribute that names its id. A component that works in isolation may therefore behave differently when a sign-in page supplies the surrounding markup.

## Give the toggle a narrow job

For the visibility control, set type="button" and let its handler switch the password field between masked and visible text without changing the value. Leave the sign-in control as type="submit". Handle the submission on the form. When you intentionally offer two submission actions, such as Save draft and Publish, the submit event’s submitter property can identify which control initiated it.

## How do you test a form button with a keyboard?

Start with an empty required field. Focus the visibility toggle and activate it, then repeat the test with a pointer. The masking should change without a validation prompt or a submission. Fill the required fields with test data and activate the real sign-in control. In a test environment, check that its expected validation and submission still take place. A successful toggle alone does not exercise that second path.

## Would moving the toggle outside the form solve it?

First check for an explicit form attribute. Moving the control may also change focus order or detach the icon from its label visually. An explicit button type usually preserves the relationship between the toggle and the password field while making the intended behavior clear.

When the same form button component appears on a registration screen, a login screen and an account settings page, a small integration test for each role can catch a misplaced default before an ordinary click starts a request.

Related reading: [Can a native FAQ disclosure work with a keyboard?](https://lijiabao.dev/en/articles/native-details-summary-keyboard-access/) · [Hidden, aria-hidden and inert solve different interface problems](https://lijiabao.dev/en/articles/hidden-aria-hidden-inert-visibility-accessibility/)
