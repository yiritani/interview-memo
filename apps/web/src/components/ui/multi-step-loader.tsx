"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type LoadingState = { text: string };

function CheckIcon({ filled, active }: { filled: boolean; active: boolean }) {
  return filled ? (
    <svg className={cn("size-5", active ? "text-accent" : "text-foreground/70")} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className={cn("size-5", active ? "text-accent" : "text-muted-foreground")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export function MultiStepLoader({
  loadingStates,
  loading,
  duration = 1400,
  loop = false,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
}) {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => {
      setCurrentState((value) => loop ? (value === loadingStates.length - 1 ? 0 : value + 1) : Math.min(value + 1, loadingStates.length - 1));
    }, duration);
    return () => window.clearTimeout(timeout);
  }, [currentState, duration, loading, loadingStates.length, loop]);

  return (
    <AnimatePresence mode="wait">
      {loading && loadingStates.length > 0 ? (
        <motion.div
          aria-live="polite"
          aria-label="AI生成の進捗"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 p-6 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative w-full max-w-md border border-foreground bg-surface p-6 shadow-[10px_10px_0_var(--shadow)]">
            <div className="absolute inset-x-0 top-0 h-px bg-accent" />
            <p className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">AI / processing</p>
            <div className="mt-6 space-y-3">
              {loadingStates.map((state, index) => {
                const distance = Math.abs(index - currentState);
                return (
                  <motion.div
                    animate={{ opacity: Math.max(1 - distance * 0.22, 0.28), x: index === currentState ? 6 : 0 }}
                    className="flex items-center gap-3 text-sm"
                    initial={{ opacity: 0, x: -8 }}
                    key={state.text}
                    transition={{ duration: 0.35 }}
                  >
                    <CheckIcon active={index === currentState} filled={index <= currentState} />
                    <span className={cn(index === currentState ? "text-accent" : "text-muted-foreground")}>{state.text}</span>
                  </motion.div>
                );
              })}
            </div>
            <p className="mt-6 text-[11px] leading-5 text-muted-foreground">入力内容は、生成ボタンを押した時だけAIへ送ります。</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
