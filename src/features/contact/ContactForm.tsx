import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { rpc } from "../../lib/api";
import { normalizePhone } from "../../domain/validation";
import { Button } from "../../components/Button";
import { StatusNotice } from "../../components/StatusNotice";
export function ContactForm() {
  const auth = useAuth(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [id, setId] = useState(() => crypto.randomUUID());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      data = new FormData(form),
      epoch = auth.scope.capture();
    let phone;
    try {
      phone = normalizePhone(String(data.get("phone")));
    } catch {
      setError("Enter a valid Philippine mobile number.");
      return;
    }
    setBusy(true);
    setMessage("");
    setError("");
    const result = await rpc("submit_contact", {
      requestId: id,
      name: String(data.get("name")),
      email: String(data.get("email")),
      phone,
      message: String(data.get("message")),
    });
    if (!auth.scope.isCurrent(epoch)) return;
    setBusy(false);
    if (result.ok) {
      setMessage(
        "Your message is saved. Our team can review it in the restaurant inbox.",
      );
      setId(crypto.randomUUID());
      form.reset();
    } else setError(result.message);
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
          <form onSubmit={submit}>
            <label>
              Your name
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
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
                required
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
            <StatusNotice error message={error} />
            <StatusNotice message={message} />
            <Button type="submit" busy={busy}>
              Send message →
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
