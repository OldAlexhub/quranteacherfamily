import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native-stack';
import {Event, useActiveTrack, useProgress, useTrackPlayerEvents} from 'react-native-track-player';
import type {Ayah, PracticeMode, PracticeStackParamList, RecitationStyle} from '../../types';
import {useTheme} from '../../theme';
import {Radii, Spacing} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {AppButton} from '../../components/common/AppButton';
import {getAyahsBySurahAsync, getSurah, loadSurahs, setCachedAyahs} from '../../data/loaders';
import {tryShowInterstitial, recordCompletionEvent} from '../../ads/interstitialAdService';
import {usePreferencesStore} from '../../store/usePreferencesStore';
import {useProgressStore} from '../../store/useProgressStore';
import {useLearnerStore} from '../../store/useLearnerStore';
import {playRange, stopAudio} from '../../audio/audioPlayer';

type Route = RouteProp<PracticeStackParamList, 'RepeatPractice'>;

const PLAYER_EVENTS: Event[] = [Event.PlaybackQueueEnded, Event.PlaybackError];

const MODES: {value: PracticeMode; label: string; desc: string}[] = [
  {value: 'listen_only', label: 'Listen only', desc: 'Play ayahs continuously and listen.'},
  {value: 'repeat_after', label: 'Repeat after', desc: 'Play each ayah, pause, then repeat it.'},
  {value: 'word_by_word', label: 'Word by word', desc: 'Follow each word as the ayah is recited.'},
  {value: 'memorization_review', label: 'Memorization review', desc: 'Review ayahs from memory.'},
];

const RECITATION_OPTIONS: {value: RecitationStyle; label: string}[] = [
  {value: 'muallim', label: 'Muallim'},
  {value: 'mujawwad', label: 'Mujawwad'},
];

