import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
assert.equal(Object.keys(pkg.dependencies||{}).length,0,'Dependências precisam de auditoria npm.');
assert.equal(Object.keys(pkg.devDependencies||{}).length,0,'Dependências de desenvolvimento precisam de auditoria npm.');
let count=0;
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);assert(!entry.isSymbolicLink(),`Link simbólico em arquivos públicos: ${file}`);assert(!/^\.|\.(?:sqlite|pem|key|env|map)$/.test(entry.name),`Arquivo sensível público: ${file}`);if(entry.isDirectory())scan(file);else if(/\.(?:html|js|css)$/.test(file)){const source=fs.readFileSync(file,'utf8');assert(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bAKIA[A-Z0-9]{16}\b|\bsk-[a-zA-Z0-9]{32,}\b/.test(source),`Possível segredo em ${file}`);assert(!/\beval\s*\(|new Function\s*\(/.test(source),`Execução dinâmica em ${file}`);count++;}}}
scan('dist');
const ignored=fs.readFileSync('.gitignore','utf8');for(const item of ['.env','data/','backups/'])assert(ignored.includes(item),`Ignore obrigatório ausente: ${item}`);
console.log(`Verificação estática aprovada: ${count} arquivos públicos, sem dependências npm e sem padrões de segredos detectados.`);
console.log('Os testes de segurança HTTP são executados por npm test. Isto não equivale a um pentest externo.');
