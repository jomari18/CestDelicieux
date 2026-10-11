export function assertSafeBundle(text: string): void {
  if (
    /sb_secret_[A-Za-z0-9_-]{12,}|SUPABASE_SERVICE_ROLE_KEY|ORS_API_KEY|[A-Z]:[\\/]Users[\\/]/i.test(
      text,
    )
  ) {
    throw Error("Sensitive configuration or developer path found in bundle");
  }
  for (const token of text.match(
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  ) ?? []) {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
    } catch {
      continue;
    }
    if (typeof payload.role === "string" && payload.role !== "anon")
      throw Error("A privileged or user JWT was found in the public bundle");
  }
}
