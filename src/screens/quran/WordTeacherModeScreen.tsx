import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native-stack';
import type {QuranStackParamList} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {AppButton} from '../../components/common/AppButton';
import {getAyah, getSurah} from '../../data/loaders';
import {usePreferencesStore} from '../../store/usePreferencesStore';
import {playAyah, stopAudio} from '../../audio/audioPlayer';

type Route = RouteProp<QuranStackParamList, 'WordTeacherMode'>;

export function WordTeacherModeScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const route = useRoute<Route>();
  const {surahNumber, ayahNumber, wordIndex} = route.params;

  const preferences = usePreferencesStore(s => s.preferences);
  const ayah = getAyah(surahNumber, ayahNumber);
  const surah = getSurah(surahNumber);

  const words = ayah?.words?.length
    ? ayah.words.map(word => word.arabicWord)
    : (ayah?.arabicText.trim().split(/\s+/) ?? []);
  const initialWordIndex = Math.min(Math.max(wordIndex ?? 0, 0), Math.max(words.length - 1, 0));
  const [currentWordIdx, setCurrentWordIdx] = useState(initialWordIndex);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [showWordMeaning, setShowWordMeaning] = useState(false);
  const [repeatCount, setRepeatCount] = useState(preferences.defaultRepeatCount);
  const [checklist, setChecklist] = useState<Record<number, 'listened' | 'repeated' | 'needs_help' | 'done'>>({});

  const currentWord = words[currentWordIdx] ?? '';
  const currentWordMeaning = ayah?.words?.[currentWordIdx]?.englishMeaning;
  const isLastWord = currentWordIdx >= words.length - 1;
  const isFirstWord = currentWordIdx === 0;

  function toggleCheck(idx: number, status: 'listened' | 'repeated' | 'needs_help' | 'done') {
    setChecklist(prev => ({...prev, [idx]: prev[idx] === status ? undefined as any : status}));
  }

  async function playCurrentWord() {
    await playAyah(surahNumber, ayahNumber, preferences.selectedRecitationStyle);
  }

  useEffect(() => {
    setCurrentWordIdx(Math.min(Math.max(wordIndex ?? 0, 0), Math.max(words.length - 1, 0)));
  }, [wordIndex, words.length]);

  if (!ayah || !surah) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center'}}>
        <AppText variant="body" style={{color: c.textMuted}}>Ayah not found</AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['bottom']}>
      <ScrollView contentContainerStyle={{padding: Spacing[4], paddingBottom: 40}} showsVerticalScrollIndicator={false}>

        {/* Surah info */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[3]}}>
          <AppText variant="caption" style={{color: c.textMuted}}>{surah.transliteration} · Ayah {ayahNumber}</AppText>
        </View>

        {/* Full ayah with highlighting */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>Full Ayah</AppText>
          <View style={{flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'center'}}>
            {words.map((word, idx) => (
              <TouchableOpacity
                key={`${idx}-${word}`}
                onPress={() => setCurrentWordIdx(idx)}
                style={{margin: 3, padding: 4, borderRadius: 6, backgroundColor: idx === currentWordIdx ? c.primary + '20' : 'transparent', borderWidth: idx === currentWordIdx ? 1.5 : 0, borderColor: c.primary}}
                accessibilityLabel={`Word ${idx + 1}`}
              >
                <Text style={{
                  fontSize: preferences.arabicFontSize * 0.85,
                  color: idx === currentWordIdx ? c.primary : c.textArabic,
                  fontWeight: idx === currentWordIdx ? '700' : '400',
                  writingDirection: 'rtl',
                  textAlign: 'right',
                }}>
                  {word}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AppCard>

        {/* Current word display */}
        <AppCard style={{marginBottom: Spacing[4], alignItems: 'center', paddingVertical: Spacing[6]}}>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>Word {currentWordIdx + 1} of {words.length}</AppText>
          <Text
            style={{fontSize: preferences.arabicFontSize + 16, color: c.primary, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl', marginBottom: Spacing[3]}}
            accessibilityLabel={`Arabic word: ${currentWord}`}
          >
            {currentWord}
          </Text>

          <View style={{flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[3]}}>
            <TouchableOpacity onPress={playCurrentWord} style={{backgroundColor: c.primary, borderRadius: Radii.full, width: 52, height: 52, alignItems: 'center', justifyContent: 'center'}} accessibilityLabel="Play word">
              <Text style={{color: '#fff', fontSize: 24}}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                for (let i = 0; i < repeatCount; i++) {
                  await playCurrentWord();
                  await new Promise(r => setTimeout(r, (preferences.defaultDelaySeconds + 2) * 1000));
                }
              }}
              style={{backgroundColor: c.surfaceAlt, borderRadius: Radii.full, paddingHorizontal: 16, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border}}
              accessibilityLabel={`Repeat word ${repeatCount} times`}
            >
              <Text style={{color: c.textSecondary, fontSize: 16}}>↻ {repeatCount}×</Text>
            </TouchableOpacity>
          </View>

          {showTransliteration && (
            <AppText variant="body" style={{color: c.textMuted, marginBottom: Spacing[2]}}>
              (Transliteration not available offline)
            </AppText>
          )}

          {showWordMeaning && (
            <AppText variant="body" english style={{color: c.textEnglish, textAlign: 'center', fontStyle: 'italic'}}>
              {currentWordMeaning ?? 'Word-level meaning is not available offline for this ayah.'}
            </AppText>
          )}
        </AppCard>

        {/* Options row */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[2]}}>
            <AppText variant="body">Show transliteration</AppText>
            <Switch value={showTransliteration} onValueChange={setShowTransliteration} trackColor={{true: c.primary}} accessibilityLabel="Toggle transliteration" />
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[2]}}>
            <AppText variant="body">Show word meaning</AppText>
            <Switch value={showWordMeaning} onValueChange={setShowWordMeaning} trackColor={{true: c.primary}} accessibilityLabel="Toggle word meaning" />
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <AppText variant="body">Repeat count</AppText>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
              <TouchableOpacity onPress={() => setRepeatCount(v => Math.max(1, v - 1))} accessibilityLabel="Decrease repeat count">
                <Text style={{color: c.primary, fontSize: 22}}>−</Text>
              </TouchableOpacity>
              <AppText variant="body" weight="bold">{repeatCount}</AppText>
              <TouchableOpacity onPress={() => setRepeatCount(v => Math.min(10, v + 1))} accessibilityLabel="Increase repeat count">
                <Text style={{color: c.primary, fontSize: 22}}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </AppCard>

        {/* Child response checklist */}
        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Response for Word {currentWordIdx + 1}</AppText>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2]}}>
            {[
              {key: 'listened', label: '👂 Listened'},
              {key: 'repeated', label: '🗣 Repeated'},
              {key: 'needs_help', label: '❓ Needs help'},
              {key: 'done', label: '✓ Done'},
            ].map(item => (
              <TouchableOpacity
                key={item.key}
                onPress={() => toggleCheck(currentWordIdx, item.key as any)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8,
                  borderRadius: Radii.md,
                  backgroundColor: checklist[currentWordIdx] === item.key ? c.primary : c.surfaceAlt,
                  borderWidth: 1,
                  borderColor: checklist[currentWordIdx] === item.key ? c.primary : c.border,
                }}
                accessibilityLabel={item.label}
              >
                <Text style={{color: checklist[currentWordIdx] === item.key ? '#fff' : c.textSecondary, fontSize: 14}}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AppCard>

        {/* Navigation */}
        <View style={{flexDirection: 'row', gap: Spacing[3]}}>
          <AppButton label="← Previous" onPress={() => !isFirstWord && setCurrentWordIdx(i => i - 1)} disabled={isFirstWord} variant="secondary" style={{flex: 1}} />
          <AppButton label={isLastWord ? 'Done ✓' : 'Next →'} onPress={() => !isLastWord && setCurrentWordIdx(i => i + 1)} disabled={isLastWord} style={{flex: 2}} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
