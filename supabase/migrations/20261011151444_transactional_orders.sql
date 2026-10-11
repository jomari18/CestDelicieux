create function restaurant_private.order_detail(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',o.id,'reference',o.reference,'status',o.status,'fulfillment',o.fulfillment,'paymentState',o.payment_state,'totalCentavos',o.total_centavos,'createdAt',o.created_at,'version',o.version,'recipient',jsonb_build_object('name',o.recipient_name,'phone',o.recipient_phone),'address',o.address,'destination',case when o.fulfillment='delivery' then jsonb_build_object('lat',o.destination_lat,'lng',o.destination_lng) else null end,'notes',o.notes,'subtotalCentavos',o.subtotal_centavos,'deliveryFeeCentavos',o.delivery_fee_centavos,'distanceMetres',o.distance_metres,'settingsVersion',o.settings_version,
 'items',coalesce((select jsonb_agg(jsonb_build_object('productId',i.product_id,'name',i.name,'unitPriceCentavos',i.unit_price_centavos,'quantity',i.quantity) order by i.name) from public.order_items i where i.order_id=o.id),'[]'::jsonb),
 'events',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'action',e.action,'status',e.status,'createdAt',e.created_at) order by e.created_at,e.id) from public.order_events e where e.order_id=o.id),'[]'::jsonb)) from public.orders o where o.id=p_id
