# 進度

## 目前狀態（2026-11-14）

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
  - 驗證：`npm run check` 通過（83 個單元測試、內容驗證 0／30 錯誤 0）；E2E 30 個通過；建置 11 頁。單元頁傳輸量預算目前沒有單元頁，記為待驗收。PR #5 於 2026-11-08 合併。
- 里程碑 3（新模組 0、1 樣板）：7／7 個單元與模組 1 速查表寫完，全部 `status: draft`，等 Owner 審閱風格與難度。
  - 內容：m00-u01～u02、m01-u01～u05（IP／port、TCP／UDP、DNS、HTTP／HTTPS、CDN／反向代理／負載平衡），每個單元 1～2 題決策題、1 張 SVG；`content/templates/network-cheatsheet.md`。
  - 驗證：內容驗證 7／30，錯誤 0、警告 0；`npm run check` 通過；E2E 30 個通過；本機 375 px 寬的 12 頁沒有水平捲動與 console 錯誤，決策題作答後顯示解析；7 張架構圖已在手機寬度目視檢查。
  - PR #6 於 2026-11-08 合併並部署（main `5cd02b9`）。
  - 效能（本機）：LCP p95 ≤ 1,359 ms、CLS 0、TBT 0，單元頁最大 10.4 KB（`docs/evidence/perf-20261108-m00-m01-tech.md`）。
  - 效能（正式網址）：第 2 輪全部通過（首頁 LCP p95 2,066 ms），作答回饋 p95 ≤ 14.6 ms；第 1 輪首頁 p95 3,091 ms 未過，超標的是部署後第一次請求，列為已知限制（`docs/evidence/perf-20261108-production.md`）。
- 里程碑 4（模組 2、3，批次 2）：10 個單元（m02-u01～u05、m03-u01～u05）與兩頁速查表（`frontend-cheatsheet.md`、`api-cheatsheet.md`）已完成，全部 `status: draft`。
  - 驗證：`npm run check` 通過（內容驗證 17／30，錯誤 0、警告 0）；E2E 34 個通過；10 個新單元頁在 375 px 寬沒有水平捲動，10 張架構圖已目視檢查。
  - 來源：m02-u05（web.dev）與 m03-u03（graphql.org、grpc.io）已對照官方文件，查證日期記在單元的 `sources`。
  - 合併與部署：PR #12 已合併進 `main`（`a94f79d`）並部署上線（Run `43220859313`）。
  - 待驗收：正式網址 Lighthouse 效能與作答回饋還沒量（2026-11-14 雲端沙盒網路受限無法連線 `workers.dev`），需於本機補量。
- 里程碑 4（模組 4、5，批次 3）：9 個單元（m04-u01～u04、m05-u01～u05）與兩頁速查表（`backend-cheatsheet.md`、`database-cheatsheet.md`）已完成，全部 `status: draft`。
  - 驗證：PR #13 CI（Run `43581970665`）通過（內容驗證 26／30，錯誤 0、警告 0；88 個單元測試、34 個 E2E、建置 37 頁）。
  - 合併與部署：PR #13 已合併進 `main`（`47543f3`）並部署上線（Run `43582389099`）。
- 里程碑 4（模組 6，批次 4）：4 個單元（m06-u01～u04）與速查表（`scaling-cheatsheet.md`）在 2026-11-14 寫完，全部 `status: draft`，在分支 `feature/20261114-m06-content`（全課 30／30 個單元與 6 頁速查表已齊全）。
  - 驗證：Node 結構檢查確認 4 個單元段落順序、字數（1,537～1,714 字）、SVG 規格（寬 360、`d-*` class、`<title>`）無誤；完整 `npm run check` 與 E2E 由 PR 的 GitHub Actions CI 執行。
- PWA（2026-11-08）：manifest、192／512／maskable 與 apple-touch 圖示；`npm run build` 後產生 `dist/sw.js`，預先快取全部頁面與資源，頁面先連網路、失敗才用快取。驗證：88 個單元測試、E2E 34 個通過（含離線開單元頁）；本機預覽確認 service worker 啟用、CSP 含 `worker-src`。
- 寫作時注意：案例設定只用 `docs/curriculum.md` 第 4 節；SVG 寬 360、只用 d-* class；不寫產品或雲端服務名稱，除非附來源。

## 待辦

- [x] 【高】模組 2、3 的分支 `feature/20261111-m02-m03-content` 開 PR、合併、部署（PR #12 合併 `a94f79d`，Run `43220859313`）。
- [x] 【高】模組 4（後端基礎）、5（資料庫）與兩頁速查表（PR #13 合併 `47543f3`，Run `43582389099`）。
- [ ] 【高】模組 6（擴展與效能）與對應速查表（`feature/20261114-m06-content`）確認 CI 通過、合併並部署。
- [ ] 【高】於本機量測正式網址效能（Lighthouse mobile 與作答回饋）並存到 `docs/evidence/perf-<YYYYMMDD>-production.md`（雲端沙盒無法連線 `workers.dev`，需於本機執行）。
- [ ] 【中】Owner 細讀模組 0～6 的 30 個 draft 單元，確認後改成 `reviewed`。2026-11-08 Owner 看過模組 0、1 的標題，同意先繼續寫。
- [ ] 【中】PWA 手機實機驗收：2026-11-08 已實作（manifest、圖示、service worker 預先快取全部頁面、CSP 加 `worker-src`，見 `docs/03` 第 12 節），E2E 驗過離線開單元頁；還要用手機實際「加到主畫面」並開飛航模式閱讀（Owner 有空時做，2026-11-08 記為待辦）。
- [ ] 【中】決定是否接 Harbor 的維護模式腳本（影響 CSP）。
- [ ] 【低】部署後第一次請求的首頁 LCP：PR #6 部署後量到 3,091 ms（超過 2.5 秒），PR #8 部署後第 1 輪 1,856 ms 沒有重現。之後部署時順手再量第 1 輪；再出現就查邊緣快取。
- [x] 【低】依賴稽核原有 10 個 moderate（eslint 依賴的 minimatch）：2026-11-10 改用 Oxlint、移除 ESLint 後，`npm audit` 為 0。
- [ ] 【低】決定第二階段的開放對象（只有擁有者，或任何 Google 帳號）。

## 交接

- 分支：`feature/20261114-m06-content`（模組 6 內容與速查表，已開 PR）。合併後第一階段 30／30 個單元即全部上線。
- 雲端環境跑 E2E：內建的 Chromium 版本和專案的 Playwright 不同，要在設定加 `launchOptions.executablePath: "/opt/pw-browsers/chromium"`（用暫時的設定檔，不要提交）；先跑 `npm run build:fixture`。
- 開發前先讀 `AGENTS.md`、`docs/01`、`docs/03`、`docs/curriculum.md`；開發指令見 README「開發」。
- 證據位置：`docs/evidence/`。
- 換裝置接手：`git fetch` 後讀這份 `progress.md`，再依「待辦」從 `main` 開分支繼續；不需要讀 Harbor。Harbor 上的交接文件只是備份，保存 7 天。
