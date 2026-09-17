export const WORKERS_FREE_DAILY_REQUEST_LIMIT = 100_000;
export const WORKERS_AI_FREE_DAILY_NEURON_LIMIT = 10_000;
export const APP_AI_DAILY_REQUEST_LIMIT = 12;
export const WORKERS_EDGE_AI_REQUEST_LIMIT = 6;
export const WORKERS_EDGE_AI_REQUEST_PERIOD_SECONDS = 60;

const storageKey = "interview-memo:ai-request-count";
const requestEvent = "interview-memo:ai-request-count-changed";
const neuronStorageKey = "interview-memo:ai-neuron-total";
const neuronEvent = "interview-memo:ai-neuron-total-changed";

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function browserStorage() {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return undefined;
    }
  }
}

export function getAiRequestCount() {
  if (typeof window === "undefined") return 0;
  try {
    const value = JSON.parse(browserStorage()?.getItem(storageKey) ?? "null") as { date?: string; count?: number } | null;
    return value?.date === todayUtc() && typeof value.count === "number" ? Math.max(0, value.count) : 0;
  } catch {
    return 0;
  }
}

export function recordAiRequest() {
  const count = getAiRequestCount() + 1;
  if (typeof window !== "undefined") {
    try {
      browserStorage()?.setItem(storageKey, JSON.stringify({ date: todayUtc(), count }));
      window.dispatchEvent(new CustomEvent<number>(requestEvent, { detail: count }));
    } catch {
      // Private browsing can disable sessionStorage; the in-memory caller still gets the count.
    }
  }
  return count;
}

export function canStartAiRequest() {
  return getAiRequestCount() < APP_AI_DAILY_REQUEST_LIMIT;
}

export function getAiRequestBudgetMessage() {
  const remaining = Math.max(0, APP_AI_DAILY_REQUEST_LIMIT - getAiRequestCount());
  return remaining > 0
    ? `本日のAI枠はあと${remaining}回です。AIにも定時があるので、ここぞという時に呼んでください。`
    : "本日のAI枠を使い切りました。UTCの日付が変わるまで、AIをお茶休憩にしています。";
}

export function subscribeToAiRequestCount(onChange: (count: number) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const count = (event as CustomEvent<number>).detail;
    if (typeof count === "number") onChange(count);
  };
  window.addEventListener(requestEvent, handler);
  return () => window.removeEventListener(requestEvent, handler);
}

export function getAiNeuronTotal() {
  if (typeof window === "undefined") return 0;
  try {
    const value = JSON.parse(window.sessionStorage.getItem(neuronStorageKey) ?? "null") as { date?: string; total?: number } | null;
    return value?.date === todayUtc() && typeof value.total === "number" ? Math.max(0, value.total) : 0;
  } catch {
    return 0;
  }
}

export function recordAiNeurons(neurons: number | undefined) {
  if (neurons === undefined || !Number.isFinite(neurons) || neurons <= 0) return getAiNeuronTotal();

  const total = getAiNeuronTotal() + Math.max(0, Math.round(neurons));
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(neuronStorageKey, JSON.stringify({ date: todayUtc(), total }));
      window.dispatchEvent(new CustomEvent<number>(neuronEvent, { detail: total }));
    } catch {
      // Private browsing can disable sessionStorage; the in-memory caller still gets the total.
    }
  }
  return total;
}

export function subscribeToAiNeuronTotal(onChange: (total: number) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const total = (event as CustomEvent<number>).detail;
    if (typeof total === "number") onChange(total);
  };
  window.addEventListener(neuronEvent, handler);
  return () => window.removeEventListener(neuronEvent, handler);
}
