import {create} from 'zustand';
import {KEYS, storageGet, storageSet} from '../storage/storage';
import type {
  ReadingProgress,
  ListeningProgress,
  PracticeStatus,
  PracticeSession,
  PracticeStatusType,
  PracticeMode,
  RecitationStyle,
} from '../types';
import {generateId} from '../utils/idUtils';

type ProgressMap<T> = Record<string, T>;

interface ProgressState {
  readingProgress: ProgressMap<ReadingProgress>;
  listeningProgress: ProgressMap<ListeningProgress>;
  practiceStatus: ProgressMap<Record<string, PracticeStatus>>;
  practiceSessions: ProgressMap<PracticeSession[]>;
  loaded: boolean;

  loadProgress: () => Promise<void>;

  saveLastRead: (learnerId: string, surahNumber: number, ayahNumber: number) => Promise<void>;
  recordAyahRead: (learnerId: string, surahNumber: number, ayahNumber: number) => Promise<void>;
  getReadingProgress: (learnerId: string) => ReadingProgress | null;
  getContinueReadingLocation: (learnerId: string) => {surahNumber: number; ayahNumber: number} | null;

  recordListeningTime: (learnerId: string, seconds: number, style: RecitationStyle) => Promise<void>;
  getListeningProgress: (learnerId: string) => ListeningProgress | null;

  updatePracticeStatus: (learnerId: string, surahNumber: number, ayahNumber: number, status: PracticeStatusType) => Promise<void>;
  bulkUpdatePracticeStatus: (learnerId: string, surahNumber: number, startAyah: number, endAyah: number, status: PracticeStatusType) => Promise<void>;
  getPracticeStatus: (learnerId: string, surahNumber: number, ayahNumber: number) => PracticeStatusType;
  getNeedsReviewList: (learnerId: string) => PracticeStatus[];
  getMemorizedList: (learnerId: string) => PracticeStatus[];
  calculateMemorizationProgress: (learnerId: string) => {memorized: number; practicing: number; needsReview: number; notStarted: number; total: number};

  createPracticeSession: (learnerId: string, mode: PracticeMode, surahNumber: number, startAyah: number, endAyah: number, repeatCount: number) => Promise<PracticeSession>;
  completePracticeSession: (sessionId: string, learnerId: string, durationSeconds: number) => Promise<void>;
  getPracticeSessions: (learnerId: string) => PracticeSession[];

  resetLearnerProgress: (learnerId: string) => Promise<void>;
}

function defaultReading(learnerId: string): ReadingProgress {
  return {id: learnerId, learnerId, lastSurahNumber: 1, lastAyahNumber: 1, ayahsRead: 0, surahsOpened: 0, readingSessions: 0, updatedAt: new Date().toISOString()};
}

