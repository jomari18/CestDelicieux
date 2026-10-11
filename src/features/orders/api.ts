import {rpc} from '../../lib/api';import type {OrderDetail,OrderRequest,OrderSummary,Page} from '../../domain/contracts';
export const placeOrder=(request:OrderRequest)=>rpc<OrderDetail>('place_order',request);
export const findMyOrderRequest=(requestId:string)=>rpc<OrderDetail|null>('find_my_order_request',{requestId});
export const resolveUnknownRequest=(requestId:string)=>rpc<{order:OrderDetail|null;abandoned:boolean}>('resolve_unknown_request',{requestId});
export const getMyOrder=(orderId:string)=>rpc<OrderDetail>('get_my_order',{orderId});
export const listMyOrders=(cursor:string|null=null)=>rpc<Page<OrderSummary>>('list_my_orders',{cursor,limit:20});
export const cancelMyOrder=(orderId:string,expectedVersion:number,actionId:string)=>rpc<OrderDetail>('customer_cancel_order',{orderId,expectedVersion,actionId});
