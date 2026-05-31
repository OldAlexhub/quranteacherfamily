import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp, RouteProp} from '@react-navigation/native-stack';
import type {HomeStackParamList, AssignmentType} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {AppButton} from '../../components/common/AppButton';
import {useLearnerStore} from '../../store/useLearnerStore';
import {useAssignmentStore} from '../../store/useAssignmentStore';
import {loadSurahs, getSurah} from '../../data/loaders';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'CreateAssignment'>;

const TYPES: {value: AssignmentType; label: string; icon: string}[] = [
  {value: 'read_arabic', label: 'Read Arabic', icon: '📖'},
  {value: 'listen', label: 'Listen', icon: '🔊'},
  {value: 'word_by_word', label: 'Word by Word', icon: 'ا'},
  {value: 'memorization_review', label: 'Memorization Review', icon: '📋'},
  {value: 'free_reading', label: 'Free Reading', icon: '🌙'},
];

export function CreateAssignmentScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const learners = useLearnerStore(s => s.learners);
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const createAssignment = useAssignmentStore(s => s.createAssignment);
  const surahs = loadSurahs();

  const [learnerId, setLearnerId] = useState(route.params?.learnerId ?? activeLearner?.id ?? '');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AssignmentType>('read_arabic');
  const [surahNumber, setSurahNumber] = useState(1);
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(7);
  const [repeatCount, setRepeatCount] = useState(3);
  const [parentNote, setParentNote] = useState('');
  const [dueDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const currentSurah = getSurah(surahNumber);
  const maxAyah = currentSurah?.ayahCount ?? 1;

  function validate(): string | null {
    if (!learnerId) return 'Please select a learner.';
    if (!title.trim()) return 'Please enter a title.';
    if (!currentSurah) return 'Please select a valid surah.';
    if (startAyah < 1 || startAyah > maxAyah) return `Start ayah must be between 1 and ${maxAyah}.`;
    if (endAyah < startAyah || endAyah > maxAyah) return `End ayah must be between ${startAyah} and ${maxAyah}.`;
    if (repeatCount < 1) return 'Repeat count must be at least 1.';
    return null;
  }

  async function handleCreate() {
    const err = validate();
    if (err) { Alert.alert('Validation Error', err); return; }
    setLoading(true);
    await createAssignment({
      learnerId,
      title: title.trim(),
      type,
      surahNumber,
      startAyah,
      endAyah,
      repeatCount,
      dueDate,
      parentNote: parentNote.trim() || undefined,
    });
    setLoading(false);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['bottom']}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{padding: Spacing[4], paddingBottom: 40}} showsVerticalScrollIndicator={false}>

          {/* Learner */}
          <AppCard style={{marginBottom: Spacing[3]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Learner</AppText>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2]}}>
              {learners.map(l => (
                <TouchableOpacity
                  key={l.id}
                  onPress={() => setLearnerId(l.id)}
                  style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.full, backgroundColor: learnerId === l.id ? c.primary : c.surfaceAlt, borderWidth: 1, borderColor: learnerId === l.id ? c.primary : c.border}}
                  accessibilityLabel={l.displayName || 'Learner'}
                >
                  <Text style={{color: learnerId === l.id ? '#fff' : c.textSecondary, fontSize: 13}}>{l.displayName || 'Unnamed'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>

          {/* Title */}
          <AppCard style={{marginBottom: Spacing[3]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Title *</AppText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Learn Surah Al-Fatihah"
              placeholderTextColor={c.textMuted}
              style={{borderWidth: 1, borderColor: c.border, borderRadius: Radii.md, padding: Spacing[3], color: c.textPrimary, fontSize: 15, backgroundColor: c.surfaceAlt}}
              accessibilityLabel="Assignment title"
            />
          </AppCard>

          {/* Type */}
          <AppCard style={{marginBottom: Spacing[3]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Type</AppText>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2]}}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setType(t.value)}
                  style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radii.md, backgroundColor: type === t.value ? c.primary : c.surfaceAlt, borderWidth: 1, borderColor: type === t.value ? c.primary : c.border, gap: 4}}
                  accessibilityLabel={t.label}
                >
                  <Text style={{fontSize: 14}}>{t.icon}</Text>
                  <Text style={{color: type === t.value ? '#fff' : c.textSecondary, fontSize: 12}}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>

          {/* Surah */}
          <AppCard style={{marginBottom: Spacing[3]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Surah</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{flexDirection: 'row', gap: Spacing[2]}}>
                {surahs.map(s => (
                  <TouchableOpacity
                    key={s.number}
                    onPress={() => { setSurahNumber(s.number); setStartAyah(1); setEndAyah(Math.min(7, s.ayahCount)); }}
                    style={{paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radii.md, backgroundColor: surahNumber === s.number ? c.primary : c.surfaceAlt, borderWidth: 1, borderColor: surahNumber === s.number ? c.primary : c.border}}
                    accessibilityLabel={s.transliteration}
                  >
                    <Text style={{color: surahNumber === s.number ? '#fff' : c.textSecondary, fontSize: 12}}>{s.number}. {s.transliteration}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </AppCard>

          {/* Ayah range */}
          <AppCard style={{marginBottom: Spacing[3]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Ayah Range</AppText>
            <View style={{flexDirection: 'row', gap: Spacing[4]}}>
              {[
                {label: 'Start', value: startAyah, min: 1, max: endAyah, set: setStartAyah},
                {label: 'End', value: endAyah, min: startAyah, max: maxAyah, set: setEndAyah},
              ].map(ctrl => (
                <View key={ctrl.label} style={{flex: 1}}>
                  <AppText variant="caption" style={{color: c.textMuted, marginBottom: 4}}>{ctrl.label}</AppText>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[2]}}>
                    <TouchableOpacity onPress={() => ctrl.set(Math.max(ctrl.min, ctrl.value - 1))} accessibilityLabel={`Decrease ${ctrl.label}`}>
                      <Text style={{color: c.primary, fontSize: 22}}>−</Text>
                    </TouchableOpacity>
                    <AppText variant="heading" weight="bold">{ctrl.value}</AppText>
                    <TouchableOpacity onPress={() => ctrl.set(Math.min(ctrl.max, ctrl.value + 1))} accessibilityLabel={`Increase ${ctrl.label}`}>
                      <Text style={{color: c.primary, fontSize: 22}}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            <AppText variant="caption" style={{color: c.textMuted, marginTop: Spacing[1]}}>{endAyah - startAyah + 1} ayahs · Max: {maxAyah}</AppText>
          </AppCard>

          {/* Repeat count */}
          <AppCard style={{marginBottom: Spacing[3]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Repeat Count</AppText>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[3]}}>
              <TouchableOpacity onPress={() => setRepeatCount(v => Math.max(1, v - 1))} accessibilityLabel="Decrease repeat">
                <Text style={{color: c.primary, fontSize: 24}}>−</Text>
              </TouchableOpacity>
              <AppText variant="heading" weight="bold">{repeatCount}</AppText>
              <TouchableOpacity onPress={() => setRepeatCount(v => v + 1)} accessibilityLabel="Increase repeat">
                <Text style={{color: c.primary, fontSize: 24}}>+</Text>
              </TouchableOpacity>
            </View>
          </AppCard>

          {/* Note */}
          <AppCard style={{marginBottom: Spacing[4]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Parent Note (optional)</AppText>
            <TextInput
              value={parentNote}
              onChangeText={setParentNote}
              placeholder="Add instructions or notes for the learner..."
              placeholderTextColor={c.textMuted}
              multiline
              maxLength={500}
              style={{borderWidth: 1, borderColor: c.border, borderRadius: Radii.md, padding: Spacing[3], color: c.textPrimary, fontSize: 15, minHeight: 70, textAlignVertical: 'top', backgroundColor: c.surfaceAlt}}
              accessibilityLabel="Parent note"
            />
          </AppCard>

          <View style={{flexDirection: 'row', gap: Spacing[3]}}>
            <AppButton label="Cancel" onPress={() => navigation.goBack()} variant="ghost" style={{flex: 1}} />
            <AppButton label="Create Assignment" onPress={handleCreate} style={{flex: 2}} loading={loading} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
