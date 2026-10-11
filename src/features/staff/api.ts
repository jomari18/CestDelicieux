import {rpc} from '../../lib/api';import type {OrderDetail,OrderFilters,OrderSummary,Page,Product,Category,ContactMessage,DeliveryPolicy} from '../../domain/contracts';
export const staffListOrders=(filters:OrderFilters)=>rpc<Page<OrderSummary>>('staff_list_orders',filters);
export const staffGetOrder=(orderId:string)=>rpc<OrderDetail>('staff_get_order',{orderId});
export const staffCatalog=()=>rpc<{products:Product[];categories:Category[]}>('staff_get_catalog');
export const staffMessages=(cursor:string|null=null)=>rpc<Page<ContactMessage>>('staff_list_messages',{cursor,limit:20});
export const staffSaveMenu=(request:Record<string,unknown>)=>rpc<Product|Category>('staff_save_menu',request);
export const staffSavePolicy=(request:Record<string,unknown>)=>rpc<DeliveryPolicy>('staff_save_policy',request);
