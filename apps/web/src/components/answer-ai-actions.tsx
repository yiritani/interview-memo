"use client";

import { hc } from "hono/client";
import { LoaderCircle, PencilLine, ListChecks } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AiUsageMeter } from "@/components/ai-usage-meter";
import { Button } from "@/components/ui/button";
import { Compare } from "@/components/ui/compare";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { APP_AI_DAILY_REQUEST_LIMIT, canStartAiRequest, getAiNeuronTotal, getAiRequestBudgetMessage, getAiRequestCount, recordAiNeurons, recordAiRequest, subscribeToAiNeuronTotal, subscribeToAiRequestCount } from "@/lib/ai-meter";
import type { AiResponse } from "@/lib/ai-types";
import { readApiJson } from "@/lib/api-response";
import type { AppType } from "@/server/app";

type AnswerMode = "answer_support" | "score_answer";
type Result = { response: AiResponse; answer: string; career: string; company: string };
type Revision = { before: string; after: string; notes: string; response: AiResponse; results: Partial<Record<AnswerMode, Result>> };
const api = hc<AppType>("/");
const actions = [
  { mode: "answer_support", label: "回答を補助する", icon: PencilLine },
  { mode: "score_answer", label: "回答を採点する", icon: ListChecks },
] as const;

function modeLabel(mode: AnswerMode | "rewrite_answer" | null) {
  if (mode === "rewrite_answer") return "回答文を面接用の文章へ整えています";
  if (mode === "answer_support") return "回答の補助ポイントを組み立てています";
  if (mode === "score_answer") return "回答を4つの観点で採点しています";
  return "回答を準備しています";
}

