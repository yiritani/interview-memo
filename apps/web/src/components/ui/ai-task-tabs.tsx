"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type AiTaskTab = {
  value: string;
  label: string;
};

export function AiTaskTabs({
  tabs,
  value,
  onValueChange,
}: {
  tabs: AiTaskTab[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div aria-label="AI task" className="grid grid-cols-2 border-y border-border" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.value === value;

        return (
          <button
            aria-selected={isActive}
            className={cn(
              "relative min-h-12 border-r border-border px-3 py-2 text-left text-[11px] tracking-[0.08em] text-muted-foreground uppercase transition-colors last:border-r-0 hover:text-foreground focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
              isActive && "text-foreground",
            )}
            key={tab.value}
            onClick={() => onValueChange(tab.value)}
            role="tab"
            type="button"
          >
            {isActive ? (
              <motion.span
                className="absolute inset-x-0 bottom-0 h-0.5 bg-accent"
                layoutId="ai-task-tab-indicator"
                transition={{ damping: 24, stiffness: 280, type: "spring" }}
              />
            ) : null}
            <motion.span
              animate={{ x: isActive ? 2 : 0 }}
              className="relative z-10 block"
              transition={{ damping: 24, stiffness: 280, type: "spring" }}
            >
              <span className="mr-2 font-mono text-accent">0{tabs.indexOf(tab) + 1}</span>
              {tab.label}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}
