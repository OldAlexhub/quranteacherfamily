import type {Arm, Bandit, Context, Decision, LearningProfile, Memory, Recall, LearnerSettings} from './types';

export const ARMS: Arm[] = [2, 3, 5];
export const INTERVALS = [1, 3, 7, 14, 30];
export const PATH = [1, 112, 113, 114, 108, 103, 110, 109, 107, 106, 105, 104, 102, 101, 100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78];
export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function addDays(day: string, count: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + count, 12));
}
export function verseParts(key: string): [number, number] {
  return key.split(':').map(Number) as [number, number];
}
export function defaultSettings(pronunciation = true): LearnerSettings {
  return {pronunciation, meaning: false, adaptive: true, repeats: null, speed: 1, minutes: 5, reciter: 'husary'};
}
export function newBandit(): Bandit {
  const row = () => ({2: {alpha: 2, beta: 2}, 3: {alpha: 2, beta: 2}, 5: {alpha: 2, beta: 2}});
  return {observations: 0, recent: [], arms: {support: row(), building: row(), steady: row()}};
}
export function newProfile(pronunciation = true): LearningProfile {
  return {settings: defaultSettings(pronunciation), memories: {}, bandit: newBandit(), sessions: [], activityDays: []};
}
export function contextFor(bandit: Bandit): Context {
  const recent = bandit.recent.slice(-5);
  const rate = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0.5;
  return rate < 0.5 ? 'support' : rate >= 0.8 ? 'steady' : 'building';
}
// Integer beta parameters allow exact gamma sampling without a numerical library.
function gammaInteger(shape: number, random: () => number): number {
  let result = 0;
  for (let i = 0; i < shape; i++) result -= Math.log(Math.max(1e-12, Math.min(1 - 1e-12, random())));
  return result;
}
export function chooseArm(bandit: Bandit, random = Math.random): Arm {
  if (bandit.observations < 5) return 3;
  const arms = bandit.arms[contextFor(bandit)];
  let best: Arm = 3, bestValue = -1;
  for (const arm of ARMS) {
    const {alpha, beta} = arms[arm];
    const a = gammaInteger(alpha, random), b = gammaInteger(beta, random);
    const value = a / (a + b);
    if (value > bestValue) { bestValue = value; best = arm; }
  }
  return best;
}
export function trainDecision(bandit: Bandit, decision: Decision | undefined, outcome: Recall, day: string): Bandit {
  if (!decision || decision.trained || !decision.eligible || decision.day >= day) return bandit;
  const reward = outcome === 'remembered' ? 1 : 0;
  const old = bandit.arms[decision.context][decision.arm];
  // Bound computational work after long usage while preserving posterior mean approximately.
  const shrink = old.alpha + old.beta > 200;
  const next = {alpha: (shrink ? Math.max(2, Math.round(old.alpha / 2)) : old.alpha) + reward,
    beta: (shrink ? Math.max(2, Math.round(old.beta / 2)) : old.beta) + 1 - reward};
  return {...bandit, observations: bandit.observations + 1, recent: [...bandit.recent, reward].slice(-20),
    arms: {...bandit.arms, [decision.context]: {...bandit.arms[decision.context], [decision.arm]: next}}};
}
export function applyRecall(old: Memory | undefined, key: string, outcome: Recall, day: string): Memory {
  const later = Boolean(old?.lastDay && old.lastDay < day);
  const successfulReview = outcome === 'remembered' && later && old?.lastIndependentDay !== day;
  const successes = outcome === 'remembered' ? (old?.successes ?? 0) + (successfulReview ? 1 : 0) : 0;
  const interval = outcome === 'remembered' ? Math.min(successes, INTERVALS.length - 1) : 0;
  return {...old, key, practiced: true, independent: outcome === 'remembered', retained: successes >= 3,
    successes, interval, due: addDays(day, INTERVALS[interval]), lastDay: day,
    lastIndependentDay: outcome === 'remembered' ? day : old?.lastIndependentDay, lastOutcome: outcome};
}
export function dueMemories(profile: LearningProfile, day = dayKey()): Memory[] {
  return Object.values(profile.memories).filter(m => m.due <= day)
    .sort((a, b) => a.due.localeCompare(b.due) || a.key.localeCompare(b.key, undefined, {numeric: true}));
}
export function migrateLegacy(profile: LearningProfile, statuses: Record<string, {surahNumber: number; ayahNumber: number; status: string; reviewDueAt?: string}>, day: string): LearningProfile {
  const memories = {...profile.memories};
  for (const item of Object.values(statuses)) {
    if (item.status === 'not_started') continue;
    const key = `${item.surahNumber}:${item.ayahNumber}`;
    if (memories[key]) continue;
    memories[key] = {key, practiced: true, independent: false, retained: false, successes: 0, interval: 0,
      due: item.reviewDueAt?.slice(0,10) ?? day, legacyMemorized: item.status === 'memorized'};
  }
  return {...profile, memories};
}
export function nextKeys(profile: LearningProfile, counts: Record<number, number>, day = dayKey()): string[] {
  if (profile.active && profile.active.step !== 'summary') return profile.active.keys;
  const due = dueMemories(profile, day);
  if (due.length) return due.slice(0, 3).map(m => m.key);
  const order = [...PATH, ...Array.from({length: 114}, (_, i) => i + 1).filter(n => !PATH.includes(n))];
  for (const surah of order) for (let ayah = 1; ayah <= counts[surah]; ayah++) {
    const key = `${surah}:${ayah}`;
    if (!profile.memories[key]?.practiced) return [key];
  }
  return Object.values(profile.memories).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3).map(m => m.key);
}
