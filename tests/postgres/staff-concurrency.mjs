import {actor,rpc,ids,pool} from '../../tools/db-test-lib.mjs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
export async function runStaffConcurrency(){
 const p=(await pool.query("select id from public.products where slug='spicy-lobster'")).rows[0].id;
 const saved=await actor(ids.a,c=>rpc(c,'place_order',{requestId:randomUUID(),items:[{productId:p,quantity:1}],expectedSubtotalCentavos:169900,recipient:{name:'Synthetic Staff Test',phone:'09171234567'},notes:'',fulfillment:'pickup'}));assert(saved.ok);
 const perform=req=>actor(ids.staff,c=>rpc(c,'staff_apply_order_action',req));
 const accepts=await Promise.all([perform({orderId:saved.data.id,expectedVersion:1,actionId:randomUUID(),action:'accept'}),perform({orderId:saved.data.id,expectedVersion:1,actionId:randomUUID(),action:'accept'})]);
 assert.equal(accepts.filter(x=>x.ok).length,1);assert.equal(accepts.find(x=>!x.ok).code,'STALE_VERSION');
 const payment={orderId:saved.data.id,expectedVersion:2,actionId:randomUUID(),action:'collect_payment'};
 const payments=await Promise.all([perform(payment),perform(payment)]);assert.deepEqual(payments[0],payments[1]);assert.equal(payments[0].data.paymentState,'collected');
 assert.equal((await pool.query("select count(*)::int as n from public.order_events where order_id=$1 and action='collect_payment'",[saved.data.id])).rows[0].n,1);
}
