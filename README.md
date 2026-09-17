# interview-memo

IT エンジニアの転職活動を補助する Next.js + Turborepo + Tailwind CSS + Drizzle ORM アプリです。現在の MVP は、経歴の箇条書きから想定面接質問を組み立てる機能に絞っています。

データベースは Cloudflare D1 を本番接続先にし、ローカルでは D1 と同じ SQLite 系の libSQL server を Docker Compose で起動します。D1 は Cloudflare のマネージド SQLite リレーショナルデータベースなので、MongoDB 形式のドキュメント DB が必要な場合は別の構成に差し替えてください。

## Requirements

- Node.js 22.12.0 以上
- asdf と pnpm プラグイン
- Docker Desktop
- Cloudflare アカウント（本番デプロイ時）

## Toolchain

このプロジェクトは `.tool-versions` で pnpm 12.4.2 を固定しています。asdf に pnpm プラグインがない場合だけ、先に追加します。

```bash
asdf plugin add pnpm https://github.com/jonathanmorley/asdf-pnpm.git
asdf plugin update pnpm
asdf install
pnpm --version
```

## Local development

```bash
pnpm install
pnpm dev:local
```

ブラウザで http://localhost:3000 を開きます。DB を停止するときは `pnpm db:down` を実行します。
接続先を変更する場合は `.env.example` を `.env` にコピーして `DATABASE_URL` を編集します。

## MVP: 想定面接質問

会社情報 → 経歴 → 想定質問の生成 → 各質問のメモから回答文を生成 → 比較・補助・採点 → 逆質問の生成、の順に進めます。初回の比較はメモと回答文、再生成時は前回と今回の回答文です。生成履歴は画面を開いている間だけ保持します。

各操作は `/api/ai/generate` を利用します。ローカル開発ではデフォルトで `local-driver` を使い、Cloudflare Workers AIを呼ばずに同じRPC形式の結果を返します。本番または明示的にCloudflareドライバを選んだ場合だけWorkers AIを呼びます。

フロントエンドからの回答保存・取得・削除と AI 生成は、Hono の RPC クライアントを通します。API の実装と型は `apps/web/src/server/app.ts` に集約し、Next.js の `/api/[[...route]]` から Hono を配信しています。ログイン未導入のため、現段階ではローカル環境を共有する単一ワークスペースとして扱います。

### AI のローカル接続

ローカル Next.js は、クレジットを消費しないローカルドライバを標準で使います。実際のWorkers AIを試す場合だけ、明示的にCloudflareドライバへ切り替えてください。

1. `pnpm --filter @repo/web exec wrangler login` で認証します。
2. `apps/web/.env.local` に `CLOUDFLARE_AI_DRIVER=cloudflare` を設定します。
3. `pnpm dev:local` を再起動します。

`wrangler.ai.jsonc` のリモートAI bindingだけを接続するため、D1作成やアプリのデプロイは不要です。APIトークンを使う場合は、代わりに `apps/web/.env.local` に `CLOUDFLARE_ACCOUNT_ID` と `CLOUDFLARE_API_TOKEN` を設定します。認証情報はサーバー側でのみ使用します。

モデルは `@cf/meta/llama-3.3-70b-instruct-fp8-fast`。JSON Schemaで応答形式を指定し、出力は最大1800トークンです。AIは明示的なボタン操作時のみ実行し、自動再試行しません。ローカルドライバはクレジットを消費せず、実推論へ切り替えた時だけCloudflareの利用枠を使います。

AI応答に使用量メタデータが含まれる場合は、画面に入力・出力トークン、合計クレジット、Workers AIの単価から計算した米ドル概算を表示します。Cloudflareアカウント全体の使用量APIは画面から参照せず、`CF requests` はこのブラウザのセッション内で数えたAI生成APIの成功数 / Workers Freeの1日上限という概算として表示します。使用量を返さない応答は「使用量未取得」「料金未計算」と表示します。

開発とビルドはともにwebpackを使用します。依存関係更新後の開発サーバーでモジュール解決エラーが残る場合は、開発サーバーを再起動してください。空・HTMLのAPI応答はJSON解析エラーではなくHTTPステータス付きのメッセージになります。

回帰テスト: `node --experimental-strip-types --test apps/web/tests/api-response.test.mjs`

## 公開開発とログインなしの方針

PRを受け付けたい。でも、個人情報を抜かれるのは嫌なので、ログインは設けません。アカウントや個人情報を集める前提を作らず、変更はGitHub上で読める状態にします。個人情報を抜くための改修や、利用者に説明せず送信先を増やす改修は受け入れません。

要望やバグはGitHub Issueへ、自分で直したい変更はPull Requestへ投稿してください。IssueやPRには個人情報、認証情報、非公開の求人情報を貼らないでください。リポジトリURLが決まったら、`.env` に `NEXT_PUBLIC_GITHUB_REPO_URL` を設定するとアプリ内の導線が有効になります。


質問テンプレートには `source_name`、`source_url`、`source_fetched_at` を持たせています。求人レビューサイトなどの外部情報は、利用規約と著作権を確認したうえで、本文の丸ごと保存ではなく要約・出典 URL・取得日時を登録する方針です。

## Cloudflare infrastructure

CloudflareのD1とWorkerは `infra/` のTerraformで管理します。初回セットアップ、認証、plan、apply、Wrangler設定の同期は [infra/README.md](infra/README.md) を参照してください。

`pnpm db:migrate:remote` はTerraformで作成したD1へDrizzleマイグレーションを適用します。アプリをWorkerへデプロイするときは、D1の状態を確認してから `pnpm --filter @repo/web deploy` を実行します。

## Workspace

- `apps/web`: Next.js App Router アプリ
- `packages/db`: Drizzle スキーマと D1 / libSQL の接続アダプター
