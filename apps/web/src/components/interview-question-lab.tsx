"use client";

import { hc } from "hono/client";
import { ArrowUpRight, Check, CircleAlert, ExternalLink, LoaderCircle, Save, ScanSearch, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnswerAiActions } from "@/components/answer-ai-actions";
import { AiUsageMeter } from "@/components/ai-usage-meter";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { Textarea } from "@/components/ui/textarea";
import { AI_INPUT_LIMITS } from "@/lib/ai-limits";
import { APP_AI_DAILY_REQUEST_LIMIT, canStartAiRequest, getAiNeuronTotal, getAiRequestBudgetMessage, getAiRequestCount, recordAiNeurons, recordAiRequest, subscribeToAiNeuronTotal, subscribeToAiRequestCount } from "@/lib/ai-meter";
import type { AiResponse, AiUsage } from "@/lib/ai-types";
import { readApiJson } from "@/lib/api-response";
import { cn } from "@/lib/utils";
import type { AppType } from "@/server/app";

export type InterviewQuestionTemplate = {
  id: string;
  category: string;
  stage: string;
  question: string;
  intent: string;
  keywords: string[];
  sourceName?: string | null;
  sourceUrl?: string | null;
};

export const fallbackInterviewQuestionTemplates: InterviewQuestionTemplate[] = [
  {
    id: "q-why-now",
    category: "転職理由",
    stage: "behavioral",
    question: "今回の転職で実現したいことは何ですか？今の環境では難しいと感じたきっかけも教えてください。",
    intent: "転職理由の一貫性と、次の環境に求める条件を確認する。",
    keywords: ["転職", "キャリア", "改善"],
    sourceName: "MVP editorial",
  },
  {
    id: "q-project-overview",
    category: "プロジェクト",
    stage: "all",
    question: "直近のプロジェクトを、目的・規模・期間・あなたの担当範囲に分けて説明してください。",
    intent: "経歴の事実関係と、本人が担った責任の大きさを確認する。",
    keywords: ["プロジェクト", "担当", "チーム", "SaaS"],
    sourceName: "MVP editorial",
  },
  {
    id: "q-role-impact",
    category: "役割と成果",
    stage: "behavioral",
    question: "チームの中でどのような役割を担い、成果にどんな影響を与えましたか？数字や変化があれば教えてください。",
    intent: "作業内容ではなく、行動と成果を具体的に確認する。",
    keywords: ["チーム", "リーダー", "成果", "改善"],
    sourceName: "MVP editorial",
  },
  {
    id: "q-technical-tradeoff",
    category: "技術判断",
    stage: "technical",
    question: "技術選定や設計で、複数の案から判断した経験を教えてください。何を比較し、なぜその案を選びましたか？",
    intent: "技術判断の軸と、トレードオフを説明する力を確認する。",
    keywords: ["設計", "技術選定", "アーキテクチャ", "API", "TypeScript", "Go", "Java"],
    sourceName: "MVP editorial",
  },
  {
    id: "q-performance",
    category: "性能改善",
    stage: "technical",
    question: "性能や可用性に関する課題を見つけて改善した経験を教えてください。計測方法と改善後の変化も説明してください。",
    intent: "課題発見から検証までを再現性のある形で進められるか確認する。",
    keywords: ["性能", "P95", "API", "データベース", "PostgreSQL", "MySQL", "Redis"],
    sourceName: "MVP editorial",
  },
  {
    id: "q-incident",
    category: "障害対応",
    stage: "technical",
    question: "本番障害や大きな不具合に対応した経験を教えてください。切り分け、復旧、再発防止をどのように進めましたか？",
    intent: "プレッシャー下での判断と、個人攻撃に寄らない改善の進め方を確認する。",
    keywords: ["障害", "インシデント", "監視", "AWS", "GCP", "Azure", "Kubernetes"],
    sourceName: "MVP editorial",
  },
  {
    id: "q-quality",
    category: "品質づくり",
    stage: "technical",
    question: "品質を保つために、テスト・コードレビュー・CI/CDの中で工夫していることはありますか？",
    intent: "品質を属人的な注意力だけに頼らず仕組み化できるか確認する。",
    keywords: ["テスト", "レビュー", "CI/CD", "Docker", "GitHub Actions"],
    sourceName: "MVP editorial",
  },
  {
    id: "q-collaboration",
    category: "協働",
    stage: "behavioral",
    question: "要件や優先順位について意見が分かれたとき、どのように合意形成しましたか？",
    intent: "異なる職種や立場の人と、目的をそろえて進める力を確認する。",
    keywords: ["要件", "合意形成", "プロダクト", "チーム", "コミュニケーション"],
    sourceName: "MVP editorial",
  },
  {
    id: "q-learning",
    category: "学習と適応",
    stage: "behavioral",
    question: "未経験の技術や領域を任されたとき、どのように学び、いつまでに実務で使える状態にしますか？",
    intent: "未知の課題に対する学び方と、周囲を巻き込む姿勢を確認する。",
    keywords: ["学習", "未経験", "React", "Next.js", "Python", "Ruby"],
    sourceName: "MVP editorial",
  },
  {
    id: "q-security",
    category: "セキュリティ",
    stage: "technical",
    question: "担当領域で、認証・認可・個人情報・秘密情報などのリスクにどう向き合いましたか？",
    intent: "安全性を要件と実装の両面から考えられるか確認する。",
    keywords: ["認証", "認可", "セキュリティ", "個人情報", "API"],
    sourceName: "MVP editorial",
  },
  {
    id: "q-communication",
    category: "説明力",
    stage: "behavioral",
    question: "技術的な制約やリスクを、非エンジニアにも伝えて意思決定につなげた経験を教えてください。",
    intent: "専門知識を相手に合わせて翻訳し、前に進める力を確認する。",
    keywords: ["説明", "リスク", "非エンジニア", "意思決定"],
    sourceName: "MVP editorial",
  },
  {
    id: "q-first-90-days",
    category: "入社後",
    stage: "all",
    question: "入社後の最初の90日で、どのようにプロダクトとチームを理解し、どんな貢献を始めたいですか？",
    intent: "応募先での再現性と、立ち上がり方のイメージを確認する。",
    keywords: ["入社後", "貢献", "プロダクト", "チーム"],
    sourceName: "MVP editorial",
  },
];

