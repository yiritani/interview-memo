import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const memos = sqliteTable("memos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const questionTemplates = sqliteTable("question_templates", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  stage: text("stage").notNull(),
  question: text("question").notNull(),
  intent: text("intent").notNull(),
  keywords: text("keywords").notNull(),
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  sourceFetchedAt: integer("source_fetched_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const interviewAnswers = sqliteTable("interview_answers", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull().unique(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type Memo = typeof memos.$inferSelect;
export type NewMemo = typeof memos.$inferInsert;
export type QuestionTemplate = typeof questionTemplates.$inferSelect;
export type NewQuestionTemplate = typeof questionTemplates.$inferInsert;
export type InterviewAnswer = typeof interviewAnswers.$inferSelect;
export type NewInterviewAnswer = typeof interviewAnswers.$inferInsert;
