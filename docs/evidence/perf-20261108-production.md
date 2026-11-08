# 效能量測：SWE Trial 正式網址（2026-11-08）

依 `docs/03-system-design.md` 第 6 節。PR #6 合併後部署到 <https://road-to-solution-architect.curio-lab.workers.dev/>（main `5cd02b9`），內容為新模組 0、1 共 7 個單元。

## 環境

| 項目 | 內容 |
|---|---|
| 受測版本 | main `5cd02b9`，GitHub Actions「Deploy Worker」成功後量測 |
| 伺服器 | Cloudflare Worker static assets（workers.dev） |
| 量測端 | 本機 Windows 11、Node v24.22.1、家用網路 |
| 瀏覽器 | Lighthouse 13.5.0 ＋ Chrome headless；作答回饋用 Playwright Chromium |
| 裝置模擬 | Lighthouse mobile 預設節流（模擬慢速 4G、CPU 4 倍降速） |
| 快取 | 每次開新的瀏覽器設定檔（瀏覽器冷快取）；第 1 輪第 1 次是部署後第一次請求 |

## 結果

| 指標 | 門檻 | 第 1 輪（部署後立刻量） | 第 2 輪（緊接著再量） | 判定 |
|---|---|---|---|---|
| LCP（手機）p95，首頁 | ≤ 2.5 秒 | p50 1,940／p95 3,091 ms | p50 1,938／p95 2,066 ms | 第 1 輪未過；第 2 輪通過 |
| LCP（手機）p95，模組頁 `/modules/m01/` | ≤ 2.5 秒 | 1,857／2,015 ms | 1,907／2,001 ms | 通過 |
| LCP（手機）p95，單元頁 `/units/m01-u03/` | ≤ 2.5 秒 | 1,741／1,892 ms | 1,774／1,852 ms | 通過 |
| CLS | ≤ 0.1 | 三頁全部 0.000 | 三頁全部 0.000 | 通過 |
| TBT p95 | ≤ 200 ms | 最大 2 ms | 最大 14 ms | 通過 |
| 決策題作答回饋 p95 | ≤ 100 ms | mobile p50 10.3／p95 14.6 ms；desktop p50 10.8／p95 11.9 ms（各 10 次） | — | 通過 |

- 首頁第 1 輪超標的是第 1 次樣本（3,091 ms），也就是部署後的第一個請求；其餘 9 次 1,180～2,296 ms。依規範不剔除樣本，第 1 輪記為未通過。
- 判定：一般情況（第 2 輪）通過；**部署後第一次請求可能超過 2.5 秒**，列為已知限制。之前 2026-11-05 的量測沒有出現，原因未確認（可能是邊緣節點在部署後的第一次讀取）。
- Lighthouse：`node scripts/perf-lighthouse.mjs <正式網址> docs/evidence/lighthouse-20261108-production.json 10`，第 2 輪輸出到 `lighthouse-20261108-production-run2.json`，每次樣本都在 JSON 裡。
- 作答回饋：沿用 `tests/e2e/quiz-latency.spec.ts` 的量法，改成正式網址與 `/units/m00-u01/` 第 1 題第一個選項；一次性執行，沒有加進 CI。
- 正式網址每頁都多了真實網路往返，LCP 比本機（p95 ≤ 1,359 ms）多約 500～700 ms。
