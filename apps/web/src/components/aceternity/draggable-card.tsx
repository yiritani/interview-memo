"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export type DraggableCardItem = {
  id: string;
  eyebrow: string;
  title: string;
  detail: string;
  marker: string;
  rotate: number;
  positionClass: string;
};

export function DraggableCardBoard({
  cards,
  className,
}: {
  cards: DraggableCardItem[];
  className?: string;
}) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div
      className={cn("relative overflow-hidden border border-foreground bg-[#1d1b18] text-[#f7f4ed] shadow-[10px_12px_0_var(--shadow)]", className)}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/15 px-4 py-3 font-mono text-[10px] text-white/60 sm:px-5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#c85634]" />
          <span className="size-2.5 rounded-full bg-[#b9b0a0]" />
          <span className="size-2.5 rounded-full bg-[#f7f4ed]" />
        </div>
        <span>draggable-card / interview memo</span>
        <span className="ml-auto text-accent">{cards.length} cards / free drag</span>
      </div>
      <div className="relative min-h-[30rem] overflow-hidden p-4 sm:min-h-[32rem] sm:p-6" ref={constraintsRef}>
        <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(135deg,transparent_0%,transparent_48%,rgba(200,86,52,0.12)_48%,rgba(200,86,52,0.12)_49%,transparent_49%,transparent_100%)] [background-size:22px_22px]" />
        <p className="pointer-events-none absolute bottom-4 left-4 z-[60] max-w-[13rem] font-mono text-[10px] leading-5 text-accent sm:left-6">
          遊んでないで転職準備しなよ。
        </p>
        {cards.map((card, index) => (
          <motion.div
            className={cn(
              "absolute flex min-h-[13rem] w-[72%] cursor-grab flex-col justify-between border border-foreground bg-background p-5 text-foreground shadow-[9px_10px_0_var(--shadow)] active:cursor-grabbing sm:w-[58%] sm:p-6",
              card.positionClass,
            )}
            drag={reducedMotion ? false : true}
            dragConstraints={constraintsRef}
            dragElastic={0.18}
            dragMomentum={false}
            key={card.id}
            style={{ rotate: card.rotate, zIndex: index + 1 }}
            whileDrag={reducedMotion ? undefined : { scale: 1.04, zIndex: 50 }}
            whileHover={reducedMotion ? undefined : { scale: 1.02, y: -4 }}
            transition={{ damping: 18, mass: 0.7, stiffness: 220, type: "spring" }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              <span>{card.eyebrow}</span>
              <span className="text-accent">{card.marker}</span>
            </div>
            <div className="py-5">
              <h3 className="text-2xl leading-[0.92] font-medium tracking-[-0.07em] sm:text-3xl">{card.title}</h3>
            </div>
            <div className="border-t border-border pt-3 text-xs text-muted-foreground">{card.detail}</div>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/15 px-4 py-2 font-mono text-[10px] text-white/50 sm:px-5">
        <span>drag / drop / prepare</span>
        <span>no login required</span>
      </div>
    </div>
  );
}
