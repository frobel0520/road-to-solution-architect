import { expect, test, type Page } from "@playwright/test";

const UNIT = "/units/m00-u01/";
const PAGES = ["/", "/modules/m00/", "/modules/m05/", UNIT, "/case/", "/templates/", "/no-such-page/"];

/** 收集 CSP 違規與 console 錯誤；頁面不應該有任何一個。 */
async function watchProblems(page: Page): Promise<string[]> {
	const problems: string[] = [];
	page.on("console", (message) => {
		if (message.type() === "error") problems.push(message.text());
	});
	page.on("pageerror", (error) => problems.push(error.message));
	await page.addInitScript(() => {
		document.addEventListener("securitypolicyviolation", (event) => console.error(`CSP: ${event.violatedDirective} ${event.blockedURI}`));
	});
	return problems;
}

test.describe("版面與安全標頭", () => {
	for (const path of PAGES) {
		test(`${path} 沒有水平捲動、沒有 CSP 違規或錯誤`, async ({ page }) => {
			const problems = await watchProblems(page);
			const response = await page.goto(path);
			expect(response?.headers()["content-security-policy"]).toContain("default-src 'self'");
			await page.waitForLoadState("networkidle");
			const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
			expect(overflow).toBeLessThanOrEqual(0);
			// 404 頁本身的回應狀態會被瀏覽器記成 console error，排除這一條。
			expect(problems.filter((text) => !text.includes("404"))).toEqual([]);
		});
	}
});

test.describe("單元頁", () => {
	test("完成單元後重新整理，進度仍在；模組頁與首頁也看得到", async ({ page }) => {
		await page.goto(UNIT);
		const button = page.locator("#complete-button");
		await expect(button).toHaveText("完成本單元");
		await button.click();
		await expect(page.locator("#complete-status")).toHaveText("已完成本單元。");

		await page.reload();
		await expect(button).toHaveText("標為未完成");

		await page.goto("/modules/m00/");
		await expect(page.locator('[data-unit-row="m00-u01"]')).toHaveAttribute("data-complete", "true");
		await expect(page.locator('[data-unit-row="m00-u02"]')).toHaveAttribute("data-complete", "false");
		await expect(page.locator("[data-progress-summary]")).toHaveText("已完成 1／2 個已上線單元");

		await page.goto("/");
		await expect(page.locator("#resume-link")).toHaveText("Solution Architect 在做什麼");
		await expect(page.locator("#resume-link")).toHaveAttribute("href", UNIT);
	});

	test("作答後顯示每個選項的解析，重新整理後保留作答", async ({ page }) => {
		await page.goto(UNIT);
		const quiz = page.locator('.quiz[data-quiz-id="q1"]');
		await expect(quiz.locator(".quiz-explanation").first()).toBeHidden();
		await quiz.getByRole("button", { name: "測試選項甲" }).click();
		await expect(quiz.locator(".quiz-explanation")).toHaveCount(3);
		for (const explanation of await quiz.locator(".quiz-explanation").all()) await expect(explanation).toBeVisible();
		await expect(quiz.locator(".quiz-status")).toHaveText("這不是最佳答案，看看每個選項的解析。");

		await quiz.getByRole("button", { name: "測試選項乙" }).click();
		await expect(quiz.locator(".quiz-status")).toHaveText("答對了，這是最佳答案。");

		await page.reload();
		await expect(quiz.getByRole("button", { name: "測試選項乙" })).toHaveAttribute("aria-pressed", "true");
		await expect(quiz.locator(".quiz-explanation").first()).toBeVisible();
		// 作答不等於完成
		await expect(page.locator("#complete-button")).toHaveText("完成本單元");
	});

	test("localStorage 無法使用時顯示提示，課程仍可閱讀與作答", async ({ page }) => {
		await page.addInitScript(() => {
			Storage.prototype.setItem = () => {
				throw new DOMException("blocked", "SecurityError");
			};
		});
		await page.goto(UNIT);
		await expect(page.locator("#progress-banner")).toBeVisible();
		await expect(page.locator("#progress-banner")).toContainText("這個瀏覽器無法儲存進度");
		await page.getByRole("button", { name: "測試選項乙" }).click();
		await expect(page.locator('.quiz[data-quiz-id="q1"] .quiz-explanation').first()).toBeVisible();
		await page.locator("#complete-button").click();
		await expect(page.locator("#complete-status")).toContainText("不會保留");
	});

	test("進度資料損壞時先備份、提示，確認後才重新開始", async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => localStorage.setItem("rtsa-progress", "{broken"));
		await page.goto(UNIT);
		const banner = page.locator("#progress-banner");
		await expect(banner).toContainText("無法讀取");
		expect(await page.evaluate(() => localStorage.getItem("rtsa-progress"))).toBe("{broken");

		await banner.getByRole("button", { name: "清除並重新開始記錄" }).click();
		await expect(banner).toBeHidden();
		const stored = await page.evaluate(() => Object.keys(localStorage));
		expect(stored.some((key) => key.startsWith("rtsa-progress-backup-"))).toBe(true);
		expect(await page.evaluate(() => JSON.parse(localStorage.getItem("rtsa-progress") ?? "{}").lastVisitedUnitId)).toBe("m00-u01");
	});

	test("被竄改的 lastVisitedUnitId 不會變成連結", async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() =>
			localStorage.setItem(
				"rtsa-progress",
				JSON.stringify({ schemaVersion: 1, units: {}, lastVisitedUnitId: "m99-u99", updatedAt: "2026-11-04T10:00:00.000Z" }),
			),
		);
		await page.reload();
		await expect(page.locator("#resume")).toBeHidden();
	});
});

test.describe("其他頁面", () => {
	test("尚未上線的單元顯示「尚未上線」，沒有連結", async ({ page }) => {
		await page.goto("/modules/m00/");
		const pending = page.locator(".unit-row.unpublished");
		await expect(pending).toHaveCount(1);
		await expect(pending).toContainText("尚未上線");
		await expect(pending.locator("a")).toHaveCount(0);
	});

	test("作品集範本可以複製", async ({ page, context, browserName }) => {
		test.skip(browserName !== "chromium");
		await context.grantPermissions(["clipboard-read", "clipboard-write"]);
		await page.goto("/templates/");
		await page.getByRole("button", { name: "複製 Markdown" }).first().click();
		await expect(page.locator("[data-copy-status]").first()).toHaveText("已複製");
		expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("| 能力 | 自評 |");
	});
});
