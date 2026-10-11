import {BrowserRouter,Routes,Route,Link} from 'react-router-dom';
import {AuthProvider} from '../features/auth/AuthProvider';
import {AuthPage} from '../features/auth/AuthPage';
import {VerifyPage} from '../features/auth/VerifyPage';
import {ProfilePage} from '../features/auth/ProfilePage';
import {AppShell} from './AppShell';
import {CatalogProvider} from '../features/catalog/CatalogProvider';
import {CartProvider} from '../features/cart/CartProvider';
import {LandingPage} from '../features/catalog/LandingPage';
import {MenuPage} from '../features/catalog/MenuPage';
import {CartPage} from '../features/cart/CartPage';
import {StoryPage} from '../features/catalog/StoryPage';
import {CheckoutPage} from '../features/checkout/CheckoutPage';
import {OrderHistoryPage} from '../features/orders/OrderHistoryPage';
import {OrderDetailPage} from '../features/orders/OrderDetailPage';
import '../styles/global.css';
import '../styles/restaurant.css';
function PendingPage(){return <section className="page-width account-card"><span className="eyebrow">C’est Délicieux</span><h1>Make an evening<br/>of every meal.</h1><p>The restaurant workspace is being connected.</p><Link className="button" to="/auth">Your account</Link></section>}
export default function App(){return <BrowserRouter><AuthProvider><CatalogProvider><CartProvider><Routes><Route element={<AppShell/>}><Route index element={<LandingPage/>}/><Route path="/menu" element={<MenuPage/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/orders" element={<OrderHistoryPage/>}/><Route path="/orders/:id" element={<OrderDetailPage/>}/><Route path="/stories/:slug" element={<StoryPage/>}/><Route path="/auth" element={<AuthPage/>}/><Route path="/verify" element={<VerifyPage/>}/><Route path="/profile" element={<ProfilePage/>}/><Route path="*" element={<PendingPage/>}/></Route></Routes></CartProvider></CatalogProvider></AuthProvider></BrowserRouter>}
