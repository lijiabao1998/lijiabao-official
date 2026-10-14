---
title: AI 爬蟲 robots.txt 設定：擋訓練、留搜尋的寫法與官方清單
description: 依官方文件整理 GPTBot、ClaudeBot 等 AI 爬蟲和 Google-Extended 的用途與 robots.txt 寫法，說明擋了對 Google 與 AI 摘要的影響、怎麼確認生效。
date: 2026-10-14
tags: [robots.txt, AI 爬蟲, SEO, GPTBot, Google-Extended, Cloudflare]
draft: false
sources:
  - title: "RFC 9309 — Robots Exclusion Protocol（IETF, 2022-09，提議標準）"
    url: https://www.rfc-editor.org/rfc/rfc9309
  - title: "Google — How Google interprets the robots.txt specification（2026-08-31）"
    url: https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
  - title: "Google — List of Google's common crawlers（Googlebot、Google-Extended；2026-07-14）"
    url: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
  - title: "Google — List of Google's special-case crawlers（2026-09-17）"
    url: https://developers.google.com/crawling/docs/crawlers-fetchers/google-special-case-crawlers
  - title: "Google — List of Google user-triggered fetchers（2026-08-19）"
    url: https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers
  - title: "Google — Robots meta tag, data-nosnippet, and X-Robots-Tag specifications（2026-03-24）"
    url: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
  - title: "Search Console 說明 — Google 搜尋生成式 AI 控制項（2026-08-31 起全球適用）"
    url: https://support.google.com/webmasters/answer/16908024?hl=zh-Hant
  - title: "Google — Verify requests from Google crawlers and fetchers（2026-03-20）"
    url: https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests
  - title: "OpenAI — Overview of OpenAI Crawlers"
    url: https://developers.openai.com/api/docs/bots
  - title: "Anthropic — Does Anthropic crawl data from the web, and how can site owners block the crawler?（2026 年 4 月）"
    url: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
  - title: "Apple — About Applebot（2026-09-04）"
    url: https://support.apple.com/en-us/119829
  - title: "Meta — Meta Web Crawlers（2026-05-21）"
    url: https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers
  - title: "Perplexity — Perplexity Crawlers"
    url: https://docs.perplexity.ai/docs/resources/perplexity-crawlers
  - title: "Amazon — About AmazonBot"
    url: https://developer.amazon.com/amazonbot
  - title: "Bing Webmaster Tools — Robots meta tags and attributes that Bing supports"
    url: https://www.bing.com/webmasters/help/robots-meta-tags-and-attributes-that-bing-supports-5198d240
  - title: "Cloudflare — Have it both ways: stay discoverable in search while disallowing AI training（2026-09-15）"
    url: https://blog.cloudflare.com/accountable-mixed-use-ai-crawlers/
  - title: "Cloudflare Docs — robots.txt setting（Bot Preference Sync，2026-10-08）"
    url: https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
  - title: "Cloudflare — Perplexity is using stealth, undeclared crawlers to evade website no-crawl directives（2025-08-04）"
    url: https://blog.cloudflare.com/perplexity-is-using-stealth-undeclared-crawlers-to-evade-website-no-crawl-directives/
  - title: "Perplexity — Agents or bots? Making sense of AI on the open web（2025-08-04）"
    url: https://www.perplexity.ai/hub/blog/agents-or-bots-making-sense-of-ai-on-the-open-web
  - title: "lijiabao.dev — robots.txt（截至 2026-10-14）"
    url: https://lijiabao.dev/robots.txt
  - title: "Google — Robots.txt Introduction and Guide（2025-12-10）"
    url: https://developers.google.com/search/docs/crawling-indexing/robots/intro
  - title: "Google — How HTTP status codes affect Google's crawlers（2026-02-04）"
    url: https://developers.google.com/crawling/docs/troubleshooting/http-status-codes
  - title: "Google Search Central — AI features and your website（2025-12-10）"
    url: https://developers.google.com/search/docs/appearance/ai-features
  - title: "Google Search Central Blog — New location for the Google crawlers' IP range files（2026-03-31）"
    url: https://developers.google.com/search/blog/2026/03/crawler-ip-ranges
  - title: "Google — Authenticate requests with Web Bot Auth (experimental)（2026-10-13）"
    url: https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth
  - title: "Search Console 說明 — robots.txt 報表"
    url: https://support.google.com/webmasters/answer/6062598
  - title: "google/robotstxt — Google 開源的 robots.txt 解析器（GitHub）"
    url: https://github.com/google/robotstxt
  - title: "Search Engine Land — Google Search Console adds robots.txt report（2023-11-15）"
    url: https://searchengineland.com/google-search-console-adds-robots-txt-report-434708
  - title: "OpenAI — ChatGPT Work's Cloud browser allowlisting"
    url: https://help.openai.com/en/articles/11845367
  - title: "Bing Webmaster Tools — Which crawlers does Bing use?"
    url: https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0
  - title: "Bing Webmaster Blog — Announcing new options for webmasters to control usage of their content in Bing Chat（2023-09-22）"
    url: https://blogs.bing.com/webmaster/2023/9/Announcing-new-options-for-webmasters-to-control-usage-of-their-content-in-Bing-Chat/
  - title: "Common Crawl — CCBot"
    url: https://commoncrawl.org/ccbot
  - title: "Common Crawl — FAQ（Crawl-delay）"
    url: https://commoncrawl.org/faq
  - title: "Mistral AI — Mistral crawlers"
    url: https://docs.mistral.ai/robots
  - title: "DuckDuckGo — Is DuckAssistBot related to DuckDuckGo?"
    url: https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot
  - title: "Cohere — Cohere Web Crawlers"
    url: https://docs.cohere.com/docs/cohere-web-crawlers
  - title: "The Register — Taming AI content crawlers is no longer a manual affair（2024-07-30）"
    url: https://www.theregister.com/software/2024/07/30/taming-ai-content-crawlers-is-no-longer-a-manual-affair/1203397
  - title: "ai-robots-txt/ai.robots.txt（GitHub）"
    url: https://github.com/ai-robots-txt/ai.robots.txt
  - title: "IETF — AI Preferences (aipref) Working Group"
    url: https://datatracker.ietf.org/wg/aipref/about/
  - title: "IETF — draft-ietf-aipref-attach-05：Associating AI Usage Preferences with Content in HTTP（2026-08-19，網際網路草案）"
    url: https://datatracker.ietf.org/doc/draft-ietf-aipref-attach/
  - title: "DeviantArt — UPDATE All Deviations Are Opted Out of AI Datasets（noai／noimageai，2022-11-11）"
    url: https://www.deviantart.com/team/journal/A-New-Standard-for-Opting-Out-of-AI-Datasets-934500371
  - title: "Cloudflare — Giving users choice with Cloudflare's new Content Signals Policy（2025-09-24）"
    url: https://blog.cloudflare.com/content-signals-policy/
  - title: "Cloudflare — Say it once: introducing Bot Preference Sync（2026-08-21）"
    url: https://blog.cloudflare.com/bot-preference-sync/
  - title: "Cloudflare Docs — AI Crawl Control（2026-08-14）"
    url: https://developers.cloudflare.com/ai-crawl-control/
  - title: "WordPress Developer Resources — do_robots()"
    url: https://developer.wordpress.org/reference/functions/do_robots/
  - title: "Yoast — How to block unwanted bots from your site with Yoast SEO"
    url: https://yoast.com/help/block-unwanted-bots-with-yoast-seo/
  - title: "AIOSEO — Using the Robots.txt Tool in All in One SEO（2026-08-14）"
    url: https://aioseo.com/docs/using-the-robots-txt-tool-in-all-in-one-seo/
  - title: "Rank Math — Using Rank Math's Robots.txt Generator"
    url: https://rankmath.com/kb/how-to-edit-robots-txt-with-rank-math/
  - title: "WordPress.com — Make your WordPress website public"
    url: https://wordpress.com/support/privacy-settings/make-your-website-public/
