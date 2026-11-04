// 首頁與模組頁：標出已完成的單元、各模組完成數，以及「繼續上次閱讀」。
import { isComplete, type Progress } from "../progress/model.ts";
import { openProgress } from "./progress-client.ts";

openProgress(render);

function render(progress: Progress): void {
	for (const row of document.querySelectorAll<HTMLElement>("[data-unit-row]")) {
		const done = isComplete(progress, row.dataset.unitRow ?? "");
		row.dataset.complete = String(done);
		const label = row.querySelector<HTMLElement>("[data-complete-label]");
		if (label) {
			label.hidden = !done;
			label.textContent = done ? "已完成" : "";
		}
	}

	for (const summary of document.querySelectorAll<HTMLElement>("[data-progress-summary]")) {
		const ids = (summary.dataset.progressSummary ?? "").split(",").filter(Boolean);
		const done = ids.filter((id) => isComplete(progress, id)).length;
		summary.textContent = `已完成 ${done}／${ids.length} 個已上線單元`;
	}

	const resume = document.querySelector<HTMLAnchorElement>("#resume-link");
	const resumeBox = document.querySelector<HTMLElement>("#resume");
	const lastId = progress.lastVisitedUnitId;
	// 只接受本站已上線的單元，標題從頁面上已知的清單取，不用 storage 裡的字串組 HTML。
	const known = lastId ? document.querySelector<HTMLElement>(`[data-unit-row="${CSS.escape(lastId)}"] [data-unit-title]`) : null;
	if (resume && resumeBox && lastId && known) {
		resume.href = `/units/${lastId}/`;
		resume.textContent = known.textContent ?? lastId;
		resumeBox.hidden = false;
	}
}
