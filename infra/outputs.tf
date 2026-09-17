output "database_id" {
  value = cloudflare_d1_database.app.id
}

output "worker_id" {
  value = cloudflare_worker.app.id
}

output "wrangler_config" {
  description = "Runtime config consumed by infra/scripts/sync-wrangler.mjs."
  value       = local.wrangler_config
}
