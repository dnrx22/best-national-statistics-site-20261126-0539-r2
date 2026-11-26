// StatistikNusa — static file server for the app/ directory.
// Node 22+, stdlib only, no network access. Serves app/index.html at /
// and only files that live under app/.
//
//   node main.ts            # serves on http://localhost:8080
//   PORT=3000 node main.ts  # serves on http://localhost:3000
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname: string = fileURLToPath(new URL(".", import.meta.url));
const APP_ROOT: string = resolve(__dirname, "app");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const PORT: number = Number(process.env.PORT ?? 8080) || 8080;

function isUnderApp(absPath: string): boolean {
  return absPath === APP_ROOT || absPath.startsWith(APP_ROOT + sep);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    let relPath: string = decodeURIComponent(url.pathname);
    if (relPath === "/") relPath = "/index.html";
    const absPath: string = resolve(join(APP_ROOT, normalize(relPath)));

    if (!isUnderApp(absPath)) {
      res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      res.end("Forbidden\n");
      return;
    }

    const body = await readFile(absPath);
    const type: string = MIME[extname(absPath).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(200, { "content-type": type });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found\n");
  }
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use — pick a free one, e.g. PORT=8123 node main.ts`,
    );
  } else {
    console.error(`Server error: ${err.message}`);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`StatistikNusa serving at http://localhost:${PORT}/`);
});
