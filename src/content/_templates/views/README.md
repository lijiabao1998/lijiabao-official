# /views/ — 觀點（李家宝 觀點）

**只放李家宝本人的觀點**：他自己寫、或他親自定稿的文字。頁面頂端與列表上一律標「李家宝 觀點」（英文 "Views · Li Jiabao"），結構化資料是 BlogPosting，author 是網站上同一個 Person（`https://lijiabao.dev/#person`）。llms.txt 把它列在「李家宝本人的觀點」之下，和編輯整理的文章分開。

- 任何人（包括協助維護網站的工具）都**不得代他撰寫或改寫觀點**。不是他本人的文字，一律放 `/articles/`。
- 不要加 `author` 欄位：署名由網站自動處理。

## 檔案與網址

```
src/content/views/zh-Hant/<slug>.md   →  https://lijiabao.dev/views/<slug>/
src/content/views/en/<slug>.md        →  https://lijiabao.dev/en/views/<slug>/
```

- **檔名就是 slug**：小寫英文字母、數字、單一連字號（`^[a-z0-9]+(?:-[a-z0-9]+)*$`）。不符合就建置失敗。
- 網址不放日期、不放分類，結尾有 `/`。**slug 發布後不改**；必須改時在 `public/_redirects` 加 301。
- 中英兩版用同一個 slug 才會互相連結；只寫一種語言也可以。

## 欄位（frontmatter）

複製 `template.md`。欄位只有 `title`、`description`（建議 ≤ 160 字元）、`date`（`YYYY-MM-DD`）、`updated`（選填，不早於 `date`）、`tags`（選填）、`draft`（`true` = 不建置、不出現在任何地方）。沒有 `sources`；多一個欄位建置就失敗。

## 內文

從 `##` 開始；英文版裡的中文字用 `<span lang="zh-Hant">…</span>` 包起來。發布後 `npm run build` → `npm run og` 產生分享卡，再提交。
