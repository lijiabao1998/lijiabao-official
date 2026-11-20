---
title: "FAQ 用內建展開元件，鍵盤能直接操作嗎？"
description: "FAQ 可以使用瀏覽器原生開合功能；從 summary 的鍵盤焦點、空白鍵、連結順序到讀屏支援，釐清需要保留與實際驗證的行為。"
date: 2026-11-20
tags: ["網頁開發", "無障礙", "瀏覽器"]
draft: false
sources:
  - title: "MDN：details 的原生開合與鍵盤操作"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details"
  - title: "WHATWG HTML：details 與 summary 的語意和群組"
    url: "https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element"
  - title: "MDN：summary 與輔助技術支援差異"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/summary"
  - title: "W3C WAI：可見的鍵盤焦點"
    url: "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html"
---

可以。正確使用 details 元素與其中的 summary，瀏覽器就有內建的展開、收合操作，不必先下載一套互動套件。但把元件放進漂亮的 FAQ 版型後，還要確認焦點看得見、問題文字清楚，而且附加程式沒有攔住原本的操作。

![自然光下的鍵盤與失焦網頁畫面，手指靠近空白鍵](../../../assets/articles/native-details-summary-keyboard-access/zh-Hant-hero.webp)

## details 元素裡，哪一行是可以操作的問題？

把完整問題放在第一個 summary 子元素，答案放在它後面。HTML 標準用這個結構表達「顯示更多資訊」：讀者啟動摘要時，瀏覽器會切換 open 屬性。問題若只寫「更多」，收合狀態就很難分辨每一題。可以直接寫「可以修改預約時間嗎？」這類有意義的問句，讓使用者在展開以前便知道自己要找哪一項。

## 先用 Tab 找到問題，再按空白鍵

MDN 明確說明，取得焦點後按空白鍵，可以開啟或關閉內容。驗收時先將滑鼠放在一旁，用 Tab 移到問題，確認畫面有焦點提示，再操作開合；答案內若有連結，也走過連結並用 Shift+Tab 返回。這是一套建議的測試步驟，並非本文已在所有瀏覽器實測的結果。details 元素的基本行為由瀏覽器提供，作業系統的鍵盤導覽設定、瀏覽器與輔助技術仍應記在實際測試條件裡。

## 換了外觀，也要保留焦點與狀態線索

小三角形可以換成符合版型的圖示，卻不能把「看起來整齊」當成唯一目標。W3C 的焦點可見說明指出，鍵盤使用者需要知道目前操作到哪個項目。若樣式移除了預設外框，應提供清楚的替代提示；滑鼠移過才變色，無法回答鍵盤停在哪裡。圖示也應隨實際開合狀態改變，避免答案已展開，箭頭卻仍顯示關閉。

## details 元素需要再寫一套鍵盤事件嗎？

一般 FAQ 的開合不需要自行重做。若又在按鍵事件裡切換 open，同時保留瀏覽器原有動作，便可能出現互相干擾；是否發生，應查看實際事件與狀態。需要觀察狀態變化時，可以從 toggle 事件讀取結果。另要注意，details 元素適合揭露補充內容；HTML 標準不把它當成分頁標籤或功能選單的替代品。外觀同樣有小箭頭，不代表使用者期待的操作也相同。

## 能展開，就代表讀屏與整組 FAQ 都通過了嗎？

還不能。MDN 提醒，summary 在不同瀏覽器中的角色處理可能影響內部標題能否被輔助技術辨認。若把標題元素放進摘要，需在目標組合確認讀到的名稱與狀態。多題共用 name 可形成一次只開一題的群組，但先想想讀者是否需要並排比較兩個答案；HTML 標準也提醒，強制關閉其他項目可能妨礙這種閱讀。一般問答沒有必須互斥的理由時，可以讓多題同時保持展開。

交付時記下問題是否能到達、焦點是否可見、開合後答案如何閱讀，以及測過哪些瀏覽器與輔助技術。這些觀察比只確認畫面上有一排可點的問題，更能說明 FAQ 是否可用。

延伸閱讀：[看不見不等於讀不到，hidden、aria-hidden與inert各在處理什麼](https://lijiabao.dev/articles/hidden-aria-hidden-inert-visibility-accessibility/)、[圖片 alt 和圖說不同，為何後台的一欄會同時顯示兩次？](https://lijiabao.dev/articles/image-alt-text-visible-caption-field-mapping/)
