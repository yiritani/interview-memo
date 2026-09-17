terraform {
  required_version = ">= 1.10, < 2.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.25.0"
    }
  }
}

# Authentication comes from CLOUDFLARE_API_TOKEN, never from state or tfvars.
provider "cloudflare" {}
