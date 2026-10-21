import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve(process.env.DATA_DIR||'data'),folder=path.join(dir,'backups');
function backup(){if(!fs.existsSync(path.join(dir,'babe.sqlite')))return false;const result=spawnSync(process.execPath,['scripts/backup.mjs'],{stdio:'inherit'});if(result.status!==0){console.error('Falha no backup; nova tentativa em uma hora.');return false;}for(const file of fs.readdirSync(folder)){if(!/^babe-[\dTZ-]+\.sqlite$/.test(file))continue;const candidate=path.join(folder,file);if(fs.statSync(candidate).mtimeMs<Date.now()-30*24*60*60*1000)fs.unlinkSync(candidate);}return true;}
let next=0;function tick(){if(Date.now()>=next)next=Date.now()+(backup()?24*60*60*1000:60*60*1000);}
tick();setInterval(tick,60*1000);
