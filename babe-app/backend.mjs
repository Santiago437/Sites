import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createHash,scryptSync,timingSafeEqual} from 'node:crypto';
import {AsyncLocalStorage} from 'node:async_hooks';
import {seed,DEFAULT_CONTENT} from './dist/seed.js';
import {configureServerStore,validateState,createBooking,createOrder,createMessage} from './dist/store.js';

const base=path.dirname(fileURLToPath(import.meta.url)),root=path.join(base,'dist');
const production=process.env.NODE_ENV==='production';
const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
const origin=process.env.PUBLIC_ORIGIN||`http://127.0.0.1:${port}`;
if(new URL(origin).origin!==origin||(production&&!origin.startsWith('https://')))throw new Error('PUBLIC_ORIGIN deve ser a origem exata; produção exige HTTPS.');
const dir=path.resolve(process.env.DATA_DIR||path.join(base,'data'));
fs.mkdirSync(dir,{recursive:true,mode:0o700});
const db=new DatabaseSync(path.join(dir,'babe.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS previous_state (id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY CHECK(id=1), username TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires INTEGER NOT NULL, touched INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, at TEXT NOT NULL, action TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS requests (key TEXT PRIMARY KEY, result TEXT NOT NULL, expires INTEGER NOT NULL);`);
const passwordHash=(password,salt)=>scryptSync(password,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024});
if(!db.prepare('SELECT id FROM admin').get()){
  const password=process.env.ADMIN_PASSWORD;
  if(typeof password!=='string'||password.length<16||password.length>256)throw new Error('Defina ADMIN_PASSWORD com 16 a 256 caracteres para criar o administrador.');
  const salt=randomBytes(32).toString('hex');
  db.prepare('INSERT INTO admin VALUES (1,?,?,?)').run(process.env.ADMIN_USERNAME||'admin',salt,passwordHash(password,salt).toString('hex'));
}
delete process.env.ADMIN_PASSWORD;
if(!db.prepare('SELECT id FROM state').get())db.prepare('INSERT INTO state VALUES (1,?)').run(JSON.stringify(seed()));
const load=()=>validateState(JSON.parse(db.prepare('SELECT json FROM state WHERE id=1').get().json));
function atomic(fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}
const requestContext=new AsyncLocalStorage();
configureServerStore({load,transaction:fn=>atomic(()=>{const d=load(),result=fn(d);d.revision++;validateState(d);db.prepare('UPDATE state SET json=? WHERE id=1').run(JSON.stringify(d));const key=requestContext.getStore();if(key)db.prepare('INSERT OR REPLACE INTO requests VALUES (?,?,?)').run(key,JSON.stringify(result),Date.now()+24*60*60*1000);return result;})});
const audit=action=>db.prepare('INSERT INTO audit(at,action) VALUES (?,?)').run(new Date().toISOString(),action);
const hash=s=>createHash('sha256').update(s).digest('hex');
function publicState(){const d=load();const pick=(row,keys)=>Object.fromEntries(keys.map(k=>[k,row[k]]));return {version:d.version,revision:d.revision,content:pick(d.content,Object.keys(DEFAULT_CONTENT)),availability:pick(d.availability,['interval','weekly','overrides']),services:d.services.filter(s=>s.active).map(s=>pick(s,['id','title','description','category','price','duration','image','active'])),products:d.products.filter(p=>p.active).map(p=>pick(p,['id','title','description','category','price','stock','image','active'])),bookings:d.bookings.filter(b=>b.status!=='cancelled').map(b=>({date:b.date,time:b.time,duration:b.duration,status:'confirmed'})),orders:[],messages:[],notifications:[]};}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
function headers(res){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");if(production)res.setHeader('Strict-Transport-Security','max-age=31536000');}
function fail(status,message){const e=new Error(message);e.status=status;throw e;}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}
async function body(req){if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))fail(415,'Envie JSON.');let size=0;const parts=[];for await(const part of req){size+=part.length;if(size>6*1024*1024)fail(413,'Arquivo maior que 6 MB.');parts.push(part);}try{const data=JSON.parse(Buffer.concat(parts).toString());if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{fail(400,'JSON inválido.');}}
function limit(key,max,windowMs){const now=Date.now();const row=db.prepare('SELECT * FROM limits WHERE key=?').get(key);if(row&&row.expires>now){if(row.count>=max)fail(429,'Muitas tentativas. Aguarde antes de tentar novamente.');db.prepare('UPDATE limits SET count=count+1 WHERE key=?').run(key);}else db.prepare('INSERT OR REPLACE INTO limits VALUES (?,1,?)').run(key,now+windowMs);}
function session(req){const raw=(req.headers.cookie||'').match(/(?:^|;\s*)babe_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!raw)return null;const row=db.prepare('SELECT * FROM sessions WHERE token=?').get(hash(raw));if(!row)return null;const now=Date.now();if(row.expires<now||row.touched<now-30*60*1000){db.prepare('DELETE FROM sessions WHERE token=?').run(row.token);return null;}db.prepare('UPDATE sessions SET touched=? WHERE token=?').run(now,row.token);return row;}
function cookie(res,value,maxAge){res.setHeader('Set-Cookie',`babe_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${production?'; Secure':''}`);}
function only(data,keys){if(Object.keys(data).some(k=>!keys.includes(k)))fail(400,'Campo não permitido.');}
function publicInput(data,type){only(data,type==='bookings'?['serviceId','date','time','expectedPrice','expectedDuration','customer','consent']:['cart','expectedTotal','customer','consent','delivery','address']);if(!data.customer||typeof data.customer!=='object'||Array.isArray(data.customer))fail(400,'Cliente inválido.');only(data.customer,['name','phone','email','notes']);if(type==='orders'&&Array.isArray(data.cart))for(const item of data.cart){if(!item||typeof item!=='object')fail(400,'Item inválido.');only(item,['id','quantity']);}return data;}

