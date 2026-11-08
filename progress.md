# 進度

## 目前狀態（2026-11-08）

- 里程碑 1（文件）：完成。ADR-001～004 全部定案（ADR-002、ADR-004 於 2026-11-04 由使用者確認）。
- 里程碑 2（網站骨架）：完成，PR #1 於 2026-11-05 合併。
  - 完成：Astro 專案、內容 schema 與驗證、進度模組（純函式＋localStorage adapter）、頁面與手機／桌機版面、`_headers`、CI 與部署 workflow。
  - 驗證：`npm run check` 通過（型別、lint、79 個單元測試、內容驗證、依賴稽核無 high／critical）；E2E 30 個通過（手機、桌機）。
  - 部署：2026-11-05 上線 <https://road-to-solution-architect.curio-lab.workers.dev/>（Cloudflare Worker static assets）。
- 原 SA 課程樣板（PR #2，2026-11-05）：模組 0、1 共 10 個單元。2026-11-08 Owner 審閱後依 CR-001 改變方向，這些單元移到 `archive/sa-track/`，不上網站。以下是當時的紀錄：
  - 內容：module.yaml ×2、m00-u01～u03、m01-u01～u07，每個單元 2 題決策題、1 張 SVG。
  - 驗證：內容驗證 10／68 個單元，錯誤 0、警告 0；建置 28 頁；正式內容 14 頁在手機與桌機寬度沒有水平捲動與 CSP 違規。
  - 效能（本機）：單元頁最大 10.8 KB、JS 2.9 KB；Lighthouse mobile 各 10 次，LCP p95 ≤ 1,358 ms、CLS 0、TBT 0（見 `docs/evidence/perf-20261105-m00-m01.md`）。
  - 效能（正式網址）：LCP p95 ≤ 1,969 ms、CLS 0、TBT 0、作答回饋 p95 14.2 ms，全部通過（見 `docs/evidence/perf-20261105-production.md`）。
- 里程碑 2a（CR-001 改版）：文件改寫（`docs/01`、`docs/03`、`docs/curriculum.md`、README、case.md）；舊單元封存；網站改名 SWE Trial；內容驗證改為 7 模組／30 單元、「交給 AI 時要注意」改選填、閱讀時間 8～12 分鐘；進度 key 改 `rtsa-progress-v2` 並刪除舊 key。
  - 驗證：`npm run check` 通過（83 個單元測試、內容驗證 0／30 錯誤 0）；E2E 30 個通過；建置 11 頁。單元頁傳輸量預算目前沒有單元頁，記為待驗收。
- 寫作時注意：案例設定只用 `docs/curriculum.md` 第 4 節；SVG 寬 360、只用 d-* class；不寫產品或雲端服務名稱，除非附來源。

## 待辦

- [ ] 【高】CR-001 樣板內容（里程碑 3）：寫新模組 0、1（7 個單元）與模組 1 速查表，Owner 確認風格與難度後再寫其他模組。CR-001 的決定見 `docs/change-requests/CR-001-tech-survey.md`；文件改版、封存與改名已在里程碑 2a 完成。
- [ ] 【中】做成 PWA（2026-11-05 使用者提出）：參考 Family（`frontend/public/` 的 manifest、圖示、`sw.js`）加 manifest、192／512 與 apple-touch 圖示、`display: standalone`；service worker 改做課程頁離線快取（Family 的只做推播）；CSP 加 `manifest-src`、`worker-src` 為 `'self'`；手機實測安裝與離線閱讀，零月費。預估 1～2 小時，分支 `feature/<YYYYMMDD>-pwa`。
- [ ] 【中】決定是否接 Harbor 的維護模式腳本（影響 CSP）。
- [ ] 【中】在 Learning Atlas 加入本課程的路線。Harbor 已補網址、加入「學習」群組，首輪探測正常（2026-11-08）。
- [ ] 【低】依賴稽核有 10 個 moderate（eslint 依賴的 minimatch），只在開發工具裡，等上游修正。
- [ ] 【低】決定第二階段的開放對象（只有擁有者，或任何 Google 帳號）。

## 交接

- 分支：只有 `main`。骨架與內容分支都已合併，下一個工作從 `main` 開新分支（`feature/<YYYYMMDD>-<slug>`）。
- 開發前先讀 `AGENTS.md`、`docs/01`、`docs/03`、`docs/curriculum.md`；開發指令見 README「開發」。
- 證據位置：`docs/evidence/`。
- 換裝置接手：`git fetch` 後讀這份 `progress.md`，再依「待辦」從 `main` 開分支繼續；不需要讀 Harbor。Harbor 上的交接文件只是備份，保存 7 天。
