import {create} from 'zustand';
import {
  GamificationProfile,
  BadgeDefinition,
  XPEventType,
  XPGainResult,
  DailyLearningGoal,
} from '../types';
import {storageGet, storageSet} from '../storage/storage';

// ── Constants ─────────────────────────────────────────────────────────────────

const XP_TABLE: Record<XPEventType, number> = {
  ayah_listened: 5,
  ayah_repeated: 10,
  ayah_memorized: 50,
  review_completed: 15,
  session_completed: 30,
  daily_goal_hit: 100,
  streak_milestone: 200,
  surah_completed: 500,
};

// XP required to REACH each level (index = level)
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000,
  6500, 8200, 10200, 12500, 15000, 18000, 21500, 25500, 30000, 35000,
  41000, 48000, 56000, 65000, 75000, 86000, 98000, 112000, 128000, 150000,
];

const LEVEL_TITLES = [
  'Seeker',     // 1
  'Student',    // 2
  'Reader',     // 3
  'Reciter',    // 4
  'Scholar',    // 5
  'Memorizer',  // 6
  'Devotee',    // 7
  'Guardian',   // 8
  'Keeper',     // 9
  'Hafiz',      // 10+
];

export const ALL_BADGES: BadgeDefinition[] = [
  {id: 'first_listen',    name: 'First Listen',        icon: '👂', description: 'Listen to your first ayah',              xpReward: 50},
  {id: 'first_memorized', name: 'First Memorized',     icon: '⭐', description: 'Memorize your first ayah',               xpReward: 100},
  {id: 'first_session',   name: 'First Session',       icon: '🌱', description: 'Complete your first study session',       xpReward: 50},
  {id: 'streak_3',        name: '3-Day Streak',        icon: '🔥', description: 'Study 3 days in a row',                  xpReward: 100},
  {id: 'streak_7',        name: '7-Day Streak',        icon: '🔥', description: 'Study 7 days in a row',                  xpReward: 200},
  {id: 'streak_14',       name: '14-Day Streak',       icon: '💪', description: 'Study 14 days in a row',                 xpReward: 300},
  {id: 'streak_30',       name: '30-Day Streak',       icon: '🏆', description: 'Study 30 days in a row',                 xpReward: 500},
  {id: 'ayahs_10',        name: '10 Ayahs',            icon: '📜', description: 'Memorize 10 ayahs',                      xpReward: 150},
  {id: 'ayahs_50',        name: '50 Ayahs',            icon: '📖', description: 'Memorize 50 ayahs',                      xpReward: 300},
  {id: 'ayahs_100',       name: '100 Ayahs',           icon: '🕌', description: 'Memorize 100 ayahs',                     xpReward: 500},
  {id: 'ayahs_500',       name: '500 Ayahs',           icon: '🌟', description: 'Memorize 500 ayahs',                     xpReward: 1000},
  {id: 'fatiha_done',     name: 'Al-Fatiha Complete',  icon: '✨', description: 'Memorize all 7 ayahs of Al-Fatiha',      xpReward: 200},
  {id: 'sessions_10',     name: '10 Sessions',         icon: '🎯', description: 'Complete 10 study sessions',             xpReward: 200},
  {id: 'sessions_50',     name: '50 Sessions',         icon: '🥈', description: 'Complete 50 study sessions',             xpReward: 400},
  {id: 'level_5',         name: 'Level 5: Scholar',    icon: '📚', description: 'Reach level 5',                          xpReward: 300},
  {id: 'level_10',        name: 'Level 10: Hafiz',     icon: '🥇', description: 'Reach level 10',                         xpReward: 500},
  {id: 'daily_goal_5',    name: 'Goal Crusher',        icon: '💥', description: 'Hit your daily goal 5 days in a row',   xpReward: 250},
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function computeLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
}

export function getLevelTitle(level: number): string {
  const idx = Math.min(level - 1, LEVEL_TITLES.length - 1);
  return LEVEL_TITLES[Math.max(0, idx)];
}