export function AnswerAiActions({ question, answer, career, company, onGenerated }: {
  onGenerated: (answer: string) => void;
  question: string;
  answer: string;
  career: string;
  company: string;
}) {
  const [pending, setPending] = useState<AnswerMode | "rewrite_answer" | null>(null);
  const inFlight = useRef(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selected, setSelected] = useState(0);
  const revision = revisions[selected];
  const results = revision?.results ?? {};
  const [error, setError] = useState("");
  const [aiRequestCount, setAiRequestCount] = useState(getAiRequestCount);
  const [aiNeuronTotal, setAiNeuronTotal] = useState(getAiNeuronTotal);

  useEffect(() => subscribeToAiRequestCount(setAiRequestCount), []);
  useEffect(() => subscribeToAiNeuronTotal(setAiNeuronTotal), []);

  async function generate(mode: AnswerMode | "rewrite_answer") {
    if (inFlight.current || (mode === "rewrite_answer" ? !answer.trim() : !revision)) return;
    if (!canStartAiRequest()) {
      setError(getAiRequestBudgetMessage());
      return;
    }
    inFlight.current = true;
    setPending(mode);
    setError("");
    try {
      const response = await api.api.ai.generate.$post({
        json: { mode, career, company, target: mode === "rewrite_answer"
          ? JSON.stringify({ question, notes: answer, previousAnswer: revisions.at(-1)?.after ?? "" })
          : `質問:\n${question}\n\n回答:\n${revision.after}` },
      });
      const body = await readApiJson(response);
      if (!response.ok || !("items" in body)) {
        throw new Error("error" in body && typeof body.error === "string" ? body.error : "入力内容を確認して、もう一度お試しください。");
      }
      setAiRequestCount(recordAiRequest());
      setAiNeuronTotal(recordAiNeurons(body.usage?.neurons));
      if (mode === "rewrite_answer") {
        const after = body.items[0]?.body?.trim();
        if (!after) throw new Error("回答文を生成できませんでした。もう一度お試しください。");
        setRevisions((current) => [...current, {
          before: current.at(-1)?.after ?? answer,
          after, notes: answer, response: body, results: {},
        }]);
        setSelected(revisions.length);
        onGenerated(after);
      } else {
        setRevisions((current) => current.map((item, index) => index === selected
          ? { ...item, results: { ...item.results, [mode]: { response: body, answer: revision.after, career, company } } }
          : item));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AIの生成に失敗しました。もう一度お試しください。");
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <MultiStepLoader
        key={pending !== null ? "answer-loading" : "answer-idle"}
        loading={pending !== null}
        loadingStates={[
          { text: "回答メモと質問を読み込んでいます" },
          { text: modeLabel(pending) },
          { text: "事実関係と伝わり方を照合しています" },
          { text: "回答の次の一手をまとめています" },
        ]}
      />
      <p className="mb-3 text-[11px] leading-5 text-muted-foreground">
        メモを、面接でそのまま話せる回答文へ。経歴・会社情報も参考にします。
      </p>
      <Button disabled={!answer.trim() || pending !== null || aiRequestCount >= APP_AI_DAILY_REQUEST_LIMIT} onClick={() => void generate("rewrite_answer")} size="sm" type="button">
        {pending === "rewrite_answer" ? <LoaderCircle className="animate-spin" /> : <PencilLine />}
        {pending === "rewrite_answer" ? "回答文を生成中…" : revisions.length ? "回答文を再生成する" : "メモから回答文を生成する"}
      </Button>
      {revision ? (
        <div className="my-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium">回答文 / 第{selected + 1}版</p>
            <div className="flex gap-2">
              <Button aria-label="前の生成結果" disabled={selected === 0 || pending !== null} onClick={() => setSelected((value) => value - 1)} size="xs" variant="outline">前へ</Button>
              <Button aria-label="次の生成結果" disabled={selected === revisions.length - 1 || pending !== null} onClick={() => setSelected((value) => value + 1)} size="xs" variant="outline">次へ</Button>
            </div>
          </div>
          <p className="text-[11px] leading-5 text-muted-foreground">
            {revision.response.summary}
          </p>
          <div className="mt-3">
            <AiUsageMeter neuronTotal={aiNeuronTotal} requestCount={aiRequestCount} usage={revision.response.usage} />
          </div>
          {revision.notes !== answer ? <p className="text-xs text-accent">生成後にメモが変更されています。反映するには再生成してください。</p> : null}
          <Compare
            key={selected}
            className="border border-border bg-background"
            firstContent={<div className="h-full bg-surface p-3"><p className="text-[10px] text-accent">Before / {selected === 0 ? "回答メモ" : "前回の回答文"}</p><p className="mt-3 text-xs leading-5 whitespace-pre-wrap">{revision.before}</p></div>}
            secondContent={<div className="h-full bg-surface-strong p-3"><p className="text-[10px] text-accent">After / 今回の回答文</p><p className="mt-3 text-xs leading-5 whitespace-pre-wrap">{revision.after}</p></div>}
          />
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">生成前の全文・使用したメモを見る</summary>
            <p className="mt-3 font-medium">生成前</p>
            <p className="mt-2 leading-6 whitespace-pre-wrap">{revision.before}</p>
            <p className="mt-3 font-medium">使用したメモ</p>
            <p className="mt-2 leading-6 whitespace-pre-wrap">{revision.notes}</p>
          </details>
          <div className="border-l-2 border-accent pl-3">
            <p className="text-[11px] text-accent">今回の回答文 / 全文</p>
            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">{revision.after}</p>
          </div>
          <p className="text-[10px] text-muted-foreground">生成履歴はこの画面を開いている間だけ保持されます。</p>
        </div>
      ) : <p className="my-3 text-[11px] text-muted-foreground">回答文を生成すると、比較・補助・採点が使えます。</p>}
      <div className="flex flex-wrap gap-2">
        {actions.map(({ mode, label, icon: Icon }) => (
          <Button
            className="text-[11px] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[3px_3px_0_var(--shadow)] motion-safe:active:translate-y-0"
            disabled={!revision || pending !== null || aiRequestCount >= APP_AI_DAILY_REQUEST_LIMIT}
            key={mode}
            onClick={() => void generate(mode)}
            size="sm"
            type="button"
            variant="outline"
          >
            {pending === mode ? <LoaderCircle className="animate-spin" /> : <Icon />}
            {pending === mode ? (mode === "score_answer" ? "採点中…" : "補助を作成中…") : label}
          </Button>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-4 text-muted-foreground">AIにも定時があります。1日{APP_AI_DAILY_REQUEST_LIMIT}回まで、ここぞという回答だけ一緒に磨きます。</p>
      <div aria-live="polite" aria-busy={pending !== null}>
        {error ? <p role="alert" className="mt-3 text-xs text-destructive">{error}</p> : null}
        {actions.map(({ mode, label }) => {
          const result = results[mode];
          if (!result) return null;
          const stale = result.career !== career || result.company !== company;
          return (
            <details className="mt-4 border-t border-accent/30 pt-3" key={mode} open>
              <summary className="cursor-pointer text-xs font-medium text-accent">{label} / 結果</summary>
              {stale ? <p className="mt-2 text-xs text-accent">入力が変更されています。最新の内容で確認するには再実行してください。</p> : null}
              <p className="mt-2 text-[10px] text-muted-foreground">
                {result.response.provider === "local-fallback" ? "ローカル簡易結果（AI未接続）" : "AIによる提案"}
              </p>
              <div className="mt-3">
                <AiUsageMeter neuronTotal={aiNeuronTotal} requestCount={aiRequestCount} usage={result.response.usage} />
              </div>
              <p className="mt-2 text-xs leading-5">{result.response.summary}</p>
              {result.response.items.map((item, index) => (
                <div className="mt-3" key={`${item.title}-${index}`}>
                  <p className="text-xs font-medium">
                    {item.title}
                    {typeof item.score === "number" ? <span className="ml-2 font-mono text-accent">{item.score} / 100</span> : null}
                  </p>
                  <p className="mt-1 text-xs leading-5 whitespace-pre-wrap text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </details>
          );
        })}
      </div>
    </div>
  );
}
