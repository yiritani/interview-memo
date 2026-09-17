resource "cloudflare_ruleset" "ai_rate_limit" {
  count       = var.cloudflare_zone_id == "" ? 0 : 1
  zone_id     = var.cloudflare_zone_id
  name        = "Interview Memo AI generation firewall"
  description = "Keep anonymous AI generation traffic within the free-tier budget."
  kind        = "zone"
  phase       = "http_ratelimit"

  rules = [{
    ref         = "limit_ai_generation_per_ip"
    description = "Limit AI generation bursts per IP"
    expression  = "(http.request.uri.path eq \"/api/ai/generate\") and (http.request.method eq \"POST\")"
    action      = "block"
    ratelimit = {
      characteristics     = ["ip.src", "cf.colo.id"]
      period              = 10
      requests_per_period = 6
      mitigation_timeout  = 10
    }
  }]
}
