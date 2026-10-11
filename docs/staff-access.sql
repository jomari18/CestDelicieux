-- Run manually in the dedicated restaurant project only, after registration/verification.
do $$
declare approved_email text := 'REPLACE_WITH_CONFIRMED_STAFF_EMAIL'; target uuid;
begin
 if approved_email='REPLACE_WITH_CONFIRMED_STAFF_EMAIL' then raise exception 'Set the approved staff email first';end if;
 select id into target from auth.users where lower(email)=lower(approved_email) and email_confirmed_at is not null;
 if target is null then raise exception 'Confirmed account not found in this project';end if;
 insert into restaurant_private.staff_memberships(user_id,active) values(target,true) on conflict(user_id) do update set active=true,updated_at=now();
end$$;
-- Revoke separately by UUID: update restaurant_private.staff_memberships set active=false,updated_at=now() where user_id='STAFF_UUID';
