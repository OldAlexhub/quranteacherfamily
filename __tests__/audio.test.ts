import TrackPlayer,{Event} from 'react-native-track-player';
import {playResource,pausePracticeAudio,cancelPracticeAudio,waitForTurn} from '../src/learning/audio';
const callbacks=new Map<string,(payload:any)=>void>();
const settle=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
beforeEach(()=>{
 jest.useFakeTimers();callbacks.clear();jest.clearAllMocks();
 (TrackPlayer.addEventListener as jest.Mock).mockImplementation((event,callback)=>{callbacks.set(event,callback);return {remove:()=>{if(callbacks.get(event)===callback)callbacks.delete(event);}};});
});
afterEach(async()=>{cancelPracticeAudio();await settle();jest.useRealTimers();});
test('pause saves the actual audio position and resume seeks before playing',async()=>{
 const save=jest.fn();const first=playResource('https://example.com/ayah.mp3','1:1',1,{onPosition:save});const caught=first.catch(e=>e.message);await settle();
 callbacks.get(Event.PlaybackProgressUpdated)?.({position:3});await pausePracticeAudio();expect(await caught).toBe('cancelled');expect(save).toHaveBeenLastCalledWith(4.25);
 const resumed=playResource('https://example.com/ayah.mp3','1:1',1,{startAt:4.25});await settle();expect(TrackPlayer.seekTo).toHaveBeenCalledWith(4.25);
 callbacks.get(Event.PlaybackQueueEnded)?.({position:10});expect(await resumed).toBe(10);
});
test('a paused repetition gap keeps its remaining silence instead of starting another recitation',async()=>{
 const save=jest.fn(),gap=waitForTurn(10,save),caught=gap.catch(e=>e.message);jest.advanceTimersByTime(3250);await pausePracticeAudio();expect(await caught).toBe('cancelled');expect(save).toHaveBeenLastCalledWith(6.75);
 let completed=false;const resumed=waitForTurn(6.75).then(()=>{completed=true;});jest.advanceTimersByTime(6749);await settle();expect(completed).toBe(false);jest.advanceTimersByTime(1);await resumed;expect(completed).toBe(true);
});
test('switching passages cancels old listeners and never completes an obsolete request',async()=>{
 const old=playResource('https://example.com/old.mp3','1:1').catch(e=>e.message);await settle();
 const next=playResource('https://example.com/new.mp3','1:2');await settle();expect(await old).toBe('cancelled');
 callbacks.get(Event.PlaybackQueueEnded)?.({position:8});expect(await next).toBe(8);expect(callbacks.size).toBe(0);
});
