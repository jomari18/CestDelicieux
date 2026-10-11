import type {ApiResult} from '../domain/contracts';
import {supabase} from './supabase';
export const unavailable=<T>():ApiResult<T>=>({ok:false,code:'SETUP_REQUIRED',message:'Connect the dedicated restaurant backend first.'});
export const networkFailure=<T>():ApiResult<T>=>({ok:false,code:'NETWORK_ERROR',message:'Connection interrupted. Your changes are kept. Retry when you are online.'});
export async function rpc<T>(name:string,request?:unknown):Promise<ApiResult<T>>{
 if(!supabase)return unavailable();
 try{const {data,error}=await supabase.rpc(name,request===undefined?undefined:{p_request:request});if(error)return {ok:false,code:error.code||'API_ERROR',message:'The request could not be confirmed. Retry or reload.'};return data&&typeof data.ok==='boolean'?data:networkFailure()}catch{return networkFailure()}
}
