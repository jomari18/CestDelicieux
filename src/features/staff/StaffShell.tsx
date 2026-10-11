import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { StatusNotice } from "../../components/StatusNotice";
export function StaffShell() {
  const auth = useAuth();
  if (auth.loading)
    return <p className="loading">Checking restaurant access…</p>;
  if (!auth.staff)
    return (
      <section className="page-width content-page">
        <div className="cream-card">
          <h1>Restaurant workspace.</h1>
          <p>This area is available to approved staff only.</p>
          <StatusNotice error message={auth.error} />
          <Link className="button" to="/auth?next=/staff/orders">
            Sign in with a staff account
          </Link>
        </div>
      </section>
    );
  return (
    <div className="page-width content-page">
      <div className="staff-heading">
        <span className="eyebrow">C’est Délicieux · Restaurant operations</span>
        <nav aria-label="Staff navigation">
          <NavLink to="/staff/orders">Orders</NavLink>
          <NavLink to="/staff/menu">Menu</NavLink>
          <NavLink to="/staff/settings">Delivery</NavLink>
          <NavLink to="/staff/messages">Inbox</NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
