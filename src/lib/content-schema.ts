// 內容 schema：建置（content collections）與內容驗證腳本共用，規則見 docs/03-system-design.md 第 4 節。
import { z } from "astro/zod";

export const UNIT_ID_PATTERN = /^m(\d{2})-u(\d{2})$/;
export const MODULE_ID_PATTERN = /^m(\d{2})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const nonEmpty = z.string().trim().min(1);

export const quizOptionSchema = z.object({
	id: z.string().regex(/^[a-d]$/, "選項 id 必須是 a～d"),
	text: nonEmpty,
	correct: z.boolean(),
	explanation: nonEmpty,
});

export const quizSchema = z
	.object({
		id: z.string().regex(/^q\d+$/, "題目 id 格式為 q1、q2…"),
		scenario: nonEmpty,
		options: z.array(quizOptionSchema).min(3).max(4),
	})
	.superRefine((quiz, ctx) => {
		const correct = quiz.options.filter((option) => option.correct).length;
		if (correct !== 1) {
			ctx.addIssue({ code: "custom", message: `${quiz.id} 必須剛好一個正確選項，目前 ${correct} 個` });
		}
		const ids = quiz.options.map((option) => option.id);
		if (new Set(ids).size !== ids.length) {
			ctx.addIssue({ code: "custom", message: `${quiz.id} 的選項 id 重複` });
		}
	});

export const sourceSchema = z.object({
	title: nonEmpty,
	url: z.url({ protocol: /^https$/ }),
	// YAML 會把沒加引號的日期讀成 Date，這裡統一轉回 YYYY-MM-DD。
	checkedOn: z.preprocess(
		(value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
		z.string().regex(ISO_DATE, "checkedOn 格式為 YYYY-MM-DD"),
	),
});

export const unitSchema = z
	.object({
		id: z.string().regex(UNIT_ID_PATTERN, "id 格式為 m00-u01"),
		module: z.number().int().min(0).max(13),
		order: z.number().int().min(1),
		title: nonEmpty,
		minutes: z.number().int().min(10).max(15),
		objectives: z.array(nonEmpty).min(1).max(3),
		quiz: z.array(quizSchema).min(1).max(3),
		sources: z.array(sourceSchema).default([]),
		status: z.enum(["draft", "reviewed"]),
	})
	.superRefine((unit, ctx) => {
		const ids = unit.quiz.map((quiz) => quiz.id);
		if (new Set(ids).size !== ids.length) {
			ctx.addIssue({ code: "custom", message: "單元內的題目 id 重複" });
		}
		const match = UNIT_ID_PATTERN.exec(unit.id);
		if (match && (Number(match[1]) !== unit.module || Number(match[2]) !== unit.order)) {
			ctx.addIssue({ code: "custom", message: `id ${unit.id} 和 module／order（${unit.module}／${unit.order}）不一致` });
		}
	});

export const moduleSchema = z.object({
	id: z.string().regex(MODULE_ID_PATTERN, "模組 id 格式為 m00"),
	number: z.number().int().min(0).max(13),
	title: nonEmpty,
	summary: nonEmpty,
	portfolio: nonEmpty.optional(),
});

export const templateSchema = z.object({
	title: nonEmpty,
	module: z.number().int().min(0).max(13),
	summary: nonEmpty,
});

export type Unit = z.infer<typeof unitSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type ModuleMeta = z.infer<typeof moduleSchema>;
