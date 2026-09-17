import type { AiMode, AiResponse, AiUsage } from "@/lib/ai-types";

const model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const inputPricePerMillionTokens = 0.293;
const outputPricePerMillionTokens = 2.253;
const neuronPricePerThousand = 0.011;

function modelInput(prompt: string) {
  return {
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1800,
    temperature: 0.3,
    response_format: {
      type: "json_schema",
      json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          items: { type: "array", items: {
            type: "object", properties: { title: { type: "string" }, body: { type: "string" }, score: { type: "integer" } },
            required: ["title", "body"],
          } },
        },
        required: ["summary", "items"],
      },
    },
  };
}

// Development-only proxy; Wrangler owns OAuth renewal and remote binding access.
let localAi: Promise<AiBinding> | undefined;
async function getLocalAi(): Promise<AiBinding | undefined> {
  if (process.env.NODE_ENV !== "development" || process.env.CLOUDFLARE_AI_LOCAL !== "true") return undefined;
  localAi ??= import("wrangler").then(async ({ getPlatformProxy }) => {
    const proxy = await getPlatformProxy<{ AI: AiBinding }>({
      configPath: "wrangler.ai.jsonc", persist: false, remoteBindings: true,
    });
    return proxy.env.AI;
  }).catch(() => {
    localAi = undefined;
    throw new Error("Cloudflare AIに接続できません。Wranglerのログイン状態を確認してください。");
  });
  return localAi;
}

type AiBinding = {
  run: (modelName: string, input: Record<string, unknown>) => Promise<unknown>;
};

type AiPayload = {
  mode: AiMode;
  career: string;
  company: string;
  target: string;
};

type ParsedAiOutput = {
  summary?: unknown;
  items?: unknown;
};

function modeInstruction(mode: AiMode) {
  switch (mode) {
    case "reverse_questions":
      return "役割は応募者側の面接コーチ。応募者が面接官・採用担当者へ実際に尋ねる逆質問を作る。企業理解、入社後の期待、開発体制、意思決定、評価、働き方を確認できる内容にする。対象テキストに準備した質問と回答があれば、応募者の関心や経験を参考にする。面接官が応募者へ尋ねる質問は絶対に作らない";
    case "rewrite_answer":
      return "対象JSONのnotes（回答メモ）を根拠に、質問questionへそのまま口頭で答えられる一人称・ですます調の自然な回答文を作る。previousAnswerがあれば改善する。箇条書きの助言ではなく完成した回答本文を返す。経歴は補足に使い、数字・役割・成果は捏造せず、不足はsummaryで指摘する";
    case "answer_support":
      return "対象テキストへの回答を、事実を捏造せず、状況・行動・結果が伝わる形に整える";
    case "score_answer":
      return "対象テキストの回答を、具体性・一貫性・成果・企業との接続の4観点で採点し、改善案を出す";
    default:
      return "役割は採用面接官。応募者の経歴と応募先の情報を材料に、面接官が応募者へ実際に聞きそうな想定質問を作る。経歴の箇条書きや求人情報をそのまま出力せず、そこから深掘りする質問に変換する。応募者が企業へ尋ねる逆質問や、回答例、助言は作らない";
  }
}

function promptFor(payload: AiPayload) {
  return `あなたは日本のITエンジニア採用に詳しい面接コーチです。
目的: ${modeInstruction(payload.mode)}。

応募者の経歴:
${payload.career || "（未入力）"}

受ける会社・求人の情報:
${payload.company || "（未入力。一般的なIT企業として考える）"}

対象テキスト:
${payload.target || "（なし）"}

次のJSONだけを返してください。Markdownのコードブロックや前置きは不要です。
{
  "summary": "全体の短いコメント",
  "items": [
    { "title": "短い見出し", "body": "具体的な質問、回答案、採点理由または改善案", "score": 0 }
  ]
}
${payload.mode === "rewrite_answer"
    ? "itemsは1件のみ、titleは回答文、bodyに完成した回答全文を入れてください。scoreは不要です。"
    : payload.mode === "score_answer"
      ? "score は0から100の整数にしてください。"
      : payload.mode === "reverse_questions"
        ? "itemsは3件。各bodyは応募者が面接官へ尋ねる一つの自然な質問文にしてください。『御社では』『このポジションでは』『入社後に』など企業側を主語にし、企業・役割・チーム・開発・評価・期待を確認する質問にします。『これまでどのような経験をしましたか』『どんな技術を使いましたか』のように応募者へ聞く文は禁止です。"
        : "itemsは3件。各bodyは面接官が応募者へ尋ねる一つの自然な質問文にしてください。経歴や求人情報の一文をそのまま繰り返さず、背景・判断理由・本人の役割・成果・再現性を深掘りする問いへ変換します。『P95を40%短縮したとのことですが、ボトルネックをどう特定し、どの判断をしましたか？』のように、入力情報を材料として使いながら質問として書きます。応募者から企業へ聞く逆質問は禁止です。"}`;
}

