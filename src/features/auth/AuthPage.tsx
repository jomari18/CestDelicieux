import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { StatusNotice } from "../../components/StatusNotice";
import { register, signIn } from "./api";
import { useAuth } from "./AuthProvider";
export function AuthPage() {
  const [search] = useSearchParams();
  const signup = search.get("mode") === "register";
  const navigate = useNavigate();
  const auth = useAuth();
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (signup && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    const result = signup
      ? await register(name.trim(), email.trim(), password)
      : await signIn(email.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPassword("");
    setConfirm("");
    if (signup) {
      navigate("/verify?email=" + encodeURIComponent(email.trim()));
      return;
    }
    await auth.refresh();
    const next = search.get("next");
    navigate(next?.startsWith("/") && !next.startsWith("//") ? next : "/menu");
  }
  return (
    <section className="auth-layout page-width">
      <div className="auth-photo">
        <img
          src="/assets/editorial-restaurant.webp"
          alt="An intimate restaurant setting"
        />
        <div>
          <span className="eyebrow">A place at our table</span>
          <h1>
            Good food.
            <br />
            Even better company.
          </h1>
        </div>
      </div>
      <div className="cream-panel auth-panel">
        <span className="eyebrow">Your C’est Délicieux account</span>
        <h1>{signup ? "Make yourself at home." : "Welcome back."}</h1>
        <p className="muted">
          {signup
            ? "Create an account to place orders and keep your favourites close."
            : "Sign in to plan your next delicious meal."}
        </p>
        <form onSubmit={submit}>
          {signup && (
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                aria-label="Password"
                name="password"
                type={show ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={signup ? 8 : 1}
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
            {signup && <small>At least 8 characters.</small>}
          </label>
          {signup && (
            <label>
              Confirm password
              <input
                name="confirm-password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                maxLength={128}
              />
            </label>
          )}
          <StatusNotice message={error} error />
          <Button busy={busy} className="full-width">
            {signup ? "Create account" : "Sign in"}
          </Button>
        </form>
        {!signup && (
          <Link className="text-link" to="/forgot-password">
            Forgot password?
          </Link>
        )}
        <p className="auth-switch">
          {signup ? "Already registered?" : "New to C’est Délicieux?"}{" "}
          <Link to={signup ? "/auth" : "/auth?mode=register"}>
            {signup ? "Sign in" : "Create an account"}
          </Link>
        </p>
        <Link
          className="text-link"
          to={"/verify" + (email ? "?email=" + encodeURIComponent(email) : "")}
        >
          Verify email / resend code
        </Link>
      </div>
    </section>
  );
}
