---
title: "An API request timed out. Check the result before retrying."
description: "A timeout does not prove that a write failed. Understand idempotency contracts, preserve the original operation identity and reconcile uncertain outcomes before creating duplicates."
date: 2026-10-23
tags: ["API design", "Idempotency", "Agent engineering"]
draft: false
sources:
  - title: "RFC 9110 — Idempotent Methods"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2"
  - title: "Stripe — Idempotent requests"
    url: "https://docs.stripe.com/api/idempotent_requests"
---

An agent sends a request to create a record, waits, and receives a timeout. Should it immediately send the request again? The missing response leaves more than one possibility: the server might not have received the request, or it might have completed the write without returning a response to the client. A reliable retry strategy starts with that uncertainty and the service contract. Waiting longer or generating a new identifier does not resolve it by itself.

![Two paths meeting one result container, illustrating reconciliation before retrying](../../../assets/articles/api-timeout-retry-idempotency-result-lookup/en-hero.webp)

## Preserve an uncertain outcome as its own state

Consider a hypothetical order service. A client submits an order but cannot obtain the final response. This is a design example, not a claim that this website implemented or tested such a service. The available observation is that confirmation is missing. It does not establish that no order exists, and it does not justify telling the user that the order is complete.

Keep enough non-sensitive information to identify the intended operation and when it was attempted. Authentication headers, complete personal details and private payloads do not belong in a general progress report. After an interruption, read the unresolved operation before starting another one. An empty local success list is not evidence that the remote system remained unchanged.

## HTTP idempotency describes intended effects

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2) defines idempotent methods by their intended server effects: repeating an identical request has the same intended effect as making it once. It does not require every response or ancillary log entry to be identical.

A POST that creates a resource does not become safe to repeat merely because it uses HTTP. Even when a method has idempotent semantics, the application still needs to respect the endpoint's actual contract and relevant external effects. Name the behavior the service explicitly supports. Do not promote a desired property into an already implemented guarantee.

## An idempotency key needs a server-side contract

A random key attached by the client does nothing unless the service recognizes it and applies defined rules. Check its scope, retention, parameter matching and concurrency behavior. A request field called a key is not evidence that these mechanisms exist.

[Stripe's documentation](https://docs.stripe.com/api/idempotent_requests) illustrates a specific contract: its API v1 stores the first status and response after endpoint execution begins, and the same key can return that stored result, including certain error responses. Other services and versions can behave differently. Read the documentation for the exact integration rather than treating a familiar header name as universal protection against duplicate effects.

## Reconcile with an identifier tied to the original work

Where the service offers an order lookup, job-status endpoint or another read operation, use an identifier that reliably corresponds to the original attempt. Check the returned content as well. A record with a similar name is not necessarily the record being investigated. If identity remains ambiguous, preserve the uncertainty and use the appropriate reconciliation process.

If a supported idempotency key was used initially, follow the service's rules for that key and its original parameters. Generating a different key merely to make a retry appear new can defeat the mechanism intended to recognize the same work. Where neither lookup nor idempotency is supported, manual reconciliation may be necessary. More retries cannot supply a missing contract.

## One database record does not prove one external effect

Creating a record might trigger a notification, payment or background process. Finding only one row does not establish that every downstream effect happened exactly once. Identify the boundaries that need their own transaction, deduplication or result lookup. A single key should not become shorthand for an unverified guarantee across several services.

Recovery should target the unresolved step. A missing notification does not necessarily call for a new order. A confirmed order does not prove the notification completed. Distinct states make it possible to repair the missing work without repeating a successful action upstream.

## Test lost responses as well as immediate errors

In an authorized test environment, useful scenarios include a request that never arrives, a write followed by a lost response, repeated requests with the same key, and a key reused with different parameters. Observe the final records and the relevant effects. These are proposed tests, not results reported by this article.

A test double that always returns an error before execution misses the uncertain interval that can cause duplicate creation. Check what the assertions establish. The related article on [passing tests and feature acceptance](/en/articles/passing-tests-versus-feature-acceptance-evidence/) explains why a successful test needs to observe the claimed behavior, not merely a call to a function named retry.

## Report submission, reconciliation and confirmation separately

Tell the user which stage is confirmed and which still needs investigation. Keep a safe operation identifier and appropriate timing evidence. A successful status or a quiet log cannot substitute for the business result. For a related content example, see [successful responses and actual article verification](/en/articles/http-success-article-verification/).

When lookup confirms that the original work completed, continue from there. If the result remains uncertain, retain a clear pending item. A dependable retry policy can acknowledge that it does not yet know, and let the service contract, original operation identity and observed result determine the next action.
