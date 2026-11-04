// 畫面共用：開啟進度 store，在無法儲存或資料損壞時顯示提示。
// storage 讀出的值只當資料用：一律用 textContent／屬性設定，不插入成 HTML。
import type { Progress } from "../progress/model.ts";
import { browserStorage, ProgressStore, type LoadState } from "../progress/storage.ts";

export interface ProgressSession {
	store: ProgressStore;
	state: LoadState;
	/** 存檔；失敗時顯示提示並回傳 false。 */
	save(progress: Progress): boolean;
}

export type ReadyHandler = (progress: Progress, session: ProgressSession) => void;

export function openProgress(onReady: ReadyHandler): ProgressSession {
	const store = new ProgressStore(browserStorage());
	const session: ProgressSession = {
		store,
		state: store.load(),
		save(progress) {
			if (store.save(progress)) {
				session.state = { status: "ready", progress };
				return true;
			}
			session.state = { status: "unavailable" };
			renderBanner(session, onReady);
			return false;
		},
	};
	renderBanner(session, onReady);
	if (session.state.status === "ready") onReady(session.state.progress, session);
	return session;
}

function renderBanner(session: ProgressSession, onReady: ReadyHandler): void {
	const banner = document.getElementById("progress-banner");
	if (!banner) return;
	banner.replaceChildren();
	const { state } = session;
	if (state.status === "ready") {
		banner.hidden = true;
		return;
	}
	banner.hidden = false;
	if (state.status === "unavailable") {
		banner.append(paragraph("這個瀏覽器無法儲存進度（可能是無痕模式、儲存空間已滿或被封鎖）。課程仍可以閱讀，但完成狀態與作答不會保留。"));
		return;
	}
	banner.append(
		paragraph(
			state.backupKey
				? `這個瀏覽器裡的學習進度無法讀取，原資料已另存為「${state.backupKey}」。確認後會清除目前的進度並重新開始記錄。`
				: "這個瀏覽器裡的學習進度無法讀取，而且無法另存備份。確認後會清除目前的進度並重新開始記錄。",
		),
	);
	const button = document.createElement("button");
	button.type = "button";
	button.className = "button secondary";
	button.textContent = "清除並重新開始記錄";
	button.addEventListener("click", () => {
		session.state = session.store.reset();
		renderBanner(session, onReady);
		if (session.state.status === "ready") onReady(session.state.progress, session);
	});
	const actions = document.createElement("p");
	actions.append(button);
	banner.append(actions);
}

function paragraph(text: string): HTMLParagraphElement {
	const element = document.createElement("p");
	element.textContent = text;
	return element;
}
