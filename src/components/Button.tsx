import type {ButtonHTMLAttributes} from 'react';
export function Button({className='',busy,children,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{busy?:boolean}){return <button {...props} className={'button '+className} disabled={props.disabled||busy} aria-busy={busy}>{busy?<><span className="spinner"/> Working…</>:children}</button>}
