import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { OrderDetail } from "../../domain/contracts";
import { useAuth } from "../auth/AuthProvider";
import { getMyOrder, cancelMyOrder } from "./api";
import { formatDate, formatMoney } from "../../domain/money";
import { Button } from "../../components/Button";
import { Dialog } from "../../components/Dialog";
import { StatusNotice } from "../../components/StatusNotice";
export function OrderContents({ order }: { order: OrderDetail }) {
  return (
    <>
      <div className="row space-between">
        <span className={"badge " + order.status}>
          {order.status.replaceAll("_", " ")}
        </span>
        <span>{order.fulfillment} · Pay on receipt</span>
      </div>
      <p className="reference">{order.reference}</p>
      <p className="muted">
        Placed {formatDate(order.createdAt)} · Philippine time
      </p>
      {order.items.map((item, i) => (
        <div className="summary-line" key={i}>
          <span>
            {item.quantity} × {item.name}
          </span>
          <strong>{formatMoney(item.quantity * item.unitPriceCentavos)}</strong>
        </div>
      ))}
      <hr className="divider" />
      <div className="summary-line">
        <span>Subtotal</span>
        <strong>{formatMoney(order.subtotalCentavos)}</strong>
      </div>
      <div className="summary-line">
        <span>
          Delivery{" "}
          {order.distanceMetres !== null
            ? `(${(order.distanceMetres / 1000).toFixed(2)} km)`
            : ""}
        </span>
        <strong>{formatMoney(order.deliveryFeeCentavos)}</strong>
      </div>
      <div className="summary-line total">
        <span>Total</span>
        <strong>{formatMoney(order.totalCentavos)}</strong>
      </div>
      <p>
        Payment:{" "}
        <strong>
          {order.paymentState === "collected"
            ? "Collected"
            : "Unpaid — due on receipt"}
        </strong>
      </p>
      <hr className="divider" />
      <h3>Recipient</h3>
      <p>
        {order.recipient.name}
        <br />
        {order.recipient.phone}
      </p>
      {order.address && <p>{order.address}</p>}
      {order.notes && <p>Kitchen notes: {order.notes}</p>}
      <h3>Your order’s journey</h3>
      <ol className="timeline">
        {order.events.map((e) => (
          <li key={e.id}>
            <strong>{e.action.replaceAll("_", " ")}</strong>
            <span>{formatDate(e.createdAt)} · PHT</span>
          </li>
        ))}
      </ol>
    </>
  );
}
export function OrderDetailPage() {
  const { id } = useParams(),
    auth = useAuth(),
    [order, setOrder] = useState<OrderDetail | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false),
    action = useRef<string | null>(null);
  async function load() {
    if (!id) return;
    setBusy(true);
    const epoch = auth.scope.capture(),
      result = await getMyOrder(id);
    if (!auth.scope.isCurrent(epoch)) return;
    setBusy(false);
    if (result.ok) {
      setOrder(result.data);
      setError("");
    } else setError(result.message);
  }
  useEffect(() => {
    setOrder(null);
    setError("");
    if (auth.verified) void load();
  }, [id, auth.session?.user.id, auth.verified]);
  async function cancel() {
    if (!order || busy) return;
    setBusy(true);
    const epoch = auth.scope.capture();
    action.current ??= crypto.randomUUID();
    const result = await cancelMyOrder(order.id, order.version, action.current);
    if (!auth.scope.isCurrent(epoch)) return;
    setBusy(false);
    if (result.ok) {
      setOrder(result.data);
      setConfirm(false);
      action.current = null;
    } else {
      setError(result.message);
      if (result.code === "STALE_VERSION") {
        action.current = null;
        setConfirm(false);
        await load();
      }
    }
  }
  return (
    <section className="page-width content-page narrow">
      <div className="page-heading">
        <Link className="back-link" to="/orders">
          ← Your orders
        </Link>
        <h1>Your meal, in motion.</h1>
      </div>
      <StatusNotice error message={error} />
      {auth.loading || (busy && !order) ? (
        <p className="loading">Loading order…</p>
      ) : !auth.verified ? (
        <div className="cream-card">
          <Link className="button" to="/auth?next=/orders">
            Sign in to view your order
          </Link>
        </div>
      ) : (
        <div className="cream-card">
          {order ? (
            <>
              <OrderContents order={order} />
              <Button variant="outline" busy={busy} onClick={load}>
                Refresh order
              </Button>
              {order.status === "pending" && (
                <Button variant="outline" onClick={() => setConfirm(true)}>
                  Cancel order
                </Button>
              )}
            </>
          ) : (
            <Button onClick={load}>Retry loading order</Button>
          )}
        </div>
      )}
      <Dialog
        open={confirm}
        title="Cancel this order?"
        onClose={() => setConfirm(false)}
      >
        <p>
          Only pending orders can be cancelled by customers. This releases the
          request to the team.
        </p>
        <StatusNotice error message={error} />
        <div className="dialog-actions">
          <Button busy={busy} onClick={cancel}>
            Confirm cancellation
          </Button>
          <Button variant="outline" onClick={() => setConfirm(false)}>
            Keep order
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
