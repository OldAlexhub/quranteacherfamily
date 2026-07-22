import React, {useEffect, useState} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import MobileAds, {MaxAdContentRating} from 'react-native-google-mobile-ads';
import {ThemeContext, buildTheme} from './src/theme';
import {RootNavigator} from './src/navigation/RootNavigator';
import {LoadingScreen} from './src/components/common/LoadingScreen';
import {usePreferencesStore} from './src/store/usePreferencesStore';
import {useLearnerStore} from './src/store/useLearnerStore';
import {useProgressStore} from './src/store/useProgressStore';
import {useAssignmentStore} from './src/store/useAssignmentStore';
import {useBookmarkStore} from './src/store/useBookmarkStore';
import {useGamificationStore} from './src/store/useGamificationStore';
import {useSessionStore} from './src/store/useSessionStore';
import {initializePlayer} from './src/audio/audioPlayer';
import {preloadInterstitial} from './src/ads/interstitialAdService';
import {CHILD_SAFE_ADS, ENABLE_BANNER_ADS} from './src/config/adsConfig';

function AppContent() {
  const [ready, setReady] = useState(false);
  const preferences = usePreferencesStore(s => s.preferences);
  const prefsLoaded = usePreferencesStore(s => s.loaded);
  const loadPreferences = usePreferencesStore(s => s.loadPreferences);
  const loadLearners = useLearnerStore(s => s.loadLearners);
  const loadProgress = useProgressStore(s => s.loadProgress);
  const loadAssignments = useAssignmentStore(s => s.loadAssignments);
  const loadBookmarks = useBookmarkStore(s => s.loadBookmarks);
  const loadGamification = useGamificationStore(s => s.loadGamification);
  const loadSessionHistory = useSessionStore(s => s.loadSessionHistory);

  useEffect(() => {
    let cancelled = false;
    let preloadTimer: ReturnType<typeof setTimeout> | undefined;

    async function init() {
      try {
        // Initialize AdMob first — safe to fail silently
        await MobileAds().initialize().catch(() => {});

        if (CHILD_SAFE_ADS) {
          await MobileAds()
            .setRequestConfiguration({
              maxAdContentRating: MaxAdContentRating.G,
              tagForChildDirectedTreatment: true,
              tagForUnderAgeOfConsent: true,
            })
            .catch(() => {});
        }

        await Promise.all([
          loadPreferences(),
          loadLearners(),
          loadProgress(),
          loadAssignments(),
          loadBookmarks(),
          loadGamification(),
          loadSessionHistory(),
        ]);

        initializePlayer().catch(() => {});

        // Preload interstitial in background after app settles
        if (ENABLE_BANNER_ADS && !cancelled) {
          preloadTimer = setTimeout(() => preloadInterstitial(), 8000);
        }
      } catch (e) {
        console.warn('App init error:', e);
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }
    init();

    return () => {
      cancelled = true;
      if (preloadTimer) {
        clearTimeout(preloadTimer);
      }
    };
  }, [
    loadAssignments,
    loadBookmarks,
    loadGamification,
    loadLearners,
    loadPreferences,
    loadProgress,
    loadSessionHistory,
  ]);

  const theme = buildTheme(
    preferences.theme,
    preferences.arabicFontSize,
    preferences.englishMeaningFontSize,
  );

  if (!ready || !prefsLoaded) {
    return (
      <ThemeContext.Provider value={theme}>
        <LoadingScreen message="Quran Teacher Family" />
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar
        barStyle={preferences.theme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <RootNavigator />
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
