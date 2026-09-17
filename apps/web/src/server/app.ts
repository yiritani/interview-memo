import { zValidator } from "@hono/zod-validator";
import { desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { interviewAnswers } from "@repo/db/schema";
import type { AiMode } from "@/lib/ai-types";
import { getDb } from "@/lib/db";
import { generateAiResponse } from "@/server/ai";
import { z } from "zod";

const answerSchema = z.object({
  questionId: z.string().trim().min(1).max(120),
  question: z.string().trim().min(1).max(2_000),
  answer: z.string().max(20_000),
});

const aiSchema = z.object({
  mode: z.enum(["interview_questions", "reverse_questions", "rewrite_answer", "answer_support", "score_answer"] satisfies [AiMode, ...AiMode[]]),
  career: z.string().max(20_000),
  company: z.string().max(20_000),
  target: z.string().max(20_000),
});

const app = new Hono()
  .basePath("/api")
  .get("/health", async (context) => {
    try {
      const db = await getDb();
      await db.run(sql`select 1`);

      return context.json({
        ok: true as const,
        runtime:
          process.env.DATABASE_URL || process.env.NODE_ENV === "development"
            ? "local-libsql" as const
            : "cloudflare-d1" as const,
      });
    } catch (error) {
      return context.json(
        {
          ok: false as const,
          error: error instanceof Error ? error.message : "Database unavailable",
        },
        503,
      );
    }
  })
  .get("/answers", async (context) => {
    try {
      const db = await getDb();
      const rows = await db.select().from(interviewAnswers).orderBy(desc(interviewAnswers.updatedAt));

      return context.json(
        rows.map((row) => ({
          ...row,
          updatedAt: row.updatedAt.toISOString(),
        })),
      );
    } catch (error) {
      return context.json(
        { error: error instanceof Error ? error.message : "Could not load answers" },
        503,
      );
    }
  })
  .post("/answers", zValidator("json", answerSchema), async (context) => {
    const payload = context.req.valid("json");
    const answer = payload.answer.trim();

    if (!answer) {
      return context.json({ error: "回答を入力してください" }, 400);
    }

    try {
      const db = await getDb();
      const now = new Date();
      const existing = await db
        .select()
        .from(interviewAnswers)
        .where(eq(interviewAnswers.questionId, payload.questionId))
        .limit(1);

      if (existing[0]) {
        await db
          .update(interviewAnswers)
          .set({ answer, question: payload.question, updatedAt: now })
          .where(eq(interviewAnswers.questionId, payload.questionId));
      } else {
        await db.insert(interviewAnswers).values({
          id: crypto.randomUUID(),
          questionId: payload.questionId,
          question: payload.question,
          answer,
          createdAt: now,
          updatedAt: now,
        });
      }

      return context.json({
        ok: true as const,
        questionId: payload.questionId,
        updatedAt: now.toISOString(),
      });
    } catch (error) {
      return context.json(
        { error: error instanceof Error ? error.message : "Could not save answer" },
        503,
      );
    }
  })
  .delete("/answers", async (context) => {
    const questionId = context.req.query("questionId");

    if (!questionId) {
      return context.json({ error: "questionId is required" }, 400);
    }

    try {
      const db = await getDb();
      await db.delete(interviewAnswers).where(eq(interviewAnswers.questionId, questionId));
      return context.json({ ok: true as const, questionId });
    } catch (error) {
      return context.json(
        { error: error instanceof Error ? error.message : "Could not delete answer" },
        503,
      );
    }
  })
  .post("/ai/generate", zValidator("json", aiSchema), async (context) => {
    const payload = context.req.valid("json");

    try {
      return context.json(await generateAiResponse(payload));
    } catch (error) {
      return context.json(
        { error: error instanceof Error ? error.message : "AIの生成に失敗しました" },
        503,
      );
    }
  });

export type AppType = typeof app;
export { app };
