// 建置時讀取課綱檔；只在 Astro 頁面（伺服端）使用。
import { readFileSync } from "node:fs";
import { parseCurriculum } from "./curriculum.ts";
import { curriculumPath } from "./paths.ts";

export const curriculum = parseCurriculum(readFileSync(curriculumPath, "utf8"));
