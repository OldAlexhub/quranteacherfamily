import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/backend';
import { counts, validKey } from './content';
import type {
  ExplanationBlock,
  Language,
  SurahIntroduction,
  TafsirManifest,
} from './types';

const requests = new Map<string, Promise<unknown>>();
const blocksValid = (blocks: unknown): blocks is ExplanationBlock[] =>
  Array.isArray(blocks) &&
  blocks.length > 0 &&
  blocks.every(
    b =>
      b &&
      (b.kind === 'heading' || b.kind === 'paragraph') &&
      typeof b.text === 'string' &&
      b.text.length > 0,
  );
export function validTafsir(
  data: TafsirManifest,
  surah: number,
  language: Language,
): boolean {
  if (
    !data ||
    data.surah !== surah ||
    data.language !== language ||
    data.syncManaged !== true ||
    !data.source?.name ||
    data.source.language !== language ||
    !Array.isArray(data.entries) ||
    !data.byAyah
  )
    return false;
  if (
    !Number.isFinite(Date.parse(data.refreshAfter)) ||
    !data.entries.every(
      e =>
        typeof e.id === 'string' &&
        blocksValid(e.blocks) &&
        Array.isArray(e.keys) &&
        e.keys.every(validKey) &&
        e.keys[0] === e.from &&
        e.keys[e.keys.length - 1] === e.to,
    )
  )
    return false;
  const entries = new Map(data.entries.map(e => [e.id, e]));
  return Array.from(
    { length: counts[surah] },
    (_, i) => `${surah}:${i + 1}`,
  ).every(key => entries.get(data.byAyah[key])?.keys.includes(key));
}
export async function tafsir(
  surah: number,
  language: Language,
  force = false,
): Promise<TafsirManifest | undefined> {
  const key = `qtf:tafsir:${surah}:${language}`;
  if (requests.has(key))
    return requests.get(key) as Promise<TafsirManifest | undefined>;
  const task = (async () => {
    let cached: TafsirManifest | undefined;
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const value = JSON.parse(raw);
        if (validTafsir(value, surah, language)) cached = value;
      }
    } catch {}
    if (!force && cached && Date.parse(cached.refreshAfter) > Date.now())
      return cached;
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(
        `${API_URL}/api/content/surahs/${surah}/tafsir?language=${language}`,
        { signal: controller.signal },
      );
      // A withdrawn resource must not remain in the offline cache.
      if (response.status === 410) {
        await AsyncStorage.removeItem(key);
        return undefined;
      }
      if (!response.ok) return cached;
      const data = await response.json();
      if (!validTafsir(data, surah, language)) return cached;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return data;
    } catch {
      return cached;
    } finally {
      clearTimeout(timer);
    }
  })().finally(() => requests.delete(key));
  requests.set(key, task);
  return task;
}
export async function surahIntroduction(
  surah: number,
  language: Language,
): Promise<SurahIntroduction | undefined> {
  const key = `qtf:introduction:${surah}:${language}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const cached = JSON.parse(raw);
      if (
        cached.surah === surah &&
        cached.language === language &&
        Date.parse(cached.expiresAt) > Date.now() &&
        blocksValid(cached.blocks)
      )
        return cached;
      await AsyncStorage.removeItem(key);
    }
  } catch {}
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(
      `${API_URL}/api/content/surahs/${surah}/introduction?language=${language}`,
      { signal: controller.signal },
    );
    if (!response.ok) return;
    const data = await response.json();
    if (
      data.surah !== surah ||
      data.language !== language ||
      !data.source ||
      !blocksValid(data.blocks) ||
      Date.parse(data.expiresAt) <= Date.now() ||
      !Number.isFinite(Date.parse(data.expiresAt))
    )
      return;
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return data;
  } catch {
    return;
  } finally {
    clearTimeout(timer);
  }
}
