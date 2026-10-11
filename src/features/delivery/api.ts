import type {ApiResult,Coordinates,DeliveryPolicy,DeliveryQuote} from '../../domain/contracts';
import {supabase} from '../../lib/supabase';
import {unavailable,networkFailure} from '../../lib/api';
export async function requestDeliveryQuote(destination:Coordinates,signal?:AbortSignal):Promise<ApiResult<DeliveryQuote>>{
 if(!supabase)return unavailable();
 try{const {data,error}=await supabase.functions.invoke('delivery-quote',{body:{destination},signal});if(error){const context=(error as {context?:Response}).context;if(context instanceof Response){try{return await context.json()}catch{}}return networkFailure()}return data}catch{return networkFailure()}
}
export async function getDeliveryPolicy():Promise<ApiResult<DeliveryPolicy>>{
 if(!supabase)return unavailable();
 try{const {data,error}=await supabase.from('restaurant_settings').select('*').eq('id',true).single();if(error)return networkFailure();return {ok:true,data:{origin:{lat:Number(data.origin_lat),lng:Number(data.origin_lng)},label:data.label,perKmCentavos:data.per_km_centavos,minimumCentavos:data.minimum_centavos,maxDistanceMetres:data.max_distance_metres,enabled:data.enabled,version:data.version}}}catch{return networkFailure()}
}
