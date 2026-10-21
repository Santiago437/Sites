import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const files=['server.mjs','backend.mjs'];
for(const folder of ['dist','scripts','tests'])for(const name of fs.readdirSync(folder))if(/\.(?:js|mjs)$/.test(name))files.push(path.join(folder,name));
for(const file of files){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log(`Sintaxe verificada: ${files.length} arquivos.`);
