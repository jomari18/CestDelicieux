begin;
do $$declare reservation jsonb;quote jsonb;begin
 reservation:=public.reserve_quote_request(jsonb_build_object('ownerId','10000000-0000-4000-8000-000000000001','destination',jsonb_build_object('lat',14.61,'lng',120.99)));
 perform public.test_assert((reservation->>'ok')::boolean,'reserve verified quote');
 quote:=public.store_delivery_quote(jsonb_build_object('reservationId',reservation->'data'->>'id','distanceMetres',4000));
 perform public.test_assert((quote->'data'->>'feeCentavos')::integer=6000,'trusted 4km fee');
 perform public.test_assert((quote->'data'->>'expiresAt')::timestamptz-(quote->'data'->>'issuedAt')::timestamptz=interval '5 minutes','five minute TTL');
 reservation:=public.reserve_quote_request(jsonb_build_object('ownerId','10000000-0000-4000-8000-000000000004','destination',jsonb_build_object('lat',14.61,'lng',120.99)));
 perform public.test_assert(reservation->>'code'='VERIFICATION_REQUIRED','unverified cannot quote');
 reservation:=public.reserve_quote_request(jsonb_build_object('ownerId','10000000-0000-4000-8000-000000000001','destination',jsonb_build_object('lat',91,'lng',120.99)));
 perform public.test_assert(reservation->>'code'='INVALID_DESTINATION','invalid coordinates');
 reservation:=public.reserve_quote_request(jsonb_build_object('ownerId','10000000-0000-4000-8000-000000000001','destination',jsonb_build_object('lat',14.61,'lng',120.99)));
 update public.restaurant_settings set version=version+1 where id;
 quote:=public.store_delivery_quote(jsonb_build_object('reservationId',reservation->'data'->>'id','distanceMetres',4000));
 perform public.test_assert(quote->>'code'='POLICY_CHANGED','policy change invalidates in flight quote');
end$$;
rollback;
