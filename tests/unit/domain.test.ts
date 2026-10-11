import {describe,it,expect} from 'vitest';
import {deliveryFeeCentavos} from '../../src/domain/money';
import {normalizePhone,validateCoordinates} from '../../src/domain/validation';
import {canTransition} from '../../src/domain/workflow';
describe('trusted delivery money',()=>{
  it.each([[100,5000],[3000,5000],[4000,6000],[12000,18000],[4000.01,6100]])('quotes %s metres as %s centavos',(metres,want)=>expect(deliveryFeeCentavos(metres,1500,5000)).toBe(want));
  it.each([NaN,Infinity,-1])('rejects invalid metres %s',distance=>expect(()=>deliveryFeeCentavos(distance,1500,5000)).toThrow());
});
it('normalizes local Philippine mobile numbers',()=>expect(normalizePhone('0917 123 4567')).toBe('+639171234567'));
it('rejects malformed phone numbers',()=>expect(()=>normalizePhone('abc')).toThrow());
it('rejects nonfinite and out of range coordinates',()=>{expect(validateCoordinates({lat:Infinity,lng:120})).toBe(false);expect(validateCoordinates({lat:91,lng:120})).toBe(false);expect(validateCoordinates({lat:14.5995,lng:120.9842})).toBe(true)});
it('separates pickup and delivery status paths',()=>{expect(canTransition('pickup','ready','dispatch')).toBe(false);expect(canTransition('delivery','ready','complete')).toBe(false);expect(canTransition('delivery','ready','dispatch')).toBe(true)});
it('terminal statuses cannot advance or take payment',()=>{expect(canTransition('pickup','cancelled','accept')).toBe(false);expect(canTransition('pickup','rejected','collect_payment')).toBe(false)});
