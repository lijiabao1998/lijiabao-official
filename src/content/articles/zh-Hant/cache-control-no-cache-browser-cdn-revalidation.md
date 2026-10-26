---
title: "no-cache不是不快取，網站更新怎麼分辨瀏覽器與CDN的舊回應"
description: "no-cache要求重用前驗證，不等於no-store。從ETag、304與瀏覽器和CDN各層回應，理解網站更新後舊內容的排查順序與證據限制。"
date: 2026-10-26
tags: ["網頁開發", "HTTP", "部署驗證"]
draft: false
sources:
  - title: "RFC 9111 — HTTP Caching"
    url: "https://www.rfc-editor.org/rfc/rfc9111.html"
  - title: "MDN — HTTP caching"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching"
  - title: "MDN — ETag"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag"
  - title: "MDN — 304 Not Modified"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304"
  - title: "MDN — Request cache"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Request/cache"
  - title: "Cloudflare — Origin Cache Control"
    url: "https://developers.cloudflare.com/cache/concepts/cache-control/"
  - title: "Cloudflare — Purge by single-file"
    url: "https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/"
---

網站已部署，重新整理卻還看到舊段落，第一個反應常是把所有快取關掉。但HTTP快取有不同位置，也有不同重用條件；看到no-cache，並不表示回應完全不會被保存。先辨認自己拿到哪個網址、哪一層的回應，再比較內容與標頭，比立即全面清除更容易找到問題。以下是排查方法，沒有宣稱已替任何正式站變更設定或完成實測。

![多層資料保存與更新查核的抽象概念](../../../assets/articles/cache-control-no-cache-browser-cdn-revalidation/zh-Hant-hero.webp)

## 先記下精確網址與真正需要更新的內容

同一篇文章可能有不同語言、尾端斜線、轉址與資源網址。排查前先留下實際開啟位置、觀察時間及正文中特有的一段，別只靠首頁摘要判斷文章。圖片、樣式和頁面也可能各用不同網址，不將其中一張圖變新視為整頁已更新。

原始碼與部署版本仍要先對上，可搭配[Git提交到正式站的核對方法](/articles/git-commit-cloudflare-production-verification/)。若建置本來就沒有包含新內容，快取不是已經確定的原因；保留這個可能，避免從第一步就只追一種解釋。

## no-cache保留重用前驗證的要求

[RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html)對沒有附加欄位參數的no-cache回應指令，要求經成功驗證後才能重用。這和不能儲存是不同意思。快取可以保有回應，再確認它是否仍可使用，未變更時便不必重新傳送相同正文。

所以看到本地曾儲存的回應，不足以判定no-cache失效；還要看實際請求與驗證結果。也不要把瀏覽器上一頁恢復的歷史畫面，直接當成一個已重新發出的網路請求，[MDN快取指南](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)另有說明這類差異。

## no-store與private，各自處理不同限制

no-store針對儲存限制，private則限制共享快取儲存，但並不等於內容已加密或權限已設計完成。它們不應只當成修正舊畫面的同義開關；對個人化內容，仍要確認回應可分享給誰，以及系統如何驗證和授權。

新增標頭也不是已保存副本的遠端刪除按鈕。若原本有錯誤的公開快取，處理需要回到實際平台與既有副本，不只改一行便宣稱所有位置都已清除。敏感資訊的存取控制與快取策略應一起評估，不能用其中一項代替另一項。

## ETag與304，是確認可重用的線索

[MDN的ETag說明](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag)介紹驗證標記如何與條件式請求配合。客戶端可帶上已知標記，由伺服器判斷目前表示是否改變；標記是用來驗證回應，不應被直接當成Git提交識別。

[304 Not Modified](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304)表示此條件下不需重傳資源正文，不是部署成功證書，也不是請求失敗。若內容應更新卻持續獲得舊結果，要查標記、實際來源與對應資源，不能只因狀態碼不是200就改成反覆發布。

## 瀏覽器與CDN，分開觀察再比較

瀏覽器可能保留本地回應，中間CDN則有自己的規則與狀態。開發工具中標示來自記憶體或磁碟，與真的取得網路回應，需要分清；另一個瀏覽器看見不同內容，也只是線索，不直接證明哪一層有錯。

可比較同一精確網址的正文、Cache-Control、ETag及平台提供的相關標頭，記錄觀察環境。[Cloudflare快取控制文件](https://developers.cloudflare.com/cache/concepts/cache-control/)也區分來源與平台行為。實際是否套用仍依專案設定，不從一個標頭推論所有讀者都取得同一節點或同一版本。

## 重新整理與程式請求，不用名稱猜效果

瀏覽器重新整理、強制重新整理與程式的fetch選項，不是可以只按字面互換的動作。[Request.cache文件](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache)說明不同模式如何使用瀏覽器HTTP快取；這些選項也不構成清除所有CDN副本的指令。

排查時先記下用了什麼方法，再比較實際請求和結果。開發工具暫停使用本地快取，可以協助隔離觀察，但不是所有訪客的正式策略已經改變。測試瀏覽器上的一次新畫面，應寫成該環境觀察成功，不誇大為全網同步完成。

## 清除只針對已確認需要的層與範圍

若證據指向CDN的舊資源，可在具備權限且符合維運安排時，選擇適當清除範圍。不要在發現一篇舊文後直接清掉整站，再從結果碰巧改變推定原因。[Cloudflare單一檔案清除文件](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/)也提醒，自訂快取鍵會影響如何對準需要清除的項目。

平台處理完成後，仍回到正式網址讀回正文與資源，記錄時間。清除操作被接受、回應已更新和全部使用者都看到相同內容，是不同主張，需要不同證據；本文只描述排查原則，沒有替讀者執行任何清除。

## 交付時寫觀察範圍，保留仍未確認的部分

一份有用的結果可說明部署來源已確認、哪個網址在何種請求下讀到新正文，以及相關圖片是否也更新。某層無法取得資訊，就保留未確認，不用看起來正常補成全數通過，也不要求從頭再發一次文章。

[成功回應與文章存在的差別](/articles/http-success-article-verification/)及[測試通過與功能驗收](/articles/passing-tests-versus-feature-acceptance-evidence/)同樣適用。排查HTTP快取的目的，是讓每一個新舊結果能對回來源與條件；完成到哪裡說到哪裡，下一次才知道應重查哪一段。
