resource "cloudflare_d1_database" "app" {
  account_id            = var.account_id
  name                  = var.database_name
  primary_location_hint = "apac"
  read_replication      = { mode = "disabled" }

  lifecycle {
    prevent_destroy = true
  }
}

# Terraform owns the Worker identity and settings. Vinext/Wrangler publishes
# code, assets and version bindings using the configuration output below.
resource "cloudflare_worker" "app" {
  account_id = var.account_id
  name       = var.worker_name
  observability = {
    enabled = true
  }
  subdomain = {
    enabled          = var.workers_dev_enabled
    previews_enabled = false
  }

  lifecycle {
    prevent_destroy = true
  }
}

locals {
  wrangler_config = {
    "$schema"           = "./node_modules/wrangler/config-schema.json"
    name                = cloudflare_worker.app.name
    account_id          = var.account_id
    main                = "vinext/server/app-router-entry"
    compatibility_date  = "2026-09-16"
    compatibility_flags = ["nodejs_compat"]
    workers_dev         = var.workers_dev_enabled
    preview_urls        = false
    ai                  = { binding = "AI" }
    assets              = { not_found_handling = "none" }
    d1_databases = [{
      binding        = "DB"
      database_name  = cloudflare_d1_database.app.name
      database_id    = cloudflare_d1_database.app.id
      migrations_dir = "../../packages/db/drizzle"
    }]
    observability = { enabled = true }
  }
}
