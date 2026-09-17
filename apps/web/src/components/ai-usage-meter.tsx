"use client";

import type { AiUsage } from "@/lib/ai-types";
import { WORKERS_AI_FREE_DAILY_NEURON_LIMIT, WORKERS_FREE_DAILY_REQUEST_LIMIT } from "@/lib/ai-meter";

function formatInteger(value: number) {
  return new Intl.NumberFormat("ja-JP").format(Math.max(0, Math.round(value)));
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 6,
    minimumFractionDigits: 4,
    style: "currency",
  }).format(value);
}

export function AiUsageMeter({ usage, requestCount, neuronTotal }: { usage?: AiUsage; requestCount: number; neuronTotal?: number }) {
  const total = usage?.totalTokens;
  const tokenDetail = usage?.inputTokens !== undefined || usage?.outputTokens !== undefined
    ? `${formatInteger(usage.inputTokens ?? 0)} in / ${formatInteger(usage.outputTokens ?? 0)} out`
    : null;
  const showNeuronUsage = usage?.neurons !== undefined || (neuronTotal ?? 0) > 0;

  return (
    <div className="border border-accent/30 bg-background/70 px-3 py-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.12em] text-accent uppercase">AI tokens</p>
          <p className="mt-1 text-xs font-medium">
            {total !== undefined ? `${formatInteger(total)} tokens` : "使用量未取得"}
          </p>
          {tokenDetail ? <p className="mt-1 text-[10px] text-muted-foreground">{tokenDetail}</p> : null}
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.12em] text-accent uppercase">Workers AI neurons</p>
          <p className="mt-1 text-xs font-medium">
            {showNeuronUsage ? `${formatInteger(neuronTotal ?? usage?.neurons ?? 0)} / ${formatInteger(WORKERS_AI_FREE_DAILY_NEURON_LIMIT)}` : "使用量未取得"}
          </p>
          {usage?.neurons !== undefined ? <p className="mt-1 text-[10px] text-muted-foreground">今回 {formatInteger(usage.neurons)} neurons</p> : null}
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.12em] text-accent uppercase">Estimated cost</p>
          <p className="mt-1 text-xs font-medium">{usage?.estimatedCostUsd !== undefined ? formatUsd(usage.estimatedCostUsd) : "料金未計算"}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Neurons単価による概算</p>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.12em] text-accent uppercase">CF requests</p>
          <p className="mt-1 text-xs font-medium">{formatInteger(requestCount)} / {formatInteger(WORKERS_FREE_DAILY_REQUEST_LIMIT)}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">このブラウザ / 1日無料枠</p>
        </div>
      </div>
      <p className="mt-3 border-t border-border pt-2 text-[10px] leading-4 text-muted-foreground">
        Neuronsとリクエスト数は、このブラウザのセッション内で記録した当日分の概算です。Cloudflareアカウント全体の実績とは一致せず、Neuronsの無料枠はUTC 0時にリセットされます。
      </p>
    </div>
  );
}
