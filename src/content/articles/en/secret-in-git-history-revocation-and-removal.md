---
title: "A secret is in Git history. Why deleting the file does not finish the response"
description: "Deleting a secret from the latest Git revision does not revoke it. Separate credential invalidation, service recovery, history cleanup, and evidence of what remains unverified."
date: 2026-10-29
tags: ["Web development", "Git", "Software security"]
draft: false
sources:
  - title: "GitHub: Remediating a leaked secret"
    url: "https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret"
  - title: "GitHub: Removing sensitive data from a repository"
    url: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository"
---
A clean latest revision can create false confidence after a credential leak. The file is gone, the build passes, and the incident ticket is ready to close. Yet the issuing service has no reason to invalidate a credential because a repository gained a deletion commit. A useful response separates four questions: whether the old credential works, whether legitimate services have recovered, which retained copies have been addressed, and what evidence is still missing. This article describes a general approach; it does not report an audit or make changes to any real account.

![An abstract branch diagram on a laptop beside a sealed envelope and a physical key](../../../assets/articles/secret-in-git-history-revocation-and-removal/en-hero.webp)

## Identify the credential without distributing it again

Start with its provider, type, owner, and granted permissions. A token for a disposable test resource and a production credential do not have the same consequences, even when both look like long strings in a settings file. Use a safe identifier and an access-controlled reference when coordinating the response. Copying the full value into chat or a ticket creates another place to manage.

Map the known locations: local history, remote branches, build output, or an accidentally shared log. Record unknown coverage honestly. This inventory should guide the work; it should not become a reason to postpone containment until every possible copy has been found.

## Invalidate authority separately from removing text

GitHub's leaked-secret guidance makes clear that deleting code or recreating a repository does not stop a still-valid credential from being used. An authorized owner must revoke or rotate it through the issuing service. Making a repository private can change current visibility, but it does not withdraw access already granted by the old value.

Confirm invalidation using reliable provider information and an approved verification process. Do not paste the credential into random testing tools to see whether it still works. A status update should identify what was confirmed without reproducing the value.

## Recover legitimate services deliberately

A shared credential may serve several environments or jobs. Find the actual consumers rather than assuming that a local configuration change covers production. Supply replacement credentials through the established secret-management mechanism, with the permissions those consumers need. Avoid restoring availability by committing the replacement to the same unsafe location.

The ordering of replacement and revocation depends on the incident and the service's controls. Treat it as an explicit decision. Avoid leaving an exposed credential active indefinitely while waiting for a convenient maintenance window. After the change, verify the intended operation and check that errors, logs, and generated pages do not reveal the replacement.

## Keep the exposure timeline distinct from the discovery time

The moment someone notices a leak is not necessarily when it began. Record the earliest confirmed exposure, the discovery, and the invalidation time as separate facts. If the provider offers relevant activity records, have an authorized person review the appropriate interval and investigate findings through the existing incident process.

Missing or incomplete logs do not prove that nobody used the credential. Conversely, a suspicious-looking event is something to investigate, not automatic proof of a breach. A restrained incident record states the evidence, its coverage, and the next decision without publishing unrelated customer information.

## Decide whether history rewriting serves a remaining goal

Credential invalidation and retention cleanup have different purposes. The former removes authority from the old value. The latter may reduce continued disclosure of sensitive content. Before rewriting history, identify what still needs to be removed, who depends on the repository, and which work must be preserved.

GitHub documents significant coordination costs and changed commit identifiers when history is rewritten. Do not treat a force push as a cosmetic cleanup while collaborators are still advancing branches. Obtain the required authorization, define the scope, and plan the transition. A named tool is not a substitute for a repository-specific plan.

## Account for copies beyond the central branch

A rewritten remote does not silently update every clone, fork, review reference, or saved artifact. Known copies need corresponding handling. Collaborators also need to avoid pushing an old branch back into the cleaned repository. State which locations were addressed and which remain outside your control.

Coordinate using safe references rather than embedding the sensitive content in every notification. Platform support may have a role for particular retained references, subject to its policies. Neither deleting the repository nor changing its visibility provides a universal way to erase downloaded copies.

## Make prevention a tested workflow

Ignore rules help prevent certain untracked files from being added, but they do not remove information that Git already tracks. Keep examples separate from real configuration and use the established credential store. Add appropriately scoped checks to the submission workflow, then verify what they actually detect.

Available scanning and push-protection features vary in coverage and configuration. Confirm what is enabled instead of assuming that platform support means a repository is protected. An absent alert is not a complete security assessment. If a control reports a false positive, resolve it through the defined process rather than making bypassing the normal publishing routine.

## Close each claim with its own evidence

A useful handoff can say that the old credential is confirmed inactive, the affected operation has been verified with the replacement, specified repository references have been cleaned, and particular historical records remain unavailable. Those statements let another person continue from the real boundary.

A search of the latest branch supports only a narrower observation: the searched content was not present there. It does not independently establish invalidation, complete copy removal, or the absence of unauthorized use. Keep these claims separate even when one tool displays a green result.

Removing a file can contribute to cleanup, but it does not revoke a credential. Finish the response by connecting the provider's authority controls, legitimate service recovery, and the stated retention scope. Where evidence ends, preserve an explicit open item instead of letting a clean repository view imply more than it proves.



Related reading: [前端讀不到環境變數，把密鑰改成公開變數也不是解法](https://lijiabao.dev/articles/frontend-public-env-secrets-build-time-boundary/)、[Git push完成後，怎麼確認Cloudflare正式站使用哪個commit](https://lijiabao.dev/articles/git-commit-cloudflare-production-verification/)
