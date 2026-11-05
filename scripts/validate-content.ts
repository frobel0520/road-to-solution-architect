// 用法：node scripts/validate-content.ts [內容目錄]（預設 content，或環境變數 RTSA_CONTENT_DIR）
import { readFileSync } from "node:fs";
import { checkContent } from "./lib/content-checks.ts";

const contentDir = process.argv[2] ?? process.env.RTSA_CONTENT_DIR ?? "content";
const report = checkContent({
	contentDir,
	curriculumMarkdown: readFileSync("docs/curriculum.md", "utf8"),
	today: new Date().toISOString().slice(0, 10),
});

for (const warning of report.warnings) console.warn(`警告：${warning}`);
for (const error of report.errors) console.error(`錯誤：${error}`);

const reviewed = report.units.filter((unit) => unit.status === "reviewed").length;
console.log(
	`內容驗證（${contentDir}）：已上線 ${report.units.length}／${report.curriculumUnits} 個單元（reviewed ${reviewed}、draft ${report.units.length - reviewed}），錯誤 ${report.errors.length}、警告 ${report.warnings.length}`,
);
process.exitCode = report.errors.length > 0 ? 1 : 0;
