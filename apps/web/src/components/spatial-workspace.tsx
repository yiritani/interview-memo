"use client";

import { motion } from "motion/react";
import { ArrowUpRight, GitBranch, Layers3, NotebookPen, Orbit, Rotate3D } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardBody, CardContainer, CardItem } from "@/components/aceternity/3d-card";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { OrbitField } from "@/components/aceternity/orbit-field";
import { Spotlight } from "@/components/aceternity/spotlight";
import {
  fallbackInterviewQuestionTemplates,
  InterviewQuestionLab,
  type InterviewQuestionTemplate,
} from "@/components/interview-question-lab";
import { cn } from "@/lib/utils";

type MemoPreview = {
  id: string;
  title: string;
  content: string;
};

const workflowSteps = [
  { id: "intro", number: "00", label: "START", title: "流れを見る" },
  { id: "company-input", number: "01", label: "COMPANY", title: "会社情報" },
  { id: "career-input", number: "02", label: "CAREER", title: "経歴入力" },
  { id: "question-workspace", number: "03", label: "ANSWER", title: "質問と回答" },
  { id: "review", number: "04", label: "REVIEW", title: "記録を確認" },
  { id: "reverse-questions", number: "05", label: "REVERSE", title: "逆質問" },
  { id: "community", number: "06", label: "OPEN", title: "Issue / PR" },
] as const;

