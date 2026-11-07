---
title: "An ampersand in a sitemap needs XML escaping, not blanket URL encoding"
description: "XML escaping and URL percent encoding solve different problems in a sitemap. Preserve query semantics, serialize once per layer, then parse the deployed output back for verification."
date: 2026-11-07
tags: ["Web development", "Technical SEO", "Release verification"]
draft: false
sources:
  - title: "Google Search documentation: protocol.html"
    url: "https://www.sitemaps.org/protocol.html"
  - title: "Google Search documentation: rfc3986.html"
    url: "https://www.rfc-editor.org/rfc/rfc3986.html"
  - title: "Google Search documentation: toString"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/toString"
  - title: "Google Search documentation: build-sitemap"
    url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap"
---
## Identify the two layers before changing a string

A URL can work in a browser and still break an XML sitemap when it is pasted into the document without proper serialization. A second mistake is subtler: the XML parses successfully, but the URL inside it no longer means what the generator intended. Query parameters make the distinction visible. XML escaping protects the surrounding document syntax, while URL encoding preserves data within the URL. Treating both as one global replacement operation can silently change the destination.

![Metal link objects beside layered glass document sheets in a minimal developer workspace](../../../assets/articles/sitemap-xml-escaping-url-percent-encoding/en-hero.webp)

The loc element contains a page URL, and the sitemap surrounding that value is XML. Each layer has its own rules. The sitemap protocol requires UTF-8 and escaped data values, but that does not mean the application should repeatedly transform every string until it looks safe. Establish what the generator accepts and what it already serializes. A library that expects an ordinary URL should not receive a manually XML-escaped value unless its documented interface explicitly requires that representation.

## Preserve separators between query parameters

Consider the invented URL `https://example.com/catalog?kind=chair&page=2`. In the XML text representation, the separator is written as `&amp;`. Reading the element with an XML parser restores the ordinary ampersand in the URL value. The intended destination still has two parameters. It does not gain a parameter whose name begins with amp;. This is why source XML and a browser's parsed tree can display different representations without disagreeing about the underlying value.

## Encode a value differently from a separator

A query value containing A&B presents a different problem. Here the ampersand belongs to the value; it should not start another parameter. An appropriate query serializer can represent that character as `%26`. The resulting complete URL can then be serialized into XML. Replacing every ampersand in a complete URL with `%26` is not equivalent: it can encode real separators as data and alter the parameters the application receives. Decide whether a character is structure or value before applying a transformation.

## Watch for a valid document with the wrong URL

Double escaping can leave XML syntactically valid. For example, processing an already escaped `&amp;` again may produce `&amp;amp;` in the source. A parser then returns an extra entity-looking fragment in the URL rather than the intended separator. Repeated percent encoding can likewise transform an existing percent sign. RFC 3986 explicitly cautions against encoding or decoding the same string more than once. The practical lesson is to track representation boundaries, rather than assuming an additional pass is always harmless.

## Give URL and XML tools separate responsibilities

One maintainable design builds the URL and its query values using a suitable URL interface, then passes the completed URL as text to an XML serializer. The serializer handles the document representation. This is an architectural example, not a claim that one snippet works unchanged in every framework. A sitemap package may already combine both stages, so inspect its contract before adding a wrapper. Similar function names do not establish that a URL encoder and an XML serializer are interchangeable.

## Parse the result and compare its meaning

Representative checks should include multiple parameters, a value containing a reserved character, and a non-ASCII path if the site uses one. First parse the generated XML. Then retrieve the loc text and compare it with the expected serialized URL. Parse the query according to the same application conventions and confirm that values and parameter names survive. This catches mistakes that a simple search for the loc tag or an HTTP success status cannot detect. Keep the original expected values available for the comparison instead of deriving them from the already transformed output.

## Verify the production artifact too

A correct local file is evidence about the build, not necessarily the document served by the public domain. Fetch the deployed sitemap and establish that it is the current XML rather than a login page, error document, or stale response. Repeat the meaningful sample comparison against that artifact. If the generator was wrong, fix that generation boundary and verify the new output; recreating every article is not a necessary way to repair serialization. Keep the deployed revision alongside the observation so a later maintainer can reproduce the result.

## Keep serialization separate from indexing decisions

Well-formed XML does not establish that every listed URL should be indexed. The site still needs an intentional set of canonical destinations, and search engine crawling and indexing require their own observations. A parsed URL that retains the correct parameters answers a technical data-integrity question. It does not prove ranking, indexation, or even that a parameterized page belongs in the sitemap. Those are separate decisions, and preserving the distinction prevents a narrow syntax fix from becoming an unsupported SEO claim.

Build the intended URL first, serialize it once at the XML boundary, and parse it back before accepting the result. That sequence preserves both a readable document and the meaning of the destination it contains.

Related reading: [Sitemap lastmod should not become today on every build](https://lijiabao.dev/en/articles/sitemap-lastmod-content-updates/); [Moving an article URL: redirects and canonical tags have different jobs](https://lijiabao.dev/en/articles/article-url-move-redirect-versus-canonical/)
