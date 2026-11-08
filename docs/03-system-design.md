# SWE Trial 系統設計（精簡版）

| 文件項目 | 內容 |
|---|---|
| 文件版本 | 1.0 |
| 文件日期 | 2026-11-04 |
| 狀態 | ADR-001～004 全部定案（ADR-002、ADR-004 於 2026-11-04 由使用者確認） |
| 範圍 | 第一階段（公開級）。第二階段只寫預留的部分，完整設計在第二階段開工前補上 |
| 依據 | Harbor `standards/DevelopmentStandards.md`、`standards/DeploymentHandbook.md` |

## 1. 設計限制

- **零月費**：只用 Cloudflare 與 GitHub 的免費方案（第 8 節）。
- **效能驗收是 Release Gate**（第 6 節）。
- **第二階段會加登入**：依部署手冊第 1 章，有登入的網站不能放在 `<owner>.github.io`，所以第一階段就部署在 Cloudflare，之後不用搬家。
- **不載入任何第三方資源**：沒有外部腳本、字型、追蹤碼。
- **內容只有一個來源**：所有課程內容都在 `content/`，網站由它建置產生。

## 2. 架構總覽

```text
GitHub repo（main）
  └─ GitHub Actions：型別與 lint → 測試 → 內容驗證 → 建置 → 部署
       └─ Cloudflare Worker（static assets）
            └─ 靜態網頁：首頁／模組頁／單元頁／案例頁／範本頁
                 └─ 瀏覽器 localStorage：學習進度

第二階段（預留）：
  同一個 Worker 加上 /api/*（Google 登入、進度同步）＋ D1
  網頁與 API 同源，session 用 __Host- cookie（部署手冊 2.1）
```

第一階段的 Worker 只提供靜態檔，不需要 Worker 程式。

## 3. 目錄結構

```text
content/
  modules/
    m00-sa-intro/
      module.yaml          模組 id、標題、說明、速查表名稱（標題與產出要和課綱一致）
      m00-u01.md           單元：frontmatter＋本文
      m00-u01-roles.svg    單元用的架構圖
  case.md                  Example Retail 介紹頁
  templates/               技術選擇速查表範本與範例（frontmatter：title、module、summary）
src/
  content.config.ts        內容集合，schema 來自 src/lib/content-schema.ts
  lib/                     內容 schema、課綱解析、單元 HTML 後處理（純函式）
  progress/                進度模組：model.ts（純函式）＋storage.ts（adapter）
  scripts/                 瀏覽器端：單元頁、首頁／模組頁
  pages/ layouts/ components/ styles/
public/
  _headers                 安全標頭與快取設定
scripts/
  validate-content.ts      內容結構驗證
  check-budget.ts          單元頁傳輸量預算
  build-fixture.ts         用測試用內容建置（E2E）
tests/
  unit/                    進度模組、課綱解析、內容驗證、單元 HTML
  e2e/                     Playwright＋套用 _headers 的靜態伺服器
  fixtures/content/        測試用內容，只給 E2E 使用
wrangler.toml              只有靜態檔的 Worker
```

- 課綱（模組、單元 id、標題、學習目標）只寫在 `docs/curriculum.md` 第 5 節，網站建置時直接讀取；`module.yaml` 與單元 frontmatter 的標題由內容驗證比對。
- 還沒寫的單元在模組頁顯示「尚未上線」，沒有連結。

原則：內容和程式分開；進度模組不依賴畫面框架，方便測試，第二階段可以換成同步版本。

## 4. 內容模型

### 4.1 單元 frontmatter

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `id` | string，格式 `m00-u01` | 是 | 全站唯一，進度以此為 key；上線後不可變更，刪除的 id 不重複使用 |
| `module` | number（0～6） | 是 | |
| `order` | number | 是 | 模組內的順序 |
| `title` | string | 是 | |
| `minutes` | number（8～12） | 是 | 預估閱讀時間 |
| `objectives` | string[]（1～3 條） | 是 | 學習目標，對應 `curriculum.md` 第 5 節 |
| `quiz` | Quiz[]（1～3 題） | 是 | 見 4.2 |
| `sources` | `{ title, url, checkedOn }[]` | 有提到特定產品或雲端服務時必填 | `checkedOn` 為 `YYYY-MM-DD` |
| `status` | `draft` 或 `reviewed` | 是 | 使用者審閱後才改為 `reviewed`；`draft` 單元在網站上標示「內容待審閱」 |

