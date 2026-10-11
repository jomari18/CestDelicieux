import type {ApiResult} from '../../domain/contracts';
export class MutationAttempt {
 current:Record<string,unknown>|null=null;
 lock(request:Record<string,unknown>){this.current??=structuredClone({...request,actionId:crypto.randomUUID()});return structuredClone(this.current)}
 finish(result:ApiResult<unknown>):'saved'|'reload'|'retry'|'rejected'{if(result.ok){this.current=null;return 'saved'}if(['NETWORK_ERROR','API_ERROR'].includes(result.code)||/^[0-9A-Z]{5}$/.test(result.code))return 'retry';this.current=null;return result.code==='STALE_VERSION'?'reload':'rejected'}
}
