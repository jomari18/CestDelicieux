import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { OrderSummary } from "../../domain/contracts";
import { useAuth } from "../auth/AuthProvider";
import { listMyOrders } from "./api";
import { formatDate, formatMoney } from "../../domain/money";
import { Button } from "../../components/Button";
import { StatusNotice } from "../../components/StatusNotice";
export function OrderHistoryPage() {
  const auth = useAuth(),
    [orders, setOrders] = useState<OrderSummary[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function load(next: string | null = null) {
    setBusy(true);
    const epoch = auth.scope.capture(),
      result = await listMyOrders(next);
    if (!auth.scope.isCurrent(epoch)) return;
    setBusy(false);
    if (result.ok) {
      setOrders((previous) =>
        next ? [...previous, ...result.data.items] : result.data.items,
      );
      setCursor(result.data.nextCursor);
      setError("");
    } else setError(result.message);
  }
  useEffect(() => {
    setOrders([]);
    setCursor(null);
    setError("");
    if (auth.verified) void load();
  }, [auth.session?.user.id, auth.verified]);
  return (
    <section className="page-width content-page">
      <div className="page-heading">
        <span className="eyebrow">Good meals, remembered</span>
        <h1>Your orders.</h1>
        <p>Follow your meal from the kitchen to your table.</p>
      </div>
      {!auth.session ? (
        <div className="cream-card empty-state">
          <h2>Your own delicious history.</h2>
          <Link className="button" to="/auth?next=/orders">
            Sign in
          </Link>
        </div>
      ) : !auth.verified ? (
        <div className="cream-card">
          <Link className="button" to="/verify">
            Verify email to view orders
          </Link>
        </div>
      ) : (
        <>
          <StatusNotice error message={error} />
          <Button variant="outline" busy={busy} onClick={() => load()}>
            Refresh orders
          </Button>
          {!busy && !error && !orders.length ? (
            <div className="cream-card empty-state">
              <h2>Your first meal is waiting.</h2>
              <Link className="button" to="/menu">
                Discover the menu
              </Link>
            </div>
          ) : (
            <div className="order-grid">
              {orders.map((o) => (
                <article key={o.id} className="cream-card history-card">
                  <div className="row space-between">
                    <span className={"badge " + o.status}>
                      {o.status.replaceAll("_", " ")}
                    </span>
                    <span className="muted">{o.fulfillment}</span>
                  </div>
                  <h2>{formatMoney(o.totalCentavos)}</h2>
                  <p>{formatDate(o.createdAt)} · Philippine time</p>
                  <p>
                    Payment{" "}
                    {o.paymentState === "collected"
                      ? "collected"
                      : "due on receipt"}
                  </p>
                  <p className="reference">{o.reference}</p>
                  <Link
                    className="button outline full-width"
                    to={`/orders/${o.id}`}
                  >
                    View order →
                  </Link>
                </article>
              ))}
            </div>
          )}
          {cursor && (
            <Button busy={busy} onClick={() => load(cursor)}>
              Load more orders
            </Button>
          )}
        </>
      )}
    </section>
  );
}
