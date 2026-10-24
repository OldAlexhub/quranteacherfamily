import TrackPlayer,{Event} from 'react-native-track-player';
import {initializePlayer} from '../audio/audioPlayer';
let generation=0;
let release:(()=>void)|undefined;
let queue=Promise.resolve();
let savePosition:((position:number)=>void)|undefined;
let turn:{endsAt:number;save?:(remaining:number)=>void}|undefined;
export function cancelPracticeAudio():void {generation++;release?.();release=undefined;savePosition=undefined;turn=undefined;queue=queue.catch(()=>{}).then(()=>TrackPlayer.reset()).catch(()=>{});}
export async function pausePracticeAudio():Promise<void>{
 const token=generation;
 if(turn)turn.save?.(Math.max(0,(turn.endsAt-Date.now())/1000));
 else if(savePosition){try{await TrackPlayer.pause();const progress=await TrackPlayer.getProgress();if(token===generation)savePosition?.(progress.position);}catch{}}
 if(token===generation)cancelPracticeAudio();
}
export function audioGeneration(){return generation;}
export async function playResource(url:string,title:string,speed=1,options:{startAt?:number;onPosition?:(position:number)=>void}={}):Promise<number> {
  cancelPracticeAudio();
  const token=generation;
  await queue;await initializePlayer();
  if(token!==generation) throw new Error('cancelled');
  return new Promise((resolve,reject)=>{
    let finished=false;
    const finish=(error?:Error,duration=0)=>{if(finished)return;finished=true;end.remove();fail.remove();position.remove();clearTimeout(timeout);if(release===cancel){release=undefined;savePosition=undefined;}error?reject(error):resolve(duration);};
    const cancel=()=>finish(new Error('cancelled'));
    const end=TrackPlayer.addEventListener(Event.PlaybackQueueEnded,e=>{if(token===generation)finish(undefined,e.position/speed);});
    const fail=TrackPlayer.addEventListener(Event.PlaybackError,()=>finish(new Error('playback')));
    const position=TrackPlayer.addEventListener(Event.PlaybackProgressUpdated,e=>{if(token===generation)options.onPosition?.(e.position);});
    // This is a failure deadline, never an estimate of recitation duration.
    const timeout=setTimeout(()=>finish(new Error('playback-timeout')),15*60*1000);
    release=cancel;
    savePosition=options.onPosition;
    queue=queue.then(async()=>{
      if(token!==generation)return;
      await TrackPlayer.add({id:`practice-${token}`,url,title,artist:'Quran recitation'});
      if(token!==generation)return;
      await TrackPlayer.setRate(speed);if(options.startAt&&options.startAt>0)await TrackPlayer.seekTo(options.startAt);if(token===generation)await TrackPlayer.play();
    }).catch(()=>finish(new Error('playback')));
  });
}
export function waitForTurn(seconds:number,onRemaining?:(remaining:number)=>void):Promise<void>{
 const token=generation;
 return new Promise((resolve,reject)=>{
  const duration=Math.max(0,seconds),endsAt=Date.now()+duration*1000;
  turn={endsAt,save:onRemaining};onRemaining?.(duration);
  const ticker=setInterval(()=>{if(token===generation)onRemaining?.(Math.max(0,(endsAt-Date.now())/1000));},1000);
  const timer=setTimeout(()=>{clearInterval(ticker);if(release===cancel){release=undefined;turn=undefined;}token===generation?resolve():reject(new Error('cancelled'));},duration*1000);
  const cancel=()=>{clearTimeout(timer);clearInterval(ticker);reject(new Error('cancelled'));};release=cancel;
 });
}
