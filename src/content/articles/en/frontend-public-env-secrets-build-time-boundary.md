---
title: "A missing frontend environment variable is not a reason to expose a secret"
description: "Separate browser, build, and server settings before fixing missing values. Public prefixes make values available to client code; they do not protect credentials."
date: 2026-10-24
tags: ["Frontend development", "Deployment", "Security"]
draft: false
sources:
  - title: "Astro — Using environment variables"
    url: "https://docs.astro.build/en/guides/environment-variables/"
  - title: "Vite — Env Variables and Modes"
    url: "https://vite.dev/guide/env-and-mode"
  - title: "Cloudflare Pages — Build configuration"
    url: "https://developers.cloudflare.com/pages/configuration/build-configuration/"
---

A setting works locally, but the deployed page cannot read it. Adding a public prefix may seem like a quick fix. If the value is a service credential, however, that change can turn a configuration error into an exposure. Before changing an environment variable, identify the code that needs it, where that code runs, and whether the value belongs in a browser at all.

![Separate public and private configuration compartments](../../../assets/articles/frontend-public-env-secrets-build-time-boundary/en-hero.webp)

## Locate the code before moving its settings

One repository can contain build scripts, server request handlers, and browser code. Sharing a source tree does not give those components the same environment. Start with the exact read operation and identify its execution context. A static build and a page rendered for each request may consume settings at different times.

A public service address and a private credential for that service are different kinds of information. The browser may legitimately need the address. It does not follow that it should receive the credential with permission to perform privileged operations. Separate the public configuration from the authentication requirement before deciding which part of the application is missing a value.

## A public prefix permits delivery to client code

[Astro's environment variable documentation](https://docs.astro.build/en/guides/environment-variables/) describes the PUBLIC_ prefix for values accessible to client code. [Vite's documentation](https://vite.dev/guide/env-and-mode) explains its default VITE_ prefix. These are tool-specific conventions, so copying a prefix between frameworks is not a general configuration method.

Neither convention encrypts the value. Once a value is included in assets delivered to a browser, a visitor can generally inspect that content. Minification, an unfamiliar variable name, and the absence of a visible label do not provide confidentiality. If a proposed fix requires making a private key public, stop and reconsider where the authenticated operation should happen.

## Static output does not reread every platform setting

Some settings are consumed during a build and written into HTML or JavaScript. Changing a platform variable after deployment does not necessarily change the files already produced. For a static site, check whether a rebuild is required and whether the production build uses the expected branch, mode, and configuration scope.

[Cloudflare Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) is a useful reference for that platform, but build configuration does not establish how every runtime receives values. Functions, adapters, and platform bindings may have separate rules. Read the documentation for the actual deployment model. A local development server reading a setting successfully is evidence about local development, not proof that the deployed application has the same configuration.

## Debug missing values without printing credentials

Check the setting's name, scope, and execution context. When diagnostic output is necessary, record whether the required value exists or passes an expected format check. Avoid printing the value itself, authentication headers, or URLs containing credentials. Temporary debugging output can remain in build logs and later appear in shared screenshots.

Parse types deliberately as well. Tools such as Vite generally provide environment values as strings, so the text false should not be treated as a Boolean without explicit interpretation. Validate required configuration and stop the affected operation when it is absent. A safe error identifying the missing setting is more useful than silently substituting an empty string and producing a confusing downstream failure.

## Server-side access still requires an authorization design

A controlled server can hold the credential and perform the private operation, returning only the result needed by the browser. Creating a proxy endpoint does not automatically make that arrangement safe. The endpoint still needs suitable authentication, authorization, input validation, and resource limits for its purpose.

Consider the response boundary too. Keeping a key out of the frontend bundle does not help if a handler forwards an entire upstream response containing unnecessary private information. Select the fields needed by the client and handle errors without returning a full configuration object. The correct implementation depends on the service contract and deployment environment. This architectural discussion does not claim that a production system has passed a security review.

## A private variable name does not prevent output leaks

A value without a public prefix can still be exposed by application code. A server may insert it into generated HTML, serialize it into client data, or pass it to a component that executes in the browser. Follow the value to its final output instead of relying only on the variable's name.

After a change, inspect relevant build assets, page source, and network responses for values that should remain private. Those checks have limits: failing to find one known string does not prove that every possible disclosure path is absent. If a real credential has been confirmed exposed, revoke or rotate it according to the provider's rules and review its use. Deleting the current file cannot make the old credential secret again.

## Finish with deployment and behavior evidence

Confirm the version and environment used by the build, then inspect the deployed artifacts and the response received by the browser. The [Git commit to Cloudflare production verification guide](/en/articles/git-commit-cloudflare-production-verification/) explains how to keep source, deployment, and public output as separate checks. A passing local test should not stand in for production evidence.

Acceptance should answer concrete questions: Is the public setting correct? Does private authentication stay in the intended environment? Does missing configuration produce a clear response? Can the actual feature finish its work? The distinction between [passing tests and feature acceptance](/en/articles/passing-tests-versus-feature-acceptance-evidence/) applies here too. Reading a value is one step; deciding whether that value belongs in that location is part of the fix.

