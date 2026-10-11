import type { OrderRequest } from "../../domain/contracts";
export class CheckoutAttempt {
  current: OrderRequest | null = null;
  lock(request: OrderRequest) {
    if (!this.current) this.current = structuredClone(request);
    return structuredClone(this.current);
  }
  clear() {
    this.current = null;
  }
}
const known = new Set([
  "PRICE_CHANGED",
  "ITEM_UNAVAILABLE",
  "QUOTE_EXPIRED",
  "QUOTE_USED",
  "INVALID_QUOTE",
  "POLICY_CHANGED",
  "DELIVERY_DISABLED",
  "OUTSIDE_COVERAGE",
  "INVALID_REQUEST",
  "INVALID_ITEMS",
  "INVALID_RECIPIENT",
  "INVALID_CONTACT",
  "INVALID_FULFILLMENT",
  "INVALID_CART",
  "INVALID_DESTINATION",
  "TOTAL_TOO_LARGE",
  "INVALID_MESSAGE",
  "INVALID_ADDRESS",
  "INVALID_NOTES",
  "INVALID_TOTAL",
  "AUTH_REQUIRED",
  "VERIFICATION_REQUIRED",
  "REQUEST_CONFLICT",
  "REQUEST_ABANDONED",
  "SETUP_REQUIRED",
  "RATE_LIMITED",
]);
export function isUncertainFailure(code: string) {
  return !known.has(code);
}
