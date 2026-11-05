import { describe, expect, it } from "vitest";
import {
	createEmptyProgress,
	isComplete,
	markComplete,
	markIncomplete,
	merge,
	migrate,
	parse,
	recordAnswer,
	SCHEMA_VERSION,
	validate,
	visitUnit,
	type Progress,
} from "../../src/progress/model.ts";

const T1 = new Date("2026-11-04T09:58:00.000Z");
const T2 = new Date("2026-11-04T10:00:00.000Z");
const T3 = new Date("2026-11-05T08:00:00.000Z");

const docExample = {
	schemaVersion: 1,
	units: {
		"m01-u03": {
			completedAt: "2026-11-04T10:00:00.000Z",
			quizAnswers: { q1: { optionId: "b", answeredAt: "2026-11-04T09:58:00.000Z" } },
			updatedAt: "2026-11-04T10:00:00.000Z",
		},
	},
	lastVisitedUnitId: "m01-u03",
	updatedAt: "2026-11-04T10:00:00.000Z",
};

describe("parse", () => {
	it("沒有資料時回傳 empty", () => {
		expect(parse(null)).toEqual({ status: "empty" });
		expect(parse("")).toEqual({ status: "empty" });
	});

	it("接受 docs/03 第 5.1 節的範例", () => {
		const result = parse(JSON.stringify(docExample));
		expect(result).toEqual({ status: "ok", progress: docExample });
	});

	it.each([
		["不是 JSON", "{oops"],
		["陣列", "[]"],
		["沒有版本", JSON.stringify({ units: {} })],
		["版本比網站新", JSON.stringify({ ...docExample, schemaVersion: SCHEMA_VERSION + 1 })],
		["版本不是整數", JSON.stringify({ ...docExample, schemaVersion: "1" })],
		["單元 id 格式錯誤", JSON.stringify({ ...docExample, units: { "<img>": docExample.units["m01-u03"] } })],
		["時間格式錯誤", JSON.stringify({ ...docExample, updatedAt: "昨天" })],
		["不存在的日期", JSON.stringify({ ...docExample, updatedAt: "2026-13-45T00:00:00.000Z" })],
		["選項 id 是 HTML", JSON.stringify(withAnswer("<script>"))],
		["lastVisitedUnitId 是網址", JSON.stringify({ ...docExample, lastVisitedUnitId: "https://example.com" })],
		["completedAt 省略", JSON.stringify(withoutCompletedAt())],
	])("%s → invalid", (_, raw) => {
		expect(parse(raw).status).toBe("invalid");
	});

	it("丟掉不認得的欄位", () => {
		const result = parse(JSON.stringify({ ...docExample, extra: "x" }));
		expect(result.status).toBe("ok");
		expect(result.status === "ok" && "extra" in result.progress).toBe(false);
	});
});

describe("migrate", () => {
	it("目前版本原樣通過", () => {
		expect(migrate(docExample)).toEqual(docExample);
	});

	it("缺少升級方式時回報原因", () => {
		expect(migrate({ ...docExample, schemaVersion: 0 })).toBe("無法辨識的版本");
	});
});

