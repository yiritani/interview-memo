"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

type CardContextValue = {
  isMouseEntered: boolean;
  reducedMotion: boolean;
};

const CardContext = createContext<CardContextValue>({
  isMouseEntered: false,
  reducedMotion: false,
});

type CardContainerProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
};

export function CardContainer({ children, className, containerClassName }: CardContainerProps) {
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [11, -11]), {
    damping: 20,
    mass: 0.65,
    stiffness: 180,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-13, 13]), {
    damping: 20,
    mass: 0.65,
    stiffness: 180,
  });
  const glareX = useTransform(pointerX, [-0.5, 0.5], ["18%", "82%"]);
  const glareY = useTransform(pointerY, [-0.5, 0.5], ["18%", "82%"]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, color-mix(in srgb, var(--accent) 22%, transparent), transparent 34%)`;

  const resetPointer = () => {
    setIsMouseEntered(false);
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      className={cn("flex items-center justify-center", containerClassName)}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setIsMouseEntered(true);
      }}
      onPointerLeave={resetPointer}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
        pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      style={{ perspective: "1200px" }}
    >
      <motion.div
        animate={{
          scale: reducedMotion ? 1 : isMouseEntered ? 1.025 : 1,
          y: reducedMotion ? 0 : isMouseEntered ? -4 : 0,
        }}
        className={cn("relative w-full [transform-style:preserve-3d]", className)}
        style={{
          rotateX: reducedMotion ? 0 : rotateX,
          rotateY: reducedMotion ? 0 : rotateY,
        }}
        transition={{ damping: 22, mass: 0.7, stiffness: 180, type: "spring" }}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-50 rounded-[inherit] opacity-0 transition-opacity duration-300"
          animate={{ opacity: reducedMotion ? 0 : isMouseEntered ? 1 : 0 }}
          style={{ background: glare, transform: "translateZ(1px)" }}
        />
        <CardContext.Provider value={{ isMouseEntered, reducedMotion }}>{children}</CardContext.Provider>
      </motion.div>
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("relative h-full w-full [transform-style:preserve-3d]", className)}>{children}</div>;
}

export function CardItem({
  children,
  className,
  translateZ = 0,
}: {
  children: React.ReactNode;
  className?: string;
  translateZ?: number;
}) {
  const { isMouseEntered, reducedMotion } = useContext(CardContext);

  return (
    <motion.div
      animate={{ translateZ: reducedMotion ? 0 : isMouseEntered ? translateZ : 0 }}
      className={cn("[transform-style:preserve-3d]", className)}
      transition={{ damping: 18, mass: 0.5, stiffness: 180, type: "spring" }}
    >
      {children}
    </motion.div>
  );
}
