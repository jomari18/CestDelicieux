import type { ApiResult } from "../../domain/contracts";
export class MutationAttempt {
  current: Record<string, unknown> | null = null;
  lock(request: Record<string, unknown>) {
    this.current ??= structuredClone({
      ...request,
      actionId: crypto.randomUUID(),
    });
    return structuredClone(this.current);
  }
  finish(
    result: ApiResult<unknown>,
  ): "saved" | "reload" | "retry" | "rejected" {
    if (result.ok) {
      this.current = null;
      return "saved";
    }
    const definite = new Set([
      "STALE_VERSION",
      "INVALID_REQUEST",
      "INVALID_MENU",
      "INVALID_POLICY",
      "INVALID_TRANSITION",
      "INVALID_MESSAGE",
      "NOT_FOUND",
      "SLUG_EXISTS",
      "STAFF_REQUIRED",
      "VERIFICATION_REQUIRED",
      "ACTION_CONFLICT",
      "RATE_LIMITED",
      "SETUP_REQUIRED",
    ]);
    if (!definite.has(result.code)) return "retry";
    this.current = null;
    return result.code === "STALE_VERSION" ? "reload" : "rejected";
  }
}
