begin;
do $$declare req jsonb;res jsonb;o jsonb;action jsonb;result jsonb;begin
 req:=jsonb_build_object('requestId',gen_random_uuid(),'items',jsonb_build_array(jsonb_build_object('productId',(select id from public.products where slug='spicy-lobster'),'quantity',1)),'expectedSubtotalCentavos',169900,'recipient',jsonb_build_object('name','Synthetic Customer','phone','09171234567'),'notes','','fulfillment','pickup');
 perform set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);res:=public.place_order(req);o:=res->'data';
 action:=jsonb_build_object('orderId',o->>'id','expectedVersion',1,'actionId',gen_random_uuid(),'action','accept');
 result:=public.staff_apply_order_action(action);perform public.test_assert(result->>'code'='STAFF_REQUIRED','metadata staff forgery denied');
 perform set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
 result:=public.staff_apply_order_action(action);perform public.test_assert(result->'data'->>'status'='accepted','staff accepts pending');
 perform public.test_assert(public.staff_apply_order_action(action)=result,'action retry exact result');
 perform public.test_assert(public.staff_apply_order_action(action||jsonb_build_object('action','reject'))->>'code'='ACTION_CONFLICT','changed UUID rejected');
 result:=public.staff_apply_order_action(action||jsonb_build_object('actionId',gen_random_uuid(),'action','prepare'));perform public.test_assert(result->>'code'='STALE_VERSION','stale staff version denied');
 result:=public.staff_apply_order_action(jsonb_build_object('orderId',o->>'id','expectedVersion',2,'actionId',gen_random_uuid(),'action','collect_payment'));perform public.test_assert(result->'data'->>'paymentState'='collected' and result->'data'->>'status'='accepted','payment separate');
 result:=public.staff_apply_order_action(jsonb_build_object('orderId',o->>'id','expectedVersion',3,'actionId',gen_random_uuid(),'action','prepare'));perform public.test_assert(result->'data'->>'status'='preparing','prepare accepted');
 result:=public.staff_apply_order_action(jsonb_build_object('orderId',o->>'id','expectedVersion',4,'actionId',gen_random_uuid(),'action','ready'));perform public.test_assert(result->'data'->>'status'='ready','ready preparing');
 result:=public.staff_apply_order_action(jsonb_build_object('orderId',o->>'id','expectedVersion',5,'actionId',gen_random_uuid(),'action','dispatch'));perform public.test_assert(result->>'code'='INVALID_TRANSITION','pickup cannot dispatch');
 result:=public.staff_apply_order_action(jsonb_build_object('orderId',o->>'id','expectedVersion',5,'actionId',gen_random_uuid(),'action','complete'));perform public.test_assert(result->'data'->>'status'='completed','pickup completed');
 result:=public.staff_apply_order_action(jsonb_build_object('orderId',o->>'id','expectedVersion',6,'actionId',gen_random_uuid(),'action','cancel'));perform public.test_assert(result->>'code'='INVALID_TRANSITION','terminal immutable');
end$$;
rollback;
