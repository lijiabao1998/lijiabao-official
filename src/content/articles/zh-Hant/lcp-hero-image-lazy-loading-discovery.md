---
title: "首屏主圖該用lazy嗎？先讓瀏覽器及時找到LCP圖片"
description: "首屏主圖不宜只因全站圖片預設就套用lazy。從LCP候選、HTML可發現性、載入優先權與實際驗證，找出圖片為何晚開始下載。"
date: 2026-11-02
tags: ["網站效能", "圖片載入", "網頁開發"]
draft: false
sources:
  - title: "web.dev: Optimize Largest Contentful Paint"
    url: "https://web.dev/articles/optimize-lcp"
  - title: "MDN: HTML img element"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img"
  - title: "MDN: HTMLImageElement fetchPriority property"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/fetchPriority"
  - title: "Chrome for Developers: LCP request discovery"
    url: "https://developer.chrome.com/docs/performance/insights/lcp-discovery"
  - title: "MDN: rel=preload"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload"
  - title: "web.dev: Browser-level image lazy loading for the web"
    url: "https://web.dev/articles/browser-level-image-lazy-loading"
---
## 先找到真正的LCP元素

文章封面已壓成小容量WebP，頁面卻仍等了一段時間才出現主圖，問題可能不在圖片位元組，而在瀏覽器何時知道它存在。對首屏關鍵圖片，節省不必要下載和及時開始必要下載，需要分開安排。以下以LCP圖片的發現與載入為主線，說明如何判斷lazy、優先權和預載，沒有宣稱任何正式網站已完成改動或取得效能提升。

![抽象瀏覽器框架中的大型主圖，有一道連續光路連向前方資料來源](../../../assets/articles/lcp-hero-image-lazy-loading-discovery/zh-Hant-hero.webp)

Largest Contentful Paint衡量可視區域中最大內容元素的呈現時點，實際候選不必然是版型稱為hero的那張圖，也可能是文字。先在相應頁面與裝置條件量測，確認本次元素，再決定要改善哪個資源。不能因首頁主視覺最大，就把所有文章頁也當成相同情況。

手機與桌機的可視範圍、版面和圖片選取可能不同，候選也可能改變。留下精確網址、測試條件與辨識到的元素，才能讓後續變更對準問題。一次量測只是該條件的觀察，不宜直接寫成每位使用者都等待同一張圖片。

## 真正的首屏關鍵圖，不宜被延後發現

web.dev的LCP最佳化指南明確提醒，不要對LCP圖片使用延遲載入。原生`loading="lazy"`讓瀏覽器依其判斷延後載入不在適當範圍內的圖片，並不是所有內容都先下載好、只晚一點顯示。真正需要及早出現的圖若被延後，就可能增加資源開始載入前的等待。

因此先檢查版型與元件有沒有對全部圖片套相同預設，再確認正式輸出的關鍵圖。這不表示下方圖片都應改成積極載入，也不保證刪掉lazy就解決整頁問題；調整應針對已辨認的關鍵元素，讓其他資源仍有合適安排。

## HTML有圖片網址，瀏覽器才有早期線索

若圖片的網址只放在自訂資料屬性，必須等JavaScript執行後才寫入`src`，初始HTML便缺少直接可用的圖片來源。背景圖也可能要等樣式表取得與解析後才能被發現。畫面最後有出現，不能證明瀏覽器一開始就知道要下載。

檢查原始回應與實際建置輸出，分清是原生圖片、CSS背景還是腳本後加的資源。必要時讓關鍵圖片的可用來源在早期文件中出現，不只是把同一張圖從大檔換成小檔。網址大小寫、資產轉換與實際回應也要對上，避免早早找到的卻是一個錯誤路徑。

## fetchpriority是提示，不能代替來源發現

對已確認重要的圖片，可以評估使用`fetchpriority="high"`。MDN將它描述為提供相對載入優先權的提示，實際行為由瀏覽器及其他條件決定，不是保證網路請求一定排第一。若圖片網址本來要很晚才產生，優先權提示也不會讓尚未被發現的資源提前存在。

不要把每張縮圖與所有首屏裝飾都設為高，讓原本想表達的差異消失。先辨認真正重要的資源，再看請求何時發生、優先權與其他競爭，才知道提示是否對本次載入有幫助。它也不能替代圖片尺寸、編碼或伺服器回應本身的處理。

## 預載要對準瀏覽器最後會選的圖片

當關鍵圖片因樣式或其他流程而難以及時發現，可評估適當的預載。這不是每頁加一排`preload`就會更快，而是把需要的來源提早交給瀏覽器。若HTML中的圖片已能早期發現，先確認真正延誤在哪裡，不必為了看起來完整而增加另一個設定。

有`srcset`、`sizes`或不同格式選擇時，預載與實際選取需一致，避免先下載一張，版型又選另一張。手機測試尤其要看實際請求，不只看原始碼有沒有一個預載連結。新設定若讓額外資源提早競爭，應如實記錄，不把更多請求當成最佳化成功。

## 拆開開始下載、下載完成與實際繪出

圖片等待可以發生在不同階段：伺服器回應較慢、資源發現晚、下載本身較久，或下載後仍受版面與繪製條件影響。只有總分變化，難以知道剛才改動解決哪一段。web.dev將LCP拆成不同時間部分，能幫助對照網路紀錄與實際呈現。

例如檔案已變小，請求卻仍在腳本後才開始，就不能把剩餘等待都歸因壓縮不足。圖片已取得但畫面仍未呈現，也需要看其他條件。保留各段證據，通常比繼續降低圖片品質或同時更動多個設定，更容易找到下一步。

## 保留版面尺寸，也檢查讀者看到的畫質

圖片的寬高與版面占位，有助於避免載入後擠動其他內容，這和資源何時發現是不同議題。把兩者都檢查，不因LCP改善就忽略版面位移，也不因版面穩定便推定圖片載入已及時。實際用途需要的解析度和視覺品質，仍要看正式頁面。

可參考既有的WebP編碼與交付驗證文章，確認最終選取資源而不只檢查檔名。這篇討論的是載入時機，不以額外放大失真或移除內容取得好看的數字；若犧牲了可讀性，結果應被視為仍需調整。

## 用相同條件驗證，再分開描述影響

變更前後對同一網址、相近網路與裝置條件量測，保留多次觀察及資源請求資訊。初次載入與已有快取的結果分開看，不以一次暖快取作為所有訪客的成效。正式建置與部署也要確認，來源碼改了不表示線上頁面已採用。

回報可寫明哪張圖已移除延遲、HTML何時可發現來源，以及本次條件下各段時間如何變化。沒有觀察到的使用者情況，保留未知；沒有足夠資料，也不宣布搜尋排名已改善。讓量測對應具體改動，才能判斷下一次應調整來源、優先權還是其他瓶頸。

首屏關鍵圖需要的不只是一個小檔案，也需要瀏覽器及時取得來源。先辨認LCP，再檢查發現、優先權與實際繪製，讓每一項設定都有清楚用途，也讓效能結論保留可驗證的範圍。

延伸閱讀：[圖片改成.webp就會變小嗎？從副檔名、編碼到實際下載量驗收](https://lijiabao.dev/articles/webp-extension-encoding-transfer-size-validation/)、[no-cache不是不快取，網站更新怎麼分辨瀏覽器與CDN的舊回應](https://lijiabao.dev/articles/cache-control-no-cache-browser-cdn-revalidation/)
