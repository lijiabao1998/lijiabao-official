---
title: 文章換網址，301轉址與canonical各要怎麼用
description: 永久移動文章網址時，轉址負責引導請求，canonical表達代表版本。核對終點正文、內鏈與網站地圖，避免只改標籤卻留下失效入口。
date: 2026-10-19
tags: [技術 SEO, HTTP, 轉址, 網址管理]
draft: false
sources:
  - title: Google Search Central — Redirects and Google Search
    url: https://developers.google.com/search/docs/crawling-indexing/301-redirects
  - title: Google Search Central — Canonical URLs
    url: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
  - title: Google Search Central — Site moves with URL changes
    url: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes
  - title: MDN — 301 Moved Permanently
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/301
  - title: RFC 9110 — HTTP Semantics
    url: https://www.rfc-editor.org/rfc/rfc9110.html
  - title: Google Search Central — Build a sitemap
    url: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
---

文章永久移到新網址，把新頁的canonical寫好就夠了嗎？如果舊連結仍被收藏、分享或放在其他網站，讀者會繼續從舊入口抵達。文章網址搬遷需要同時處理請求怎麼走，以及搜尋系統應理解哪個版本。以下用假設的文章路徑說明，不代表本站正在搬動既有內容，也不宣稱任何排名已經轉移。

![文章移往新入口的網址轉址概念](../../../assets/articles/article-url-move-redirect-versus-canonical/zh-Hant-hero.webp)

## 先決定是永久移動，還是保留兩個版本

同一篇文章改了正式路徑，與兩個近似頁仍各自提供服務，是不同需求。前者通常希望讀者從舊入口直接到新文章；後者可能仍需保留網址，另用適合的代表版本訊號管理重複內容。先寫出舊址與真正對應的新址，再決定方法，不從方便套用的轉址規則倒推內容關係。

若舊內容已不存在，也沒有合適替代，不應為了避免錯誤回應把所有路徑送到首頁。Google的網站搬遷文件提醒避免不相關轉址；終點能開啟，沒有回答原本的文章需求，仍不是完整交付。

## 301引導請求，canonical沒有搬動讀者

伺服器回傳301及Location，表示資源已永久移到另一位置，瀏覽器通常會接著請求指定終點。Google將合適的永久轉址視為代表網址的重要訊號；它也列有308等方法，具體選擇應符合HTTP語意與系統需求。本文以一般文章GET請求說明，不將同一規則直接套到表單或API。

canonical則表達重複或高度相近內容的首選版本，並不讓瀏覽器自動換頁。舊頁仍回200，只在裡面放指向新頁的標籤，與舊址直接送出永久轉址不同。分清兩種工作，才不會把搜尋標記當成訪客導引已經完成。

## 新終點先有正文，再接舊入口

正式啟用前，先確認新文章可正常讀取，標題、主要段落、圖片和必要連結完整。新頁的canonical應配合新的正式網址；也檢查有沒有測試階段留下的noindex或其他阻礙。不能只看新路徑回200，就將舊流量送過去。

例如假設舊文章在`https://example.com/old-guide`，預定移到`https://example.com/current-guide`，應先驗證後者是對應正文，不是文章列表或錯誤畫面。這是規劃示例，並非已執行的測試結果。正文核對可參考[成功回應與文章驗證](/articles/http-success-article-verification/)。

## 內鏈、網站地圖與語言對應一起更新

網站內自己控制的導覽和文章連結，可直接指向新終點，避免每次點擊都經舊址轉一圈。網站地圖列出希望作為正式版本的網址，與頁面訊號保持一致，不讓舊址長期成為主要發現入口。是否另需其他搬遷步驟，依單頁、整區或跨網域的實際範圍處理。

雙語文章則各自對應同語言的新位置，重新核對hreflang，不把英文舊址一律送到中文首頁。圖片與可下載資源若也改路徑，納入對照清單，不只搬HTML；保留原資源網址可行時，也不要為了整理資料夾任意增加變動。

## 驗證從舊網址第一個回應開始

瀏覽器自動跟隨轉址後，最後只顯示新頁，容易讓人看不見中間發生什麼。檢查時分別記錄舊址第一個狀態、Location、後續跳轉與最終網址，再讀終點主內容。這能辨認跳錯語言、循環、過長鏈或仍指向過時中介頁的問題。

最好讓已知舊址直接到合適終點，而不是累積多代網址逐層相接。測試也要包含正常新頁和不該被此規則涵蓋的路徑，避免過寬規則把其他文章都送走。只在設定檔看到一行對照，仍不是正式網域已按它運作的證據。

## 部署與快取，會影響讀者實際收到什麼

轉址可能由網站程式、主機、CDN或不同層負責。先知道規則落在哪裡、哪個版本已發布，再從正式網址讀回；本地通過或原始碼推送完成，各只能證明其中一段。若回應仍不符預期，查清環境與快取，不立即改第二層規則讓結果更難追查。

永久轉址也可能被快取，推出前應有準確對照與核驗方式。保留必要設定和觀察紀錄，方便判斷讀者是否還走舊入口；不因當天新頁已能讀取，就立刻撤掉外部仍可能使用的導引。

## 搜尋採用與公開導引分開追蹤

正式請求已到達正確文章，代表導引功能可用；Google是否重新抓取、選用新canonical及更新搜尋結果，仍是後續處理。Search Console應核對精確新舊網址與當次資料，不從一次索引請求推定全部訊號都已搬完，也不保證排名毫無波動。

保存實際轉址鏈、終點正文與已發布版本，後續再按搜尋資料觀察。若只是單篇換路徑，不把整站搬遷工具當成一定要啟用的步驟。轉址、代表版本與內容品質各自有作用；文章網址搬遷是否完成，需要它們能在同一個正式結果中對得起來。
