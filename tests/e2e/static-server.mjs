// E2E 用的靜態伺服器：模擬 Cloudflare static assets，套用 public/_headers（含 CSP），讓測試能抓到 CSP 違規。
// 用法：node tests/e2e/static-server.mjs <目錄> <port>
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "dist-fixture");
const port = Number(process.argv[3] ?? 4321);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json" };

function parseHeaders(text) {
	const rules = [];
	let current = null;
	for (const line of text.split(/\r?\n/)) {
		if (line.trim() === "" || line.trim().startsWith("#")) continue;
		if (!/^\s/.test(line)) {
			current = { pattern: line.trim(), headers: {} };
			rules.push(current);
		} else if (current) {
			const index = line.indexOf(":");
			current.headers[line.slice(0, index).trim()] = line.slice(index + 1).trim();
		}
	}
	return rules;
}

const rules = existsSync(join(root, "_headers")) ? parseHeaders(readFileSync(join(root, "_headers"), "utf8")) : [];
const matches = (pattern, path) => (pattern.endsWith("*") ? path.startsWith(pattern.slice(0, -1)) : pattern === path);

createServer((request, response) => {
	const path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
	let file = normalize(join(root, path));
	if (!file.startsWith(root)) {
		response.writeHead(400).end();
		return;
	}
	if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
	let status = 200;
	if (!existsSync(file)) {
		status = 404;
		file = join(root, "404.html");
	}
	const headers = { "Content-Type": types[extname(file)] ?? "application/octet-stream" };
	for (const rule of rules) if (matches(rule.pattern, path)) Object.assign(headers, rule.headers);
	response.writeHead(status, headers);
	createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