$$;
create function restaurant_private.order_summary(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('id',o.id,'reference',o.reference,'status',o.status,'fulfillment',o.fulfillment,'paymentState',o.payment_state,'totalCentavos',o.total_centavos,'createdAt',o.created_at,'version',o.version) from public.orders o where id=p_id$$;
create function restaurant_private.place_order(p_request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid();req uuid;payload jsonb;payload_hash text;existing restaurant_private.order_requests;item jsonb;product public.products;items jsonb:='[]';name text;phone text;notes text;method text;address text;lat numeric;lng numeric;q restaurant_private.delivery_quotes;s public.restaurant_settings;quantity integer;subtotal bigint:=0;fee bigint:=0;total bigint;order_id uuid;begin
 if not restaurant_private.verified_user(owner) then return restaurant_private.fail('VERIFICATION_REQUIRED','Sign in and verify your email before ordering.');end if;
 req:=(p_request->>'requestId')::uuid;if req is null then return restaurant_private.fail('INVALID_REQUEST','Missing order reference.');end if;
 name:=trim(coalesce(p_request->'recipient'->>'name',''));phone:=regexp_replace(coalesce(p_request->'recipient'->>'phone',''),'[[:space:]()-]','','g');notes:=coalesce(p_request->>'notes','');method:=p_request->>'fulfillment';
 if phone~'^09[0-9]{9}$' then phone:='+63'||substr(phone,2);end if;
 if length(name) not between 2 and 100 or phone!~'^\+639[0-9]{9}$' or length(notes)>500 then return restaurant_private.fail('INVALID_CONTACT','Review your name, mobile number and notes.');end if;
 if method is null or method not in ('pickup','delivery') then return restaurant_private.fail('INVALID_FULFILLMENT','Choose pickup or delivery.');end if;
 if jsonb_typeof(p_request->'items') is distinct from 'array' or jsonb_array_length(p_request->'items') not between 1 and 30 then return restaurant_private.fail('INVALID_CART','Choose 1–30 different menu items.');end if;
 if (select count(*)<>count(distinct value->>'productId') from jsonb_array_elements(p_request->'items')) then return restaurant_private.fail('INVALID_CART','Merge duplicate items before ordering.');end if;
 for item in select value from jsonb_array_elements(p_request->'items') order by value->>'productId' loop
  quantity:=(item->>'quantity')::integer;if quantity is null or quantity not between 1 and 99 or (item->>'productId')::uuid is null then return restaurant_private.fail('INVALID_CART','Quantities must be 1–99.');end if;
  items:=items||jsonb_build_array(jsonb_build_object('productId',(item->>'productId')::uuid,'quantity',quantity));
 end loop;
 if method='delivery' then
  address:=trim(coalesce(p_request->>'address',''));lat:=(p_request->'destination'->>'lat')::numeric;lng:=(p_request->'destination'->>'lng')::numeric;
  if length(address) not between 10 and 500 or lat is null or lng is null or not(lat between -90 and 90) or not(lng between -180 and 180) or (p_request->>'quoteId')::uuid is null then return restaurant_private.fail('INVALID_DESTINATION','Confirm your delivery address and pin.');end if;
 end if;
 payload:=jsonb_build_object('items',items,'expectedSubtotalCentavos',(p_request->>'expectedSubtotalCentavos')::bigint,'recipient',jsonb_build_object('name',name,'phone',phone),'notes',notes,'fulfillment',method,'address',address,'destination',case when method='delivery' then jsonb_build_object('lat',lat,'lng',lng) else null end,'quoteId',case when method='delivery' then p_request->>'quoteId' else null end);
 payload_hash:=encode(sha256(convert_to(payload::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(req::text,0));
 select * into existing from restaurant_private.order_requests where request_id=req;
 if found then
  if existing.owner_id<>owner then return restaurant_private.fail('REQUEST_CONFLICT','That order request cannot be used.');end if;
  if existing.abandoned then return restaurant_private.fail('REQUEST_ABANDONED','This request was resolved. Review a new order.');end if;
  if existing.payload_hash<>payload_hash then return restaurant_private.fail('REQUEST_CONFLICT','Retry the original order without changing its details.');end if;
  return restaurant_private.success(restaurant_private.order_detail(existing.order_id));
 end if;
 -- Policy first, then sorted product/category locks, then quote: shared lock ordering.
 select * into s from public.restaurant_settings where id for share;
 for item in select value from jsonb_array_elements(items) loop
  select p.* into product from public.products p join public.categories c on c.id=p.category_id where p.id=(item->>'productId')::uuid and p.active and c.active for share of p,c;
  if not found then return restaurant_private.fail('ITEM_UNAVAILABLE','A menu item changed. Review your cart.');end if;
  subtotal:=subtotal+product.price_centavos*(item->>'quantity')::int;
 end loop;
 if subtotal is distinct from (p_request->>'expectedSubtotalCentavos')::bigint then return restaurant_private.fail('PRICE_CHANGED','Menu prices changed. Review the refreshed total.');end if;
 if method='delivery' then
  select * into q from restaurant_private.delivery_quotes where id=(p_request->>'quoteId')::uuid for update;
  if not found or q.owner_id<>owner or q.destination_lat<>lat or q.destination_lng<>lng then return restaurant_private.fail('INVALID_QUOTE','Confirm a delivery estimate for this destination.');end if;
  if q.consumed_order_id is not null then return restaurant_private.fail('QUOTE_USED','Request a new delivery estimate.');end if;
  if q.settings_version<>s.version or not s.enabled then return restaurant_private.fail('POLICY_CHANGED','Delivery settings changed. Request a new estimate.');end if;
  if q.expires_at<=clock_timestamp() then return restaurant_private.fail('QUOTE_EXPIRED','Your delivery estimate expired. Refresh it.');end if;
  fee:=q.fee_centavos;
 end if;
 total:=subtotal+fee;if total>3000000000 then return restaurant_private.fail('TOTAL_TOO_LARGE','Reduce your order before checkout.');end if;
 order_id:=gen_random_uuid();
 insert into public.orders(id,owner_id,request_id,reference,fulfillment,recipient_name,recipient_phone,address,destination_lat,destination_lng,notes,subtotal_centavos,delivery_fee_centavos,total_centavos,distance_metres,settings_version) values(order_id,owner,req,'CD-'||upper(replace(order_id::text,'-','')),method,name,phone,address,lat,lng,notes,subtotal,fee,total,case when method='delivery' then q.distance_metres else null end,case when method='delivery' then s.version else null end);
 for item in select value from jsonb_array_elements(items) loop
  select * into product from public.products where id=(item->>'productId')::uuid;
  insert into public.order_items(order_id,product_id,name,unit_price_centavos,quantity) values(order_id,product.id,product.name,product.price_centavos,(item->>'quantity')::int);
 end loop;
 insert into public.order_events(order_id,actor_id,action_id,action,status) values(order_id,owner,req,'placed','pending');
 insert into restaurant_private.order_requests(request_id,owner_id,payload_hash,order_id) values(req,owner,payload_hash,order_id);
 if method='delivery' then update restaurant_private.delivery_quotes set consumed_order_id=order_id where id=q.id;end if;
 return restaurant_private.success(restaurant_private.order_detail(order_id));
 exception when invalid_text_representation or numeric_value_out_of_range or check_violation then return restaurant_private.fail('INVALID_REQUEST','Review the order fields and quantities.');end$$;
create function public.place_order(p_request jsonb) returns jsonb language sql security invoker set search_path='' as $$select restaurant_private.place_order(p_request)$$;
create function restaurant_private.get_my_order(p_request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare result jsonb;begin
 if not restaurant_private.verified_user(auth.uid()) then return restaurant_private.fail('VERIFICATION_REQUIRED','Verify your email.');end if;
 select restaurant_private.order_detail(id) into result from public.orders where id=(p_request->>'orderId')::uuid and owner_id=auth.uid();
 if result is null then return restaurant_private.fail('NOT_FOUND','Order not found.');end if;return restaurant_private.success(result);
 exception when invalid_text_representation then return restaurant_private.fail('NOT_FOUND','Order not found.');end$$;
create function public.get_my_order(p_request jsonb) returns jsonb language sql security invoker set search_path='' as $$select restaurant_private.get_my_order(p_request)$$;
create function restaurant_private.find_my_request(p_request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare result jsonb;begin
 if not restaurant_private.verified_user(auth.uid()) then return restaurant_private.fail('VERIFICATION_REQUIRED','Verify your email.');end if;
 select restaurant_private.order_detail(order_id) into result from restaurant_private.order_requests where request_id=(p_request->>'requestId')::uuid and owner_id=auth.uid();return restaurant_private.success(result);
 exception when invalid_text_representation then return restaurant_private.fail('INVALID_REQUEST','Invalid request ID.');end$$;
create function public.find_my_order_request(p_request jsonb) returns jsonb language sql security invoker set search_path='' as $$select restaurant_private.find_my_request(p_request)$$;
create function restaurant_private.resolve_request(p_request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare req uuid;existing restaurant_private.order_requests;begin
 if not restaurant_private.verified_user(auth.uid()) then return restaurant_private.fail('VERIFICATION_REQUIRED','Verify your email.');end if;
 req:=(p_request->>'requestId')::uuid;if req is null then return restaurant_private.fail('INVALID_REQUEST','Invalid request ID.');end if;
 perform pg_advisory_xact_lock(hashtextextended(req::text,0));select * into existing from restaurant_private.order_requests where request_id=req;
 if found and existing.owner_id<>auth.uid() then return restaurant_private.fail('REQUEST_CONFLICT','This request cannot be resolved.');end if;
 if found and existing.order_id is not null then return restaurant_private.success(jsonb_build_object('order',restaurant_private.order_detail(existing.order_id),'abandoned',false));end if;
 insert into restaurant_private.order_requests(request_id,owner_id,abandoned) values(req,auth.uid(),true) on conflict(request_id) do update set abandoned=true;
 return restaurant_private.success(jsonb_build_object('order',null,'abandoned',true));
 exception when invalid_text_representation then return restaurant_private.fail('INVALID_REQUEST','Invalid request ID.');end$$;
create function public.resolve_unknown_request(p_request jsonb) returns jsonb language sql security invoker set search_path='' as $$select restaurant_private.resolve_request(p_request)$$;
create function restaurant_private.list_my_orders(p_request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare lim integer;cursor_id uuid;cursor_time timestamptz;records jsonb;next_cursor text;begin
 if not restaurant_private.verified_user(auth.uid()) then return restaurant_private.fail('VERIFICATION_REQUIRED','Verify your email.');end if;
 lim:=least(50,greatest(1,coalesce((p_request->>'limit')::int,20)));cursor_id:=nullif(p_request->>'cursor','')::uuid;
 if cursor_id is not null then select created_at into cursor_time from public.orders where id=cursor_id and owner_id=auth.uid();if cursor_time is null then return restaurant_private.fail('INVALID_CURSOR','Reload order history.');end if;end if;
 select coalesce(jsonb_agg(restaurant_private.order_summary(x.id) order by x.created_at desc,x.id desc),'[]') into records from(select id,created_at from public.orders where owner_id=auth.uid() and (cursor_id is null or (created_at,id)<(cursor_time,cursor_id)) order by created_at desc,id desc limit lim+1)x;
 if jsonb_array_length(records)>lim then next_cursor:=records->(lim-1)->>'id';records:=records-lim;end if;
 return restaurant_private.success(jsonb_build_object('items',records,'nextCursor',next_cursor));
 exception when invalid_text_representation then return restaurant_private.fail('INVALID_CURSOR','Reload order history.');end$$;
create function public.list_my_orders(p_request jsonb) returns jsonb language sql security invoker set search_path='' as $$select restaurant_private.list_my_orders(p_request)$$;
create function restaurant_private.customer_cancel(p_request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare o public.orders;act uuid;receipt restaurant_private.action_receipts;hash text;result jsonb;begin
 if not restaurant_private.verified_user(auth.uid()) then return restaurant_private.fail('VERIFICATION_REQUIRED','Verify your email.');end if;
 act:=(p_request->>'actionId')::uuid;if act is null then return restaurant_private.fail('INVALID_REQUEST','Missing action reference.');end if;
 hash:=encode(sha256(convert_to(p_request::text,'UTF8')),'hex');perform pg_advisory_xact_lock(hashtextextended(act::text,1));
 select * into receipt from restaurant_private.action_receipts where action_id=act;
 if found then if receipt.actor_id<>auth.uid() or receipt.payload_hash<>hash then return restaurant_private.fail('ACTION_CONFLICT','Reload the order.');end if;return receipt.result;end if;
 select * into o from public.orders where id=(p_request->>'orderId')::uuid and owner_id=auth.uid() for update;
 if not found then return restaurant_private.fail('NOT_FOUND','Order not found.');end if;
 if o.version is distinct from (p_request->>'expectedVersion')::int then return restaurant_private.fail('STALE_VERSION','Order changed. Reload its details.');end if;
 if o.status<>'pending' then return restaurant_private.fail('INVALID_TRANSITION','Contact restaurant staff to change this order.');end if;
 update public.orders set status='cancelled',version=version+1 where id=o.id;
 insert into public.order_events(order_id,actor_id,action_id,action,status) values(o.id,auth.uid(),act,'customer_cancel','cancelled');
 result:=restaurant_private.success(restaurant_private.order_detail(o.id));insert into restaurant_private.action_receipts(action_id,actor_id,payload_hash,result) values(act,auth.uid(),hash,result);return result;
 exception when invalid_text_representation then return restaurant_private.fail('INVALID_REQUEST','Review the action reference.');end$$;
create function public.customer_cancel_order(p_request jsonb) returns jsonb language sql security invoker set search_path='' as $$select restaurant_private.customer_cancel(p_request)$$;
revoke all on all functions in schema restaurant_private from public,anon,authenticated;
grant execute on function restaurant_private.my_access() to anon,authenticated;
grant execute on function restaurant_private.place_order(jsonb),restaurant_private.get_my_order(jsonb),restaurant_private.find_my_request(jsonb),restaurant_private.resolve_request(jsonb),restaurant_private.list_my_orders(jsonb),restaurant_private.customer_cancel(jsonb) to authenticated;
revoke all on function public.place_order(jsonb),public.get_my_order(jsonb),public.find_my_order_request(jsonb),public.resolve_unknown_request(jsonb),public.list_my_orders(jsonb),public.customer_cancel_order(jsonb) from public,anon,authenticated;
grant execute on function public.place_order(jsonb),public.get_my_order(jsonb),public.find_my_order_request(jsonb),public.resolve_unknown_request(jsonb),public.list_my_orders(jsonb),public.customer_cancel_order(jsonb) to authenticated;
