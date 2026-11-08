// 建置後產生 service worker：掃描輸出目錄，寫出 <dist>/sw.js。
// 用法：node scripts/build-sw.ts <輸出目錄>
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { cacheVersion, precacheUrls, renderServiceWorker, type BuiltFile } from "./lib/service-worker.ts";

const dist = process.argv[2] ?? "dist";

function listFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = join(dir, entry.name);
		return entry.isDirectory() ? listFiles(full) : [full];
	});
}

const files: BuiltFile[] = listFiles(dist).map((full) => ({
	path: relative(dist, full).split(sep).join("/"),
	content: readFileSync(full),
}));
const urls = precacheUrls(files);
const version = cacheVersion(files);
writeFileSync(join(dist, "sw.js"), renderServiceWorker(readFileSync("scripts/sw-template.js", "utf8"), version, urls));
console.log(`service worker：版本 ${version}，預先快取 ${urls.length} 個網址 → ${join(dist, "sw.js")}`);
