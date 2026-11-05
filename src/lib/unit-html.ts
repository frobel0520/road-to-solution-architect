// 單元本文的建置期後處理：架構圖內嵌成 SVG、決策題插在「決策題」段落下。
// 輸入是 Astro 由本 repo 內容轉出的 HTML（可信來源）；題目文字一律跳脫。
import type { Quiz } from "./content-schema.ts";
import { escapeHtml, unescapeHtml } from "./html.ts";

export const QUIZ_HEADING = "決策題";

const IMAGE_PARAGRAPH = /<p>\s*<img __ASTRO_IMAGE_="([^"]*)">\s*<\/p>/g;

export interface DiagramRef {
	src: string;
	alt: string;
}

export function findDiagrams(html: string): DiagramRef[] {
	return [...html.matchAll(IMAGE_PARAGRAPH)].map((match) => parseImage(match[1] ?? ""));
}

function parseImage(encoded: string): DiagramRef {
	const data = JSON.parse(unescapeHtml(encoded)) as { src?: unknown; alt?: unknown };
	return { src: String(data.src ?? ""), alt: String(data.alt ?? "") };
}

/** 把圖片段落換成內嵌 SVG＋圖說。readSvg 由呼叫端注入（建置時讀檔，測試時給假資料）。 */
export function inlineDiagrams(html: string, readSvg: (src: string) => string): string {
	return html.replace(IMAGE_PARAGRAPH, (_, encoded: string) => {
		const { src, alt } = parseImage(encoded);
		const svg = readSvg(src).trim().replace(/^<svg\b/, `<svg role="img" aria-label="${escapeHtml(alt)}"`);
		return `<figure class="diagram">${svg}<figcaption>${escapeHtml(alt)}</figcaption></figure>`;
	});
}

export function renderQuizHtml(unitId: string, quizzes: Quiz[]): string {
	return quizzes
		.map((quiz, index) => {
			const options = quiz.options
				.map(
					(option) => `<li class="quiz-option" data-option-id="${escapeHtml(option.id)}" data-correct="${option.correct}">
<button type="button" class="quiz-choice" aria-pressed="false">${escapeHtml(option.text)}</button>
<p class="quiz-explanation" hidden><strong class="quiz-verdict">${option.correct ? "最佳答案" : "不是最佳答案"}</strong>${escapeHtml(option.explanation)}</p>
</li>`,
				)
				.join("\n");
			return `<section class="quiz" data-unit-id="${escapeHtml(unitId)}" data-quiz-id="${escapeHtml(quiz.id)}" aria-labelledby="${escapeHtml(quiz.id)}-title">
<h3 id="${escapeHtml(quiz.id)}-title">第 ${index + 1} 題</h3>
<p class="quiz-scenario">${escapeHtml(quiz.scenario)}</p>
<ol class="quiz-options" type="A">
${options}
</ol>
<p class="quiz-status" role="status"></p>
</section>`;
		})
		.join("\n");
}

/** 決策題插在「決策題」標題後面；找不到標題就丟錯，讓建置失敗（內容驗證也會先擋）。 */
export function insertQuiz(html: string, quizHtml: string): string {
	const heading = new RegExp(`(<h2 id="[^"]*">${QUIZ_HEADING}</h2>)`);
	if (!heading.test(html)) throw new Error(`本文缺少「${QUIZ_HEADING}」段落`);
	return html.replace(heading, `$1\n${quizHtml}`);
}

export function sectionHeadings(html: string): string[] {
	return [...html.matchAll(/<h2 id="[^"]*">([^<]*)<\/h2>/g)].map((match) => unescapeHtml(match[1] ?? "").trim());
}
