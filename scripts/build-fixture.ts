// 用測試用內容建置到 dist-fixture，供 E2E 使用（跨平台設定環境變數）。
import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["node_modules/astro/bin/astro.mjs", "build"], {
	stdio: "inherit",
	env: { ...process.env, RTSA_CONTENT_DIR: "tests/fixtures/content", RTSA_OUT_DIR: "dist-fixture" },
});
process.exitCode = result.status ?? 1;
