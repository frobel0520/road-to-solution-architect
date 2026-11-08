// SWE Trial service worker（docs/03-system-design.md 第 12 節）。由 scripts/build-sw.ts 填入版本與清單後輸出成 sw.js。
// 頁面：先連網路，拿不到才用快取，讓內容更新後馬上看得到；Astro 資源檔名含 hash，直接用快取。
const VERSION = __CACHE_VERSION__;
const PRECACHE = __PRECACHE_URLS__;
const CACHE = `swe-trial-${VERSION}`;

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key.startsWith("swe-trial-") && key !== CACHE).map((key) => caches.delete(key))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (request.method !== "GET") return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (url.pathname.startsWith("/_astro/")) {
		event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
		return;
	}
	event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
	const cache = await caches.open(CACHE);
	try {
		const response = await fetch(request);
		if (response.ok) await cache.put(request, response.clone());
		return response;
	} catch (error) {
		const cached = (await cache.match(request)) ?? (await cache.match(request, { ignoreSearch: true }));
		if (cached) return cached;
		if (request.mode === "navigate") {
			const home = await cache.match("/");
			if (home) return home;
		}
		throw error;
	}
}
