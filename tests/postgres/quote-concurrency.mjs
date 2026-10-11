import {actor,rpc,ids,pool} from '../../tools/test-db.mjs';
import assert from 'node:assert/strict';
export async function runQuoteConcurrency(){
 const results=await Promise.all(Array.from({length:8},()=>actor(null,c=>rpc(c,'reserve_quote_request',{ownerId:ids.b,destination:{lat:14.61,lng:120.99}}),'service_role')));
 assert.equal(results.filter(r=>r.ok).length,5,'atomic throttle permits five requests only');
 assert.equal(results.filter(r=>r.code==='RATE_LIMITED').length,3);
 await pool.query('delete from restaurant_private.quote_reservations where owner_id=$1',[ids.b]);
 await pool.query('delete from restaurant_private.rate_limits where user_id=$1',[ids.b]);
}
