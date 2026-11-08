# 進度

## 目前狀態（2026-11-05）

- 里程碑 1（文件）：完成。ADR-001～004 全部定案（ADR-002、ADR-004 於 2026-11-04 由使用者確認）。
- 里程碑 2（網站骨架）：完成，PR #1 於 2026-11-05 合併。
  - 完成：Astro 專案、內容 schema 與驗證、進度模組（純函式＋localStorage adapter）、頁面與手機／桌機版面、`_headers`、CI 與部署 workflow。
  - 驗證：`npm run check` 通過（型別、lint、79 個單元測試、內容驗證、依賴稽核無 high／critical）；E2E 30 個通過（手機、桌機）。
  - 部署：2026-11-05 上線 <https://road-to-solution-architect.curio-lab.workers.dev/>（Cloudflare Worker static assets）。
- 里程碑 3（模組 0、1 樣板內容）：10／10 個單元寫完並合併（PR #2，2026-11-05），全部 `status: draft`，等 Owner 審閱後改成 reviewed。
  - 內容：module.yaml ×2、m00-u01～u03、m01-u01～u07，每個單元 2 題決策題、1 張 SVG。
  - 驗證：內容驗證 10／68 個單元，錯誤 0、警告 0；建置 28 頁；正式內容 14 頁在手機與桌機寬度沒有水平捲動與 CSP 違規。
  - 效能（本機）：單元頁最大 10.8 KB、JS 2.9 KB；Lighthouse mobile 各 10 次，LCP p95 ≤ 1,358 ms、CLS 0、TBT 0（見 `docs/evidence/perf-20261105-m00-m01.md`）。
  - 效能（正式網址）：LCP p95 ≤ 1,969 ms、CLS 0、TBT 0、作答回饋 p95 14.2 ms，全部通過（見 `docs/evidence/perf-20261105-production.md`）。
  - 未做：作品集範本（能力自評表、需求分析文件）。
  - 寫作時注意：案例設定只用 `docs/curriculum.md` 第 4 節（例如沒有加盟店）；SVG 寬 360、只用 d-* class；不寫 AWS 服務名稱以免需要來源。

## 待辦

- [ ] 【高】CR-001（2026-11-08 提出）：Owner 審閱後決定課程方向改為「軟體工程技術導覽」（Web 與網路基礎、資料與後端；概念＋何時用、不寫程式），沿用本 repo。新課綱提案與 5 項待決事項見 `docs/change-requests/CR-001-tech-survey.md`；核准前不改 `docs/curriculum.md` 與內容，也不寫新單元。原「審閱模組 0、1、製作 SA 作品集範本」暫停，依 CR-001 待決第 2、4 項處理。
- [ ] 【中】做成 PWA（2026-11-05 使用者提出）：參考 Family（`frontend/public/` 的 manifest、圖示、`sw.js`）加 manifest、192／512 與 apple-touch 圖示、`display: standalone`；service worker 改做課程頁離線快取（Family 的只做推播）；CSP 加 `manifest-src`、`worker-src` 為 `'self'`；手機實測安裝與離線閱讀，零月費。預估 1～2 小時，分支 `feature/<YYYYMMDD>-pwa`。
- [ ] 【中】決定是否接 Harbor 的維護模式腳本（影響 CSP）。
- [ ] 【中】已在 Harbor 登錄（2026-11-04，slug `road-to-solution-architect`）；補網址與健康檢查、加入「學習」群組；在 Learning Atlas 加入本課程的路線。
- [ ] 【低】依賴稽核有 11 個 moderate（eslint 依賴的 minimatch），只在開發工具裡，等上游修正。
- [ ] 【低】決定網站顯示名稱（暫定 Road to Solution Architect）。
- [ ] 【低】決定第二階段的開放對象（只有擁有者，或任何 Google 帳號）。

## 交接

- 分支：只有 `main`。骨架與內容分支都已合併，下一個工作從 `main` 開新分支（`feature/<YYYYMMDD>-<slug>`）。
- 開發前先讀 `AGENTS.md`、`docs/01`、`docs/03`、`docs/curriculum.md`；開發指令見 README「開發」。
- 證據位置：`docs/evidence/`。
- 換裝置接手：`git fetch` 後讀這份 `progress.md`，再依「待辦」從 `main` 開分支繼續；不需要讀 Harbor。Harbor 上的交接文件只是備份，保存 7 天。
