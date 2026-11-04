// 內容結構驗證（docs/03-system-design.md 第 4、9 節；單元格式見 docs/curriculum.md 第 2、3 節）。
// 只檢查結構與格式；內容正確性由使用者審閱（status: reviewed），兩者分開記錄。
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { moduleSchema, templateSchema, unitSchema, type Unit } from "../../src/lib/content-schema.ts";
import { allUnits, parseCurriculum, type CurriculumModule } from "../../src/lib/curriculum.ts";

export const EXPECTED_MODULES = 14;
export const EXPECTED_UNITS = 68;
export const REQUIRED_SECTIONS = ["情境", "觀念", "架構圖", "取捨", "決策題", "交給 AI 時要注意", "重點回顧"] as const;
export const OPTIONAL_LAST_SECTION = "延伸閱讀";

/** 提到這些 AWS 服務（或「AWS／Amazon ＋服務名」）就必須附官方來源。單獨寫「AWS」指雲端平台本身，不算。 */
const AWS_SERVICE =
	/\b(?:AWS|Amazon)\s+[A-Z][A-Za-z0-9]+|\b(?:EC2|S3|Lambda|DynamoDB|Aurora|RDS|ECS|EKS|Fargate|CloudFront|Route 53|VPC|CloudWatch|CloudTrail|Control Tower|IAM Identity Center|IAM|KMS|SQS|SNS|EventBridge|API Gateway|Bedrock|Well-Architected)\b/;

export interface CheckOptions {
	contentDir: string;
	curriculumMarkdown: string;
	today: string;
}

export interface CheckReport {
	errors: string[];
	warnings: string[];
	units: { id: string; status: Unit["status"] }[];
	curriculumUnits: number;
}

export function checkContent({ contentDir, curriculumMarkdown, today }: CheckOptions): CheckReport {
	const errors: string[] = [];
	const warnings: string[] = [];
	const units: CheckReport["units"] = [];

	let curriculum: CurriculumModule[] = [];
	try {
		curriculum = parseCurriculum(curriculumMarkdown);
	} catch (error) {
		errors.push(`curriculum.md：${(error as Error).message}`);
	}
	const planned = new Map(allUnits(curriculum).map((unit) => [unit.id, unit]));
	if (curriculum.length !== EXPECTED_MODULES) errors.push(`curriculum.md：模組數 ${curriculum.length}，應為 ${EXPECTED_MODULES}`);
	if (planned.size !== EXPECTED_UNITS) errors.push(`curriculum.md：單元數 ${planned.size}，應為 ${EXPECTED_UNITS}（或 id 重複）`);

	const modulesDir = join(contentDir, "modules");
	const seen = new Set<string>();
	for (const folder of listDirs(modulesDir)) {
		const where = `modules/${folder}`;
		const folderModule = /^m(\d{2})-[a-z0-9-]+$/.exec(folder);
		if (!folderModule) {
			errors.push(`${where}：資料夾名稱格式為 m00-<slug>`);
			continue;
		}
		const moduleNumber = Number(folderModule[1]);
		checkModuleMeta(join(modulesDir, folder), where, moduleNumber, curriculum, errors);

		for (const file of readdirSync(join(modulesDir, folder)).filter((name) => name.endsWith(".md")).sort()) {
			const path = `${where}/${file}`;
			const unit = checkUnitFile(join(modulesDir, folder), file, path, { moduleNumber, planned, today, errors, warnings });
			if (!unit) continue;
			if (seen.has(unit.id)) errors.push(`${path}：id ${unit.id} 重複`);
			seen.add(unit.id);
			units.push({ id: unit.id, status: unit.status });
		}
	}

	checkTemplates(join(contentDir, "templates"), errors);
	if (!existsSync(join(contentDir, "case.md"))) errors.push("缺少 case.md（Example Retail 介紹頁）");

	return { errors, warnings, units, curriculumUnits: planned.size };
}

