import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {seed,KEY} from '../dist/seed.js';
import {slots,clinicNow,addDays,weekday,createBooking,createOrder,changeOrder,load,validateState,replaceData} from '../dist/store.js';
const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
globalThis.crypto??=webcrypto;
globalThis.dispatchEvent=()=>{};
Object.defineProperty(globalThis,'navigator',{value:{locks:{request:async(name,fn)=>fn()}},configurable:true});
globalThis.CustomEvent??=class{constructor(type,opts){this.type=type;this.detail=opts?.detail;}};
const customer={name:'Cliente de teste',phone:'11999999999',email:'test@example.com',notes:''};
function reset(){memory.clear();memory.set(KEY,JSON.stringify(seed()));}
function nextWeekday(){let day=addDays(clinicNow().date,1);while([0,6].includes(weekday(day)))day=addDays(day,1);return day;}
test('Reservations block the entire treatment and reject overlapping bookings',async()=>{reset();const date=nextWeekday();assert.ok(slots(load(),'s1',date).includes('09:00'));await createBooking({serviceId:'s1',date,time:'09:00',customer,consent:true});const available=slots(load(),'s1',date);assert.ok(!available.includes('09:00'));assert.ok(!available.includes('09:30'));assert.ok(available.includes('10:00'));await assert.rejects(createBooking({serviceId:'s2',date,time:'09:30',customer,consent:true}),/não está mais disponível/);assert.equal(load().bookings.length,1);assert.equal(load().notifications.length,1);});
test('Date overrides and lunch breaks require full treatment to fit',()=>{reset();const d=load(),date=nextWeekday();d.availability.overrides[date]=[['10:00','11:30']];assert.deepEqual(slots(d,'s1',date),['10:00','10:30']);d.availability.overrides[date]=[];assert.deepEqual(slots(d,'s1',date),[]);delete d.availability.overrides[date];assert.ok(!slots(d,'s1',date).includes('11:30'));});
test('Orders reserve stock, reject overselling, and cancel exactly once',async()=>{reset();const o=await createOrder({cart:[{id:'p1',quantity:2}],customer,consent:true,delivery:'pickup'});assert.equal(o.total,99.8);assert.equal(load().products[0].stock,10);await assert.rejects(createOrder({cart:[{id:'p1',quantity:11}],customer,consent:true,delivery:'pickup'}),/Estoque insuficiente/);assert.equal(load().orders.length,1);await changeOrder(o.id,'paid');assert.equal(load().orders[0].history.length,2);await changeOrder(o.id,'cancelled');await changeOrder(o.id,'cancelled');assert.equal(load().products[0].stock,12);await assert.rejects(changeOrder(o.id,'paid'),/cancelados/);});
test('Invalid backups do not replace saved state',async()=>{reset();const bad=seed();bad.products[0].stock=-1;assert.throws(()=>validateState(bad),/Produto inválido/);await assert.rejects(replaceData(bad));assert.equal(load().products[0].stock,12);});
test('Booking and inventory mutations survive fresh reads without rewriting history',async()=>{reset();const date=nextWeekday();const b=await createBooking({serviceId:'s1',date,time:'10:00',customer,consent:true,source:'whatsapp'});const raw=localStorage.getItem(KEY);assert.equal(JSON.parse(raw).bookings[0].source,'whatsapp');assert.equal(load().bookings[0].serviceTitle,b.serviceTitle);assert.ok(!slots(load(),'s1',date).includes('10:30'));});
test('Out of horizon and invalid dates never produce available slots',()=>{reset();assert.deepEqual(slots(load(),'s1','2026-02-31'),[]);assert.deepEqual(slots(load(),'s1',addDays(clinicNow().date,181)),[]);});
test('Phone formatting without digits cannot create a reservation',async()=>{reset();await assert.rejects(createBooking({serviceId:'s1',date:nextWeekday(),time:'09:00',customer:{...customer,phone:'----------'},consent:true}),/telefone/);assert.equal(load().bookings.length,0);});
test('Changed prices require customer review without committing stock or bookings',async()=>{reset();await assert.rejects(createBooking({serviceId:'s1',date:nextWeekday(),time:'09:00',customer,consent:true,expectedPrice:100}),/preço/);await assert.rejects(createOrder({cart:[{id:'p1',quantity:1}],customer,consent:true,delivery:'pickup',expectedTotal:45}),/preços/);assert.equal(load().bookings.length,0);assert.equal(load().orders.length,0);assert.equal(load().products[0].stock,12);});
