import {useMemo,useState,useEffect,type FormEvent} from 'react';
import {useNavigate,useSearchParams} from 'react-router-dom';
import {Button} from '../../components/Button';
import {StatusNotice} from '../../components/StatusNotice';
import {verifyEmail,resendEmail} from './api';
import {ResendCooldown} from './state';
import {useAuth} from './AuthProvider';
export function VerifyPage(){const [search]=useSearchParams();const auth=useAuth(),navigate=useNavigate();const [email,setEmail]=useState(search.get('email')||auth.session?.user.email||''),[token,setToken]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[remaining,setRemaining]=useState(0);const cooldown=useMemo(()=>new ResendCooldown(),[]);
 useEffect(()=>{const timer=setInterval(()=>setRemaining(cooldown.remaining()),500);return()=>clearInterval(timer)},[cooldown]);
 async function verify(event:FormEvent){event.preventDefault();if(busy)return;setBusy(true);setError('');const result=await verifyEmail(email.trim(),token.trim());setBusy(false);if(!result.ok){setError(result.message);return}setToken('');await auth.refresh();navigate('/menu')}
 async function resend(){if(busy||remaining)return;setBusy(true);setError('');const result=await resendEmail(email.trim());setBusy(false);if(!result.ok){setError(result.message);return}cooldown.sent();setRemaining(60);setNotice('A new verification email has been requested. Check your inbox and spam folder.')}
 return <section className="page-width narrow cream-panel account-card"><span className="eyebrow">One last detail</span><h1>Verify your email.</h1><p className="muted">Enter the code from your verification email to start ordering.</p><form onSubmit={verify}><label>Email<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Verification code<input className="otp-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required value={token} onChange={e=>setToken(e.target.value.replace(/\D/g,''))}/></label><StatusNotice message={error} error/><StatusNotice message={notice}/><Button className="full-width" busy={busy}>Verify email</Button><Button type="button" className="outline full-width" disabled={busy||remaining>0||!email} onClick={resend}>{remaining?`Resend in ${remaining}s`:'Resend code'}</Button></form></section>
}
