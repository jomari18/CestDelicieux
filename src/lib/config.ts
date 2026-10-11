import type { ApiResult } from "../domain/contracts";
export function readPublicConfig(
  env: Record<string, string | undefined>,
): ApiResult<{ url: string; publishableKey: string }> {
  const url = env.VITE_SUPABASE_URL?.trim(),
    publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey)
    return {
      ok: false,
      code: "SETUP_REQUIRED",
      message:
        "Connect the dedicated restaurant Supabase project to enable the menu and account features.",
    };
  try {
    if (
      new URL(url).protocol !== "https:" &&
      !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(url)
    )
      throw new Error();
  } catch {
    return {
      ok: false,
      code: "INVALID_CONFIG",
      message: "The restaurant backend URL is invalid.",
    };
  }
  if (publishableKey.startsWith("sb_secret_"))
    return {
      ok: false,
      code: "INVALID_CONFIG",
      message: "Use a public publishable key, never a server secret.",
    };
  if (!publishableKey.startsWith("sb_publishable_")) {
    try {
      const role = JSON.parse(
        atob(
          publishableKey.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
        ),
      ).role;
      if (role !== "anon") throw Error();
    } catch {
      return {
        ok: false,
        code: "INVALID_CONFIG",
        message: "Use the restaurant project’s public publishable key.",
      };
    }
  }
  return { ok: true, data: { url, publishableKey } };
}
