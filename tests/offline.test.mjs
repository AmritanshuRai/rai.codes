import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { runInNewContext } from "node:vm";

test("offline shell is complete and unrelated caches are preserved", async () => {
  const handlers = {};
  const removed = [];
  let assets = [];
  const context = {
    self: {
      location: { origin: "https://portfolio.test" },
      clients: { claim: async () => {} },
      addEventListener: (name, fn) => {
        handlers[name] = fn;
      },
    },
    caches: {
      open: async () => ({
        addAll: async (list) => {
          assets = [...list];
        },
      }),
      keys: async () => [
        "rai-portfolio-v1",
        "rai-portfolio-v4",
        "rai-portfolio-v5",
        "rai-portfolio-v6",
        "rai-portfolio-v7",
        "rai-portfolio-v8",
        "rai-portfolio-v17",
        "workbox-precache-old",
        "unrelated-cache",
      ],
      delete: async (key) => removed.push(key),
      match: async () => new Response("offline copy"),
    },
    URL,
    Response,
    fetch: async () => {
      throw new Error("Offline");
    },
  };
  runInNewContext(
    await readFile(new URL("../dist/sw.js", import.meta.url), "utf8"),
    context
  );
  let work;
  handlers.install({
    waitUntil: (promise) => {
      work = promise;
    },
  });
  await work;
  for (const asset of assets)
    await assert.doesNotReject(
      access(
        new URL(
          "../dist" + (asset === "/" ? "/index.html" : asset),
          import.meta.url
        )
      )
    );
  handlers.activate({
    waitUntil: (promise) => {
      work = promise;
    },
  });
  await work;
  assert.deepEqual(removed, [
    "rai-portfolio-v1",
    "rai-portfolio-v4",
    "rai-portfolio-v5",
    "rai-portfolio-v6",
    "rai-portfolio-v7",
    "rai-portfolio-v8",
    "workbox-precache-old",
  ]);
  handlers.fetch({
    request: new Request("https://portfolio.test/assets/app.js"),
    respondWith: (promise) => {
      work = promise;
    },
  });
  assert.equal(await (await work).text(), "offline copy");
  for (const request of [
    new Request("https://other.test/"),
    new Request("https://portfolio.test/", { method: "POST" }),
  ]) {
    let intercepted = false;
    handlers.fetch({
      request,
      respondWith: () => {
        intercepted = true;
      },
    });
    assert.equal(intercepted, false);
  }
});
