import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import type {Session} from '@supabase/supabase-js';
import type {Profile} from '../../domain/contracts';
import {supabase} from '../../lib/supabase';
import {rpc} from '../../lib/api';
import {IdentityScope} from './state';
type AuthValue={session:Session|null;profile:Profile|null;verified:boolean;staff:boolean;loading:boolean;error:string;scope:IdentityScope;refresh:()=>Promise<void>};
const context=createContext<AuthValue|null>(null);
export function AuthProvider({children}:{children:ReactNode}){
 const [session,setSession]=useState<Session|null>(null),[profile,setProfile]=useState<Profile|null>(null),[access,setAccess]=useState({verified:false,staff:false}),[loading,setLoading]=useState(!!supabase),[error,setError]=useState('');
 const scope=useMemo(()=>new IdentityScope(),[]);
 async function applySession(current:Session|null){
  scope.change(current?.user.id??null);const epoch=scope.capture();setSession(current);setProfile(null);setAccess({verified:false,staff:false});setError('');
  if(!current||!supabase){setLoading(false);return}setLoading(true);
  const [permission,details]=await Promise.all([rpc<{verified:boolean;staff:boolean}>('get_my_access'),supabase.from('profiles').select('*').eq('id',current.user.id).single()]);
  if(!scope.isCurrent(epoch))return;
  if(permission.ok)setAccess(permission.data);else setError(permission.message);
  if(details.data)setProfile({id:details.data.id,displayName:details.data.display_name,phone:details.data.phone});
  setLoading(false);
 }
 async function refresh(){if(!supabase)return;const {data,error}=await supabase.auth.getSession();if(error){setError('Unable to restore your session. Sign in again.');setLoading(false);return}await applySession(data.session)}
 useEffect(()=>{let active=true;void refresh();const subscription=supabase?.auth.onAuthStateChange((_event,current)=>{queueMicrotask(()=>{if(active)void applySession(current)})});return()=>{active=false;scope.change(null);subscription?.data.subscription.unsubscribe()}},[]);
 return <context.Provider value={{session,profile,...access,loading,error,scope,refresh}}>{children}</context.Provider>
}
export function useAuth(){const value=useContext(context);if(!value)throw Error('AuthProvider missing');return value}
