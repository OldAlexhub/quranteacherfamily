import React, {useState, useEffect, useMemo} from 'react';
import {View, FlatList, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {QuranStackParamList, Ayah} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AyahCard} from '../../components/quran/AyahCard';
import {AudioControls} from '../../components/quran/AudioControls';
import {AppText} from '../../components/common/AppText';
import {getSurah, getAyahsBySurahAsync, setCachedAyahs} from '../../data/loaders';
import {useProgressStore} from '../../store/useProgressStore';
import {usePreferencesStore} from '../../store/usePreferencesStore';
import {useBookmarkStore} from '../../store/useBookmarkStore';
import {useLearnerStore} from '../../store/useLearnerStore';
import {Event, useTrackPlayerEvents} from 'react-native-track-player';
import {playAyah, pauseAudio, stopAudio} from '../../audio/audioPlayer';
import {BannerAdComponent} from '../../ads/BannerAdComponent';

type Route = RouteProp<QuranStackParamList, 'QuranReader'>;
type Nav = NativeStackNavigationProp<QuranStackParamList>;

export function QuranReaderScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const {surahNumber, startAyah, endAyah, assignmentTitle, launchKey} = route.params;

  const preferences = usePreferencesStore(s => s.preferences);
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const saveLastRead = useProgressStore(s => s.saveLastRead);
  const getPracticeStatus = useProgressStore(s => s.getPracticeStatus);
  const isBookmarked = useBookmarkStore(s => s.isBookmarked);
  const addBookmark = useBookmarkStore(s => s.addBookmark);
  const removeBookmark = useBookmarkStore(s => s.removeBookmark);
  const bookmarks = useBookmarkStore(s => s.bookmarks);

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEnglish, setShowEnglish] = useState(!preferences.englishMeaningDefaultHidden);
  const [reloadKey, setReloadKey] = useState(0);

  const surah = getSurah(surahNumber);
  const rangeStart = Math.max(1, startAyah ?? 1);
  const rangeEnd = endAyah === undefined
    ? undefined
    : Math.max(rangeStart, Math.min(endAyah, surah?.ayahCount ?? endAyah));
  const visibleAyahs = useMemo(
    () => ayahs.filter(a =>
      (startAyah === undefined || a.ayahNumber >= rangeStart) &&
      (rangeEnd === undefined || a.ayahNumber <= rangeEnd),
    ),
    [ayahs, rangeEnd, rangeStart, startAyah],
  );

  useEffect(() => {
    let cancelled = false;
    setPlayingAyah(null);
    setIsPlaying(false);
    setLoading(true);
    setError(null);
    getAyahsBySurahAsync(surahNumber)
      .then(data => {
        if (cancelled) return;
        setCachedAyahs(surahNumber, data);
        setAyahs(data);
        if (activeLearner) {
          saveLastRead(activeLearner.id, surahNumber, startAyah ?? 1);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this surah. Check your internet connection.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      stopAudio();
    };
  }, [activeLearner, endAyah, launchKey, reloadKey, saveLastRead, startAyah, surahNumber]);

  useEffect(() => {
    navigation.setOptions({
      title: surah?.transliteration ?? `Surah ${surahNumber}`,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowEnglish(v => !v)}
          style={{paddingHorizontal: 10}}
          accessibilityLabel={showEnglish ? 'Hide meaning' : 'Show meaning'}
        >
          <Text style={{color: c.primary, fontSize: 13}}>{showEnglish ? 'Hide meaning' : 'Meaning'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [c, navigation, showEnglish, surah, surahNumber]);

  // Reset playing state automatically when the audio queue finishes
  useTrackPlayerEvents([Event.PlaybackQueueEnded, Event.PlaybackError], () => {
    setIsPlaying(false);
  });

  async function handlePlayAyah(ayahNumber: number) {
    if (playingAyah === ayahNumber && isPlaying) {
      await pauseAudio();
      setIsPlaying(false);
    } else {
      setPlayingAyah(ayahNumber);
      setIsPlaying(true);
      await playAyah(surahNumber, ayahNumber, preferences.selectedRecitationStyle, preferences.defaultRepeatCount);
      if (activeLearner) saveLastRead(activeLearner.id, surahNumber, ayahNumber);
    }
  }

  function handleBookmark(ayahNumber: number) {
    const learnerId = activeLearner?.id;
    const bmExists = isBookmarked(surahNumber, ayahNumber, learnerId);
    if (bmExists) {
      const bm = bookmarks.find(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber && (!learnerId || b.learnerId === learnerId));
      if (bm) removeBookmark(bm.id);
    } else {
      addBookmark(surahNumber, ayahNumber, learnerId);
    }
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['left', 'right']}>
      {/* Surah header */}
      {surah && (
        <View style={{backgroundColor: c.primary, paddingVertical: Spacing[3], alignItems: 'center'}}>
          <Text style={{color: '#fff', fontSize: 22, fontWeight: '500'}}>{surah.arabicName}</Text>
          <AppText variant="caption" style={{color: 'rgba(255,255,255,0.75)'}}>
            {rangeEnd === undefined
              ? `${surah.transliteration} · ${surah.ayahCount} Ayahs · ${surah.revelationType}`
              : `${assignmentTitle ?? 'Reading assignment'} · Ayahs ${rangeStart}–${rangeEnd}`}
          </AppText>
        </View>
      )}

      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={c.primary} />
          <AppText variant="caption" style={{color: c.textMuted, marginTop: Spacing[3]}}>Loading ayahs...</AppText>
        </View>
      ) : error ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[6]}}>
          <Text style={{fontSize: 36, marginBottom: Spacing[3]}}>🌐</Text>
          <AppText variant="heading" center>Could not load surah</AppText>
          <AppText variant="body" center style={{color: c.textMuted, marginTop: Spacing[2]}}>{error}</AppText>
          <TouchableOpacity
            onPress={() => setReloadKey(value => value + 1)}
            style={{marginTop: Spacing[4], backgroundColor: c.primary, borderRadius: Radii.md, paddingHorizontal: 20, paddingVertical: 12}}
            accessibilityLabel="Retry"
          >
            <AppText variant="body" style={{color: '#fff'}}>Retry</AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleAyahs}
          keyExtractor={a => String(a.ayahNumber)}
          contentContainerStyle={{padding: Spacing[4], paddingBottom: 100}}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <AyahCard
              ayah={item}
              forceShowMeaning={showEnglish}
              arabicFontSize={preferences.arabicFontSize}
              englishFontSize={preferences.englishMeaningFontSize}
              practiceStatus={activeLearner ? getPracticeStatus(activeLearner.id, surahNumber, item.ayahNumber) : undefined}
              isBookmarked={isBookmarked(surahNumber, item.ayahNumber, activeLearner?.id)}
              onPlay={() => handlePlayAyah(item.ayahNumber)}
              onBookmark={() => handleBookmark(item.ayahNumber)}
              onWordMode={() => navigation.navigate('WordTeacherMode', {surahNumber, ayahNumber: item.ayahNumber})}
              onPress={() => navigation.navigate('AyahDetail', {surahNumber, ayahNumber: item.ayahNumber})}
            />
          )}
        />
      )}

      <BannerAdComponent />

      {/* Audio controls — never show when loading or error */}
      {!loading && !error && (
        <AudioControls
          isPlaying={isPlaying}
          repeatCount={preferences.defaultRepeatCount}
          onPlay={() => handlePlayAyah(playingAyah ?? rangeStart)}
          onPause={() => { pauseAudio(); setIsPlaying(false); }}
          onStop={() => { stopAudio(); setIsPlaying(false); setPlayingAyah(null); }}
          onNext={() => {
            const lastAyah = rangeEnd ?? surah?.ayahCount;
            if (playingAyah && lastAyah && playingAyah < lastAyah) handlePlayAyah(playingAyah + 1);
          }}
          onPrevious={() => {
            if (playingAyah && playingAyah > rangeStart) handlePlayAyah(playingAyah - 1);
          }}
          reciterLabel={preferences.selectedRecitationStyle === 'muallim' ? 'Muallim — Al-Husary' : 'Mujawwad — Al-Husary'}
        />
      )}
    </SafeAreaView>
  );
}
