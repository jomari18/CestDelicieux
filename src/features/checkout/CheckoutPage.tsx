import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type {
  Coordinates,
  DeliveryPolicy,
  DeliveryQuote,
  Fulfillment,
  OrderDetail,
  OrderRequest,
} from "../../domain/contracts";
import { reconcileCart } from "../../domain/cart";
import { formatMoney } from "../../domain/money";
import { normalizePhone, validateOrder } from "../../domain/validation";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../cart/CartProvider";
import { useCatalog } from "../catalog/CatalogProvider";
import { DeliveryQuotePanel } from "../delivery/DeliveryQuotePanel";
import { getDeliveryPolicy } from "../delivery/api";
import {
  placeOrder,
  findMyOrderRequest,
  resolveUnknownRequest,
} from "../orders/api";
import { CheckoutAttempt, isUncertainFailure } from "./state";
import { Button } from "../../components/Button";
import { Dialog } from "../../components/Dialog";
import { StatusNotice } from "../../components/StatusNotice";
export function CheckoutPage() {
  const auth = useAuth(),
    cart = useCart(),
    catalog = useCatalog(),
    navigate = useNavigate(),
    attempt = useMemo(() => new CheckoutAttempt(), []),
    submitting = useRef(false);
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [notes, setNotes] = useState(""),
    [method, setMethod] = useState<Fulfillment>("pickup"),
    [address, setAddress] = useState(""),
    [destination, setDestination] = useState<Coordinates | null>(null),
    [quote, setQuote] = useState<DeliveryQuote | null>(null),
    [policy, setPolicy] = useState<DeliveryPolicy | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false),
    [recovery, setRecovery] = useState<string | null>(null),
    [review, setReview] = useState<OrderRequest | null>(null);
  const owner = auth.session?.user.id,
    markerKey = owner ? `cest-pending-${owner}` : null,
    totals = reconcileCart(cart.lines, catalog.products);
  useEffect(() => {
    setName(auth.profile?.displayName ?? "");
    setPhone(auth.profile?.phone ?? "");
  }, [auth.profile?.id]);
  useEffect(() => {
    attempt.clear();
    setLocked(false);
    setBusy(false);
    submitting.current = false;
    setReview(null);
    setRecovery(null);
    setQuote(null);
    setAddress("");
    setNotes("");
    setDestination(null);
    if (markerKey) {
      try {
        const id = sessionStorage.getItem(markerKey);
        if (id) {
          setRecovery(id);
          setLocked(true);
        }
      } catch {
        setError(
          "Browser storage is unavailable. Enable it before placing an order.",
        );
      }
    }
  }, [owner]);
  async function refreshPolicy() {
    const result = await getDeliveryPolicy();
    if (result.ok) setPolicy(result.data);
    else setError(result.message);
  }
  useEffect(() => {
    void refreshPolicy();
  }, []);
  async function saved(order: OrderDetail) {
    if (markerKey) sessionStorage.removeItem(markerKey);
    attempt.clear();
    cart.clear();
    setLocked(false);
    navigate(`/orders/${order.id}`, { replace: true });
  }
  useEffect(() => {
    if (!recovery || !auth.verified) return;
    const epoch = auth.scope.capture();
    void findMyOrderRequest(recovery).then((result) => {
      if (!auth.scope.isCurrent(epoch)) return;
      if (result.ok && result.data) void saved(result.data);
      else if (!result.ok) setError(result.message);
    });
  }, [recovery, auth.verified]);
  function prepare(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!navigator.onLine) {
      setError("You are offline. Reconnect before placing your order.");
      return;
    }
    if (
      !auth.verified ||
      catalog.loading ||
      catalog.error ||
      totals.issues.length ||
      locked
    )
      return;
    let normalized: string;
    try {
      normalized = normalizePhone(phone);
    } catch {
      setError("Enter a valid Philippine mobile number.");
      return;
    }
    const payload: OrderRequest = {
      requestId: crypto.randomUUID(),
      items: cart.lines.map((l) => ({ ...l })),
      expectedSubtotalCentavos: totals.subtotalCentavos,
      recipient: { name: name.trim(), phone: normalized },
      notes: notes.trim(),
      fulfillment: method,
      address: method === "delivery" ? address.trim() : null,
      destination: method === "delivery" ? destination : null,
      quoteId: method === "delivery" ? (quote?.id ?? null) : null,
    };
    const invalid = validateOrder(payload);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (method === "delivery" && !quote) {
      setError("Confirm your pin for a current delivery estimate.");
      return;
    }
    setReview(payload);
  }
  async function send(payload: OrderRequest) {
    if (submitting.current || !auth.verified) return;
    if (!navigator.onLine) {
      setError("You are offline. No new request was sent. Reconnect to retry.");
      setReview(null);
      return;
    }
    try {
      if (markerKey) sessionStorage.setItem(markerKey, payload.requestId);
    } catch {
      setError(
        "Enable browser storage before placing an order so an interrupted request can be recovered.",
      );
      setReview(null);
      return;
    }
    submitting.current = true;
    const epoch = auth.scope.capture(),
      exact = attempt.lock(payload);
    setLocked(true);
    setBusy(true);
    setReview(null);
    setError("");
    const result = await placeOrder(exact);
    if (!auth.scope.isCurrent(epoch)) return;
    submitting.current = false;
    setBusy(false);
    if (result.ok) {
      await saved(result.data);
      return;
    }
    setError(result.message);
    if (!isUncertainFailure(result.code)) {
      attempt.clear();
      setLocked(false);
      if (markerKey) sessionStorage.removeItem(markerKey);
      setQuote(null);
      await Promise.all([catalog.refresh(), refreshPolicy()]);
    } else
      setError(
        "We cannot confirm whether your order was saved. Retry this exact request; your cart is kept and no new order will be created.",
      );
  }
  async function recover() {
    if (!recovery || busy) return;
    setBusy(true);
    const epoch = auth.scope.capture(),
      result = await resolveUnknownRequest(recovery);
    if (!auth.scope.isCurrent(epoch)) return;
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (result.data.order) {
      await saved(result.data.order);
      return;
    }
    if (result.data.abandoned) {
      if (markerKey) sessionStorage.removeItem(markerKey);
      setRecovery(null);
      setLocked(false);
      setError(
        "The previous request was safely closed. Review your order again before placing it.",
      );
    }
  }
  if (auth.loading) return <p className="loading">Restoring your account…</p>;
  if (!auth.verified)
    return (
      <section className="page-width content-page">
        <div className="cream-card account-card narrow">
          <h1>Your table is waiting.</h1>
          <p>A verified account is required to place an order.</p>
          <StatusNotice error message={auth.error} />
          <Link
            className="button"
            to={auth.session ? "/verify" : "/auth?next=/checkout"}
          >
            {auth.session ? "Verify email" : "Sign in to checkout"}
          </Link>
        </div>
      </section>
    );
  return (
    <section className="page-width content-page">
      <div className="page-heading">
        <span className="eyebrow">One last delicious detail</span>
        <h1>Make it yours.</h1>
        <p>Pickup or delivery. Pay when you receive your meal.</p>
      </div>
      <StatusNotice
        error
        message={error || catalog.error || totals.issues.join(" ")}
      />
      {locked && (
        <div className="cream-card recovery-card">
          <h2>Let’s confirm your order first.</h2>
          <p>Your request is locked to prevent accidental duplicates.</p>
          {attempt.current ? (
            <Button busy={busy} onClick={() => send(attempt.current!)}>
              Retry the same order
            </Button>
          ) : (
            <Button busy={busy} onClick={recover}>
              Resolve interrupted order
            </Button>
          )}
        </div>
      )}
      <form onSubmit={prepare} className="checkout-layout">
        <fieldset
          disabled={locked || busy}
          className="cream-card checkout-fields"
        >
          <legend className="sr-only">Order details</legend>
          <h2>Who’s joining us?</h2>
          <div className="two-fields">
            <label>
              Recipient name
              <input
                value={name}
                required
                minLength={2}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label>
              Mobile number
              <input
                type="tel"
                value={phone}
                required
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xx xxx xxxx"
                autoComplete="tel"
              />
            </label>
          </div>
          <div className="fulfillment-tabs">
            <Button
              type="button"
              variant={method === "pickup" ? undefined : "outline"}
              aria-pressed={method === "pickup"}
              onClick={() => {
                setMethod("pickup");
                setQuote(null);
              }}
            >
              Pickup
            </Button>
            <Button
              type="button"
              variant={method === "delivery" ? undefined : "outline"}
              aria-pressed={method === "delivery"}
              onClick={() => {
                setMethod("delivery");
                setQuote(null);
              }}
            >
              Delivery
            </Button>
          </div>
          {method === "pickup" ? (
            <div className="pickup-note">
              <h3>A meal to take with you.</h3>
              <p>{policy?.label ?? "Demo pickup point — Metro Manila"}</p>
              <p className="muted">
                Wait for the team to mark your order ready before collecting it.
              </p>
            </div>
          ) : (
            <>
              <label>
                Complete delivery address
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setQuote(null);
                  }}
                  minLength={10}
                  maxLength={500}
                  required
                  placeholder="Building, street, barangay, city and delivery instructions"
                />
              </label>
              {policy ? (
                <>
                  <StatusNotice
                    error
                    message={
                      !policy.enabled
                        ? "Delivery is currently unavailable. Choose pickup."
                        : ""
                    }
                  />
                  <DeliveryQuotePanel
                    policy={policy}
                    destination={destination}
                    onDestination={(p) => {
                      setDestination(p);
                      setQuote(null);
                    }}
                    onQuote={setQuote}
                    disabled={locked}
                  />
                </>
              ) : (
                <Button type="button" onClick={refreshPolicy}>
                  Load delivery settings
                </Button>
              )}
            </>
          )}
          <label className="notes-field">
            Notes for the kitchen (optional)
            <textarea
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share a request. The team will confirm what they can accommodate."
            />
          </label>
        </fieldset>
        <aside className="cream-card order-summary">
          <span className="eyebrow">Your evening, planned</span>
          <h2>Order summary.</h2>
          {cart.lines.map((line) => {
            const p = catalog.products.find((p) => p.id === line.productId);
            return (
              <div className="summary-line" key={line.productId}>
                <span>
                  {line.quantity} × {p?.name ?? "Unavailable dish"}
                </span>
                <strong>
                  {p && formatMoney(p.priceCentavos * line.quantity)}
                </strong>
              </div>
            );
          })}
          <hr className="divider" />
          <div className="summary-line">
            <span>Subtotal</span>
            <strong>{formatMoney(totals.subtotalCentavos)}</strong>
          </div>
          <div className="summary-line">
            <span>Delivery</span>
            <strong>
              {method === "pickup"
                ? "Free pickup"
                : quote
                  ? formatMoney(quote.feeCentavos)
                  : "Confirm your pin"}
            </strong>
          </div>
          <div className="summary-line total">
            <span>Total</span>
            <strong>
              {formatMoney(
                totals.subtotalCentavos +
                  (method === "delivery" ? (quote?.feeCentavos ?? 0) : 0),
              )}
            </strong>
          </div>
          <p className="muted">
            Pay on receipt · Prices in PHP
            <br />
            Order times use Philippine time.
          </p>
          <Button
            type="submit"
            fullWidth
            disabled={
              locked ||
              !cart.lines.length ||
              !!catalog.error ||
              catalog.loading ||
              !!totals.issues.length ||
              (method === "delivery" && !quote)
            }
          >
            Review & place order →
          </Button>
          <Link className="text-link" to="/cart">
            Back to your order
          </Link>
        </aside>
      </form>
      <Dialog
        open={!!review}
        title="Ready for something delicious?"
        onClose={() => setReview(null)}
      >
        {review && (
          <>
            <p>
              {review.recipient.name} · {review.fulfillment}
            </p>
            <p>
              {review.fulfillment === "delivery"
                ? review.address
                : policy?.label}
            </p>
            <p>
              Total:{" "}
              <strong>
                {formatMoney(
                  review.expectedSubtotalCentavos +
                    (review.fulfillment === "delivery"
                      ? (quote?.feeCentavos ?? 0)
                      : 0),
                )}
              </strong>{" "}
              · Pay on receipt
            </p>
            <p>The team will review your order before preparing it.</p>
            <div className="dialog-actions">
              <Button busy={busy} onClick={() => send(review)}>
                Confirm order
              </Button>
              <Button variant="outline" onClick={() => setReview(null)}>
                Keep reviewing
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </section>
  );
}
