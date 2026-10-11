begin;
do $$declare req jsonb;res jsonb;i integer;begin
 req:=jsonb_build_object('requestId',gen_random_uuid(),'name','Synthetic Sender','email','sender@example.test','phone','','message','A synthetic test message only.');
 perform set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
 res:=public.submit_contact(req);perform public.test_assert((res->>'ok')::boolean,'contact persisted');
 perform public.test_assert(public.submit_contact(req)=res,'contact identical retry persisted once');
 perform public.test_assert(public.submit_contact(req||jsonb_build_object('message','other message'))->>'code'='REQUEST_CONFLICT','changed contact UUID denied');
 for i in 1..2 loop res:=public.submit_contact(req||jsonb_build_object('requestId',gen_random_uuid()));perform public.test_assert((res->>'ok')::boolean,'three total messages allowed');end loop;
 res:=public.submit_contact(req||jsonb_build_object('requestId',gen_random_uuid()));perform public.test_assert(res->>'code'='RATE_LIMITED','contact throttle');
 res:=public.submit_contact(req||jsonb_build_object('requestId',gen_random_uuid(),'message','x'));perform public.test_assert(res->>'code'='INVALID_MESSAGE','short message rejected before throttle');
end$$;
rollback;
