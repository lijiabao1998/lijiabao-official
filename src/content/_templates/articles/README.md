# /articles/ — 文章（lijiabao.dev 編輯整理）

教學、整理、解釋型的 SEO 文章。**作者是網站，不是李家宝本人**：頁面頂端與列表上一律標「lijiabao.dev 編輯整理」（英文 "Edited by lijiabao.dev"），標題下的署名列也是「lijiabao.dev 編輯整理 · 發布 … · 更新 …」，每篇的 Markdown 版（`index.md`）開頭寫明「由 lijiabao.dev 編輯整理，不是李家宝本人的觀點」；結構化資料（JSON-LD）的 author 與 publisher 都是網站（Organization `https://lijiabao.dev/#site`），永遠不是 Person。llms.txt 也把它列在「lijiabao.dev 編輯整理（非本人觀點）」之下。

- 不寫李家宝的第一人稱，不替他表態。屬於他本人的看法，放 `/views/`，而且只能由他本人寫。
- 不要加 `author` 欄位（建置會失敗）。署名由網站自動處理。

## 檔案與網址

```
src/content/articles/zh-Hant/<slug>.md   →  https://lijiabao.dev/articles/<slug>/
src/content/articles/en/<slug>.md        →  https://lijiabao.dev/en/articles/<slug>/
```

- **檔名就是 slug**：只用小寫英文字母、數字和單一連字號（`^[a-z0-9]+(?:-[a-z0-9]+)*$`），例如 `how-to-read-a-sitemap`。不符合就建置失敗。
- 網址不放日期、不放分類，結尾有 `/`。**slug 發布後不改**；真的必須改時，在 `public/_redirects` 加 301。
- 中英兩版用**同一個 slug** 才會互相連結（hreflang、語言切換、「Read this in English」）。只有一種語言也可以：那就不輸出 hreflang，語言切換改去另一語言的文章索引。

## 欄位（frontmatter）

複製 `template.md`。欄位只有這些，多一個（打錯字也一樣）建置就失敗：

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `title` | 是 | 標題（也是 `<title>`、og:title、RSS） |
| `description` | 是 | 一兩句摘要：導言、meta description、列表、RSS。**建議約 80 個中文字 / 160 English characters 以內**（check-dist 以顯示寬度計算，中文字算 2，超過 160 會警告） |
| `date` | 是 | 發布日 `YYYY-MM-DD`（台北時間的日曆日；寫成時間戳記，例如 `2026-10-07T07:00:00+08:00`，建置會失敗） |
| `updated` | 否 | 最後更新日 `YYYY-MM-DD`（同上），不可早於 `date`；sitemap 的 lastmod = `updated` 或 `date` |
| `tags` | 否 | 標籤，例如 `[Astro, SEO]` |
| `draft` | 否 | `true` = 草稿：不建置頁面、RSS、sitemap、llms.txt，也不出現在導覽 |
| `sources` | 否 | 來源清單，顯示在文末「來源 / Sources」：`- title: …` 加 `url: https://…` |

## 內文

- 從 `##` 開始（`#` 是頁面標題，只能有一個）。可以用清單、引文、表格、程式碼區塊、行內程式碼、連結、圖片、分隔線。
- 圖片放在文章旁邊或 `src/assets/`，用相對路徑，**一定要寫替代文字**（`![畫面上是什麼](./shot.png)`；替代文字空白時 check-dist 會讓建置失敗）。不要引用外站圖片（網站的 CSP 只允許本站資源）。
- 表格會自動放進可捲動、可用鍵盤聚焦的區塊（保留表格語意）；寬表格在窄螢幕上左右捲動。
- 英文文章**可以**含中文字（例如產品名「微光小鎮」），標題、摘要、標籤、內文都可以，建置不會因此失敗。內文裡較長的中文，建議用 `<span lang="zh-Hant">…</span>` 包起來，讓螢幕閱讀器與字型用對語言。
- 內文的檢查規則（POSTS）只擋業主隱私相關的字詞、旗幟與姓名異體字；技術文章本來就會寫到的詞不受限。業主隱私清單裡那組借來的三句口號，只有三句連在一起出現才擋（`scripts/lib/rules.mjs` 的 `POST_RULES`）；單獨提到那所學校的論文或課程、或其中一個常見片語，都可以。
- **X 連結需要業主同意**：業主還沒有同意網站出現 X（Twitter）。文章裡不能有 x.com / twitter.com 連結，也不能出現他的 X 帳號；建置會失敗。

## 發布之後

`npm run build` → `npm run og`（在有字型的這台電腦上產生每篇文章的分享卡，`src/assets/og/posts/`）→ 提交。沒有卡片時會先用「文章」區塊的卡片，check-dist 只會警告。
