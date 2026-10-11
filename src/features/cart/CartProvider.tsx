import {createContext,useContext,useState,type ReactNode} from 'react';
import type {CartLine} from '../../domain/contracts';
import {readCart,setCartQuantity} from '../../domain/cart';
const key='cest-cart-v1';
type Value={lines:CartLine[];error:string;add:(id:string)=>void;setQuantity:(id:string,n:number)=>void;clear:()=>void;count:number};
const Context=createContext<Value|null>(null);
export function CartProvider({children}:{children:ReactNode}){const [lines,setLines]=useState<CartLine[]>(()=>{try{return readCart(localStorage.getItem(key))}catch{return []}}),[error,setError]=useState('');function save(next:CartLine[]){setLines(next);try{localStorage.setItem(key,JSON.stringify({version:1,lines:next}));setError('')}catch{setError('Browser storage is unavailable. Your order stays here while this page is open.')}}function setQuantity(id:string,n:number){try{save(setCartQuantity(lines,id,n))}catch(e){setError((e as Error).message)}}return <Context.Provider value={{lines,error,setQuantity,add:id=>setQuantity(id,(lines.find(l=>l.productId===id)?.quantity??0)+1),clear:()=>save([]),count:lines.reduce((n,l)=>n+l.quantity,0)}}>{children}</Context.Provider>}
export function useCart(){const v=useContext(Context);if(!v)throw Error('CartProvider missing');return v}
