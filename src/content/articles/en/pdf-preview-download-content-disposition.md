---
title: "Why does the same PDF open in one tab and download in another?"
description: "Trace the final document response, compare a direct visit with a download link, and separate file naming from PDF rendering."
date: 2026-11-19
tags: ["Web development", "HTTP", "Browsers"]
draft: false
sources:
  - title: "RFC 6266"
    url: "https://www.rfc-editor.org/rfc/rfc6266.html"
  - title: "MDN Web Docs"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition"
---

A support report says the handbook downloads, yet pasting its address into a new tab opens it just fine. Both observations can be accurate. Content-Disposition tells the browser how the server would like a particular response handled. The link a reader follows and the reader’s own PDF settings also matter. Start with the exact action that surprised the reader.

![A document preview on a laptop beside a portable drive](../../../assets/articles/pdf-preview-download-content-disposition/en-hero.webp)

## Where to find Content-Disposition

Open the browser’s Network panel, clear the earlier entries, and repeat the action. Find the response that actually delivers the document. A redirect, sign-in page, or HTML landing page can appear first. Record the final response’s content type and disposition together. Remove temporary access parameters before sharing any address from that trace.

## What inline and attachment ask for

A PDF served as application/pdf with Content-Disposition set to inline can open in a supported viewer. An attachment disposition asks the browser to handle the file as a download. That does not guarantee a visible Save dialog. A reader who has chosen a default downloads folder may simply find the document there afterward.

## Reading a filename from Content-Disposition

The filename parameter can supply a simple fallback such as manual.pdf. The extended filename* parameter can carry an encoded name with characters outside ASCII. If two readers get identical pages inside the PDF but different names on disk, check the parameters actually sent and the receiving platform’s filename rules. Rebuilding the PDF to change its embedded fonts would address a different issue.

## Compare a direct visit with the page link

Open the document URL directly. Then visit the original page and activate its download link, keeping the file, browser, and device constant. If the outcomes differ, inspect the link’s download attribute and whether the link points to the same origin. In supported same-origin cases, a link can initiate a download even when a direct visit opens the viewer.

## A colleague can preview the file. What should I check next?

Compare the final responses, then compare PDF preferences. A browser can be set to save PDFs by default, and a particular device may lack a viewer. Matching Content-Disposition values and matching media types narrow the investigation. They do not show that the two machines have identical settings.

A good handoff describes the starting link, what the reader saw, and the resulting filename. Repeating that same path after a change tests the experience that prompted the report.

Related reading: [An old screen after Back: how page restoration differs from HTTP caching](https://lijiabao.dev/en/articles/bfcache-history-navigation-http-cache/), [no-cache does not mean no storage: tracing stale browser and CDN responses](https://lijiabao.dev/en/articles/cache-control-no-cache-browser-cdn-revalidation/)