function checkModuleMeta(dir: string, where: string, moduleNumber: number, curriculum: CurriculumModule[], errors: string[]): void {
	const path = join(dir, "module.yaml");
	if (!existsSync(path)) {
		errors.push(`${where}：缺少 module.yaml`);
		return;
	}
	const result = moduleSchema.safeParse(safeYaml(readFileSync(path, "utf8")));
	if (!result.success) {
		errors.push(...result.error.issues.map((issue) => `${where}/module.yaml：${issue.path.join(".")} ${issue.message}`));
		return;
	}
	const meta = result.data;
	const planned = curriculum.find((module) => module.number === moduleNumber);
	if (meta.number !== moduleNumber || meta.id !== `m${String(moduleNumber).padStart(2, "0")}`) {
		errors.push(`${where}/module.yaml：id／number 和資料夾不一致`);
	}
	if (!planned) {
		errors.push(`${where}：課綱沒有模組 ${moduleNumber}`);
		return;
	}
	if (meta.title !== planned.title) errors.push(`${where}/module.yaml：標題「${meta.title}」和課綱「${planned.title}」不一致`);
	if ((meta.portfolio ?? null) !== planned.portfolio) {
		errors.push(`${where}/module.yaml：作品集產出「${meta.portfolio ?? "無"}」和課綱「${planned.portfolio ?? "無"}」不一致`);
	}
}

interface UnitContext {
	moduleNumber: number;
	planned: Map<string, { title: string; module: number }>;
	today: string;
	errors: string[];
	warnings: string[];
}

function checkUnitFile(dir: string, file: string, path: string, ctx: UnitContext): Unit | null {
	const { errors, warnings } = ctx;
	if (!/^m\d{2}-u\d{2}\.md$/.test(file)) {
		errors.push(`${path}：單元檔名格式為 m00-u01.md`);
		return null;
	}
	const split = splitFrontmatter(readFileSync(join(dir, file), "utf8"));
	if (!split) {
		errors.push(`${path}：缺少 frontmatter`);
		return null;
	}
	const result = unitSchema.safeParse(safeYaml(split.frontmatter));
	if (!result.success) {
		errors.push(...result.error.issues.map((issue) => `${path}：${issue.path.join(".") || "frontmatter"} ${issue.message}`));
		return null;
	}
	const unit = result.data;
	if (`${unit.id}.md` !== file) errors.push(`${path}：檔名和 id ${unit.id} 不一致`);
	if (unit.module !== ctx.moduleNumber) errors.push(`${path}：module ${unit.module} 和資料夾不一致`);
	const planned = ctx.planned.get(unit.id);
	if (!planned) errors.push(`${path}：課綱沒有 ${unit.id}`);
	else if (planned.title !== unit.title) errors.push(`${path}：標題「${unit.title}」和課綱「${planned.title}」不一致`);

	const body = split.body;
	const sections = splitSections(body);
	checkSectionOrder(path, sections.map((section) => section.title), errors);
	const byTitle = new Map(sections.map((section) => [section.title, section.text]));

	if (/^\s*(```|~~~)/m.test(body)) errors.push(`${path}：本文不放程式碼區塊（curriculum.md 第 3 節）`);
	checkDiagrams(dir, path, body, errors);
	if (byTitle.has("取捨") && !/^\s*\|.+\|\s*$/m.test(byTitle.get("取捨") ?? "")) errors.push(`${path}：「取捨」段落要用表格`);
	checkListCount(path, "交給 AI 時要注意", byTitle, errors);
	checkListCount(path, "重點回顧", byTitle, errors);
	if ((byTitle.get("決策題") ?? "").trim() !== "") errors.push(`${path}：「決策題」段落留空，題目寫在 frontmatter 的 quiz`);

	const mentionsAws = AWS_SERVICE.test(body) || AWS_SERVICE.test(split.frontmatter.replace(/^\s*-?\s*(title|url):.*$/gm, ""));
	if (mentionsAws) {
		if (unit.sources.length === 0) errors.push(`${path}：提到 AWS 服務，sources 必填（附 checkedOn）`);
		if (!byTitle.has(OPTIONAL_LAST_SECTION)) errors.push(`${path}：提到 AWS 服務，「延伸閱讀」段落必填`);
	}
	for (const source of unit.sources) {
		if (source.checkedOn > ctx.today) errors.push(`${path}：sources「${source.title}」的 checkedOn 是未來日期`);
	}

	const length = body.replace(/[#*>|`\-\s[\]()!]/g, "").length;
	if (length < 1500 || length > 3500) warnings.push(`${path}：本文約 ${length} 字，建議 2,000～3,000 字`);
	return unit;
}

