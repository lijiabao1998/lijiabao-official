---
title: "What is llms.txt? Format, examples and what Google says"
description: "llms.txt is a proposed Markdown index of a site's key pages for AI agents. This guide covers the format, robots.txt, Google's stance and a live example."
date: 2026-10-13
tags: [llms.txt, SEO, GEO, robots.txt, AI crawlers]
draft: false
sources:
  - title: "llmstxt.org — The /llms.txt file, v2 (Jeremy Howard)"
    url: https://llmstxt.org/
  - title: "llmstxt.org — Changes (v2, August 2026)"
    url: https://llmstxt.org/changes.md
  - title: "Answer.AI — /llms.txt—a proposal to provide information to help LLMs use websites (2024-09-03)"
    url: https://www.answer.ai/posts/2024-09-03-llmstxt.html
  - title: "Google Search Central Blog — A new resource for optimizing for generative AI in Google Search (2026-05-15)"
    url: https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing
  - title: "Google Search Central — Google's Guide to Optimizing for Generative AI Features on Google Search (llms.txt note added 2026-06-15)"
    url: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
  - title: "Google — Google's common crawlers (Google-Extended)"
    url: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
  - title: "Google — How Google interprets the robots.txt specification"
    url: https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
  - title: "Chrome for Developers — Lighthouse audit: llms.txt"
    url: https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt
  - title: "GoogleChrome/lighthouse — llms-txt.js (audit source)"
    url: https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/agentic/llms-txt.js
  - title: "GoogleChrome/lighthouse — llms-txt.js (gatherer: fetches /llms.txt at the origin root)"
    url: https://github.com/GoogleChrome/lighthouse/blob/main/core/gather/gatherers/agentic/llms-txt.js
  - title: "GoogleChrome/lighthouse — default-config.js (Agentic Browsing category)"
    url: https://github.com/GoogleChrome/lighthouse/blob/main/core/config/default-config.js
  - title: "GoogleChrome/lighthouse — Changelog (13.2.0, 13.3.0, 13.5.0)"
    url: https://github.com/GoogleChrome/lighthouse/blob/main/changelog.md
  - title: "Search Engine Journal — Google Says LLMs.Txt Comparable To Keywords Meta Tag (2025-04-17)"
    url: https://www.searchenginejournal.com/google-says-llms-txt-comparable-to-keywords-meta-tag/544804/
  - title: "Search Engine Roundtable — Google Says No AI System Currently Uses LLMs.txt (2025-06-18)"
    url: https://www.seroundtable.com/google-ai-llms-txt-39607.html
  - title: "Search Engine Roundtable — Google Says It Makes Sense To Noindex LLMs.txt (2025-07-22)"
    url: https://www.seroundtable.com/google-noindex-llms-txt-39798.html
  - title: "Search Engine Roundtable — Google Adds LLMs.txt To Search Developer Docs Portal (2025-12-03)"
    url: https://www.seroundtable.com/google-adds-llms-txt-to-search-developer-docs-40533.html
  - title: "Search Engine Journal — Google's llms.txt Guidance Depends On Which Product You Ask (2026-05-20)"
    url: https://www.searchenginejournal.com/googles-llms-txt-guidance-depends-on-which-product-you-ask/575431/
  - title: "Search Engine Journal — Google's Mueller Says llms.txt Can't Help LLMs Differentiate Sites (2026-06-15)"
    url: https://www.searchenginejournal.com/googles-mueller-says-llms-txt-cant-help-llms-differentiate-sites/579304/
  - title: "Search Engine Journal — Google Answers Question About LLMs-Author.txt For SEO (2026-07-06)"
    url: https://www.searchenginejournal.com/google-answers-question-about-llms-author-txt-for-seo/581547/
  - title: "SE Ranking — Does LLMs.txt impact your AI visibility and citations? No, according to research (2025-11-07)"
    url: https://seranking.com/blog/llms-txt/
  - title: "Ahrefs — We Analyzed 137K Sites: 97% of llms.txt Files Never Get Read (2026-06-15)"
    url: https://ahrefs.com/blog/llmstxt-study/
  - title: "Common Crawl — A Content Analysis of llms.txt Files from the July 2026 Crawl Archive (2026-08-31)"
    url: https://commoncrawl.org/blog/a-content-analysis-of-llms-txt-files-from-the-july-2026-crawl-archive
  - title: "HTTP Archive — Web Almanac 2025, SEO chapter (2026-01-15)"
    url: https://almanac.httparchive.org/en/2025/seo
  - title: "Mintlify Docs — llms.txt"
    url: https://www.mintlify.com/docs/ai/llmstxt
  - title: "Mintlify — Anthropic customer story"
    url: https://www.mintlify.com/customers/anthropic
  - title: "Mintlify — How often do LLMs visit llms.txt? (2025-06-27)"
    url: https://www.mintlify.com/blog/how-often-do-llms-visit-llms-txt
  - title: "OpenAI — Overview of OpenAI Crawlers"
    url: https://developers.openai.com/api/docs/bots
  - title: "Anthropic — Does Anthropic crawl data from the web, and how can site owners block the crawler?"
    url: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
  - title: "RFC 9309 — Robots Exclusion Protocol (IETF, 2022-09)"
    url: https://www.rfc-editor.org/rfc/rfc9309
  - title: "sitemaps.org — Sitemaps XML format (protocol 0.90)"
    url: https://www.sitemaps.org/protocol.html
  - title: "Cloudflare — Giving users choice with Cloudflare's new Content Signals Policy (2025-09-24)"
    url: https://blog.cloudflare.com/content-signals-policy/
  - title: "Cloudflare Docs — Managed robots.txt"
    url: https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
  - title: "IETF — draft-ietf-aipref-attach (Content-Usage), Internet-Draft"
    url: https://datatracker.ietf.org/doc/draft-ietf-aipref-attach/
  - title: "Yoast — llms.txt"
    url: https://yoast.com/features/llms-txt/
  - title: "PyPI — llms-txt (reference parser, 0.0.7, 2026-09-24)"
    url: https://pypi.org/project/llms-txt/
  - title: "Aggarwal et al. — GEO: Generative Engine Optimization (arXiv:2311.09735, 2023)"
    url: https://arxiv.org/abs/2311.09735
  - title: "lijiabao.dev — llms.txt"
    url: https://lijiabao.dev/llms.txt
  - title: "lijiabao.dev — robots.txt"
    url: https://lijiabao.dev/robots.txt
