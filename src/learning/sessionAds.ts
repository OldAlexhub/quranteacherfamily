import {canShowSessionAd,type AdLimits} from './adPolicy';

type Event='loaded'|'error'|'opened'|'closed'|'paid';
export interface SessionAd {on:(event:Event,fn:(value?:unknown)=>void)=>()=>void;load:()=>void;show:()=>Promise<void>}
interface Dependencies {
 create:()=>SessionAd;read:()=>Promise<string|null>;write:(value:string)=>Promise<void>;
 unfinished:()=>boolean;playing:()=>Promise<boolean>;paid:(value:unknown)=>void;
 event:(name:'ad_loaded'|'ad_failed'|'ad_impression')=>void;
 now?:()=>number;
}
const MAX_AGE=55*60*1000;
const browsing=(route:string)=>['learn','quran','progress','settings','profile'].includes(route);
export class SessionAds {
 private now:()=>number;
 private limits:AdLimits;
 private ids:string[]=[];
 private consumed=0;
 private enabled=false;
 private foreground=true;
 private route='learn';
 private navigation=0;
 private ad?:SessionAd;
 private loadedAt?:number;
 private showing=false;
 private checking=false;
 private disposers:(()=>void)[]=[];
 private timer?:ReturnType<typeof setTimeout>;
 private failures=0;
 private serial:Promise<void>;
 constructor(private deps:Dependencies){
  this.now=deps.now??Date.now;
  this.limits={started:this.now(),lastShown:0,shown:0,completed:0};
  this.serial=deps.read().then(raw=>{
   const saved=JSON.parse(raw??'{}');
   const count=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:0;
   this.limits.lastShown=Math.min(count(saved.lastShown),this.now());
   this.limits.completed=count(saved.completed);this.consumed=count(saved.consumed);
   this.ids=Array.isArray(saved.ids)?saved.ids.filter((id:unknown)=>typeof id==='string').slice(-500):[];
  }).catch(()=>{});
 }
 private save(){const snapshot=JSON.stringify({...this.limits,consumed:this.consumed,ids:this.ids});this.serial=this.serial.then(()=>this.deps.write(snapshot)).catch(()=>{});}
 async complete(id:string){
  // Append immediately to the queue so simultaneous completion calls cannot race hydration.
  this.serial=this.serial.then(async()=>{if(this.ids.includes(id))return;this.ids=[...this.ids,id].slice(-500);this.limits.completed++;await this.deps.write(JSON.stringify({...this.limits,consumed:this.consumed,ids:this.ids}));}).catch(()=>{});
  await this.serial;
 }
 setScene(route:string){this.route=route;this.navigation++;this.maintain();}
 setForeground(value:boolean){if(this.foreground===value)return;this.foreground=value;this.navigation++;if(value)this.maintain();}
 setEnabled(value:boolean){this.enabled=value;if(!value&&!this.showing)this.clear();if(value)this.maintain();}
 private clear(){if(this.timer)clearTimeout(this.timer);this.timer=undefined;for(const dispose of this.disposers)dispose();this.disposers=[];this.ad=undefined;this.loadedAt=undefined;}
 private maintain(){
  if(!this.enabled||!this.foreground||!browsing(this.route)||this.showing)return;
  if(this.loadedAt!==undefined&&this.now()-this.loadedAt>=MAX_AGE)this.clear();
  if(!this.ad&&!this.timer)this.preload();
 }
 private retry(){
  this.clear();this.deps.event('ad_failed');this.failures++;
  if(this.failures>5)return;
  this.timer=setTimeout(()=>{this.timer=undefined;this.maintain();},Math.min(300000,30000*2**(this.failures-1)));
 }
 private preload(){
  if(!this.enabled||!this.foreground||!browsing(this.route)||this.ad||this.showing)return;
  try{
   const ad=this.deps.create();this.ad=ad;
   const listen=(event:Event,callback:(value?:unknown)=>void)=>this.disposers.push(ad.on(event,value=>{if(this.ad===ad)callback(value);}));
   listen('loaded',()=>{if(this.timer)clearTimeout(this.timer);this.loadedAt=this.now();this.failures=0;this.deps.event('ad_loaded');this.timer=setTimeout(()=>{this.timer=undefined;this.maintain();},MAX_AGE);});
   listen('error',()=>{this.showing=false;this.retry();});
   listen('paid',value=>this.deps.paid(value));
   let counted=false;
   listen('opened',()=>{if(counted)return;counted=true;this.limits.lastShown=this.now();this.limits.shown++;this.consumed=this.limits.completed;this.save();this.deps.event('ad_impression');});
   listen('closed',()=>{this.showing=false;this.clear();this.maintain();});
   this.timer=setTimeout(()=>this.retry(),60000);
   ad.load();
  }catch{this.retry();}
 }
 async returnHome(){
  const navigation=this.navigation;
  if(this.checking||this.showing)return;
  this.checking=true;
  try{
   await this.serial;
   const playing=await this.deps.playing();
   if(navigation!==this.navigation||!this.enabled||!this.foreground||this.showing||this.consumed>=this.limits.completed||!canShowSessionAd({route:this.route,unfinished:this.deps.unfinished(),playing,returningHome:true},this.limits,this.now()))return;
   if(!this.ad||this.loadedAt===undefined)return; // Never wait for a late load to display.
   if(this.now()-this.loadedAt>=MAX_AGE){this.clear();this.maintain();return;}
   const selected=this.ad;this.showing=true;this.loadedAt=undefined;if(this.timer)clearTimeout(this.timer);this.timer=undefined;
   try{await selected.show();}catch{if(this.ad===selected){this.showing=false;this.retry();}}
  }finally{this.checking=false;}
 }
 dispose(){this.enabled=false;this.navigation++;this.clear();}
}
