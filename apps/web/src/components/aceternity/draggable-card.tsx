"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type DraggableCardProps = {
  eyebrow?: string;
  title: string;
  detail: string;
  marker?: string;
  className?: string;
};

export function DraggableCard({
  eyebrow = "Career mode",
  title,
  detail,
  marker = "→",
  className,
}: DraggableCardProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div
      className={cn("relative min-h-[18rem] overflow-hidden border border-border bg-surface-strong p-4", className)}
      ref={constraintsRef}
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(135deg,transparent_0%,transparent_48%,rgba(200,86,52,0.12)_48%,rgba(200,86,52,0.12)_49%,transparent_49%,transparent_100%)] [background-size:22px_22px]" />
      <motion.div
        className="relative mx-auto flex min-h-[15rem] w-full max-w-[23rem] cursor-grab flex-col justify-between border border-foreground bg-background p-5 shadow-[9px_10px_0_var(--shadow)] active:cursor-grabbing sm:p-6"
        drag={reducedMotion ? false : true}
        dragConstraints={constraintsRef}
        dragElastic={0.18}
        dragMomentum={false}
        whileDrag={reducedMotion ? undefined : { rotate: -2, scale: 1.03, zIndex: 10 }}
        whileHover={reducedMotion ? undefined : { rotate: 1.2, y: -3 }}
        transition={{ damping: 18, mass: 0.7, stiffness: 220, type: "spring" }}
      >
        <div className="flex items-center justify-between border-b border-border pb-3 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          <span>Last reminder / 06</span>
          <span className="text-accent">drag me</span>
        </div>
        <div className="py-7">
          <p className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">{eyebrow}</p>
          <h3 className="mt-4 text-3xl leading-[0.92] font-medium tracking-[-0.07em] sm:text-4xl">{title}</h3>
        </div>
        <div className="flex items-end justify-between gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span>{detail}</span>
          <span className="font-mono text-accent">{marker}</span>
        </div>
      </motion.div>
    </div>
  );
}