### 4.2 決策題

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | string | 單元內唯一，例如 `q1` |
| `scenario` | string | 題目情境與限制 |
| `options` | `{ id, text, correct, explanation }[]` | 3～4 個選項，`correct` 剛好一個為 true；每個選項都要有 `explanation` |

### 4.3 本文

本文的段落標題與順序固定，依 `curriculum.md` 第 2 節。內容驗證會檢查段落是否齊全、順序是否正確。

- 「決策題」段落在本文中留空；建置時把 frontmatter 的 `quiz` 轉成題目，插在這個標題下面（題目文字一律跳脫）。
- 架構圖寫成 `![圖說](./m00-u01-xxx.svg)`，SVG 放在單元旁邊，建置時內嵌進頁面，圖說同時當作 `aria-label` 與 `figcaption`。
- SVG 規則（內容驗證檢查）：帶 `viewBox` 與 `<title>`；顏色只用 `d-box`、`d-accent`、`d-zone`、`d-line`、`d-arrow`、`d-text`、`d-small`、`d-title` 這些 class，不寫死顏色；不可有 `style`、script、事件屬性或外部連結（CSP 不允許）。

## 5. 進度儲存（第一階段）

### 5.1 資料格式

存在 localStorage，key 為 `rtsa-progress-v2`（CR-001 改版前的 `rtsa-progress` 在載入時刪除，因為 `m00`、`m01` 的 id 已由新課綱重新使用）：

```json
{
  "schemaVersion": 1,
  "units": {
    "m01-u03": {
      "completedAt": "2026-11-04T10:00:00.000Z",
      "quizAnswers": {
        "q1": { "optionId": "b", "answeredAt": "2026-11-04T09:58:00.000Z" }
      },
      "updatedAt": "2026-11-04T10:00:00.000Z"
    }
  },
  "lastVisitedUnitId": "m01-u03",
  "updatedAt": "2026-11-04T10:00:00.000Z"
}
```

- 未完成的單元，`completedAt` 為 `null`，不省略欄位。
- 還沒有任何紀錄時，最外層的 `updatedAt` 為 `null`。
- 只存單元 id、選項 id 與時間，不存任何個資。

### 5.2 規則

- **完成條件**：使用者按下「完成本單元」。決策題作答另外記錄，不是完成條件。
- **讀取時驗證**：格式錯誤或版本無法辨識時，不覆蓋原資料；把原資料另存到 `rtsa-progress-backup-<時間>`，畫面明確提示，使用者確認後才重新開始。
- **儲存失敗**：localStorage 無法使用（無痕模式、被封鎖、容量已滿）時，畫面顯示「這個瀏覽器無法儲存進度」，課程仍可閱讀；不默默失敗。
- **版本升級**：依 `schemaVersion` 逐版執行 migration 函式。
- **為同步預留**：每個單元有自己的 `updatedAt`，第二階段可以逐單元合併（較新的勝出）。
- **安全**：從 localStorage 讀出的值只當作資料使用，不插入成 HTML，避免被竄改的資料造成 XSS。

### 5.3 模組切分

- 純函式：`parse`、`validate`、`migrate`、`markComplete`、`recordAnswer`、`merge`。
- Storage adapter：第一階段讀寫 localStorage；第二階段新增同步 adapter，畫面程式不用改。

## 6. 效能驗收

| 指標 | 門檻 | 量測方式 |
|---|---|---|
| LCP（手機） | p95 ≤ 2.5 秒 | Lighthouse mobile 預設節流；首頁、模組頁、單元頁各跑 10 次，記錄 p50 與 p95 |
| CLS | ≤ 0.1 | 同上 |
| TBT | p95 ≤ 200 ms | 同上 |
| 單元頁傳輸量 | HTML＋CSS＋JS（gzip）≤ 150 KB，不含圖片 | 建置輸出檢查 |
| 單元頁 JavaScript | ≤ 30 KB（gzip） | 建置輸出檢查 |
| 決策題作答回饋 | 點擊到顯示解析 p95 ≤ 100 ms | Playwright 量測 10 次 |

