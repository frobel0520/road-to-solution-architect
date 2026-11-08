import { describe, expect, it } from "vitest";
import { cacheVersion, precacheUrls, renderServiceWorker, toUrl, type BuiltFile } from "../../scripts/lib/service-worker.ts";

const file = (path: string, content = path): BuiltFile => ({ path, content: new TextEncoder().encode(content) });

describe("service worker 產生器", () => {
	it("index.html 換成目錄網址，其他檔案保留路徑", () => {
		expect(toUrl("index.html")).toBe("/");
		expect(toUrl("units/m01-u01/index.html")).toBe("/units/m01-u01/");
		expect(toUrl("_astro/app.abc123.js")).toBe("/_astro/app.abc123.js");
		expect(toUrl("manifest.webmanifest")).toBe("/manifest.webmanifest");
	});

	it("預先快取清單排除 _headers、sw.js、404 頁，結果依網址排序", () => {
		const files = [file("units/m00-u01/index.html"), file("_headers"), file("sw.js"), file("404.html"), file("index.html"), file("_astro/a.css")];
		expect(precacheUrls(files)).toEqual(["/", "/_astro/a.css", "/units/m00-u01/"]);
	});

	it("內容不變時版本不變；任一檔案內容改變時版本改變", () => {
		const base = [file("index.html", "a"), file("_astro/a.css", "b")];
		expect(cacheVersion(base)).toBe(cacheVersion([...base].reverse()));
		expect(cacheVersion(base)).not.toBe(cacheVersion([file("index.html", "a2"), file("_astro/a.css", "b")]));
	});

	it("sw.js 本身改變不影響版本（避免版本互相影響）", () => {
		const base = [file("index.html", "a")];
		expect(cacheVersion([...base, file("sw.js", "old")])).toBe(cacheVersion([...base, file("sw.js", "new")]));
	});

	it("填入版本與清單；範本缺佔位符時丟錯", () => {
		const out = renderServiceWorker("const V = __CACHE_VERSION__; const P = __PRECACHE_URLS__;", "abc", ["/"]);
		expect(out).toBe('const V = "abc"; const P = ["/"];');
		expect(() => renderServiceWorker("const V = 1;", "abc", [])).toThrow("範本缺少");
	});
});
