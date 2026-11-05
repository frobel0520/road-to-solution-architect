// 單元頁：決策題作答、完成本單元、記錄上次閱讀位置。
import { isComplete, markComplete, markIncomplete, recordAnswer, visitUnit, type Progress } from "../progress/model.ts";
import { openProgress } from "./progress-client.ts";

const article = document.querySelector<HTMLElement>("[data-unit]");
const unitId = article?.dataset.unit ?? "";

if (article && unitId) {
	const completeButton = document.querySelector<HTMLButtonElement>("#complete-button");
	const completeStatus = document.querySelector<HTMLElement>("#complete-status");

	const session = openProgress((progress, current) => {
		showComplete(isComplete(progress, unitId));
		restoreAnswers(progress);
		current.save(visitUnit(progress, unitId, new Date()));
	});

	for (const quiz of document.querySelectorAll<HTMLElement>(".quiz")) {
		quiz.addEventListener("click", (event) => {
			const choice = (event.target as Element).closest<HTMLButtonElement>(".quiz-choice");
			const option = choice?.closest<HTMLElement>(".quiz-option");
			const optionId = option?.dataset.optionId;
			const quizId = quiz.dataset.quizId;
			if (!option || !optionId || !quizId) return;
			// 先更新畫面，再存檔：作答回饋不等 storage。
			revealAnswer(quiz, optionId);
			if (session.state.status === "ready") {
				session.save(recordAnswer(session.state.progress, unitId, quizId, optionId, new Date()));
			}
		});
	}

	completeButton?.addEventListener("click", () => {
		if (session.state.status !== "ready") {
			if (completeStatus) completeStatus.textContent = "這個瀏覽器無法儲存進度，完成狀態不會保留。";
			return;
		}
		const done = isComplete(session.state.progress, unitId);
		const next = done ? markIncomplete(session.state.progress, unitId, new Date()) : markComplete(session.state.progress, unitId, new Date());
		if (session.save(next)) showComplete(!done);
	});

	function showComplete(done: boolean): void {
		if (completeButton) {
			completeButton.textContent = done ? "標為未完成" : "完成本單元";
			completeButton.classList.toggle("secondary", done);
		}
		if (completeStatus) completeStatus.textContent = done ? "已完成本單元。" : "";
		article?.setAttribute("data-complete", String(done));
	}

	function restoreAnswers(progress: Progress): void {
		const answers = progress.units[unitId]?.quizAnswers ?? {};
		for (const quiz of document.querySelectorAll<HTMLElement>(".quiz")) {
			const answer = answers[quiz.dataset.quizId ?? ""];
			if (answer) revealAnswer(quiz, answer.optionId);
		}
	}
}

function revealAnswer(quiz: HTMLElement, optionId: string): void {
	let chosen: HTMLElement | null = null;
	for (const option of quiz.querySelectorAll<HTMLElement>(".quiz-option")) {
		const selected = option.dataset.optionId === optionId;
		if (selected) chosen = option;
		option.querySelector(".quiz-choice")?.setAttribute("aria-pressed", String(selected));
		const explanation = option.querySelector<HTMLElement>(".quiz-explanation");
		if (explanation) explanation.hidden = false;
	}
	if (!chosen) return;
	quiz.dataset.answered = "true";
	const status = quiz.querySelector<HTMLElement>(".quiz-status");
	if (status) status.textContent = chosen.dataset.correct === "true" ? "答對了，這是最佳答案。" : "這不是最佳答案，看看每個選項的解析。";
}
