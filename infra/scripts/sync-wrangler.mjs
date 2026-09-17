import { execFileSync } from "node:child_process";
import { writeFileSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

const infra = fileURLToPath(new URL("../", import.meta.url));
const config = JSON.parse(execFileSync("terraform", ["-chdir=" + infra, "output", "-json", "wrangler_config"], { encoding: "utf8" }));
if (!config.d1_databases?.[0]?.database_id || !config.account_id || !config.name) {
  throw new Error("Terraform output is incomplete. Apply the infrastructure first.");
}
const target = fileURLToPath(new URL("../../apps/web/wrangler.jsonc", import.meta.url));
writeFileSync(target + ".tmp", "// Generated from infra Terraform outputs. Run pnpm infra:sync after apply.\n" + JSON.stringify(config, null, 2) + "\n");
renameSync(target + ".tmp", target);
console.log("Updated apps/web/wrangler.jsonc from Terraform state.");
