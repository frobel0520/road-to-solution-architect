// 進度的 storage adapter。第一階段是 localStorage；第二階段新增同步 adapter，畫面程式不用改。
import { createEmptyProgress, parse, type Progress } from "./model.ts";

export const STORAGE_KEY = "rtsa-progress-v2";
/** CR-001 改版前的進度（原 SA 課程，id 已由新課綱重新使用），載入時刪除。 */
export const LEGACY_KEYS = ["rtsa-progress"] as const;
export const BACKUP_PREFIX = "rtsa-progress-backup-";
const LAST_BACKUP_KEY = "rtsa-progress-last-backup";

/** Web Storage 的最小子集，方便測試注入。 */
export interface KeyValueStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

export type LoadState =
	| { status: "ready"; progress: Progress }
	/** 無痕模式、被封鎖或容量已滿：課程仍可閱讀，但不能儲存。 */
	| { status: "unavailable" }
	/** 既有資料無法辨識：原資料已另存備份（backupKey），使用者確認後才重新開始。 */
	| { status: "corrupt"; reason: string; backupKey: string | null };

export class ProgressStore {
	readonly #storage: KeyValueStorage | null;
	readonly #clock: () => Date;

	constructor(storage: KeyValueStorage | null, clock: () => Date = () => new Date()) {
		this.#storage = storage;
		this.#clock = clock;
	}

	load(): LoadState {
		const storage = this.#storage;
		if (!storage || !isWritable(storage)) return { status: "unavailable" };
		removeLegacy(storage);
		let raw: string | null;
		try {
			raw = storage.getItem(STORAGE_KEY);
		} catch {
			return { status: "unavailable" };
		}
		const result = parse(raw);
		if (result.status === "empty") return { status: "ready", progress: createEmptyProgress() };
		if (result.status === "ok") return { status: "ready", progress: result.progress };
		return { status: "corrupt", reason: result.reason, backupKey: this.#backup(storage, raw ?? "") };
	}

	/** 寫入成功回傳 true；失敗（例如容量已滿）回傳 false，由畫面提示，不默默失敗。 */
	save(progress: Progress): boolean {
		if (!this.#storage) return false;
		try {
			this.#storage.setItem(STORAGE_KEY, JSON.stringify(progress));
			return true;
		} catch {
			return false;
		}
	}

	/** 使用者確認放棄無法辨識的資料後呼叫；備份不會被刪除。 */
	reset(): LoadState {
		const progress = createEmptyProgress();
		return this.save(progress) ? { status: "ready", progress } : { status: "unavailable" };
	}

	/** 同一份壞資料只備份一次：使用者確認前每次開頁面都會讀到它。 */
	#backup(storage: KeyValueStorage, raw: string): string | null {
		try {
			const previous = storage.getItem(LAST_BACKUP_KEY);
			if (previous && storage.getItem(previous) === raw) return previous;
			const key = `${BACKUP_PREFIX}${this.#clock().toISOString().replace(/[:.]/g, "-")}`;
			storage.setItem(key, raw);
			storage.setItem(LAST_BACKUP_KEY, key);
			return key;
		} catch {
			return null;
		}
	}
}

const PROBE_KEY = "rtsa-storage-probe";

/** 刪除失敗不影響新進度，所以吞掉錯誤；下次載入會再試。 */
function removeLegacy(storage: KeyValueStorage): void {
	for (const key of LEGACY_KEYS) {
		try {
			storage.removeItem(key);
		} catch {
			// 忽略：舊資料不會被讀取，只是暫時沒刪掉。
		}
	}
}

function isWritable(storage: KeyValueStorage): boolean {
	try {
		storage.setItem(PROBE_KEY, "1");
		storage.removeItem(PROBE_KEY);
		return true;
	} catch {
		return false;
	}
}

/** 瀏覽器端取得 localStorage；存取本身就可能丟錯（被封鎖），所以包在 try 裡。 */
export function browserStorage(): KeyValueStorage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}
