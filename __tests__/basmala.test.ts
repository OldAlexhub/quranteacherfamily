import { BASMALA, splitOpeningBasmala } from '../src/data/basmala';
import { bundledVerse, surahs } from '../src/learning/content';
const source: Record<
  string,
  Record<string, string>
> = require('../assets/data/quran_arabic.json');

test('all 114 surah openings separate the preface without losing any Quran text', () => {
  for (const s of surahs) {
    const raw = source[s.number][1],
      part = splitOpeningBasmala(s.number, 1, raw),
      v = bundledVerse(`${s.number}:1`);
    if (s.number === 1 || s.number === 9) {
      expect(part.opening).toBeUndefined();
      expect(v.arabic).toBe(raw);
    } else {
      expect(part.prefixWords).toBe(4);
      expect(part.opening).toBe(BASMALA);
      expect(`${part.opening} ${part.text}`).toBe(raw);
      expect(v.arabic).toBe(part.text);
      // Idempotent: already-separated provider text must not lose another four words.
      expect(splitOpeningBasmala(s.number, 1, part.text).text).toBe(part.text);
      expect(splitOpeningBasmala(s.number, 1, part.text).prefixWords).toBe(0);
    }
  }
});
test('every non-opening ayah stays verbatim, including the Basmala within 27:30', () => {
  let total = 0;
  for (const s of surahs)
    for (let a = 1; a <= s.ayahCount; a++) {
      total++;
      if (a !== 1)
        expect(splitOpeningBasmala(s.number, a, source[s.number][a]).text).toBe(
          source[s.number][a],
        );
    }
  expect(total).toBe(6236);
  expect(bundledVerse('27:30').arabic).toBe(source[27][30]);
});
