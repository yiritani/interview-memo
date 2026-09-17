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
