import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native-stack';
import type {PracticeStackParamList, PracticeMode} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {AppButton} from '../../components/common/AppButton';
import {loadSurahs, getSurah} from '../../data/loaders';
import {tryShowInterstitial, recordCompletionEvent} from '../../ads/interstitialAdService';
import {usePreferencesStore} from '../../store/usePreferencesStore';
import {useProgressStore} from '../../store/useProgressStore';
import {useLearnerStore} from '../../store/useLearnerStore';
import {playRange, stopAudio} from '../../audio/audioPlayer';

type Route = RouteProp<PracticeStackParamList, 'RepeatPractice'>;

const MODES: {value: PracticeMode; label: string; desc: string}[] = [
  {value: 'listen_only', label: 'Listen only', desc: 'Play ayahs continuously and listen.'},
  {value: 'repeat_after', label: 'Repeat after', desc: 'Play each ayah, pause, then repeat it.'},
  {value: 'word_by_word', label: 'Word by word', desc: 'Listen to each word individually.'},
  {value: 'memorization_review', label: 'Memorization review', desc: 'Review ayahs from memory.'},
];

export function RepeatPracticeScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const route = useRoute<Route>();
  const preferences = usePreferencesStore(s => s.preferences);
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const createSession = useProgressStore(s => s.createPracticeSession);

  const surahs = loadSurahs();
  const [selectedSurah, setSelectedSurah] = useState(route.params?.surahNumber ?? 1);
  const [startAyah, setStartAyah] = useState(route.params?.startAyah ?? 1);
  const [endAyah, setEndAyah] = useState(route.params?.endAyah ?? 7);
  const [repeatCount, setRepeatCount] = useState(preferences.defaultRepeatCount);
  const [delay, setDelay] = useState(preferences.defaultDelaySeconds);
  const [mode, setMode] = useState<PracticeMode>('listen_only');
  const [isRunning, setIsRunning] = useState(false);
  const [recStyle, setRecStyle] = useState(preferences.selectedRecitationStyle);

  const currentSurah = getSurah(selectedSurah);
  const maxAyah = currentSurah?.ayahCount ?? 7;

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
    try {
      await playRange(selectedSurah, startAyah, endAyah, recStyle, repeatCount);
      if (activeLearner) {
        await createSession(activeLearner.id, mode, selectedSurah, startAyah, endAyah, repeatCount);
      }
    } catch (e) {
      Alert.alert('Playback Error', 'Could not play audio. Check your internet connection or audio settings.');
    }
    setIsRunning(false);
    // Natural stopping point — record completion and consider interstitial
    recordCompletionEvent();
    setTimeout(() => tryShowInterstitial(false), 1200);
  }

  function stopPractice() {
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
                <TouchableOpacity onPress={() => setStartAyah(v => Math.max(1, v - 1))} accessibilityLabel="Decrease start ayah">
                  <Text style={{color: c.primary, fontSize: 24}}>−</Text>
                </TouchableOpacity>
                <AppText variant="heading" weight="bold">{startAyah}</AppText>
                <TouchableOpacity onPress={() => setStartAyah(v => Math.min(endAyah, v + 1))} accessibilityLabel="Increase start ayah">
                  <Text style={{color: c.primary, fontSize: 24}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{flex: 1}}>
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: 4}}>End ayah</AppText>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
                <TouchableOpacity onPress={() => setEndAyah(v => Math.max(startAyah, v - 1))} accessibilityLabel="Decrease end ayah">
                  <Text style={{color: c.primary, fontSize: 24}}>−</Text>
                </TouchableOpacity>
                <AppText variant="heading" weight="bold">{endAyah}</AppText>
                <TouchableOpacity onPress={() => setEndAyah(v => Math.min(maxAyah, v + 1))} accessibilityLabel="Increase end ayah">
                  <Text style={{color: c.primary, fontSize: 24}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <AppText variant="caption" style={{color: c.textMuted, marginTop: Spacing[2]}}>
            {endAyah - startAyah + 1} ayah{endAyah - startAyah + 1 > 1 ? 's' : ''} selected · Max: {maxAyah}
          </AppText>
        </AppCard>

        {/* Repeat + Delay */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <View style={{flexDirection: 'row', gap: Spacing[4], marginBottom: Spacing[3]}}>
            <View style={{flex: 1}}>
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: 4}}>Repeat count</AppText>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
                <TouchableOpacity onPress={() => setRepeatCount(v => Math.max(1, v - 1))} accessibilityLabel="Decrease repeat count">
                  <Text style={{color: c.primary, fontSize: 22}}>−</Text>
                </TouchableOpacity>
                <AppText variant="heading" weight="bold">{repeatCount}</AppText>
                <TouchableOpacity onPress={() => setRepeatCount(v => Math.min(50, v + 1))} accessibilityLabel="Increase repeat count">
                  <Text style={{color: c.primary, fontSize: 22}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{flex: 1}}>
              <AppText variant="caption" style={{color: c.textMuted, marginBottom: 4}}>Delay (sec)</AppText>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
                <TouchableOpacity onPress={() => setDelay(v => Math.max(0, v - 1))} accessibilityLabel="Decrease delay">
                  <Text style={{color: c.primary, fontSize: 22}}>−</Text>
                </TouchableOpacity>
                <AppText variant="heading" weight="bold">{delay}</AppText>
                <TouchableOpacity onPress={() => setDelay(v => Math.min(60, v + 1))} accessibilityLabel="Increase delay">
                  <Text style={{color: c.primary, fontSize: 22}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Recitation style */}
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>Recitation style</AppText>
          <View style={{flexDirection: 'row', gap: Spacing[2]}}>
            {[
              {value: 'muallim', label: 'Muallim'},
              {value: 'mujawwad', label: 'Mujawwad'},
            ].map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setRecStyle(opt.value as any)}
                style={{flex: 1, paddingVertical: 8, borderRadius: Radii.md, backgroundColor: recStyle === opt.value ? c.primary : c.surfaceAlt, borderWidth: 1, borderColor: recStyle === opt.value ? c.primary : c.border, alignItems: 'center'}}
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
              onPress={() => setMode(m.value)}
              style={{flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[2], borderBottomWidth: 1, borderColor: c.border}}
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
          <AppButton label="⏹ Stop Practice" onPress={stopPractice} variant="danger" size="lg" fullWidth />
        ) : (
          <AppButton label="▶ Start Practice" onPress={startPractice} size="lg" fullWidth />
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
