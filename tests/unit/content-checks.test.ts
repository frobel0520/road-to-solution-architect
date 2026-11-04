import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkContent, checkSvg } from "../../scripts/lib/content-checks.ts";

const curriculumMarkdown = readFileSync("docs/curriculum.md", "utf8");
const UNIT = "modules/m00-sa-intro/m00-u01.md";
let dir = "";

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "rtsa-content-"));
	cpSync("tests/fixtures/content", dir, { recursive: true });
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

function run() {
	return checkContent({ contentDir: dir, curriculumMarkdown, today: "2026-11-04" });
}

function edit(file: string, change: (text: string) => string) {
	const path = join(dir, file);
	writeFileSync(path, change(readFileSync(path, "utf8")));
}

function errorsAfter(change: (text: string) => string, file = UNIT) {
	edit(file, change);
	return run().errors.join("\n");
}

describe("checkContent", () => {
	it("測試用內容通過驗證，並回報已上線的單元數", () => {
		const report = run();
		expect(report.errors).toEqual([]);
		expect(report.curriculumUnits).toBe(68);
		expect(report.units.map((unit) => unit.id)).toEqual(["m00-u01", "m00-u02", "m01-u01"]);
	});

	it.each([
		["兩個正確選項", (t: string) => t.replace("correct: false, explanation: 甲", "correct: true, explanation: 甲"), "剛好一個正確選項"],
		["沒有正確選項", (t: string) => t.replace("correct: true, explanation: 乙", "correct: false, explanation: 乙"), "剛好一個正確選項"],
		["選項缺解析", (t: string) => t.replace("explanation: 丙的測試解析。", "explanation: ''"), "explanation"],
		["只有兩個選項", (t: string) => t.replace(/\n {6}- \{ id: c, text: 測試選項丙.*\n/, "\n"), "options"],
		["id 格式錯誤", (t: string) => t.replace("id: m00-u01", "id: m0-u1"), "id 格式"],
		["標題和課綱不同", (t: string) => t.replace("title: Solution Architect 在做什麼", "title: 別的標題"), "和課綱"],
		["閱讀時間超出範圍", (t: string) => t.replace("minutes: 10", "minutes: 30"), "minutes"],
		["status 不合法", (t: string) => t.replace("status: draft", "status: done"), "status"],
		["段落順序錯誤", (t: string) => t.replace("## 情境", "## 暫存").replace("## 觀念", "## 情境").replace("## 暫存", "## 觀念"), "段落應為"],
		["缺少段落", (t: string) => t.replace("## 取捨", "### 取捨"), "段落應為"],
		["決策題段落有內容", (t: string) => t.replace("## 決策題\n", "## 決策題\n\n題目寫在這裡\n"), "留空"],
		["回顧不到 3 點", (t: string) => t.replace("- 測試回顧三\n", ""), "3～5 點"],
		["取捨沒有表格", (t: string) => t.replace(/\| 選項[\s\S]*?\| 測試代價 \|\n/, "測試文字\n"), "表格"],
		["沒有架構圖", (t: string) => t.replace(/!\[.*\]\(.*\)/, ""), "至少要有一張架構圖"],
		["架構圖沒有說明", (t: string) => t.replace("![測試用架構圖說明]", "![]"), "缺少文字說明"],
		["引用外部圖片", (t: string) => t.replace("## 觀念\n", "## 觀念\n\n![x](https://example.com/a.png)\n"), "同資料夾的 SVG"],
		["本文有程式碼區塊", (t: string) => t.replace("## 觀念\n", "## 觀念\n\n```\ncode\n```\n"), "程式碼區塊"],
		["提到 AWS 服務卻沒有來源", (t: string) => t.replace("測試用觀念段落。", "改用 Amazon S3 存放檔案。"), "sources 必填"],
		["checkedOn 是未來日期", (t: string) => t.replace("status: draft", "sources:\n  - { title: 測試, url: 'https://docs.aws.amazon.com/', checkedOn: 2027-01-01 }\nstatus: draft"), "未來日期"],
		["來源不是 https", (t: string) => t.replace("status: draft", "sources:\n  - { title: 測試, url: 'http://example.com/', checkedOn: 2026-11-01 }\nstatus: draft"), "url"],
	])("%s → 錯誤", (_, change, expected) => {
		expect(errorsAfter(change)).toContain(expected);
	});

	it("提到 AWS 服務、有來源與延伸閱讀時通過", () => {
		edit(UNIT, (t) =>
			t
				.replace("測試用觀念段落。", "改用 Amazon S3 存放檔案。")
				.replace("status: draft", "sources:\n  - { title: 測試, url: 'https://docs.aws.amazon.com/', checkedOn: 2026-11-01 }\nstatus: draft")
				.concat("\n## 延伸閱讀\n\n- 測試來源\n"),
		);
		expect(run().errors).toEqual([]);
	});

	it("單獨寫「AWS」指雲端平台，不要求來源", () => {
		edit(UNIT, (t) => t.replace("測試用觀念段落。", "公司剛決定導入 AWS。"));
		expect(run().errors).toEqual([]);
	});

	it("單元 id 重複", () => {
		cpSync(join(dir, UNIT), join(dir, "modules/m01-requirements/m00-u01.md"));
		cpSync(join(dir, "modules/m00-sa-intro/m00-u01-fixture.svg"), join(dir, "modules/m01-requirements/m00-u01-fixture.svg"));
		expect(run().errors.join("\n")).toContain("重複");
	});

	it("module.yaml 和課綱不一致", () => {
		expect(errorsAfter((t) => t.replace("portfolio: 能力自評表", "portfolio: 別的產出"), "modules/m00-sa-intro/module.yaml")).toContain("作品集產出");
	});
});

describe("checkSvg", () => {
	const ok = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>圖</title><rect class="d-box"/></svg>';

	it("合格的 SVG 沒有問題", () => {
		expect(checkSvg(ok)).toEqual([]);
	});

	it.each([
		["script", ok.replace("<rect", "<script>alert(1)</script><rect")],
		["事件屬性", ok.replace("<rect", '<rect onclick="x()"')],
		["style 屬性", ok.replace("<rect", '<rect style="fill:red"')],
		["寫死顏色", ok.replace("<rect", '<rect fill="#ff0000"')],
		["外部連結", ok.replace("<rect", '<image href="https://example.com/a.png"/><rect')],
		["缺 title", ok.replace("<title>圖</title>", "")],
		["缺 viewBox", ok.replace(' viewBox="0 0 10 10"', "")],
	])("%s → 有問題", (_, svg) => {
		expect(checkSvg(svg)).not.toEqual([]);
	});
});
