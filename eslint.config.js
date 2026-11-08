import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
	{ ignores: ["dist/", "dist-fixture/", ".astro/", "node_modules/", "test-results/", "playwright-report/"] },
	js.configs.recommended,
	tseslint.configs.strict,
	{
		files: ["**/*.{js,mjs,ts}"],
		languageOptions: {
			globals: { console: "readonly", process: "readonly", window: "readonly", document: "readonly", URL: "readonly" },
		},
		rules: {
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
		},
	},
	{
		// service worker 範本：在 worker 裡執行，佔位符由 scripts/build-sw.ts 建置時換掉。
		files: ["scripts/sw-template.js"],
		languageOptions: {
			globals: { self: "readonly", caches: "readonly", fetch: "readonly", __CACHE_VERSION__: "readonly", __PRECACHE_URLS__: "readonly" },
		},
	},
	{
		// 進度模組不依賴畫面與 storage 實作（docs/03 第 5.3 節）。
		files: ["src/progress/model.ts"],
		rules: {
			"no-restricted-imports": ["error", { patterns: ["../scripts/*", "./storage*", "astro*"] }],
			"no-restricted-globals": ["error", "document", "window", "localStorage"],
		},
	},
);
