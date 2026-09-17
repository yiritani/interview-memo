import assert from "node:assert/strict";
import test from "node:test";
import { readApiJson } from "../src/lib/api-response.ts";

test("successful JSON keeps its payload", async () => {
  assert.deepEqual(await readApiJson(Response.json({ items: [] })), { items: [] });
});
test("empty 500 response gives an actionable message", async () => {
  await assert.rejects(readApiJson(new Response(null, { status: 500 })), /HTTP 500/);
});
test("HTML failure does not leak server markup", async () => {
  await assert.rejects(readApiJson(new Response("<html>internal stack</html>", { status: 502 })), /HTTP 502/);
});
test("JSON API error is preserved", async () => {
  await assert.rejects(readApiJson(Response.json({ error: "AI接続を確認してください" }, { status: 503 })), /AI接続を確認してください/);
});
