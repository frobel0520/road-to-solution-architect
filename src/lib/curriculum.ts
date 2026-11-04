// 從 docs/curriculum.md 第 5 節讀出課綱（模組與單元）。課綱只有這一個來源，網站與內容驗證都用這裡的結果。

export interface CurriculumUnit {
	id: string;
	module: number;
	order: number;
	title: string;
	objective: string;
}

export interface CurriculumModule {
	number: number;
	id: string;
	title: string;
	portfolio: string | null;
	units: CurriculumUnit[];
}

const MODULE_HEADING = /^### 模組 (\d+)\s+(.+)$/;
const UNIT_ROW = /^\|\s*(m(\d{2})-u(\d{2}))\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/;
const PORTFOLIO = /^作品集產出：(.+)$/;

export function parseCurriculum(markdown: string): CurriculumModule[] {
	const lines = markdown.split(/\r?\n/);
	const start = lines.findIndex((line) => line.startsWith("## 5."));
	if (start === -1) throw new Error("curriculum.md 找不到第 5 節（課綱）");
	const modules: CurriculumModule[] = [];
	let current: CurriculumModule | null = null;

	for (const line of lines.slice(start + 1)) {
		if (line.startsWith("## ")) break;
		const heading = MODULE_HEADING.exec(line);
		if (heading) {
			const number = Number(heading[1]);
			current = { number, id: `m${String(number).padStart(2, "0")}`, title: (heading[2] ?? "").trim(), portfolio: null, units: [] };
			modules.push(current);
			continue;
		}
		if (!current) continue;
		const portfolio = PORTFOLIO.exec(line.trim());
		if (portfolio) {
			current.portfolio = (portfolio[1] ?? "").trim();
			continue;
		}
		const row = UNIT_ROW.exec(line.trim());
		if (row) {
			const module = Number(row[2]);
			if (module !== current.number) throw new Error(`${row[1]} 寫在模組 ${current.number} 底下`);
			current.units.push({ id: row[1] ?? "", module, order: Number(row[3]), title: row[4] ?? "", objective: row[5] ?? "" });
		}
	}
	if (modules.length === 0) throw new Error("curriculum.md 第 5 節沒有任何模組");
	return modules;
}

export function allUnits(modules: CurriculumModule[]): CurriculumUnit[] {
	return modules.flatMap((module) => module.units);
}
