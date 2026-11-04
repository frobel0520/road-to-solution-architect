# 進度

## 目前狀態（2026-11-04）

- 里程碑 1（文件）：完成。ADR-001～004 全部定案（ADR-002、ADR-004 於 2026-11-04 由使用者確認）。
- 里程碑 2（網站骨架）：PR 待審，分支 `feature/20261104-site-skeleton`。
  - 完成：Astro 專案、內容 schema 與驗證、進度模組（純函式＋localStorage adapter）、頁面與手機／桌機版面、`_headers`、CI 與部署 workflow。
  - 驗證：本機 `npm run check` 通過（型別、lint、79 個單元測試、內容驗證、依賴稽核無 high／critical）；E2E 30 個通過（手機、桌機）。
  - 效能：傳輸量與決策題回饋在測試用內容上通過；LCP／CLS／TBT 待驗收（見 `docs/evidence/perf-20261104-skeleton.md`）。
  - 部署：待 Owner 設定 Cloudflare secrets。
- 里程碑 3（模組 0、1 樣板內容）：進行中，分支 `feature/20261104-m00-m01-content`（從骨架分支切出，已 push，未開 PR）。
  - 已寫（draft，通過內容驗證）：module.yaml ×2、m00-u01～u03、m01-u01～u03，各附一張 SVG。
  - 未寫：m01-u04（流程建模）、m01-u05（資料建模）、m01-u06（品質屬性情境）、m01-u07（驗收條件與需求追溯）。
  - m01-u02、u03 約 1,500 字，低於建議的 2,000 字（驗證只警告），可補一段實例。
  - 寫作時注意：案例設定只用 `docs/curriculum.md` 第 4 節（例如沒有加盟店）；SVG 寬 360、只用 d-* class；不寫 AWS 服務名稱以免需要來源。

## 待辦

- [ ] 【高】審閱並合併骨架 PR。
- [ ] 【高】擁有者在 GitHub Secrets 設定 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`；設定後手動觸發 workflow 部署，網址回填 README。
- [ ] 【高】里程碑 3：補完 m01-u04～u07，跑 `npm run check`、`npm run build`、`npm run perf:bundle`，commit message 給使用者確認後 push、開 PR（骨架 PR 合併後 base 改 main）。
- [ ] 【高】模組 0、1 交給使用者審閱風格與難度；作品集範本（能力自評表、需求分析文件）尚未製作。
- [ ] 【高】正式內容上線後，用 Lighthouse 量 LCP、CLS、TBT（本機與正式網址分開記錄）。
- [ ] 【中】決定是否接 Harbor 的維護模式腳本（影響 CSP）。
- [ ] 【中】上線後在 Harbor 登錄本專案（網址、健康檢查），加入「學習」群組；在 Learning Atlas 加入本課程的路線。
- [ ] 【低】依賴稽核有 11 個 moderate（eslint 依賴的 minimatch），只在開發工具裡，等上游修正。
- [ ] 【低】決定網站顯示名稱（暫定 Road to Solution Architect）。
- [ ] 【低】決定第二階段的開放對象（只有擁有者，或任何 Google 帳號）。

## 交接

- 分支：`main`（文件）；`feature/20261104-site-skeleton`（骨架，PR #1 待審，CI 通過）；`feature/20261104-m00-m01-content`（內容進行中，已 push，未開 PR）。
- 開發前先讀 `AGENTS.md`、`docs/01`、`docs/03`、`docs/curriculum.md`；指令見 README「開發」。
- 證據位置：`docs/evidence/`。
- 交接也要放 Harbor：使用者在 Harbor 網頁登錄 slug `road-to-solution-architect` 之後，在 harbor repo 執行 `node scripts/harbor-doc.mjs create road-to-solution-architect --kind handoff --title "里程碑 2、3 交接" --file ../road-to-solution-architect/progress.md --branch feature/20261104-m00-m01-content`。
