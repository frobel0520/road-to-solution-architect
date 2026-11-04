import { defineConfig } from "@playwright/test";

// E2E 跑在測試用內容（npm run build:fixture → dist-fixture），由會套用 _headers 的靜態伺服器提供。
export default defineConfig({
	testDir: "tests/e2e",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
	use: {
		baseURL: "http://127.0.0.1:4321",
		browserName: "chromium",
	},
	projects: [
		{ name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
		{ name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
	],
	webServer: {
		command: "node tests/e2e/static-server.mjs dist-fixture 4321",
		url: "http://127.0.0.1:4321/",
		reuseExistingServer: !process.env.CI,
	},
});
