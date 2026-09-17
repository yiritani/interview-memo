import { desc } from "drizzle-orm";
import { interviewAnswers, memos, questionTemplates } from "@repo/db/schema";
import { SpatialWorkspace } from "@/components/spatial-workspace";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  let entries: typeof memos.$inferSelect[] = [];
  let templates: typeof questionTemplates.$inferSelect[] = [];
  let answers: { questionId: string; answer: string }[] = [];
  let status = "接続済み";
  let detail: string | undefined;

  try {
    const db = await getDb();
    entries = await db.select().from(memos).orderBy(desc(memos.createdAt)).limit(10);
    try {
      templates = await db.select().from(questionTemplates).orderBy(desc(questionTemplates.createdAt)).limit(50);
    } catch {
      detail = "質問テンプレートのマイグレーション待ちです。ローカルでは pnpm dev:local で反映できます。";
    }
    try {
      const answerRows = await db.select().from(interviewAnswers);
      answers = answerRows.map(({ answer, questionId }) => ({ answer, questionId }));
    } catch {
      detail ??= "回答保存テーブルのマイグレーション待ちです。ローカルでは pnpm dev:local で反映できます。";
    }
  } catch {
    status = "マイグレーション待ち";
    detail = "pnpm db:migrate:local を実行するとローカル DB を最新化できます。";
  }

  return (
    <SpatialWorkspace
      detail={detail}
      entries={entries.map(({ content, id, title }) => ({ content, id, title }))}
      status={status}
      initialAnswers={Object.fromEntries(answers.map((answer) => [answer.questionId, answer.answer]))}
      templates={templates.map(({ category, id, intent, keywords, question, sourceName, sourceUrl, stage }) => ({
        category,
        id,
        intent,
        keywords: parseKeywords(keywords),
        question,
        sourceName,
        sourceUrl,
        stage,
      }))}
    />
  );
}

function parseKeywords(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((keyword) => typeof keyword === "string") ? parsed : [];
  } catch {
    return [];
  }
}
