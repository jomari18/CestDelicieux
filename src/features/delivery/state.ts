export class QuoteScope {
 private key='';private generation=0;private until=0;
 constructor(private now:()=>number=()=>performance.now()){}
 change(key:string){if(this.key!==key){this.key=key;this.invalidate()}}
 invalidate(){this.generation++;this.until=0}
 start(){this.invalidate();return {generation:this.generation,started:this.now()}}
 accept(request:{generation:number;started:number},quote:{issuedAt:string;expiresAt:string}){if(request.generation!==this.generation)return false;const ttl=Date.parse(quote.expiresAt)-Date.parse(quote.issuedAt);this.until=request.started+Math.min(300000,Math.max(0,ttl));return Number.isFinite(ttl)&&this.until>this.now()}
 remaining(){return Math.max(0,Math.ceil((this.until-this.now())/1000))}
}
