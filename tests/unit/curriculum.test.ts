import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allUnits, parseCurriculum } from "../../src/lib/curriculum.ts";

describe("parseCurriculum", () => {
	const modules = parseCurriculum(readFileSync("docs/curriculum.md", "utf8"));

	it("讀出 7 個模組、30 個單元，id 不重複", () => {
		const units = allUnits(modules);
		expect(modules).toHaveLength(7);
		expect(units).toHaveLength(30);
		expect(new Set(units.map((unit) => unit.id)).size).toBe(30);
	});

	it("讀出模組標題、作品集產出與單元", () => {
		expect(modules[0]).toMatchObject({ number: 0, id: "m00", title: "導論", portfolio: null });
		expect(modules[1]?.portfolio).toBe("網路基礎技術選擇速查表");
		expect(modules[1]?.units[0]).toEqual({
			id: "m01-u01",
			module: 1,
			order: 1,
			title: "IP、port 與封包：電腦怎麼找到彼此",
			objective: "說明 IP 位址、port 與封包各自的角色",
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
