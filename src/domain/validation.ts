import type {Coordinates,OrderRequest,ContactRequest} from './contracts';
export function normalizePhone(input:string):string {
  const phone=input.replace(/[\s()-]/g,'');
  if(/^09\d{9}$/.test(phone)) return '+63'+phone.slice(1);
  if(/^\+639\d{9}$/.test(phone)) return phone;
  throw new Error('Enter a Philippine mobile number, e.g. 0917 123 4567.');
}
export function validateCoordinates(value:Coordinates):boolean {return Number.isFinite(value?.lat)&&Number.isFinite(value?.lng)&&Math.abs(value.lat)<=90&&Math.abs(value.lng)<=180;}
export const isUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function validateOrder(request:OrderRequest):string|null {
  if(!isUuid(request.requestId)) return 'Invalid order request.';
  if(request.recipient.name.trim().length<2||request.recipient.name.trim().length>100) return 'Enter your name (2–100 characters).';
  try{normalizePhone(request.recipient.phone)}catch{return 'Enter a valid Philippine mobile number.'}
  if(!request.items.length||request.items.length>30||new Set(request.items.map(x=>x.productId)).size!==request.items.length||request.items.some(x=>!isUuid(x.productId)||!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>99)) return 'Review the items and quantities in your order.';
  if(request.notes.length>500) return 'Notes must be 500 characters or fewer.';
  if(!Number.isSafeInteger(request.expectedSubtotalCentavos)||request.expectedSubtotalCentavos<0||request.expectedSubtotalCentavos>3000000000) return 'Review your order total.';
  if(request.fulfillment==='delivery'&&(!request.address||request.address.trim().length<10||request.address.trim().length>500||!request.destination||!validateCoordinates(request.destination)||!request.quoteId||!isUuid(request.quoteId))) return 'Confirm your delivery address, pin and current quote.';
  if(request.fulfillment!=='pickup'&&request.fulfillment!=='delivery') return 'Choose pickup or delivery.';
  return null;
}
export function validateContact(request:ContactRequest):string|null {
  if(request.name.trim().length<2||request.name.trim().length>100) return 'Enter a name (2–100 characters).';
  if(request.email.length>254||!/^\S+@\S+\.\S+$/.test(request.email)) return 'Enter a valid email.';
  if(request.phone.length>32) return 'Phone must be 32 characters or fewer.';
  if(request.message.trim().length<10||request.message.trim().length>2000) return 'Message must be 10–2000 characters.';
  return null;
}
