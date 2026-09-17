"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

const defaultGradientColors = [
  "rgb(200, 86, 52)",
  "rgb(241, 161, 95)",
  "rgb(120, 91, 72)",
];

const noisePattern =
  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\' viewBox=\'0 0 140 140\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.82\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%\' height=\'100%\' filter=\'url(%23noise)\' opacity=\'.65\'/%3E%3C/svg%3E")';

function GradientLayer({
  springX,
  springY,
  gradientColor,
  opacity,
  multiplier,
}: {
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  gradientColor: string;
  opacity: number;
  multiplier: number;
}) {
  const x = useTransform(springX, (value) => value * multiplier);
  const y = useTransform(springY, (value) => value * multiplier);
  const background = useMotionTemplate`radial-gradient(circle at ${x}px ${y}px, ${gradientColor} 0%, transparent 55%)`;

  return <motion.div className="absolute inset-0" style={{ background, opacity }} />;
}

export function NoiseBackground({
  children,
  className,
  containerClassName,
  gradientColors = defaultGradientColors,
  noiseIntensity = 0.2,
  speed = 0.1,
  backdropBlur = false,
  animating = true,
}: {
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
  gradientColors?: string[];
  noiseIntensity?: number;
  speed?: number;
  backdropBlur?: boolean;
  animating?: boolean;
}) {
  const colors = gradientColors.length > 0 ? gradientColors : defaultGradientColors;
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 100, damping: 30 });
  const springY = useSpring(y, { stiffness: 100, damping: 30 });
  const topGradientX = useTransform(springX, (value) => value * 0.1 - 50);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastDirectionChangeRef = useRef(0);
  const generateVelocity = useRef(() => {
    const angle = Math.random() * Math.PI * 2;
    const magnitude = speed * (0.5 + Math.random() * 0.5);
    return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    x.set(rect.width / 2);
    y.set(rect.height / 2);
  }, [x, y]);

  useEffect(() => {
    generateVelocity.current = () => {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.5 + Math.random() * 0.5);
      return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
    };
    velocityRef.current = generateVelocity.current();
  }, [speed]);

  useAnimationFrame((time) => {
    if (!animating || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (time - lastDirectionChangeRef.current > 1500 + Math.random() * 1500) {
      velocityRef.current = generateVelocity.current();
      lastDirectionChangeRef.current = time;
    }

    const padding = 20;
    let nextX = x.get() + velocityRef.current.x * 16;
    let nextY = y.get() + velocityRef.current.y * 16;
    if (nextX < padding || nextX > rect.width - padding || nextY < padding || nextY > rect.height - padding) {
      velocityRef.current = generateVelocity.current();
      nextX = Math.max(padding, Math.min(rect.width - padding, nextX));
      nextY = Math.max(padding, Math.min(rect.height - padding, nextY));
      lastDirectionChangeRef.current = time;
    }
    x.set(nextX);
    y.set(nextY);
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-neutral-200 p-2 backdrop-blur-sm dark:bg-neutral-800",
        "shadow-[0px_0.5px_1px_0px_var(--color-neutral-400)_inset,0px_1px_0px_0px_var(--color-neutral-100)]",
        backdropBlur && "after:absolute after:inset-0 after:z-[5] after:h-full after:w-full after:backdrop-blur-lg after:content-['']",
        containerClassName,
      )}
    >
      <GradientLayer springX={springX} springY={springY} gradientColor={colors[0]} opacity={0.4} multiplier={1} />
      <GradientLayer springX={springX} springY={springY} gradientColor={colors[1] ?? colors[0]} opacity={0.3} multiplier={0.7} />
      <GradientLayer springX={springX} springY={springY} gradientColor={colors[2] ?? colors[0]} opacity={0.25} multiplier={1.2} />
      <motion.div
        className="absolute inset-x-0 top-0 h-1 opacity-80 blur-sm"
        style={{ background: `linear-gradient(to right, ${colors.join(", ")})`, x: animating ? topGradientX : 0 }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-[var(--noise-opacity)]"
        style={{ backgroundImage: noisePattern, mixBlendMode: "overlay", "--noise-opacity": noiseIntensity } as CSSProperties}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
