import type {Surah, Ayah} from '../types';
import {fetchSurahAyahs, getAudioUrl} from './api';

const surahsData: Surah[] = require('../../assets/data/surahs.json');

// Cumulative ayah offsets — surah N starts at offset[N-1]
const SURAH_AYAH_OFFSETS: number[] = (() => {
  const offsets = [0];
  let total = 0;
  for (const s of surahsData) {
    total += s.ayahCount;
    offsets.push(total);
  }
  return offsets;
})();

export function computeGlobalAyahNumber(surahNumber: number, ayahNumber: number): number {
  return (SURAH_AYAH_OFFSETS[surahNumber - 1] ?? 0) + ayahNumber;
}

// ─── Surah list (local, always available) ─────────────────────────────────────

export function loadSurahs(): Surah[] {
  return surahsData;
}

export function getSurah(surahNumber: number): Surah | null {
  return surahsData.find(s => s.number === surahNumber) ?? null;
}

// ─── Ayahs (API with cache) ───────────────────────────────────────────────────

export async function getAyahsBySurahAsync(surahNumber: number): Promise<Ayah[]> {
  const surah = getSurah(surahNumber);
  if (!surah) return [];

  const data = await fetchSurahAyahs(surahNumber);
  return data.ayahs.map(a => ({
    id: `${surahNumber}_${a.ayahNumber}`,
    surahNumber,
    ayahNumber: a.ayahNumber,
    globalAyahNumber: a.globalNumber,
    arabicText: a.arabicText,
    englishMeaning: a.englishMeaning,
    juz: a.juz,
    page: a.page,
  }));
}

export async function getAyahAsync(surahNumber: number, ayahNumber: number): Promise<Ayah | null> {
  const ayahs = await getAyahsBySurahAsync(surahNumber);
  return ayahs.find(a => a.ayahNumber === ayahNumber) ?? null;
}

// Sync wrappers reading from in-memory cache (populated by async calls above)
// Used by components that need synchronous access after a surah is already loaded
let _ayahCache: Map<string, Ayah[]> = new Map();

export function setCachedAyahs(surahNumber: number, ayahs: Ayah[]): void {
  _ayahCache.set(String(surahNumber), ayahs);
}

export function getCachedAyahs(surahNumber: number): Ayah[] | null {
  return _ayahCache.get(String(surahNumber)) ?? null;
}

export function getAyah(surahNumber: number, ayahNumber: number): Ayah | null {
  const cached = _ayahCache.get(String(surahNumber));
  return cached?.find(a => a.ayahNumber === ayahNumber) ?? null;
}

export function getAyahsBySurah(surahNumber: number): Ayah[] {
  return _ayahCache.get(String(surahNumber)) ?? [];
}

// ─── Audio URL (Islamic Network CDN) ─────────────────────────────────────────

export function resolveAudioUrl(
  surahNumber: number,
  ayahNumber: number,
  style: 'muallim' | 'mujawwad',
): string {
  const globalNumber = computeGlobalAyahNumber(surahNumber, ayahNumber);
  return getAudioUrl(globalNumber, style);
}

// ─── Search (local surah names only — API search in api.ts) ──────────────────

export function searchSurahs(query: string): Surah[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();
  return surahsData.filter(
    s =>
      s.arabicName.includes(query.trim()) ||
      s.transliteration.toLowerCase().includes(q) ||
      s.englishName.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q) ||
      String(s.number) === q,
  );
}

export function searchArabic(query: string): Array<{surahNumber: number; ayahNumber: number; arabicText: string}> {
  if (!query.trim() || query.trim().length < 2) return [];
  const q = query.trim();
  const results: Array<{surahNumber: number; ayahNumber: number; arabicText: string}> = [];
  for (const [surahKey, ayahs] of _ayahCache.entries()) {
    for (const ayah of ayahs) {
      if (ayah.arabicText.includes(q)) {
        results.push({surahNumber: Number(surahKey), ayahNumber: ayah.ayahNumber, arabicText: ayah.arabicText});
      }
    }
  }
  return results.slice(0, 50);
}

export function searchEnglishMeaning(query: string): Array<{surahNumber: number; ayahNumber: number; englishMeaning: string}> {
  if (!query.trim() || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const results: Array<{surahNumber: number; ayahNumber: number; englishMeaning: string}> = [];
  for (const [surahKey, ayahs] of _ayahCache.entries()) {
    for (const ayah of ayahs) {
      if (ayah.englishMeaning?.toLowerCase().includes(q)) {
        results.push({surahNumber: Number(surahKey), ayahNumber: ayah.ayahNumber, englishMeaning: ayah.englishMeaning ?? ''});
      }
    }
  }
  return results.slice(0, 50);
}

// ─── Legacy compat (keep resolveAudioPath for old callers) ───────────────────
// @deprecated — use resolveAudioUrl instead
export function resolveAudioPath(
  surahNumber: number,
  ayahNumber: number,
  style: 'muallim' | 'mujawwad',
): string {
  return resolveAudioUrl(surahNumber, ayahNumber, style);
}

export function validateQuranContent(): {
  valid: boolean;
  surahCount: number;
  ayahCount: number;
  arabicCoverage: number;
  englishCoverage: number;
  errors: string[];
} {
  const surahs = loadSurahs();
  const totalExpected = surahs.reduce((sum, s) => sum + s.ayahCount, 0);
  const cached = _ayahCache.size;
  return {
    valid: surahs.length === 114,
    surahCount: surahs.length,
    ayahCount: totalExpected,
    arabicCoverage: Math.round((cached / 114) * 100),
    englishCoverage: Math.round((cached / 114) * 100),
    errors: surahs.length !== 114 ? [`Expected 114 surahs, found ${surahs.length}`] : [],
  };
}
