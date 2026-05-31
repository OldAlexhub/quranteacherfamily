/**
 * AdMob configuration for Quran Teacher Family
 * Developer: Old Alex Hub
 * App: com.oldalexhub.quranteacherfamily
 *
 * To update IDs: edit this file only.
 * Debug builds use Google test IDs automatically (__DEV__ === true).
 * Release builds use the real production IDs below.
 */

// ─── App ID ──────────────────────────────────────────────────────────────────
// Set in AndroidManifest.xml via com.google.android.gms.ads.APPLICATION_ID
export const ADMOB_APP_ID = 'ca-app-pub-7831002909037560~3940431384';

// ─── Google test IDs (used in debug builds) ───────────────────────────────────
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

// ─── Production IDs ──────────────────────────────────────────────────────────
const PROD_BANNER_ID = 'ca-app-pub-7831002909037560/6305750596';
const PROD_INTERSTITIAL_ID = 'ca-app-pub-7831002909037560/6170019228';

// ─── Active IDs (debug switches automatically) ────────────────────────────────
export const BANNER_AD_UNIT_ID: string = __DEV__ ? TEST_BANNER_ID : PROD_BANNER_ID;
export const INTERSTITIAL_AD_UNIT_ID: string = __DEV__ ? TEST_INTERSTITIAL_ID : PROD_INTERSTITIAL_ID;

// ─── Feature flags ────────────────────────────────────────────────────────────
export const ENABLE_BANNER_ADS = true;
export const ENABLE_INTERSTITIAL_ADS = true;
export const ENABLE_APP_OPEN_ADS = false;   // removed — do not implement
export const ENABLE_REWARDED_ADS = false;
export const ENABLE_NATIVE_ADS = false;

// ─── Safety configuration ─────────────────────────────────────────────────────
export const MAX_AD_CONTENT_RATING = 'G' as const;
export const CHILD_SAFE_ADS = true;
export const USE_TEST_ADS_IN_DEBUG = true;

// ─── Interstitial frequency rules ────────────────────────────────────────────
export const INTERSTITIAL_MIN_INTERVAL_MS = 10 * 60 * 1000;  // 10 minutes
export const INTERSTITIAL_MAX_PER_SESSION = 3;
export const INTERSTITIAL_MIN_SESSION_DURATION_MS = 3 * 60 * 1000;  // 3 min
export const INTERSTITIAL_EVENTS_REQUIRED = 3;  // every 3 completions
