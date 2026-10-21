import {KEY, seed, DEFAULT_CONTENT} from './seed.js';

let serverStore=null, remote=false, cached=null, csrf='', authenticated=false;
const pendingActions=new Map();
export function configureServerStore(adapter){serverStore=adapter;}
export const isAuthenticated=()=>authenticated;
export const previousBackup=()=>api('/api/admin/previous');
async function api(url,method='GET',body,extraHeaders={}){
  const response=await fetch(url,{method,credentials:'same-origin',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(csrf?{'X-CSRF-Token':csrf}:{}),...extraHeaders},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const result=await response.json();
  if(!response.ok){if(response.status===401){authenticated=false;csrf='';cached=null;await refreshData();}throw new Error(result.error||'Não foi possível concluir a operação.');}
  return result;
}
export async function initializeBackend(){remote=true;return refreshData();}
export async function refreshData(){
  const session=await api('/api/session');authenticated=session.authenticated;csrf=session.csrf||'';
  cached=await api(authenticated?'/api/admin/state':'/api/state');
  globalThis.dispatchEvent(new CustomEvent('babe:data',{detail:cached}));return cached;
}
export async function login(username,password){await api('/api/login','POST',{username,password});return refreshData();}
export async function logout(){await api('/api/logout','POST',{});authenticated=false;csrf='';return refreshData();}
async function publicMutation(path,input){const signature=path+JSON.stringify(input);if(!pendingActions.has(signature)){if(pendingActions.size>=50)pendingActions.delete(pendingActions.keys().next().value);pendingActions.set(signature,uid());}const result=await api(path,'POST',input,{'Idempotency-Key':pendingActions.get(signature)});pendingActions.delete(signature);try{await refreshData();}catch{globalThis.dispatchEvent(new CustomEvent('babe:refresh-error'));}return result;}
export async function createMessage(input){
  if(remote)return publicMutation('/api/messages',input);
  return transaction(d=>{assert(input.consent===true&&string(input.name,120)&&input.name.trim().length>=2&&string(input.email,160)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)&&string(input.message,3000)&&input.message.trim().length>=5,'Confira nome, e-mail, mensagem e consentimento.');const m={id:uid(),name:input.name.trim(),email:input.email.trim(),message:input.message.trim(),consent:true,createdAt:new Date().toISOString(),read:false};d.messages.unshift(m);notify(d,'message',m.id,'Nova mensagem',`${m.name} enviou uma mensagem pelo site.`);return {id:m.id};});
}

