import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, type RouteProp} from '@react-navigation/native';
import {Event, useActiveTrack, useProgress, useTrackPlayerEvents} from 'react-native-track-player';
import type {Ayah, PracticeStackParamList, RecitationStyle, RepeatPracticeParams} from '../../types';
import {useTheme} from '../../theme';
import {Radii, Spacing} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {AppButton} from '../../components/common/AppButton';
import {getAyahsBySurahAsync, getSurah, loadSurahs, setCachedAyahs} from '../../data/loaders';
import {tryShowInterstitial, recordCompletionEvent} from '../../ads/interstitialAdService';
import {BannerAdComponent} from '../../ads/BannerAdComponent';
import {usePreferencesStore} from '../../store/usePreferencesStore';
import {useProgressStore} from '../../store/useProgressStore';
import {useLearnerStore} from '../../store/useLearnerStore';
import {playRange, stopAudio} from '../../audio/audioPlayer';

type Route = RouteProp<PracticeStackParamList, 'RepeatPractice'>;

const PLAYER_EVENTS: Event[] = [Event.PlaybackQueueEnded, Event.PlaybackError];

const MODE_META: Record<
  NonNullable<RepeatPracticeParams['mode']>,
  {summary: string; start: string; stop: string}
> = {
  listen_only: {summary: 'Listening practice', start: 'Start Listening', stop: 'Stop Listening'},
  repeat_after: {summary: 'Repeat-after practice', start: 'Start Practice', stop: 'Stop Practice'},
  memorization_review: {summary: 'Memorization review', start: 'Start Review', stop: 'Stop Review'},
};

const BASMALA_WORD_COUNT = 4;

function splitAyahWords(ayah?: Ayah | null): string[] {
  if (!ayah) return [];
  const words = ayah.words?.length
    ? ayah.words.map(word => word.arabicWord)
    : ayah.arabicText.trim().split(/\s+/).filter(Boolean);
  // The API prepends the Basmala to ayah 1 of every surah except Al-Fatihah,
  // but the audio skips it — strip it so word-sync stays accurate.
  if (ayah.ayahNumber === 1 && ayah.surahNumber !== 1 && words.length > BASMALA_WORD_COUNT) {
    return words.slice(BASMALA_WORD_COUNT);
  }
  return words;
}

function parsePracticeTrackId(id?: string): {surahNumber: number; ayahNumber: number; repeatIndex: number} | null {
  if (!id) return null;
  const [surah, ayah, , repeat] = id.split('_');
  const surahNumber = Number(surah);
  const ayahNumber = Number(ayah);
  const repeatIndex = Number(repeat ?? 0);
  if (!Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber)) return null;
  return {surahNumber, ayahNumber, repeatIndex: Number.isFinite(repeatIndex) ? repeatIndex : 0};
}

function estimateAyahDurationSeconds(wordCount: number, style: RecitationStyle): number {
  const secondsPerWord = style === 'muallim' ? 1.15 : 1.35;
  return Math.max(4, wordCount * secondsPerWord);
}

