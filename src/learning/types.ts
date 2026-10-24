export type Language = 'en' | 'ar';
export type Recall = 'remembered' | 'help' | 'again';
export type LessonStep = 'understand' | 'listen' | 'repeat' | 'recall' | 'connect' | 'summary';
export type Arm = 2 | 3 | 5;
export type Context = 'support' | 'building' | 'steady';
export type Reciter = 'husary' | 'husary-mujawwad';
export interface LearnerSettings {
  pronunciation: boolean; meaning: boolean; adaptive: boolean; repeats: number | null;
  speed: number; minutes: number; reciter: Reciter;
}
export interface Decision {id: string; day: string; arm: Arm; context: Context; trained: boolean; eligible: boolean}
export interface Memory {
  key: string; practiced: boolean; independent: boolean; retained: boolean;
  successes: number; interval: number; due: string; lastDay?: string; lastIndependentDay?: string;
  lastOutcome?: Recall; legacyMemorized?: boolean; decision?: Decision;
}
export interface Bandit {
  observations: number; recent: number[];
  arms: Record<Context, Record<Arm, {alpha: number; beta: number}>>;
}
export interface LearningProfile {
  settings: LearnerSettings; memories: Record<string, Memory>; bandit: Bandit;
  active?: Lesson; sessions: LessonSummary[]; activityDays: string[];
}
export interface Lesson {
  id: string; learnerId: string; keys: string[]; index: number; step: LessonStep;
  round: number; phase: 'ready' | 'listening' | 'yourTurn'; hinted: boolean;
  outcomes: Record<string, Recall>; decisions: Record<string, Decision>;
  repeats: number; startedAt: string; activeSeconds: number; assignmentId?: string;
  understanding?: Record<string,'explained'|'together'|'later'>;
  playback?: {key:string;step:LessonStep;round:number;kind:'audio'|'gap';position:number;remaining?:number};
}
export interface LessonSummary {
  id: string; endedAt: string; keys: string[]; outcomes: Record<string, Recall>;
  seconds: number; complete: boolean;
}
export interface LearningState {
  schema: 1; language: Language; onboarded: boolean; analytics: boolean;
  profiles: Record<string, LearningProfile>; fontScale: number;
}
export interface QuranWord {
  position: number; text: string; transliteration?: string; meaning?: string;
  audioUrl?: string; audioExpiresAt?: string;
}
export interface Segment {word: number; endWord?: number; startMs: number; endMs: number}
export interface QuranVerse {
  key: string; arabic: string; openingBasmala?: string; meaning?: string; transliteration?: string;
  words: QuranWord[]; audioUrl?: string; segments: Segment[];
}
export interface ContentManifest {
  revision: string; surah: number; reciter: Reciter; source: string;
  fetchedAt: string; refreshAfter: string; syncManaged: boolean;
  verses: QuranVerse[];
}
export interface DownloadRecord {
  surah: number; reciter: Reciter; status: 'downloading' | 'ready' | 'interrupted';
  completed: number; total: number; bytes: number; updatedAt: string;
  revision?:string;
}
export type EventName = 'app_open' | 'onboarding_complete' | 'lesson_start' | 'lesson_complete' |
  'playback_error' | 'download_error' | 'app_error' | 'ad_impression' | 'ad_revenue' | 'ad_loaded' | 'ad_failed';
export interface AnalyticsEvent {
  id: string; name: EventName; at: string; appVersion: string; language: Language;
  properties: {durationSeconds?: number; placement?: 'banner' | 'session_end'; currency?: string;
    valueMicros?: number; precision?: string; code?: string};
}
export interface AppConfig {
  revision: number; contentAvailable: boolean; adsEnabled: boolean; adaptiveEnabled: boolean;
  contentRevision: string; minimumBuild: number;
}
export interface ExplanationBlock {kind:'heading'|'paragraph';text:string}
export interface TafsirEntry {id:string;from:string;to:string;keys:string[];blocks:ExplanationBlock[]}
export interface TafsirManifest {
 surah:number;language:Language;revision:string;fetchedAt:string;refreshAfter:string;syncManaged:true;
 source:{id:number;name:string;author:string;slug:string;language:Language};
 entries:TafsirEntry[];byAyah:Record<string,string>;
}
export interface SurahIntroduction {
 surah:number;language:Language;source:string;resourceId:number;blocks:ExplanationBlock[];
 expiresAt:string;syncManaged:false;
}
