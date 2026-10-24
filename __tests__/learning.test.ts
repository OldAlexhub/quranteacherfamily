import {addDays,applyRecall,chooseArm,migrateLegacy,newBandit,newProfile,nextKeys,trainDecision} from '../src/learning/domain';
import {useLearning,flushLearning} from '../src/learning/store';
import type {Decision} from '../src/learning/types';
const decision:Decision={id:'decision',day:'2026-01-01',arm:3,context:'building',eligible:true,trained:false};
test('review dates advance only through later-day successful recall',()=>{
 let m=applyRecall(undefined,'1:1','remembered','2026-01-01');expect(m.due).toBe('2026-01-02');
 m=applyRecall(m,'1:1','remembered','2026-01-01');expect(m.successes).toBe(0);
 m=applyRecall(m,'1:1','remembered','2026-01-02');expect(m.due).toBe('2026-01-05');
 m=applyRecall(m,'1:1','remembered','2026-01-05');expect(m.due).toBe('2026-01-12');expect(m.retained).toBe(false);
 m=applyRecall(m,'1:1','remembered','2026-01-12');expect(m.retained).toBe(true);expect(m.due).toBe('2026-01-26');
 m=applyRecall(m,'1:1','help','2026-01-26');expect(m.retained).toBe(false);expect(m.due).toBe('2026-01-27');
 expect(addDays('2026-12-31',1)).toBe('2027-01-01');
});
test('bandit waits for five later-day observations; same-day reports do not train',()=>{
 let b=newBandit();expect(trainDecision(b,decision,'remembered',decision.day)).toBe(b);
 for(let i=0;i<5;i++){expect(chooseArm(b)).toBe(3);b=trainDecision(b,{...decision,id:String(i)},i%2?'help':'remembered','2026-01-02');}
 expect(b.observations).toBe(5);expect([2,3,5]).toContain(chooseArm(b));
 expect(trainDecision(b,{...decision,trained:true},'remembered','2026-01-03')).toBe(b);
 expect(trainDecision(b,{...decision,eligible:false},'again','2026-01-03')).toBe(b);
});
test('migration preserves records, is idempotent and puts old memorization into review',()=>{
 const old={a:{surahNumber:1,ayahNumber:1,status:'memorized'}};
 const p=migrateLegacy(newProfile(),old,'2026-01-01');
 expect(migrateLegacy(p,old,'2026-02-01')).toEqual(p);
 expect(p.memories['1:1']).toMatchObject({practiced:true,independent:false,legacyMemorized:true,due:'2026-01-01'});
 expect(nextKeys(p,{1:7},'2026-01-01')).toEqual(['1:1']);
});
test('hints prevent independent credit, progress is unique and profiles stay isolated',async()=>{
 const store=useLearning.getState();store.commit({schema:1,language:'en',onboarded:true,analytics:false,fontScale:1,profiles:{a:newProfile(),b:newProfile()}});
 store.start('a',['1:1']);store.patchLesson('a',{step:'recall',hinted:true});store.recall('a','remembered');store.recall('a','remembered');
 expect(Object.keys(useLearning.getState().data.profiles.a.memories)).toHaveLength(1);
 expect(useLearning.getState().data.profiles.a.memories['1:1'].independent).toBe(false);
 expect(useLearning.getState().data.profiles.b.memories).toEqual({});await flushLearning();
});
test('resumed decisions cannot be credited twice and reset disables pending learning',()=>{
 const p=newProfile();p.memories['1:1']={key:'1:1',practiced:true,independent:false,retained:false,successes:0,interval:0,due:'2026-01-02',lastDay:'2026-01-01',decision};
 const store=useLearning.getState();store.commit({...store.data,profiles:{a:p}});store.start('a',['1:1']);
 store.patchLesson('a',{decisions:{'1:1':decision},step:'recall'});store.recall('a','remembered');store.recall('a','remembered');
 expect(useLearning.getState().data.profiles.a.bandit.observations).toBe(1);
 store.resetPersonalization('a');store.recall('a','remembered');expect(useLearning.getState().data.profiles.a.bandit.observations).toBe(0);
});
