---
title: "API 回傳 404，為什麼 fetch 沒有進入 catch？"
description: "fetch 收到 404 不一定拒絕 Promise。分開檢查 HTTP 狀態、回應本文與解析結果，讓錯誤訊息指出真正失敗的階段。"
date: 2026-11-21
tags: ["網頁開發", "JavaScript", "瀏覽器"]
draft: false
sources:
  - title: "MDN：fetch 與 HTTP 錯誤回應"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch"
  - title: "MDN：Response.ok 的狀態碼範圍"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Response/ok"
  - title: "MDN：JSON 解析的非同步結果與例外"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Response/json"
---

因為收到一份 404 回應，仍然是成功取得回應。fetch 錯誤處理需要由程式讀取狀態碼，決定怎麼處理這份結果；catch 不會自動把所有非成功的 HTTP 狀態收進來。若只把「沒有進 catch」當成成功，畫面就可能把伺服器的錯誤資料當成正常內容。

![工作桌上的螢幕以不同區塊呈現回應、狀態與解析流程的概念](../../../assets/articles/fetch-http-error-response-json-handling/zh-Hant-hero.webp)

## fetch 錯誤處理先分清：有回應，還是有成功資料？

MDN 的 fetch 參考文件說明，取得 Response 物件後，Promise 便可以完成；404 或 504 這類狀態本身不會使它拒絕。相對地，網路錯誤或無效請求等情況可能讓 Promise 拒絕。這兩種路徑提供的資訊不同：前者還有可檢查的 HTTP 回應，後者未必能取得同樣的狀態與本文。

## 讀取 ok，仍要知道端點預期回什麼

Response.ok 表示狀態碼是否落在 200 到 299。程式可以先檢查它，遇到不符合要求的狀態時自行拋出錯誤，也可以依不同狀態顯示對應訊息。fetch 錯誤處理不必把每一種失敗都塞成「網路斷線」：找不到資料、需要重新登入與服務暫時異常，對讀者而言是不同的下一步。具體分類仍須對照實際 API 契約。

## 200 之後，JSON 也可能解析失敗

response.json() 會另外回傳 Promise。MDN 列出的例外包含本文無法解析為 JSON 時的 SyntaxError；因此，取得 200 後仍可能進入後續的 catch。若端點送回一頁 HTML，或契約規定某個成功狀態沒有本文，便不能一律當成 JSON 來讀。應先確認預期狀態、內容格式及是否有本文，再選擇讀取方式。本文能轉成物件，也還需要應用程式核對必要欄位。

## fetch 錯誤處理中的 catch，能說明是哪一步嗎？

要看 try 區塊或 Promise 鏈涵蓋了什麼。若取得回應、檢查狀態、解析本文與更新畫面都共用一個 catch，裡面的錯誤可能來自任何一段。可以保留失敗階段、可取得的狀態碼和安全的工作識別，讓訊息有依據；不要把完整認證值或私人回應直接印進一般日誌。把錯誤轉成空陣列也要審慎，否則真正失敗會在畫面上變成「目前沒有資料」。

## 要怎麼驗收，而不只看正常的那一次？

可在獲准的測試環境分別安排：正常 JSON、帶有 JSON 的 404、HTML 錯誤頁、無法解析的本文，以及沒有取得回應的情況。每次核對狀態顯示與資料是否被誤當成空值。這是建議的驗收範圍，並非本文已執行的測試。fetch 錯誤處理也不應順手重送所有寫入請求；連線失敗或讀取失敗，不能單獨證明伺服器沒有完成操作。

先辨認有沒有取得回應，再檢查 HTTP 狀態與本文，最後驗證應用程式要的結果。錯誤訊息能對回實際階段，維護者才知道接下來該查連線、端點，還是前端的解析與顯示。

延伸閱讀：[能在瀏覽器開啟API，為什麼網頁程式仍被CORS擋下？](https://lijiabao.dev/articles/cors-browser-navigation-versus-script-access/)、[API逾時後要不要重送？先查結果，再理解冪等鍵](https://lijiabao.dev/articles/api-timeout-retry-idempotency-result-lookup/)
