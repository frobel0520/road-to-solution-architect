const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

export function unescapeHtml(value: string): string {
	return value.replace(/&(amp|lt|gt|quot|#39);/g, (_, name: string) => {
		switch (name) {
			case "amp":
				return "&";
			case "lt":
				return "<";
			case "gt":
				return ">";
			case "quot":
				return '"';
			default:
				return "'";
		}
	});
}
