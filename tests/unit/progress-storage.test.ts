import { describe, expect, it } from "vitest";
import { createEmptyProgress, markComplete } from "../../src/progress/model.ts";
import { BACKUP_PREFIX, LEGACY_KEYS, ProgressStore, STORAGE_KEY, type KeyValueStorage } from "../../src/progress/storage.ts";

const NOW = new Date("2026-11-04T10:00:00.000Z");
const clock = () => NOW;

class MemoryStorage implements KeyValueStorage {
	readonly data = new Map<string, string>();
	failWrites = false;
	getItem(key: string) {
		return this.data.get(key) ?? null;
	}
	setItem(key: string, value: string) {
		if (this.failWrites) throw new DOMException("quota", "QuotaExceededError");
		this.data.set(key, value);
	}
	removeItem(key: string) {
		this.data.delete(key);
	}
}

describe("ProgressStore", () => {
	it("沒有資料時從空進度開始", () => {
		expect(new ProgressStore(new MemoryStorage(), clock).load()).toEqual({ status: "ready", progress: createEmptyProgress() });
	});

	it("存檔後讀得回來", () => {
		const storage = new MemoryStorage();
		const store = new ProgressStore(storage, clock);
		const progress = markComplete(createEmptyProgress(), "m00-u01", NOW);
		expect(store.save(progress)).toBe(true);
		expect(new ProgressStore(storage, clock).load()).toEqual({ status: "ready", progress });
	});

	it("載入時刪除 CR-001 改版前的舊進度，不讀進新課綱", () => {
		const storage = new MemoryStorage();
		storage.data.set(LEGACY_KEYS[0], JSON.stringify(markComplete(createEmptyProgress(), "m00-u01", NOW)));
		expect(new ProgressStore(storage, clock).load()).toEqual({ status: "ready", progress: createEmptyProgress() });
		expect(storage.data.has(LEGACY_KEYS[0])).toBe(false);
		expect(STORAGE_KEY).not.toBe(LEGACY_KEYS[0]);
	});

	it("沒有 storage 時回報無法使用", () => {
		expect(new ProgressStore(null, clock).load()).toEqual({ status: "unavailable" });
	});

	it("storage 無法寫入（無痕模式、容量已滿）時回報無法使用", () => {
		const storage = new MemoryStorage();
		storage.failWrites = true;
		const store = new ProgressStore(storage, clock);
		expect(store.load()).toEqual({ status: "unavailable" });
		expect(store.save(createEmptyProgress())).toBe(false);
	});

	it("讀取本身丟錯時回報無法使用", () => {
		const storage = new MemoryStorage();
		storage.getItem = () => {
			throw new Error("blocked");
		};
		expect(new ProgressStore(storage, clock).load()).toEqual({ status: "unavailable" });
	});

	it("資料無法辨識時另存備份，不覆蓋原資料", () => {
		const storage = new MemoryStorage();
		storage.data.set(STORAGE_KEY, "{broken");
		const state = new ProgressStore(storage, clock).load();
		expect(state.status).toBe("corrupt");
		const backupKey = state.status === "corrupt" ? state.backupKey : null;
		expect(backupKey).toBe(`${BACKUP_PREFIX}2026-11-04T10-00-00-000Z`);
		expect(storage.data.get(backupKey ?? "")).toBe("{broken");
		expect(storage.data.get(STORAGE_KEY)).toBe("{broken");
	});

	it("同一份壞資料重開頁面不會重複備份", () => {
		const storage = new MemoryStorage();
		storage.data.set(STORAGE_KEY, "{broken");
		new ProgressStore(storage, clock).load();
		new ProgressStore(storage, () => new Date("2026-11-05T00:00:00.000Z")).load();
		const backups = [...storage.data.keys()].filter((key) => key.startsWith(BACKUP_PREFIX));
		expect(backups).toHaveLength(1);
	});

	it("使用者確認後重新開始，備份仍保留", () => {
		const storage = new MemoryStorage();
		storage.data.set(STORAGE_KEY, "{broken");
		const store = new ProgressStore(storage, clock);
		store.load();
		expect(store.reset()).toEqual({ status: "ready", progress: createEmptyProgress() });
		expect(storage.data.get(STORAGE_KEY)).toBe(JSON.stringify(createEmptyProgress()));
		expect([...storage.data.values()]).toContain("{broken");
	});
});
