export const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-12 4h2m3 0h2"/>',
  bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  check:'<path d="m5 12 4 4 10-10"/>',shield:'<path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',leaf:'<path d="M20 3c-1 7 0 13-7 16a7 7 0 0 1-9-9C7 3 13 4 20 3Z"/><path d="m3 21 12-12"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',x:'<path d="m6 6 12 12M6 18 18 6"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  phone:'<path d="m5 3 4 1 1 5-3 2a15 15 0 0 0 6 6l2-3 5 1 1 4c-2 4-7 2-11-1S1 7 5 3Z"/>',
  whatsapp:'<path d="M21 11.6a9 9 0 0 1-13.3 8L3 21l1.3-4.8A9 9 0 1 1 21 11.6Z"/><path d="m8 7 2 2-1 2c1 2 2 3 4 4l2-1 2 2c-3 3-10-3-10-6 0-1 0-2 1-3Z"/>',
  instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17 7h.01"/>',
  settings:'<path d="m10 3-1 3-3 1-2-1-2 3 2 2v3l-2 2 2 3 3-1 2 1 1 3h4l1-3 3-1 2 1 2-3-2-2v-3l2-2-2-3-3 1-2-1-1-3h-4Z"/><circle cx="12" cy="12" r="3"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  users:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a4 4 0 0 1 0 8m3 9v-3a6 6 0 0 0-3-5"/>',
  edit:'<path d="m15 4 5 5M3 21l5-1L21 7a3.5 3.5 0 0 0-5-5L3 15v6Z"/>',trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  up:'<path d="m6 14 6-6 6 6"/>',down:'<path d="m6 10 6 6 6-6"/>',chevronLeft:'<path d="m15 6-6 6 6 6"/>',chevronRight:'<path d="m9 6 6 6-6 6"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 10h18c0-3-3-3-3-10M10 21h4"/>',logout:'<path d="M10 3H4v18h6m5-14 5 5-5 5m-8-5h13"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  sparkle:'<path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z"/>',foot:'<path d="M8 10c-2 4-3 6-2 9a4 4 0 0 0 7 1c3-4 4-8 3-10-2-3-6-3-8 0Z"/><ellipse cx="16" cy="4" rx="2" ry="3"/><path d="M11 4v1M7 6v1M4 9v1"/>',box:'<path d="m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10M7 4l10 5"/>',
  search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',eye:'<path d="M2 12c5-9 15-9 20 0-5 9-15 9-20 0Z"/><circle cx="12" cy="12" r="3"/>',lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>'
};
export const icon=(name,cls='')=>`<svg viewBox="0 0 24 24" aria-hidden="true" class="${e(cls)}">${paths[name]||paths.leaf}</svg>`;
export const statusLabel={confirmed:'Confirmado',completed:'Concluído',cancelled:'Cancelado',pending:'Pendente',paid:'Pago',shipped:'Enviado',delivered:'Entregue'};
export const status=s=>`<span class="status ${e(s)}">${e(statusLabel[s]||s)}</span>`;
export function field(name,label,value='',type='text',attrs=''){return `<div class="field"><label for="f-${e(name)}">${e(label)}</label><input id="f-${e(name)}" name="${e(name)}" type="${e(type)}" value="${e(value)}" ${attrs}></div>`;}
export function area(name,label,value='',attrs=''){return `<div class="field"><label for="f-${e(name)}">${e(label)}</label><textarea id="f-${e(name)}" name="${e(name)}" ${attrs}>${e(value)}</textarea></div>`;}
export function selectField(name,label,options,value,attrs=''){return `<div class="field"><label for="f-${e(name)}">${e(label)}</label><select id="f-${e(name)}" name="${e(name)}" ${attrs}>${options.map(([v,t])=>`<option value="${e(v)}" ${String(value)===String(v)?'selected':''}>${e(t)}</option>`).join('')}</select></div>`;}
export const empty=(text,ico='calendar')=>`<div class="empty">${icon(ico)}<p>${e(text)}</p></div>`;
let toastTimer;
export function toast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),5000);}
const dialog=document.getElementById('modal');let lastFocus;
export function modal(title,body,foot='',className=''){
  const already=dialog.open;if(!already)lastFocus=document.activeElement;dialog.className=className;dialog.innerHTML=`<div class="modal-head"><h2 id="modal-title">${e(title)}</h2><button class="icon-btn" data-close aria-label="Fechar">${icon('x')}</button></div><div class="modal-body"><div class="modal-error" role="alert"></div>${body}</div>${foot?`<div class="modal-foot">${foot}</div>`:''}`;
  if(!already)dialog.showModal();dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.scrollTop=0;return dialog;
}
dialog.addEventListener('close',()=>{if(lastFocus?.isConnected)lastFocus.focus();else document.querySelector('.brand, .admin-sidebar a')?.focus();});
dialog.addEventListener('click',ev=>{if(ev.target===dialog){const r=dialog.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)dialog.close();}});
export function error(err){const el=dialog.open?dialog.querySelector('.modal-error'):null;if(el){el.textContent=err.message||String(err);el.scrollIntoView({block:'nearest'});}else toast(err.message||String(err));}
export async function submit(form,fn){form.addEventListener('submit',async ev=>{ev.preventDefault();if(!form.reportValidity())return;const b=form.querySelector('[type=submit]');if(b)b.disabled=true;try{await fn(Object.fromEntries(new FormData(form)),form);}catch(err){error(err);}finally{if(b?.isConnected)b.disabled=false;}});}
export async function uploadImage(file){if(!file)return null;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Escolha PNG, JPEG ou WebP de até 10 MB.');const bitmap=await createImageBitmap(file);const ratio=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const result=canvas.toDataURL('image/jpeg',.78);if(result.length>900000)throw new Error('A imagem é muito grande. Escolha uma imagem menor.');return result;}
export function download(filename,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