describe("進度操作", () => {
	it("完成單元會記錄時間，再按一次不改完成時間", () => {
		const first = markComplete(createEmptyProgress(), "m00-u01", T1);
		const second = markComplete(first, "m00-u01", T2);
		expect(second.units["m00-u01"]).toEqual({ completedAt: T1.toISOString(), quizAnswers: {}, updatedAt: T2.toISOString() });
		expect(second.updatedAt).toBe(T2.toISOString());
		expect(isComplete(second, "m00-u01")).toBe(true);
	});

	it("可以取消完成，completedAt 改為 null 而不是刪掉", () => {
		const progress = markIncomplete(markComplete(createEmptyProgress(), "m00-u01", T1), "m00-u01", T2);
		expect(progress.units["m00-u01"]?.completedAt).toBeNull();
		expect(isComplete(progress, "m00-u01")).toBe(false);
	});

	it("作答不等於完成單元", () => {
		const progress = recordAnswer(createEmptyProgress(), "m00-u01", "q1", "b", T1);
		expect(progress.units["m00-u01"]?.quizAnswers.q1).toEqual({ optionId: "b", answeredAt: T1.toISOString() });
		expect(isComplete(progress, "m00-u01")).toBe(false);
	});

	it("改答案會覆蓋舊答案", () => {
		const first = recordAnswer(createEmptyProgress(), "m00-u01", "q1", "a", T1);
		const second = recordAnswer(first, "m00-u01", "q1", "c", T2);
		expect(second.units["m00-u01"]?.quizAnswers.q1?.optionId).toBe("c");
	});

	it("拒絕無效的 id，避免寫入讀不回來的資料", () => {
		expect(() => markComplete(createEmptyProgress(), "m0-u1", T1)).toThrow();
		expect(() => recordAnswer(createEmptyProgress(), "m00-u01", "q1", "z", T1)).toThrow();
		expect(() => visitUnit(createEmptyProgress(), "../x", T1)).toThrow();
	});

	it("不修改傳入的物件", () => {
		const original = createEmptyProgress();
		markComplete(original, "m00-u01", T1);
		expect(original).toEqual(createEmptyProgress());
	});

	it("操作後的結果可以存檔再讀回來", () => {
		let progress = visitUnit(createEmptyProgress(), "m00-u02", T1);
		progress = recordAnswer(progress, "m00-u02", "q2", "d", T2);
		progress = markComplete(progress, "m00-u02", T2);
		expect(parse(JSON.stringify(progress))).toEqual({ status: "ok", progress });
	});
});

describe("merge", () => {
	const local = markComplete(createEmptyProgress(), "m00-u01", T1);
	const remote = visitUnit(recordAnswer(createEmptyProgress(), "m00-u01", "q1", "a", T3), "m00-u01", T3);

	it("同一個單元以 updatedAt 較新的為準", () => {
		const merged = merge(local, remote);
		expect(merged.units["m00-u01"]).toEqual(remote.units["m00-u01"]);
		expect(merged.lastVisitedUnitId).toBe("m00-u01");
		expect(merged.updatedAt).toBe(T3.toISOString());
	});

	it("只在一邊出現的單元都保留", () => {
		const other = markComplete(createEmptyProgress(), "m01-u01", T2);
		const merged = merge(local, other);
		expect(Object.keys(merged.units).sort()).toEqual(["m00-u01", "m01-u01"]);
	});

	it("時間相同時保留 local", () => {
		const a = markComplete(createEmptyProgress(), "m00-u01", T2);
		const b = markIncomplete(createEmptyProgress(), "m00-u01", T2);
		expect(merge(a, b).units["m00-u01"]).toEqual(a.units["m00-u01"]);
	});

	it("和空進度合併不改變內容", () => {
		expect(merge(local, createEmptyProgress())).toEqual(local);
		expect(merge(createEmptyProgress(), local)).toEqual(local);
	});
});

describe("validate", () => {
	it("updatedAt 為 null 的空進度是合法的", () => {
		expect(validate(createEmptyProgress())).toEqual(createEmptyProgress());
	});

	it("毫秒可省略，時區必須是 Z", () => {
		const progress: Progress = { ...createEmptyProgress(), updatedAt: "2026-11-04T10:00:00Z" };
		expect(validate(progress)).not.toBeNull();
		expect(validate({ ...progress, updatedAt: "2026-11-04T10:00:00+08:00" })).toBeNull();
	});
});

function withAnswer(optionId: string) {
	return {
		...docExample,
		units: { "m01-u03": { ...docExample.units["m01-u03"], quizAnswers: { q1: { optionId, answeredAt: "2026-11-04T09:58:00.000Z" } } } },
	};
}

function withoutCompletedAt() {
	const { completedAt: _omit, ...unit } = docExample.units["m01-u03"];
	return { ...docExample, units: { "m01-u03": unit } };
}
