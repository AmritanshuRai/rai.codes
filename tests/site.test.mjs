import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { createPreviewServer } from "../scripts/serve.mjs";
const root = new URL("../dist/", import.meta.url);

test("all directly referenced local assets exist", async () => {
  const files = await readdir(root, { recursive: true });
  for (const file of files.filter((name) =>
    /\.(html|css|js|webmanifest)$/.test(name)
  )) {
    const text = await readFile(new URL(file, root), "utf8");
    const refs = [
      ...text.matchAll(
        /(?:src|href)=["'](\/[^"'#?]+)|url\(["']?(\.\/[^)'"?#]+)/g
      ),
    ];
    for (const match of refs) {
      const asset = match[1]
        ? new URL("." + match[1], root)
        : new URL(match[2], new URL(file, root));
      await assert.doesNotReject(
        access(asset),
        `${file} references missing ${asset.pathname}`
      );
    }
  }
});
test("preview serves routes, MIME types, real 404s and rejects writes", async () => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of ["/", "/main", "/main/"]) {
      const r = await fetch(base + path);
      assert.equal(r.status, 200);
      assert.match(await r.text(), /Rai's Portfolio/);
    }
    for (const [path, type] of [
      ["/assets/app.js", "text/javascript"],
      ["/assets/styles.css", "text/css"],
      ["/assets/resume.pdf", "application/pdf"],
    ]) {
      const r = await fetch(base + path);
      assert.equal(r.status, 200);
      assert.ok(r.headers.get("content-type").startsWith(type));
    }
    assert.equal((await fetch(base + "/missing")).status, 404);
    assert.equal((await fetch(base + "/.git/config")).status, 404);
    assert.equal((await fetch(base + "/%")).status, 400);
    assert.equal((await fetch(base + "/", { method: "POST" })).status, 405);
    const head = await fetch(base + "/", { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
