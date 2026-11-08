// Service worker 產生器（docs/03-system-design.md 第 12 節）：建置後掃描輸出目錄，產生預先快取清單與版本。
// 純函式，不碰檔案系統；讀寫檔案由 scripts/build-sw.ts 負責。
import { createHash } from "node:crypto";

export interface BuiltFile {
	/** 相對於輸出目錄的路徑，用 / 分隔，例如 units/m01-u01/index.html。 */
	path: string;
	content: Uint8Array;
}

/** 不預先快取的檔案：設定檔、service worker 本身與 404 頁。 */
const EXCLUDED = new Set(["_headers", "sw.js", "404.html"]);

/** 把輸出檔案路徑換成瀏覽器請求的網址：index.html 換成目錄網址。 */
export function toUrl(path: string): string {
	if (path === "index.html") return "/";
	if (path.endsWith("/index.html")) return `/${path.slice(0, -"index.html".length)}`;
	return `/${path}`;
}

/** 預先快取清單：所有頁面、Astro 輸出的資源、圖示與 manifest。依網址排序，結果固定。 */
export function precacheUrls(files: BuiltFile[]): string[] {
	return files
		.map((file) => file.path)
		.filter((path) => !EXCLUDED.has(path) && !path.startsWith("."))
		.map(toUrl)
		.sort();
}

/** 版本由清單裡每個檔案的內容決定；內容沒變，版本就不變，使用者不會重新下載。 */
export function cacheVersion(files: BuiltFile[]): string {
	const hash = createHash("sha256");
	for (const file of [...files].filter((f) => !EXCLUDED.has(f.path)).sort((a, b) => a.path.localeCompare(b.path))) {
		hash.update(file.path);
		hash.update("\0");
		hash.update(file.content);
		hash.update("\0");
	}
	return hash.digest("hex").slice(0, 12);
}

/** 把版本與清單填進 service worker 範本。 */
export function renderServiceWorker(template: string, version: string, urls: string[]): string {
	if (!template.includes("__CACHE_VERSION__") || !template.includes("__PRECACHE_URLS__")) {
		throw new Error("service worker 範本缺少 __CACHE_VERSION__ 或 __PRECACHE_URLS__");
	}
	return template.replace("__CACHE_VERSION__", JSON.stringify(version)).replace("__PRECACHE_URLS__", JSON.stringify(urls));
}
