/**
 * Al-Quran Cloud API client — https://alquran.cloud/api
 * Islamic Network CDN for audio — cdn.islamic.network
 * Both are free, open-source, and require no API key.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://api.alquran.cloud/v1';

// ─── Audio CDN ───────────────────────────────────────────────────────────────

// Islamic Network CDN — free, no auth required
// Muallim style: Mahmoud Khalil Al-Husary (clear teaching recitation)
// Mujawwad style: Mahmoud Khalil Al-Husary Mujawwad
const CDN_RECITERS = {
  muallim: 'ar.husary',
  mujawwad: 'ar.husarymujawwad',
} as const;

export function getAudioUrl(
  globalAyahNumber: number,
  style: 'muallim' | 'mujawwad',
): string {
  const reciter = CDN_RECITERS[style];
  return `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalAyahNumber}.mp3`;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

const CACHE_PREFIX = 'qtf_api_';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const {data, ts} = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data as T;
  } catch {
    return null;
  }
}

async function cacheSet<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify({data, ts: Date.now()}));
  } catch {}
}

// ─── API types ────────────────────────────────────────────────────────────────

interface ApiAyah {
  number: number;           // global ayah number
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}

interface ApiSurahEdition {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: ApiAyah[];
  edition?: {identifier: string; language: string; name: string};
}

export interface SurahAyahs {
  surahNumber: number;
  ayahs: Array<{
    ayahNumber: number;
    globalNumber: number;
    arabicText: string;
    transliteration: string;
    englishMeaning: string;
    juz: number;
    page: number;
  }>;
}

// ─── Fetch surah (Arabic + English in one request) ───────────────────────────

export async function fetchSurahAyahs(surahNumber: number): Promise<SurahAyahs> {
  // v2 cache key — includes transliteration; old v1 entries are intentionally abandoned
  const cacheKey = `surah_v2_${surahNumber}`;
  const cached = await cacheGet<SurahAyahs>(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/surah/${surahNumber}/editions/ar.uthmani,en.pickthall,en.transliteration`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status} for surah ${surahNumber}`);

  const json = await res.json();
  if (json.code !== 200) throw new Error(`API returned code ${json.code}`);

  const editions: ApiSurahEdition[] = json.data;
  const arabicEdition = editions.find(
    e => e.edition?.identifier === 'ar.uthmani' || (e.ayahs[0]?.text && isArabic(e.ayahs[0].text)),
  );
  const englishEdition = editions.find(e => e.edition?.identifier === 'en.pickthall');
  const translitEdition = editions.find(e => e.edition?.identifier === 'en.transliteration');

  if (!arabicEdition) throw new Error(`No Arabic edition in response for surah ${surahNumber}`);

  const result: SurahAyahs = {
    surahNumber,
    ayahs: arabicEdition.ayahs.map((a, idx) => ({
      ayahNumber: a.numberInSurah,
      globalNumber: a.number,
      arabicText: a.text,
      transliteration: translitEdition?.ayahs[idx]?.text ?? '',
      englishMeaning: englishEdition?.ayahs[idx]?.text ?? '',
      juz: a.juz,
      page: a.page,
    })),
  };

  await cacheSet(cacheKey, result);
  return result;
}

// ─── Fetch single ayah ────────────────────────────────────────────────────────

export async function fetchAyah(
  surahNumber: number,
  ayahNumber: number,
): Promise<SurahAyahs['ayahs'][0] | null> {
  const surah = await fetchSurahAyahs(surahNumber);
  return surah.ayahs.find(a => a.ayahNumber === ayahNumber) ?? null;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  surahNumber: number;
  ayahNumber: number;
  globalNumber: number;
  text: string;
  edition: 'arabic' | 'english';
}

export async function searchOnline(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.trim().length < 2) return [];

  const cacheKey = `search_${query.trim().toLowerCase().slice(0, 40)}`;
  const cached = await cacheGet<SearchResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}/search/${encodeURIComponent(query.trim())}/all/en.pickthall`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    if (json.code !== 200) return [];

    const results: SearchResult[] = (json.data?.matches ?? []).slice(0, 30).map((m: any) => ({
      surahNumber: m.surah?.number,
      ayahNumber: m.numberInSurah,
      globalNumber: m.number,
      text: m.text,
      edition: 'english' as const,
    }));

    await cacheSet(cacheKey, results);
    return results;
  } catch {
    return [];
  }
}

// ─── Clear cache ──────────────────────────────────────────────────────────────

export async function clearApiCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch {}
}

function isArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}
