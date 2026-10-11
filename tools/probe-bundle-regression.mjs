import {readFile,writeFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const file=(await readdir('dist/assets')).find(x=>/^index-.*\.js$/.test(x));
const target='dist/assets/'+file,original=await readFile(target,'utf8');
const token=[{alg:'HS256',typ:'JWT'},{role:'service_role'},'synthetic-signature'].map(x=>typeof x==='string'?x:Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
try{
  await writeFile(target,original+'\n/* '+token+' */');
  const probe=spawnSync(process.execPath,['tools/check-bundle.mjs'],{encoding:'utf8'});
  if(probe.status===0)throw Error('REGRESSION: bundle checker accepted a synthetic privileged JWT');
  console.log('PASS privileged legacy JWT is rejected by the actual bundle check');
}finally{await writeFile(target,original)}