- 記錄受測 commit、環境（本機 preview 與正式網址分開記）、裝置模擬條件、冷／暖快取、樣本數。
- 沒量測或沒達門檻，記為「待驗收」或「未通過」，不因建置通過就算合格。
- 門檻是依「手機零碎時間閱讀」的情境訂的初版，樣板內容完成後依實測檢討一次。
- 傳輸量由 CI 的 `npm run perf:bundle` 檢查；決策題回饋由 E2E 量測。量測紀錄放在 `docs/evidence/`。

## 7. 資安

- `public/_headers` 以 Harbor 範本 `standards/deployment-templates/worker-static-assets/_headers` 為基礎，只保留需要的來源：
  - CSP 以 `default-src 'self'` 為原則，`frame-ancestors 'none'`、`object-src 'none'`。
  - `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy`、`Permissions-Policy`。
  - HTML 設 `Cache-Control: no-cache`；檔名含 hash 的靜態檔可以長期快取。
- 是否接 Harbor 的維護模式腳本，在里程碑 2 決定；接的話 CSP 要加入 Harbor 的來源。目前沒有接，CSP 只允許本站。
- Astro 預設會把小的腳本與樣式內嵌，`astro.config.mjs` 已設定一律輸出成外部檔案，CSP 不需要 `'unsafe-inline'`。
- 依賴稽核：CI 遇到 high／critical 漏洞時失敗；稽核本身失敗算未完成。
- Markdown 在建置時轉成 HTML，內容來源只有本 repo。

## 8. 部署與零月費

- **平台**：Cloudflare Worker static assets，Worker 名稱 `road-to-solution-architect`，網址為 <https://road-to-solution-architect.curio-lab.workers.dev/>（2026-11-05 第一次部署）。
- **Workflow**：以 Harbor 範本 `standards/deployment-templates/github-actions/deploy-worker.yml` 為基礎。只在 `main` push 或擁有者手動觸發時部署；PR 只跑檢查。
- **擁有者事前設定**：GitHub Secrets `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`（部署手冊 4.1）。
- **Rollback**：`wrangler rollback` 回上一版，或 revert PR 後由 CI 重新部署。
- **零月費檢查**（部署前到 Cloudflare 官方文件重新確認）：
  - Workers 免費方案；靜態檔請求不計入 Worker 請求數。
  - 檔案數預估在 1,000 個以內，遠低於每版 20,000 個的上限（部署手冊第 3 章）。
  - GitHub Actions：公開 repo 免費；如果 repo 是 private，用量計入每月免費分鐘數。
  - 第二階段的 D1 用量與上限，在第二階段設計時另外確認。

## 9. 測試與驗收

| 類型 | 內容 |
|---|---|
| 單元測試 | 進度模組的純函式：格式錯誤、版本升級、合併、時間邊界 |
| 內容驗證（CI） | frontmatter 必填欄位與型別；id 唯一且格式正確；每題剛好一個正確選項且每個選項都有解析；課綱是 7 個模組、30 個單元，每個單元 id 與標題都對得上課綱（分批上線，未上線的單元只列入統計）；段落齊全且順序正確（「交給 AI 時要注意」選填，有寫時放在決策題與重點回顧之間）；提到 AWS 服務的單元有 `sources`、查證日期與「延伸閱讀」 |
| E2E（Playwright） | 完成單元後重新整理，進度仍在；作答後顯示解析；localStorage 無法使用時顯示提示；資料損壞時先備份再提示；手機（390×844）與桌機（1440×900）沒有水平捲動；每頁沒有 CSP 違規或 console 錯誤 |
| 內容正確性 | 使用者審閱，`status` 改為 `reviewed`；和結構驗證分開記錄 |

- 「提到 AWS 服務」的判斷：出現 EC2、S3、Lambda、DynamoDB、IAM 等服務名稱，或「AWS／Amazon＋服務名」。單獨寫「AWS」指雲端平台本身，不算。
- E2E 用 `tests/fixtures/content` 建置（`npm run build:fixture`），不依賴正式內容的文字；測試伺服器會套用 `public/_headers`，所以 CSP 也在 E2E 裡驗證。
| 效能 | 第 6 節 |

