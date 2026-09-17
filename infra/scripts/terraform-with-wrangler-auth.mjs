import { spawnSync } from "node:child_process";

const auth = spawnSync("apps/web/node_modules/.bin/wrangler", ["auth", "token", "--json"], {
  encoding: "utf8",
});

if (auth.status !== 0) {
  process.stderr.write(auth.stderr || "Wrangler authentication failed. Run pnpm --filter @repo/web exec wrangler login.\n");
  process.exit(auth.status ?? 1);
}

let token;
try {
  token = JSON.parse(auth.stdout).token;
} catch {
  process.stderr.write("Wrangler did not return a usable authentication token.\n");
  process.exit(1);
}

const result = spawnSync("terraform", ["-chdir=infra", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, CLOUDFLARE_API_TOKEN: token },
});

process.exit(result.status ?? 1);
