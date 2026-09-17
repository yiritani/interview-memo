/** Keep the Hono RPC response type while handling non-JSON server failures. */
export async function readApiJson<T extends { status: number; ok: boolean; text(): Promise<string>; json(): Promise<unknown> }>(
  response: T,
): Promise<Awaited<ReturnType<T["json"]>>> {
  const text = await response.text();
  const fallback = `サーバーから正常な応答を受け取れませんでした（HTTP ${response.status}）。少し待って再実行してください。`;
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(fallback);
  }
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : fallback);
  }
  return body;
}
