import {describe,it,expect} from 'vitest';
import {readCart,setCartQuantity,reconcileCart} from '../../src/domain/cart';
import seed from '../../src/features/catalog/seed-manifest.json';
describe('resilient public cart',()=>{
 it('resets corrupt storage and stores only valid IDs and quantities',()=>{expect(readCart('{')).toEqual([]);expect(readCart(JSON.stringify({version:1,lines:[{productId:seed.products[0].id,quantity:2,password:'secret'}]}))).toEqual([{productId:seed.products[0].id,quantity:2}]);});
 it('merges duplicate IDs and bounds quantities',()=>{expect(readCart(JSON.stringify({version:1,lines:[{productId:seed.products[0].id,quantity:80},{productId:seed.products[0].id,quantity:30}]}))[0].quantity).toBe(99);expect(()=>setCartQuantity([],seed.products[0].id,100)).toThrow();});
 it('limits distinct products without losing the existing cart',()=>{const lines=Array.from({length:30},(_,i)=>({productId:`10000000-0000-4000-8000-${String(i).padStart(12,'0')}`,quantity:1}));expect(()=>setCartQuantity(lines,seed.products[0].id,1)).toThrow();expect(lines).toHaveLength(30);});
 it('keeps missing items visible for explicit correction',()=>{const result=reconcileCart([{productId:seed.products[0].id,quantity:2}],[]);expect(result.lines).toHaveLength(1);expect(result.issues).toHaveLength(1);});
 it('calculates from current prices so checkout can require a new review',()=>{const lines=[{productId:seed.products[0].id,quantity:2}];expect(reconcileCart(lines,[{...seed.products[0],priceCentavos:100}]).subtotalCentavos).toBe(200);});
});
