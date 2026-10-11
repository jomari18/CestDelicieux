import {it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../../',import.meta.url);
it('retains every unique source dish at its original price with usable images',()=>{
 const manifest=JSON.parse(readFileSync(new URL('src/features/catalog/seed-manifest.json',root),'utf8'));
 expect(manifest.products).toHaveLength(25);
 expect(new Set(manifest.products.map((p:any)=>p.id)).size).toBe(25);
 expect(new Set(manifest.products.map((p:any)=>p.slug)).size).toBe(25);
 expect(manifest.products.find((p:any)=>p.name==='Spicy Lobster').priceCentavos).toBe(169900);
 expect(manifest.products.find((p:any)=>p.name==='calamansi juice').priceCentavos).toBe(15000);
 for(const p of manifest.products){expect(Number.isInteger(p.priceCentavos)&&p.priceCentavos>0).toBe(true);expect(existsSync(new URL('public'+p.imageUrl,root))).toBe(true)}
});
