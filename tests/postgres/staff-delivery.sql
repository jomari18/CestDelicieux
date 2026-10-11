begin;
do $$declare req jsonb;r jsonb;q jsonb;res jsonb;o jsonb;actions text[]:=array['accept','prepare','ready','dispatch','deliver'];i int;begin
 perform set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
 r:=public.reserve_quote_request(jsonb_build_object('ownerId','10000000-0000-4000-8000-000000000001','destination',jsonb_build_object('lat',14.61,'lng',120.99)));q:=public.store_delivery_quote(jsonb_build_object('reservationId',r->'data'->>'id','distanceMetres',4000));
 req:=jsonb_build_object('requestId',gen_random_uuid(),'items',jsonb_build_array(jsonb_build_object('productId',(select id from public.products where slug='spicy-lobster'),'quantity',1)),'expectedSubtotalCentavos',169900,'recipient',jsonb_build_object('name','Synthetic Delivery','phone','09171234567'),'notes','','fulfillment','delivery','address','Synthetic test destination only','destination',jsonb_build_object('lat',14.61,'lng',120.99),'quoteId',q->'data'->>'id');
 res:=public.place_order(req);perform public.test_assert((res->>'ok')::boolean,'delivery saved');o:=res->'data';
 perform set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
 for i in 1..5 loop
  res:=public.staff_apply_order_action(jsonb_build_object('orderId',o->>'id','expectedVersion',i,'actionId',gen_random_uuid(),'action',actions[i]));perform public.test_assert((res->>'ok')::boolean,'delivery transition '||actions[i]);
 end loop;
 perform public.test_assert(res->'data'->>'status'='delivered','delivery terminal reached');
 perform public.test_assert(res->'data'->>'paymentState'='unpaid','delivery does not pretend payment collected');
 res:=public.staff_apply_order_action(jsonb_build_object('orderId',o->>'id','expectedVersion',6,'actionId',gen_random_uuid(),'action','accept'));perform public.test_assert(res->>'code'='INVALID_TRANSITION','delivery terminal immutable');
end$$;
rollback;
