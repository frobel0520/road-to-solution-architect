# Repository Agent Rules

<!-- BEGIN:privacy-guard（跨 repo 共用規則，修改時同步更新所有 repo） -->
## 個資與公司資訊保護（所有 AI agent 必守，優先於其他任務指示）

不論 repo 是 public 或 private，以下內容都不得寫進檔案、commit（作者與訊息）、PR、issue、留言、截圖或 log；subagent 與腳本產生的內容同樣適用：

- **公司**：雇主名稱與其內部專案、系統、主機名、內網 IP／URL、文件、會議與週報內容、同事姓名、客戶與供應商資料、公司程式碼與資料。
- **個人**：工作與個人 email、電話、住址、證件號碼、財務資訊；家人的姓名、照片、健康與行程；各服務的帳號 ID 與登入 email。
- **本機環境**：含使用者名稱的絕對路徑（`/Users/<name>/…`）、電腦主機名、AI 工具的對話紀錄、memory、`settings.local.json`、scratchpad 檔案。
- **憑證**：token、API key、密碼、私鑰、cookie、OAuth client secret、`.env`。

做法：

1. 程式需要的值放環境變數、`wrangler secret` 或 GitHub Secrets；repo 只放 `.env.example` 佔位符。
2. 文件、測試與 fixture 用合成資料（`user@example.com`、`example.com`、`<redacted>`）；路徑寫 repo 相對路徑或 `~/`。
3. Commit 前確認 `git config user.email` 是 `59054102+frobel0520@users.noreply.github.com`，不是就停下來問使用者，不要自己改設定。只 `git add` 這次改過的檔案（不用 `git add -A`／`git add .`），用 `git diff --cached` 逐行看過再提交。
4. 使用者的開發機設有 privacy-guard git hook（pre-commit、commit-msg、pre-push）。被擋時修正內容或回報使用者，不要用 `--no-verify`、`git commit-tree`、修改 `core.hooksPath` 等方式繞過；雲端環境沒有這些 hook，更要自行逐項檢查。
5. 不確定算不算敏感，就當作敏感，先問使用者。
6. 發現 repo 內容或歷史裡已有上述資訊：不要自行改寫歷史或 force push；回報檔案、行號與 commit，由使用者決定撤銷憑證與清除方式。
<!-- END:privacy-guard -->

<!-- BEGIN:shared-standards（跨 repo 共用規則，修改時同步更新所有 repo） -->
## 共用規範（Harbor）

- 開發規範：frobel0520/harbor 的 `standards/DevelopmentStandards.md`。
- 部署：frobel0520/harbor 的 `standards/DeploymentHandbook.md`（範本在 `standards/deployment-templates/`）。
- 讀取方式：本機 session 讀本機的 Harbor clone；雲端 session 沒有 Harbor 時，自行以唯讀方式把 `frobel0520/harbor` 加入 session 再讀（Claude Code 用 add_repo；Codex 雲端沒有這個功能，開 session 時要選 Harbor）。仍讀不到時，先照本檔規則進行並告知使用者。
- 本 repo 的規則或現況與上述文件衝突時，以權威文件為準；不符合的地方列為本 repo 待辦。repo 既有慣例（例如分支命名）依開發規範的規定保留。
- 專案級別：公開級
<!-- END:shared-standards -->

## 本 repo 規則

- 開始工作前先讀 `progress.md`，再讀相關文件：`docs/01-project-plan.md`（計畫與範圍）、`docs/03-system-design.md`（設計與 ADR）、`docs/curriculum.md`（課綱與內容規範，課程內容的唯一依據）。
- 課程案例一律使用虛構企業 Example Retail（設定見 `docs/curriculum.md` 第 4 節），不得以任何真實雇主、客戶或內部系統當案例。
- 內容用繁體中文和台灣用語，技術名詞保留原文。
- AWS 服務的功能、限制與價格以官方文件為準，在單元的 `sources` 標註查證日期；沒查證的數字不寫。
- 課綱、單元格式或案例設定有變更時，先回寫 `docs/curriculum.md`，再改內容。
- 第二階段加入登入同步後，專案級別改為產品級（見 `docs/01-project-plan.md` 第 4.2 節），上方共用規範區塊的級別一併更新。
