# SWE Trial

軟體工程技術導覽的自學網站：介紹軟體工程裡常見的技術，每項技術講清楚是什麼、解決什麼問題、什麼時候用、和替代方案怎麼選。不寫程式，寫給技術基礎不深的人。

repo 名與網址沿用舊名 road-to-solution-architect（2026-11-08 依 CR-001 改變方向，見 `docs/change-requests/CR-001-tech-survey.md`）。

## 概覽

- 7 個模組、30 個單元：導論、Web 與網路基礎（網路、前端、API）、資料與後端（後端、資料庫、擴展與效能）。
- 每個單元 8～12 分鐘，有情境決策題，手機和電腦都能讀。
- 整門課用同一個虛構企業 Example Retail 當案例。
- 模組 1～6 各有一頁技術選擇速查表。

## 現況

網站：<https://road-to-solution-architect.curio-lab.workers.dev/>（2026-11-05 上線）。

新課綱的單元製作中。原 SA 課程的模組 0、1 已移出網站，保存在 `archive/sa-track/`。進度只存在瀏覽器，第二階段才加入登入同步。

## 開發

需要 Node 22.23.4 以上。

```bash
npm ci
npm run dev              # 本機開發
npm run check            # 型別、lint、單元測試、內容驗證、依賴稽核
npm run build            # 建置正式內容到 dist/
npm run perf:bundle      # 單元頁傳輸量預算
npm run build:fixture    # 用測試用內容建置到 dist-fixture/
npm run e2e              # Playwright（需先 build:fixture；第一次要 npx playwright install chromium）
```

內容寫在 `content/`，格式見 `docs/03-system-design.md` 第 4 節與 `docs/curriculum.md` 第 2、3 節。

## 文件

| 文件 | 內容 |
|---|---|
| [`docs/01-project-plan.md`](docs/01-project-plan.md) | 目標、範圍、里程碑、風險 |
| [`docs/03-system-design.md`](docs/03-system-design.md) | 架構、內容模型、進度儲存、效能與資安、ADR |
| [`docs/curriculum.md`](docs/curriculum.md) | 課綱、單元格式、寫作規則、案例設定 |
| [`docs/evidence/`](docs/evidence/) | 效能與驗收紀錄 |
| [`progress.md`](progress.md) | 進度與待辦 |

## 專案級別

公開級。第二階段加入登入與跨裝置同步後，改為產品級。
