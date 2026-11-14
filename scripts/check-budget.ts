// 建置輸出的傳輸量預算（docs/03-system-design.md 第 6 節）：
// 單元頁 HTML＋CSS＋JS（gzip）≤ 150 KB、JavaScript（gzip）≤ 30 KB，不含圖片。
// 用法：node scripts/check-budget.ts <dist 目錄> [--json 輸出檔]
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { gzipSync } from "node:zlib";

const TOTAL_LIMIT = 150 * 1024;
const JS_LIMIT = 30 * 1024;

const dist = process.argv[2] ?? "dist";
const jsonIndex = process.argv.indexOf("--json");
const jsonOut = jsonIndex > -1 ? process.argv[jsonIndex + 1] : undefined;

const gz = (path: string) => gzipSync(readFileSync(path), { level: 9 }).length;

function assetPath(url: string): string {
	return join(dist, url.replace(/^\//, ""));
}

/** JavaScript 模組連同它靜態 import 的 chunk 一起算。 */
function collectScripts(entry: string, seen: Set<string>): void {
	if (seen.has(entry) || !existsSync(assetPath(entry))) return;
	seen.add(entry);
	const code = readFileSync(assetPath(entry), "utf8");
	for (const match of code.matchAll(/(?:from\s*|import\s*\(?\s*)["'](\.\/[^"']+\.js)["']/g)) {
		collectScripts(posix.join(posix.dirname(entry), match[1] ?? ""), seen);
	}
}

function measure(page: string) {
	const html = readFileSync(page, "utf8");
	const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((match) => match[1] ?? "");
	const scripts = new Set<string>();
	for (const match of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) collectScripts(match[1] ?? "", scripts);
	const cssBytes = css.reduce((sum, url) => sum + gz(assetPath(url)), 0);
	const jsBytes = [...scripts].reduce((sum, url) => sum + gz(assetPath(url)), 0);
	const htmlBytes = gz(page);
	const hasUninlinedImage = /__ASTRO_IMAGE_|<img\b/i.test(html);
	return { page: posix.normalize(page.replaceAll("\\", "/").replace(`${dist}/`, "/")), htmlBytes, cssBytes, jsBytes, totalBytes: htmlBytes + cssBytes + jsBytes, hasUninlinedImage };
}

function htmlPages(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return entry.name === "_astro" ? [] : htmlPages(path);
		return entry.name.endsWith(".html") ? [path] : [];
	});
}

const results = htmlPages(dist).map(measure).sort((a, b) => b.totalBytes - a.totalBytes);
const unitPages = results.filter((result) => result.page.startsWith("/units/"));
const failures = unitPages.filter((result) => result.totalBytes > TOTAL_LIMIT || result.jsBytes > JS_LIMIT || result.hasUninlinedImage);
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

console.log(`頁面數 ${results.length}，單元頁 ${unitPages.length}（預算只套用在單元頁）`);
for (const result of results.slice(0, 8)) {
	console.log(`${result.page}  total ${kb(result.totalBytes)}（HTML ${kb(result.htmlBytes)}、CSS ${kb(result.cssBytes)}、JS ${kb(result.jsBytes)}）`);
}
if (unitPages.length === 0) console.log("沒有單元頁：預算為「待驗收」，不算通過。");
for (const failure of failures) {
	console.error(`建置檢查失敗：${failure.page} total ${kb(failure.totalBytes)}／JS ${kb(failure.jsBytes)}${failure.hasUninlinedImage ? "（殘留未內嵌圖片）" : ""}`);
}

if (jsonOut) {
	writeFileSync(jsonOut, JSON.stringify({ dist, limits: { totalBytes: TOTAL_LIMIT, jsBytes: JS_LIMIT }, unitPages, otherPages: results.filter((r) => !unitPages.includes(r)) }, null, 2));
	console.log(`結果寫到 ${jsonOut}（${dirname(jsonOut)}）`);
}
process.exitCode = failures.length > 0 ? 1 : 0;
