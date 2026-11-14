// 速查表頁：一鍵複製 Markdown 範本。
for (const card of document.querySelectorAll<HTMLElement>("[data-template]")) {
	const source = card.querySelector<HTMLElement>("[data-template-source]");
	const status = card.querySelector<HTMLElement>("[data-copy-status]");
	card.querySelector("[data-copy]")?.addEventListener("click", async () => {
		try {
			await navigator.clipboard.writeText(source?.textContent?.trim() ?? "");
			if (status) status.textContent = "已複製";
		} catch {
			if (status) status.textContent = "無法自動複製，請手動選取內容";
		}
	});
}
