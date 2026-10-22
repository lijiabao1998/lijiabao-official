---
title: "Ours or theirs? Read the operation before resolving a Git conflict"
description: "Understand how merge and rebase label conflicting sides, preserve the intent of both changes, and review the staged result before treating a conflict as resolved."
date: 2026-10-22
updated: 2026-10-22
tags: ["Git", "Merge conflicts", "Code review"]
draft: false
sources:
  - title: "Git checkout documentation"
    url: "https://git-scm.com/docs/git-checkout"
  - title: "Git rebase documentation"
    url: "https://git-scm.com/docs/git-rebase"
  - title: "Git status documentation"
    url: "https://git-scm.com/docs/git-status"
  - title: "Git diff documentation"
    url: "https://git-scm.com/docs/git-diff"
---

An editor offers two versions of a file and a convenient button to accept one. The conflict markers disappear, but has the intended work survived? Resolving Git merge conflicts requires a content decision before it becomes a matter of continuing an operation. The labels `ours` and `theirs` describe sides within a particular operation. They are not permanent names for your work and somebody else's work.

![Conceptual workspace for reviewing two branches before merging](../../../assets/articles/git-merge-conflict-ours-theirs-review/en-hero.webp)

## Identify the operation before interpreting the interface

Start with `git status` and establish whether a merge or a rebase is currently paused. Note the starting branch, the integration target, and the work being brought together. Inspecting that state does not select a version, and it does not require restarting the operation to recreate the same screen.

Also identify unrelated, uncommitted work. A conflict is not permission to absorb every change in the working directory into the current task. If another person's edits are present, preserve their boundaries while deciding what the integration actually requires. Labels such as current and incoming should be interpreted alongside the operation and the file contents, rather than by remembering which pane was on the left in another editor. This article describes a review process; it does not claim to have operated on a reader's repository.

## Merge and rebase can assign the sides differently

The [checkout documentation](https://git-scm.com/docs/git-checkout) associates `ours` and `theirs` with stages two and three of an unmerged index entry. During an ordinary merge, the distinction can be understood from the currently checked-out side and the side being merged into it. That intuition needs care during a rebase.

The [rebase documentation](https://git-scm.com/docs/git-rebase) explains that ours is the series reconstructed so far, starting from the upstream side, while theirs is the working-branch side being replayed. Before accepting a version, verify that its contents contain the intended change. Neither label establishes ownership, quality, or a universally safer choice.

## Reconstruct the purpose of both changes

Consider a hypothetical file where one branch corrects an article URL and another adds its English title. Both changes may be necessary. A conflict identifies an integration problem; it does not decide which requirement should disappear. Read the surrounding format and the code that consumes the data, then establish the result each change was meant to produce.

This is an illustrative example, not a reported incident. In an actual task, related commits and existing acceptance criteria can explain what should remain. A newer timestamp alone is not a reason to discard the other side. If the requirements genuinely conflict, obtain the relevant product decision rather than mechanically concatenating two versions or silently cancelling another author's feature.

## Check the scope of a whole-file choice

Selecting an entire side can replace more than the few lines currently attracting attention. Before doing so, inspect the file for independent fixes, data, or language variants that exist only on the other side. Resolve the necessary portions deliberately. Removing conflict markers changes the text state; it does not prove that the resulting feature is complete.

Generated files and dependency lockfiles also need their own repository workflow. Determine their sources and generation rules before deciding whether to regenerate them. A conflict resolution should not quietly become a dependency upgrade or a project-wide rebuild of unrelated output. Keep changes outside the authorized task separate so reviewers can understand what the integration actually changed.

## Review the staged result, then verify the affected behavior

After editing and staging the specific files, inspect `git diff --cached` to see what is prepared for the next commit. A correct-looking working file does not establish that the index contains the same version. `git diff --check` can catch certain textual problems, but it does not validate application logic, editorial meaning, or agreement between translations.

Run the build or checks appropriate to the change and inspect the affected routes or behavior. As explained in [passing tests versus feature acceptance](/en/articles/passing-tests-versus-feature-acceptance-evidence/), verification should name its scope. A successful check cannot establish behavior it never exercised. If unmerged paths remain, report them as unfinished rather than promoting a partial resolution to a completed integration.

## Leave enough context for the next person to continue

A useful handoff records the operation, the files resolved, the requirements retained, and the checks completed. If the task pauses, preserve the state instead of resetting it merely to obtain a clean-looking interface. The person continuing should be able to understand the content decision without reconstructing the entire conversation.

The goal of resolving Git merge conflicts is a coherent result that preserves the intended work. Committing and deployment remain separate stages; [checking the production version](/en/articles/git-commit-cloudflare-production-verification/) describes that later boundary. Keeping the content decision, version delivery, and public verification distinct makes it easier to identify the missing step when something still behaves incorrectly.
