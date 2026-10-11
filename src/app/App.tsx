import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "../features/auth/AuthProvider";
import { AuthPage } from "../features/auth/AuthPage";
import { VerifyPage } from "../features/auth/VerifyPage";
import { ProfilePage } from "../features/auth/ProfilePage";
import { AppShell } from "./AppShell";
import { CatalogProvider } from "../features/catalog/CatalogProvider";
import { CartProvider } from "../features/cart/CartProvider";
import { LandingPage } from "../features/catalog/LandingPage";
import { MenuPage } from "../features/catalog/MenuPage";
import { CartPage } from "../features/cart/CartPage";
import { StoryPage } from "../features/catalog/StoryPage";
const CheckoutPage = lazy(() => import("../features/checkout/CheckoutPage").then(m => ({default:m.CheckoutPage})));
const OrderHistoryPage = lazy(() => import("../features/orders/OrderHistoryPage").then(m => ({default:m.OrderHistoryPage})));
const OrderDetailPage = lazy(() => import("../features/orders/OrderDetailPage").then(m => ({default:m.OrderDetailPage})));
const StaffShell = lazy(() => import("../features/staff/StaffShell").then(m => ({default:m.StaffShell})));
const StaffOrdersPage = lazy(() => import("../features/staff/StaffOrdersPage").then(m => ({default:m.StaffOrdersPage})));
const StaffOrderDetail = lazy(() => import("../features/staff/StaffOrderDetail").then(m => ({default:m.StaffOrderDetail})));
const StaffMenuPage = lazy(() => import("../features/staff/StaffMenuPage").then(m => ({default:m.StaffMenuPage})));
const StaffSettingsPage = lazy(() => import("../features/staff/StaffSettingsPage").then(m => ({default:m.StaffSettingsPage})));
const StaffMessagesPage = lazy(() => import("../features/staff/StaffMessagesPage").then(m => ({default:m.StaffMessagesPage})));
import "../styles/workspace.css";
import "../styles/global.css";
import "../styles/restaurant.css";
function PendingPage() {
  return (
    <section className="page-width account-card">
      <span className="eyebrow">C’est Délicieux</span>
      <h1>
        Make an evening
        <br />
        of every meal.
      </h1>
      <p>This page could not be found. Return to the menu to continue.</p>
      <Link className="button" to="/auth">
        Your account
      </Link>
    </section>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <Suspense fallback={<div className="page-width" role="status">Opening your workspace…</div>}><Routes>
              <Route element={<AppShell />}>
                <Route index element={<LandingPage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/stories/:slug" element={<StoryPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/staff" element={<StaffShell />}>
                  <Route path="orders" element={<StaffOrdersPage />} />
                  <Route path="orders/:id" element={<StaffOrderDetail />} />
                  <Route path="menu" element={<StaffMenuPage />} />
                  <Route path="settings" element={<StaffSettingsPage />} />
                  <Route path="messages" element={<StaffMessagesPage />} />
                </Route>
                <Route path="*" element={<PendingPage />} />
              </Route>
            </Routes></Suspense>
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
