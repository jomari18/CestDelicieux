import type {ApiResult,Coordinates,DeliveryQuote} from '../../../src/domain/contracts.ts';
export type Reservation={id:string;origin:Coordinates;destination:Coordinates;settingsVersion:number;maxDistanceMetres:number};
export type QuoteDependencies={origins:string[];configured:boolean;verifyUser:(token:string)=>Promise<{id:string;verified:boolean}|null>;reserve:(ownerId:string,destination:Coordinates)=>Promise<ApiResult<Reservation>>;route:(reservation:Reservation)=>Promise<number>;store:(reservationId:string,distanceMetres:number)=>Promise<ApiResult<DeliveryQuote>>};
export async function handleQuote(request:Request,deps:QuoteDependencies):Promise<Response>{
 const origin=request.headers.get('origin');const allowed=!origin||deps.origins.includes(origin);
 const headers:Record<string,string>={'content-type':'application/json','cache-control':'no-store','vary':'Origin','access-control-allow-headers':'authorization, apikey, content-type, x-client-info','access-control-allow-methods':'POST, OPTIONS'};
 if(origin&&allowed)headers['access-control-allow-origin']=origin;
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
 const fail=(status:number,code:string,message:string)=>reply(status,{ok:false,code,message});
 if(!allowed)return fail(403,'ORIGIN_DENIED','This origin is not configured.');
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return fail(405,'METHOD_NOT_ALLOWED','Use POST.');
 const auth=request.headers.get('authorization');if(!auth?.startsWith('Bearer ')||auth.startsWith('Bearer sb_'))return fail(401,'AUTH_REQUIRED','Sign in to estimate delivery.');
 try{
  const user=await deps.verifyUser(auth.slice(7));if(!user)return fail(401,'AUTH_REQUIRED','Sign in again to estimate delivery.');
  if(!user.verified)return fail(403,'VERIFICATION_REQUIRED','Verify your email before checkout.');
  const text=await request.text();if(text.length>1000)return fail(400,'INVALID_DESTINATION','Choose a valid delivery pin.');
  let body;try{body=JSON.parse(text)}catch{return fail(400,'INVALID_DESTINATION','Choose a valid delivery pin.')}
  const destination=body?.destination;
  if(typeof destination?.lat!=='number'||typeof destination?.lng!=='number'||!Number.isFinite(destination.lat)||!Number.isFinite(destination.lng)||Math.abs(destination.lat)>90||Math.abs(destination.lng)>180)return fail(400,'INVALID_DESTINATION','Choose a valid delivery pin.');
  if(!deps.configured)return fail(503,'ROUTING_UNAVAILABLE','Delivery estimates are unavailable. Retry later or choose pickup.');
  const reservation=await deps.reserve(user.id,destination);
  if(!reservation.ok)return reply(reservation.code==='RATE_LIMITED'?429:409,reservation);
  const distance=await deps.route(reservation.data);
  if(!Number.isFinite(distance)||distance<0||distance>reservation.data.maxDistanceMetres)return fail(422,'OUTSIDE_COVERAGE','No valid road route within delivery coverage. Correct your pin or choose pickup.');
  const quote=await deps.store(reservation.data.id,distance);return reply(quote.ok?200:409,quote);
 }catch{return fail(503,'ROUTING_UNAVAILABLE','The road estimate could not be loaded. Retry or choose pickup.');}
}