export const uid=()=>globalThis.crypto.randomUUID();
export const cents=n=>Math.round(Number(n)*100);
export const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
export const clock=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
export function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false; const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===s;}
export const validTime=s=>typeof s==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s);
export const weekday=s=>new Date(s+'T12:00:00Z').getUTCDay();
export function addDays(s,n){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function clinicNow(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};}
export const dateLabel=(s,long=false)=>new Intl.DateTimeFormat('pt-BR',{dateStyle:long?'full':'medium',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
export const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
function assert(ok,msg){if(!ok)throw new Error(msg);}
function string(s,max=2000){return typeof s==='string'&&s.length<=max;}
function number(n,max=100000){return typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;}
function customer(c){return c&&string(c.name,120)&&c.name.trim().length>=2&&string(c.phone,40)&&/^[+\d\s().-]{8,40}$/.test(c.phone)&&/^\d{8,15}$/.test(c.phone.replace(/\D/g,''))&&string(c.email,160)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)&&string(c.notes??'',2000);}
export function validImage(s){return string(s,1100000)&&(s===''||/^assets\/[\w.-]+$/.test(s)||/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)||safeHttp(s));}
export function safeHttp(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
export function validateState(d){
  assert(d&&d.version===1&&Number.isInteger(d.revision)&&d.revision>=0,'Formato de dados incompatível.');
  assert(d.content&&Object.keys(DEFAULT_CONTENT).every(k=>string(d.content[k],k.toLowerCase().includes('image')||k==='logo'?1100000:8000)),'Conteúdo inválido.');
  assert(/^#[\da-fA-F]{6}$/.test(d.content.accent),'Cor inválida.');
  for(const k of ['logo','heroImage','aboutImage'])assert(validImage(d.content[k]),'Imagem inválida. Use PNG, JPEG, WebP ou uma URL HTTPS.');
  assert(d.content.timezone==='America/Sao_Paulo'&&d.content.locale==='pt-BR'&&d.content.currency==='BRL','Configuração regional inválida.');
  for(const list of ['services','products','bookings','orders','notifications','messages']){
    assert(Array.isArray(d[list])&&d[list].length<=20000,'Lista de dados inválida.');
    const ids=new Set(); for(const r of d[list]){assert(r&&string(r.id,100)&&/^[\w-]+$/.test(r.id)&&!ids.has(r.id),'Identificador duplicado ou inválido.');ids.add(r.id);}
  }
  for(const s of d.services)assert(string(s.title,160)&&s.title.trim()&&string(s.description,3000)&&string(s.category,100)&&number(s.price)&&Number.isInteger(s.duration)&&s.duration>=15&&s.duration<=480&&validImage(s.image)&&typeof s.active==='boolean','Tratamento inválido.');
  for(const p of d.products)assert(string(p.title,160)&&p.title.trim()&&string(p.description,3000)&&string(p.category,100)&&number(p.price)&&Number.isInteger(p.stock)&&p.stock>=0&&p.stock<=100000&&validImage(p.image)&&typeof p.active==='boolean','Produto inválido.');
  const a=d.availability;assert(a&&[15,30,60].includes(a.interval)&&a.weekly&&a.overrides&&Object.keys(a.overrides).length<=1000,'Disponibilidade inválida.');
  const ranges=rs=>{assert(Array.isArray(rs)&&rs.length<=10,'Período inválido.');let end=-1;for(const r of [...rs].sort((a,b)=>String(a[0]).localeCompare(String(b[0])))){assert(Array.isArray(r)&&r.length===2&&validTime(r[0])&&validTime(r[1])&&minutes(r[0])<minutes(r[1])&&minutes(r[0])>=end,'Os períodos devem ter início antes do fim e não podem se sobrepor.');end=minutes(r[1]);}};
  for(let i=0;i<7;i++)ranges(a.weekly[i]);for(const [day,rs]of Object.entries(a.overrides)){assert(validDate(day),'Data inválida.');ranges(rs);}
  for(const b of d.bookings)assert(validDate(b.date)&&validTime(b.time)&&Number.isInteger(b.duration)&&b.duration>=15&&b.duration<=480&&minutes(b.time)+b.duration<=1440&&string(b.serviceId,100)&&string(b.serviceTitle,160)&&number(b.price)&&customer(b.customer)&&['confirmed','completed','cancelled'].includes(b.status)&&['online','whatsapp'].includes(b.source)&&string(b.createdAt,60),'Agendamento inválido.');
  const days=new Map();for(const b of d.bookings.filter(x=>x.status!=='cancelled')){const list=days.get(b.date)||[];const start=minutes(b.time);assert(!list.some(x=>start<x.end&&start+b.duration>x.start),'O arquivo contém agendamentos sobrepostos.');list.push({start,end:start+b.duration});days.set(b.date,list);}
  for(const o of d.orders){assert(customer(o.customer)&&Array.isArray(o.items)&&o.items.length>0&&o.items.length<=100&&number(o.total,10000000)&&['pending','paid','shipped','delivered','cancelled'].includes(o.status)&&['pickup','delivery'].includes(o.delivery)&&string(o.address,500)&&string(o.createdAt,60)&&Array.isArray(o.history)&&o.history.length<100&&typeof o.stockRestored==='boolean','Pedido inválido.');const ids=new Set();let total=0;for(const i of o.items){assert(i&&string(i.productId,100)&&!ids.has(i.productId)&&string(i.title,160)&&number(i.price)&&Number.isInteger(i.quantity)&&i.quantity>0&&i.quantity<=100000,'Item inválido.');ids.add(i.productId);total+=cents(i.price)*i.quantity;}assert(total===cents(o.total),'Total do pedido inconsistente.');for(const h of o.history)assert(h&&string(h.status,30)&&string(h.at,60),'Histórico inválido.');}
  for(const n of d.notifications)assert(string(n.title,200)&&string(n.text,3000)&&string(n.createdAt,60)&&typeof n.read==='boolean'&&['booking','order','message'].includes(n.kind)&&string(n.ref,100),'Notificação inválida.');
  for(const m of d.messages)assert(string(m.name,120)&&string(m.email,160)&&string(m.message,3000)&&string(m.createdAt,60)&&typeof m.read==='boolean','Mensagem inválida.');
  return d;
}
export function load(){if(serverStore)return serverStore.load();if(remote){if(!cached)throw new Error('Servidor indisponível.');return structuredClone(cached);}const raw=localStorage.getItem(KEY);if(raw===null)return seed();const parsed=JSON.parse(raw);return validateState({...parsed,content:{...DEFAULT_CONTENT,...parsed.content}});}
export function notify(d,kind,ref,title,text){d.notifications.unshift({id:uid(),kind,ref,title,text,createdAt:new Date().toISOString(),read:false,channels:['dashboard']});}
export async function transaction(fn){
  if(serverStore)return serverStore.transaction(fn);
  if(remote){assert(authenticated,'Entre no painel para alterar os dados.');const draft=load(),revision=draft.revision,result=fn(draft);validateState(draft);try{cached=await api('/api/admin/state','PUT',{revision,state:draft});}catch(error){await refreshData();throw error;}globalThis.dispatchEvent(new CustomEvent('babe:data',{detail:cached}));return result;}
  const run=()=>{let d;try{d=load();}catch{throw new Error('Não foi possível ler seus dados. Exporte o arquivo de recuperação no painel antes de restaurar.');}const result=fn(d);d.revision++;validateState(d);try{localStorage.setItem(KEY,JSON.stringify(d));}catch{throw new Error('Não foi possível salvar. O armazenamento pode estar cheio ou bloqueado. Exporte um backup e reduza as imagens; seus dados anteriores foram preservados.');}globalThis.dispatchEvent(new CustomEvent('babe:data',{detail:d}));return result;};
  return globalThis.navigator?.locks?.request?globalThis.navigator.locks.request('babe-data-write',run):run();
}
export function slots(d,serviceId,date,excludeId=''){
  if(!validDate(date))return [];const s=d.services.find(x=>x.id===serviceId&&x.active);if(!s)return [];const now=clinicNow();if(date<now.date||date>addDays(now.date,180))return [];
  const rs=Object.hasOwn(d.availability.overrides,date)?d.availability.overrides[date]:d.availability.weekly[weekday(date)];const busy=d.bookings.filter(b=>b.date===date&&b.status!=='cancelled'&&b.id!==excludeId);const out=[];
  for(const [start,end]of rs){for(let t=minutes(start);t+s.duration<=minutes(end);t+=d.availability.interval){if(date===now.date&&t<=minutes(now.time))continue;if(!busy.some(b=>t<minutes(b.time)+b.duration&&t+s.duration>minutes(b.time)))out.push(clock(t));}}return [...new Set(out)].sort();
}
export async function createBooking(input){if(remote&&!authenticated){const {source,...safe}=input;return publicMutation('/api/bookings',safe);}return transaction(d=>{
  assert(customer(input.customer),'Confira nome, telefone e e-mail.');assert(input.consent===true,'Autorize o uso dos dados para o agendamento.');
  const s=d.services.find(x=>x.id===input.serviceId&&x.active);assert(s,'Este tratamento não está disponível.');assert(slots(d,s.id,input.date).includes(input.time),'Este horário não está mais disponível. Escolha outro horário.');
  assert(input.expectedPrice===undefined||cents(input.expectedPrice)===cents(s.price),'O preço do tratamento mudou. Volte e revise os detalhes antes de confirmar.');assert(input.expectedDuration===undefined||input.expectedDuration===s.duration,'A duração do tratamento mudou. Escolha o horário novamente.');
  const b={id:uid(),serviceId:s.id,serviceTitle:s.title,price:s.price,duration:s.duration,date:input.date,time:input.time,customer:{...input.customer},status:'confirmed',source:input.source==='whatsapp'?'whatsapp':'online',consent:true,createdAt:new Date().toISOString()};d.bookings.push(b);notify(d,'booking',b.id,'Novo agendamento',`${b.customer.name} · ${b.serviceTitle} · ${dateLabel(b.date)} às ${b.time}`);return b;
});}
export async function changeBooking(id,status){return transaction(d=>{assert(['confirmed','completed','cancelled'].includes(status),'Status inválido.');const b=d.bookings.find(x=>x.id===id);assert(b,'Agendamento não encontrado.');if(status==='confirmed'&&b.status==='cancelled'){const exists=d.services.find(s=>s.id===b.serviceId);assert(exists&&exists.duration===b.duration&&slots(d,b.serviceId,b.date,b.id).includes(b.time),'Não é possível reativar: o tratamento ou horário mudou. Crie um novo agendamento.');}b.status=status;return b;});}
export async function createOrder(input){if(remote)return publicMutation('/api/orders',input);return transaction(d=>{
  assert(customer(input.customer),'Confira nome, telefone e e-mail.');assert(input.consent===true,'Autorize o uso dos dados para o pedido.');assert(['pickup','delivery'].includes(input.delivery),'Escolha como receber.');assert(input.delivery==='pickup'||String(input.address??'').trim().length>=10,'Informe o endereço completo.');
  assert(Array.isArray(input.cart)&&input.cart.length>0&&input.cart.length<=100,'Seu carrinho está vazio.');const ids=new Set();let total=0;
  const items=input.cart.map(i=>{const p=d.products.find(p=>p.id===i.id&&p.active);assert(p&&Number.isInteger(i.quantity)&&i.quantity>0&&!ids.has(i.id),'Um produto não está mais disponível. Revise seu carrinho.');ids.add(i.id);assert(p.stock>=i.quantity,`Estoque insuficiente para ${p.title}. Restam ${p.stock} unidades.`);p.stock-=i.quantity;total+=cents(p.price)*i.quantity;return {productId:p.id,title:p.title,price:p.price,quantity:i.quantity};});
  assert(input.expectedTotal===undefined||cents(input.expectedTotal)===total,'Os preços do carrinho mudaram. Volte ao carrinho e revise o total antes de confirmar.');
  const at=new Date().toISOString();const o={id:uid(),customer:{...input.customer},items,total:total/100,status:'pending',delivery:input.delivery,address:input.delivery==='delivery'?String(input.address).trim():'Retirada no consultório',consent:true,createdAt:at,history:[{status:'pending',at}],stockRestored:false};d.orders.unshift(o);notify(d,'order',o.id,'Novo pedido',`${o.customer.name} · ${money(o.total)} · ${items.length} produto(s)`);return o;
});}
export async function changeOrder(id,status){return transaction(d=>{const o=d.orders.find(x=>x.id===id);assert(o,'Pedido não encontrado.');assert(['pending','paid','shipped','delivered','cancelled'].includes(status),'Status inválido.');if(o.status===status)return o;assert(o.status!=='cancelled','Pedidos cancelados não podem ser reativados. Crie um novo pedido.');if(status==='cancelled'&&!o.stockRestored){for(const i of o.items){const p=d.products.find(x=>x.id===i.productId);if(p)p.stock+=i.quantity;}o.stockRestored=true;}o.status=status;o.history.push({status,at:new Date().toISOString()});return o;});}
export function whatsappLink(phone,text){const clean=String(phone).replace(/\D/g,'');return /^\d{10,15}$/.test(clean)?`https://wa.me/${clean}?text=${encodeURIComponent(text)}`:'';}
export function bookingText(b){return `Olá! Agendei meu cuidado na BABE.\nCódigo: ${b.id.slice(0,8)}\nNome: ${b.customer.name}\nTratamento: ${b.serviceTitle}\nData: ${dateLabel(b.date)} às ${b.time} (Brasília)\nDuração: ${b.duration} min\nValor: ${money(b.price)}\nTelefone: ${b.customer.phone}\nE-mail: ${b.customer.email}\nObservações: ${b.customer.notes||'Nenhuma'}`;}
export function orderText(o){return `Olá! Fiz um pedido na BABE.\nCódigo: ${o.id.slice(0,8)}\nNome: ${o.customer.name}\n${o.items.map(i=>`${i.quantity} × ${i.title} · ${money(i.price*i.quantity)}`).join('\n')}\nTotal: ${money(o.total)}\nRecebimento: ${o.address}\nTelefone: ${o.customer.phone}\nE-mail: ${o.customer.email}\nObservações: ${o.customer.notes||'Nenhuma'}\nGostaria de combinar o pagamento.`;}
export async function replaceData(d){validateState(d);if(remote){assert(authenticated,'Entre no painel.');cached=await api('/api/admin/state','PUT',{revision:load().revision,state:d});globalThis.dispatchEvent(new CustomEvent('babe:data',{detail:cached}));return;}const run=()=>{try{const current=localStorage.getItem(KEY);if(current)localStorage.setItem(KEY+'.backup',current);localStorage.setItem(KEY,JSON.stringify(d));}catch{throw new Error('Armazenamento indisponível ou cheio. Nada foi importado.');}globalThis.dispatchEvent(new CustomEvent('babe:data',{detail:d}));};return navigator.locks?.request?navigator.locks.request('babe-data-write',run):run();}
