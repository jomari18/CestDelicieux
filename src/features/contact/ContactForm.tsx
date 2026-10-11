import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { rpc } from "../../lib/api";
import { normalizePhone } from "../../domain/validation";
import { Button } from "../../components/Button";
import { StatusNotice } from "../../components/StatusNotice";
import type { ContactRequest } from "../../domain/contracts";
const definiteRejections = new Set([
  "INVALID_MESSAGE",
  "VERIFICATION_REQUIRED",
  "REQUEST_CONFLICT",
  "RATE_LIMITED",
  "SETUP_REQUIRED",
]);
export function ContactForm() {
  const auth = useAuth(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [locked, setLocked] = useState(false);
  const attempt = useRef<ContactRequest | null>(null),
    inFlight = useRef(false);
  useEffect(() => {
    attempt.current = null;
    inFlight.current = false;
    setBusy(false);
    setLocked(false);
    setError("");
    setMessage("");
  }, [auth.session?.user.id]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !auth.verified) return;
    const form = event.currentTarget,
      epoch = auth.scope.capture();
    if (!attempt.current) {
      const data = new FormData(form),
        rawPhone = String(data.get("phone") ?? "").trim();
      let phone = "";
      try {
        phone = rawPhone ? normalizePhone(rawPhone) : "";
      } catch {
        setError("Enter a valid Philippine mobile number, or leave it empty.");
        return;
      }
      attempt.current = {
        requestId: crypto.randomUUID(),
        name: String(data.get("name")),
        email: String(data.get("email")),
        phone,
        message: String(data.get("message")),
      };
    }
    const exact = structuredClone(attempt.current);
    inFlight.current = true;
    setLocked(true);
    setBusy(true);
    setMessage("");
    setError("");
    const result = await rpc("submit_contact", exact);
    if (!auth.scope.isCurrent(epoch)) return;
    inFlight.current = false;
    setBusy(false);
    if (result.ok) {
      setMessage(
        "Your message is saved. Our team can review it in the restaurant inbox.",
      );
      attempt.current = null;
      setLocked(false);
      form.reset();
    } else if (definiteRejections.has(result.code)) {
      attempt.current = null;
      setLocked(false);
      setError(result.message);
    } else
      setError(
        "We couldn’t confirm your message. Retry the same message before making changes.",
      );
  }
  return (
    <section className="contact-section" id="contact">
      <div>
        <span className="eyebrow">We’d love to hear from you</span>
        <h2>
          Let’s talk
          <br />
          over something good.
        </h2>
        <p>
          Questions about the menu or your order?
          <br />
          Leave a message for the team.
        </p>
        <p className="muted">
          This is a portfolio demonstration.
          <br />
          Pickup point: Metro Manila demo location.
        </p>
      </div>
      <div className="cream-card">
        {!auth.verified ? (
          <>
            <h3>A conversation starts here.</h3>
            <p>Sign in with a verified account to send a message.</p>
            <Link className="button" to="/auth?next=/%23contact">
              Sign in to contact us
            </Link>
          </>
        ) : (
          <form key={auth.session?.user.id} onSubmit={submit}>
            <fieldset className="plain-fieldset" disabled={busy || locked}>
              <label>
                Your name
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  defaultValue={auth.profile?.displayName}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  required
                  maxLength={254}
                  defaultValue={auth.session?.user.email}
                />
              </label>
              <label>
                Mobile number
                <input
                  name="phone"
                  type="tel"
                  placeholder="09xx xxx xxxx"
                  defaultValue={auth.profile?.phone}
                />
              </label>
              <label>
                Message
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={2000}
                />
              </label>
            </fieldset>
            <StatusNotice error message={error} />
            <StatusNotice message={message} />
            <Button type="submit" busy={busy}>
              {locked ? "Retry same message" : "Send message →"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
