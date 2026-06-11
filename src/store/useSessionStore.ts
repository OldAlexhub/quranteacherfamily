import {create} from 'zustand';
import {ActiveSession, SessionPhase} from '../types';
import {storageGet, storageSet} from '../storage/storage';
import {generateId} from '../utils/idUtils';

export interface SessionHistoryEntry {
  id: string;
  learnerId: string;
  startedAt: string;
  completedAt: string;
  studyDurationMinutes: number;
  ayahsCompleted: number;
  xpEarned: number;
  breakCount: number;
}

interface SessionState {
  activeSession: ActiveSession | null;
  sessionHistory: SessionHistoryEntry[];
  loaded: boolean;

  loadSessionHistory: () => Promise<void>;
  startSession: (
    learnerId: string,
    studyMinutes: number,
    breakMinutes: number,
  ) => ActiveSession;
  tickSecond: () => void;
  recordAyahCompleted: (xpEarned: number) => void;
  triggerBreak: () => void;
  resumeStudy: () => void;
  pauseSession: () => void;
  endSession: () => SessionHistoryEntry | null;
  getActiveSession: () => ActiveSession | null;
  getRemainingStudySeconds: () => number;
  getRemainingBreakSeconds: () => number;
  hasActiveSession: () => boolean;
}

let _intervalId: ReturnType<typeof setInterval> | null = null;

function clearTicker() {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  sessionHistory: [],
  loaded: false,

  loadSessionHistory: async () => {
    const history = await storageGet<SessionHistoryEntry[]>('session_history', []);
    set({sessionHistory: history ?? [], loaded: true});
  },

  startSession: (learnerId, studyMinutes, breakMinutes) => {
    clearTicker();
    const session: ActiveSession = {
      id: generateId(),
      learnerId,
      startedAt: new Date().toISOString(),
      studyDurationMinutes: studyMinutes,
      breakDurationMinutes: breakMinutes,
      phase: 'studying',
      elapsedStudySeconds: 0,
      elapsedBreakSeconds: 0,
      ayahsCompletedThisSession: 0,
      xpEarnedThisSession: 0,
      breakCount: 0,
    };
    set({activeSession: session});

    _intervalId = setInterval(() => {
      get().tickSecond();
    }, 1000);

    return session;
  },

  tickSecond: () => {
    const s = get().activeSession;
    if (!s || s.phase === 'completed' || s.phase === 'idle') {return;}

    if (s.phase === 'studying') {
      const newElapsed = s.elapsedStudySeconds + 1;
      const totalStudySec = s.studyDurationMinutes * 60;

      if (newElapsed >= totalStudySec) {
        // Study time up → trigger break automatically
        set(state => ({
          activeSession: state.activeSession
            ? {
                ...state.activeSession,
                elapsedStudySeconds: totalStudySec,
                phase: 'break',
                elapsedBreakSeconds: 0,
                breakCount: state.activeSession.breakCount + 1,
              }
            : null,
        }));
      } else {
        set(state => ({
          activeSession: state.activeSession
            ? {...state.activeSession, elapsedStudySeconds: newElapsed}
            : null,
        }));
      }
    } else if (s.phase === 'break') {
      const newElapsed = s.elapsedBreakSeconds + 1;
      const totalBreakSec = s.breakDurationMinutes * 60;

      if (newElapsed >= totalBreakSec) {
        // Break over → back to studying with reset timer
        set(state => ({
          activeSession: state.activeSession
            ? {
                ...state.activeSession,
                elapsedBreakSeconds: totalBreakSec,
                phase: 'studying',
                elapsedStudySeconds: 0,
              }
            : null,
        }));
      } else {
        set(state => ({
          activeSession: state.activeSession
            ? {...state.activeSession, elapsedBreakSeconds: newElapsed}
            : null,
        }));
      }
    }
  },

  recordAyahCompleted: (xpEarned) => {
    set(state => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            ayahsCompletedThisSession: state.activeSession.ayahsCompletedThisSession + 1,
            xpEarnedThisSession: state.activeSession.xpEarnedThisSession + xpEarned,
          }
        : null,
    }));
  },

  triggerBreak: () => {
    set(state => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            phase: 'break' as SessionPhase,
            elapsedBreakSeconds: 0,
            breakCount: state.activeSession.breakCount + 1,
          }
        : null,
    }));
  },

  resumeStudy: () => {
    set(state => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            phase: 'studying' as SessionPhase,
            elapsedStudySeconds: 0,
          }
        : null,
    }));
  },

  pauseSession: () => {
    clearTicker();
    set(state => ({
      activeSession: state.activeSession
        ? {...state.activeSession, phase: 'idle' as SessionPhase}
        : null,
    }));
  },

  endSession: () => {
    clearTicker();
    const s = get().activeSession;
    if (!s) {return null;}

    const studyMinutes = Math.floor(s.elapsedStudySeconds / 60);
    const entry: SessionHistoryEntry = {
      id: s.id,
      learnerId: s.learnerId,
      startedAt: s.startedAt,
      completedAt: new Date().toISOString(),
      studyDurationMinutes: studyMinutes,
      ayahsCompleted: s.ayahsCompletedThisSession,
      xpEarned: s.xpEarnedThisSession,
      breakCount: s.breakCount,
    };

    set(state => ({
      activeSession: null,
      sessionHistory: [entry, ...state.sessionHistory].slice(0, 100),
    }));

    storageSet('session_history', get().sessionHistory);
    return entry;
  },

  getActiveSession: () => get().activeSession,

  getRemainingStudySeconds: () => {
    const s = get().activeSession;
    if (!s) {return 0;}
    return Math.max(0, s.studyDurationMinutes * 60 - s.elapsedStudySeconds);
  },

  getRemainingBreakSeconds: () => {
    const s = get().activeSession;
    if (!s) {return 0;}
    return Math.max(0, s.breakDurationMinutes * 60 - s.elapsedBreakSeconds);
  },

  hasActiveSession: () => {
    const s = get().activeSession;
    return s !== null && s.phase !== 'completed';
  },
}));