## 10. ADR

### ADR-001：部署在 Cloudflare Worker static assets（定案）

- **背景**：第二階段要加登入。部署手冊規定有登入的網站不能放在 `github.io`，需要 API 時網頁與 API 放在同一個 Worker。
- **選項**：
  - GitHub Pages：第一階段最簡單，但第二階段要搬家，瀏覽器裡的進度會因為換網址而遺失。
  - Cloudflare Pages：獨立網址，但加 API 時要另外處理同源。
  - Worker static assets：第二階段直接在同一個 Worker 加 API，網頁與 API 同源。
- **決定**：Worker static assets。和 Family、nihongo-lab 相同模式，可以直接用 Harbor 範本。
- **代價**：第一階段比 GitHub Pages 多一次 Cloudflare secrets 設定。
- **零月費**：見第 8 節。

### ADR-002：前端用 Astro 靜態輸出（定案）

- **背景**：內容型網站，約 70 個單元頁加上模組頁；以手機閱讀為主，有效能門檻；互動只有決策題、完成按鈕與進度顯示。
- **選項**：

  | 選項 | 優點 | 缺點 |
  |---|---|---|
  | Astro 靜態輸出，互動部分用少量 TypeScript | 內建 Markdown 內容集合，可用 schema 檢查 frontmatter；預設不送 JavaScript；每個單元是一個靜態頁，載入快 | 多一個框架要維護 |
  | Vite＋React SPA | 熟悉的技術 | 內容頁也要載入 React，首次載入較重；Markdown、路由都要自己處理 |
  | 自寫建置腳本＋純 TypeScript | 依賴最少 | Markdown 轉換、路由、內容驗證都要自己寫，維護成本高 |

- **決定**：Astro。frontmatter 在建置時就用 schema 驗證，符合「在信任邊界集中驗證」；預設不送 JavaScript，容易達到第 6 節的 JavaScript 預算。
- **確認**：2026-11-04 使用者確認。

### ADR-003：第一階段進度存在 localStorage，格式預先為同步設計（定案）

- **背景**：使用者選擇分兩階段：先存在瀏覽器，之後加登入同步。
- **決定**：格式與規則見第 5 節。每個單元有自己的 `updatedAt`，第二階段可以逐單元合併；進度模組分成純函式與 storage adapter，第二階段只新增 adapter。
- **代價**：第一階段清除瀏覽器資料就會遺失進度；不同裝置的進度不互通。第一階段不做匯出／匯入，第二階段同步上線時再評估是否需要。

### ADR-004：內容用 Markdown＋frontmatter，圖用 SVG（定案）

- **單元內容**：Markdown，決策題寫在 frontmatter。不用 MDX，讓內容檔只有文字，方便審閱與驗證。
- **架構圖選項**：

  | 選項 | 優點 | 缺點 |
  |---|---|---|
  | Mermaid 在瀏覽器渲染 | 圖的原始碼好寫好改 | 要載入體積很大的 JavaScript，超出第 6 節的預算 |
  | 建置時把 Mermaid 轉成 SVG | 執行時沒有額外 JavaScript | CI 要裝無頭瀏覽器，建置變慢、變複雜 |
  | 直接寫 SVG 檔 | 沒有建置依賴；AI 可以直接產生 | 修改比 Mermaid 麻煩 |

- **決定**：直接寫 SVG 檔，放在單元旁邊，建置時內嵌進頁面，顏色用 CSS 變數以支援深色模式；每張圖附文字說明。
- **確認**：2026-11-04 使用者確認。

## 11. 第二階段預留

- 同一個 Worker 加 `/api/*`：Google 登入、讀取與寫入進度。
- 依部署手冊 2.1：session 用 `__Host-` cookie，網頁與 API 同源、不開 CORS，改資料的請求檢查 `Origin`。
- D1 存進度，格式沿用第 5.1 節；第一次登入時把瀏覽器進度逐單元合併上傳。
- 開工前補 `docs/02-system-analysis.md`、`docs/04-release-gate.md`，本文件補完整設計，並更新專案級別。
