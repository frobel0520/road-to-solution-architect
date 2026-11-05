import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allUnits, parseCurriculum } from "../../src/lib/curriculum.ts";

describe("parseCurriculum", () => {
	const modules = parseCurriculum(readFileSync("docs/curriculum.md", "utf8"));

	it("讀出 14 個模組、68 個單元，id 不重複", () => {
		const units = allUnits(modules);
		expect(modules).toHaveLength(14);
		expect(units).toHaveLength(68);
		expect(new Set(units.map((unit) => unit.id)).size).toBe(68);
	});

	it("讀出模組標題、作品集產出與單元", () => {
		expect(modules[0]).toMatchObject({ number: 0, id: "m00", title: "SA 導論", portfolio: "能力自評表" });
		expect(modules[3]?.portfolio).toBeNull();
		expect(modules[1]?.units[0]).toEqual({
			id: "m01-u01",
			module: 1,
			order: 1,
			title: "利害關係人與訪談：找出真正的問題",
			objective: "辨識利害關係人與目標，用訪談把「想要的功能」還原成要解決的問題",
		});
	});

	it("單元寫錯模組時丟錯", () => {
		const broken = "## 5. 課綱\n\n### 模組 0　導論\n\n| id | 單元 | 學習目標 |\n|---|---|---|\n| m01-u01 | 標題 | 目標 |\n";
		expect(() => parseCurriculum(broken)).toThrow("寫在模組 0");
	});

	it("找不到第 5 節時丟錯", () => {
		expect(() => parseCurriculum("# 空文件")).toThrow("第 5 節");
	});
});
