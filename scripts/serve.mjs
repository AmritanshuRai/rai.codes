import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname } from "node:path";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};
export function createPreviewServer() {
  return createServer(async (req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }
    try {
      let pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname
      );
      if (pathname === "/main" || pathname === "/main/")
        pathname = "/index.html";
      if (pathname.endsWith("/")) pathname += "index.html";
      const file = resolve(root, "." + pathname);
      if (!file.startsWith(root)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const info = await stat(file);
      if (!info.isFile())
        throw Object.assign(new Error("Not found"), { code: "ENOENT" });
      const data = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Content-Length": data.length,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch (error) {
      if (error instanceof URIError) {
        res.writeHead(400);
        res.end(req.method === "HEAD" ? undefined : "Bad request");
        return;
      }
      if (!["ENOENT", "ENOTDIR"].includes(error.code)) {
        console.error(error);
        res.writeHead(500);
        res.end(req.method === "HEAD" ? undefined : "Internal server error");
        return;
      }
      const body = await readFile(resolve(root, "404.html"));
      res.writeHead(404, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    }
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 8001);
  createPreviewServer().listen(port, "127.0.0.1", () =>
    console.log(`Portfolio: http://127.0.0.1:${port}`)
  );
}
