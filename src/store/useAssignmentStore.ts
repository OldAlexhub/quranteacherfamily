import {create} from 'zustand';
import {KEYS, storageGet, storageSet} from '../storage/storage';
import type {Assignment, AssignmentType, AssignmentStatus} from '../types';
import {generateId} from '../utils/idUtils';

type AssignmentMap = Record<string, Assignment[]>;

interface AssignmentState {
  assignments: AssignmentMap;
  loaded: boolean;
  loadAssignments: () => Promise<void>;
  createAssignment: (data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<Assignment>;
  updateAssignment: (id: string, learnerId: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string, learnerId: string) => Promise<void>;
  completeAssignment: (id: string, learnerId: string) => Promise<void>;
  markAssignmentNeedsReview: (id: string, learnerId: string) => Promise<void>;
  duplicateAssignment: (id: string, fromLearnerId: string, toLearnerId: string) => Promise<void>;
  getTodayAssignments: (learnerId: string) => Assignment[];
  getOverdueAssignments: (learnerId: string) => Assignment[];
  getAllAssignments: (learnerId: string) => Assignment[];
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: {},
  loaded: false,

  loadAssignments: async () => {
    const saved = await storageGet<AssignmentMap>(KEYS.ASSIGNMENTS, {});
    set({assignments: saved ?? {}, loaded: true});
  },

  createAssignment: async (data) => {
    const now = new Date().toISOString();
    const assignment: Assignment = {
      ...data,
      id: generateId(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    const {assignments} = get();
    const list = [...(assignments[data.learnerId] ?? []), assignment];
    const newMap = {...assignments, [data.learnerId]: list};
    set({assignments: newMap});
    await storageSet(KEYS.ASSIGNMENTS, newMap);
    return assignment;
  },

  updateAssignment: async (id, learnerId, updates) => {
    const {assignments} = get();
    const list = (assignments[learnerId] ?? []).map(a =>
      a.id === id ? {...a, ...updates, updatedAt: new Date().toISOString()} : a,
    );
    const newMap = {...assignments, [learnerId]: list};
    set({assignments: newMap});
    await storageSet(KEYS.ASSIGNMENTS, newMap);
  },

  deleteAssignment: async (id, learnerId) => {
    const {assignments} = get();
    const list = (assignments[learnerId] ?? []).filter(a => a.id !== id);
    const newMap = {...assignments, [learnerId]: list};
    set({assignments: newMap});
    await storageSet(KEYS.ASSIGNMENTS, newMap);
  },

  completeAssignment: async (id, learnerId) => {
    get().updateAssignment(id, learnerId, {status: 'completed', completedAt: new Date().toISOString()});
  },

  markAssignmentNeedsReview: async (id, learnerId) => {
    get().updateAssignment(id, learnerId, {status: 'needs_review'});
  },

  duplicateAssignment: async (id, fromLearnerId, toLearnerId) => {
    const {assignments} = get();
    const source = (assignments[fromLearnerId] ?? []).find(a => a.id === id);
    if (!source) return;
    const now = new Date().toISOString();
    const copy: Assignment = {
      ...source,
      id: generateId(),
      learnerId: toLearnerId,
      status: 'pending',
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
    };
    const list = [...(assignments[toLearnerId] ?? []), copy];
    const newMap = {...assignments, [toLearnerId]: list};
    set({assignments: newMap});
    await storageSet(KEYS.ASSIGNMENTS, newMap);
  },

  getTodayAssignments: (learnerId) => {
    const today = new Date().toISOString().slice(0, 10);
    return (get().assignments[learnerId] ?? []).filter(a => a.dueDate.slice(0, 10) <= today && a.status !== 'completed');
  },

  getOverdueAssignments: (learnerId) => {
    const today = new Date().toISOString().slice(0, 10);
    return (get().assignments[learnerId] ?? []).filter(a => a.dueDate.slice(0, 10) < today && a.status !== 'completed');
  },

  getAllAssignments: (learnerId) => get().assignments[learnerId] ?? [],
}));
