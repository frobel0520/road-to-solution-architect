# 效能量測：網站骨架（2026-11-04）

依 `docs/03-system-design.md` 第 6 節。這次只有骨架與**測試用內容**（`tests/fixtures/content`，3 個單元），正式內容與正式網址都還沒有，所以只量得到建置輸出與本機互動。

## 環境

| 項目 | 內容 |
|---|---|
| 受測版本 | 分支 `feature/20261104-site-skeleton`（commit 前的工作目錄，PR 合併後回填 commit） |
| 環境 | 本機 Windows 11、Node v24.22.1、Astro 7.4.2 |
| 硬體 | Intel Core i7-12700KF、32 GB RAM |
| 瀏覽器 | Playwright 1.64.1 Chromium headless shell 156 |
| 資料 | 測試用內容：3 個單元、每個單元 2 題決策題、1 張架構圖 |
| 伺服器 | `tests/e2e/static-server.mjs`（本機靜態檔，套用 `_headers`），不是 Cloudflare |

## 結果

| 指標 | 門檻 | 結果 | 判定 |
|---|---|---|---|
| 單元頁傳輸量（HTML＋CSS＋JS，gzip） | ≤ 150 KB | 6.9～7.0 KB（HTML 2.0、CSS 2.0、JS 2.9） | 骨架通過；正式內容待驗收 |
| 單元頁 JavaScript（gzip） | ≤ 30 KB | 2.9 KB | 骨架通過；正式內容待驗收 |
| 決策題作答回饋 p95 | ≤ 100 ms | mobile p50 8.6／p95 12.0 ms；desktop p50 9.6／p95 13.4 ms（各 10 次，暖快取） | 本機通過；正式環境待驗收 |
| LCP（手機）p95 | ≤ 2.5 秒 | 未量測 | 待驗收 |
| CLS | ≤ 0.1 | 未量測 | 待驗收 |
| TBT p95 | ≤ 200 ms | 未量測 | 待驗收 |

- 傳輸量：`npm run build:fixture` 後 `node scripts/check-budget.ts dist-fixture`。CI 每次對正式內容的建置跑 `npm run perf:bundle`。
- 作答回饋：`tests/e2e/quiz-latency.spec.ts`，從 `pointerdown` 到解析出現後的下一個畫格。每次量測前清掉 localStorage 並重新載入。

## 待驗收

- LCP、CLS、TBT：要等模組 0、1 的正式內容上線後，用 Lighthouse mobile 預設節流，對首頁、模組頁、單元頁各跑 10 次，本機 preview 與正式網址分開記錄。
- 正式網址：部署待 Owner 設定 Cloudflare secrets。
