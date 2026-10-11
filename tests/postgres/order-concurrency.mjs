import {actor,rpc,ids,pool} from '../../tools/db-test-lib.mjs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
export async function runConcurrency(){
 const p=(await pool.query("select id from public.products where slug='spicy-lobster'")).rows[0].id;
 const request={requestId:randomUUID(),items:[{productId:p,quantity:1}],expectedSubtotalCentavos:169900,recipient:{name:'Synthetic Customer',phone:'09171234567'},notes:'',fulfillment:'pickup',address:null,destination:null,quoteId:null};
 const call=req=>actor(ids.a,c=>rpc(c,'place_order',req));
 const results=await Promise.all([call(request),call(request)]);assert(results.every(x=>x.ok));assert.equal(results[0].data.id,results[1].data.id);
 assert.equal((await call({...request,notes:'changed'})).code,'REQUEST_CONFLICT');
 const r=await actor(null,c=>rpc(c,'reserve_quote_request',{ownerId:ids.a,destination:{lat:14.61,lng:120.99}}),'service_role');
 const q=await actor(null,c=>rpc(c,'store_delivery_quote',{reservationId:r.data.id,distanceMetres:4000}),'service_role');
 const delivery={...request,fulfillment:'delivery',address:'Synthetic test destination only',destination:{lat:14.61,lng:120.99},quoteId:q.data.id};
 const attempts=await Promise.all([call({...delivery,requestId:randomUUID()}),call({...delivery,requestId:randomUUID()})]);assert.equal(attempts.filter(x=>x.ok).length,1);assert.equal(attempts.find(x=>x.ok).data.totalCentavos,175900);
 const late={...request,requestId:randomUUID()};
 const resolved=await actor(ids.a,c=>rpc(c,'resolve_unknown_request',{requestId:late.requestId}));assert.equal(resolved.data.abandoned,true);assert.equal((await call(late)).code,'REQUEST_ABANDONED');
 const race={...request,requestId:randomUUID()};
 const [saved,recovery]=await Promise.all([call(race),actor(ids.a,c=>rpc(c,'resolve_unknown_request',{requestId:race.requestId}))]);
 assert(saved.ok?recovery.data.order.id===saved.data.id:recovery.data.abandoned===true);assert(!saved.ok||recovery.data.abandoned===false);
}
