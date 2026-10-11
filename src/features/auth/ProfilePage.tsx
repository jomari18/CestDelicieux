import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/Button";
import { StatusNotice } from "../../components/StatusNotice";
import { normalizePhone } from "../../domain/validation";
export function ProfilePage() {
  const auth = useAuth();
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    setName(auth.profile?.displayName || "");
    setPhone(auth.profile?.phone || "");
  }, [auth.profile]);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !auth.session || busy) return;
    let normalized = "";
    try {
      if (phone) normalized = normalizePhone(phone);
    } catch {
      setError("Enter a valid Philippine mobile number.");
      return;
    }
    const epoch = auth.scope.capture();
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim(), phone: normalized })
        .eq("id", auth.session.user.id);
      if (!auth.scope.isCurrent(epoch)) return;
      if (error) setError("Profile could not be saved. Retry.");
      else {
        setNotice("Profile saved.");
        await auth.refresh();
      }
    } catch {
      if (auth.scope.isCurrent(epoch))
        setError("Connection interrupted. Retry.");
    } finally {
      if (auth.scope.isCurrent(epoch)) setBusy(false);
    }
  }
  if (auth.loading) return <p className="page-width">Loading your account…</p>;
  if (!auth.session)
    return (
      <section className="page-width">
        <h1>Your account</h1>
        <Link className="button" to="/auth">
          Sign in
        </Link>
      </section>
    );
  return (
    <section className="page-width narrow cream-panel account-card">
      <span className="eyebrow">Personal details</span>
      <h1>Your account.</h1>
      <p className="muted">{auth.session.user.email}</p>
      <form onSubmit={save}>
        <label>
          Full name
          <input
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          Mobile number (optional)
          <input
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={32}
          />
        </label>
        <StatusNotice message={error} error />
        <StatusNotice message={notice} />
        <Button busy={busy}>Save profile</Button>
      </form>
    </section>
  );
}
