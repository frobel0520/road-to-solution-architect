// 學習進度的資料格式與純函式（docs/03-system-design.md 第 5 節）。不碰 DOM 與 storage，時間由呼叫端傳入。

export const SCHEMA_VERSION = 1;

export interface QuizAnswer {
	optionId: string;
	answeredAt: string;
}

export interface UnitProgress {
	completedAt: string | null;
	quizAnswers: Record<string, QuizAnswer>;
	updatedAt: string;
}

export interface Progress {
	schemaVersion: typeof SCHEMA_VERSION;
	units: Record<string, UnitProgress>;
	lastVisitedUnitId: string | null;
	/** 還沒有任何紀錄時為 null。 */
	updatedAt: string | null;
}

export type ParseResult =
	| { status: "empty" }
	| { status: "ok"; progress: Progress }
	| { status: "invalid"; reason: string };

const UNIT_ID = /^m\d{2}-u\d{2}$/;
const QUIZ_ID = /^q\d+$/;
const OPTION_ID = /^[a-d]$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

/** 舊版本 → 下一版的轉換。key 是來源版本；目前只有第 1 版，沒有轉換。 */
const MIGRATIONS: Record<number, (value: Record<string, unknown>) => Record<string, unknown>> = {};

export function createEmptyProgress(): Progress {
	return { schemaVersion: SCHEMA_VERSION, units: {}, lastVisitedUnitId: null, updatedAt: null };
}

export function parse(raw: string | null): ParseResult {
	if (raw === null || raw === "") return { status: "empty" };
	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		return { status: "invalid", reason: "不是有效的 JSON" };
	}
	const migrated = migrate(value);
	if (typeof migrated === "string") return { status: "invalid", reason: migrated };
	const progress = validate(migrated);
	return progress ? { status: "ok", progress } : { status: "invalid", reason: "格式不符" };
}

/** 依 schemaVersion 逐版升級。失敗時回傳原因字串。 */
export function migrate(value: unknown): Record<string, unknown> | string {
	if (!isRecord(value)) return "不是物件";
	let current = value;
	let version = current.schemaVersion;
	if (typeof version !== "number" || !Number.isInteger(version) || version < 1) return "無法辨識的版本";
	while (version < SCHEMA_VERSION) {
		const step = MIGRATIONS[version];
		if (!step) return `缺少第 ${version} 版的升級方式`;
		current = step(current);
		version = current.schemaVersion;
		if (typeof version !== "number") return "升級後版本無效";
	}
	if (version > SCHEMA_VERSION) return `版本 ${version} 比網站支援的版本新`;
	return current;
}

/** 嚴格檢查並重建物件：只保留認得的欄位，任何欄位不合格就整份視為無效。 */
export function validate(value: unknown): Progress | null {
	if (!isRecord(value) || value.schemaVersion !== SCHEMA_VERSION) return null;
	if (!isRecord(value.units)) return null;
	const lastVisited = value.lastVisitedUnitId;
	if (lastVisited !== null && !(typeof lastVisited === "string" && UNIT_ID.test(lastVisited))) return null;
	const updatedAt = value.updatedAt;
	if (updatedAt !== null && !isTimestamp(updatedAt)) return null;

	const units: Record<string, UnitProgress> = {};
	for (const [unitId, entry] of Object.entries(value.units)) {
		if (!UNIT_ID.test(unitId)) return null;
		const unit = validateUnit(entry);
		if (!unit) return null;
		units[unitId] = unit;
	}
	return { schemaVersion: SCHEMA_VERSION, units, lastVisitedUnitId: lastVisited, updatedAt };
}

function validateUnit(value: unknown): UnitProgress | null {
	if (!isRecord(value) || !isRecord(value.quizAnswers) || !isTimestamp(value.updatedAt)) return null;
	const completedAt = value.completedAt;
	if (completedAt !== null && !isTimestamp(completedAt)) return null;
	const quizAnswers: Record<string, QuizAnswer> = {};
	for (const [quizId, answer] of Object.entries(value.quizAnswers)) {
		if (!QUIZ_ID.test(quizId) || !isRecord(answer)) return null;
		const { optionId, answeredAt } = answer;
		if (typeof optionId !== "string" || !OPTION_ID.test(optionId) || !isTimestamp(answeredAt)) return null;
		quizAnswers[quizId] = { optionId, answeredAt };
	}
	return { completedAt, quizAnswers, updatedAt: value.updatedAt };
}

export function markComplete(progress: Progress, unitId: string, now: Date): Progress {
	const at = now.toISOString();
	return withUnit(progress, unitId, at, (unit) => ({ ...unit, completedAt: unit.completedAt ?? at }));
}

export function markIncomplete(progress: Progress, unitId: string, now: Date): Progress {
	return withUnit(progress, unitId, now.toISOString(), (unit) => ({ ...unit, completedAt: null }));
}

export function recordAnswer(progress: Progress, unitId: string, quizId: string, optionId: string, now: Date): Progress {
	if (!QUIZ_ID.test(quizId) || !OPTION_ID.test(optionId)) throw new Error(`無效的作答：${quizId}／${optionId}`);
	const at = now.toISOString();
	return withUnit(progress, unitId, at, (unit) => ({
		...unit,
		quizAnswers: { ...unit.quizAnswers, [quizId]: { optionId, answeredAt: at } },
	}));
}

export function visitUnit(progress: Progress, unitId: string, now: Date): Progress {
	assertUnitId(unitId);
	return { ...progress, lastVisitedUnitId: unitId, updatedAt: now.toISOString() };
}

/** 逐單元合併，updatedAt 較新的勝出；時間相同時保留 local。第二階段同步用。 */
export function merge(local: Progress, remote: Progress): Progress {
	const units: Record<string, UnitProgress> = { ...local.units };
	for (const [unitId, remoteUnit] of Object.entries(remote.units)) {
		const localUnit = units[unitId];
		if (!localUnit || remoteUnit.updatedAt > localUnit.updatedAt) units[unitId] = remoteUnit;
	}
	const remoteNewer = remote.updatedAt !== null && (local.updatedAt === null || remote.updatedAt > local.updatedAt);
	return {
		schemaVersion: SCHEMA_VERSION,
		units,
		lastVisitedUnitId: remoteNewer ? remote.lastVisitedUnitId : local.lastVisitedUnitId,
		updatedAt: remoteNewer ? remote.updatedAt : local.updatedAt,
	};
}

export function isComplete(progress: Progress, unitId: string): boolean {
	return Boolean(progress.units[unitId]?.completedAt);
}

function withUnit(progress: Progress, unitId: string, at: string, change: (unit: UnitProgress) => UnitProgress): Progress {
	assertUnitId(unitId);
	const existing = progress.units[unitId] ?? { completedAt: null, quizAnswers: {}, updatedAt: at };
	return {
		...progress,
		units: { ...progress.units, [unitId]: { ...change(existing), updatedAt: at } },
		updatedAt: at,
	};
}

function assertUnitId(unitId: string): void {
	if (!UNIT_ID.test(unitId)) throw new Error(`無效的單元 id：${unitId}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is string {
	return typeof value === "string" && ISO_TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value));
}
