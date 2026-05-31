import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  PREFERENCES: 'qtf:preferences',
  LEARNERS: 'qtf:learners',
  ACTIVE_LEARNER: 'qtf:active_learner',
  READING_PROGRESS: 'qtf:reading_progress',
  LISTENING_PROGRESS: 'qtf:listening_progress',
  PRACTICE_STATUS: 'qtf:practice_status',
  PRACTICE_SESSIONS: 'qtf:practice_sessions',
  ASSIGNMENTS: 'qtf:assignments',
  BOOKMARKS: 'qtf:bookmarks',
  NOTES: 'qtf:notes',
  DAILY_COMPLETIONS: 'qtf:daily_completions',
} as const;

export async function storageGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage write failed:', key, e);
  }
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('Storage remove failed:', key, e);
  }
}

export async function storageClearAll(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const qtfKeys = allKeys.filter(k => k.startsWith('qtf:'));
    await AsyncStorage.multiRemove(qtfKeys);
  } catch (e) {
    console.warn('Storage clearAll failed:', e);
  }
}

export async function storageClearLearner(learnerId: string): Promise<void> {
  try {
    const keysToPartialClear = [
      KEYS.READING_PROGRESS,
      KEYS.LISTENING_PROGRESS,
      KEYS.PRACTICE_STATUS,
      KEYS.PRACTICE_SESSIONS,
      KEYS.ASSIGNMENTS,
      KEYS.BOOKMARKS,
      KEYS.NOTES,
      KEYS.DAILY_COMPLETIONS,
    ];

    for (const key of keysToPartialClear) {
      const data = await storageGet<Record<string, unknown>>(key, {});
      if (typeof data === 'object' && data !== null) {
        delete (data as Record<string, unknown>)[learnerId];
        await storageSet(key, data);
      }
    }
  } catch (e) {
    console.warn('Storage clearLearner failed:', e);
  }
}
