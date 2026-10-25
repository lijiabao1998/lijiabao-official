---
title: "An API opens in the browser. Why does fetch still fail with CORS?"
description: "Opening a URL and allowing a website to read its response are different operations. Trace origins, preflights, credentials and opaque responses without confusing browser access with backend authorization."
date: 2026-10-25
tags: ["Web development", "API", "Browser security"]
draft: false
sources:
  - title: "MDN — Cross-Origin Resource Sharing"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS"
  - title: "MDN — Same-origin policy"
    url: "https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy"
  - title: "MDN — Request mode"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Request/mode"
  - title: "Fetch Standard — CORS protocol"
    url: "https://fetch.spec.whatwg.org/#http-cors-protocol"
---

An API URL displays data when opened directly, yet a website calling the same URL cannot read the result. Both observations can be correct. Navigating to a document and giving another website's JavaScript access to its response are different operations. A useful investigation starts by identifying which page initiates the request and which code needs the response, rather than repeatedly opening the endpoint in another tab.

![Abstract separation between two browser origins and a response boundary](../../../assets/articles/cors-browser-navigation-versus-script-access/en-hero.webp)

## Compare origins before comparing application names

An origin combines the scheme, host and port. The [MDN same-origin policy guide](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy) explains this boundary. Changing a path generally does not create a different origin; changing a host, scheme or port can. Two development services on the same computer may therefore be cross-origin even when one team owns both.

Write down the origin actually shown in the application's address bar and the endpoint actually requested. Include any redirect destination. A shared company name, repository or login does not answer this question. This small inventory also prevents a development URL from being mistaken for the production caller when reviewing server settings.

## Direct navigation does not test script access

The address bar can navigate to a JSON document without granting the previous page access to it. A person being able to visit another site does not imply that every open site can read that site's data. Reproduce the failure from the real application and inspect its request, rather than treating a separate tab as a substitute.

A command-line client is another distinct test environment. Its successful response can establish reachability under those conditions, but it does not demonstrate that browser code can consume the response. Record the client, account and action used for each check. Otherwise several individually accurate observations can produce an inaccurate claim that the integration works.

## A preflight is conditional, not a universal first request

The [MDN CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) describes the preflight exchange used for certain cross-origin requests. The browser may send OPTIONS to ask whether the intended method and headers are permitted. Requests meeting the relevant conditions can proceed without that exchange, and previously obtained preflight permission may be cached.

Absence of OPTIONS therefore does not, on its own, establish a defect. Inspect the actual method, headers and content type. If a preflight fails, examine that response rather than changing only the API's normal success response. Keep the reproduction conditions clear so that a cached result is not mistaken for evidence of a new configuration.

## An unreadable response does not prove that nothing happened

Some requests reach the server and cause a change even though browser checks prevent JavaScript from reading the response. In a different case, an unsuccessful preflight can stop the intended request from being sent. The same broad category of console message cannot establish which sequence occurred.

For a booking, notification or record creation, check the server result using safe identifiers before trying again. Repeatedly pressing Submit can create duplicate work while the interface still reports failure. Separate evidence about execution from evidence about reading the result. Where an operation must tolerate retries, the application also needs an appropriate design for preventing duplicate effects.

## Credentials need an intentional origin policy

Credentialed cross-origin access requires compatible client behavior and server responses. The [Fetch Standard's CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol) specifies how these checks interact. In a credentials-including request, a wildcard allowed origin is not a general solution. The service owner must decide which origins should be allowed and configure the response accordingly.

Cookie attributes, third-party cookie restrictions and the current login state introduce additional conditions. Fixing CORS does not prove that the expected authentication information is attached. Check those questions separately, using an account appropriate for the test. Avoid copying a broad allow-all example merely because it removes one error in a local environment.

## No-cors does not turn an API into readable JSON

[MDN's Request.mode reference](https://developer.mozilla.org/en-US/docs/Web/API/Request/mode) distinguishes the modes available to a request. Setting no-cors is not an instruction to bypass browser security and expose another origin's response. The request has restrictions, and its cross-origin response is normally opaque to the calling code.

If the feature needs to read JSON and render it, an unreadable response does not meet the requirement. Correct the configuration of a service you are authorized to manage, or assess an appropriate server-side integration. A server intermediary still needs authorization and controlled destinations; it should not become an unrestricted proxy. Removing a console message is not equivalent to making the data flow work.

## Follow the failing response to the component that produced it

Inspect the browser's network record for the caller origin, request method, response status and relevant headers. Distinguish preflight traffic from the intended operation. Keep cookies and authentication values out of public screenshots. Then identify the components involved, which may include the application, a reverse proxy and an edge service.

An error response or redirect can behave differently from the normal success response. A server failure can therefore appear alongside a CORS message and needs its own investigation. Make changes at the responsible configuration point and avoid conflicting duplicate headers. Disabling the user's browser security is not a production fix, even if it temporarily changes a developer's local result.

## Verify the browser flow and backend authorization separately

Return to the intended page with an appropriate account. Confirm that code can read the required data, the interface displays the correct result, and failure states remain understandable. A 200 entry in a network panel is only one observation. The distinction between [passing tests and feature acceptance evidence](/en/articles/passing-tests-versus-feature-acceptance-evidence/) helps keep the final conclusion tied to what was actually exercised.

CORS governs browser access to cross-origin responses. It does not replace the API's authentication and authorization checks. An allowed origin does not entitle every caller to every record, and a browser refusing access does not protect an otherwise unguarded endpoint from other clients. Verify readable responses, permitted identities and correct data as separate parts of the same integration.