export function getXPForNextLevel(xp: number): {current: number; needed: number; levelXP: number} {
  const level = computeLevel(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return {
    current: xp - currentThreshold,
    needed: nextThreshold - currentThreshold,
    levelXP: xp,
  };
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function defaultProfile(learnerId: string): GamificationProfile {
  return {
    learnerId,
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    lastActiveDateStr: '',
    earnedBadgeIds: [],
    totalSessions: 0,
    totalStudyMinutes: 0,
    totalAyahsMemorized: 0,
  };
}

function defaultDailyGoal(learnerId: string, dateStr: string): DailyLearningGoal {
  return {learnerId, dateStr, targetAyahs: 3, completedAyahs: 0, isCompleted: false};
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface GamificationState {
  profiles: Record<string, GamificationProfile>;
  dailyGoals: DailyLearningGoal[];
  loaded: boolean;

  loadGamification: () => Promise<void>;
  getProfile: (learnerId: string) => GamificationProfile;
  addXP: (learnerId: string, event: XPEventType) => XPGainResult;
  checkAndUpdateStreak: (learnerId: string) => {streakKept: boolean; streak: number};
  incrementTotalAyahsMemorized: (learnerId: string) => void;
  incrementTotalSessions: (learnerId: string) => void;
  addStudyMinutes: (learnerId: string, minutes: number) => void;
  getDailyGoal: (learnerId: string, dateStr?: string) => DailyLearningGoal;
  updateDailyGoal: (learnerId: string, ayahsDelta: number) => {justCompleted: boolean};
  setDailyTarget: (learnerId: string, target: number) => void;
  _checkBadges: (profile: GamificationProfile) => string[];
  _persist: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  profiles: {},
  dailyGoals: [],
  loaded: false,

  loadGamification: async () => {
    const profiles = await storageGet<Record<string, GamificationProfile>>('gamification_profiles', {});
    const dailyGoals = await storageGet<DailyLearningGoal[]>('gamification_daily_goals', []);
    set({profiles: profiles ?? {}, dailyGoals: dailyGoals ?? [], loaded: true});
  },

  getProfile: (learnerId) => {
    return get().profiles[learnerId] ?? defaultProfile(learnerId);
  },

  checkAndUpdateStreak: (learnerId) => {
    const profile = get().getProfile(learnerId);
    const today = todayStr();
    const yesterday = yesterdayStr();

    if (profile.lastActiveDateStr === today) {
      // Already updated today
      return {streakKept: true, streak: profile.streak};
    }

    let newStreak: number;
    if (profile.lastActiveDateStr === yesterday) {
      newStreak = profile.streak + 1;
    } else if (profile.lastActiveDateStr === '') {
      newStreak = 1;
    } else {
      newStreak = 1; // broke streak
    }

    const longestStreak = Math.max(newStreak, profile.longestStreak);
    const updated: GamificationProfile = {
      ...profile,
      streak: newStreak,
      longestStreak,
      lastActiveDateStr: today,
    };

    set(state => ({profiles: {...state.profiles, [learnerId]: updated}}));
    get()._persist();
    return {streakKept: profile.lastActiveDateStr === yesterday, streak: newStreak};
  },

  addXP: (learnerId, event) => {
    const xpAdded = XP_TABLE[event];
    const profile = get().getProfile(learnerId);
    const oldLevel = computeLevel(profile.xp);
    const newXP = profile.xp + xpAdded;
    const newLevel = computeLevel(newXP);

    // Check for new badges before updating
    const preBadges = new Set(profile.earnedBadgeIds);
    const updatedProfile: GamificationProfile = {
      ...profile,
      xp: newXP,
      level: newLevel,
    };
    const newBadgeIds = get()._checkBadges(updatedProfile).filter(b => !preBadges.has(b));

    const finalProfile: GamificationProfile = {
      ...updatedProfile,
      earnedBadgeIds: [...profile.earnedBadgeIds, ...newBadgeIds],
    };

    // Award XP for each new badge
    let bonusXP = 0;
    for (const badgeId of newBadgeIds) {
      const badge = ALL_BADGES.find(b => b.id === badgeId);
      if (badge) {bonusXP += badge.xpReward;}
    }
    if (bonusXP > 0) {
      finalProfile.xp += bonusXP;
      finalProfile.level = computeLevel(finalProfile.xp);
    }

    set(state => ({profiles: {...state.profiles, [learnerId]: finalProfile}}));
    get()._persist();

    return {
      xpAdded: xpAdded + bonusXP,
      totalXP: finalProfile.xp,
      leveledUp: newLevel > oldLevel,
      newLevel,
      newBadgeIds,
    };
  },

  incrementTotalAyahsMemorized: (learnerId) => {
    const profile = get().getProfile(learnerId);
    const updated = {...profile, totalAyahsMemorized: profile.totalAyahsMemorized + 1};
    set(state => ({profiles: {...state.profiles, [learnerId]: updated}}));
    get()._persist();
  },

  incrementTotalSessions: (learnerId) => {
    const profile = get().getProfile(learnerId);
    const updated = {...profile, totalSessions: profile.totalSessions + 1};
    set(state => ({profiles: {...state.profiles, [learnerId]: updated}}));
    get()._persist();
  },

  addStudyMinutes: (learnerId, minutes) => {
    const profile = get().getProfile(learnerId);
    const updated = {...profile, totalStudyMinutes: profile.totalStudyMinutes + minutes};
    set(state => ({profiles: {...state.profiles, [learnerId]: updated}}));
    get()._persist();
  },

  getDailyGoal: (learnerId, dateStr) => {
    const d = dateStr ?? todayStr();
    return (
      get().dailyGoals.find(g => g.learnerId === learnerId && g.dateStr === d) ??
      defaultDailyGoal(learnerId, d)
    );
  },

  updateDailyGoal: (learnerId, ayahsDelta) => {
    const today = todayStr();
    const existing = get().getDailyGoal(learnerId, today);
    const newCompleted = existing.completedAyahs + ayahsDelta;
    const justCompleted = !existing.isCompleted && newCompleted >= existing.targetAyahs;
    const updated: DailyLearningGoal = {
      ...existing,
      completedAyahs: newCompleted,
      isCompleted: newCompleted >= existing.targetAyahs,
    };
    set(state => {
      const rest = state.dailyGoals.filter(
        g => !(g.learnerId === learnerId && g.dateStr === today),
      );
      return {dailyGoals: [...rest, updated]};
    });
    get()._persist();
    return {justCompleted};
  },

  setDailyTarget: (learnerId, target) => {
    const today = todayStr();
    const existing = get().getDailyGoal(learnerId, today);
    const updated: DailyLearningGoal = {...existing, targetAyahs: target};
    set(state => {
      const rest = state.dailyGoals.filter(
        g => !(g.learnerId === learnerId && g.dateStr === today),
      );
      return {dailyGoals: [...rest, updated]};
    });
    get()._persist();
  },

  _checkBadges: (profile) => {
    const earned = new Set(profile.earnedBadgeIds);
    const newBadges: string[] = [];

    const check = (id: string, condition: boolean) => {
      if (condition && !earned.has(id)) {
        newBadges.push(id);
        earned.add(id);
      }
    };

    check('first_memorized', profile.totalAyahsMemorized >= 1);
    check('first_session',   profile.totalSessions >= 1);
    check('streak_3',        profile.streak >= 3);
    check('streak_7',        profile.streak >= 7);
    check('streak_14',       profile.streak >= 14);
    check('streak_30',       profile.streak >= 30);
    check('ayahs_10',        profile.totalAyahsMemorized >= 10);
    check('ayahs_50',        profile.totalAyahsMemorized >= 50);
    check('ayahs_100',       profile.totalAyahsMemorized >= 100);
    check('ayahs_500',       profile.totalAyahsMemorized >= 500);
    check('sessions_10',     profile.totalSessions >= 10);
    check('sessions_50',     profile.totalSessions >= 50);
    check('level_5',         profile.level >= 5);
    check('level_10',        profile.level >= 10);

    return newBadges;
  },

  _persist: () => {
    const {profiles, dailyGoals} = get();
    storageSet('gamification_profiles', profiles);
    storageSet('gamification_daily_goals', dailyGoals);
  },
}));
