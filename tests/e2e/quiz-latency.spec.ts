// 效能：決策題點擊到顯示解析，p95 ≤ 100 ms（docs/03-system-design.md 第 6 節）。
// 量測從 pointerdown 到解析出現後的下一個畫格，結果寫到 test-results/，數字由 evidence 文件引用。
import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const SAMPLES = 10;

test("決策題作答回饋 p95 ≤ 100 ms", async ({ page }, testInfo) => {
	const samples: number[] = [];
	for (let i = 0; i < SAMPLES; i += 1) {
		await page.goto("/units/m00-u01/");
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.evaluate(() => {
			const quiz = document.querySelector<HTMLElement>('.quiz[data-quiz-id="q1"]');
			const target = quiz?.querySelector(".quiz-explanation");
			const state = window as unknown as { __start?: number; __latency?: Promise<number> };
			state.__latency = new Promise((resolve) => {
				const observer = new MutationObserver(() => {
					if (target && !(target as HTMLElement).hidden) {
						observer.disconnect();
						requestAnimationFrame(() => resolve(performance.now() - (state.__start ?? 0)));
					}
				});
				if (target) observer.observe(target, { attributes: true, attributeFilter: ["hidden"] });
			});
			quiz?.addEventListener("pointerdown", () => (state.__start = performance.now()), { capture: true, once: true });
		});
		await page.getByRole("button", { name: "測試選項乙" }).click();
		samples.push(await page.evaluate(() => (window as unknown as { __latency: Promise<number> }).__latency));
	}
	const sorted = [...samples].sort((a, b) => a - b);
	const pick = (p: number) => sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)] ?? NaN;
	const result = { project: testInfo.project.name, samples: SAMPLES, p50: pick(0.5), p95: pick(0.95), raw: samples };
	mkdirSync("test-results", { recursive: true });
	writeFileSync(`test-results/quiz-latency-${testInfo.project.name}.json`, JSON.stringify(result, null, 2));
	console.log(`quiz latency (${testInfo.project.name}): p50 ${result.p50.toFixed(1)} ms, p95 ${result.p95.toFixed(1)} ms`);
	expect(result.p95).toBeLessThanOrEqual(100);
});