function checkSectionOrder(path: string, titles: string[], errors: string[]): void {
	const expected: string[] = [...REQUIRED_SECTIONS];
	const actual = titles.at(-1) === OPTIONAL_LAST_SECTION ? titles.slice(0, -1) : titles;
	if (actual.join("|") !== expected.join("|")) {
		errors.push(`${path}：段落應為 ${[...expected, `（${OPTIONAL_LAST_SECTION}）`].join("、")}，目前是 ${titles.join("、") || "（沒有段落）"}`);
	}
}

const DIAGRAM = /!\[([^\]]*)\]\(\.\/([^)\s]+\.svg)\)/g;

function checkDiagrams(dir: string, path: string, body: string, errors: string[]): void {
	const diagrams = [...body.matchAll(DIAGRAM)];
	if (diagrams.length === 0) errors.push(`${path}：至少要有一張架構圖（![說明](./檔名.svg)）`);
	if (/!\[[^\]]*\]\((?!\.\/[^)\s]+\.svg\))/.test(body)) errors.push(`${path}：圖片只能引用同資料夾的 SVG`);
	for (const [, alt = "", file = ""] of diagrams) {
		if (alt.trim() === "") errors.push(`${path}：${file} 缺少文字說明`);
		const svgPath = join(dir, file);
		if (!existsSync(svgPath)) {
			errors.push(`${path}：找不到 ${file}`);
			continue;
		}
		errors.push(...checkSvg(readFileSync(svgPath, "utf8")).map((problem) => `${path}：${file} ${problem}`));
	}
}

/** 架構圖會內嵌進頁面，所以要符合 CSP（不能有 script、style、事件屬性、外部連結）。 */
export function checkSvg(svg: string): string[] {
	const problems: string[] = [];
	if (!/^\s*<svg\b[^>]*\bviewBox="/.test(svg)) problems.push("必須以帶 viewBox 的 <svg> 開頭");
	if (!/<title>[^<]+<\/title>/.test(svg)) problems.push("缺少 <title>");
	if (/<script\b|<style\b|<foreignObject\b/i.test(svg)) problems.push("不可包含 script、style 或 foreignObject");
	if (/\son[a-z]+\s*=/i.test(svg)) problems.push("不可包含事件屬性");
	if (/\sstyle\s*=/i.test(svg)) problems.push("不可使用 style 屬性（CSP 不允許，改用 class）");
	if (/(xlink:)?href\s*=\s*"(?!#)/i.test(svg)) problems.push("不可引用外部資源");
	if (/\s(fill|stroke)\s*=\s*"#/i.test(svg)) problems.push("顏色要用 class 套 CSS 變數，深色模式才會正確");
	return problems;
}

function checkListCount(path: string, title: string, sections: Map<string, string>, errors: string[]): void {
	const text = sections.get(title);
	if (text === undefined) return;
	const items = text.split(/\r?\n/).filter((line) => /^\s*([-*]|\d+\.)\s+\S/.test(line) && !/^\s{2,}/.test(line)).length;
	if (items < 3 || items > 5) errors.push(`${path}：「${title}」要 3～5 點，目前 ${items} 點`);
}

function checkTemplates(dir: string, errors: string[]): void {
	if (!existsSync(dir)) return;
	for (const file of readdirSync(dir).filter((name) => name.endsWith(".md"))) {
		const split = splitFrontmatter(readFileSync(join(dir, file), "utf8"));
		const result = templateSchema.safeParse(split ? safeYaml(split.frontmatter) : undefined);
		if (!result.success) errors.push(`templates/${file}：frontmatter 格式錯誤（title、module、summary）`);
	}
}

export function splitFrontmatter(source: string): { frontmatter: string; body: string } | null {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
	return match ? { frontmatter: match[1] ?? "", body: match[2] ?? "" } : null;
}

export function splitSections(body: string): { title: string; text: string }[] {
	const sections: { title: string; text: string }[] = [];
	let current: { title: string; text: string } | null = null;
	for (const line of body.split(/\r?\n/)) {
		const heading = /^##\s+(.+?)\s*$/.exec(line);
		if (heading) {
			current = { title: heading[1] ?? "", text: "" };
			sections.push(current);
		} else if (current) {
			current.text += `${line}\n`;
		}
	}
	return sections;
}

function safeYaml(text: string): unknown {
	try {
		return parseYaml(text, { maxAliasCount: 0 });
	} catch {
		return undefined;
	}
}

function listDirs(dir: string): string[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}
