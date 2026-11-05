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
		// 進度模組不依賴畫面與 storage 實作（docs/03 第 5.3 節）。
		files: ["src/progress/model.ts"],
		rules: {
			"no-restricted-imports": ["error", { patterns: ["../scripts/*", "./storage*", "astro*"] }],
			"no-restricted-globals": ["error", "document", "window", "localStorage"],
		},
	},
);