function extractText(result: unknown) {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";

  const record = result as Record<string, unknown>;
  if (typeof record.response === "string") return record.response;
  if (record.response && typeof record.response === "object") return JSON.stringify(record.response);
  if (typeof record.text === "string") return record.text;
  if (typeof record.result === "string") return record.result;
  if (record.result && typeof record.result === "object") {
    const nested = record.result as Record<string, unknown>;
    if (typeof nested.response === "string") return nested.response;
    if (nested.response && typeof nested.response === "object") return JSON.stringify(nested.response);
    if (typeof nested.text === "string") return nested.text;
  }

  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function extractUsage(result: unknown): AiUsage | undefined {
  if (!result || typeof result !== "object") return undefined;
  const record = result as Record<string, unknown>;
  const nested = record.result && typeof record.result === "object" ? record.result as Record<string, unknown> : undefined;
  const usage = record.usage && typeof record.usage === "object"
    ? record.usage as Record<string, unknown>
    : nested?.usage && typeof nested.usage === "object"
      ? nested.usage as Record<string, unknown>
      : undefined;

  const inputTokens = asNumber(usage?.input_tokens ?? usage?.prompt_tokens ?? usage?.inputTokens);
  const outputTokens = asNumber(usage?.output_tokens ?? usage?.completion_tokens ?? usage?.outputTokens);
  const totalTokens = asNumber(usage?.total_tokens ?? usage?.totalTokens) ?? (inputTokens !== undefined && outputTokens !== undefined ? inputTokens + outputTokens : undefined);
  const neurons = asNumber(usage?.neurons ?? usage?.total_neurons ?? usage?.totalNeurons ?? record.neurons ?? nested?.neurons);
  if (inputTokens === undefined && outputTokens === undefined && totalTokens === undefined && neurons === undefined) return undefined;

  const estimatedCostUsd = neurons !== undefined
    ? (neurons / 1_000) * neuronPricePerThousand
    : inputTokens !== undefined || outputTokens !== undefined
      ? ((inputTokens ?? 0) / 1_000_000) * inputPricePerMillionTokens + ((outputTokens ?? 0) / 1_000_000) * outputPricePerMillionTokens
      : undefined;

  return { inputTokens, outputTokens, totalTokens, neurons, estimatedCostUsd };
}

function parseAiOutput(value: string): ParsedAiOutput | null {
  const normalized = value.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(normalized) as ParsedAiOutput;
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");
    if (start < 0 || end <= start) return null;

    try {
      return JSON.parse(normalized.slice(start, end + 1)) as ParsedAiOutput;
    } catch {
      return null;
    }
  }
}

function normalizeOutput(mode: AiMode, output: ParsedAiOutput | null): AiResponse | null {
  if (!output || typeof output.summary !== "string" || !Array.isArray(output.items)) return null;

  const items = output.items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      title: typeof item.title === "string" ? item.title : "提案",
      body: typeof item.body === "string" ? item.body : "内容を整理できませんでした。",
      ...(typeof item.score === "number" ? { score: Math.max(0, Math.min(100, Math.round(item.score))) } : {}),
    }))
    .slice(0, 5);

  return items.length > 0
    ? { mode, provider: "cloudflare-workers-ai", summary: output.summary, items }
    : null;
}

function compactForComparison(value: string) {
  return value.toLocaleLowerCase().replace(/[\s・、。,.!?！？:：/／_\-]/g, "");
}

function looksLikeQuestion(value: string) {
  return /[?？]$|ですか[。．.]?$|ますか[。．.]?$|教えてください[。．.]?$|説明してください[。．.]?$|どのよう|どう|なぜ|何を/.test(value.trim());
}

function alignsWithRequestedQuestionDirection(payload: AiPayload, response: AiResponse) {
  if (payload.mode !== "interview_questions" && payload.mode !== "reverse_questions") return true;

  const questionLikeItems = response.items.filter((item) => looksLikeQuestion(item.body));
  if (questionLikeItems.length < Math.min(2, response.items.length)) return false;

  const sourceLines = `${payload.career}\n${payload.company}`
    .split(/\n+/)
    .map((line) => compactForComparison(line))
    .filter((line) => line.length >= 12);
  const copiedItems = response.items.filter((item) => sourceLines.includes(compactForComparison(item.body)));
  if (copiedItems.length >= response.items.length) return false;

  if (payload.mode === "reverse_questions") {
    const companyFacingItems = response.items.filter((item) =>
      /(御社|貴社|このポジション|入社後|チーム|組織|プロダクト|事業|開発体制|働き方|評価|期待|課題|意思決定|文化|オンボーディング|裁量|キャリア)/.test(item.body),
    );
    return companyFacingItems.length >= Math.min(2, response.items.length);
  }

  const candidateFacingItems = response.items.filter((item) =>
    /(経験|担当|役割|成果|技術|設計|改善|障害|チーム|判断|工夫|教えて|説明)/.test(item.body),
  );
  return candidateFacingItems.length >= Math.min(2, response.items.length);
}

