export const aiModes = [
  "interview_questions",
  "reverse_questions",
  "rewrite_answer",
  "answer_support",
  "score_answer",
] as const;

export type AiMode = (typeof aiModes)[number];

export type AiItem = {
  title: string;
  body: string;
  score?: number;
};

export type AiUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  neurons?: number;
  estimatedCostUsd?: number;
};

export type AiResponse = {
  mode: AiMode;
  provider: "cloudflare-workers-ai" | "local-fallback";
  summary: string;
  items: AiItem[];
  usage?: AiUsage;
};
