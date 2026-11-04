# 進度

## 目前狀態（2026-11-04）

- 里程碑 1（文件）：完成。ADR-001～004 全部定案（ADR-002、ADR-004 於 2026-11-04 由使用者確認）。
- 里程碑 2（網站骨架）：PR 待審，分支 `feature/20261104-site-skeleton`。
  - 完成：Astro 專案、內容 schema 與驗證、進度模組（純函式＋localStorage adapter）、頁面與手機／桌機版面、`_headers`、CI 與部署 workflow。
  - 驗證：本機 `npm run check` 通過（型別、lint、79 個單元測試、內容驗證、依賴稽核無 high／critical）；E2E 30 個通過（手機、桌機）。
  - 效能：傳輸量與決策題回饋在測試用內容上通過；LCP／CLS／TBT 待驗收（見 `docs/evidence/perf-20261104-skeleton.md`）。
  - 部署：待 Owner 設定 Cloudflare secrets。
- 里程碑 3（模組 0、1 樣板內容）：尚未開始，骨架 PR 合併後另開分支。

## 待辦

- [ ] 【高】審閱並合併骨架 PR。
- [ ] 【高】擁有者在 GitHub Secrets 設定 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`；設定後手動觸發 workflow 部署，網址回填 README。
- [ ] 【高】里程碑 3：模組 0、1 共 10 個單元（status: draft），交給使用者審閱風格與難度。
- [ ] 【高】正式內容上線後，用 Lighthouse 量 LCP、CLS、TBT（本機與正式網址分開記錄）。
- [ ] 【中】決定是否接 Harbor 的維護模式腳本（影響 CSP）。
- [ ] 【中】上線後在 Harbor 登錄本專案（網址、健康檢查），加入「學習」群組；在 Learning Atlas 加入本課程的路線。
- [ ] 【低】依賴稽核有 11 個 moderate（eslint 依賴的 minimatch），只在開發工具裡，等上游修正。
- [ ] 【低】決定網站顯示名稱（暫定 Road to Solution Architect）。
- [ ] 【低】決定第二階段的開放對象（只有擁有者，或任何 Google 帳號）。

## 交接

- 分支：`main`（文件）；`feature/20261104-site-skeleton`（骨架，PR 待審）。
- 開發前先讀 `AGENTS.md`、`docs/01`、`docs/03`、`docs/curriculum.md`；指令見 README「開發」。
- 證據位置：`docs/evidence/`。
