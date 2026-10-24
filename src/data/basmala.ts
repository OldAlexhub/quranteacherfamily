export const BASMALA = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
const plain = (text: string) =>
  text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\uFEFF]/g, '')
    .replace(/ٱ/g, 'ا');

/** Separate a source's chapter preface without editing any Quran wording.
 * Al-Fatihah 1:1 is an ayah; At-Tawbah has no preface; 27:30 stays intact.
 */
export function splitOpeningBasmala(
  surah: number,
  ayah: number,
  text: string,
): { text: string; opening?: string; prefixWords: number } {
  if (ayah !== 1 || surah === 1 || surah === 9) return { text, prefixWords: 0 };
  const match = text.match(/^(\s*\S+\s+\S+\s+\S+\s+\S+)(\s+)([\s\S]+)$/);
  if (match && plain(match[1]).trim() === 'بسم الله الرحمن الرحيم')
    return { text: match[3], opening: match[1].trim(), prefixWords: 4 };
  return { text, opening: BASMALA, prefixWords: 0 };
}