---

AI 爬蟲是 AI 公司用來抓取網頁的程式，用途分成模型訓練、AI 搜尋與使用者觸發三類；robots.txt 可以針對各家的名稱分別說「請勿抓取」，但它是請求，不是門鎖。

讀完這篇，你會知道各家官方的爬蟲名稱與用途、robots.txt 群組怎麼比對、四個範本的寫法、對 Google 搜尋與 AI 摘要的影響，以及怎麼確認生效。本文談的是 AI 公司來抓你網站的爬蟲，不是用來抓取別人網站的 AI 工具。資料依各家官方文件整理，截至 2026-10-14。

下文說「擋」，是指在 robots.txt 寫 `Disallow`，也就是提出請求；在伺服器或 CDN 端實際拒絕連線時，會另外寫明。

## AI 爬蟲是什麼？先分清三種用途

同一家公司常有好幾支爬蟲，每支在 robots.txt 裡有自己的名稱，也就是 `User-agent:` 後面的值（產品權杖）。先分清用途，才知道規則要寫給誰：

- **訓練資料爬蟲**：抓取可能用於訓練 AI 模型的內容，例如 OpenAI 的 `GPTBot`、Anthropic 的 `ClaudeBot`、Mistral 的 `MistralAI-Training`。
- **搜尋／AI 回答索引**：替 AI 搜尋或 AI 回答抓取內容（建立索引或即時抓取），回答時引用並連回網站，例如 `OAI-SearchBot`（ChatGPT 搜尋）、`Claude-SearchBot`、`PerplexityBot`、`DuckAssistBot`。
- **使用者觸發的擷取**：使用者在對話中貼網址或要求查資料時，即時去抓那一頁，例如 `ChatGPT-User`、`Claude-User`、`Perplexity-User`。這是 robots.txt 最弱的一環：多家業者表示這類擷取不一定照 robots.txt 走，Google 的 `Google-Agent` 甚至沒有可寫的名稱。

另外有兩種特殊情況：

- **控制權杖**：`Google-Extended`、`Applebot-Extended` 不是爬蟲，沒有自己的使用者代理字串，存取紀錄裡看不到。它們只在 robots.txt 裡當開關，決定 Google、Apple 抓到的內容能不能用於訓練模型；Google-Extended 也管 Gemini 的 grounding（參考基準）。
- **混合用途爬蟲**：一支爬蟲同時服務搜尋或產品，資料也可能用於 AI，例如 `Googlebot`、`Applebot`、`bingbot`、`Amazonbot`。對它們寫 `Disallow`，等於連原本的搜尋或產品用途一起拒絕。

robots.txt 以名稱比對，同一家公司的不同名稱原則上各自獨立（例外見下文「不照這套規則走的例外」）。OpenAI 寫得很明白：可以放行 OAI-SearchBot、同時擋 GPTBot。

![AI 爬蟲的五種角色，以及 robots.txt 對各角色的效力，依各業者官方文件整理，資料截至 2026-10-14。第一是訓練資料爬蟲：蒐集內容，可能用於訓練模型，例如 GPTBot、ClaudeBot、MistralAI-Training；業者文件說明以 robots.txt 控制。第二是控制權杖，沒有自己的爬蟲：用來表態業者爬到的內容可否用於訓練，其中 Google-Extended 另含 Gemini 的 grounding，例如 Google-Extended、Applebot-Extended；只在 robots.txt 裡有作用。第三是搜尋與 AI 回答索引：建立索引，讓 AI 搜尋引用並附連結，例如 OAI-SearchBot、Claude-SearchBot、PerplexityBot、DuckAssistBot；業者表示遵守 robots.txt，擋了，在該服務 AI 搜尋的能見度可能下降。第四是使用者觸發的擷取，圖中特別標示為 robots.txt 最管不到的一類：使用者提問時即時讀網頁，例如 ChatGPT-User、Perplexity-User、Claude-User，以及沒有 robots.txt 權杖的 Google-Agent；多家業者表示 robots.txt 可能不適用或通常忽略，Anthropic、Mistral 表示遵守。第五是混合用途爬蟲：同一支爬蟲兼顧搜尋（或產品）與 AI，例如 Googlebot、Applebot、bingbot、Amazonbot；遵守 robots.txt，但擋了連搜尋（或產品）一起退出，AI 用途要用別的開關。底部註明：robots.txt 是請求，不是存取控制（RFC 9309）。](../../../assets/articles/ai-crawlers-robots-txt/fig-ai-crawler-roles.png)

<small>AI 爬蟲的三種用途，加上控制權杖與混合用途爬蟲；robots.txt 對使用者觸發的擷取最管不到（依各業者官方文件，2026-10-14）。</small>

## AI 爬蟲清單：各家官方名稱與用途（截至 2026-10-14）

下表只列各家官方文件寫明的名稱，內容改寫自各家說明頁，引號內是官方用語的翻譯。名稱比對不分大小寫。

