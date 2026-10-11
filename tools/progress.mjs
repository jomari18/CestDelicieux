import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const plan='docs/superpowers/plans/2026-10-11-react-supabase-android.md';
const dir='.superpowers/sdd/2026-10-11-react-supabase-android';
mkdirSync(dir,{recursive:true});
const [command,n,...message]=process.argv.slice(2);
if(command==='start'){
 const text=readFileSync(plan,'utf8');const match=text.match(new RegExp('### Task '+n+':[\\s\\S]*?(?=\\n### Task |\\n## Self-review|$)'));
 if(!match)throw Error('Missing task');
 const base=execFileSync('git',['-c','safe.directory='+resolve('.').replaceAll('\\','/'),'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const path=dir+'/task-'+n+'-brief.md';writeFileSync(path,text.slice(text.indexOf('## Global Constraints'),text.indexOf('## Files and shared contracts'))+'\n'+match[0]);
 appendFileSync(dir+'/progress.md',`\nTask ${n}: in progress (BASE ${base}).\n`);console.log(readFileSync(path,'utf8'));
}else if(command==='note')appendFileSync(dir+'/progress.md',`\nTask ${n}: ${message.join(' ')}\n`);
else throw Error('Use start N or note N MESSAGE');
