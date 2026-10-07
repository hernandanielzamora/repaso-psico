import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve("out");
const port = Number(process.env.PORT || process.argv[2] || 3000);
const host = process.env.HOST || "127.0.0.1";
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8" };

try { await stat(resolve(root, "index.html")); }
catch { console.error("Primero ejecutá npm run build para generar out/."); process.exit(1); }

createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }); response.end(); return;
  }
  let path;
  try { path = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { response.writeHead(400); response.end(); return; }
  const file = resolve(root, `.${path === "/" ? "/index.html" : path}`);
  if (!file.startsWith(root + sep)) { response.writeHead(403); response.end(); return; }
  try {
    const content = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch { response.writeHead(404); response.end("No encontrado"); }
}).listen(port, host, () => console.log(`Núcleo: http://${host}:${port}`));
