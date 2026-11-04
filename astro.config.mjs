import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://road-to-solution-architect.workers.dev",
	outDir: process.env.RTSA_OUT_DIR ?? "dist",
	trailingSlash: "always",
	build: {
		format: "directory",
		// CSP 不開 'unsafe-inline'：樣式一律輸出成外部檔案。
		inlineStylesheets: "never",
	},
	devToolbar: { enabled: false },
	// 小的腳本預設會被內嵌成 inline script，CSP（script-src 'self'）會擋，所以一律輸出外部檔案。
	vite: { build: { assetsInlineLimit: 0 } },
});
