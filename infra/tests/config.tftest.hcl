mock_provider "cloudflare" {}

variables {
  account_id = "00000000000000000000000000000000"
}

run "bindings_and_exposure" {
  command = plan

  assert {
    condition     = output.wrangler_config.workers_dev == true && output.wrangler_config.preview_urls == false
    error_message = "Infrastructure creation must not publish an unauthenticated app."
  }
  assert {
    condition     = output.wrangler_config.d1_databases[0].database_name == cloudflare_d1_database.app.name && output.wrangler_config.ai.binding == "AI"
    error_message = "Wrangler must use Terraform's D1 and the AI binding."
  }
}
