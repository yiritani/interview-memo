"use client";

import { motion } from "motion/react";
import { useCallback, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type CompareProps = {
  firstContent: ReactNode;
  secondContent: ReactNode;
  className?: string;
  initialSliderPercentage?: number;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
};

export function Compare({
  firstContent,
  secondContent,
  className,
  initialSliderPercentage = 50,
  slideMode = "drag",
  showHandlebar = true,
}: CompareProps) {
  const [sliderXPercent, setSliderXPercent] = useState(initialSliderPercentage);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback((clientX: number, currentTarget: HTMLDivElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const nextPercentage = ((clientX - rect.left) / rect.width) * 100;
    setSliderXPercent(Math.max(0, Math.min(100, nextPercentage)));
  }, []);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (slideMode === "hover" || (slideMode === "drag" && isDragging)) {
      updatePosition(event.clientX, event.currentTarget);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (slideMode !== "drag") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updatePosition(event.clientX, event.currentTarget);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (slideMode !== "drag") return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  };

  return (
    <div
      aria-label="Before and after comparison"
      className={cn("relative h-56 w-full touch-none overflow-hidden", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => {
        if (slideMode === "hover") setSliderXPercent(initialSliderPercentage);
      }}
      role="group"
    >
      <div className="absolute inset-0 h-full w-full">{secondContent}</div>
      <motion.div
        className="absolute inset-0 z-20 h-full w-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)` }}
      >
        {firstContent}
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-30 w-px bg-accent shadow-[0_0_18px_var(--accent)]"
        style={{ left: `${sliderXPercent}%` }}
      >
        {showHandlebar ? (
          <div className="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center border border-accent bg-background text-accent shadow-[4px_4px_0_var(--shadow)]">
            <span className="font-mono text-[10px]">↔</span>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
