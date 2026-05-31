/**
 * downloadQuranData.js
 *
 * Downloads the full Quran Arabic text and Pickthall English translation
 * from the free Al-Quran Cloud API (alquran.cloud) — no API key required.
 *
 * Usage:
 *   node scripts/downloadQuranData.js
 *   node scripts/downloadQuranData.js --arabic-only
 *   node scripts/downloadQuranData.js --english-only
 *
 * Output files:
 *   assets/data/quran_arabic.json       — all 6,236 Arabic ayahs
 *   assets/data/quran_english_pickthall.json — all 6,236 English ayahs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'data');

const ARABIC_EDITION = 'ar.uthmani';        // Uthmani script (Tanzil-compatible)
const ENGLISH_EDITION = 'en.pickthall';     // Pickthall public domain

const BASE_URL = 'https://api.alquran.cloud/v1';

const args = process.argv.slice(2);
const ARABIC_ONLY = args.includes('--arabic-only');
const ENGLISH_ONLY = args.includes('--english-only');

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    process.stdout.write(`  Fetching: ${url}\n`);
    https.get(url, {
      headers: {'User-Agent': 'QuranTeacherFamily/1.0 (open source educational app)'},
    }, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error for ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Transform API response to local format ───────────────────────────────────

/**
 * Convert AlQuran.cloud full Quran response into the app's JSON format:
 * { "surahNumber": { "ayahNumber": "text" } }
 */
function transformQuranResponse(apiData) {
  const result = {};
  const surahs = apiData?.data?.surahs;
  if (!Array.isArray(surahs)) {
    throw new Error('Unexpected API response structure — surahs array not found');
  }
  for (const surah of surahs) {
    const surahKey = String(surah.number);
    result[surahKey] = {};
    for (const ayah of surah.ayahs) {
      result[surahKey][String(ayah.numberInSurah)] = ayah.text;
    }
  }
  return result;
}

// ─── Validate downloaded data ─────────────────────────────────────────────────

function validateData(data, label) {
  let surahCount = Object.keys(data).length;
  let ayahCount = Object.values(data).reduce((sum, ayahs) => sum + Object.keys(ayahs).length, 0);
  console.log(`  ${label}: ${surahCount} surahs, ${ayahCount} ayahs`);
  if (surahCount !== 114) {
    console.warn(`  WARNING: Expected 114 surahs, got ${surahCount}`);
  }
  if (ayahCount !== 6236) {
    console.warn(`  WARNING: Expected 6,236 ayahs, got ${ayahCount}`);
  } else {
    console.log(`  ✓ All 6,236 ayahs present`);
  }
  return {surahCount, ayahCount};
}

// ─── Download Arabic text ─────────────────────────────────────────────────────

async function downloadArabic() {
  console.log('\n[1/2] Downloading Arabic Quran text (Uthmani script)...');
  console.log('  Source: Al-Quran Cloud API — api.alquran.cloud');
  console.log('  Edition: ar.uthmani (Uthmani script, compatible with Tanzil)\n');

  const url = `${BASE_URL}/quran/${ARABIC_EDITION}`;
  const response = await fetchJSON(url);

  if (response.code !== 200) {
    throw new Error(`API returned code ${response.code}: ${response.status}`);
  }

  const data = transformQuranResponse(response);
  const stats = validateData(data, 'Arabic');

  const outPath = path.join(ASSETS_DIR, 'quran_arabic.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, null), 'utf8');

  const sizeKB = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`  ✓ Saved: ${outPath} (${sizeKB} KB)`);
  return stats;
}

// ─── Download English translation ─────────────────────────────────────────────

async function downloadEnglish() {
  console.log('\n[2/2] Downloading English meaning (Pickthall translation)...');
  console.log('  Source: Al-Quran Cloud API — api.alquran.cloud');
  console.log('  Edition: en.pickthall (public domain, Marmaduke Pickthall 1930)\n');

  const url = `${BASE_URL}/quran/${ENGLISH_EDITION}`;
  const response = await fetchJSON(url);

  if (response.code !== 200) {
    throw new Error(`API returned code ${response.code}: ${response.status}`);
  }

  const data = transformQuranResponse(response);
  const stats = validateData(data, 'English');

  const outPath = path.join(ASSETS_DIR, 'quran_english_pickthall.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, null), 'utf8');

  const sizeKB = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`  ✓ Saved: ${outPath} (${sizeKB} KB)`);
  return stats;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('============================================================');
  console.log('  Quran Teacher Family — Data Downloader');
  console.log('  Source: Al-Quran Cloud (api.alquran.cloud) — Free, no key');
  console.log('============================================================');

  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, {recursive: true});
  }

  let arabicStats = null;
  let englishStats = null;

  try {
    if (!ENGLISH_ONLY) {
      arabicStats = await downloadArabic();
    } else {
      console.log('\n[1/2] Skipping Arabic (--english-only)');
    }

    if (!ARABIC_ONLY) {
      // Small delay to be respectful to the free API
      if (!ENGLISH_ONLY) {
        process.stdout.write('\n  Waiting 1 second before next request...\n');
        await sleep(1000);
      }
      englishStats = await downloadEnglish();
    } else {
      console.log('\n[2/2] Skipping English (--arabic-only)');
    }

  } catch (err) {
    console.error(`\n  ERROR: ${err.message}`);
    console.error('\n  Troubleshooting:');
    console.error('  - Check your internet connection');
    console.error('  - Try again in a few minutes (API may be temporarily slow)');
    console.error('  - API docs: https://alquran.cloud/api');
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('  Download complete!');
  if (arabicStats) console.log(`  Arabic: ${arabicStats.surahCount} surahs, ${arabicStats.ayahCount} ayahs`);
  if (englishStats) console.log(`  English: ${englishStats.surahCount} surahs, ${englishStats.ayahCount} ayahs`);
  console.log('');
  console.log('  Attribution:');
  console.log('  - Arabic text: Al-Quran Cloud API (Uthmani script)');
  console.log('    Derived from Tanzil project (tanzil.net)');
  console.log('  - English: Pickthall translation (public domain, 1930)');
  console.log('    Retrieved via Al-Quran Cloud API');
  console.log('');
  console.log('  Audio source (used automatically by the app):');
  console.log('  - Muallim style : cdn.islamic.network (Husary murattal)');
  console.log('  - Mujawwad style: cdn.islamic.network (Husary mujawwad)');
  console.log('  - License: Free for educational use');
  console.log('============================================================\n');
}

main();
