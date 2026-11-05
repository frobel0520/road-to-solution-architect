import { describe, expect, it } from "vitest";
import { findDiagrams, inlineDiagrams, insertQuiz, renderQuizHtml, sectionHeadings } from "../../src/lib/unit-html.ts";

// Astro 轉出的圖片佔位格式（content layer 的 rendered.html）。
const image = (src: string, alt: string) =>
	`<p><img __ASTRO_IMAGE_="${JSON.stringify({ alt, src, index: 0 }).replace(/"/g, "&quot;")}"></p>`;

describe("架構圖內嵌", () => {
	const html = `<h2 id="架構圖">架構圖</h2>\n${image("./a.svg", "會員 <平台> 脈絡")}`;

	it("找出引用的 SVG 與說明", () => {
		expect(findDiagrams(html)).toEqual([{ src: "./a.svg", alt: "會員 <平台> 脈絡" }]);
	});

	it("換成內嵌 SVG 與圖說，說明文字會跳脫", () => {
		const result = inlineDiagrams(html, () => '<svg viewBox="0 0 1 1"><title>t</title></svg>');
		expect(result).toContain('<figure class="diagram"><svg role="img" aria-label="會員 &lt;平台&gt; 脈絡" viewBox="0 0 1 1">');
		expect(result).toContain("<figcaption>會員 &lt;平台&gt; 脈絡</figcaption>");
		expect(result).not.toContain("__ASTRO_IMAGE_");
	});
});

describe("決策題", () => {
	const quiz = [
		{
			id: "q1",
			scenario: "選 <b>A</b> 還是 B？",
			options: [
				{ id: "a", text: "A & B", correct: true, explanation: "因為 <script>x</script>" },
				{ id: "b", text: "B", correct: false, explanation: "不是" },
				{ id: "c", text: "C", correct: false, explanation: "也不是" },
			],
		},
	];

	it("題目文字一律跳脫，解析預設隱藏", () => {
		const html = renderQuizHtml("m00-u01", quiz);
		expect(html).toContain("選 &lt;b&gt;A&lt;/b&gt; 還是 B？");
		expect(html).toContain("A &amp; B");
		expect(html).not.toContain("<script>");
		expect(html.match(/class="quiz-explanation" hidden/g)).toHaveLength(3);
		expect(html).toContain('data-unit-id="m00-u01" data-quiz-id="q1"');
	});

	it("插在「決策題」標題後面", () => {
		const body = '<h2 id="取捨">取捨</h2>\n<h2 id="決策題">決策題</h2>\n<h2 id="交給-ai-時要注意">交給 AI 時要注意</h2>';
		const result = insertQuiz(body, "<section>Q</section>");
		expect(result).toBe('<h2 id="取捨">取捨</h2>\n<h2 id="決策題">決策題</h2>\n<section>Q</section>\n<h2 id="交給-ai-時要注意">交給 AI 時要注意</h2>');
		expect(sectionHeadings(result)).toEqual(["取捨", "決策題", "交給 AI 時要注意"]);
	});

	it("找不到標題時丟錯", () => {
		expect(() => insertQuiz("<h2 id=\"x\">x</h2>", "")).toThrow("決策題");
	});
});
