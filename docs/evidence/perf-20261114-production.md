# 效能量測：SWE Trial 正式網址（2026-11-14）

依 `docs/03-system-design.md` 第 6 節。全課 30／30 個單元與 6 頁速查表上線後，於 PR #15 合併部署後（main `efdcc19`，Run `43585361171`）量測正式網址 <https://road-to-solution-architect.curio-lab.workers.dev/>。

## 環境

| 項目 | 內容 |
|---|---|
| 受測版本 | main `efdcc19`（Run `43585361171` 部署後） |
| 伺服器 | Cloudflare Worker static assets（workers.dev） |
| 量測端 | 本機 Windows 11、Node v24.18.0、家用網路 |
| 瀏覽器 | Lighthouse 13.5.0 ＋ Chrome headless |
| 裝置模擬 | Lighthouse mobile 預設節流（模擬慢速 4G、CPU 4 倍降速） |
| 快取 | 每次開新的瀏覽器設定檔（瀏覽器冷快取），每頁各 10 次 |

## 結果

| 指標 | 門檻 | 實測結果 | 判定 |
|---|---|---|---|
| LCP（手機）p95，首頁 `/` | ≤ 2.5 秒 | p95 `1,545 ms` | 通過 |
| LCP（手機）p95，模組頁 `/modules/m01/` | ≤ 2.5 秒 | p95 `1,262 ms` | 通過 |
| LCP（手機）p95，單元頁 `/units/m01-u03/` | ≤ 2.5 秒 | p95 `1,260 ms` | 通過 |
| CLS（三頁最大值） | ≤ 0.1 | 三頁全部 `0.000` | 通過 |
| TBT p95 | ≤ 200 ms | 首頁 `22 ms`、模組頁 `8 ms`、單元頁 `79 ms` | 通過 |
| 單元頁傳輸量（CI `efdcc19`） | 總計 ≤ 150 KB、JS ≤ 30 KB（gzip） | 最大單元頁 `12.1 KB`（HTML `6.9 KB`、CSS `2.0 KB`、JS `3.2 KB`） | 通過 |
| 決策題作答回饋（CI `efdcc19`） | p95 ≤ 100 ms | mobile p50 `10.5 ms`／p95 `12.4 ms`；desktop p50 `12.0 ms`／p95 `12.4 ms` | 通過 |

- 量測指令：`node scripts/perf-lighthouse.mjs https://road-to-solution-architect.curio-lab.workers.dev docs/evidence/lighthouse-20261114-production.json 10`。
- 全課 30 個單元上線後，正式網址首頁、模組頁與單元頁的 Lighthouse mobile 指標全部遠低於門檻，沒有重現 PR #6 時的冷請求超標。
