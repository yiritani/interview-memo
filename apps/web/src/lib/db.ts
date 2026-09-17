import "server-only";

export async function getDb() {
  const databaseUrl =
    process.env.DATABASE_URL ??
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:18080" : undefined);

  if (databaseUrl) {
    const { createLocalDb } = await import("@repo/db/local");
    return createLocalDb({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }

  const { env } = await import(/* webpackIgnore: true */ "cloudflare:workers");
  const { createD1Db } = await import("@repo/db/d1");
  return createD1Db(env.DB);
}
