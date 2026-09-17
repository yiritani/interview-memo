import type { AiMode, AiResponse } from "@/lib/ai-types";

export type AiPayload = {
  mode: AiMode;
  career: string;
  company: string;
  target: string;
};

export type AiDriver = {
  name: "local";
  generate: (payload: AiPayload) => Promise<AiResponse>;
};

function localAnswerNotes(target: string) {
  try {
    return (JSON.parse(target) as { notes?: string }).notes?.trim() ?? "";
  } catch {
    return "";
  }
}

export const localAiDriver: AiDriver = {
  name: "local",
  async generate(payload) {
    const companyHint = payload.company.trim() ? "求人票に書かれた事業・開発体制・技術の実態" : "応募先の事業と開発チーム";

    if (payload.mode === "rewrite_answer") {
      const notes = localAnswerNotes(payload.target);
      if (!notes) throw new Error("回答メモを入力してください。");
      const body = notes.split(/\n+/).map((line) => line.replace(/^[\s・●\-*]+/, "").trim())
        .filter(Boolean).map((line) => /[。！？]$/.test(line) ? line : `${line}。`).join("\n");
      return {
        mode: payload.mode,
        provider: "local-driver",
        summary: "ローカルドライバで整えました。Cloudflare Workers AIは呼んでいないので、クレジットは減りません。",
        items: [{ title: "回答文（ローカル整形）", body }],
      };
    }

    if (payload.mode === "reverse_questions") {
      return {
        mode: payload.mode,
        provider: "local-driver",
        summary: "ローカルドライバが汎用的に確認価値の高い逆質問を出しました。AIのクレジットは温存中です。",
        items: [
          { title: "入社後の期待", body: "このポジションで、入社後3か月から半年の間に期待される成果は何ですか？" },
          { title: "技術と改善", body: `現在の${companyHint}に対して、チームが優先して改善したい課題は何ですか？` },
          { title: "協働の仕方", body: "エンジニアがプロダクトや仕様の意思決定に関わる場面と、その進め方を教えてください。" },
        ],
      };
    }

    if (payload.mode === "answer_support") {
      return {
        mode: payload.mode,
        provider: "local-driver",
        summary: "ローカルドライバの回答補助です。対象テキストに事実・行動・結果を足すと、回答の説得力が上がります。",
        items: [
          { title: "状況", body: "どのプロジェクトで、どんな課題が起きていたかを1文で足してください。" },
          { title: "行動", body: "自分が比較・判断・実装したことを、使った技術とともに具体化してください。" },
          { title: "結果", body: "レイテンシ、工数、障害件数、利用者数など、変化を示す数字を足してください。" },
        ],
      };
    }

    if (payload.mode === "score_answer") {
      const lengthScore = Math.min(25, Math.round(payload.target.trim().length / 12));
      const score = Math.min(100, 35 + lengthScore);
      return {
        mode: payload.mode,
        provider: "local-driver",
        summary: "ローカルドライバの簡易採点です。Cloudflare Workers AIは呼んでいません。",
        items: [
          { title: "総合スコア", body: "回答をSTAR（状況・課題・行動・結果）で組み直すと、採用担当者が追いやすくなります。", score },
          { title: "次に足すもの", body: "あなた自身の判断、周囲との協働、結果の数字をそれぞれ1つ追加してください。" },
        ],
      };
    }

    return {
      mode: payload.mode,
      provider: "local-driver",
      summary: "ローカルドライバが経歴と会社情報から基本の深掘り質問を組み立てました。AIのクレジットはお昼寝中です。",
      items: [
        { title: "事業との接点", body: "この会社の事業やプロダクトに対して、これまでの経験をどう活かせますか？" },
        { title: "技術判断", body: "求人に記載された技術や開発課題について、過去にどんな判断をしてきましたか？" },
        { title: "入社後の貢献", body: "入社後90日で、チームとプロダクトを理解しながら何から貢献しますか？" },
      ],
    };
  },
};
