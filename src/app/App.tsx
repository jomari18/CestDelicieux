import {readPublicConfig} from '../lib/config';
export default function App(){const config=readPublicConfig(import.meta.env);return <main><h1>C’est Délicieux</h1><p>Atmospheric Supper Club</p>{!config.ok&&<p role="status">{config.message}</p>}</main>}
