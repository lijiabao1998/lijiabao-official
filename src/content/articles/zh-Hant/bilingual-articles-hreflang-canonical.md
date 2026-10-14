---
title: 雙語文章的 hreflang 與 canonical 各自負責什麼
description: 雙語文章各有正式網址，canonical 表達首選版本，hreflang 連結語言對應。從配對、建置到公開頁逐層核對。
date: 2026-10-15
tags: [技術 SEO, hreflang, canonical, 多語網站]
draft: false
sources:
  - title: Google Search Central — Tell Google about localized versions
    url: https://developers.google.com/search/docs/specialty/international/localized-versions
  - title: Google Search Central — Canonical URLs
    url: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
  - title: Google Search Central — Managing multilingual sites
    url: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
  - title: Astro — Content collections
    url: https://docs.astro.build/en/guides/content-collections/
---

繁體中文和英文各寫了一篇，兩個網址卻都把 canonical 指向中文頁，英文頁還能表達自己是正式版本嗎？這裡容易混淆的是兩種關係：哪個網址代表本頁，以及哪些頁面是同一主題的語言版本。把 canonical 與 hreflang 分清，可以避免為了整理重複網址，反而讓真正的翻譯頁發出互相矛盾的訊號。

![雙語文章並列與各自網址的概念插圖](../../../assets/articles/bilingual-articles-hreflang-canonical/zh-Hant-hero.webp)

## 先確認兩頁真的有不同語言的正文

雙語文章需要各自可讀的正文，只換選單和頁尾語言，不能當作完成兩個內容版本。Google的多語網站文件說明，頁面可見內容參與語言判斷，不是網址含有英文字就會成為英文頁。實作前先逐頁閱讀標題、摘要和正文，確認翻譯保留實質資訊，也適合該語言讀者。

內容尚未完成的版本，先保留草稿，不建立指向空頁的語言對應。來源、更新日期與重要限制也要在兩版各自說清楚，避免英文只是中文文章的短摘要，卻在導覽裡被當成完全等效的完整指南。

## canonical 表達本頁首選網址

canonical用來提示搜尋引擎，重複或高度相近的網址中偏好哪個代表版本。真正翻成另一種語言的正文，不宜只因主題相同就全部指向單一語言；Google建議在使用語言對應時，選擇相同語言的canonical，或在缺少該語言代表頁時用合適替代。

對兩個各自正式發佈的語言版本，常見安排是各自指回自己的正式網址。例如中文頁對應中文路徑，英文頁對應英文路徑。這是訊號安排，不是Google必然採用的保證，也不是一個標籤便能處理所有索引問題。

## hreflang 表達語言版本的對應

hreflang描述的是語言或地區關係。兩個對應版本需要列出自己和對方，並使用完整正式網址；只在中文頁加英文連結，英文頁沒有回指，會留下不完整的配對。這個對應應以文章身份建立，不從標題相似就把不同主題配成同一組。

可以用一個穩定的文章識別搭配語言查找版本，讓首頁、文章列表和語言切換都讀取相同資料。若某篇只有中文，切換到英文文章索引可以作為讀者導覽，但不能把索引假裝成該篇英文翻譯放入配對。

## zh-Hant 與 x-default 各有用途

zh-Hant表示繁體中文；如需針對特定地區，語言及地區設定另按內容需求處理，不能只寫一個國家代碼當語言。英文使用en或更具體設定，也要和真正內容一致，不因網站位於台灣就把所有版本都限制成同一地區。

x-default提供未符合其他設定時的備援選擇，不是另一個已翻譯語言。網站可以按導覽策略選擇適合的頁面，但需清楚知道它代表什麼。語言配對和備援路徑各自核對，才不會把還沒做好的版本藏在一個看似完整的標籤組裡。

## 用同一份內容資料產生相關輸出

以Astro內容集合為例，可以從已發佈的文章資料找同一識別的其他語言，讓頁面、列表和網站地圖依相同來源產生。草稿條件也共用，避免HTML沒有英文正文，網站地圖卻先列出英文網址。這是可採用的實作方式，並非本文宣稱每個網站已經通過的測試。

canonical、語言對應和文章日期分別有自己的欄位與意義，不把更新日期塞進slug解決版本問題。建置產物再檢查實際內容，不能只看來源資料裡有兩筆便宣布雙語發佈完成。

## 驗證時把建置和正式頁分開

先讀建好的兩個HTML：正文是否存在、canonical是否各自正確、語言對應是否互相完整，以及文章內鏈能否到達。若正文需要JavaScript才出現，單純在原始碼找到標題，仍不足以證明完整內容已預先呈現。圖片及替代文字也依各版實際產物確認。

推送後，再讀正式網域上的兩個網址與網站地圖，排除部署尚未更新或快取仍送舊版本的可能。來源commit、建置結果和公開內容是三種證據，互相對得上才足以說明這次發佈的範圍；通過建置本身不是已收錄的證明。

## 語言切換讓讀者保留選擇

Google的多語文件建議避免只因猜測使用者語言就自動跳到另一版，並提供明確的語言連結。對文章頁而言，連到同主題另一語言，比每次回到首頁更容易保持閱讀脈絡。沒有對應版本時，就如實連到索引，而不是偽造一個不存在的文章路徑。

發佈後若要追蹤搜尋表現，兩個網址分別核對索引及查詢資料，不能把中文頁有曝光推成英文頁也已完成。可接著閱讀本站的[爬蟲與robots.txt整理](/articles/ai-crawlers-robots-txt/)，理解抓取偏好和語言配對是不同工作。
