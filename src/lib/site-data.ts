// 頁面共用的資料組合：課綱（全部規劃）＋內容集合（已上線）。
import { getCollection, type CollectionEntry } from "astro:content";
import { curriculum } from "./curriculum-data.ts";
import type { CurriculumModule, CurriculumUnit } from "./curriculum.ts";

export interface ModuleView extends CurriculumModule {
	summary: string | null;
	units: (CurriculumUnit & { entry: CollectionEntry<"units"> | null })[];
	publishedIds: string[];
}

export async function loadModules(): Promise<ModuleView[]> {
	const [units, metas] = await Promise.all([getCollection("units"), getCollection("modules")]);
	const byId = new Map(units.map((entry) => [entry.data.id, entry]));
	return curriculum.map((module) => {
		const meta = metas.find((entry) => entry.data.number === module.number);
		const moduleUnits = module.units.map((unit) => ({ ...unit, entry: byId.get(unit.id) ?? null }));
		return {
			...module,
			summary: meta?.data.summary ?? null,
			units: moduleUnits,
			publishedIds: moduleUnits.filter((unit) => unit.entry).map((unit) => unit.id),
		};
	});
}

export function moduleLabel(number: number): string {
	return `模組 ${number}`;
}
