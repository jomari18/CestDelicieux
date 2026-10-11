import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
import {handleQuote} from './handler.ts';
import {getRoadDistance} from './provider.ts';
function key(name:string,fallback:string):string{try{const value=JSON.parse(Deno.env.get(name)||'{}').default;return (value&&Deno.env.get(value))||value||Deno.env.get(fallback)||''}catch{return Deno.env.get(fallback)||''}}
const url=Deno.env.get('SUPABASE_URL')||'';
const publicKey=key('SUPABASE_PUBLISHABLE_KEYS','SUPABASE_ANON_KEY');
const serviceKey=key('SUPABASE_SECRET_KEYS','SUPABASE_SERVICE_ROLE_KEY');
const providerKey=Deno.env.get('ORS_API_KEY')||'';
const origins=(Deno.env.get('RESTAURANT_ALLOWED_ORIGINS')||'http://127.0.0.1:5180,http://localhost:5180,https://localhost,http://localhost').split(',').map(x=>x.trim()).filter(Boolean);
Deno.serve(async request=>{
 const client=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const service=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 return handleQuote(request,{origins,configured:!!(providerKey&&url&&serviceKey),
  verifyUser:async token=>{const {data,error}=await client.auth.getUser(token);return error||!data.user?null:{id:data.user.id,verified:!!data.user.email_confirmed_at&&!data.user.is_anonymous}},
  reserve:async(ownerId,destination)=>{const {data,error}=await service.rpc('reserve_quote_request',{p_request:{ownerId,destination}});if(error)throw Error('Quote reservation failed');return data},
  route:reservation=>getRoadDistance(reservation,providerKey),
  store:async(reservationId,distanceMetres)=>{const {data,error}=await service.rpc('store_delivery_quote',{p_request:{reservationId,distanceMetres}});if(error)throw Error('Quote storage failed');return data}
 });
});
