import { createClient } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

export function createLocalDb({ url, authToken }: { url: string; authToken?: string }) {
  const client = createClient({
    url,
    ...(authToken ? { authToken } : {}),
  });

  return drizzle(
    async (sql, params, method) => {
      const result = await client.execute({ sql, args: params });

      return {
        rows: method === "get" ? (result.rows[0] as unknown as Array<unknown>) : result.rows,
      };
    },
    { schema },
  );
}