function splitAyahWords(ayah?: Ayah | null): string[] {
  if (!ayah) return [];
  if (ayah.words?.length) return ayah.words.map(word => word.arabicWord);
  return ayah.arabicText.trim().split(/\s+/).filter(Boolean);
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
  const [repeatCount, setRepeatCount] = useState(preferences.defaultRepeatCount);
  const [delay, setDelay] = useState(preferences.defaultDelaySeconds);
  const [mode, setMode] = useState<PracticeMode>('listen_only');
  const [isRunning, setIsRunning] = useState(false);
  const [completionPending, setCompletionPending] = useState(false);
  const [recStyle, setRecStyle] = useState<RecitationStyle>(preferences.selectedRecitationStyle);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [ayahsLoading, setAyahsLoading] = useState(true);
  const [ayahLoadError, setAyahLoadError] = useState<string | null>(null);

  const currentSurah = getSurah(selectedSurah);
  const maxAyah = currentSurah?.ayahCount ?? 7;
  const activeTrackInfo = parsePracticeTrackId(activeTrack?.id);
  const selectedAyahs = useMemo(
    () => ayahs.filter(a => a.ayahNumber >= startAyah && a.ayahNumber <= endAyah),
    [ayahs, startAyah, endAyah],
  );
  const visibleAyahNumber = isRunning && activeTrackInfo?.surahNumber === selectedSurah
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
    return () => {
      cancelled = true;
    };
  }, [selectedSurah]);

  useEffect(() => () => {
    stopAudio();
  }, []);

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
      await createSession(activeLearner.id, mode, selectedSurah, startAyah, endAyah, repeatCount);
    }
    recordCompletionEvent();
    setTimeout(() => tryShowInterstitial(false), 1200);
  });

  function validate(): string | null {
    if (!currentSurah) return 'Please select a valid surah.';
    if (startAyah < 1 || startAyah > maxAyah) return `Start ayah must be between 1 and ${maxAyah}.`;
    if (endAyah < startAyah || endAyah > maxAyah) return `End ayah must be between ${startAyah} and ${maxAyah}.`;
    if (repeatCount < 1 || repeatCount > 50) return 'Repeat count must be between 1 and 50.';
    if (delay < 0 || delay > 60) return 'Delay must be between 0 and 60 seconds.';
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
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['bottom']}>
      <ScrollView contentContainerStyle={{padding: Spacing[4], paddingBottom: 40}} showsVerticalScrollIndicator={false}>

        {/* Surah selector */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Surah</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection: 'row', gap: Spacing[2]}}>
              {surahs.map(s => (
                <TouchableOpacity
                  key={s.number}
                  disabled={isRunning}
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
                    opacity: isRunning ? 0.55 : 1,
                  }}
                  accessibilityLabel={`Select ${s.transliteration}`}
                >
                  <Text style={{color: selectedSurah === s.number ? '#fff' : c.textSecondary, fontSize: 12}}>{s.number}. {s.transliteration}</Text>
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
                <TouchableOpacity disabled={isRunning} onPress={() => setStartAyah(v => Math.max(1, v - 1))} accessibilityLabel="Decrease start ayah">
                  <Text style={{color: c.primary, fontSize: 24, opacity: isRunning ? 0.45 : 1}}>-</Text>
                </TouchableOpacity>
                <AppText variant="heading" weight="bold">{startAyah}</AppText>
                <TouchableOpacity disabled={isRunning} onPress={() => setStartAyah(v => Math.min(endAyah, v + 1))} accessibilityLabel="Increase start ayah">
                  <Text style={{color: c.primary, fontSize: 24, opacity: isRunning ? 0.45 : 1}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{flex: 1}}>
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: 4}}>End ayah</AppText>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
                <TouchableOpacity disabled={isRunning} onPress={() => setEndAyah(v => Math.max(startAyah, v - 1))} accessibilityLabel="Decrease end ayah">
                  <Text style={{color: c.primary, fontSize: 24, opacity: isRunning ? 0.45 : 1}}>-</Text>
                </TouchableOpacity>
                <AppText variant="heading" weight="bold">{endAyah}</AppText>
                <TouchableOpacity disabled={isRunning} onPress={() => setEndAyah(v => Math.min(maxAyah, v + 1))} accessibilityLabel="Increase end ayah">
                  <Text style={{color: c.primary, fontSize: 24, opacity: isRunning ? 0.45 : 1}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <AppText variant="caption" style={{color: c.textMuted, marginTop: Spacing[2]}}>
            {endAyah - startAyah + 1} ayah{endAyah - startAyah + 1 > 1 ? 's' : ''} selected - Max: {maxAyah}
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
                Ayah {visibleAyah.ayahNumber} - Repeat {activeRepeatNumber} of {repeatCount}
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

        {/* Repeat + Delay */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <View style={{flexDirection: 'row', gap: Spacing[4], marginBottom: Spacing[3]}}>
            <View style={{flex: 1}}>
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: 4}}>Repeat count</AppText>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
                <TouchableOpacity disabled={isRunning} onPress={() => setRepeatCount(v => Math.max(1, v - 1))} accessibilityLabel="Decrease repeat count">
                  <Text style={{color: c.primary, fontSize: 22, opacity: isRunning ? 0.45 : 1}}>-</Text>
                </TouchableOpacity>
                <AppText variant="heading" weight="bold">{repeatCount}</AppText>
                <TouchableOpacity disabled={isRunning} onPress={() => setRepeatCount(v => Math.min(50, v + 1))} accessibilityLabel="Increase repeat count">
                  <Text style={{color: c.primary, fontSize: 22, opacity: isRunning ? 0.45 : 1}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{flex: 1}}>
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: 4}}>Delay (sec)</AppText>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
                <TouchableOpacity disabled={isRunning} onPress={() => setDelay(v => Math.max(0, v - 1))} accessibilityLabel="Decrease delay">
                  <Text style={{color: c.primary, fontSize: 22, opacity: isRunning ? 0.45 : 1}}>-</Text>
                </TouchableOpacity>
                <AppText variant="heading" weight="bold">{delay}</AppText>
                <TouchableOpacity disabled={isRunning} onPress={() => setDelay(v => Math.min(60, v + 1))} accessibilityLabel="Increase delay">
                  <Text style={{color: c.primary, fontSize: 22, opacity: isRunning ? 0.45 : 1}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>Recitation style</AppText>
          <View style={{flexDirection: 'row', gap: Spacing[2]}}>
            {RECITATION_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                disabled={isRunning}
                onPress={() => setRecStyle(opt.value)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: Radii.md,
                  backgroundColor: recStyle === opt.value ? c.primary : c.surfaceAlt,
                  borderWidth: 1,
                  borderColor: recStyle === opt.value ? c.primary : c.border,
                  alignItems: 'center',
                  opacity: isRunning ? 0.55 : 1,
                }}
                accessibilityLabel={opt.label}
              >
                <Text style={{color: recStyle === opt.value ? '#fff' : c.textSecondary, fontSize: 14}}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AppCard>

        {/* Practice mode */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Practice Mode</AppText>
          {MODES.map(m => (
            <TouchableOpacity
              key={m.value}
              disabled={isRunning}
              onPress={() => setMode(m.value)}
              style={{flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[2], borderBottomWidth: 1, borderColor: c.border, opacity: isRunning ? 0.65 : 1}}
              accessibilityLabel={m.label}
            >
              <View style={{width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: mode === m.value ? c.primary : c.border, backgroundColor: mode === m.value ? c.primary : 'transparent', marginRight: Spacing[3]}} />
              <View style={{flex: 1}}>
                <AppText variant="body" weight={mode === m.value ? 'semibold' : 'regular'}>{m.label}</AppText>
                <AppText variant="caption" style={{color: c.textMuted}}>{m.desc}</AppText>
              </View>
            </TouchableOpacity>
          ))}
        </AppCard>

        {/* Start / Stop */}
        {isRunning ? (
          <AppButton label="Stop Practice" onPress={stopPractice} variant="danger" size="lg" fullWidth />
        ) : (
          <AppButton label="Start Practice" onPress={startPractice} size="lg" fullWidth disabled={ayahsLoading} />
        )}

        <AppCard style={{marginTop: Spacing[4], backgroundColor: c.surfaceAlt}}>
          <AppText variant="caption" style={{color: c.textMuted, fontStyle: 'italic'}}>
            Audio requires the Muallim or Mujawwad asset packs to be installed via Google Play. If audio does not play, check that the asset packs are downloaded.
          </AppText>
        </AppCard>

      </ScrollView>
    </SafeAreaView>
  );
}
