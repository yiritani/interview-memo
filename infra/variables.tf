variable "account_id" {
  description = "Cloudflare account containing this application's resources."
  type        = string
  validation {
    condition     = can(regex("^[a-f0-9]{32}$", var.account_id))
    error_message = "account_id must be a 32-character Cloudflare account ID."
  }
}

variable "worker_name" {
  type    = string
  default = "interview-memo-web"
}

variable "database_name" {
  type    = string
  default = "interview-memo"
}

variable "workers_dev_enabled" {
  description = "Enable the public workers.dev endpoint for the deployed application."
  type        = bool
  default     = true
}

variable "cloudflare_zone_id" {
  description = "Optional zone ID for a Terraform-managed WAF rate limit. Leave empty while using workers.dev."
  type        = string
  default     = ""
  validation {
    condition     = var.cloudflare_zone_id == "" || can(regex("^[a-f0-9]{32}$", var.cloudflare_zone_id))
    error_message = "cloudflare_zone_id must be empty or a 32-character Cloudflare zone ID."
  }
}
