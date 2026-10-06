# /articles/ — 文章（lijiabao.dev 編輯整理）

教學、整理、解釋型的 SEO 文章。**作者是網站，不是李家宝本人**：頁面頂端與列表上一律標「lijiabao.dev 編輯整理」（英文 "Edited by lijiabao.dev"），結構化資料（JSON-LD）的 author 與 publisher 都是網站（Organization `https://lijiabao.dev/#site`），永遠不是 Person。llms.txt 也把它列在「lijiabao.dev 編輯整理（非本人觀點）」之下。

- 不寫李家宝的第一人稱，不替他表態。屬於他本人的看法，放 `/views/`，而且只能由他本人寫或定稿。
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
| `description` | 是 | 一兩句摘要：導言、meta description、列表、RSS。**建議 ≤ 160 字元**（超過時 check-dist 會警告） |
| `date` | 是 | 發布日 `YYYY-MM-DD` |
| `updated` | 否 | 最後更新日 `YYYY-MM-DD`，不可早於 `date`；sitemap 的 lastmod = `updated` 或 `date` |
| `tags` | 否 | 標籤，例如 `[Astro, SEO]` |
| `draft` | 否 | `true` = 草稿：不建置頁面、RSS、sitemap、llms.txt，也不出現在導覽 |
| `sources` | 否 | 來源清單，顯示在文末「來源 / Sources」：`- title: …` 加 `url: https://…` |

## 內文

- 從 `##` 開始（`#` 是頁面標題，只能有一個）。可以用清單、引文、表格、程式碼區塊、行內程式碼、連結、圖片、分隔線。
- 圖片放在文章旁邊或 `src/assets/`，用相對路徑，一定要寫替代文字。不要引用外站圖片（網站的 CSP 只允許本站資源）。
- 英文文章裡如果出現中文字，用 `<span lang="zh-Hant">…</span>` 包起來（無障礙檢查要求）。
- 內文的檢查規則（POSTS）只擋業主隱私相關的字詞、旗幟與姓名異體字；技術文章本來就會寫到的詞不受限。

## 發布之後

`npm run build` → `npm run og`（在有字型的這台電腦上產生每篇文章的分享卡，`src/assets/og/posts/`）→ 提交。沒有卡片時會先用「文章」區塊的卡片，check-dist 只會警告。
