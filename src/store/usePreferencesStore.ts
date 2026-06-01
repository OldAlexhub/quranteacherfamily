import {create} from 'zustand';
import {KEYS, storageGet, storageSet} from '../storage/storage';
import type {UserPreference, RecitationStyle} from '../types';
import {ArabicFontSizeDefaults, EnglishMeaningFontSizeDefaults} from '../theme/typography';

const DEFAULT_PREFERENCES: UserPreference = {
  id: 'user_prefs',
  theme: 'light',
  arabicFontSize: ArabicFontSizeDefaults.medium,
  englishMeaningFontSize: EnglishMeaningFontSizeDefaults.medium,
  englishMeaningDefaultHidden: true,
  selectedRecitationStyle: 'muallim',
  defaultRepeatCount: 3,
  defaultDelaySeconds: 1,
  defaultPracticeMode: 'listen_only',
  reminderEnabled: false,
  reminderTime: undefined,
  onboardingCompleted: false,
};

interface PreferencesState {
  preferences: UserPreference;
  loaded: boolean;
  loadPreferences: () => Promise<void>;
  savePreferences: (partial: Partial<UserPreference>) => Promise<void>;
  setTheme: (theme: UserPreference['theme']) => Promise<void>;
  setArabicFontSize: (size: number) => Promise<void>;
  setEnglishFontSize: (size: number) => Promise<void>;
  setEnglishHidden: (hidden: boolean) => Promise<void>;
  setRecitationStyle: (style: RecitationStyle) => Promise<void>;
  setDefaultRepeatCount: (count: number) => Promise<void>;
  setDefaultDelay: (seconds: number) => Promise<void>;
  setDefaultPracticeMode: (mode: import('../types').PracticeMode) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  setReminderEnabled: (enabled: boolean, time?: string) => Promise<void>;
  restoreDefaults: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  loaded: false,

  loadPreferences: async () => {
    const saved = await storageGet<UserPreference>(KEYS.PREFERENCES, DEFAULT_PREFERENCES);
    const merged = {...DEFAULT_PREFERENCES, ...saved};
    set({preferences: merged, loaded: true});
  },

  savePreferences: async (partial) => {
    const current = get().preferences;
    const updated = {...current, ...partial};
    set({preferences: updated});
    await storageSet(KEYS.PREFERENCES, updated);
  },

  setTheme: async (theme) => get().savePreferences({theme}),
  setArabicFontSize: async (size) => get().savePreferences({arabicFontSize: size}),
  setEnglishFontSize: async (size) => get().savePreferences({englishMeaningFontSize: size}),
  setEnglishHidden: async (hidden) => get().savePreferences({englishMeaningDefaultHidden: hidden}),
  setRecitationStyle: async (style) => get().savePreferences({selectedRecitationStyle: style}),
  setDefaultRepeatCount: async (count) => get().savePreferences({defaultRepeatCount: Math.max(1, count)}),
  setDefaultDelay: async (seconds) => get().savePreferences({defaultDelaySeconds: Math.max(0, Math.min(60, seconds))}),
  setDefaultPracticeMode: async (mode) => get().savePreferences({defaultPracticeMode: mode}),
  setOnboardingCompleted: async (completed) => get().savePreferences({onboardingCompleted: completed}),
  setReminderEnabled: async (enabled, time) => get().savePreferences({reminderEnabled: enabled, reminderTime: time}),
  restoreDefaults: async () => {
    const reset = {...DEFAULT_PREFERENCES, onboardingCompleted: get().preferences.onboardingCompleted};
    set({preferences: reset});
    await storageSet(KEYS.PREFERENCES, reset);
  },
}));
