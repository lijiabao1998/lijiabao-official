---
title: "Sitemap 網址含 & 時，XML 跳脫與 URL 編碼怎麼分？"
description: "Sitemap 裡的 XML 跳脫與 URL 百分比編碼處理不同層次。以查詢參數為例，核對序列化前後的網址語意，避免把可解析檔案誤認為正確網址。"
date: 2026-11-07
tags: ["網頁開發", "技術SEO", "部署驗證"]
draft: false
sources:
  - title: "Sitemaps.org: Protocol"
    url: "https://www.sitemaps.org/protocol.html"
  - title: "RFC 3986: Uniform Resource Identifier (URI): Generic Syntax"
    url: "https://www.rfc-editor.org/rfc/rfc3986.html"
  - title: "MDN: URLSearchParams toString() method"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/toString"
  - title: "Google Search Central: Build and submit a sitemap"
    url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap"
---
## 先分清網址與裝著網址的文件

網址放到瀏覽器可以開，複製進 Sitemap 卻出現 XML 解析錯誤，問題可能不是文章不存在，而是網址還沒有以合適的方式寫進文件。尤其網址包含多個查詢參數時，原本作分隔的 &，到了 XML 文字裡還需要跳脫。這和把參數值做百分比編碼是兩件事；如果混在一起處理，可能修好了語法，卻悄悄改變真正指向的網址。

![抽象網址連結穿過透明文件框，呈現網址與文件兩種層次](../../../assets/articles/sitemap-xml-escaping-url-percent-encoding/zh-Hant-hero.webp)

Sitemap 的 loc 元素存放頁面網址，外層則是有自己語法的 XML。網址本身正確，不代表直接串接進 XML 字串就一定正確。協定要求文件使用 UTF-8，資料值也要符合實體跳脫規則。產生器應在輸出階段負責正確序列化，避免逐列手改網址。若網站已有可靠的 Sitemap 工具，先確認它接收的是原始網址還是已處理字串，不要在外面再加一層不明替換。

## 兩個參數的分隔符，需要在 XML 中跳脫

以虛構網址 `https://example.com/catalog?kind=chair&page=2` 為例，放在 XML 的 loc 文字裡時，參數之間的 & 應寫成 `&amp;`。XML 解析器讀回文字後，得到的仍是原本有兩個參數的網址；不是要求瀏覽器真的前往含有 amp; 字樣的新參數。檢查時應區分原始 XML 與解析後的值，不能因為瀏覽器的樹狀檢視顯示 &，就推定原始檔一定漏了跳脫。

## 參數值自己的 &，則是另一個層次

如果某個參數值本身包含 A&B，而不是要開始下一個參數，就需要依 URL 的組成規則編碼該值。查詢序列化工具可以將值中的 & 轉成 `%26`，讓它維持資料意義；完成後，整個網址再交給 XML 序列化。不能將網址中所有 & 一律改成 `%26`，因為那可能連原本用來分隔參數的符號一起改掉，讓伺服器收到的參數數量或內容不同。

## 同一層重複處理，會產生另一種錯誤

若工具已將 & 輸出成 `&amp;`，外層又把其中的 & 再跳脫一次，原始 XML 可能出現 `&amp;amp;`。這份文件甚至仍可解析，卻可能讀出不是預期的網址。百分比編碼也有類似問題，已處理的百分號再次編碼後，可能變成不同字串。RFC 3986 提醒不要對同一字串重複編碼或解碼；實作要先知道資料目前所在層次，不用多轉一次比較安全當成原則。

## 讓 URL 工具與 XML 工具各做一段

可先用符合需求的 URL 工具建立路徑與參數，取得正確網址，再以 XML 函式庫將它設為 loc 的文字內容，交由函式庫序列化。這是責任分工的設計方向，不是本文宣稱已替每個框架驗證過的通用程式碼。使用特定套件時，仍要讀取其輸入規格，確認是否已自行處理 XML；不要把編碼函式名稱相近，當成兩者可互換的依據。

## 驗證語法之後，再核對網址的意思

測試可挑選含多個參數、參數值含特殊符號，以及中文路徑的代表樣本。先確認輸出可由 XML 解析器讀取，再取出 loc 的文字值，與序列化前預期的 URL 比較。若要驗證查詢內容，也應按相同網址規則讀回參數，確認原值沒有被拆開或多出 amp;。這類檢查能發現字串看起來像網址、實際參數卻不同的問題，比只確認檔案裡有 loc 標籤更具體。

## 正式檔案正確，仍不等於已收錄

部署後讀取正式 Sitemap，確認不是錯誤頁、舊快取或登入頁，再對照已驗證樣本。HTTP 200 不會替代 XML 與網址內容檢查；同樣地，語法正確也不保證列出的每個網址都是應收錄的 canonical 頁。列入哪些頁面、搜尋引擎是否抓取與最終索引，仍是另外的判斷。若問題出在產生器，修正輸出邏輯並驗證即可，不需要重新發布所有文章來湊出新的網址。

XML 跳脫負責讓資料能放進文件，URL 編碼負責保留網址各部分的語意。先建立正確網址，再交給正確的文件序列化工具，最後解析回來核對，才能同時回答檔案能不能讀，以及讀到的是不是原本想列的頁面。

延伸閱讀：[網站地圖lastmod為什麼不該每次建置都變成今天](https://lijiabao.dev/articles/sitemap-lastmod-content-updates/)、[文章換網址，301轉址與canonical各要怎麼用](https://lijiabao.dev/articles/article-url-move-redirect-versus-canonical/)
