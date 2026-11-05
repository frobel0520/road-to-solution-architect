# Road to Solution Architect

給工程師的 Solution Architect 自學課程網站，方向是軟體工程的 Solution Architect，系統分析是基本功。課程假設程式由 AI coding agent 撰寫，SA 負責需求、架構、交付規格與驗收；只講架構層與應用層，不寫程式。

## 概覽

- 14 個模組、68 個單元，每個單元 10～15 分鐘，手機和電腦都能讀。
- 每個單元都有情境決策題，以及「交給 AI 時要注意」段落。
- 整門課用同一個虛構企業 Example Retail 當案例。
- 主要模組會產出作品集文件：需求分析、C4 圖與 ADR、威脅模型、成本模型、提案等。
- 雲端平台是 AWS，不對應證照考試。

## 現況

網站：<https://road-to-solution-architect.curio-lab.workers.dev/>（2026-11-05 上線）。

已上線模組 0、1 共 10 個單元（草稿，待審閱）；其餘模組製作中。進度只存在瀏覽器，第二階段才加入登入同步。

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