| 業者 | robots.txt 名稱 | 用途 | 官方怎麼說 robots.txt |
| --- | --- | --- | --- |
| [OpenAI](https://developers.openai.com/api/docs/bots) | GPTBot | 訓練 | 擋了表示內容不應用於訓練基礎模型 |
| OpenAI | OAI-SearchBot | ChatGPT 搜尋 | 擋了不會出現在搜尋答案中，仍可能以導覽連結出現；約 24 小時生效 |
| OpenAI | ChatGPT-User | 使用者觸發（ChatGPT、自訂 GPT、GPT Actions） | 由使用者發起，規則「可能不適用」 |
| OpenAI | OAI-AdsBot | 檢查 ChatGPT 廣告的到達頁，不用於訓練 | 未說明 |
| [Anthropic](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) | ClaudeBot | 訓練 | 遵守；擋了表示網站之後的內容不要用於訓練 |
| Anthropic | Claude-SearchBot | 搜尋 | 遵守；擋了不會被編入搜尋索引 |
| Anthropic | Claude-User | 使用者觸發 | 遵守；擋了，回答使用者時就不會擷取 |
| [Google](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) | Googlebot | Google 搜尋（含 AI 摘要、AI 模式）；內容也可能用於 Gemini | 自動檢索一律遵守 |
| Google | Google-Extended | 控制權杖：Gemini 的訓練與 grounding | 沒有自己的爬蟲；不影響搜尋收錄與排名 |
| Google | （無） | [使用者觸發的擷取](https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers)：Google-Agent、Google-GeminiNotebook 等 | 沒有可寫的名稱；「通常會忽略」robots.txt |
| [Apple](https://support.apple.com/en-us/119829) | Applebot | Spotlight、Siri、Safari 搜尋；也可能用於訓練 Apple 的基礎模型 | 遵守；沒被點名、但檔案有 Googlebot 群組時，照 Googlebot 的規則 |
| Apple | Applebot-Extended | 控制權杖：Apple 基礎模型的訓練 | 不抓網頁；擋了不影響搜尋與排名 |
| [Perplexity](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) | PerplexityBot | 搜尋，不用於基礎模型 | 以 robots.txt 控制；最多 24 小時生效 |
| Perplexity | Perplexity-User | 使用者觸發，不用於訓練 | 「通常會忽略」robots.txt |
| [Meta](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers) | meta-externalagent | 訓練基礎 AI 模型，或建立索引改善產品 | 以 robots.txt 控制 |
| Meta | meta-webindexer | Meta AI 的搜尋與引用 | 以 robots.txt 控制 |
| Meta | meta-externalfetcher | 使用者觸發，含代理任務 | 「可能繞過」robots.txt |
| [Amazon](https://developer.amazon.com/amazonbot) | Amazonbot | 改善產品與服務；可能用於訓練 Amazon 的 AI 模型 | 遵守；頁面加 noarchive 表示不用於訓練 |
| Amazon | Amzn-SearchBot | 搜尋（例如 Alexa），不用於訓練 | 遵守；沒被點名、而檔案允許其他搜尋爬蟲時，照給它們的規則 |
| Amazon | Amzn-User | 使用者觸發（Alexa 即時回答），不用於訓練 | 「可能不遵守所有」指令 |
| [Microsoft](https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0) | bingbot | Bing 搜尋；內容也可能用於 Copilot 與 AI 訓練 | 只管抓取；AI 用途改用 noarchive、nocache |
| [Common Crawl](https://commoncrawl.org/ccbot) | CCBot | 公開的網頁資料庫，供各方重複使用 | 遵守；支援 Crawl-delay |
| [Mistral AI](https://docs.mistral.ai/robots) | MistralAI-Training | 訓練 | 可以用 robots.txt 擋 |
| Mistral AI | MistralAI-Index | Mistral 的搜尋，不用於訓練 | 以 robots.txt 控制 |
| Mistral AI | MistralAI-User | 使用者觸發，不用於訓練 | 以 robots.txt 控制 |
| [DuckDuckGo](https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot) | DuckAssistBot | DuckDuckGo 搜尋的 AI 輔助答案（Search Assist），不用於訓練 | 遵守；72 小時生效；不影響自然排名 |

### 過時或查不到官方說明的名稱

網路清單常見下列名稱，2026-10-14 的查核結果：

- **`anthropic-ai`、`Claude-Web`**：Anthropic 在 2024 年對 [The Register](https://www.theregister.com/software/2024/07/30/taming-ai-content-crawlers-is-no-longer-a-manual-affair/1203397) 表示已不再使用，並說 ClaudeBot 會遵守原本寫給這兩個名稱的規則；現行說明頁沒有列出這兩個名稱，也沒有提到這項安排。
- **`FacebookBot`**：不在 Meta 現行的爬蟲清單上。
- **`Google-NotebookLM`**：已改為 Google-GeminiNotebook（舊名支援到 2026 年 8 月），也沒有 robots.txt 名稱。
- **`Bytespider`**：找不到 ByteDance 的官方說明，用途與是否遵守都無法確認。
- **`cohere-ai`**：[Cohere 表示](https://docs.cohere.com/docs/cohere-web-crawlers)目前沒有用爬蟲收集訓練資料。
- **`GrokBot`、`xAI-*`、`Claude-Code`**：只見於第三方清單。

寫進 robots.txt 無妨，但只寫這些名稱，不能取代上表的官方名稱。

### 社群清單：整份照抄前先看用途

GitHub 的社群專案 [ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) 依它自己的說明，不分用途收錄 AI 相關爬蟲。整份照抄，AI 搜尋與使用者觸發的名稱也會一起寫進 Disallow；拿來比對漏掉的名稱很方便，但加進檔案前要先確認用途。

## robots.txt 群組規則：一個爬蟲只聽一段

robots.txt 由群組組成：一行或多行 `User-agent`，加上該群組的 `Allow`、`Disallow` 規則。以下依 [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309)（IETF 提議標準）與 [Google 的 robots.txt 規格說明](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec)整理。

### 先找自己的名稱，找不到才照萬用群組

爬蟲先找 `User-agent` 和自己名稱相符的群組；完全沒有相符的群組，才照 `User-agent: *`（萬用群組）走。Google 說得更直接：具名群組和萬用群組不會合併。一旦替某支爬蟲寫了專屬群組，萬用群組的規則對它就全部失效。

看一個例子：

```text
User-agent: GPTBot
Disallow: /premium/

User-agent: Googlebot
Disallow: /drafts/

User-agent: *
Disallow: /admin/
```

- **GPTBot** 找到自己的群組，只照它走，被要求避開的只有 /premium/。寫在萬用群組的 /admin/ 對它無效，這就是具名群組的陷阱。
- **Googlebot** 也一樣，只避開 /drafts/。
- **ClaudeBot** 在檔案裡找不到自己的名稱，照萬用群組避開 /admin/。
- **Applebot** 也沒被點名，但檔案有 Googlebot 群組。依 [Apple 的說明](https://support.apple.com/en-us/119829)，這時它改照 Googlebot 的規則，避開 /drafts/；萬用群組的 /admin/ 不能指望它照做。

![示意一支爬蟲只讀一個群組。上方是一份 robots.txt，有三個群組：User-agent: GPTBot 加上 Disallow: /premium/；User-agent: Googlebot 加上 Disallow: /drafts/；萬用群組 User-agent: * 加上 Disallow: /admin/。下方三支爬蟲各以箭頭連到自己讀的群組。ClaudeBot 沒有專屬群組，讀 * 群組，所以 /admin/ 不抓。Applebot 沒有專屬群組，但檔案寫了 Googlebot，依 Apple 文件改用 Googlebot 的規則，所以 /drafts/ 不抓。GPTBot 有自己的群組，只讀這一組，所以 /premium/ 不抓；/admin/ 沒寫進這組，所以不受限，這是圖中特別標示的陷阱。底部結論：專屬群組會取代 * 群組，不是疊加；要讓 GPTBot 也避開 /admin/，得在它的群組再寫一次。依據 RFC 9309 第 2.2.1 節、Google robots.txt 規格與 Apple〈About Applebot〉。](../../../assets/articles/ai-crawlers-robots-txt/fig-robots-group-matching.png)

<small>一支爬蟲只套用一個群組：有專屬群組就不讀萬用群組；Applebot 若沒有專屬群組而檔案寫了 Googlebot，會改用 Googlebot 的規則。</small>

修正方法是在每個具名群組裡，把萬用群組仍然需要的規則再寫一次：

```text
User-agent: GPTBot
Disallow: /premium/
Disallow: /admin/

User-agent: Googlebot
Disallow: /drafts/
Disallow: /admin/

User-agent: *
Disallow: /admin/
```

Googlebot 群組補上 /admin/ 之後，照 Googlebot 規則走的 Applebot 也一併涵蓋。

### 同名群組會合併，多個名稱可共用一組

同一個名稱出現在好幾個群組時，規則會合併（RFC 9309 的要求，Google 也這樣做）。好幾行 `User-agent` 可以共用同一組規則，下文的範本就是這樣寫。群組的先後順序不影響結果。

### 路徑以最長的規則為準

同一個網址同時符合 Allow 與 Disallow 時，以路徑最長的那條為準；一樣長時，RFC 9309 建議 Allow 優先，Google 採用限制最少的那條。例如 `Disallow: /premium/` 加上 `Allow: /premium/free/`，/premium/free/ 底下仍然可以抓。路徑比對分大小寫；沒有任何規則符合就是允許。

### 不照這套規則走的例外

- **Applebot**：Apple 自己的範例裡，有專屬群組的 Applebot 也會避開萬用群組的路徑，和 RFC 9309「只聽一個群組」的讀法不同；把需要的規則寫進每個具名群組最穩妥。
- **Amzn-SearchBot**：沒被點名、而檔案允許其他搜尋爬蟲時，照檔案給其他搜尋爬蟲的規則。
- **Google 有兩個名稱的爬蟲**：Googlebot-Image、Google-CloudVertexBot 等的第二個名稱是 Googlebot，沒有自己的群組時照 Googlebot 群組；GoogleOther-Image、GoogleOther-Video 的第二個名稱是 GoogleOther，照的是 GoogleOther 群組。
- **Google 的特殊用途爬蟲**：AdsBot-Google、APIs-Google、Mediapartners-Google 等不理萬用群組，Google-Safety 完全不看 robots.txt（[Google 的特殊用途爬蟲清單](https://developers.google.com/crawling/docs/crawlers-fetchers/google-special-case-crawlers)）。所以 `User-agent: *` 加 `Disallow: /`，不會讓所有 Google 爬蟲都停下來。
- **使用者觸發的擷取**：可能不照 robots.txt 走，見下文「robots.txt 做不到的事」。

### 其他容易忽略的細節

- **一個主機一份**：robots.txt 只管同一個協定、主機和連接埠，example.com 的檔案不涵蓋 blog.example.com 或 http 版本。Anthropic 也請網站在每個子網域各放一份。
- **讀不到檔案時（4xx）**：4xx（429 除外）在 Google 看來等於沒有限制。
- **讀不到檔案時（5xx、逾時、DNS 錯誤）**：Google 先停止抓取 12 小時並重試，之後最多 30 天沿用最後一份成功取得的版本（沒有就當作沒有限制）；30 天後，網站整體正常就當作沒有 robots.txt，否則停止抓取。429 也算伺服器錯誤。RFC 9309 則要求先視為全部禁止；Amazon 讀不到就當作沒有檔案。
- **快取與大小**：通常最多快取 24 小時（RFC 9309 的建議，Google 也是），Amazon 可能用到 30 天前的版本；Google 只讀前 500 KiB。
- **Crawl-delay**：不在 RFC 9309 裡。Anthropic 與 Common Crawl 支援，Google、Apple、Amazon 不支援。
- **不認得的欄位不會切斷群組**：例如 `Content-Signal:`，不認得的爬蟲會略過這一行，群組照樣延續。
- **檔案是公開的**：寫進 Disallow 的路徑人人看得到，列出來反而更容易被發現。

## 依目標選寫法：四個範本

要擋或放，是內容與商業上的取捨，本文不替讀者決定。下圖與下表把常見目標對應到該用的工具；有些目標根本不靠 robots.txt。

![想達成什麼，用哪個開關：四個目標各自對應的工具。標題下方註明：robots.txt 和 meta 標記都是請求；要強制，只能在伺服器端擋。第一，不讓內容被拿去訓練：用 robots.txt 對訓練爬蟲與控制權杖寫 Disallow，例如 GPTBot、ClaudeBot、Google-Extended、Applebot-Extended 等；Bing 沒有專用權杖，用 noarchive 標記。第二，不出現在 Google 的 AI 摘要、AI 模式：用 Search Console 的「Google 搜尋生成式 AI 控制項」（2026-08-31 起全球），或 nosnippet（一般摘要也會跟著消失）。圖中特別提醒，這不是 Google-Extended；擋 Googlebot 會連搜尋一起退出。第三，不被 AI 搜尋引用：用 robots.txt 對搜尋型爬蟲寫 Disallow，例如 OAI-SearchBot、Claude-SearchBot、PerplexityBot 等。第四，真的要擋住，包含使用者觸發的讀取：在伺服器端處理，例如 WAF、Cloudflare AI Crawl Control 等，並用反向 DNS 或官方 IP 清單驗證身分。](../../../assets/articles/ai-crawlers-robots-txt/fig-ai-controls-map.png)

<small>不同目標用不同開關：訓練與 AI 搜尋寫在 robots.txt，Google 的 AI 摘要靠 Search Console，要強制只能在伺服器端。</small>

| 目標 | robots.txt 怎麼寫 | 另外要做或注意 |
| --- | --- | --- |
| 全部開放 | 不必點名 AI 爬蟲（範本一） | 放行不保證被引用 |
| 不讓內容被拿去訓練 | 對訓練類名稱寫 Disallow（範本二） | Bing 沒有訓練專用名稱，改用 noarchive；只影響之後的抓取 |
| 不被 AI 搜尋引用 | 再加上 AI 搜尋類名稱（範本三） | 使用者觸發的擷取不一定照做 |
| 不出現在 Google AI 摘要、AI 模式 | 不靠 robots.txt：Google-Extended 管不到，擋 Googlebot 會連搜尋一起退出 | 用 Search Console 的控制項或 nosnippet（見下一節） |
| 只保護部分目錄 | 在具名群組寫路徑（範本四） | 會員內容用登入保護 |
| 真的要擋 | robots.txt 做不到 | 在伺服器端處理（WAF、Cloudflare AI Crawl Control 等），並驗證來源 |

### 範本一：全部開放

```text
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

沒有規則符合時本來就是允許，`Allow: /` 只是把意思寫明；沒有 robots.txt（回 404）在 Google 看來也等於沒有限制。本站就是這一型，見下文「實例」。

### 範本二：不給訓練，保留搜尋與 AI 搜尋

```text
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: meta-externalagent
User-agent: Amazonbot
User-agent: CCBot
User-agent: MistralAI-Training
Disallow: /

User-agent: *
Allow: /
```

使用前要知道的代價與限制：

- `Google-Extended` 也管 Gemini 應用程式與 Vertex AI 的 grounding。
- `Amazonbot`、`meta-externalagent` 也用於改善產品或建立索引，不只訓練；`CCBot` 建立的開放資料庫有各種用途。
- Bing 要另外用 noarchive；Google 的 AI 摘要也不歸這裡管。
- 只影響之後的抓取：Anthropic 說的是網站「之後的內容」，本站查核的業者頁面都沒有說改了 robots.txt 會刪除已收集的資料。

### 範本三：連 AI 搜尋也退出，保留一般搜尋

```text
# 訓練（同範本二）
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: meta-externalagent
User-agent: Amazonbot
User-agent: CCBot
User-agent: MistralAI-Training
Disallow: /

# AI 搜尋與 AI 回答索引
User-agent: OAI-SearchBot
User-agent: Claude-SearchBot
User-agent: PerplexityBot
User-agent: Amzn-SearchBot
User-agent: meta-webindexer
User-agent: MistralAI-Index
User-agent: DuckAssistBot
Disallow: /

User-agent: *
Allow: /
```

Google 的 AI 摘要另外處理（見下一節）；Bing 的 Copilot 用 noarchive，Apple 的 AI 回答用 nosnippet。`Amzn-SearchBot` 服務的是 Amazon 產品裡的搜尋（例如 Alexa），擋了也會退出那裡的搜尋。

若連使用者觸發的擷取也要提出要求，可以再加一組：

```text
User-agent: ChatGPT-User
User-agent: Claude-User
User-agent: Perplexity-User
User-agent: meta-externalfetcher
User-agent: Amzn-User
User-agent: MistralAI-User
Disallow: /
```

效果因業者而異：Anthropic 表示 robots.txt 適用，Mistral 說明 MistralAI-User 決定使用者請求能抓哪些網站；OpenAI、Perplexity、Meta、Amazon 的說法從可能不適用、可能繞過到通常會忽略都有（見上方清單）；Google 則沒有名稱可寫。另外，擋了 Claude-User，使用者請 Claude 讀你的網頁時，它也不會去抓。

### 範本四：只保護部分目錄

```text
User-agent: GPTBot
User-agent: ClaudeBot
Disallow: /premium/
Disallow: /admin/

User-agent: *
Disallow: /admin/
```

具名群組不會繼承萬用群組，所以 /admin/ 要再寫一次；其他名稱照同樣方式加進這一組。會員或付費內容真正的保護是登入。Google 的 AdsBot 等特殊用途爬蟲不理萬用群組，/admin/ 對它們無效（見上文例外）。

## 擋了會影響 Google 排名或 AI 摘要嗎？

AI 摘要與 AI 模式屬於 Google 搜尋，由 Googlebot 抓取；Google-Extended 不影響排名，也不能讓網站退出這兩項功能。它管的是訓練：Search Console 說明也指出，要限制這些 AI 功能所用模型的訓練，用的是 Google-Extended。

### Google 的開關各管一件事：Googlebot、Google-Extended 與 Search Console

| 控制方式 | 一般搜尋結果 | AI 摘要、AI 模式 | AI 訓練 | 備註 |
| --- | --- | --- | --- | --- |
| robots.txt 擋 Googlebot | 不再檢索 | 同樣不再檢索 | — | 網址仍可能出現，只是沒有說明文字 |
| noindex | 整頁退出 | 一起退出 | — | 頁面不能同時被 robots.txt 擋，Google 才讀得到 |
| nosnippet、data-nosnippet、max-snippet | nosnippet 不顯示摘要；max-snippet 限制長度；data-nosnippet 標記的段落不顯示 | nosnippet：不顯示，也不當作直接輸入；max-snippet：限制可當作直接輸入的份量；data-nosnippet：標記的段落不顯示 | — | data-nosnippet 可以只標一段 |
| Search Console「Google 搜尋生成式 AI 控制項」 | 不影響，不是排名或收錄訊號 | 網站退出，也不當作參考基準 | 不影響 | 也涵蓋 Google 探索的生成式 AI 功能；2026-08-31 起全球適用；通常幾天內生效，部分內容更久 |
| robots.txt 擋 Google-Extended | 不影響收錄與排名 | 不會因此退出 | 不用於 Gemini 訓練；也限制 AI 摘要等功能所用模型的訓練 | 也管 Gemini 應用程式、Vertex AI 的 grounding |

「—」表示 Google 沒有把它列為這一項的控制方式。資料截至 2026-10-14。

要退出 AI 摘要與 AI 模式、又保留一般搜尋，用的是 Search Console 的[「Google 搜尋生成式 AI 控制項」](https://support.google.com/webmasters/answer/16908024?hl=zh-Hant)：依序點選「設定」>「Google 搜尋生成式 AI」，選擇納入（預設）、排除，或沿用上層資源的設定。依 Google 的說明，排除後這些功能不顯示網站的連結和內容，也不拿它當參考基準；AI 訓練則交給 Google-Extended，要完全不出現在 Google 搜尋仍要用 noindex。

只想處理個別頁面或段落，可以用 [nosnippet、data-nosnippet 或 max-snippet](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)，代價是一般搜尋結果的摘要也會跟著消失（nosnippet）或變短（max-snippet）。為了避開 AI 功能而擋 Googlebot，等於連一般搜尋一起退出。

### 擋 OpenAI、Anthropic 的爬蟲：不影響 Google；擋搜尋爬蟲才影響它們的 AI 搜尋

GPTBot、ClaudeBot 等名稱和 Google 的收錄、排名無關。受影響的是這些公司自己的 AI 搜尋，而且看的是搜尋爬蟲，不是訓練爬蟲：

- **ChatGPT 搜尋**看 OAI-SearchBot：擋了，網站不會出現在搜尋答案中，但仍可能以導覽連結出現，約 24 小時後反映。只擋 GPTBot 不影響這一項。
- **Claude** 看 Claude-SearchBot（搜尋索引）與 Claude-User（回答時即時擷取）。
- **Perplexity** 看 PerplexityBot，最多 24 小時反映。

### Bing 與 Copilot：沒有 AI 專用名稱，用 noarchive、nocache

Microsoft 沒有替 Copilot 或 AI 訓練另設名稱，bingbot 同時服務搜尋與 AI。依 [Bing 的 robots meta 說明](https://www.bing.com/webmasters/help/robots-meta-tags-and-attributes-that-bing-supports-5198d240)，AI 用途要用頁面上的 meta 標籤控制：

- `noarchive`：Chat 與 Copilot 的回答不連結這一頁，也不用於訓練 Microsoft 的生成式 AI 基礎模型。
- `nocache`：Chat 與 Copilot 只顯示網址、標題與摘要，訓練也只用這三項；兩者同時出現時，以 nocache 處理。

寫成 `<meta name="bingbot" content="noarchive">` 就只對 Bing 生效。Bing 在 [2023 年推出這兩個選項](https://blogs.bing.com/webmaster/2023/9/Announcing-new-options-for-webmasters-to-control-usage-of-their-content-in-Bing-Chat/)時表示，這些頁面仍會出現在 Bing 搜尋結果。Cloudflare 在 2026-09-15 提到，Microsoft 正在開發以 robots.txt 表達「不訓練」的支援，目標是 2027 年初；這是 Cloudflare 的說法，本站沒有找到 Microsoft 的公告。

### Apple：Applebot-Extended 管訓練，nosnippet 管 AI 回答

- **訓練**：對 `Applebot-Extended` 寫 Disallow，內容就不用於訓練 Apple 的基礎模型；它不抓網頁，也不影響 Apple 的搜尋。
- **AI 回答**：Applebot 抓到的資料也可能在 Siri 與搜尋用 AI 回答一般知識問題時當作參考。頁面加 `nosnippet`（或 `X-Robots-Tag: applebot: nosnippet`）可以退出這種用途，代價是 Applebot 不會替這一頁產生描述或網頁答案，連到這頁的建議只顯示標題。
- **付費內容**：結構化資料標了 `isAccessibleForFree: false` 的頁面，Apple 不會拿來當 AI 輸出的參考。
- **擋 Applebot 本身**，會連 Spotlight、Siri、Safari 的搜尋一起退出。

## robots.txt 做不到的事

[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309) 寫明，robots.txt 的規則「不是一種存取授權」。Google 的 [robots.txt 入門說明](https://developers.google.com/search/docs/crawling-indexing/robots/intro)也提到，robots.txt 無法強制爬蟲照做：正派的爬蟲會遵守，其他的不一定。具體來說：

- **不能保證每支爬蟲照做**：使用者觸發的擷取最明顯，見範本三。
- **不能回溯**：設定只影響之後的抓取。
- **不能讓網址從搜尋消失**：被 Disallow 的網址，Google 仍可能不經抓取就收錄，只是沒有說明文字；要不出現在結果中，得用 noindex 或密碼保護。
- **llms.txt 也不行**：llms.txt 是給 AI 的閱讀清單，不是權限檔，詳見[本站整理的 llms.txt 指南](https://lijiabao.dev/articles/what-is-llms-txt/)。

真的要拒絕連線，得在伺服器或 CDN 端處理，例如登入、WAF、速率限制或機器人管理，並用下文的方法確認對方身分。Anthropic 也提醒，直接封鎖 IP 不一定可靠，因為這會讓它讀不到 robots.txt。

這方面也有公開爭議。Cloudflare 在 [2025-08-04 的文章](https://blog.cloudflare.com/perplexity-is-using-stealth-undeclared-crawlers-to-evade-website-no-crawl-directives/)說，在全站禁止抓取、並用 WAF 封鎖 Perplexity 兩支爬蟲的測試網域上，Perplexity 仍能回答網頁內容；Cloudflare 還觀察到一支以一般瀏覽器身分出現、輪換 IP 的未申報爬蟲。

[Perplexity 同一天回應](https://www.perplexity.ai/hub/blog/agents-or-bots-making-sense-of-ai-on-the-open-web)，表示使用者驅動的代理不是爬蟲，並說 Cloudflare 把第三方雲端瀏覽器服務 BrowserBase 的流量算到它頭上。本站沒有找到獨立的查證，這仍是雙方各自的說法。

### Content-Signal 與 IETF AI 偏好：都是表態，不是規則

- **Content-Signal**：Cloudflare 在 2025-09-24 提出的欄位，在 robots.txt 對 search、ai-input、ai-train 三種用途表達偏好，寫法見前文連結的 llms.txt 指南。本站查核的業者爬蟲文件都沒有提到會讀這一行，Google 也會略過它。
- **IETF AI 偏好**：[aipref 工作小組](https://datatracker.ietf.org/wg/aipref/about/)正在制定類似的詞彙與寫法，例如 `Content-Usage: train-ai=n`。兩份文件仍是網際網路草案，原訂 2026 年 8 月送交 IESG 的里程碑沒有達成，技術上的強制也不在它的範圍內。
- **noai、noimageai**：DeviantArt 在 2022 年提出的非標準標籤；Meta 表示它採用 robots.txt 這類業界標準，而不是 NoAI 標籤這種非標準格式。

robots.txt 和這些訊號表達的都是偏好；著作權等法律問題，請洽詢律師。

### 主機被爬到很慢時

robots.txt 只對遵守它的爬蟲有用，`Crawl-delay` 的支援也不一致（見上文）。Google 還提醒，不要用讓 robots.txt 回 401、403 的方式限制抓取速度，因為 4xx（429 除外）不會讓 Google 放慢抓取，robots.txt 回 4xx 還會被當成沒有限制。流量問題要靠 CDN 或防火牆的速率限制與機器人管理。

## WordPress、Cloudflare 怎麼設

### WordPress

WordPress 預設輸出的是[虛擬的 robots.txt](https://developer.wordpress.org/reference/functions/do_robots/)，主機上沒有實體檔案。常見改法如下，介面名稱可能隨版本改變，請以畫面為準：

- **Yoast SEO**：Settings → Advanced → Crawl optimization 的「Block unwanted bots」。依 [Yoast 的說明](https://yoast.com/help/block-unwanted-bots-with-yoast-seo/)，免費版只能擋 Google 的 AdsBot，Google-Extended、GPTBot、CCBot 的開關要 Premium。
- **All in One SEO（AIOSEO）**：Tools → Robots.txt Editor，先啟用自訂 robots.txt，裡面有「Block AI Crawlers」區塊（[AIOSEO 說明頁](https://aioseo.com/docs/using-the-robots-txt-tool-in-all-in-one-seo/)，2026-08-14 更新）。
- **Rank Math**：先開 Advanced Mode，再到 General Settings → Edit robots.txt（[Rank Math 說明](https://rankmath.com/kb/how-to-edit-robots-txt-with-rank-math/)）。
- **WordPress.com**：Settings → Reading → Site Visibility 選 Public，勾選「Prevent third-party sharing」，會停止把網站公開內容分享給 WordPress.com 的第三方授權夥伴，並把「已知的 AI 機器人」加進 robots.txt；[WordPress.com 的說明頁](https://wordpress.com/support/privacy-settings/make-your-website-public/)沒有列出是哪些。

根目錄若放了實體的 robots.txt，伺服器通常會直接送出它，外掛的設定就不會生效；Rank Math 也要求先刪除實體檔。改完請開啟 `https://你的網域/robots.txt` 確認。

### Cloudflare（2026-09-15 之後）

Cloudflare 在 [2026-09-15 改了 AI 爬蟲設定](https://blog.cloudflare.com/accountable-mixed-use-ai-crawlers/)，較早的教學可能還是舊的選項名稱。現在 AI 爬蟲分成 Search、Training、Agent 三類各自設定，所有方案都能用，位置在網域（zone）的 Security Settings：篩選 Bot traffic，再選 Configure AI bot policies。和 robots.txt 最相關的是：

- **Disallow AI Training**（只有 Training 有）：透過 Bot Preference Sync 在 robots.txt 發布不訓練的偏好。Cloudflare 認定為「Accountable」的混合用途爬蟲（Googlebot、Applebot、Bingbot）仍可為搜尋抓取；其他訓練爬蟲（Cloudflare 稱為訓練專用，例如 Amazon、Anthropic、Meta、OpenAI 的）直接在邊緣被擋。儀表板上這個選項標示為 Disallow。
- **Block**、**Block on pages with ads**：現在也套用到 Applebot、Bingbot、Googlebot 這些混合用途爬蟲，所以搜尋也會受影響。

其他變化：

- 舊的「Block AI Bots」自 2026-09-15 起列為停用，「Managed robots.txt」由 Bot Preference Sync 取代；舊設定已自動移轉，Training 原本選 Block 或 Block on pages with ads 的，都改成 Disallow AI Training。
- 新加入的網域會依是否靠廣告營利，套用不同的預設建議：靠廣告營利的網站，Training 預設為 Disallow AI Training、Agent 為 Block on pages with ads；兩種預設都允許 Search。
- 網站原本就有 robots.txt 時，[Bot Preference Sync](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/) 會把 Cloudflare 的區塊加在檔案最前面；它對新客戶預設開啟，可以關閉（[Cloudflare 2026-08-21 的說明](https://blog.cloudflare.com/bot-preference-sync/)）。
- 依 Cloudflare 的說明，Disallow AI Training 對 Google、Apple 是透過 Google-Extended、Applebot-Extended 傳達；Bing 目前還收不到，要自己加 noarchive（見上文）。

Cloudflare 自己的統計（2026-09-15）：不到 1% 的 Cloudflare 網站封鎖搜尋爬蟲，17% 用了某種方式阻擋訓練。另外，所有方案都有的 AI Crawl Control 可以逐一允許或封鎖爬蟲，並追蹤 robots.txt 的遵守情況。改完設定，記得抓線上的 robots.txt，看看開頭有沒有 `# BEGIN Cloudflare Managed content` 區塊。

## 怎麼確認設定生效？6 個檢查

1. **抓線上的檔案**：用 `curl -sL https://你的網域/robots.txt` 或無痕視窗開啟，看有沒有不是你寫的段落，例如 CDN 加上的區塊。
2. **逐一對照群組**：確認每個名稱照哪一段走。Google 開源的 [robots.txt 解析器](https://github.com/google/robotstxt)可以在本機測試。
3. **看 Search Console 的 [robots.txt 報表](https://support.google.com/webmasters/answer/6062598)**：在「設定」裡，顯示 Google 抓到的版本，最多列 20 個主機，可以要求重新檢索。它只代表 Google，測不了 GPTBot 等其他爬蟲；舊的「robots.txt 測試工具」已由這份報表取代（Google 在 2023 年 11 月宣布停用）。
4. **看存取紀錄**：依名稱篩選，再用業者公布的 IP 清單或反向 DNS 確認是不是本尊（見下表）。使用者代理字串可以偽造；兩個控制權杖不會出現在紀錄裡。
5. **給它時間**：OpenAI（搜尋）、Perplexity、Meta、Amazon 約 24 小時內，Google 的快取通常也最多 24 小時，DuckDuckGo 寫 72 小時，Anthropic 與 Apple 沒有說明；Search Console 的生成式 AI 控制項通常要幾天（控制項上線後 1 到 2 天內排除，部分內容更久）。
6. **Cloudflare 使用者看 AI Crawl Control**：它會追蹤爬蟲是否遵守 robots.txt。自己用 curl 假冒 GPTBot 的使用者代理字串，只測得到依字串判斷的規則。

| 業者 | 公布的 IP 清單或驗證方式 |
| --- | --- |
| OpenAI | 每支爬蟲各一份 JSON，例如 [gptbot.json](https://openai.com/gptbot.json)、[searchbot.json](https://openai.com/searchbot.json) |
| Anthropic | [bots.json](https://claude.com/crawling/bots.json)，三支爬蟲合併成一份 |
| Google | [反向 DNS 再正向確認](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests)，主機名稱應屬於 googlebot.com、google.com 或 googleusercontent.com；或比對 [IP 範圍檔](https://developers.google.com/static/crawling/ipranges/common-crawlers.json) |
| Apple | 反向 DNS `*.applebot.apple.com`，或 [applebot.json](https://search.developer.apple.com/applebot.json) |
| Microsoft | [bingbot.json](https://www.bing.com/toolbox/bingbot.json)，或 Bing 的 Verify Bingbot 工具 |
| Perplexity | [perplexitybot.json](https://www.perplexity.com/perplexitybot.json)、[perplexity-user.json](https://www.perplexity.com/perplexity-user.json) |
| Amazon | [Amazonbot 的 IP 頁面](https://developer.amazon.com/amazonbot/ip-addresses/)，Amzn-SearchBot、Amzn-User 另有各自的頁面 |
| Common Crawl | 反向 DNS `*.crawl.commoncrawl.org`（只有 IPv4），或 [ccbot.json](https://index.commoncrawl.org/ccbot.json) |
| DuckDuckGo | [duckassistbot.json](https://duckduckgo.com/duckassistbot.json) |
| Mistral AI | MistralAI-User、MistralAI-Index 各一份；MistralAI-Training 沒有公布 |
| Meta | 說明頁沒有公布 |

Google 的 IP 範圍檔在 2026 年搬到 `/static/crawling/ipranges/`，舊路徑目前會轉到新檔。另外，Google 正在實驗以密碼學簽章（[Web Bot Auth](https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth)）標示部分 AI 代理的請求，OpenAI 的 [ChatGPT Work 雲端瀏覽器](https://help.openai.com/en/articles/11845367)也會簽署請求（RFC 9421）；Google 說不是每個請求都簽，IP 與反向 DNS 檢查仍要保留。Web Bot Auth 本身仍是 IETF 草案；RFC 9421 是它採用的簽章標準。

## 實例：本站的 robots.txt

以下是[本站的 robots.txt](https://lijiabao.dev/robots.txt) 全文，截至 2026-10-14。它在建置時由網站程式產生，共 285 位元組：

```text
# lijiabao.dev
# Content signals: https://contentsignals.org/
# For language models: https://lijiabao.dev/llms.txt (full text: https://lijiabao.dev/llms-full.txt)

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /

Sitemap: https://lijiabao.dev/sitemap.xml
```

逐項來看：

- **只有萬用群組**：沒有任何具名群組，所以前面表中的名稱都照這一段走，整個檔案也沒有 Disallow。`Allow: /` 依規則可以省略，寫出來是為了讓意思明確。
- **Content-Signal**：對 search、ai-input、ai-train 三種用途都表示同意。不認得這個欄位的爬蟲會略過它（Google 只解析四個欄位），它也不會切斷群組。
- **llms.txt 那一行是註解**：robots.txt 沒有 llms.txt 欄位，所以寫成 `#` 註解：解析器會略過，打開檔案的人或模型看得到。
- **沒有 Cloudflare 的區塊**：檔案裡沒有 `# BEGIN Cloudflare Managed content`，表示 Cloudflare 的 robots.txt 功能沒有在前面加內容。

這是本站的設定：在 robots.txt 這一層，搜尋、AI 回答與 AI 訓練一律允許。它是一個有文件可查的例子，不是建議。robots.txt 也只呈現這一層的表態；CDN 或防火牆在邊緣有沒有另外的設定，從這個檔案看不出來。

## 常見問題

### 擋了 GPTBot，網站還會出現在 ChatGPT 的搜尋答案裡嗎？

仍可能出現：會不會出現看的是 OAI-SearchBot，不是 GPTBot；OpenAI 寫明兩者各自獨立。也要確認萬用群組沒有寫 `Disallow: /`，因為 OAI-SearchBot 沒有專屬群組時會照它走。放行也不保證會被引用。

### 擋 AI 爬蟲會影響 Google 排名嗎？

擋 GPTBot、ClaudeBot、CCBot 等其他公司的爬蟲，和 Google 排名無關；Google 也寫明 Google-Extended 不影響收錄、不是排名訊號。會影響的是對 Googlebot 寫 Disallow（不再檢索）或加 noindex（退出搜尋結果）。

### 擋了 Google-Extended，網站會從 AI 摘要消失嗎？

不會。Google-Extended 管 Gemini 的訓練與 grounding，AI 摘要與 AI 模式屬於 Google 搜尋。要退出，可以在 Search Console 的「設定」>「Google 搜尋生成式 AI」選擇排除；只想限制個別頁面，用 nosnippet、data-nosnippet 或 max-snippet。

### robots.txt 擋得住所有 AI 嗎？已經被抓走的內容呢？

擋不住。robots.txt 不是存取授權，使用者觸發的擷取，多家業者都表示可能不照做；設定也只影響之後的抓取。真的要擋，得靠登入、WAF 或 CDN 的機器人管理。

### 怎麼確認設定生效？

抓線上的 /robots.txt（CDN 可能加了內容），確認每個名稱照哪個群組走，再用存取紀錄與業者公布的 IP 清單或反向 DNS 確認來源。有寫明時間的業者多半約 24 小時，DuckDuckGo 寫 72 小時。

### WordPress 找不到 robots.txt 檔案，要去哪裡改？

WordPress 預設輸出虛擬的 robots.txt，要用 SEO 外掛的編輯器修改：Yoast SEO 的 AI 爬蟲開關要 Premium，AIOSEO 有「Block AI Crawlers」區塊，Rank Math 要先開 Advanced Mode。根目錄若有實體 robots.txt，通常會蓋過外掛的設定。

### 用 Cloudflare 的話，還需要自己寫 robots.txt 嗎？

看你的設定。Training 選「Disallow AI Training」並開啟 Bot Preference Sync 時，Cloudflare 會在 robots.txt 前面加上不訓練的偏好，並在邊緣擋下其他訓練爬蟲，Googlebot、Bingbot、Applebot 仍可為搜尋抓取；不過 Bing 目前收不到這個偏好，要另加 noarchive。選「Block」則連搜尋一起受影響。改完請抓線上的檔案確認。

### AI 爬蟲把主機爬到很慢，robots.txt 有用嗎？

只對遵守規則的爬蟲有用。Crawl-delay 不是標準，Google、Apple、Amazon 都不支援；流量問題要靠 CDN 或防火牆的速率限制與機器人管理。

## 重點整理

- AI 爬蟲分訓練、搜尋／AI 回答索引、使用者觸發三類，另有控制權杖與混合用途爬蟲。
- 同一家公司的名稱原則上各自獨立；一個爬蟲只聽一個群組，具名群組不會繼承萬用群組的規則。
- Google-Extended 管 Gemini 的訓練與 grounding，不影響排名，也不會讓網站退出 AI 摘要；AI 摘要要用 Search Console 的控制項或 nosnippet。
- robots.txt 是請求：使用者觸發的擷取不一定照做，設定也只影響之後的抓取。
- Cloudflare 自 2026-09-15 起，Block 也會擋 Googlebot 等混合用途爬蟲；只退出訓練的是 Disallow AI Training。
- 改完要抓線上版本、看存取紀錄，並等約 24 小時。

想看更多類似的整理，可以瀏覽[本站編輯整理的文章](https://lijiabao.dev/articles/)。
