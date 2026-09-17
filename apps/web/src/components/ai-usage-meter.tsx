"use client";

import type { AiUsage } from "@/lib/ai-types";
import { APP_AI_DAILY_REQUEST_LIMIT, WORKERS_AI_FREE_DAILY_NEURON_LIMIT, WORKERS_EDGE_AI_REQUEST_LIMIT, WORKERS_EDGE_AI_REQUEST_PERIOD_SECONDS, WORKERS_FREE_DAILY_REQUEST_LIMIT } from "@/lib/ai-meter";

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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
          <p className="font-mono text-[10px] tracking-[0.12em] text-accent uppercase">AI requests / guard</p>
          <p className="mt-1 text-xs font-medium">{formatInteger(requestCount)} / {formatInteger(APP_AI_DAILY_REQUEST_LIMIT)}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">アプリ側の当日上限</p>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.12em] text-accent uppercase">CF req / free cap</p>
          <p className="mt-1 text-xs font-medium">{formatInteger(requestCount)} / {formatInteger(WORKERS_FREE_DAILY_REQUEST_LIMIT)}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">このブラウザのAI呼出し目安</p>
        </div>
      </div>
      <p className="mt-3 border-t border-border pt-2 text-[10px] leading-4 text-muted-foreground">
        AIは水筒方式で、必要な時だけ少しずつ。アプリ側は当日{APP_AI_DAILY_REQUEST_LIMIT}回、Cloudflare側は1分{WORKERS_EDGE_AI_REQUEST_LIMIT}回/IPで見張っています。Cloudflare Workersの無料枠は{formatInteger(WORKERS_FREE_DAILY_REQUEST_LIMIT)}リクエスト/日なので、全部使い切る前にお茶を飲みます。Neuronsとリクエスト数はこのブラウザの当日分の概算で、Neuronsの無料枠はUTC 0時にリセットされます。
      </p>
      <p className="mt-2 text-[10px] leading-4 text-muted-foreground">エッジの冷却時間: {WORKERS_EDGE_AI_REQUEST_PERIOD_SECONDS}秒。連打はAIにも人間にも効きません。</p>
    </div>
  );
}
