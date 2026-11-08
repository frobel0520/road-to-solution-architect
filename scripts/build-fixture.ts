// 用測試用內容建置到 dist-fixture，供 E2E 使用（跨平台設定環境變數）。建置後和正式建置一樣產生 service worker。
import { spawnSync } from "node:child_process";

const build = spawnSync(process.execPath, ["node_modules/astro/bin/astro.mjs", "build"], {
	stdio: "inherit",
	env: { ...process.env, RTSA_CONTENT_DIR: "tests/fixtures/content", RTSA_OUT_DIR: "dist-fixture" },
});
if (build.status !== 0) {
	process.exitCode = build.status ?? 1;
} else {
	const sw = spawnSync(process.execPath, ["scripts/build-sw.ts", "dist-fixture"], { stdio: "inherit" });
	process.exitCode = sw.status ?? 1;
}
