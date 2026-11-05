// Lighthouse 量測（docs/03-system-design.md 第 6 節）：首頁、模組頁、單元頁各跑 N 次，手機預設節流，記錄 p50／p95。
// 用法：node scripts/perf-lighthouse.mjs <base URL> <輸出 JSON> [次數]
// 需要 Chrome；可用環境變數 CHROME_PATH 指定。lighthouse 以固定版本透過 npx 執行，不加入專案依賴。
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LIGHTHOUSE = "lighthouse@13.5.0";
const [base = "http://127.0.0.1:4330", out = "lighthouse.json", runsArg = "10"] = process.argv.slice(2);
const runs = Number(runsArg);
const pages = { home: "/", module: "/modules/m01/", unit: "/units/m01-u03/" };

const percentile = (values, p) => {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
};

const dir = mkdtempSync(join(tmpdir(), "rtsa-lh-"));
const results = {};
try {
	for (const [name, path] of Object.entries(pages)) {
		const samples = [];
		for (let i = 0; i < runs; i += 1) {
			const file = join(dir, `${name}-${i}.json`);
			execFileSync(
				process.platform === "win32" ? "npx.cmd" : "npx",
				["--yes", LIGHTHOUSE, `${base}${path}`, "--only-categories=performance", "--output=json", `--output-path=${file}`, "--quiet", "--chrome-flags=--headless=new"],
				{ stdio: "inherit", shell: process.platform === "win32" },
			);
			const audits = JSON.parse(readFileSync(file, "utf8")).audits;
			samples.push({
				lcp: audits["largest-contentful-paint"].numericValue,
				cls: audits["cumulative-layout-shift"].numericValue,
				tbt: audits["total-blocking-time"].numericValue,
			});
		}
		const summary = (key) => ({ p50: percentile(samples.map((s) => s[key]), 0.5), p95: percentile(samples.map((s) => s[key]), 0.95), max: Math.max(...samples.map((s) => s[key])) });
		results[name] = { path, runs, lcpMs: summary("lcp"), cls: summary("cls"), tbtMs: summary("tbt"), samples };
		console.log(`${name} ${path}: LCP p95 ${results[name].lcpMs.p95.toFixed(0)} ms, CLS max ${results[name].cls.max.toFixed(3)}, TBT p95 ${results[name].tbtMs.p95.toFixed(0)} ms`);
	}
} finally {
	rmSync(dir, { recursive: true, force: true });
}
writeFileSync(out, JSON.stringify({ lighthouse: LIGHTHOUSE, base, formFactor: "mobile（Lighthouse 預設節流）", results }, null, 2));
