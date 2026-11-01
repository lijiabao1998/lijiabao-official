---
title: "The First Commit You Can See May Not Be the Project’s Beginning"
description: "Check shallow history, available refs, commit dates and file lineage before using Git to establish a project or article timeline. Publication needs separate evidence."
date: 2026-11-01
tags: ["Git", "Version control", "Engineering records"]
draft: false
sources:
  - title: "Git official documentation"
    url: "https://git-scm.com/docs/git-rev-parse"
  - title: "Git official documentation"
    url: "https://git-scm.com/docs/git-fetch"
  - title: "Git official documentation"
    url: "https://git-scm.com/docs/git-rev-list"
---
## Define the event you are trying to date

A team receives a working checkout of a long-running website. The files look complete, the build succeeds, and the oldest visible commit is surprisingly recent. That date is tempting to place in a handover report as the start of the project. Before doing so, establish what history this checkout actually contains. Git describes the objects and references available to the investigation; it does not automatically reconstruct every earlier repository, import or deployment. The following approach explains the boundaries of that evidence without claiming to have audited a reader’s system.

![A small selected set of archive cards beside a larger collection on a developer desk](../../../assets/articles/git-shallow-history-earliest-commit-verification/en-hero.webp)

The first commit in a repository, the first appearance of a particular article, and the first public release of that article are different events. An investigation becomes much easier when it names the event before selecting a command. A repository created during a migration may contain years of previously published material in its initial import. That import establishes when the material entered this history, not when every page first reached readers.

Likewise, an article may have been committed while still a draft. Its presence in source control does not establish that a production deployment succeeded. Write down the question in terms that the available records can answer. If the goal is publication age, expect to consult more than the commit graph.

## Check whether the checkout is shallow

A shallow clone can contain a complete current working tree while omitting older commit ancestry. This is useful in build environments, but it is a poor basis for an unqualified statement about the beginning of a project. Complete files and complete historical coverage are separate properties.

The documented command `git rev-parse --is-shallow-repository` reports `true` for a shallow repository and `false` otherwise. A `true` result is an immediate reason to qualify the oldest visible record. A `false` result removes that particular limitation, but it does not prove that every remote branch, deleted reference, earlier repository or collaborator’s copy is available. Treat the result as an answer to one precise question rather than a certificate of universal completeness.

## Obtain more history without rewriting it

Git fetch provides options for extending shallow history. In an appropriate checkout, `git fetch --unshallow origin` can request the missing ancestry. First confirm that `origin` is the intended source and that the existing read access is appropriate. A familiar remote name is not evidence of identity.

The source matters too. Git’s documentation distinguishes a complete source from one that is itself shallow. Retrieval can only obtain what the source can supply, subject to access and availability. Record the outcome, rather than equating an attempted command with a complete investigation.

Fetching historical objects is not a reason to discard local edits, reset someone else’s branch or force-push rewritten history. In a shared working directory, preserve existing work and limit operations to the authorized purpose. An investigation should not silently become a repository migration.

## Understand what all references actually covers

The word `all` in a command is easy to overread. For revision traversal, `--all` uses the references available in the local repository. It does not independently contact every remote, search all forks or restore branches that were deleted before this copy was created. A clone that fetched a single branch can therefore provide a narrower view than a maintainer expects.

Choose the relevant branches and tags according to the question, then verify which were obtained. Record the specific commit identities and reference scope used for the conclusion. Keep private connection details out of public reports; reproducibility requires safe identifiers and a clear boundary, not credentials or every internal URL. If an earlier source cannot be accessed, leave that portion unverified instead of silently treating the current copy as exhaustive.

## Separate graph roots from the earliest timestamp

The official revision-list documentation identifies `git rev-list --max-parents=0 --all` as a way to list root commits within the selected traversal. There can be more than one root. A shallow boundary also needs to be understood before a root-like visible result is described as the genuine beginning of the full project.

Graph ancestry and timestamps answer different questions. Author dates and committer dates have different meanings, and imports or recreated commits can make them diverge. Select and name the field being reported. Do not substitute the smallest date for the earliest ancestor without explanation.

Reversing displayed output does not repair an incomplete candidate set. Other filters and count limits still matter; adding `--reverse` to a command normally used for the latest record is not a general method for finding the oldest event across every history.

## Follow the content, not just its current filename

For an article-level question, inspect the relevant path and the changes that introduced or moved it. A folder rename, format conversion or bulk import can make the current path appear much younger than the underlying material. Git offers history-following options for a single file, including `--follow`, but these still require interpretation. They are not a guarantee that every copy, split or substantial rewrite will be recognized as one continuous lineage.

Read the candidate change itself. A message saying “add articles” may describe an import rather than original authorship or publication. When an earlier platform or repository is unavailable, state the earliest record established in the accessible history. Failure to retrieve an older version is not proof that no older version existed.

## Require separate evidence for public release

Source history can establish that content existed in a particular commit. A public-release claim needs evidence that connects source to a successful deployment or another reliable observation of public availability. A date written in article metadata is an editable content field. It may be useful context, but it should not automatically replace execution records.

The same distinction applies in reverse: a page being readable today does not reveal its first public minute. Deployment logs, migration records and other retained evidence may provide different levels of precision. Use the precision those records support. If the strongest conclusion is “present by this commit” or a bounded period, report that rather than inventing an exact day merely to fill a table.

## Deliver a conclusion with a reproducible boundary

A useful handover names the repository, the event being investigated, the available reference scope, the shallow-status result and the relevant full commit identifiers. It also distinguishes completed retrieval from inaccessible sources and missing deployment evidence. Another person should be able to understand both the result and the limit without rerunning an undefined search from scratch.

The aim is not to surround every date with doubt. It is to attach each claim to the evidence that actually supports it. A clearly bounded earliest-known record is valuable. Calling it the universal beginning of a project when the investigation only covered a build checkout is an avoidable overstatement. Resolve the scope first, then choose the date language that scope deserves.

The oldest visible commit is a finding to interpret, not a complete origin story. Check shallow history, available references, file lineage and date semantics, then obtain separate evidence for publication. That sequence produces a timeline a future maintainer can understand and verify.

Related reading: [After git push, verify which commit Cloudflare serves in production](https://lijiabao.dev/en/articles/git-commit-cloudflare-production-verification/); [A secret is in Git history. Why deleting the file does not finish the response](https://lijiabao.dev/en/articles/secret-in-git-history-revocation-and-removal/)
