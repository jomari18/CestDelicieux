import pg from 'pg';
import {readFile,readdir} from 'node:fs/promises';
export const pool=new pg.Pool({host:'127.0.0.1',port:55434,user:'restaurant_test',database:'cestdelicieux_test'});
export const ids={a:'10000000-0000-4000-8000-000000000001',b:'10000000-0000-4000-8000-000000000002',staff:'10000000-0000-4000-8000-000000000003',unverified:'10000000-0000-4000-8000-000000000004'};
export async function actor(id,fn,role='authenticated'){
 const client=await pool.connect();try{await client.query('begin');await client.query(`set local role ${role==='service_role'?'service_role':role==='anon'?'anon':'authenticated'}`);await client.query("select set_config('request.jwt.claim.sub',$1,true)",[id??'']);const result=await fn(client);await client.query('commit');return result;}catch(e){await client.query('rollback');throw e}finally{client.release()}
}
export async function rpc(client,name,request){if(!/^[a-z_]+$/.test(name))throw Error('Unsafe RPC name');return (await client.query(`select public.${name}($1::jsonb) as result`,[JSON.stringify(request)])).rows[0].result}
export async function setup(){
 // Fixed loopback test cluster only; no remote DSN accepted.
 await pool.query('drop schema if exists restaurant_private cascade; drop schema public cascade; create schema public; drop schema if exists auth cascade;');
 await pool.query(await readFile('tests/postgres/bootstrap.sql','utf8'));
 for(const file of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await pool.query(await readFile('supabase/migrations/'+file,'utf8'));
 await pool.query(await readFile('supabase/seed.sql','utf8'));await pool.query(await readFile('supabase/seed.sql','utf8'));
 for(const [kind,id] of Object.entries(ids))await pool.query("insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,$3,$4)",[id,kind+'@example.test',kind==='unverified'?null:new Date(),JSON.stringify({display_name:kind,role:'staff'})]);
 await pool.query('insert into restaurant_private.staff_memberships(user_id,active) values($1,true)',[ids.staff]);
}
