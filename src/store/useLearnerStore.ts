import {create} from 'zustand';
import {KEYS, storageGet, storageSet} from '../storage/storage';
import type {LearnerProfile, AvatarColor} from '../types';
import {generateId} from '../utils/idUtils';

const AVATAR_COLORS: AvatarColor[] = [
  '#1B4332', '#2980B9', '#8E44AD', '#D35400', '#16A085', '#2C3E50',
];

interface LearnerState {
  learners: LearnerProfile[];
  activeLearnerIdx: number;
  loaded: boolean;
  loadLearners: () => Promise<void>;
  getActiveLearner: () => LearnerProfile | null;
  setActiveLearner: (id: string) => Promise<void>;
  createLearner: (name: string, color?: AvatarColor) => Promise<LearnerProfile>;
  updateLearner: (id: string, updates: Partial<LearnerProfile>) => Promise<void>;
  deleteLearner: (id: string) => Promise<void>;
}

export const useLearnerStore = create<LearnerState>((set, get) => ({
  learners: [],
  activeLearnerIdx: 0,
  loaded: false,

  loadLearners: async () => {
    const saved = await storageGet<LearnerProfile[]>(KEYS.LEARNERS, []);
    const activeId = await storageGet<string>(KEYS.ACTIVE_LEARNER, '');
    const valid = (saved ?? []).filter(l => l && l.id && typeof l.id === 'string');
    const idx = valid.findIndex(l => l.id === activeId);
    set({learners: valid, activeLearnerIdx: Math.max(0, idx), loaded: true});
  },

  getActiveLearner: () => {
    const {learners, activeLearnerIdx} = get();
    return learners[activeLearnerIdx] ?? null;
  },

  setActiveLearner: async (id: string) => {
    const {learners} = get();
    const idx = learners.findIndex(l => l.id === id);
    if (idx >= 0) {
      set({activeLearnerIdx: idx});
      await storageSet(KEYS.ACTIVE_LEARNER, id);
    }
  },

  createLearner: async (name: string, color?: AvatarColor) => {
    const trimmed = name.trim().slice(0, 30);
    const {learners} = get();
    const avatarColor = color ?? AVATAR_COLORS[learners.length % AVATAR_COLORS.length];
    const now = new Date().toISOString();
    const learner: LearnerProfile = {
      id: generateId(),
      displayName: trimmed,
      avatarColor,
      createdAt: now,
      updatedAt: now,
      active: true,
    };
    const updated = [...learners, learner];
    set({learners: updated, activeLearnerIdx: updated.length - 1});
    await storageSet(KEYS.LEARNERS, updated);
    await storageSet(KEYS.ACTIVE_LEARNER, learner.id);
    return learner;
  },

  updateLearner: async (id: string, updates: Partial<LearnerProfile>) => {
    const {learners} = get();
    const idx = learners.findIndex(l => l.id === id);
    if (idx < 0) return;
    const updated = [...learners];
    updated[idx] = {...updated[idx], ...updates, updatedAt: new Date().toISOString()};
    set({learners: updated});
    await storageSet(KEYS.LEARNERS, updated);
  },

  deleteLearner: async (id: string) => {
    const {learners, activeLearnerIdx} = get();
    const filtered = learners.filter(l => l.id !== id);
    const newIdx = Math.min(activeLearnerIdx, Math.max(0, filtered.length - 1));
    set({learners: filtered, activeLearnerIdx: newIdx});
    await storageSet(KEYS.LEARNERS, filtered);
    if (filtered.length > 0) {
      await storageSet(KEYS.ACTIVE_LEARNER, filtered[newIdx].id);
    } else {
      await storageSet(KEYS.ACTIVE_LEARNER, '');
    }
  },
}));
