import { cn } from "@/lib/utils";

export function Spotlight({ className, fill = "#d85f38" }: { className?: string; fill?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute z-0 opacity-70", className)}
      fill="none"
      height="100%"
      viewBox="0 0 1200 800"
      width="100%"
    >
      <defs>
        <radialGradient cx="50%" cy="0%" id="interview-spotlight" r="70%">
          <stop offset="0%" stopColor={fill} stopOpacity="0.22" />
          <stop offset="42%" stopColor={fill} stopOpacity="0.07" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect fill="url(#interview-spotlight)" height="800" width="1200" />
    </svg>
  );
}
