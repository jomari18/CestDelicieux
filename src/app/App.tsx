import {BrowserRouter,Routes,Route,Link} from 'react-router-dom';
import {AuthProvider} from '../features/auth/AuthProvider';
import {AuthPage} from '../features/auth/AuthPage';
import {VerifyPage} from '../features/auth/VerifyPage';
import {ProfilePage} from '../features/auth/ProfilePage';
import {AppShell} from './AppShell';
import '../styles/global.css';
function PendingPage(){return <section className="page-width account-card"><span className="eyebrow">C’est Délicieux</span><h1>Make an evening<br/>of every meal.</h1><p>The restaurant workspace is being connected.</p><Link className="button" to="/auth">Your account</Link></section>}
export default function App(){return <BrowserRouter><AuthProvider><Routes><Route element={<AppShell/>}><Route path="/auth" element={<AuthPage/>}/><Route path="/verify" element={<VerifyPage/>}/><Route path="/profile" element={<ProfilePage/>}/><Route path="*" element={<PendingPage/>}/></Route></Routes></AuthProvider></BrowserRouter>}