const sampleCareer = [
  "・BtoB SaaS のバックエンドを3年担当",
  "・TypeScript / Node.js / PostgreSQL を使用",
  "・月間100万リクエストの API を改善し、P95 レイテンシを40%短縮",
  "・4人チームでコードレビューと障害対応を担当",
].join("\n");

type QuestionAiMode = "interview_questions" | "reverse_questions";

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[\s・/／_-]/g, "");
const api = hc<AppType>("/");

function parseKeywords(value: string) {
  return value
    .split(/[\n、,。:：()（）]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1);
}

function stageLabel(stage: string) {
  if (stage === "technical") return "技術面";
  if (stage === "behavioral") return "人物面";
  return "共通";
}

type SaveState = "idle" | "saving" | "saved" | "error";

const cubeNetPositions = [
  "xl:col-start-2 xl:row-start-1",
  "xl:col-start-1 xl:row-start-2",
  "xl:col-start-2 xl:row-start-2",
  "xl:col-start-3 xl:row-start-2",
  "xl:col-start-4 xl:row-start-2",
  "xl:col-start-2 xl:row-start-3",
] as const;

export function InterviewQuestionLab({
  initialAnswers,
  templates,
}: {
  initialAnswers: Record<string, string>;
  templates: InterviewQuestionTemplate[];
}) {
  const availableTemplates = templates.length > 0 ? templates : fallbackInterviewQuestionTemplates;
  const [career, setCareer] = useState(sampleCareer);
  const [submittedCareer, setSubmittedCareer] = useState(sampleCareer);
  const [companyContext, setCompanyContext] = useState("");
  const [aiMode, setAiMode] = useState<QuestionAiMode>("interview_questions");
  const [generatedQuestions, setGeneratedQuestions] = useState<InterviewQuestionTemplate[] | null>(null);
  const [generatedAnswers, setGeneratedAnswers] = useState<Record<string, string>>({});
  const [questionSummary, setQuestionSummary] = useState("");
  const [aiResult, setAiResult] = useState<AiResponse | null>(null);
  const [aiUsage, setAiUsage] = useState<AiUsage | undefined>();
  const [aiRequestCount, setAiRequestCount] = useState(getAiRequestCount);
  const [aiNeuronTotal, setAiNeuronTotal] = useState(getAiNeuronTotal);
  const [aiState, setAiState] = useState<"idle" | "generating" | "error">("idle");
  const [aiError, setAiError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [saveState, setSaveState] = useState<Record<string, SaveState>>(() =>
    Object.fromEntries(Object.keys(initialAnswers).map((questionId) => [questionId, "saved"])) as Record<string, SaveState>,
  );
  const normalizedCareer = normalize(submittedCareer);

  useEffect(() => subscribeToAiRequestCount(setAiRequestCount), []);
  useEffect(() => subscribeToAiNeuronTotal(setAiNeuronTotal), []);

  const questions = useMemo(() => {
    const scored = (generatedQuestions ?? availableTemplates.filter((item) => initialAnswers[item.id])).map((template, index) => {
      const matchedKeywords = template.keywords.filter((keyword) => normalizedCareer.includes(normalize(keyword)));
      const foundationBoost = index < 3 ? 2 : 0;

      return {
        ...template,
        matchedKeywords,
        score: matchedKeywords.length * 10 + foundationBoost,
      };
    });

    return scored.sort((left, right) => right.score - left.score || left.id.localeCompare(right.id)).slice(0, 6);
  }, [availableTemplates, normalizedCareer, generatedQuestions, initialAnswers]);

  const bulletCount = submittedCareer
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    setSaveState((current) => ({ ...current, [questionId]: "idle" }));
  };

  const saveAnswer = async (question: (typeof questions)[number], answerOverride?: string) => {
    const answer = (answerOverride ?? answers[question.id] ?? "").trim();
    setSaveState((current) => ({ ...current, [question.id]: "saving" }));

    try {
      const response = answer
        ? await api.api.answers.$post({
            json: {
              answer,
              question: question.question,
              questionId: question.id,
            },
          })
        : await api.api.answers.$delete({ query: { questionId: question.id } });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "回答を保存できませんでした");
      }

      setSaveState((current) => ({ ...current, [question.id]: "saved" }));
    } catch {
      setSaveState((current) => ({ ...current, [question.id]: "error" }));
    }
  };

  const generateWithAi = async (mode: QuestionAiMode) => {
    if (!canStartAiRequest()) {
      setAiState("error");
      setAiError(getAiRequestBudgetMessage());
      return;
    }
    setAiMode(mode);
    setAiState("generating");
    setAiError("");

    try {
      const reverseTarget = JSON.stringify(questions.map((item) => ({
        question: item.question.slice(0, 700),
        answer: (generatedAnswers[item.id] ?? answers[item.id] ?? "").slice(0, 800),
      })));
      const response = await api.api.ai.generate.$post({
        json: {
          career,
          company: companyContext,
          mode,
          target: mode === "reverse_questions" ? reverseTarget : "",
        },
      });
      const body = await readApiJson(response);
      if (!response.ok || !("items" in body)) {
        throw new Error("error" in body && typeof body.error === "string" ? body.error : "AIの生成に失敗しました");
      }
      setAiRequestCount(recordAiRequest());
      setAiNeuronTotal(recordAiNeurons(body.usage?.neurons));

      if (mode === "interview_questions") {
        setSubmittedCareer(career);
        setQuestionSummary(body.summary);
        setAiUsage(body.usage);
        setGeneratedQuestions(body.items.map((item) => ({
          id: `ai-${crypto.randomUUID()}`, category: item.title, stage: "all",
          question: item.body, intent: "自分の経験や判断を、具体的な事実で伝えましょう。",
          keywords: [], sourceName: body.provider === "local-fallback" ? "ローカル簡易生成" : "AI生成",
        })));
      } else {
        setAiResult(body);
        setAiUsage(body.usage);
      }
      setAiState("idle");
    } catch (error) {
      setAiState("error");
      setAiError(error instanceof Error ? error.message : "AIの生成に失敗しました");
    }
  };

  return (
    <div className="grid gap-0">
      <MultiStepLoader
        key={aiState === "generating" ? "question-loading" : "question-idle"}
        loading={aiState === "generating"}
        loadingStates={[
          { text: "経歴と会社情報を読み込んでいます" },
          { text: "面接官の視点で論点を並べています" },
          { text: "話しやすい質問の形に整えています" },
          { text: "結果をワークスペースへ返しています" },
        ]}
      />
      <section className="workflow-section workflow-section--content border-b border-border pb-8" data-workflow-section id="company-input">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase">01 / Question lab</p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.06em] sm:text-5xl">想定面接質問</h2>
          </div>
          <p className="max-w-xs text-right text-xs leading-5 text-muted-foreground">
            職種・技術・成果を入力すると、深掘りされやすいテーマを表示します。
          </p>
        </div>
        <p className="font-mono text-xs text-accent">01 / COMPANY</p>
        <h3 className="mt-3 text-xl font-medium">受ける会社を知る</h3>
        <p className="mt-3 text-sm text-muted-foreground">会社概要や求人票を貼り付けてください。質問・回答・逆質問を考える材料にします。</p>
        <Textarea aria-label="受ける会社や求人の情報" className="mt-4 min-h-32 bg-surface" maxLength={AI_INPUT_LIMITS.company} onChange={(event) => setCompanyContext(event.target.value)} placeholder="事業、募集背景、求める経験、開発体制、利用技術など" value={companyContext} />
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>AIへの送信は生成・補助・採点ボタンを押した時だけ。会社情報は後から追記できます。</span><span className="shrink-0 font-mono">{companyContext.length.toLocaleString()} / {AI_INPUT_LIMITS.company.toLocaleString()}文字</span></div>
      </section>
      <section className="workflow-section workflow-section--content min-w-0" data-workflow-section id="career-input">
        <div className="flex items-center gap-2 text-xs tracking-[0.16em] text-muted-foreground uppercase">
          <ScanSearch className="size-4 text-accent" />
          02 / Career input
        </div>
        <h3 className="mt-5 max-w-md text-3xl leading-[0.98] font-medium tracking-[-0.06em] sm:text-4xl">
          箇条書きから、
          <br />
          聞かれる角度を出す。
        </h3>
        <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
          職種、技術、規模、役割、成果を短く書いてください。会社情報と合わせて、想定質問を生成します。
        </p>
        <Textarea
          aria-label="これまでの経歴"
          className="mt-7 min-h-56 bg-surface"
          maxLength={AI_INPUT_LIMITS.career}
          onChange={(event) => setCareer(event.target.value)}
          placeholder="・プロダクトや担当領域\n・使った技術\n・数字で表せる成果\n・チームでの役割"
          value={career}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs text-muted-foreground">{parseKeywords(career).length} signals / draft · {career.length.toLocaleString()} / {AI_INPUT_LIMITS.career.toLocaleString()}文字</span>
          <Button disabled={aiState === "generating" || !career.trim() || aiRequestCount >= APP_AI_DAILY_REQUEST_LIMIT} onClick={() => void generateWithAi("interview_questions")} type="button">
            {aiState === "generating" && aiMode === "interview_questions" ? "質問を生成中…" : "AIで想定質問を生成する"}<ArrowUpRight />
          </Button>
        </div>
        <p aria-live="polite" className="mt-3 text-xs text-accent">{aiMode === "interview_questions" && aiState === "error" ? aiError : questionSummary}</p>
        {aiMode === "interview_questions" && questionSummary ? (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] text-muted-foreground">{aiUsage ? "Workers AI / 使用量を受け取りました" : "AI / 使用量メタデータなし"} · 残り {Math.max(0, APP_AI_DAILY_REQUEST_LIMIT - aiRequestCount)} 回</p>
            <AiUsageMeter neuronTotal={aiNeuronTotal} requestCount={aiRequestCount} usage={aiUsage} />
          </div>
        ) : null}
      </section>

      <section className="workflow-section workflow-section--content workflow-section--tall min-w-0 xl:relative xl:left-1/2 xl:w-screen xl:-translate-x-1/2 xl:px-8 2xl:px-16" data-workflow-section id="question-workspace">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground pb-5">
          <div>
            <p className="font-mono text-[11px] tracking-[0.16em] text-accent uppercase">03 / Questions / {String(questions.length).padStart(2, "0")}</p>
            <h3 className="mt-2 text-xl font-medium tracking-tight">想定質問の展開図</h3>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">Question workspace</span>
            <p className="mt-1 text-xs text-muted-foreground">{bulletCount} lines indexed</p>
          </div>
        </div>

        {questions.length === 0 ? <p className="py-8 text-sm text-muted-foreground">会社情報と経歴を入力して、想定質問を生成してください。質問ごとにメモを書き、回答文を作れます。</p> : null}
        <div className="relative grid min-w-0 gap-5 pt-6 md:grid-cols-2 xl:auto-rows-auto xl:grid-cols-[repeat(4,minmax(0,1fr))]">
          <div className="pointer-events-none absolute inset-x-0 top-[calc(50%+10px)] hidden border-t border-dashed border-accent/20 xl:block" />
          {questions.map((question, index) => (
            <article className={cn("question-card relative z-10 h-full min-w-0 w-full", cubeNetPositions[index])} key={question.id}>
              <div className="flex h-full min-h-[540px] w-full min-w-0 flex-col border border-foreground bg-surface p-5 shadow-[8px_9px_0_var(--shadow)] xl:min-h-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{question.category}</Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">{stageLabel(question.stage)}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">Q{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="mt-6">
                  <p className="text-base leading-7 font-medium tracking-tight">{question.question}</p>
                  <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">{question.intent}</p>
                </div>
                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium">回答の材料をメモする</p>
                  <Textarea
                    aria-label={`${question.category}の回答メモ`}
                    className="min-h-28 bg-background/70 text-sm leading-6 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[4px_4px_0_var(--shadow)] focus:-translate-y-0.5 focus:shadow-[6px_6px_0_var(--shadow)]"
                    maxLength={AI_INPUT_LIMITS.answer}
                    onChange={(event) => setAnswer(question.id, event.target.value)}
                    placeholder="回答の材料を箇条書きで。担当したこと・自分の判断・成果など"
                    value={answers[question.id] ?? ""}
                  />
                  <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground">{(answers[question.id] ?? "").length.toLocaleString()} / {AI_INPUT_LIMITS.answer.toLocaleString()}文字</p>

                </div>
                <AnswerAiActions
                  onGenerated={(value) => setGeneratedAnswers((current) => ({ ...current, [question.id]: value }))}
                  answer={answers[question.id] ?? ""}
                  career={submittedCareer}
                  company={companyContext}
                  question={question.question}
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {question.matchedKeywords.length > 0 ? (
                      question.matchedKeywords.slice(0, 3).map((keyword) => (
                        <span className="border border-accent/30 px-1.5 py-0.5 font-mono text-[10px] text-accent" key={keyword}>
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground">基礎質問</span>
                    )}
                  </div>
                  {question.sourceUrl ? (
                    <a className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent" href={question.sourceUrl} rel="noreferrer" target="_blank">
                      出典 <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{question.sourceName ?? "出典未接続"}</span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="flex min-h-5 items-center gap-1.5 text-[11px] text-muted-foreground" aria-live="polite">
                    {saveState[question.id] === "saving" ? <><LoaderCircle className="size-3.5 animate-spin" /> 保存中</> : null}
                    {saveState[question.id] === "saved" ? <><Check className="size-3.5 text-accent" /> 保存済み</> : null}
                    {saveState[question.id] === "error" ? <><CircleAlert className="size-3.5 text-destructive" /> 保存に失敗</> : null}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      aria-label={`${question.category}の回答をクリア`}
                      className="hover:-translate-y-0.5 hover:scale-105 hover:shadow-[3px_3px_0_var(--shadow)] active:scale-95"
                      disabled={saveState[question.id] === "saving" || !answers[question.id]}
                      onClick={() => {
                        setAnswer(question.id, "");
                        void saveAnswer(question, "");
                      }}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                    <Button
                      className="hover:scale-[1.03] hover:shadow-[4px_4px_0_var(--shadow)] active:scale-[0.98]"
                      disabled={saveState[question.id] === "saving"}
                      onClick={() => void saveAnswer(question)}
                      size="sm"
                      type="button"
                    >
                      <Save />
                      メモを保存
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-xs leading-5 text-muted-foreground">
          <span className="size-1.5 bg-accent" /> メモ → 回答文を生成 → 生成前後を比較 → 補助・採点の順に、回答を磨いていきます。
        </p>
      </section>
      <section className="workflow-section workflow-section--content border-t border-foreground pt-6" data-workflow-section id="reverse-questions">
        <p className="font-mono text-xs text-accent">04 / REVERSE QUESTIONS</p>
        <h3 className="mt-3 text-xl font-medium">最後に、こちらから聞きたいことを。</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">会社情報・経歴・準備した回答をもとに、応募者から面接官へ聞く、入社後の期待や働き方を確かめる逆質問を考えます。</p>
        <Button className="mt-4" disabled={aiState === "generating" || questions.length === 0 || aiRequestCount >= APP_AI_DAILY_REQUEST_LIMIT} onClick={() => void generateWithAi("reverse_questions")} type="button">
          {aiState === "generating" && aiMode === "reverse_questions" ? "逆質問を生成中…" : "AIで逆質問を生成する"}<ArrowUpRight />
        </Button>
        <div aria-live="polite" className="mt-4">
          {aiMode === "reverse_questions" && aiState === "error" ? <p className="text-xs text-destructive">{aiError}</p> : null}
          {aiResult ? <>
            <p className="mb-2 text-[10px] text-muted-foreground">{aiResult.provider === "local-fallback" ? "ローカル簡易結果" : "Workers AI / 使用量を受け取りました"} · 残り {Math.max(0, APP_AI_DAILY_REQUEST_LIMIT - aiRequestCount)} 回</p>
            <AiUsageMeter neuronTotal={aiNeuronTotal} requestCount={aiRequestCount} usage={aiResult.usage} />
            <p className="text-xs leading-6 text-muted-foreground">{aiResult.summary}</p>
            {aiResult.items.map((item, index) => <div className="mt-4 border-t border-border pt-4" key={index}><h4 className="text-sm font-medium">{item.title}</h4><p className="mt-2 text-sm leading-6">{item.body}</p></div>)}
          </> : null}
        </div>
      </section>
    </div>
  );
}
