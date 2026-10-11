import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {listCatalog,type Catalog} from './api';
const Context=createContext<({loading:boolean;error:string;refresh:()=>Promise<void>}&Catalog)|null>(null);
export function CatalogProvider({children}:{children:ReactNode}){const [catalog,setCatalog]=useState<Catalog>({products:[],categories:[]}),[loading,setLoading]=useState(true),[error,setError]=useState('');async function refresh(){setLoading(true);const result=await listCatalog();if(result.ok){setCatalog(result.data);setError('')}else setError(result.message);setLoading(false)}useEffect(()=>{void refresh()},[]);return <Context.Provider value={{...catalog,loading,error,refresh}}>{children}</Context.Provider>}
export function useCatalog(){const v=useContext(Context);if(!v)throw Error('CatalogProvider missing');return v}
