# 進度

## 目前狀態（2026-11-04）

- 里程碑 1（文件）：已完成 `docs/01-project-plan.md`、`docs/03-system-design.md`、`docs/curriculum.md`，等使用者確認提案中的 ADR。
- 尚未開始開發。

## 待辦

- [ ] 【高】使用者確認 `docs/03-system-design.md` 的提案：ADR-002（前端用 Astro 靜態輸出）、ADR-004（內容用 Markdown＋frontmatter，圖用 SVG）。
- [ ] 【高】里程碑 2 網站骨架（需要另開開發 session）：依 `docs/03` 建立專案、內容格式與驗證、進度模組與測試、`_headers`、部署 workflow；驗收：CI 通過、正式部署成功、第 6 節效能量測有紀錄。
- [ ] 【高】擁有者在 GitHub Secrets 設定 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`（第一次部署前）。
- [ ] 【中】里程碑 3 樣板內容：模組 0、1 共 10 個單元，交給使用者審閱風格與難度。
- [ ] 【中】決定是否接 Harbor 的維護模式腳本（影響 CSP）。
- [ ] 【中】上線後在 Harbor 登錄本專案（網址、健康檢查），加入「學習」群組；在 Learning Atlas 加入本課程的路線。
- [ ] 【低】決定網站顯示名稱（暫定 Road to Solution Architect）。
- [ ] 【低】決定第二階段的開放對象（只有擁有者，或任何 Google 帳號）。

## 交接

- 分支：`main`（目前只有文件）。
- 開發前先讀 `AGENTS.md`、`docs/01`、`docs/03`、`docs/curriculum.md`。
- 證據位置：效能與驗收紀錄在里程碑 2 決定存放位置後補上。
