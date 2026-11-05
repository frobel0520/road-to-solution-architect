import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { moduleSchema, templateSchema, unitSchema } from "./lib/content-schema.ts";
import { contentDir } from "./lib/paths.ts";

const units = defineCollection({
	loader: glob({ base: `${contentDir}/modules`, pattern: "**/m[0-9][0-9]-u[0-9][0-9].md", generateId: ({ data }) => String(data.id) }),
	schema: unitSchema,
});

const modules = defineCollection({
	loader: glob({ base: `${contentDir}/modules`, pattern: "**/module.yaml", generateId: ({ data }) => String(data.id) }),
	schema: moduleSchema,
});

const templates = defineCollection({
	loader: glob({ base: `${contentDir}/templates`, pattern: "*.md" }),
	schema: templateSchema,
});

const pages = defineCollection({
	loader: glob({ base: contentDir, pattern: "case.md" }),
});

export const collections = { units, modules, templates, pages };
