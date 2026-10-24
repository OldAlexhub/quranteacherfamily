import AsyncStorage from '@react-native-async-storage/async-storage';
import {Dirs, FileSystem} from 'react-native-file-access';
import {API_URL} from '../config/backend';
import {splitOpeningBasmala} from '../data/basmala';
import type {ContentManifest, QuranVerse, Reciter, DownloadRecord} from './types';
export const surahs: {number:number; arabicName:string; transliteration:string; englishName:string; ayahCount:number}[] = require('../../assets/data/surahs.json');
const arabic: Record<string, Record<string,string>> = require('../../assets/data/quran_arabic.json');
const english: Record<string, Record<string,string>> = require('../../assets/data/quran_english_pickthall.json');
export const counts = Object.fromEntries(surahs.map(s => [s.number,s.ayahCount]));
export const surahName = (n:number, ar:boolean) => ar ? surahs[n-1]?.arabicName : surahs[n-1]?.transliteration;
export function validKey(key:string): boolean { const [s,a] = key.split(':').map(Number); return Number.isInteger(s) && Number.isInteger(a) && a > 0 && a <= counts[s]; }
export function bundledVerse(key:string, reciter:Reciter = 'husary'): QuranVerse {
  const [s,a] = key.split(':').map(Number);
  if (!validKey(key)) throw new Error('Invalid verse');
  const global = surahs.slice(0,s-1).reduce((sum,item)=>sum+item.ayahCount,0)+a;
  const text=splitOpeningBasmala(s,a,arabic[s][a]);
  return {key,arabic:text.text,openingBasmala:text.opening,meaning:english[s]?.[a],words:[],segments:[],
    audioUrl:`https://cdn.islamic.network/quran/audio/128/ar.${reciter === 'husary' ? 'husary' : 'husarymujawwad'}/${global}.mp3`};
}
const cacheKey = (s:number,r:Reciter) => `qtf:content:${s}:${r}`;
const directory = () => `${Dirs.DocumentDir}/quran-audio`;
const audioPath = (key:string,r:Reciter,revision:string) => `${directory()}/${r}-${key.replace(':','-')}-${revision.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)}.mp3`;
export async function manifest(s:number,r:Reciter): Promise<ContentManifest|undefined> {
  const raw = await AsyncStorage.getItem(cacheKey(s,r));
  let cached: ContentManifest|undefined;
  try { cached = raw ? JSON.parse(raw) : undefined; } catch {}
  if (cached && Date.parse(cached.refreshAfter)>Date.now()) return cached;
  if (!API_URL) return cached;
  const controller = new AbortController();
  const deadline = setTimeout(()=>controller.abort(),8000);
  try {
    const response = await fetch(`${API_URL}/api/content/surahs/${s}?reciter=${r}`,{signal:controller.signal});
    if (!response.ok) return cached;
    const data: ContentManifest = await response.json();
    if (data.surah!==s || data.reciter!==r || typeof data.revision!=='string'||!data.revision || data.verses.length!==counts[s] || !data.verses.every((v,i)=>v.key===`${s}:${i+1}` && v.arabic && Array.isArray(v.words) && Array.isArray(v.segments))) return cached;
    await AsyncStorage.setItem(cacheKey(s,r),JSON.stringify(data));
    return data;
  } catch { return cached; } finally { clearTimeout(deadline); }
}
export async function verse(key:string,r:Reciter):Promise<QuranVerse> {
  const data = await manifest(Number(key.split(':')[0]),r);
  const result = {...bundledVerse(key,r),...data?.verses.find(v=>v.key===key)};
  result.words=result.words.map(w=>w.audioExpiresAt&&Date.parse(w.audioExpiresAt)<Date.now()?{...w,audioUrl:undefined}:w);
  const path = data?audioPath(key,r,data.revision):undefined;
  return {...result, audioUrl:path&&await FileSystem.exists(path) ? `file://${path}` : result.audioUrl};
}
export async function downloads():Promise<DownloadRecord[]> { try { const list:DownloadRecord[]=JSON.parse(await AsyncStorage.getItem('qtf:downloads') ?? '[]');return list.map(d=>!downloadActive&&d.status==='downloading'?{...d,status:'interrupted'}:d); } catch { return []; } }
let downloadActive = false;
let downloadCancelled=false,cancelNative:(()=>Promise<void>)|undefined;
export async function cancelDownload(){downloadCancelled=true;await cancelNative?.().catch(()=>{});}
export async function removeDownload(s:number,r:Reciter){
 if(downloadActive)throw new Error('Wait for the current download to stop');
 if(await FileSystem.exists(directory()))for(const file of await FileSystem.ls(directory()))if(file.startsWith(`${r}-${s}-`)&&/^[-a-zA-Z0-9.]+$/.test(file))await FileSystem.unlink(`${directory()}/${file}`);
 await AsyncStorage.setItem('qtf:downloads',JSON.stringify((await downloads()).filter(d=>d.surah!==s||d.reciter!==r)));
}
export async function downloadSurah(s:number,r:Reciter,progress:(record:DownloadRecord)=>void):Promise<void> {
  if(downloadActive) throw new Error('A download is already running');
  downloadActive=true;downloadCancelled=false;
  const record:DownloadRecord={surah:s,reciter:r,status:'downloading',completed:0,total:counts[s],bytes:0,updatedAt:new Date().toISOString()};
  const save=async()=>{const list=await downloads();await AsyncStorage.setItem('qtf:downloads',JSON.stringify([...list.filter(d=>d.surah!==s||d.reciter!==r),record]));progress({...record});};
  try {
    const data=await manifest(s,r);
    // Quran Foundation offline resources must have been acquired through Content Sync.
    if(!data?.syncManaged) throw new Error('Verified offline resources are not available yet');
    record.revision=data.revision;
    await FileSystem.mkdir(directory());
    await save();
    for(const v of data.verses){
      if(downloadCancelled)throw new Error('download-cancelled');
      if(!v.audioUrl) throw new Error('Audio unavailable');
      const path=audioPath(v.key,r,data.revision);
      if(await FileSystem.exists(path)&&(await FileSystem.stat(path)).size<100)await FileSystem.unlink(path);
      if(!await FileSystem.exists(path)){
        const task=FileSystem.fetchManaged(v.audioUrl,{path:`${path}.part`});cancelNative=task.cancel;
        const timeout=setTimeout(()=>task.cancel().catch(()=>{}),90000);
        try{
          const result=await task.result,size=(await FileSystem.stat(`${path}.part`)).size;
          const length=Number(result.getHeader('content-length')??0),type=result.getHeader('content-type')??'';
          if(downloadCancelled)throw new Error('download-cancelled');
          if(!result.ok||size<100||(length>0&&size!==length)||/text\/|application\/json/i.test(type))throw new Error('Download failed');
          await FileSystem.mv(`${path}.part`,path);
        }finally{clearTimeout(timeout);cancelNative=undefined;if(await FileSystem.exists(`${path}.part`))await FileSystem.unlink(`${path}.part`);}
      }
      record.completed++;record.bytes+=(await FileSystem.stat(path)).size;await save();
    }
    record.status='ready';await save();
  }catch(error){record.status='interrupted';await save();throw downloadCancelled?new Error('download-cancelled'):error;}finally{downloadActive=false;cancelNative=undefined;}
}
