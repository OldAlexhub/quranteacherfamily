import AsyncStorage from '@react-native-async-storage/async-storage';
import {generateUUID} from '../utils/idUtils';
import {API_URL} from '../config/backend';
import {useLearning} from './store';
import type {AnalyticsEvent,EventName} from './types';
const KEY='qtf:telemetry';
let serial=Promise.resolve(),flushing=false;
type Queue={id:string;events:AnalyticsEvent[]};
const read=async():Promise<Queue>=>{try{const raw=await AsyncStorage.getItem(KEY);return raw?JSON.parse(raw):{id:generateUUID(),events:[]};}catch{return {id:generateUUID(),events:[]};}};
const allowed:Record<EventName,string[]>={app_open:[],onboarding_complete:[],lesson_start:[],lesson_complete:['durationSeconds'],playback_error:['code'],download_error:['code'],app_error:['code'],ad_impression:['placement'],ad_loaded:['placement'],ad_failed:['placement'],ad_revenue:['placement','currency','valueMicros','precision']};
export function track(name:EventName,properties:AnalyticsEvent['properties']={}){
 if(!useLearning.getState().data.analytics)return;
 // Copy only explicit aggregate fields; never accept free-form diagnostics or learner data.
 const clean=Object.fromEntries(Object.entries(properties).filter(([key])=>allowed[name].includes(key)));
 const event:AnalyticsEvent={id:generateUUID(),name,at:new Date().toISOString(),appVersion:'1.0.4',language:useLearning.getState().data.language,properties:clean};
 serial=serial.catch(()=>{}).then(async()=>{if(!useLearning.getState().data.analytics)return;const q=await read();q.events=[...q.events,event].filter(e=>Date.parse(e.at)>Date.now()-89*86400000).slice(-300);await AsyncStorage.setItem(KEY,JSON.stringify(q));}).catch(()=>{});
}
export async function resetTelemetry(){serial=serial.catch(()=>{}).then(()=>AsyncStorage.setItem(KEY,JSON.stringify({id:generateUUID(),events:[]})));await serial;}
export async function flushTelemetry(){
 if(flushing||!API_URL||!useLearning.getState().data.analytics)return;flushing=true;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{await serial;const q=await read(),events=q.events.slice(0,50);if(!events.length)return;
  const result=await fetch(`${API_URL}/api/events/batch`,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({installationId:q.id,events})});
  if(!result.ok)return;const data=await result.json();if(!Array.isArray(data.acknowledged))return;const ids=new Set(data.acknowledged);
  serial=serial.catch(()=>{}).then(async()=>{const current=await read();if(current.id===q.id){current.events=current.events.filter(e=>!ids.has(e.id));await AsyncStorage.setItem(KEY,JSON.stringify(current));}});await serial;
 }catch{}finally{flushing=false;clearTimeout(timer);}
}
