/**
 * Interstitial ad service with strict frequency limits.
 *
 * Rules enforced here:
 * - Max 1 interstitial every 10 minutes
 * - Max 3 per session
 * - Min 3 minutes in session before first interstitial
 * - Max 1 per 3 completion events
 * - Never show if audio is playing
 * - All failures are silent
 */

import {InterstitialAd, AdEventType} from 'react-native-google-mobile-ads';
import {
  INTERSTITIAL_AD_UNIT_ID,
  ENABLE_INTERSTITIAL_ADS,
  INTERSTITIAL_MIN_INTERVAL_MS,
  INTERSTITIAL_MAX_PER_SESSION,
  INTERSTITIAL_MIN_SESSION_DURATION_MS,
  INTERSTITIAL_EVENTS_REQUIRED,
} from '../config/adsConfig';

// ─── Session state ────────────────────────────────────────────────────────────

const _session = {
  startedAt: Date.now(),
  shownCount: 0,
  lastShownAt: 0,
  completionEventsSinceLastAd: 0,
};

let _ad: InterstitialAd | null = null;
let _adLoaded = false;
let _adLoading = false;

// ─── Load ad in background ────────────────────────────────────────────────────

export function preloadInterstitial(): void {
  if (!ENABLE_INTERSTITIAL_ADS) return;
  if (_adLoaded || _adLoading) return;

  try {
    _adLoading = true;
    _ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['quran', 'islamic', 'education', 'family'],
    });

    _ad.addAdEventListener(AdEventType.LOADED, () => {
      _adLoaded = true;
      _adLoading = false;
    });

    _ad.addAdEventListener(AdEventType.ERROR, () => {
      _adLoaded = false;
      _adLoading = false;
      _ad = null;
    });

    _ad.addAdEventListener(AdEventType.CLOSED, () => {
      _adLoaded = false;
      _adLoading = false;
      _ad = null;
      // Preload the next one
      setTimeout(preloadInterstitial, 5000);
    });

    _ad.load();
  } catch {
    _adLoaded = false;
    _adLoading = false;
    _ad = null;
  }
}

// ─── Eligibility check ────────────────────────────────────────────────────────

function canShow(audioIsPlaying: boolean): boolean {
  if (!ENABLE_INTERSTITIAL_ADS) return false;
  if (!_adLoaded || !_ad) return false;
  if (audioIsPlaying) return false;

  const now = Date.now();
  const sessionAge = now - _session.startedAt;
  const timeSinceLast = now - _session.lastShownAt;

  if (sessionAge < INTERSTITIAL_MIN_SESSION_DURATION_MS) return false;
  if (_session.shownCount >= INTERSTITIAL_MAX_PER_SESSION) return false;
  if (_session.lastShownAt > 0 && timeSinceLast < INTERSTITIAL_MIN_INTERVAL_MS) return false;
  if (_session.completionEventsSinceLastAd < INTERSTITIAL_EVENTS_REQUIRED) return false;

  return true;
}

// ─── Show at natural stopping points ─────────────────────────────────────────

/**
 * Call this at allowed moments:
 * - After completing a full assignment (before navigating back to dashboard)
 * - After finishing a repeat practice session (completion summary shown)
 * - After exporting a progress report (before returning to report list)
 * - After a non-active review session ends (before Home Dashboard)
 *
 * @param audioIsPlaying - pass current audio state to prevent mid-audio ads
 * @param onClosed - called when ad closes OR immediately if ad is not shown
 */
export function tryShowInterstitial(
  audioIsPlaying: boolean,
  onClosed?: () => void,
): void {
  if (!canShow(audioIsPlaying)) {
    onClosed?.();
    return;
  }

  try {
    const now = Date.now();
    _session.lastShownAt = now;
    _session.shownCount += 1;
    _session.completionEventsSinceLastAd = 0;

    _ad!.addAdEventListener(AdEventType.CLOSED, () => {
      onClosed?.();
    });

    _ad!.show();
  } catch {
    // Ad failed silently — continue flow
    onClosed?.();
  }
}

/**
 * Call this each time a user completes an assignment, practice session, or
 * similar qualifying event — even if an interstitial isn't shown.
 */
export function recordCompletionEvent(): void {
  _session.completionEventsSinceLastAd += 1;
}

export function resetSession(): void {
  _session.startedAt = Date.now();
  _session.shownCount = 0;
  _session.lastShownAt = 0;
  _session.completionEventsSinceLastAd = 0;
}
