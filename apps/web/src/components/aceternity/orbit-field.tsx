"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function OrbitField({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-[16%] [transform:rotateX(67deg)_rotateZ(-18deg)]">
        <motion.div
          animate={reducedMotion ? { rotate: 0 } : { rotate: 360 }}
          className="relative size-full rounded-full border border-accent/40"
          transition={{ duration: 18, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
        >
          <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_24px_var(--accent)]" />
        </motion.div>
      </div>
      <div className="absolute inset-[24%] [transform:rotateX(67deg)_rotateZ(34deg)]">
        <motion.div
          animate={reducedMotion ? { rotate: 0 } : { rotate: -360 }}
          className="relative size-full rounded-full border border-foreground/20"
          transition={{ duration: 12, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
        >
          <span className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full bg-foreground shadow-[0_0_18px_var(--foreground)]" />
        </motion.div>
      </div>
      <motion.div
        animate={reducedMotion ? { opacity: 0.25 } : { opacity: [0.18, 0.42, 0.18], scale: [0.96, 1.04, 0.96] }}
        className="absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/30"
        transition={{ duration: 5, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />
    </div>
  );
}
