# Cloudflare infrastructure

CloudflareのD1とWorkerのリソースはTerraformで管理します。アプリのWorkerコードと静的アセットのデプロイは既存のVinext/Wranglerコマンドが担当し、Terraformはリソースの存在・名前・binding・観測設定を担当します。

## 初回セットアップ

```bash
pnpm --filter @repo/web exec wrangler login
cp infra/terraform.tfvars.example infra/terraform.tfvars
# terraform.tfvars に自分の account_id を設定
pnpm infra:init
pnpm infra:plan
pnpm infra:apply
pnpm db:migrate:remote
```

`infra:plan` と `infra:apply` はWrangler OAuthトークンを一時的な環境変数としてTerraformへ渡します。トークンは画面に表示せず、Terraform stateにも保存しません。API Tokenを使うCIでは `CLOUDFLARE_API_TOKEN` をSecretとして設定し、通常のTerraformコマンドも利用できます。

`infra:apply` の後に `infra:sync` が実行され、Terraform outputから `apps/web/wrangler.jsonc` のD1 IDとWorker名を更新します。生成されたWrangler設定は編集せず、Terraformを変更して再同期してください。

## 管理対象

- `cloudflare_d1_database.app`: `interview-memo`。削除防止を有効にしています。
- `cloudflare_worker.app`: `interview-memo-web`。Workerのidentity、observability、workers.dev公開設定を管理します。
- `wrangler_config` output: AI binding、D1 binding、Rate Limiting binding、アセット設定をアプリのWranglerへ渡します。

## AIの防御

WorkerにはCloudflare Workers Rate Limiting bindingを設定し、AI生成をIP・Cloudflareロケーション単位で1分6回までに絞っています。アプリ側にも当日12回のブラウザガードと入力文字数上限があります。

`engineer-interview.online` をCloudflareのゾーンへ接続し、Workerには `app.engineer-interview.online` を紐付けています。Cloudflare Freeのゾーン側Rate Limitingで、`POST /api/ai/generate` を同一IPあたり6回 / 10秒、超過時10秒ブロックに設定しています。Worker側にも6回 / 60秒のRate Limiting bindingがあるため、二重にAI生成の使いすぎを抑えます。

TerraformのWAF定義は `terraform.tfvars` の `cloudflare_zone_id` にゾーンIDを設定すると有効になります。今回のルールはCloudflareダッシュボードから先に有効化しています。Terraform stateへ取り込む場合は、Zone:Edit権限を持つAPIトークンで既存Rulesetをimportしてから `pnpm infra:plan` / `pnpm infra:apply` を実行してください。既存のゾーンRulesetをTerraformで管理している場合も、先に既存stateへimportしてください。

`workers_dev_enabled = true` で workers.dev の公開URLを予備として残しています。通常の入口は `app.engineer-interview.online` です。CloudflareのカスタムドメインはWorkerダッシュボードで接続済みで、DNSの伝播後に利用できます。

Terraform stateは初期段階のためローカル管理です。複数人やCIで運用する段階では、stateを共有できるバックエンドへ移行します。
