---
title: "只想顯示密碼，為什麼一按就送出表單？"
description: "從顯示密碼的切換鈕出發，辨認按鈕所屬的表單、原生送出行為，以及鍵盤驗收該看什麼。"
date: 2026-11-23
tags: ["網頁開發", "HTML", "表單"]
draft: false
sources:
  - title: "MDN：button 元素"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button"
  - title: "MDN：SubmitEvent.submitter"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent/submitter"
---

先查看切換鈕的 HTML。一般的 button 元素只要屬於某個 form，省略 type 時通常就會觸發送出。把只負責顯示密碼的表單按鈕明確寫成 type="button"，並把真正的登入鍵寫成 type="submit"，兩個動作就各有用途。

![兩個不同顏色的鍵盤開關放在有表單畫面的筆電前](../../../assets/articles/html-button-type-implicit-form-submit/zh-Hant-hero.webp)

## 表單按鈕旁邊明明寫「顯示」，瀏覽器怎麼會送出？

按鈕上的文字告訴人會發生什麼事，瀏覽器則依元素的型別和它所屬的表單決定預設動作。密碼欄若設成必填，按下眼睛圖示卻看到「請填寫這個欄位」，可能是瀏覽器已走到送出前的欄位檢查。這時甚至還沒送出網路請求。

## 看清楚這顆按鈕究竟屬於誰

從開發者工具選取實際按鈕，檢查它的 type 與 form。雖然按鈕經常放在 form 裡面，HTML 也允許用 form 屬性指向同一份文件中有對應 id 的表單。抽成共用元件後，單看按鈕外觀或元件檔名，很難知道使用它的頁面接上了哪個表單。

## 把切換與登入寫成兩個動作

在切換用的表單按鈕加上 type="button"，點擊時只切換密碼欄的呈現，保留原來輸入的內容。登入鍵維持 type="submit"，在表單的 submit 事件處理真正的送出流程。若有「儲存草稿」和「立即發佈」兩種合法的送出用途，可以由 SubmitEvent 的 submitter 辨認是哪一顆觸發。

## 怎麼用鍵盤測出表單按鈕有沒有改對？

先留下空的必填欄，分別用滑鼠和鍵盤啟動顯示鍵。密碼可見狀態應切換，欄位不應跳出送出時的驗證。接著填妥測試資料，用鍵盤操作登入鍵，確認預期的驗證及送出仍存在。可在測試環境觀察 submit 事件和網路紀錄，避免用正式使用者資料驗收。

## 常見問題：把按鈕移到表單外面可以嗎？

先看是否還有 form 屬性連回原處。若控制項本來就和密碼欄一起使用，只為避開預設行為而移動它，還要重新檢查操作順序與排版。在這個例子，直接指定型別通常更清楚。

建立共用表單按鈕元件時，可以把「只操作畫面」和「送出資料」都列為測試情境。日後同一顆圖示進入註冊、登入或修改密碼頁，開發者也看得出原先的設計意圖。

延伸閱讀：[FAQ 用內建展開元件，鍵盤能直接操作嗎？](https://lijiabao.dev/articles/native-details-summary-keyboard-access/)、[看不見不等於讀不到，hidden、aria-hidden與inert各在處理什麼](https://lijiabao.dev/articles/hidden-aria-hidden-inert-visibility-accessibility/)