---

llms.txt is a Markdown file, usually served at `/llms.txt`, that gives large language models (LLMs) and AI agents a short, curated list of a site's most useful pages, each with a one-line description. Jeremy Howard of Answer.AI proposed it on 2024-09-03, and the spec at [llmstxt.org](https://llmstxt.org/) reached v2 in August 2026. It is a community proposal, not an official standard. It does not control crawler access, it does not guarantee rankings or AI citations, and Google Search ignores it.

This guide covers the format, a template, the difference from robots.txt, what Google and AI vendors have said, and [this site's llms.txt](https://lijiabao.dev/llms.txt) as a working example. Facts are as of 2026-10-13.

## What is llms.txt? The short version

- **What it is:** a reading list for AI: the site's name, a one-line summary and grouped links to key pages, each with a note.
- **Who and when:** Jeremy Howard, co-founder of Answer.AI and fast.ai, published the proposal on the [Answer.AI blog](https://www.answer.ai/posts/2024-09-03-llmstxt.html) on 2024-09-03. The spec is now titled "The /llms.txt file, v2".
- **Status:** the spec calls itself an "informal overview" open to community input. It is not an IETF RFC or a W3C standard.
- **Why it exists:** HTML carries navigation, ads and JavaScript, and a whole site rarely fits in a context window.

The spec expects it to be used mainly at inference time, by agents helping users, rather than for training.

![Structure of an llms.txt file, shown on a sample file at example.com/llms.txt, in the order the spec requires: 1, an H1 with the site or project name, the only required part; 2, a blockquote summary starting with >, optional and best kept to one line; 3, optional notes in plain Markdown with no headings; 4, optional H2 sections, any number of them, each a list of Markdown links, a name and a URL, optionally followed by a colon and notes; 5, an optional H2 named Optional for secondary links, which since v2 is only a convention. Based on the llmstxt.org v2 spec (August 2026).](../../../assets/articles/what-is-llms-txt/fig-llms-txt-anatomy-en.png)

<small>The structure of llms.txt: only the H1 is required, but the sections must come in this order (llmstxt.org v2).</small>

## The llms.txt format (spec v2)

### Sections and their order: only the H1 is required

| Order | Section | Required? | Content |
| --- | --- | --- | --- |
| 1 | H1 (`#`) | Yes, the only required part | Site or project name |
| 2 | Blockquote (`>`) | No | A short summary |
| 3 | Plain Markdown | No | Notes and caveats; **no headings** |
| 4 | H2 (`##`) sections | No | Link lists: `- [name](url)`, optionally `: notes` |

A byte-order mark (BOM) at the start is allowed; that line joined the spec in June 2026.

### How to write the links

Each list item needs a `[name](url)` link, optionally followed by a colon and a note. The spec asks for concise, clear language, an informative note per link and no unexplained jargon. Link to Markdown versions of pages, not heavy HTML.

### The Optional section

An H2 named `## Optional` holds secondary links. In v1 (2024), tools could skip it when they needed a shorter context. The [v2 change notes](https://llmstxt.org/changes.md) make it a convention with no mechanical meaning, because the context-expansion tool `llms_txt2ctx` is no longer part of the proposal. That tool still exists and still skips Optional by default.

### Where the file goes: the root or a subpath

Most sites use `/llms.txt`. The spec has allowed a subpath such as `/docs/llms.txt` since v1, and v2 defines what that means: a file covers the pages under its path, and when several apply, agents should use the most specific one. The spec considered `/.well-known/` (RFC 8615) and passed on it, because it exists only at the origin root, and many authors control only a path, such as a GitHub Pages project site. Note that Chrome Lighthouse checks only `/llms.txt` at the root.

## llms.txt example: a template you can copy

A minimal llms.txt example for a fictional project on example.com:

```markdown
# Example Docs

> Example is an open-source image compression library. This file lists the Markdown versions of its install, configuration and API docs.

All commands are for version 2.x. Figures are as of 2026-10-01.

## Get started

- [Install](https://example.com/docs/install.md): System requirements and three ways to install
- [Quickstart](https://example.com/docs/quickstart.md): Compress your first image in five minutes
- [Configuration](https://example.com/docs/configuration.md): Every option, with its default and an example

## API

- [API reference](https://example.com/docs/api.md): Every function, parameter and return value
- [Error codes](https://example.com/docs/errors.md): What each error code means and how to fix it

## Optional

- [Changelog](https://example.com/changelog.md): Changes in every release
- [Sitemap](https://example.com/sitemap.xml): Every URL on the site
```

### What real llms.txt files look like

Live checks on 2026-10-13 show wide variation. Anthropic's docs file (about 82.9 KB) has no blockquote. Stripe's (about 92.5 KB) has an Optional section. Cloudflare's root file points to per-product files such as `/workers/llms.txt`. web.dev, a Google property, has no H1 at all, and its first list item lacks a `[name]`. Publishing a file is not the same as following the format.

## llms-full.txt and per-page Markdown: what's in the spec and what isn't

### Markdown versions of pages

The proposal asks for a clean Markdown copy of each page. v1 appends `.md` to the full URL (`page.html.md`, or `index.html.md`); v2 also allows replacing the extension (`page.md` or `index.md`).

### How agents find them: rel="alternate" and rel="describedby"

v2 adds two link relations, as an HTML `<link>` element or an HTTP `Link:` header:

- `rel="alternate" type="text/markdown"` points from a page to its Markdown version.
- `rel="describedby"` points from a page to the llms.txt that covers it.

The header also works for non-HTML resources and can be set at the server or CDN. The spec's example:

```text
Link: </docs/page.html.md>; rel="alternate"; type="text/markdown", </docs/llms.txt>; rel="describedby"
```

This site found no evidence yet that agents follow `rel="describedby"` in practice, and Lighthouse doesn't test it.

### llms-full.txt is a convention, not part of the spec

No version of the spec defines llms-full.txt. In the llmstxt.org repository the name appeared only in a directory table, added on 2024-11-21 and removed three days later. It is a docs-platform convention: a whole docs site in one Markdown file. [Mintlify](https://www.mintlify.com/docs/ai/llmstxt) generates both files and [says](https://www.mintlify.com/customers/anthropic) it developed the format with its customer Anthropic; that is Mintlify's account.

On 2026-10-13, llms-full.txt measured about 43.4 MB on platform.claude.com, 67.7 MB on developers.cloudflare.com and 10.4 MB on vercel.com/docs, far beyond a typical context window. v2 takes the opposite approach: llms.txt stays small enough to fit in context, and the detail sits behind links.

## llms.txt vs robots.txt vs sitemap.xml

| | robots.txt | sitemap.xml | llms.txt |
| --- | --- | --- | --- |
| Job | Asks crawlers not to fetch (or allows) URLs | Lists URLs to discover | Curates key content for AI, with notes |
| Status | IETF RFC 9309 (2022, Proposed Standard) | sitemaps.org protocol 0.90 | Community proposal (2024) |
| Location | `/robots.txt` at the host root | Any URL, often declared in robots.txt | `/llms.txt`, or a subpath (scope defined in v2) |
| Format | `User-agent` groups with `Allow`/`Disallow` | XML (`urlset`, `url`, `loc`) | Markdown: H1, blockquote, H2 link lists |
| Can it restrict access? | No; a request | No; a hint | No; it only describes |
| Effect on Google Search | Controls Googlebot crawling | Helps discovery | None; Search ignores it |

The llms.txt spec draws the same line: robots.txt says what automated access is acceptable, while llms.txt is read on demand. A [sitemap](https://www.sitemaps.org/protocol.html) can't replace it, the spec adds, because it often lacks LLM-readable versions, omits external URLs and is too large for a context window.

![How search engines and AI agents read a site. At the top, robots.txt states crawl preferences (RFC 9309). Left, a search engine: the Sitemap: line in robots.txt points to sitemap.xml, a URL list that is only a hint; it fetches the listed HTML pages and indexes them. A note says Google states that Google Search doesn't use llms.txt and that it neither helps nor harms visibility or rankings. Right, labeled as the flow llms.txt v2 recommends, an AI agent looking things up for a user: whether it follows robots.txt depends on the vendor, and user-triggered fetches may not; from a web page it finds llms.txt through a Link header or an HTML link element with rel set to describedby, or it requests /llms.txt directly; it reads this short index of key pages, then fetches only the Markdown pages it needs, such as page.md or index.md. Bottom: llms.txt cannot restrict access; access preferences go in robots.txt, and robots.txt itself is only a request, not access authorization.](../../../assets/articles/what-is-llms-txt/fig-llms-agent-flow-en.png)

<small>robots.txt holds crawl preferences and sitemap.xml lists URLs for search engines. The right side is the flow llms.txt v2 recommends, not measured agent behavior.</small>

### Want to limit AI training or AI answers? Use robots.txt

llms.txt is a reading list, not a permission file, so `User-agent` or `Disallow` lines in it do nothing. Set training preferences per crawler in robots.txt:

- **OpenAI:** `GPTBot` collects content that may be used for training; `OAI-SearchBot` serves ChatGPT search. For the user-triggered `ChatGPT-User`, [OpenAI says](https://developers.openai.com/api/docs/bots) robots.txt rules "may not apply".
- **Anthropic:** `ClaudeBot` (training), `Claude-User` (fetches for a user's question) and `Claude-SearchBot` (search). [Anthropic says](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) all three honor robots.txt.
- **Google:** `Google-Extended` is a product token with no crawler of its own. It covers Gemini training and grounding, and [Google says](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) it doesn't affect Google Search.

Cloudflare's [Content Signals](https://blog.cloudflare.com/content-signals-policy/) (2025-09-24) add a `Content-Signal:` line with `search`, `ai-input` (real-time use such as RAG) and `ai-train` preferences. Cloudflare calls them preferences, not blocks. The related IETF aipref work (`Content-Usage`) is still an Internet-Draft.

```text
# Example: allow search, opt out of training (Google-Extended also covers Gemini grounding)
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
Disallow: /

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /

Sitemap: https://example.com/sitemap.xml
```

Disallowing `Google-Extended` also opts your content out of grounding in Gemini Apps and Grounding with Google Search on Vertex AI. It does not affect Google Search.

Two caveats. [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309) says robots.txt rules are "not a form of access authorization"; real blocking needs authentication or a firewall. And Google [reads only](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec) `user-agent`, `allow`, `disallow` and `sitemap`, so it ignores `Content-Signal`; Search Console may flag the line, and [Cloudflare reports](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/) no crawl or SEO impact.

## Does Google use llms.txt?

### Google Search: no, and having one neither helps nor hurts

Google [announced](https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing) its guide to optimizing for generative AI features on 2026-05-15; it already listed llms.txt among things Search doesn't need. On 2026-06-15 the [guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) gained a note: you don't need AI text files or Markdown to appear in Google Search, including its AI features, because Search doesn't use them; keeping llms.txt for other services is fine and neither harms nor helps rankings. The guide tells site owners to prefer effective SEO over "AEO/GEO hacks". The term GEO comes from a [2023 paper](https://arxiv.org/abs/2311.09735).

### What Google staff have said

Google's John Mueller has commented several times:

- **Reported 2025-04-17** (Reddit): he knew of no AI service that said it uses llms.txt, and compared it to the keywords meta tag ([SEJ](https://www.searchenginejournal.com/google-says-llms-txt-comparable-to-keywords-meta-tag/544804/)).
- **2025-06-17:** no AI system currently uses llms.txt ([SER](https://www.seroundtable.com/google-ai-llms-txt-39607.html)).
- **2025-07-22:** noindex could make sense, since linked files can get indexed ([SER](https://www.seroundtable.com/google-noindex-llms-txt-39798.html)).
- **Reported 2026-06-15,** *Search Off the Record* (Google's podcast): it can't help an LLM choose between sites, but might help an agent already on one ([SEJ](https://www.searchenginejournal.com/googles-mueller-says-llms-txt-cant-help-llms-differentiate-sites/579304/)).
- **Reported 2026-07-06** (Reddit): Google uses neither llms.txt nor llms-author.txt, and he knew of no crawler or LLM confirming it uses them, other than SEO tools ([SEJ](https://www.searchenginejournal.com/google-answers-question-about-llms-author-txt-for-seo/581547/)).

These are staff statements; the guide is official.

### Chrome Lighthouse: an optional llms.txt audit

Lighthouse, a separate Google product, differs. Per its [changelog](https://github.com/GoogleChrome/lighthouse/blob/main/changelog.md), 13.2.0 (2026-04-30) implemented an [llms.txt audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt), 13.3.0 (2026-05-07) added the Agentic Browsing category to the default config, and 13.5.0 (2026-09-17) grouped the audit under "agent discovery". The source code shows:

- The [gatherer](https://github.com/GoogleChrome/lighthouse/blob/main/core/gather/gatherers/agentic/llms-txt.js) fetches only `/llms.txt` at the origin root.
- The [audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/agentic/llms-txt.js) wants an H1, a Markdown link and 50+ characters. A 5xx, a 429 or a failed fetch scores 0; a 404 or other 4xx is "not applicable".
- The [category](https://github.com/GoogleChrome/lighthouse/blob/main/core/config/default-config.js) is scored as a fraction of audits passed, is described as still under development and subject to change, and is separate from SEO. It doesn't test the v2 link relations.

### Google's own llms.txt files

On 2025-12-03 an llms.txt appeared in the Search Central docs and was removed the same day ([SER](https://www.seroundtable.com/google-adds-llms-txt-to-search-developer-docs-40533.html)); it was still 404 on 2026-10-13. Files on developer.chrome.com, web.dev and the Gemini API docs remain; as [SEJ put it](https://www.searchenginejournal.com/googles-llms-txt-guidance-depends-on-which-product-you-ask/575431/), Google's guidance depends on the product.

![What Google has said about llms.txt, as of 2026-10-13. Google Search and Chrome Lighthouse are separate products with separate guidance. April 2025: John Mueller said on Reddit that, as far as he knew, no AI service had said it uses llms.txt, and compared it to the keywords meta tag (a personal remark). July 2025: Mueller said sites might link to llms.txt and get it indexed, confusing users, so adding noindex could make sense (a personal remark). 2025-12-03: an llms.txt appeared at developers.google.com/search/docs/llms.txt and was removed the same day; it still returned 404 on 2026-10-13. 2026-05-07: Chrome Lighthouse 13.3.0, a separate product, added the Agentic Browsing category, with an llms.txt audit, to its default config; a site without the file (404) is marked not applicable, and the category is separate from SEO. 2026-05-15: Google published its guide to optimizing for generative AI features in Search, which listed llms.txt among tactics Search doesn't need. 2026-06-15: the guide added a note that Google Search doesn't use llms.txt, that keeping one for other services is fine, and that it neither helps nor harms visibility or rankings; this is the current official position.](../../../assets/articles/what-is-llms-txt/fig-google-llms-timeline-en.png)

<small>Google's answer depends on the product: Search does not use llms.txt, while Chrome Lighthouse has an optional llms.txt audit.</small>

## Do ChatGPT, Claude and Perplexity read llms.txt?

### Publishing llms.txt is not the same as reading yours

OpenAI, Anthropic, Perplexity and Google publish llms.txt for their own docs, but their crawler docs discuss robots.txt only. As of 2026-10-13, this site found no on-record statement from any of them that they use other sites' llms.txt files.

### What the data shows

| Source (date) | Population | Finding | Caveat |
| --- | --- | --- | --- |
| [Web Almanac 2025](https://almanac.httparchive.org/en/2025/seo) (2026-01-15) | HTTP Archive crawl | Valid llms.txt on 2.13% of desktop sites; 39.6% of files trace to All in One SEO, 3.6% to Yoast | Plugin defaults |
| [SE Ranking](https://seranking.com/blog/llms-txt/) (2025-11-07) | ~300,000 domains | 10.13% have one; no correlation with AI citations | SEO-tool vendor |
| [Ahrefs](https://ahrefs.com/blog/llmstxt-study/) (2026-06-15) | 137,210 domains, May 2026 | 28% have one; 97% of those got no requests; named AI bots made 19.5% of requests | Technical customer base, so 28% is an upper bound; fetched is not used |
| [Mintlify and Profound](https://www.mintlify.com/blog/how-often-do-llms-visit-llms-txt) (2025-06-27) | 25 companies, 7 days of CDN logs | Median 14 visits to llms.txt, 79 to llms-full.txt | Vendor marketing; tiny sample |
| [Common Crawl](https://commoncrawl.org/blog/a-content-analysis-of-llms-txt-files-from-the-july-2026-crawl-archive) (2026-08-31) | July 2026 crawl, 584,107 files | 11.72% of sampled `/llms.txt` fetches returned a text file; 49.90% follow the full shape; 68.27% are templated (Wix alone 41.34%) | Hosts it could fetch; one crawl |

Figures range from about 2% to 28% because the populations differ; plugin defaults inflate them.

### Where it is used most: coding agents and docs tools

The v2 spec says llms.txt files are used most heavily for software documentation, where coding agents follow them to API references and tutorials. The spec author also writes in the v2 change notes that coding agents use these files reliably. In Ahrefs' data, Anthropic's coding agent Claude-Code was second only to GPTBot in llms.txt requests, ahead of every AI search and assistant bot. The payoff is agents reading docs for users, not rankings.

## How to create an llms.txt file in 7 steps

1. **Pick the scope:** the whole site at `/llms.txt`, or a section such as `/docs/llms.txt`.
2. **Write the H1:** the site or project name, the only required part.
3. **Add a one-line `>` summary.** The reference parser keeps only the first `>` line.
4. **Optionally add notes** in plain text, such as the date of your figures. No headings.
5. **Group links under H2s,** one `- [Name](URL): note` per line, pointing to Markdown versions. Secondary links go under `## Optional`.
6. **Serve `.md` versions and announce them** with `<link rel="alternate" type="text/markdown">` and a `Link: <…/llms.txt>; rel="describedby"` header.
7. **Generate it at build time and test it,** from the same source as your pages, so it stays in step with them.

### llms.txt generators and plugins

Yoast SEO has a built-in generator that [Yoast says](https://yoast.com/features/llms-txt/) is free for everyone. AIOSEO, Wix, Mintlify, GitBook, VitePress and Docusaurus plugins, Drupal's LLM Support and llms-txt-php also generate one; llmstxt.org lists more. Much of the web's llms.txt comes from plugin defaults, so review the descriptions before you publish.

### How to test your llms.txt

```text
curl -I https://example.com/llms.txt
```

- Expect `200` with `text/plain` or `text/markdown`. The spec doesn't mandate a type, but `text/html` usually means your app shell is answering. Also check that the body is your index, not your app shell or robots.txt.
- Run Lighthouse's Agentic Browsing audit, or parse the file with the reference [`llms-txt`](https://pypi.org/project/llms-txt/) package (0.0.7, 2026-09-24).
- Try the spec's test: give an agent only your llms.txt and ask it about your site.

## Common llms.txt mistakes

- **No H1, or links without a `[name]`**, as on web.dev (2026-10-13). Both break the reference parser.
- **A multi-line summary**, or **headings in the notes** and H3s in link lists.
- **HTML served at `/llms.txt` with status 200.** In Common Crawl's July 2026 crawl, 40.36% of successful responses at `/llms.txt` and `/llms-full.txt` were HTML, which Common Crawl attributes to single-page apps whose catch-all route serves the app shell, and 10.61% were robots.txt files. Separately, 22.56% of text files had no links.
- **Access rules in llms.txt**, **heavy HTML links** or **one giant index**.
- **Claims the pages don't support** (Mueller's keywords-meta-tag point), or **steering AI**: Common Crawl counted 3,793 mildly steering files and 102 promotional ones.
- **An indexable llms-full.txt.** Mueller's noindex remark was about llms.txt; it applies even more to a copy of every page.

## Real llms.txt example: how lijiabao.dev serves it

lijiabao.dev added llms.txt, per-page Markdown and an open robots.txt on 2026-10-01. The excerpt below is from the built file ("…" marks omitted lines, including the site's tagline); it lists pages such as [GlimmerTown](https://lijiabao.dev/en/glimmertown/) and [Frontier Lab](https://lijiabao.dev/en/frontier/).

```markdown
# 李家宝 Li Jiabao — lijiabao.dev

> 微光小鎮與前沿實驗室：成文規則、多家廠商的模型、公開紀錄。每個數字都附出處。 GlimmerTown and Frontier Lab: written rules, models from many vendors, a public record. Every number has a source.

…

數字截至 2026-09-30。 Numbers as of 2026-09-30.
搜尋、AI 回答與 AI 訓練，robots.txt 一律允許。 Search, AI answers and AI training are all allowed by robots.txt.

## 頁面（Markdown 版本） · Pages (Markdown versions)

…
- [GlimmerTown — Li Jiabao](https://lijiabao.dev/en/glimmertown/index.md): One original isometric pixel-art city: a single HTML file, no dependencies, works offline. Three lines of development, one city.
…
- [Frontier Lab — Li Jiabao](https://lijiabao.dev/en/frontier/index.md): One governance repo, 15 discipline labs, 150 problem cards. Status shown as it is.

## lijiabao.dev 編輯整理（非本人觀點） · Edited by lijiabao.dev (not his personal views)

…

## Optional

- [llms-full.txt](https://lijiabao.dev/llms-full.txt): 全站完整內文：每一頁，中文與英文 · Every page in full, zh-Hant and English
- [sitemap.xml](https://lijiabao.dev/sitemap.xml): 網站地圖 · Sitemap
- [lijiabao1998](https://github.com/lijiabao1998): 19 個作品倉庫（截至 2026-09-30） · 19 work repositories as of 2026-09-30
…
```

- **Structure.** The bilingual blockquote is deliberately one line, since the reference parser keeps only the first `>` line. Six `index.md` links follow. Per the generator's comments, GitHub links sit under `## Optional` because those pages are HTML.
- **Built from the pages.** After `astro build`, `scripts/llms.mjs` converts each page's `<main>` to Markdown; any broken site link fails the build.
- **Separate credit.** Site-edited articles have their own heading, "Edited by lijiabao.dev (not his personal views)"; Li Jiabao's own views, when there are any, get a different one. This article is listed there as `(en, 2026-10-13)`.
- **Size.** Before this English version, llms.txt was 5,135 bytes and llms-full.txt about 90 KB (2026-10-13).

Response headers, checked on 2026-10-13:

```text
# https://lijiabao.dev/llms.txt
Content-Type: text/plain; charset=utf-8
Link: <https://lijiabao.dev/llms.txt>; rel="describedby"; type="text/plain"

# https://lijiabao.dev/en/glimmertown/index.md
Content-Type: text/markdown; charset=utf-8
Link: <https://lijiabao.dev/llms.txt>; rel="describedby"; type="text/plain", <https://lijiabao.dev/en/glimmertown/>; rel="canonical"

# https://lijiabao.dev/llms-full.txt
X-Robots-Tag: noindex

# HTML <head> of https://lijiabao.dev/en/glimmertown/
<link rel="alternate" type="text/markdown" href="https://lijiabao.dev/en/glimmertown/index.md">
```

Every response carries the `describedby` header; the [Markdown version of the GlimmerTown page](https://lijiabao.dev/en/glimmertown/index.md) names the HTML as canonical; [llms-full.txt](https://lijiabao.dev/llms-full.txt) is `noindex`. [This site's robots.txt](https://lijiabao.dev/robots.txt) sets `Content-Signal: search=yes, ai-input=yes, ai-train=yes` and `Allow: /`, and mentions llms.txt only in a comment, because robots.txt has no llms.txt field.

## FAQ

### Does llms.txt help or hurt SEO?

Neither, for Google: Search doesn't use it. SE Ranking found no link between the file and AI citations across about 300,000 domains.

### Can llms.txt block AI crawlers or stop AI training?

No. It is a reading list, not a permission file. Put preferences for `GPTBot`, `ClaudeBot` or `Google-Extended` in robots.txt, optionally with `Content-Signal`. Even robots.txt is a request, not access control.

### Do ChatGPT, Claude and Perplexity read llms.txt?

No vendor has said so on record. In Ahrefs' data for May 2026, 97% of the sites with an llms.txt got no requests for it that month. Coding agents are the clearest users.

### Do I need llms-full.txt?

Usually not. It isn't in the spec, and on big docs sites it runs to tens of megabytes. Per-page Markdown linked from llms.txt is usually enough. If you publish one, consider `noindex`.

### Where should llms.txt go, and can a site have more than one?

Usually `/llms.txt`, the only place Lighthouse checks. Since v2, a subpath file such as `/docs/llms.txt` covers the pages under it, and the most specific file applies. Serve it as UTF-8 text.

### Does a small site need llms.txt?

Not necessarily. It has no effect on Google Search. If people use AI agents to query your docs or product specs, a short file is cheap; otherwise, improve the pages.

### How can I tell whether AI tools read my llms.txt?

Check server logs for `/llms.txt` requests and their User-Agent, verified against published IP ranges where they exist (OpenAI publishes them). A fetch doesn't prove use.

## Conclusion

llms.txt is a small, optional Markdown index for AI agents. It doesn't control access or affect Google Search; that is the job of robots.txt and the pages themselves. It pays off mainly for documentation that agents read for users. If you add one, generate it from your pages and keep it short.

This guide is also available in [Traditional Chinese](https://lijiabao.dev/articles/what-is-llms-txt/). For more guides, see [the articles edited by lijiabao.dev](https://lijiabao.dev/en/articles/).
