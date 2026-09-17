"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TerminalProps = {
  commands: string[];
  outputs?: Record<number, string[]>;
  username?: string;
  className?: string;
  typingSpeed?: number;
  delayBetweenCommands?: number;
  initialDelay?: number;
};

type CompletedCommand = {
  command: string;
  output: string[];
};

export function Terminal({
  commands,
  outputs = {},
  username = "user",
  className,
  typingSpeed = 28,
  delayBetweenCommands = 760,
  initialDelay = 420,
}: TerminalProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [completedCommands, setCompletedCommands] = useState<CompletedCommand[]>([]);
  const [typedCommand, setTypedCommand] = useState("");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (commands.length === 0) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    if (reducedMotion) {
      timer = setTimeout(() => {
        if (cancelled) return;
        setCompletedCommands(commands.map((command, index) => ({ command, output: outputs[index] ?? [] })));
        setTypedCommand("");
      }, 0);
      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    }

    let commandIndex = 0;
    let characterIndex = 0;

    const typeNextCharacter = () => {
      if (cancelled) return;
      const command = commands[commandIndex];

      if (characterIndex <= command.length) {
        setTypedCommand(command.slice(0, characterIndex));
        characterIndex += 1;
        timer = setTimeout(typeNextCharacter, typingSpeed);
        return;
      }

      setCompletedCommands((current) => [
        ...current,
        { command, output: outputs[commandIndex] ?? [] },
      ]);
      setTypedCommand("");
      commandIndex += 1;
      characterIndex = 0;

      if (commandIndex >= commands.length) {
        timer = setTimeout(() => {
          if (cancelled) return;
          setCompletedCommands([]);
          commandIndex = 0;
          timer = setTimeout(typeNextCharacter, delayBetweenCommands);
        }, delayBetweenCommands * 3);
        return;
      }

      timer = setTimeout(typeNextCharacter, delayBetweenCommands);
    };

    timer = setTimeout(() => {
      if (cancelled) return;
      setCompletedCommands([]);
      setTypedCommand("");
      typeNextCharacter();
    }, initialDelay);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [commands, delayBetweenCommands, initialDelay, outputs, reducedMotion, typingSpeed]);

  return (
    <div
      aria-label="Interview Memoの使い方を表示するターミナル"
      className={cn(
        "relative overflow-hidden border border-foreground bg-[#1d1b18] text-[#f7f4ed] shadow-[10px_12px_0_var(--shadow)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/15 px-4 py-3 font-mono text-[10px] text-white/60">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#c85634]" />
          <span className="size-2.5 rounded-full bg-[#b9b0a0]" />
          <span className="size-2.5 rounded-full bg-[#f7f4ed]" />
        </div>
        <span className="truncate">interview-memo — bash</span>
        <span className="ml-auto text-accent">live</span>
      </div>

      <div className="relative min-h-[23rem] overflow-hidden px-4 py-5 font-mono text-xs leading-6 sm:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(247,244,237,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(247,244,237,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative">
          {completedCommands.map((item, index) => (
            <div className="mb-3" key={`${item.command}-${index}`}>
              <div className="break-words">
                <span className="text-accent">{username}@interview-memo</span>
                <span className="text-white/50">:</span>
                <span className="text-[#ded8ca]">~/prepare</span>
                <span className="text-white/60">$ </span>
                <span>{item.command}</span>
              </div>
              {item.output.map((line) => (
                <div className="pl-4 text-[#ded8ca]" key={line}>
                  <span className="mr-2 text-accent">›</span>
                  {line}
                </div>
              ))}
            </div>
          ))}

          <div className="break-words">
            <span className="text-accent">{username}@interview-memo</span>
            <span className="text-white/50">:</span>
            <span className="text-[#ded8ca]">~/prepare</span>
            <span className="text-white/60">$ </span>
            <span>{typedCommand}</span>
            <span aria-hidden="true" className="ml-0.5 text-accent">▋</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/15 px-4 py-2 font-mono text-[10px] text-white/50 sm:px-6">
        <span>flow / company → career → answer</span>
        <span>{completedCommands.length.toString().padStart(2, "0")} / {commands.length.toString().padStart(2, "0")}</span>
      </div>
    </div>
  );
}
