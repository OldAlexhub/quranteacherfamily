import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {useLearnerStore} from '../store/useLearnerStore';
import {useProgressStore} from '../store/useProgressStore';
import {usePreferencesStore} from '../store/usePreferencesStore';
import {generateId} from '../utils/idUtils';
import {applyRecall, chooseArm, contextFor, dayKey, migrateLegacy, newBandit, newProfile} from './domain';
import type {LearningState, LearnerSettings, Lesson, Recall, Language} from './types';

const KEY = 'qtf:learning';
let writes = Promise.resolve();
let loading: Promise<void> | null = null;
const initial: LearningState = {schema: 1, language: 'en', onboarded: false, analytics: true, profiles: {}, fontScale: 1};
interface Store {
  data: LearningState; ready: boolean; storageError: boolean;
  load: () => Promise<void>;
  commit: (data: LearningState) => void;
  ensureProfile: (id: string) => void;
  setLanguage: (language: Language) => void;
  configure: (id: string, settings: Partial<LearnerSettings>) => void;
  start: (id: string, keys: string[], assignmentId?: string) => void;
  patchLesson: (id: string, patch: Partial<Lesson>) => void;
  recall: (id: string, outcome: Recall) => void;
  finish: (id: string, complete: boolean) => void;
  resetPersonalization: (id: string) => void;
}
export const useLearning = create<Store>((set, get) => ({
  data: initial, ready: false, storageError: false,
  commit: data => {
    set({data});
    const snapshot = JSON.stringify(data);
    writes = writes.catch(() => {}).then(() => AsyncStorage.setItem(KEY, snapshot))
      .then(() => {set({storageError: false});}, () => {set({storageError: true});});
  },
  load: () => {
    if (get().ready) return Promise.resolve();
    if (loading) return loading;
    loading = (async () => {
      await Promise.all([useLearnerStore.getState().loadLearners(), useProgressStore.getState().loadProgress(), usePreferencesStore.getState().loadPreferences()]);
      const raw = await AsyncStorage.getItem(KEY);
      let saved: LearningState | undefined;
      try { if (raw) saved = JSON.parse(raw); } catch { set({storageError: true}); throw new Error('Saved learning data is unreadable'); }
      if (saved && saved.schema !== 1) throw new Error('Unsupported learning data version');
      const old = usePreferencesStore.getState().preferences;
      const language = Intl.DateTimeFormat().resolvedOptions().locale.startsWith('ar') ? 'ar' : 'en';
      const data: LearningState = saved ? {...initial, ...saved} : {...initial, language, onboarded: old.onboardingCompleted};
      if (!useLearnerStore.getState().learners.length) await useLearnerStore.getState().createLearner(data.language === 'ar' ? 'المتعلم' : 'Learner');
      data.profiles = {...data.profiles};
      for (const learner of useLearnerStore.getState().learners) {
        const profile = data.profiles[learner.id] ?? newProfile(data.language === 'en');
        data.profiles[learner.id] = migrateLegacy(profile, useProgressStore.getState().practiceStatus[learner.id] ?? {}, dayKey());
        if (profile.active) data.profiles[learner.id].active = {...profile.active, phase: 'ready'};
      }
      get().commit(data);
      set({ready: true});
    })().finally(() => {loading = null;});
    return loading;
  },
  ensureProfile: id => {
    const {data} = get();
    if (!data.profiles[id]) get().commit({...data, profiles: {...data.profiles, [id]: newProfile(data.language === 'en')}});
  },
  setLanguage: language => get().commit({...get().data, language}),
  configure: (id, settings) => {
    get().ensureProfile(id);
    const {data} = get(), profile = data.profiles[id];
    get().commit({...data, profiles: {...data.profiles, [id]: {...profile, settings: {...profile.settings, ...settings}}}});
  },
  start: (id, keys, assignmentId) => {
    const surahs: {number:number;ayahCount:number}[] = require('../../assets/data/surahs.json');
    if (!keys.length || keys.some(key=>{const [s,a]=key.split(':').map(Number);return !Number.isInteger(s)||!Number.isInteger(a)||a<1||a>(surahs[s-1]?.ayahCount??0);})) return;
    get().ensureProfile(id);
    const {data} = get(), profile = data.profiles[id];
    const arm = profile.settings.adaptive ? chooseArm(profile.bandit) : 3;
    const repeats = profile.settings.repeats ?? arm;
    const lesson: Lesson = {id: generateId(), learnerId: id, keys: [...new Set(keys)], index: 0, step: 'understand', round: 0, understanding:{},
      phase: 'ready', hinted: false, outcomes: {}, decisions: {}, repeats, startedAt: new Date().toISOString(), activeSeconds: 0, assignmentId};
    for (const key of lesson.keys) lesson.decisions[key] = {id: generateId(), day: dayKey(), arm, context: contextFor(profile.bandit), trained: false,
      eligible: profile.settings.adaptive && profile.settings.repeats === null};
    get().commit({...data, profiles: {...data.profiles, [id]: {...profile, active: lesson}}});
  },
  patchLesson: (id, patch) => {
    const {data} = get(), profile = data.profiles[id];
    if (!profile?.active) return;
    get().commit({...data, profiles: {...data.profiles, [id]: {...profile, active: {...profile.active, ...patch}}}});
  },
  recall: (id, requested) => {
    const {data} = get(), profile = data.profiles[id], lesson = profile?.active;
    if (!lesson) return;
    const key = lesson.keys[lesson.index], today = dayKey();
    const outcome = requested === 'remembered' && lesson.hinted ? 'help' : requested;
    const old = profile.memories[key];
    const bandit = trainDecisionLocal(profile.bandit, old?.decision, outcome, today);
    const memory = applyRecall(old, key, outcome, today);
    // A prior action is consumed only by a later-day result. Repeated taps cannot train twice.
    const decision = lesson.decisions[key];
    const consumed = bandit !== profile.bandit;
    memory.decision = {...decision, trained: decision.trained || (consumed && old?.decision?.id === decision.id)};
    const active = {...lesson, decisions: {...lesson.decisions, [key]: memory.decision}, outcomes: {...lesson.outcomes, [key]: outcome}};
    get().commit({...data, profiles: {...data.profiles, [id]: {...profile, bandit, active,
      memories: {...profile.memories, [key]: memory}, activityDays: [...new Set([...profile.activityDays, today])].sort().slice(-730)}}});
  },
  finish: (id, complete) => {
    const {data} = get(), profile = data.profiles[id], lesson = profile?.active;
    if (!lesson) return;
    const summary = {id: lesson.id, endedAt: new Date().toISOString(), keys: Object.keys(lesson.outcomes), outcomes: lesson.outcomes, seconds: lesson.activeSeconds, complete};
    const sessions = [...profile.sessions.filter(s => s.id !== lesson.id), summary].slice(-500);
    get().commit({...data, profiles: {...data.profiles, [id]: {...profile, sessions,
      active: complete ? {...lesson, step: 'summary', phase: 'ready'} : {...lesson, phase: 'ready'}}}});
  },
  resetPersonalization: id => {
    const {data} = get(), profile = data.profiles[id];
    if (!profile) return;
    const memories = Object.fromEntries(Object.entries(profile.memories).map(([k, m]) => [k, {...m, decision: undefined}]));
    const active = profile.active ? {...profile.active, decisions: Object.fromEntries(Object.entries(profile.active.decisions).map(([k,d])=>[k,{...d,eligible:false}]))} : undefined;
    get().commit({...data, profiles: {...data.profiles, [id]: {...profile, active, memories, bandit: newBandit()}}});
  },
}));
import {trainDecision as trainDecisionLocal} from './domain';
export function activeLearnerId(): string { return useLearnerStore.getState().getActiveLearner()?.id ?? ''; }
export async function flushLearning(): Promise<void> { await writes; }
