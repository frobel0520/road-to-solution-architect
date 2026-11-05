# 效能量測：正式網址第一次部署（2026-11-05）

依 `docs/03-system-design.md` 第 6 節。這份補上 `perf-20261105-m00-m01.md` 標成「待驗收」的正式環境結果。

## 環境

| 項目 | 內容 |
|---|---|
| 受測版本 | `main` 54b0259（PR #2 合併），GitHub Actions 手動觸發部署 |
| 正式網址 | <https://road-to-solution-architect.curio-lab.workers.dev/>（Cloudflare Worker static assets，免費方案） |
| 量測端 | 本機 Windows 11、Intel Core i7-12700KF、32 GB RAM，經由家用網路連到 Cloudflare |
| 工具 | Lighthouse 13.5.0（npx 固定版本）＋ Chrome headless；Playwright 1.64.1 Chromium |
| 裝置模擬 | Lighthouse mobile 預設節流（模擬慢速 4G：RTT 150 ms、1.6 Mbps；CPU 4 倍降速） |
| 快取 | Lighthouse 每次開新的瀏覽器設定檔，屬冷快取；邊緣節點快取狀態未控制 |
| 資料 | 正式內容：10 個單元（全部 draft），28 頁 |

## 結果

| 指標 | 門檻 | 結果 | 判定 |
|---|---|---|---|
| LCP（手機）p95 | ≤ 2.5 秒 | 首頁 p50 1,367／p95 1,969 ms；模組頁 1,281／1,936 ms；單元頁 1,284／1,784 ms | 通過 |
| CLS | ≤ 0.1 | 三頁 30 次全部 0.000 | 通過 |
| TBT p95 | ≤ 200 ms | 三頁都是 0 ms | 通過 |
| 決策題作答回饋 p95 | ≤ 100 ms | mobile p50 12.4／p95 14.1 ms；desktop p50 12.0／p95 14.2 ms（各 10 次） | 通過 |
| 單元頁傳輸量、JavaScript | ≤ 150 KB、≤ 30 KB | 與本機建置相同：最大 10.8 KB、JS 2.9 KB | 通過 |

- 受測頁：首頁 `/`、模組頁 `/modules/m01/`、單元頁 `/units/m01-u03/`，各 10 次；每次樣本在 `lighthouse-20261105-production.json`。
- 作答回饋：以 `tests/e2e/quiz-latency.spec.ts` 的同一套量法，改成正式網址與正式內容 `/units/m00-u01/` 第 1 題第一個選項；一次性執行，沒有加進 CI。
- 本機與正式網址的差異（LCP p95 約多 400～600 ms）主要來自真實網路往返；仍在門檻內。

## 部署檢查

- 首頁、模組 0／1、案例、範本、單元頁回應 200；不存在的路徑回應 404。
- 每頁都有 CSP（`default-src 'self'; script-src 'self'`…）、`X-Frame-Options: DENY`，HTML 為 `Cache-Control: no-cache`。
- 單元頁在瀏覽器沒有水平捲動，架構圖正常顯示。

## 限制

- 只從一個地點、一條網路量測；不同地區與行動網路的實際體驗沒有量。
- 真機（手機）閱讀體驗待 Owner 審稿時確認。