function defaultListening(learnerId: string): ListeningProgress {
  return {id: learnerId, learnerId, listeningSeconds: 0, updatedAt: new Date().toISOString()};
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  readingProgress: {},
  listeningProgress: {},
  practiceStatus: {},
  practiceSessions: {},
  loaded: false,

  loadProgress: async () => {
    const [reading, listening, practice, sessions] = await Promise.all([
      storageGet<ProgressMap<ReadingProgress>>(KEYS.READING_PROGRESS, {}),
      storageGet<ProgressMap<ListeningProgress>>(KEYS.LISTENING_PROGRESS, {}),
      storageGet<ProgressMap<Record<string, PracticeStatus>>>(KEYS.PRACTICE_STATUS, {}),
      storageGet<ProgressMap<PracticeSession[]>>(KEYS.PRACTICE_SESSIONS, {}),
    ]);
    set({readingProgress: reading ?? {}, listeningProgress: listening ?? {}, practiceStatus: practice ?? {}, practiceSessions: sessions ?? {}, loaded: true});
  },

  saveLastRead: async (learnerId, surahNumber, ayahNumber) => {
    const {readingProgress} = get();
    const current = readingProgress[learnerId] ?? defaultReading(learnerId);
    const updated = {...current, lastSurahNumber: surahNumber, lastAyahNumber: ayahNumber, updatedAt: new Date().toISOString()};
    const newMap = {...readingProgress, [learnerId]: updated};
    set({readingProgress: newMap});
    await storageSet(KEYS.READING_PROGRESS, newMap);
  },

  recordAyahRead: async (learnerId, _surahNumber, _ayahNumber) => {
    const {readingProgress} = get();
    const current = readingProgress[learnerId] ?? defaultReading(learnerId);
    const updated = {...current, ayahsRead: current.ayahsRead + 1, readingSessions: current.readingSessions, updatedAt: new Date().toISOString()};
    const newMap = {...readingProgress, [learnerId]: updated};
    set({readingProgress: newMap});
    await storageSet(KEYS.READING_PROGRESS, newMap);
  },

  getReadingProgress: (learnerId) => get().readingProgress[learnerId] ?? null,

  getContinueReadingLocation: (learnerId) => {
    const p = get().readingProgress[learnerId];
    if (!p) return null;
    return {surahNumber: p.lastSurahNumber, ayahNumber: p.lastAyahNumber};
  },

  recordListeningTime: async (learnerId, seconds, style) => {
    const {listeningProgress} = get();
    const current = listeningProgress[learnerId] ?? defaultListening(learnerId);
    const updated = {...current, listeningSeconds: current.listeningSeconds + seconds, recitationStyle: style, updatedAt: new Date().toISOString()};
    const newMap = {...listeningProgress, [learnerId]: updated};
    set({listeningProgress: newMap});
    await storageSet(KEYS.LISTENING_PROGRESS, newMap);
  },

  getListeningProgress: (learnerId) => get().listeningProgress[learnerId] ?? null,

  updatePracticeStatus: async (learnerId, surahNumber, ayahNumber, status) => {
    const {practiceStatus} = get();
    const learnerMap = {...(practiceStatus[learnerId] ?? {})};
    const key = `${surahNumber}_${ayahNumber}`;
    learnerMap[key] = {id: key, learnerId, surahNumber, ayahNumber, status, updatedAt: new Date().toISOString()};
    const newMap = {...practiceStatus, [learnerId]: learnerMap};
    set({practiceStatus: newMap});
    await storageSet(KEYS.PRACTICE_STATUS, newMap);
  },

  bulkUpdatePracticeStatus: async (learnerId, surahNumber, startAyah, endAyah, status) => {
    const {practiceStatus} = get();
    const learnerMap = {...(practiceStatus[learnerId] ?? {})};
    const now = new Date().toISOString();
    for (let i = startAyah; i <= endAyah; i++) {
      const key = `${surahNumber}_${i}`;
      learnerMap[key] = {id: key, learnerId, surahNumber, ayahNumber: i, status, updatedAt: now};
    }
    const newMap = {...practiceStatus, [learnerId]: learnerMap};
    set({practiceStatus: newMap});
    await storageSet(KEYS.PRACTICE_STATUS, newMap);
  },

  getPracticeStatus: (learnerId, surahNumber, ayahNumber) => {
    const learnerMap = get().practiceStatus[learnerId] ?? {};
    return learnerMap[`${surahNumber}_${ayahNumber}`]?.status ?? 'not_started';
  },

  getNeedsReviewList: (learnerId) => {
    const learnerMap = get().practiceStatus[learnerId] ?? {};
    return Object.values(learnerMap).filter(s => s.status === 'needs_review');
  },

  getMemorizedList: (learnerId) => {
    const learnerMap = get().practiceStatus[learnerId] ?? {};
    return Object.values(learnerMap).filter(s => s.status === 'memorized');
  },

  calculateMemorizationProgress: (learnerId) => {
    const learnerMap = get().practiceStatus[learnerId] ?? {};
    const items = Object.values(learnerMap);
    return {
      memorized: items.filter(s => s.status === 'memorized').length,
      practicing: items.filter(s => s.status === 'practicing').length,
      needsReview: items.filter(s => s.status === 'needs_review').length,
      notStarted: items.filter(s => s.status === 'not_started' || s.status === 'learning').length,
      total: items.length,
    };
  },

  createPracticeSession: async (learnerId, mode, surahNumber, startAyah, endAyah, repeatCount) => {
    const session: PracticeSession = {
      id: generateId(),
      learnerId,
      mode,
      surahNumber,
      startAyah,
      endAyah,
      repeatCount,
      completedAt: new Date().toISOString(),
    };
    const {practiceSessions} = get();
    const sessions = [...(practiceSessions[learnerId] ?? []), session];
    const newMap = {...practiceSessions, [learnerId]: sessions};
    set({practiceSessions: newMap});
    await storageSet(KEYS.PRACTICE_SESSIONS, newMap);
    return session;
  },

  completePracticeSession: async (sessionId, learnerId, durationSeconds) => {
    const {practiceSessions} = get();
    const sessions = (practiceSessions[learnerId] ?? []).map(s =>
      s.id === sessionId ? {...s, durationSeconds, completedAt: new Date().toISOString()} : s,
    );
    const newMap = {...practiceSessions, [learnerId]: sessions};
    set({practiceSessions: newMap});
    await storageSet(KEYS.PRACTICE_SESSIONS, newMap);
  },

  getPracticeSessions: (learnerId) => get().practiceSessions[learnerId] ?? [],

  resetLearnerProgress: async (learnerId) => {
    const {readingProgress, listeningProgress, practiceStatus, practiceSessions} = get();
    const newReading = {...readingProgress};
    const newListening = {...listeningProgress};
    const newPractice = {...practiceStatus};
    const newSessions = {...practiceSessions};
    delete newReading[learnerId];
    delete newListening[learnerId];
    delete newPractice[learnerId];
    delete newSessions[learnerId];
    set({readingProgress: newReading, listeningProgress: newListening, practiceStatus: newPractice, practiceSessions: newSessions});
    await Promise.all([
      storageSet(KEYS.READING_PROGRESS, newReading),
      storageSet(KEYS.LISTENING_PROGRESS, newListening),
      storageSet(KEYS.PRACTICE_STATUS, newPractice),
      storageSet(KEYS.PRACTICE_SESSIONS, newSessions),
    ]);
  },
}));
