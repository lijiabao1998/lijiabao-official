---
title: "After git push, verify which commit Cloudflare serves in production"
description: "Match the remote commit, Cloudflare build and deployment, and exact production page before reporting a publication as complete."
date: 2026-10-21
updated: 2026-10-21
tags: ["Cloudflare", "Deployment verification", "Git"]
draft: false
sources:
  - title: "Cloudflare Pages Git integration"
    url: "https://developers.cloudflare.com/pages/configuration/git-integration/"
  - title: "Cloudflare Workers Builds"
    url: "https://developers.cloudflare.com/workers/ci-cd/builds/"
  - title: "Cloudflare Pages preview deployments"
    url: "https://developers.cloudflare.com/pages/configuration/preview-deployments/"
---

A new article has reached GitHub and a Cloudflare job shows a green status, yet the public website still displays yesterday's content. Creating the article again is a poor first response. Reconcile three separate observations instead: the remote Git branch, the platform build and deployment, and the exact domain readers use. Each can succeed while another remains incomplete. This is a verification method, not a claim that these checks or any cache changes have been performed on a reader's project.

![Conceptual repository and public website views connected by a version reference](../../../assets/articles/git-commit-cloudflare-production-verification/en-hero.webp)

## Preserve the exact commit intended for delivery

Record the repository, branch, and full commit identifier. A file in a working directory is not necessarily committed, and a local commit is not necessarily present on the remote branch. Check that the intended article and new assets belong to the recorded commit, then confirm the remote received it. A short identifier in an unlabeled screenshot leaves unnecessary ambiguity about both repository and revision.

If another contributor has advanced the remote, keep the original identifier and establish whether the newer history includes the intended change. Do not reset the branch simply to make two displayed values match. Uncommitted files call for reviewing the authorized change set, not repeating a push. A publication can add its own content without rewriting existing articles to manufacture a fresh revision.

## Identify the actual Cloudflare project and production branch

Cloudflare Pages Git integration can create preview deployments for branches as well as provide build status information. A working preview does not establish that the production domain has changed. Verify the project, connected repository, and production branch before interpreting a successful job. Two projects with similar names can both report success while only one serves the domain under review.

Workers Builds is a different build and deployment path. Determine which product the site actually uses and inspect its corresponding records. Do not apply Pages assumptions to every site hosted by Cloudflare. This reconciliation is normally a read of existing configuration; it does not require reconnecting a repository, creating a replacement project, or moving a domain merely to check a content release.

## Connect the build record to the commit and deployment outcome

Inspect the source revision, timing, and final outcome of the relevant build. Dependency installation, compilation, and deployment are different stages. A successful message from the middle of a log cannot stand in for the final delivery outcome. Where deployment has a separate record, preserve that association as well, so the reported result refers to the artifact that was actually released.

A project may have automatic deployments disabled or branch rules that do not trigger the expected job. The absence of a matching build is then an unresolved observation, not evidence that pushing silently deployed the change. If a job fails, address the failing step. Duplicating the article at a second URL introduces another variable without explaining why the original revision did not reach production.

## Read unique content at the production URL

After matching platform records, request the precise public URL, including its language path and trailing-slash convention. Inspect the main heading, a distinctive body passage, the image, and relevant links. A title found in a navigation card is not enough. The related article on [successful responses and real article content](/en/articles/http-success-article-verification/) explains why a successful status code still needs content evidence.

If the build is current but the public page is old, record the observation time and inspect the actual domain, redirects, and response. Caching is one possible layer to investigate, not an automatic diagnosis. A preview domain, another subdomain, or a different route may explain the discrepancy. Make only an authorized, relevant change after establishing the cause, then read the result again before declaring recovery.

## Respect the limits of a page without a revision marker

A public page may not expose its commit identifier. Reading the new article proves that readers can obtain that content; by itself, it may not prove that the entire website was produced exclusively from one particular commit. Use the platform record to connect the delivered content to its source, and state what each observation establishes. If the platform association cannot be verified, keep that layer unresolved.

A non-sensitive build identifier could improve future traceability, but adding one is a separate product or deployment change. It should not slip into an ordinary article publication. Such a marker must not contain credentials, private configuration, or a dump of environment variables. An untested marker proposal also cannot be described as an already operational verification feature.

## Report three outcomes and retry only the missing work

A compact handoff can state that the remote commit was confirmed, its matching build and deployment completed, and the public article body and image were read back. Name any unresolved layer and the next check. Read both language editions independently; a correct Chinese page does not prove the English route is correct. Search indexing remains a separate state from successful publication.

When only log synchronization failed, synchronize the log. When an existing build is still running, inspect that job. When an image is missing, check the assets associated with the delivered revision. None of these observations automatically calls for recreating content. As with [feature acceptance beyond passing tests](/en/articles/passing-tests-versus-feature-acceptance-evidence/), the useful handoff preserves evidence boundaries so the next person can continue from the real gap.
