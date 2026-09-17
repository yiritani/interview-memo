const anonymousRateLimitBinding = "AI_GENERATION_LIMITER";

type RateLimitBinding = {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
};

function firstForwardedIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("cf-connecting-ip")?.trim() || forwarded || "unknown";
}

async function anonymousKey(request: Request) {
  const source = `${firstForwardedIp(request)}|${request.headers.get("user-agent")?.slice(0, 160) ?? "unknown"}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getRateLimitBinding(): Promise<RateLimitBinding | undefined> {
  try {
    const { env } = (await import(/* webpackIgnore: true */ "cloudflare:workers")) as unknown as {
      env?: Record<string, unknown>;
    };
    const binding = env?.[anonymousRateLimitBinding];
    return binding && typeof binding === "object" && "limit" in binding
      ? binding as RateLimitBinding
      : undefined;
  } catch {
    // Next.js development runs outside workerd. The Cloudflare binding is used after deployment.
    return undefined;
  }
}

export async function allowAiRequest(request: Request) {
  const binding = await getRateLimitBinding();
  if (!binding) return true;

  const result = await binding.limit({ key: `ai:${await anonymousKey(request)}` });
  return result.success;
}