export function RepeatPracticeScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const route = useRoute<Route>();
  const preferences = usePreferencesStore(s => s.preferences);
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const createSession = useProgressStore(s => s.createPracticeSession);
  const activeTrack = useActiveTrack();
  const progress = useProgress(250);

  const surahs = loadSurahs();
  const [selectedSurah, setSelectedSurah] = useState(route.params?.surahNumber ?? 1);
  const [startAyah, setStartAyah] = useState(route.params?.startAyah ?? 1);
  const [endAyah, setEndAyah] = useState(route.params?.endAyah ?? 7);
  const [isRunning, setIsRunning] = useState(false);
  const [completionPending, setCompletionPending] = useState(false);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [ayahsLoading, setAyahsLoading] = useState(true);
  const [ayahLoadError, setAyahLoadError] = useState<string | null>(null);

  const practiceMode = route.params?.mode ?? 'repeat_after';
  const modeMeta = MODE_META[practiceMode];
  const repeatCount = Math.max(1, route.params?.repeatCount ?? preferences.defaultRepeatCount);
  const assignmentTitle = route.params?.assignmentTitle;
  const selectionLocked = Boolean(assignmentTitle);
  const recStyle = preferences.selectedRecitationStyle;

  const currentSurah = getSurah(selectedSurah);
  const maxAyah = currentSurah?.ayahCount ?? 7;
  const activeTrackInfo = parsePracticeTrackId(activeTrack?.id);
  const selectedAyahs = useMemo(
    () => ayahs.filter(a => a.ayahNumber >= startAyah && a.ayahNumber <= endAyah),
    [ayahs, startAyah, endAyah],
  );
  const visibleAyahNumber = isRunning && activeTrackInfo !== null && activeTrackInfo.surahNumber === selectedSurah
    ? activeTrackInfo.ayahNumber
    : startAyah;
  const visibleAyah = selectedAyahs.find(a => a.ayahNumber === visibleAyahNumber)
    ?? ayahs.find(a => a.ayahNumber === visibleAyahNumber)
    ?? selectedAyahs[0];
  const visibleWords = useMemo(() => splitAyahWords(visibleAyah), [visibleAyah]);
  const effectiveDuration = progress.duration > 0
    ? progress.duration
    : estimateAyahDurationSeconds(visibleWords.length, recStyle);
  const activeWordIndex = useMemo(() => {
    if (!isRunning || visibleWords.length === 0) return 0;
    const ratio = Math.min(Math.max(progress.position / effectiveDuration, 0), 0.999);
    return Math.min(visibleWords.length - 1, Math.floor(ratio * visibleWords.length));
  }, [effectiveDuration, isRunning, progress.position, visibleWords.length]);
  const activeRepeatNumber = isRunning ? Math.min((activeTrackInfo?.repeatIndex ?? 0) + 1, repeatCount) : 1;
  const wordProgressPercent = isRunning && visibleWords.length > 0
    ? ((activeWordIndex + 1) / visibleWords.length) * 100
    : 0;

  useEffect(() => {
    const routedSurah = route.params?.surahNumber;
    const routedStart = route.params?.startAyah;
    const routedEnd = route.params?.endAyah;
    if (routedSurah === undefined && routedStart === undefined && routedEnd === undefined) return;

    const nextSurah = routedSurah ?? 1;
    const nextMaxAyah = getSurah(nextSurah)?.ayahCount ?? 7;
    const nextStart = Math.min(Math.max(routedStart ?? 1, 1), nextMaxAyah);
    const nextEnd = Math.min(
      Math.max(routedEnd ?? Math.min(7, nextMaxAyah), nextStart),
      nextMaxAyah,
    );
    stopAudio();
    setCompletionPending(false);
    setIsRunning(false);
    setSelectedSurah(nextSurah);
    setStartAyah(nextStart);
    setEndAyah(nextEnd);
  }, [
    route.params?.endAyah,
    route.params?.launchKey,
    route.params?.mode,
    route.params?.repeatCount,
    route.params?.startAyah,
    route.params?.surahNumber,
  ]);

  useEffect(() => {
    let cancelled = false;
    setAyahsLoading(true);
    setAyahLoadError(null);
    getAyahsBySurahAsync(selectedSurah)
      .then(data => {
        if (cancelled) return;
        setCachedAyahs(selectedSurah, data);
        setAyahs(data);
      })
      .catch(() => {
        if (!cancelled) setAyahLoadError('Could not load ayah text for this practice range.');
      })
      .finally(() => {
        if (!cancelled) setAyahsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedSurah]);

  useEffect(() => () => { stopAudio(); }, []);

  useTrackPlayerEvents(PLAYER_EVENTS, async event => {
    if (event.type === Event.PlaybackError) {
      setCompletionPending(false);
      setIsRunning(false);
      Alert.alert('Playback Error', 'Could not play audio. Check your internet connection or audio settings.');
      return;
    }
    if (!completionPending) return;
    setCompletionPending(false);
    setIsRunning(false);
    if (activeLearner) {
      await createSession(activeLearner.id, practiceMode, selectedSurah, startAyah, endAyah, repeatCount);
    }
    recordCompletionEvent();
    setTimeout(() => tryShowInterstitial(false), 1200);
  });

  function validate(): string | null {
    if (!currentSurah) return 'Please select a valid surah.';
    if (startAyah < 1 || startAyah > maxAyah) return `Start ayah must be between 1 and ${maxAyah}.`;
    if (endAyah < startAyah || endAyah > maxAyah) return `End ayah must be between ${startAyah} and ${maxAyah}.`;
    return null;
  }

  async function startPractice() {
    const error = validate();
    if (error) { Alert.alert('Invalid Settings', error); return; }
    setIsRunning(true);
    setCompletionPending(true);
    try {
      await playRange(selectedSurah, startAyah, endAyah, recStyle, repeatCount);
    } catch {
      setCompletionPending(false);
      setIsRunning(false);
      Alert.alert('Playback Error', 'Could not play audio. Check your internet connection or audio settings.');
    }
  }

  function stopPractice() {
    setCompletionPending(false);
    stopAudio();
    setIsRunning(false);
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={{padding: Spacing[4], paddingBottom: 40}} showsVerticalScrollIndicator={false}>

        {/* Current settings summary */}
        <AppCard style={{marginBottom: Spacing[4], backgroundColor: c.surfaceAlt}}>
          {assignmentTitle ? (
            <AppText variant="body" weight="semibold" style={{marginBottom: 2}}>
              {assignmentTitle}
            </AppText>
          ) : null}
          <AppText variant="caption" style={{color: c.textMuted}}>
            {modeMeta.summary} · {repeatCount}× · {recStyle === 'muallim' ? 'Muallim' : 'Mujawwad'}
          </AppText>
          <AppText variant="caption" style={{color: c.primary, marginTop: 2}}>
            {assignmentTitle ? 'Range and repetitions set by this assignment' : 'Adjust repeat and audio defaults in Settings'}
          </AppText>
        </AppCard>

        {/* Surah selector */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Surah</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection: 'row', gap: Spacing[2]}}>
              {surahs.map(s => (
                <TouchableOpacity
                  key={s.number}
                  disabled={isRunning || selectionLocked}
                  onPress={() => {
                    setSelectedSurah(s.number);
                    setStartAyah(1);
                    setEndAyah(Math.min(7, s.ayahCount));
                  }}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 6,
                    borderRadius: Radii.md,
                    backgroundColor: selectedSurah === s.number ? c.primary : c.surfaceAlt,
                    borderWidth: 1, borderColor: selectedSurah === s.number ? c.primary : c.border,
                    opacity: isRunning || selectionLocked ? 0.55 : 1,
                  }}
                  accessibilityLabel={`Select ${s.transliteration}`}
                >
                  <Text style={{color: selectedSurah === s.number ? '#fff' : c.textSecondary, fontSize: 12}}>
                    {s.number}. {s.transliteration}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </AppCard>

        {/* Ayah range */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[3]}}>Ayah Range</AppText>
          <View style={{flexDirection: 'row', gap: Spacing[4]}}>
            <View style={{flex: 1}}>
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: 4}}>Start ayah</AppText>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
                <TouchableOpacity disabled={isRunning || selectionLocked} onPress={() => setStartAyah(v => Math.max(1, v - 1))} accessibilityLabel="Decrease start ayah">
                  <Text style={{color: c.primary, fontSize: 24, opacity: isRunning || selectionLocked ? 0.45 : 1}}>-</Text>
                </TouchableOpacity>
                <AppText variant="heading" weight="bold">{startAyah}</AppText>
                <TouchableOpacity disabled={isRunning || selectionLocked} onPress={() => setStartAyah(v => Math.min(endAyah, v + 1))} accessibilityLabel="Increase start ayah">
                  <Text style={{color: c.primary, fontSize: 24, opacity: isRunning || selectionLocked ? 0.45 : 1}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{flex: 1}}>
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: 4}}>End ayah</AppText>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
                <TouchableOpacity disabled={isRunning || selectionLocked} onPress={() => setEndAyah(v => Math.max(startAyah, v - 1))} accessibilityLabel="Decrease end ayah">
                  <Text style={{color: c.primary, fontSize: 24, opacity: isRunning || selectionLocked ? 0.45 : 1}}>-</Text>
                </TouchableOpacity>
                <AppText variant="heading" weight="bold">{endAyah}</AppText>
                <TouchableOpacity disabled={isRunning || selectionLocked} onPress={() => setEndAyah(v => Math.min(maxAyah, v + 1))} accessibilityLabel="Increase end ayah">
                  <Text style={{color: c.primary, fontSize: 24, opacity: isRunning || selectionLocked ? 0.45 : 1}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <AppText variant="caption" style={{color: c.textMuted, marginTop: Spacing[2]}}>
            {endAyah - startAyah + 1} ayah{endAyah - startAyah + 1 > 1 ? 's' : ''} selected · Max: {maxAyah}
          </AppText>
        </AppCard>

        {/* Word follow-along */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[2]}}>
            <AppText variant="body" weight="semibold" style={{flex: 1}}>Word-by-word Follow Along</AppText>
            {isRunning ? (
              <View style={{backgroundColor: c.primary + '18', borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4}}>
                <Text style={{color: c.primary, fontSize: 12, fontWeight: '700'}}>Live</Text>
              </View>
            ) : null}
          </View>

          {ayahsLoading ? (
            <View style={{alignItems: 'center', paddingVertical: Spacing[4]}}>
              <ActivityIndicator color={c.primary} />
              <AppText variant="caption" style={{color: c.textMuted, marginTop: Spacing[2]}}>Loading ayah text...</AppText>
            </View>
          ) : ayahLoadError ? (
            <AppText variant="caption" style={{color: c.error}}>{ayahLoadError}</AppText>
          ) : visibleAyah ? (
            <>
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>
                Ayah {visibleAyah.ayahNumber} · Repeat {activeRepeatNumber} of {repeatCount}
              </AppText>
              <Text
                style={{
                  color: c.primary,
                  fontSize: preferences.arabicFontSize + 14,
                  lineHeight: (preferences.arabicFontSize + 14) * 1.6,
                  fontWeight: '700',
                  textAlign: 'center',
                  writingDirection: 'rtl',
                  marginBottom: Spacing[1],
                }}
                accessibilityLabel={`Current word: ${visibleWords[activeWordIndex] ?? ''}`}
              >
                {visibleWords[activeWordIndex] ?? ''}
              </Text>
              <AppText variant="caption" center style={{color: c.textMuted, marginBottom: Spacing[3]}}>
                Word {visibleWords.length ? activeWordIndex + 1 : 0} of {visibleWords.length}
              </AppText>

              <View style={{height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt, overflow: 'hidden', marginBottom: Spacing[3]}}>
                <View style={{height: 6, width: `${wordProgressPercent}%`, backgroundColor: c.primary}} />
              </View>

              <View style={{flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'center', marginBottom: Spacing[3]}}>
                {visibleWords.map((word, idx) => {
                  const active = idx === activeWordIndex;
                  const completed = isRunning && idx < activeWordIndex;
                  return (
                    <View
                      key={`${idx}-${word}`}
                      style={{
                        margin: 3,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        borderRadius: Radii.md,
                        backgroundColor: active ? c.primary + '20' : completed ? c.memorized + '18' : c.surfaceAlt,
                        borderWidth: active ? 1.5 : 1,
                        borderColor: active ? c.primary : completed ? c.memorized : c.border,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? c.primary : completed ? c.memorized : c.textArabic,
                          fontSize: preferences.arabicFontSize * 0.75,
                          fontWeight: active ? '700' : '400',
                          writingDirection: 'rtl',
                          textAlign: 'right',
                        }}
                      >
                        {word}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Transliteration */}
              {visibleAyah.transliteration ? (
                <View style={{marginBottom: Spacing[2], paddingTop: Spacing[2], borderTopWidth: 1, borderColor: c.border}}>
                  <AppText variant="caption" style={{color: c.textMuted, marginBottom: 2}}>How to read:</AppText>
                  <Text style={{color: c.textSecondary, fontSize: preferences.englishMeaningFontSize, lineHeight: preferences.englishMeaningFontSize * 1.6, fontStyle: 'italic'}}>
                    {visibleAyah.transliteration}
                  </Text>
                </View>
              ) : null}

              {/* English meaning */}
              {visibleAyah.englishMeaning ? (
                <AppText variant="caption" english style={{color: c.textEnglish, lineHeight: 20, fontStyle: 'italic'}}>
                  {visibleAyah.englishMeaning}
                </AppText>
              ) : null}
            </>
          ) : (
            <AppText variant="caption" style={{color: c.textMuted}}>Select a valid ayah range.</AppText>
          )}
        </AppCard>

        {/* Start / Stop */}
        {isRunning ? (
          <AppButton label={modeMeta.stop} onPress={stopPractice} variant="danger" size="lg" fullWidth />
        ) : (
          <AppButton label={modeMeta.start} onPress={startPractice} size="lg" fullWidth disabled={ayahsLoading} />
        )}

      </ScrollView>
      <BannerAdComponent />
    </SafeAreaView>
  );
}
