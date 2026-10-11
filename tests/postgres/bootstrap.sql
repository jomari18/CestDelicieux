-- Test-only Auth fixture. Never apply to hosted Supabase.
do $$begin
 if not exists(select from pg_roles where rolname='anon') then create role anon nologin;end if;
 if not exists(select from pg_roles where rolname='authenticated') then create role authenticated nologin;end if;
 if not exists(select from pg_roles where rolname='service_role') then create role service_role nologin bypassrls;end if;
end$$;
create schema if not exists auth;
create table if not exists auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
create or replace function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
create or replace function public.test_assert(condition boolean,message text) returns void language plpgsql as $$begin if condition is distinct from true then raise exception 'ASSERTION: %',message;end if;end$$;
grant execute on function public.test_assert(boolean,text) to anon,authenticated,service_role;