function WorkflowProgress({
  activeSectionId,
  onNavigate,
}: {
  activeSectionId: string;
  onNavigate: (sectionId: string) => void;
}) {
  const activeIndex = Math.max(0, workflowSteps.findIndex((step) => step.id === activeSectionId));

  return (
    <nav aria-label="面接準備の進捗" className="sticky top-0 z-[60] border-b border-foreground/80 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-5 py-3 sm:px-8 lg:px-12">
        <div className="flex items-center gap-4 text-[10px] tracking-[0.14em] uppercase">
          <span className="shrink-0 font-mono text-accent">Flow / {String(activeIndex).padStart(2, "0")} of {String(workflowSteps.length - 1).padStart(2, "0")}</span>
          <span className="hidden text-muted-foreground sm:inline">{workflowSteps[activeIndex]?.title}</span>
          <span className="ml-auto hidden font-mono text-muted-foreground md:inline">scroll / snap</span>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {workflowSteps.map((step, index) => {
            const isActive = step.id === activeSectionId;
            const isComplete = index < activeIndex;

            return (
              <button
                aria-current={isActive ? "step" : undefined}
                className="group min-w-0 text-left"
                key={step.id}
                onClick={() => onNavigate(step.id)}
                title={`${step.number} / ${step.title}`}
                type="button"
              >
                <span className={cn(
                  "block h-1 border border-border transition-colors duration-200",
                  isActive && "border-accent bg-accent",
                  isComplete && "border-foreground/60 bg-foreground/60",
                  !isActive && !isComplete && "group-hover:border-accent/60",
                )} />
                <span className={cn(
                  "mt-1 block truncate font-mono text-[9px] text-muted-foreground transition-colors sm:text-[10px]",
                  (isActive || isComplete) && "text-foreground",
                  isActive && "text-accent",
                )}>
                  <span className="hidden sm:inline">{step.number} / </span>{step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function SpatialWorkspace({
  detail,
  entries,
  initialAnswers,
  status,
  templates,
}: {
  detail?: string;
  entries: MemoPreview[];
  initialAnswers: Record<string, string>;
  status: string;
  templates: InterviewQuestionTemplate[];
}) {
  const [activeSectionId, setActiveSectionId] = useState<string>(workflowSteps[0].id);
  const [feedback, setFeedback] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "saved">("idle");
  const templateCount = templates.length || fallbackInterviewQuestionTemplates.length;
  const githubRepoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL?.trim().replace(/\/$/, "") || "https://github.com/yiritani/interview-memo";

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-workflow-scroll]");
    if (!root) return;

    const sections = workflowSteps
      .map((step) => document.getElementById(step.id))
      .filter((section): section is HTMLElement => section !== null);
    if (sections.length === 0) return;

    const updateActiveSection = () => {
      const marker = root.getBoundingClientRect().top + Math.min(150, root.clientHeight * 0.24);
      let currentSection = sections[0];

      for (const section of sections) {
        if (section.getBoundingClientRect().top <= marker) currentSection = section;
      }

      setActiveSectionId((current) => current === currentSection.id ? current : currentSection.id);
    };

    updateActiveSection();
    root.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      root.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  const navigateToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };

  const saveFeedbackDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!feedback.trim()) return;
    setFeedbackStatus("saved");
  };

  return (
    <main className="workflow-scroll relative h-[100svh] overflow-x-hidden overflow-y-auto overscroll-y-contain" data-workflow-scroll>
      <WorkflowProgress activeSectionId={activeSectionId} onNavigate={navigateToSection} />
      <Spotlight className="-top-12 left-1/2 h-[680px] w-[1100px] -translate-x-1/2" />

      <div className="relative mx-auto max-w-[1600px] px-5 pb-16 sm:px-8 lg:px-12">
        <section className="workflow-section workflow-section--intro" data-workflow-section id="intro">
        <header className="flex items-center justify-between border-b border-border/80 py-5 text-xs tracking-[0.18em] text-muted-foreground uppercase">
          <div className="flex items-center gap-3 text-foreground">
            <span className="grid size-8 place-items-center border border-foreground text-[11px] font-semibold tracking-normal">
              IM
            </span>
            <span>Career / Interview</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline">Workspace 01 / built by engineers</span>
            <span className="flex items-center gap-2 text-accent">
              <span className="size-1.5 bg-accent" /> {status}
            </span>
          </div>
        </header>

        <section aria-label="公開開発とログインなしの方針" className="border-b border-accent/40 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <p className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">Open build / no login</p>
            <a className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase hover:text-accent" href="#community">
              Issue / PRの方針を見る <ArrowUpRight className="ml-1 inline size-3" />
            </a>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6">
            issue, PR作成受け付けます。詳細はページ下部にありますが、とりあえず一回使ってみてください。
          </p>
        </section>

        <div className="relative -mx-5 border-b border-foreground/80 sm:-mx-8 lg:-mx-12">
          <ContainerScroll
            compact
            titleComponent={
              <div className="relative isolate overflow-hidden border-y border-border bg-background/90 px-5 py-10 text-left sm:px-8">
                <div className="relative z-10">
                  <Badge variant="outline">Interview prep / 01</Badge>
                  <h1 className="mt-7 max-w-3xl text-[clamp(3.4rem,9vw,8.2rem)] leading-[0.84] font-semibold tracking-[-0.09em] text-foreground">
                    次の、
                    <br />
                    <span className="text-accent">面接へ。</span>
                  </h1>
                  <p className="mt-8 max-w-md text-base leading-7 text-muted-foreground">
                    IT エンジニアの経歴を、面接で話せる材料に変える。まずは箇条書きから、聞かれる角度を先に見つける。
                  </p>
                  <p className="mt-5 max-w-lg border-l-2 border-accent pl-4 text-sm leading-6 text-foreground/80">
                    人材コンサル会社に勤めるITエンジニアが、面接準備の現場で感じた「経歴をうまく質問に変えられない」をきっかけに作っています。
                  </p>
                </div>
              </div>
            }
          >
            <div className="grid h-full gap-8 bg-surface p-6 lg:grid-cols-[0.8fr_1fr] lg:gap-10 lg:p-10">
              <div className="flex min-w-0 flex-col justify-center">
                <p className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase">Next interview / 01</p>
                <h2 className="mt-4 text-4xl leading-[0.95] font-medium tracking-[-0.06em] sm:text-6xl">
                  経歴を
                  <br />
                  質問へ。
                </h2>
                <p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">
                  会社情報と経歴を重ねて、聞かれる角度と自分の答えを整えます。
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                    {templateCount.toString().padStart(2, "0")} templates / local
                  </span>
                </div>
              </div>

              <CardContainer containerClassName="mx-auto w-full max-w-[540px]" className="h-full w-full">
                <CardBody className="h-full min-h-[300px] border border-foreground bg-surface p-6 shadow-[16px_18px_0_var(--shadow)] sm:min-h-[350px] sm:p-8">
                  <OrbitField className="opacity-80" />
                  <div className="absolute inset-3 border border-border/70" />
                  <div className="absolute right-0 bottom-0 h-28 w-28 border-t border-l border-border/70" />
                  <CardItem className="relative z-10 flex items-center justify-between" translateZ={50}>
                    <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-muted-foreground uppercase">
                      <Orbit className="size-4 text-accent" />
                      Field / 03D
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">00:01:26</span>
                  </CardItem>

                  <CardItem className="relative z-10 mt-16 max-w-sm" translateZ={82}>
                    <p className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase">Question signal</p>
                    <h2 className="mt-4 text-4xl leading-[0.95] font-medium tracking-[-0.06em] sm:text-5xl">
                      余白から、
                      <br />
                      本音を見る。
                    </h2>
                  </CardItem>

                  <CardItem className="absolute bottom-8 left-8 z-10" translateZ={42}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Rotate3D className="size-4" />
                      Hover to inspect depth
                    </div>
                  </CardItem>
                </CardBody>
              </CardContainer>
            </div>
          </ContainerScroll>
        </div>
        </section>

        <section className="border-t border-foreground" id="question-lab">
          <InterviewQuestionLab initialAnswers={initialAnswers} templates={templates} />
        </section>

        <section className="workflow-section workflow-section--content workflow-section--tall grid border-t border-foreground lg:grid-cols-[1.35fr_0.65fr]" data-workflow-section id="review">
          <div className="min-w-0 lg:border-r lg:border-foreground">
            <div className="flex items-center justify-between border-b border-border py-5">
              <div className="flex items-center gap-3">
                <NotebookPen className="size-4 text-accent" />
                <h2 className="text-sm font-semibold tracking-[0.16em] uppercase">Career notes</h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{entries.length} / 10</span>
            </div>

            {detail ? <p className="border-b border-border py-5 text-sm text-accent">{detail}</p> : null}

            {entries.length > 0 ? (
              <div>
                {entries.map((entry, index) => (
                  <motion.article
                    className="note-row group grid grid-cols-[44px_1fr_28px] gap-4 border-b border-border py-6 transition-[padding,background-color] hover:bg-surface hover:pl-3"
                    initial={{ opacity: 0, x: -12 }}
                    key={entry.id}
                    transition={{ delay: index * 0.06, duration: 0.35 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-medium tracking-tight">{entry.title}</h3>
                      <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {entry.content}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-accent" />
                  </motion.article>
                ))}
              </div>
            ) : (
              <div className="py-16 text-sm text-muted-foreground">まだメモがありません。最初の記録をここに置けます。</div>
            )}
          </div>

          <aside className="relative px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex items-center justify-between text-xs tracking-[0.16em] text-muted-foreground uppercase">
              <span>Reading axis</span>
              <Layers3 className="size-4" />
            </div>
            <CardContainer className="mt-8 w-full" containerClassName="w-full">
              <CardBody className="border border-border bg-surface-strong p-6">
                <CardItem className="relative z-10" translateZ={38}>
                  <div className="flex items-center justify-between border-b border-border pb-5">
                    <span className="font-mono text-3xl tracking-[-0.08em]">{entries.length.toString().padStart(2, "0")}</span>
                    <span className="text-xs text-muted-foreground">records</span>
                  </div>
                  <div className="mt-7 space-y-5 text-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Signal</span>
                      <span className="text-accent">active</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Storage</span>
                      <span>libSQL / local</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Layer</span>
                      <span className="flex items-center gap-2"><span className="size-1.5 bg-accent" /> 03</span>
                    </div>
                  </div>
                </CardItem>
              </CardBody>
            </CardContainer>
            <p className="mt-8 max-w-xs text-xs leading-5 text-muted-foreground">
              画面上の余白は、情報を減らすためではなく、思考の階層を見つけるためにあります。
            </p>
          </aside>
        </section>

        <section className="workflow-section workflow-section--content border-t border-foreground py-10 sm:py-14" data-workflow-section id="community">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
            <div>
              <p className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase">Build log / engineer made</p>
              <h2 className="mt-4 text-3xl leading-[0.95] font-medium tracking-[-0.06em] sm:text-5xl">
                選んだ理由も、
                <br />
                書いておく。
              </h2>
              <p className="mt-6 max-w-md text-sm leading-6 text-muted-foreground">
                このアプリは、IT エンジニアが設計・実装・改善しています。Aceternity UIの動きと3D CSSの奥行きを使いたくて、面接準備アプリを作り始めました。技術スタックを暗唱するだけでは味気ないので、なぜ選んだかも少しだけ残します。
              </p>
              <div className="mt-8 border-l-2 border-accent pl-4 text-xs leading-5 text-muted-foreground">
                <p className="text-foreground">無料枠を大切に運用中</p>
                <p className="mt-1">画面を見ているだけでは AI や保存 API を呼びません。必要な操作を押した時だけ通信します。</p>
              </div>
            </div>

            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              <div className="border-t border-border pt-4">
                <p className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">Stack / now</p>
                <p className="mt-3 text-sm leading-6">Next.js / TypeScript / Tailwind CSS / shadcn/ui / Aceternity UI</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">画面とサーバーを TypeScript でつなぎ、型の迷子を減らします。迷子になったら検索します。</p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">Backend / typed</p>
                <p className="mt-3 text-sm leading-6">Hono / Drizzle / Cloudflare D1</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Hono RPC はフロントと API の口約束を型にします。口約束だけで本番へ行くと、だいたい後で会議が増えます。</p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">AI / next</p>
                <p className="mt-3 text-sm leading-6">質問の組立、回答の補助、回答内容の採点を、ボタン操作で必要な時だけ実行します。</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">常時しゃべる AI は少し落ち着きがないので、呼ばれた時だけ働く方針です。</p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">UI / depth</p>
                <p className="mt-3 text-sm leading-6">Aceternity UI / Motion / 3D CSS</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">平らな管理画面を作るより、奥行きのあるUIを触りながら面接の記憶を組み立てたかったので、この形にしました。</p>
              </div>
              <div className="border-t border-accent/50 pt-4 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="size-4 text-accent" />
                    <p className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">Open build / no login</p>
                  </div>
                  <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">公開レビュー前提</span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6">
                  PRを受け付けたい。でも、個人情報を抜かれるのは嫌なので、ログインは設けません。変更はGitHub上で読める状態にします。
                  個人情報を抜くための改修や、こっそり送信先を増やす改修は受け入れません。OSSのコミット参加実績にでもしてください。
                </p>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
                  要望やバグはIssueへ。自分で直したくなったらPRへ。投稿には個人情報・認証情報・非公開の求人情報を貼らないでください。
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {githubRepoUrl ? (
                    <>
                      <a className="inline-flex h-9 items-center gap-2 border border-foreground bg-foreground px-3 text-xs text-background transition-transform hover:-translate-y-0.5" href={`${githubRepoUrl}/issues/new`} rel="noreferrer" target="_blank">
                        Issueを作る <ArrowUpRight className="size-3.5" />
                      </a>
                      <a className="inline-flex h-9 items-center gap-2 border border-border px-3 text-xs transition-transform hover:-translate-y-0.5 hover:border-accent hover:text-accent" href={`${githubRepoUrl}/compare`} rel="noreferrer" target="_blank">
                        PRを出す <ArrowUpRight className="size-3.5" />
                      </a>
                    </>
                  ) : (
                    <span className="inline-flex h-9 items-center border border-border px-3 text-xs text-muted-foreground">
                      GitHub URLを設定するとIssue / PR導線が開きます
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-border py-6 text-[10px] tracking-[0.18em] text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between">
          <span>Built by an engineer / Next.js / Hono / Drizzle / Cloudflare</span>
          <span>Designed for human recall</span>
        </footer>
      </div>
    </main>
  );
}
