---
title: "Why does fetch skip catch when an API returns 404?"
description: "A 404 can resolve the fetch promise. Check the response status, body parsing and application result separately before choosing what an error message should say."
date: 2026-11-21
tags: ["Web development", "JavaScript", "Browser"]
draft: false
sources:
  - title: "MDN: fetch promises and HTTP error responses"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch"
  - title: "MDN: Response.ok status range"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Response/ok"
  - title: "MDN: Response.json and parsing exceptions"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Response/json"
---

A 404 is still an HTTP response that the browser received. Reliable fetch error handling must inspect that response and decide what it means for the feature. A catch handler does not automatically receive every unsuccessful HTTP status, so reaching the next line is not proof that the API returned usable data.

![A developer workspace with separate visual blocks suggesting response, status and parsing stages](../../../assets/articles/fetch-http-error-response-json-handling/en-hero.webp)

## Start fetch error handling by identifying what completed

MDN explains that fetch resolves with a Response when a response becomes available. Status codes such as 404 and 504 do not, by themselves, reject that promise. A network failure or an invalid request can reject it instead. The distinction determines which evidence the application has: an HTTP error response can still offer a status and body, while a rejected request may not provide those same details.

## Check ok against the endpoint’s actual contract

Response.ok is true for status codes from 200 through 299. Code can inspect that value and deliberately throw an error, or handle particular statuses without throwing. Useful fetch error handling preserves differences the interface can act on. A missing record, an authentication problem and a temporary service error need not all become “connection lost.” Map those cases using the actual API contract rather than a generic message pasted into every client.

## Reading JSON is a separate asynchronous operation

response.json() returns another promise. MDN documents a SyntaxError when the body cannot be parsed as JSON, so a 200 response can still be followed by a parsing failure. An HTML page from the server will not become valid JSON because the request succeeded. An endpoint whose successful response has no body also needs an appropriate path. Check the expected response format, then validate the fields the application requires after parsing.

## Keep the failing stage visible in fetch error handling

A single catch at the end of a chain may receive a request failure, a deliberately thrown HTTP error, a parsing exception or an error while updating the interface. Preserve the stage and any available status in a controlled error record. Do not copy authentication values or private response contents into ordinary logs. Returning an empty array for every exception can conceal the problem by telling the reader there are no records when the application actually failed to retrieve them.

## Exercise failure paths before calling the feature complete

In an authorized test environment, useful cases include valid JSON, a 404 with a JSON body, an HTML error page, an invalid body and a request without an available response. Check both the displayed message and whether stale or empty data is being presented as a fresh result. These are proposed checks, not completed test results. The retry policy belongs beside fetch error handling, but it needs its own evidence: failure to read a response does not establish that a write never happened on the server.

Identify whether a response arrived, inspect its HTTP status, read its body appropriately, and verify the result the feature needs. When each failure retains its stage, the next maintainer can investigate the connection, endpoint or interface without having to guess what “fetch failed” meant.

Related reading: [An API opens in the browser. Why does fetch still fail with CORS?](https://lijiabao.dev/en/articles/cors-browser-navigation-versus-script-access/) · [An API request timed out. Check the result before retrying.](https://lijiabao.dev/en/articles/api-timeout-retry-idempotency-result-lookup/)
