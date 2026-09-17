"use client";
import React, { useRef, useSyncExternalStore } from "react";
import {
  MotionValue,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

const mobileQuery = "(max-width: 768px)";

const subscribeToMobile = (callback: () => void) => {
  const mediaQuery = window.matchMedia(mobileQuery);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};

const getMobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const getMobileServerSnapshot = () => false;

export const ContainerScroll = ({
  titleComponent,
  children,
  compact = false,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );
  const reducedMotion = useReducedMotion();

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], reducedMotion || compact ? [0, 0] : [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reducedMotion || compact ? [1, 1] : scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], reducedMotion || compact ? [0, 0] : [0, -100]);

  return (
    <div
      className={cn(
        "relative flex p-2",
        compact
          ? "min-h-[38rem] items-start justify-start md:p-8"
          : "h-[60rem] items-center justify-center md:h-[80rem] md:p-20",
      )}
      ref={containerRef}
    >
      <div
        className={cn("relative w-full", compact ? "py-4 md:py-8" : "py-10 md:py-40")}
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card compact={compact} rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: any) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
  compact = false,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
  compact?: boolean;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className={cn(
        "mx-auto w-full max-w-5xl border-4 border-foreground/60 bg-foreground p-2 shadow-2xl",
        compact
          ? "mt-4 h-[min(46svh,24rem)] rounded-2xl md:h-[min(58svh,31rem)] md:rounded-[22px] md:p-4"
          : "-mt-12 h-[30rem] rounded-[30px] md:h-[40rem] md:p-6",
      )}
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-background md:rounded-2xl md:p-4">
        {children}
      </div>
    </motion.div>
  );
};