const server=http.createServer(async(req,res)=>{
  headers(res);
  try{
    const url=new URL(req.url,origin),route=url.pathname;
    if(req.headers.host!==new URL(origin).host)fail(400,'Host inválido.');
    if(route.startsWith('/api/')){
      const ip=req.socket.remoteAddress;
      // Enable only behind one trusted proxy that overwrites X-Forwarded-For.
      const client=process.env.TRUST_PROXY==='1'?(req.headers['x-forwarded-for']||ip).split(',').at(-1).trim():ip;
      limit('api:'+client,600,60*1000);
      const write=['POST','PUT','DELETE','PATCH'].includes(req.method);
      if(write&&req.headers.origin!==origin)fail(403,'Origem não autorizada.');
      if(write&&req.headers['sec-fetch-site']==='cross-site')fail(403,'Requisição não autorizada.');
      if(route==='/api/health'&&req.method==='GET'){db.prepare('SELECT id FROM state').get();return json(res,200,{ok:true});}
      if(route==='/api/state'&&req.method==='GET')return json(res,200,publicState());
      const auth=session(req);
      if(route==='/api/session'&&req.method==='GET')return json(res,200,{authenticated:!!auth,...(auth?{csrf:auth.csrf}:{})});
      if(route==='/api/login'&&req.method==='POST'){
        limit('login:'+client,10,15*60*1000);
        const data=await body(req);only(data,['username','password']);
        if(typeof data.username!=='string'||typeof data.password!=='string'||data.password.length>256)fail(400,'Credenciais inválidas.');
        const admin=db.prepare('SELECT * FROM admin WHERE id=1').get(),supplied=passwordHash(data.password,admin.salt);
        if(!timingSafeEqual(supplied,Buffer.from(admin.hash,'hex'))||data.username!==admin.username){audit('login_failure');fail(401,'Usuário ou senha incorretos.');}
        const token=randomBytes(32).toString('hex'),csrf=randomBytes(32).toString('hex'),now=Date.now();
        if(auth)db.prepare('DELETE FROM sessions WHERE token=?').run(auth.token);
        db.prepare('INSERT INTO sessions VALUES (?,?,?,?)').run(hash(token),csrf,now+8*60*60*1000,now);cookie(res,token,8*60*60);audit('login_success');return json(res,200,{ok:true});
      }
      if(route.startsWith('/api/admin/')||route==='/api/logout'){
        if(!auth)fail(401,'Entre no painel para continuar.');
        if(write&&req.headers['x-csrf-token']!==auth.csrf)fail(403,'Sessão inválida. Atualize a página.');
        if(route==='/api/logout'&&req.method==='POST'){db.prepare('DELETE FROM sessions WHERE token=?').run(auth.token);cookie(res,'',0);return json(res,200,{ok:true});}
        if(route==='/api/admin/state'&&req.method==='GET')return json(res,200,load());
        if(route==='/api/admin/previous'&&req.method==='GET'){const previous=db.prepare('SELECT json FROM previous_state WHERE id=1').get();if(!previous)fail(404,'Nenhuma cópia anterior disponível.');return json(res,200,JSON.parse(previous.json));}
        if(route==='/api/admin/state'&&req.method==='PUT'){
          const data=await body(req);only(data,['revision','state']);validateState(data.state);
          const saved=atomic(()=>{const current=load();if(data.revision!==current.revision)fail(409,'Os dados mudaram. Atualize e tente novamente.');const next=data.state;next.revision=current.revision+1;validateState(next);db.prepare('INSERT OR REPLACE INTO previous_state VALUES (1,?)').run(JSON.stringify(current));db.prepare('UPDATE state SET json=? WHERE id=1').run(JSON.stringify(next));audit('admin_update');return next;});return json(res,200,saved);
        }
      }
      if(['/api/bookings','/api/orders','/api/messages'].includes(route)&&req.method==='POST'){
        limit('submit:'+client,30,60*60*1000);
        const data=await body(req),type=route.slice(5);
        const id=req.headers['idempotency-key'];if(id!==undefined&&!/^[a-f0-9-]{36}$/.test(id))fail(400,'Identificador de requisição inválido.');
        const key=id?hash(route+':'+id+':'+JSON.stringify(data)):null;
        const previous=key&&db.prepare('SELECT result FROM requests WHERE key=? AND expires>?').get(key,Date.now());if(previous)return json(res,200,JSON.parse(previous.result));
        if(type==='messages')only(data,['name','email','message','consent']);else publicInput(data,type);
        const result=await requestContext.run(key,()=>type==='bookings'?createBooking({...data,source:'online'}):type==='orders'?createOrder(data):createMessage(data));
        audit('public_'+type);return json(res,201,result);
      }
      fail(404,'Rota não encontrada.');
    }
    if(!['GET','HEAD'].includes(req.method))fail(405,'Método não permitido.');
    let requested;try{requested=decodeURIComponent(url.pathname);}catch{fail(400,'Caminho inválido.');}
    if(requested.includes('\\')||requested.includes('\0')||requested.split('/').some(x=>x.startsWith('.')))fail(400,'Caminho inválido.');
    const file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
    if(!file.startsWith(root+path.sep)||!types[path.extname(file)])fail(404,'Arquivo não encontrado.');
    let real;try{real=fs.realpathSync(file);if(!real.startsWith(fs.realpathSync(root)+path.sep)||!fs.statSync(real).isFile())fail(404,'Arquivo não encontrado.');}catch{fail(404,'Arquivo não encontrado.');}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]});if(req.method==='HEAD')return res.end();fs.createReadStream(real).on('error',()=>res.destroy()).pipe(res);
  }catch(error){if(res.headersSent)return res.destroy();const status=error.status||(error.code?500:400);if(status===500)console.error('Falha interna no servidor:',error.code||error.name);json(res,status,{error:status===500?'Falha interna. Tente novamente.':error.message});}
});
server.requestTimeout=15000;server.headersTimeout=10000;server.maxHeadersCount=60;
server.listen(port,host,()=>console.log(`BABE disponível em ${origin}`));
const cleanup=setInterval(()=>{const now=Date.now();db.prepare('DELETE FROM sessions WHERE expires<? OR touched<?').run(now,now-30*60*1000);db.prepare('DELETE FROM limits WHERE expires<?').run(now);db.prepare('DELETE FROM requests WHERE expires<?').run(now);db.prepare('DELETE FROM audit WHERE at<?').run(new Date(now-90*24*60*60*1000).toISOString());},60*1000);cleanup.unref();
function shutdown(){clearInterval(cleanup);server.close(()=>{db.close();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
