import type {
  Fulfillment,
  OrderAction,
  OrderStatus,
  OrderDetail,
} from "./contracts";
export function nextStatus(
  fulfillment: Fulfillment,
  status: string,
  action: OrderAction["action"],
): OrderStatus | null {
  if (action === "reject" && status === "pending") return "rejected";
  if (action === "cancel" && ["pending", "accepted"].includes(status))
    return "cancelled";
  const edges: Record<string, [string, OrderStatus]> = {
    accept: ["pending", "accepted"],
    prepare: ["accepted", "preparing"],
    ready: ["preparing", "ready"],
  };
  if (fulfillment === "pickup") edges.complete = ["ready", "completed"];
  else {
    edges.dispatch = ["ready", "out_for_delivery"];
    edges.deliver = ["out_for_delivery", "delivered"];
  }
  return edges[action]?.[0] === status ? edges[action][1] : null;
}
export function canTransition(
  fulfillment: Fulfillment,
  status: string,
  action: OrderAction["action"],
): boolean {
  if (action === "collect_payment")
    return !["pending", "rejected", "cancelled"].includes(status);
  return nextStatus(fulfillment, status, action) !== null;
}
export function deriveAvailableActions(
  order: OrderDetail,
): OrderAction["action"][] {
  const actions: OrderAction["action"][] = [
    "accept",
    "prepare",
    "ready",
    "dispatch",
    "complete",
    "deliver",
    "reject",
    "cancel",
    "collect_payment",
  ];
  return actions.filter(
    (action) =>
      canTransition(order.fulfillment, order.status, action) &&
      (action !== "collect_payment" || order.paymentState === "unpaid"),
  );
}