function localFallback(payload: AiPayload): AiResponse {
  const companyHint = payload.company.trim() ? "求人票に書かれた事業・開発体制・技術の実態" : "応募先の事業と開発チーム";

  if (payload.mode === "rewrite_answer") {
    const input = JSON.parse(payload.target) as { notes?: string };
    const notes = input.notes?.trim();
    if (!notes) throw new Error("回答メモを入力してください。");
    const body = notes.split(/\n+/).map((line) => line.replace(/^[\s・●\-*]+/, "").trim())
      .filter(Boolean).map((line) => /[。！？]$/.test(line) ? line : `${line}。`).join("\n");
    return {
      mode: payload.mode,
      provider: "local-fallback",
      summary: "AI未接続のため、メモの箇条書きと句読点だけを整えています。自然な回答文への書き換えにはAI接続が必要です。",
      items: [{ title: "回答文（簡易整形）", body }],
    };
  }

  if (payload.mode === "reverse_questions") {
    return {
      mode: payload.mode,
      provider: "local-fallback",
      summary: "会社情報を入力すると、より具体的な逆質問に絞り込めます。まずは汎用的に確認価値の高い3問を出しています。",
      items: [
        { title: "入社後の期待", body: "このポジションで、入社後3か月から半年の間に期待される成果は何ですか？" },
        { title: "技術と改善", body: `現在の${companyHint}に対して、チームが優先して改善したい課題は何ですか？` },
        { title: "協働の仕方", body: "エンジニアがプロダクトや仕様の意思決定に関わる場面と、その進め方を教えてください。" },
      ],
    };
  }

  if (payload.mode === "answer_support") {
    return {
      mode: payload.mode,
      provider: "local-fallback",
      summary: "AI接続前のローカル補助です。対象テキストに事実・行動・結果を足すと、回答の説得力が上がります。",
      items: [
        { title: "状況", body: "どのプロジェクトで、どんな課題が起きていたかを1文で足してください。" },
        { title: "行動", body: "自分が比較・判断・実装したことを、使った技術とともに具体化してください。" },
        { title: "結果", body: "レイテンシ、工数、障害件数、利用者数など、変化を示す数字を足してください。" },
      ],
    };
  }

  if (payload.mode === "score_answer") {
    const lengthScore = Math.min(25, Math.round(payload.target.trim().length / 12));
    const score = Math.min(100, 35 + lengthScore);
    return {
      mode: payload.mode,
      provider: "local-fallback",
      summary: "ローカルの簡易採点です。AI接続後は会社情報との接続や技術的な具体性も採点します。",
      items: [
        { title: "総合スコア", body: "回答をSTAR（状況・課題・行動・結果）で組み直すと、採用担当者が追いやすくなります。", score },
        { title: "次に足すもの", body: "あなた自身の判断、周囲との協働、結果の数字をそれぞれ1つ追加してください。" },
      ],
    };
  }

  return {
    mode: payload.mode,
    provider: "local-fallback",
    summary: "会社情報を入力すると、応募先との接点が強い想定質問に変わります。現在は保存済みテンプレートから組み立てています。",
    items: [
      { title: "事業との接点", body: "この会社の事業やプロダクトに対して、これまでの経験をどう活かせますか？" },
      { title: "技術判断", body: "求人に記載された技術や開発課題について、過去にどんな判断をしてきましたか？" },
      { title: "入社後の貢献", body: "入社後90日で、チームとプロダクトを理解しながら何から貢献しますか？" },
    ],
  };
}

async function getCloudflareAi(): Promise<AiBinding | undefined> {
  try {
    const { env } = (await import(/* webpackIgnore: true */ "cloudflare:workers")) as unknown as {
      env?: { AI?: AiBinding };
    };
    return env?.AI;
  } catch {
    return undefined;
  }
}

async function runViaRest(prompt: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return undefined;

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(model)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(modelInput(prompt)),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`Workers AI request failed: ${response.status}`);
  return response.json();
}

export async function generateAiResponse(payload: AiPayload): Promise<AiResponse> {
  const prompt = promptFor(payload);
  const binding = await getCloudflareAi() ?? await getLocalAi();
  const rawResult = binding
    ? await binding.run(model, modelInput(prompt))
    : await runViaRest(prompt);
  const raw = rawResult === undefined ? undefined : extractText(rawResult);
  const usage = rawResult === undefined ? undefined : extractUsage(rawResult);

  if (raw === undefined) return localFallback(payload);
  const normalized = normalizeOutput(payload.mode, parseAiOutput(raw));
  if (!normalized) throw new Error("AIの回答を読み取れませんでした。もう一度生成してください。");
  if (!alignsWithRequestedQuestionDirection(payload, normalized)) {
    const fallback = localFallback(payload);
    return usage ? { ...fallback, usage } : fallback;
  }
  return usage ? { ...normalized, usage } : normalized;
}
