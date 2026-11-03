---
title: "外部連結的noopener、noreferrer與nofollow，各自在管什麼？"
description: "外部連結的視窗存取、來源資訊與搜尋關係屬於不同層次。分清noopener、noreferrer和nofollow，再依連結目的選值，從正式HTML與實際行為分開驗證。"
date: 2026-11-03
tags: ["網頁開發", "技術SEO", "網站安全"]
draft: false
sources:
  - title: "MDN: rel=noopener"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener"
  - title: "MDN: rel=noreferrer"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noreferrer"
  - title: "Google Search Central: qualify outbound links"
    url: "https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links"
---
## 先把問題分成三層，不從一串慣用值開始

網站把外部連結全部補上同一組rel值，看起來整齊，卻可能把不同需求混在一起。有人想避免新視窗存取原頁，有人不想傳來源資訊，也有人只是要標示付費連結；三件事不是同一個設定。以下用虛構文章頁示範如何選擇與驗收，不代表本站已對任何特定第三方連結完成實測，也不要求回頭批次改寫所有歷史頁面。

![桌面上的獨立金屬連結環與收妥的筆記本](../../../assets/articles/external-link-noopener-noreferrer-nofollow/zh-Hant-hero.webp)

第一層是開啟方式與視窗之間的關係，第二層是請求是否攜帶來源資訊，第三層是提供給搜尋引擎的連結關係。它們可能出現在同一個a元素，判斷目的卻不同。維護者若只收到外部連結都處理好這句需求，應先說明希望改變哪種行為，再決定使用什麼。畫面上點得開，不能證明三層都符合；反過來，原始HTML有一個rel欄位，也不等於已經驗證全部結果。

## noopener處理的是新視窗的opener關係

依MDN說明，noopener讓新瀏覽內容不取得開啟它之頁面的Window.opener；它本身不是用來移除Referer。現行HTML對一般target為_blank的連結也有相應的隱含noopener行為，但仍需留意實際使用方式和支援範圍。將需求寫成新頁不應藉opener操作原頁，比只說要加安全標籤具體。驗證可以在自己的受控測試頁進行，不需要打開陌生網站，更不應把正式帳號資料交給外部頁測試。

## noreferrer處理來源資訊，也帶有noopener效果

MDN將noreferrer說明為不傳遞Referer等來源資訊，並同時採取noopener行為。這與只切斷opener的目的不同；若只需要前者那種視窗隔離，未必有理由順便改掉來源傳遞。選擇前先問網站希望對外提供什麼資訊，以及是否有明確隱私或分析需求。來源資料減少，也不能直接推論實際點擊沒有發生。維護者應把資料缺少和使用者行為分開理解，不因某個報表欄位改變，就斷言連結成效下降。

## nofollow表達搜尋關係，不會替頁面上鎖

Google說明可用nofollow表達不希望建立的連結關係，另提供sponsored與ugc等用途；這些不是視窗存取或來源隱私設定。它們也不保證目標頁不會從其他途徑被發現。一般編輯引用官方資料，和付費版位或使用者留言，可以有不同處理理由，不宜全部一律貼成同一種關係。若目標是控制自己的私人內容，則回到存取權限；不要把外部連結rel值當成密碼，也不把它當成已完成索引控制的證據。

## 按目的組合，讓每一個值都有理由

例如虛構文章要在新分頁開官方文件，並希望保留可用的來源資訊，可以針對開啟方式與opener隔離選擇相應設定；若另有明確不傳來源需求，再考慮noreferrer。付費連結的關係標示則另外判斷，不因用了其中一個值，就認為其他目的也自動達成。多個rel值可以共存，但共存不表示每個都必須出現。實作說明最好留下選擇目的，不只交付一串複製來的字，讓日後接手者能理解哪些行為是刻意保留。

## 檢查輸出位置，不只檢查內容編輯器

實際網站可能由Markdown、CMS區塊或前端元件產生連結，編輯畫面顯示的資料不一定等於最後HTML。先列出本次涉及哪些來源與元件，檢查建置後的a元素、href、target及rel，並確認程式沒有把值覆寫或重複加入。若頁面載入後還會改動，也再看呈現後DOM。這是一個可採的驗收方法，沒有宣稱單靠搜尋一段原始碼就已測完，也不為核對連結而順手改動不在本次範圍的表單或舊文章。

## 把導覽、來源與搜尋驗收分成不同結果

在已授權測試環境，先確認連到正確目的地和預期分頁，再用受控頁觀察opener行為；若要核對來源資訊，使用可控制的接收端與合適工具，避免將機密網址或個資送到第三方測試站。搜尋關係則核對實際標記與其用途，不能以一次點擊就證明Google已如何處理。每項紀錄寫明測了什麼、尚未測什麼。工具無法觀察某層時，就保留未驗證，不拿另一層成功補上。

## 元件更新後，以代表案例檢查是否仍符合目的

網站若集中管理連結元件，可以選一般引用、付費版位及其他實際存在的類型，分別確認輸出；沒有某種類型就不為測試捏造正式版位。調整後仍查看正式部署頁，因為本機產物和線上快取可能不同。原始需求、變更範圍與驗收結果一起保存，日後才能知道哪個值可以調整、哪個需求仍需要。這種檢查可以由每次獲准維護時執行，不代表已替網站建立持續監控或自動更改機制。

連結設定的可讀性，來自每個值都有明確目的。視窗關係、來源資訊與搜尋標示各自選擇，再用相應證據驗收，會比全站套一串相同屬性更容易維護。

延伸閱讀：[robots.txt 不能替管理頁上鎖，爬蟲規則與存取控制要分開](https://lijiabao.dev/articles/robots-txt-not-admin-access-control/)、[雙語文章的 hreflang 與 canonical 各自負責什麼](https://lijiabao.dev/articles/bilingual-articles-hreflang-canonical/)
