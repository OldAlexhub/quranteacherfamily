import AsyncStorage from '@react-native-async-storage/async-storage';
import {tafsir,validTafsir,surahIntroduction} from '../src/learning/understanding';
import {useLearning,flushLearning} from '../src/learning/store';
import {newProfile} from '../src/learning/domain';
import type {TafsirManifest} from '../src/learning/types';
const keys=['110:1','110:2','110:3'];
const fixture:TafsirManifest={surah:110,language:'en',revision:'test',fetchedAt:new Date().toISOString(),refreshAfter:new Date(Date.now()-1000).toISOString(),syncManaged:true,source:{id:817,name:'Tazkirul Quran',author:'Maulana Wahiduddin Khan',slug:'tazkirul-quran-en',language:'en'},entries:[{id:'group',from:keys[0],to:keys[2],keys,blocks:[{kind:'paragraph',text:'An attributed explanation.'}]}],byAyah:Object.fromEntries(keys.map(k=>[k,'group']))};
afterEach(()=>jest.restoreAllMocks());
test('synced tafsir remains usable offline and refreshes after reconnection',async()=>{
 await AsyncStorage.clear();await AsyncStorage.setItem('qtf:tafsir:110:en',JSON.stringify(fixture));
 const fetchMock=jest.fn().mockRejectedValue(new Error('offline'));globalThis.fetch=fetchMock;
 expect((await tafsir(110,'en'))?.byAyah['110:1']).toBe('group');
 const updated={...fixture,revision:'updated',refreshAfter:new Date(Date.now()+86400000).toISOString()};
 fetchMock.mockResolvedValue({ok:true,json:async()=>updated});expect((await tafsir(110,'en'))?.revision).toBe('updated');
 expect(validTafsir({...fixture,byAyah:{'110:1':'missing'}},110,'en')).toBe(false);
 expect(validTafsir(fixture,110,'ar')).toBe(false);
});
test('expired non-sync introductions are removed instead of retained indefinitely offline',async()=>{
 await AsyncStorage.setItem('qtf:introduction:110:en',JSON.stringify({surah:110,language:'en',expiresAt:'2000-01-01T00:00:00Z',blocks:[{kind:'paragraph',text:'Expired.'}]}));
 globalThis.fetch=jest.fn().mockRejectedValue(new Error('offline'));expect(await surahIntroduction(110,'en')).toBeUndefined();
 expect(await AsyncStorage.getItem('qtf:introduction:110:en')).toBeNull();
});
test('understanding survives persistence and never counts as memorization or bandit feedback',async()=>{
 useLearning.setState(s=>({data:{...s.data,profiles:{child:newProfile(),adult:newProfile()}}}));
 useLearning.getState().start('child',['110:1']);expect(useLearning.getState().data.profiles.child.active?.step).toBe('understand');
 useLearning.getState().patchLesson('child',{step:'listen',understanding:{'110:1':'explained'}});await flushLearning();
 const saved=JSON.parse((await AsyncStorage.getItem('qtf:learning'))!);
 expect(saved.profiles.child.active.understanding['110:1']).toBe('explained');
 expect(saved.profiles.child.memories).toEqual({});expect(saved.profiles.child.bandit.observations).toBe(0);expect(saved.profiles.adult.active).toBeUndefined();
});
