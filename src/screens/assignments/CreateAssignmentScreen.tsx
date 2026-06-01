import React, {useState, useMemo} from 'react';
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

const TYPES: {value: AssignmentType; label: string; icon: string; verb: string}[] = [
  {value: 'listen',              label: 'Listen',        icon: '🔊', verb: 'Listen to'},
  {value: 'read_arabic',        label: 'Read Arabic',   icon: '📖', verb: 'Read'},
  {value: 'word_by_word',       label: 'Word by Word',  icon: 'ا',  verb: 'Practice'},
  {value: 'memorization_review',label: 'Memorization',  icon: '⭐', verb: 'Review'},
  {value: 'free_reading',       label: 'Free Reading',  icon: '🌙', verb: 'Free reading in'},
];

const DUE_OPTIONS = [
  {label: 'Today',     offset: 0},
  {label: 'Tomorrow',  offset: 1},
  {label: 'In 3 days', offset: 3},
  {label: 'In a week', offset: 7},
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
  const [type, setType] = useState<AssignmentType>('listen');
  const [surahNumber, setSurahNumber] = useState(1);
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(7);
  const [repeatCount, setRepeatCount] = useState(3);
  const [parentNote, setParentNote] = useState('');
  const [dueOffset, setDueOffset] = useState(0);
  const [surahQuery, setSurahQuery] = useState('');
  const [titleOverride, setTitleOverride] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentSurah = getSurah(surahNumber);
  const maxAyah = currentSurah?.ayahCount ?? 1;
  const selectedType = TYPES.find(t => t.value === type) ?? TYPES[0];

  const dueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dueOffset);
    return d.toISOString().slice(0, 10);
  }, [dueOffset]);

  const autoTitle = useMemo(() => {
    const name = currentSurah?.transliteration ?? `Surah ${surahNumber}`;
    const range = startAyah === endAyah ? `Ayah ${startAyah}` : `Ayahs ${startAyah}–${endAyah}`;
    return `${selectedType.verb} ${name} ${range}`;
  }, [selectedType, currentSurah, surahNumber, startAyah, endAyah]);

  const title = editingTitle ? titleOverride : autoTitle;

  const filteredSurahs = useMemo(() => {
    const q = surahQuery.trim().toLowerCase();
    if (!q) return [];
    return surahs.filter(s =>
      String(s.number) === q ||
      s.transliteration.toLowerCase().includes(q) ||
      s.englishName.toLowerCase().includes(q) ||
      s.arabicName.includes(surahQuery.trim()),
    ).slice(0, 8);
  }, [surahs, surahQuery]);

  function validate(): string | null {
    if (!learnerId) return 'Please select a learner.';
    if (!currentSurah) return 'Please select a valid surah.';
    if (startAyah < 1 || startAyah > maxAyah) return `Start ayah must be between 1 and ${maxAyah}.`;
    if (endAyah < startAyah || endAyah > maxAyah) return `End ayah must be between ${startAyah} and ${maxAyah}.`;
    return null;
  }

  async function handleCreate() {
    const err = validate();
    if (err) { Alert.alert('Check inputs', err); return; }
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
        <ScrollView
          contentContainerStyle={{padding: Spacing[4], paddingBottom: 40}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Learner — only show picker when there are multiple */}
          {learners.length > 1 && (
            <AppCard style={{marginBottom: Spacing[3]}}>
              <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>For learner</AppText>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2]}}>
                {learners.map(l => (
                  <TouchableOpacity
                    key={l.id}
                    onPress={() => setLearnerId(l.id)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingHorizontal: 14, paddingVertical: 8,
                      borderRadius: Radii.full,
                      backgroundColor: learnerId === l.id ? c.primary : c.surfaceAlt,
                      borderWidth: 1.5, borderColor: learnerId === l.id ? c.primary : c.border,
                    }}
                    accessibilityLabel={l.displayName || 'Learner'}
                  >
                    <View style={{width: 20, height: 20, borderRadius: 10, backgroundColor: l.avatarColor, alignItems: 'center', justifyContent: 'center'}}>
                      <Text style={{fontSize: 10, color: '#fff'}}>👦</Text>
                    </View>
                    <Text style={{color: learnerId === l.id ? '#fff' : c.textSecondary, fontSize: 14, fontWeight: learnerId === l.id ? '600' : '400'}}>
                      {l.displayName || 'Unnamed'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AppCard>
          )}

          {/* Activity type */}
          <AppCard style={{marginBottom: Spacing[3]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Activity</AppText>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2]}}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setType(t.value)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 12, paddingVertical: 9,
                    borderRadius: Radii.md,
                    backgroundColor: type === t.value ? c.primary : c.surfaceAlt,
                    borderWidth: 1.5, borderColor: type === t.value ? c.primary : c.border,
                  }}
                  accessibilityLabel={t.label}
                >
                  <Text style={{fontSize: 16}}>{t.icon}</Text>
                  <Text style={{color: type === t.value ? '#fff' : c.textSecondary, fontSize: 13, fontWeight: type === t.value ? '600' : '400'}}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>

          {/* Surah picker */}
          <AppCard style={{marginBottom: Spacing[3]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Surah</AppText>

            {/* Selected display */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              padding: Spacing[3],
              backgroundColor: c.primary + '12',
              borderRadius: Radii.md,
              borderWidth: 1, borderColor: c.primary + '40',
              marginBottom: Spacing[2],
            }}>
              <View style={{width: 34, height: 34, borderRadius: 17, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing[2]}}>
                <Text style={{color: '#fff', fontSize: 12, fontWeight: '700'}}>{currentSurah?.number}</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={{color: c.primary, fontSize: 15, fontWeight: '600'}}>{currentSurah?.transliteration}</Text>
                <Text style={{color: c.textMuted, fontSize: 12}}>{currentSurah?.englishName} · {currentSurah?.ayahCount} ayahs</Text>
              </View>
              <Text style={{fontSize: 22, color: c.textArabic}}>{currentSurah?.arabicName}</Text>
            </View>

            {/* Search */}
            <TextInput
              value={surahQuery}
              onChangeText={setSurahQuery}
              placeholder="Search by name or number..."
              placeholderTextColor={c.textMuted}
              style={{
                borderWidth: 1, borderColor: surahQuery ? c.primary : c.border,
                borderRadius: Radii.md, padding: Spacing[2], paddingHorizontal: Spacing[3],
                color: c.textPrimary, fontSize: 14, backgroundColor: c.surfaceAlt,
              }}
              accessibilityLabel="Search surah"
            />

            {/* Results */}
            {filteredSurahs.length > 0 && (
              <ScrollView style={{maxHeight: 200, marginTop: 4}} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {filteredSurahs.map((s, idx) => (
                  <TouchableOpacity
                    key={s.number}
                    onPress={() => {
                      setSurahNumber(s.number);
                      setStartAyah(1);
                      setEndAyah(Math.min(7, s.ayahCount));
                      setSurahQuery('');
                    }}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingVertical: Spacing[2], paddingHorizontal: Spacing[1],
                      borderTopWidth: idx > 0 ? 1 : 0, borderColor: c.border,
                      backgroundColor: s.number === surahNumber ? c.primary + '10' : 'transparent',
                    }}
                  >
                    <Text style={{color: c.textMuted, fontSize: 12, width: 26}}>{s.number}.</Text>
                    <View style={{flex: 1}}>
                      <Text style={{color: s.number === surahNumber ? c.primary : c.textPrimary, fontSize: 14, fontWeight: s.number === surahNumber ? '600' : '400'}}>
                        {s.transliteration}
                      </Text>
                      <Text style={{color: c.textMuted, fontSize: 11}}>{s.englishName} · {s.ayahCount} ayahs</Text>
                    </View>
                    <Text style={{color: c.textArabic, fontSize: 20}}>{s.arabicName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {surahQuery.trim().length > 0 && filteredSurahs.length === 0 && (
              <AppText variant="caption" style={{color: c.textMuted, marginTop: 4}}>No surahs found</AppText>
            )}
          </AppCard>

          {/* Ayah range */}
          <AppCard style={{marginBottom: Spacing[3]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[3]}}>Ayah Range</AppText>
            <View style={{flexDirection: 'row', gap: Spacing[4]}}>
              {[
                {label: 'Start', value: startAyah, min: 1, max: endAyah, set: setStartAyah},
                {label: 'End',   value: endAyah,   min: startAyah, max: maxAyah, set: setEndAyah},
              ].map(ctrl => (
                <View key={ctrl.label} style={{flex: 1, alignItems: 'center'}}>
                  <AppText variant="caption" style={{color: c.textMuted, marginBottom: 6}}>{ctrl.label}</AppText>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[2]}}>
                    <TouchableOpacity
                      onPress={() => ctrl.set(Math.max(ctrl.min, ctrl.value - 1))}
                      style={{width: 34, height: 34, borderRadius: 17, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center'}}
                      accessibilityLabel={`Decrease ${ctrl.label}`}
                    >
                      <Text style={{color: c.primary, fontSize: 20, lineHeight: 24}}>−</Text>
                    </TouchableOpacity>
                    <AppText variant="heading" weight="bold" style={{minWidth: 30, textAlign: 'center'}}>{ctrl.value}</AppText>
                    <TouchableOpacity
                      onPress={() => ctrl.set(Math.min(ctrl.max, ctrl.value + 1))}
                      style={{width: 34, height: 34, borderRadius: 17, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center'}}
                      accessibilityLabel={`Increase ${ctrl.label}`}
                    >
                      <Text style={{color: c.primary, fontSize: 20, lineHeight: 24}}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            <AppText variant="caption" style={{color: c.textMuted, marginTop: Spacing[2], textAlign: 'center'}}>
              {endAyah - startAyah + 1} ayah{endAyah - startAyah + 1 !== 1 ? 's' : ''} · surah has {maxAyah} total
            </AppText>
          </AppCard>

          {/* Repeat + Due date */}
          <AppCard style={{marginBottom: Spacing[3]}}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[3]}}>
              <AppText variant="body" weight="semibold" style={{flex: 1}}>Repeat each ayah</AppText>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing[2]}}>
                <TouchableOpacity
                  onPress={() => setRepeatCount(v => Math.max(1, v - 1))}
                  style={{width: 34, height: 34, borderRadius: 17, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center'}}
                  accessibilityLabel="Decrease repeat"
                >
                  <Text style={{color: c.primary, fontSize: 20}}>−</Text>
                </TouchableOpacity>
                <AppText variant="heading" weight="bold" style={{minWidth: 28, textAlign: 'center'}}>{repeatCount}×</AppText>
                <TouchableOpacity
                  onPress={() => setRepeatCount(v => Math.min(10, v + 1))}
                  style={{width: 34, height: 34, borderRadius: 17, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center'}}
                  accessibilityLabel="Increase repeat"
                >
                  <Text style={{color: c.primary, fontSize: 20}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>Due</AppText>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2]}}>
              {DUE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.offset}
                  onPress={() => setDueOffset(opt.offset)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8,
                    borderRadius: Radii.full,
                    backgroundColor: dueOffset === opt.offset ? c.primary : c.surfaceAlt,
                    borderWidth: 1.5, borderColor: dueOffset === opt.offset ? c.primary : c.border,
                  }}
                  accessibilityLabel={opt.label}
                >
                  <Text style={{color: dueOffset === opt.offset ? '#fff' : c.textSecondary, fontSize: 13, fontWeight: dueOffset === opt.offset ? '600' : '400'}}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>

          {/* Parent note */}
          <AppCard style={{marginBottom: Spacing[3]}}>
            <AppText variant="body" weight="semibold" style={{marginBottom: Spacing[2]}}>
              Note for learner{'  '}
              <AppText variant="caption" style={{color: c.textMuted}}>optional</AppText>
            </AppText>
            <TextInput
              value={parentNote}
              onChangeText={setParentNote}
              placeholder="Any instructions or encouragement..."
              placeholderTextColor={c.textMuted}
              multiline
              maxLength={500}
              style={{
                borderWidth: 1, borderColor: c.border, borderRadius: Radii.md,
                padding: Spacing[3], color: c.textPrimary, fontSize: 15,
                minHeight: 70, textAlignVertical: 'top', backgroundColor: c.surfaceAlt,
              }}
              accessibilityLabel="Parent note"
            />
          </AppCard>

          {/* Assignment preview / title */}
          <AppCard style={{marginBottom: Spacing[4], backgroundColor: c.primary + '0D', borderColor: c.primary + '40', borderWidth: 1}}>
            <AppText variant="caption" style={{color: c.primary, marginBottom: 4, fontWeight: '600'}}>Assignment preview</AppText>
            {editingTitle ? (
              <TextInput
                value={titleOverride}
                onChangeText={setTitleOverride}
                style={{color: c.textPrimary, fontSize: 15, fontWeight: '600', borderBottomWidth: 1, borderColor: c.primary, paddingBottom: 2, marginBottom: 4}}
                autoFocus
                onBlur={() => { if (!titleOverride.trim()) setEditingTitle(false); }}
                accessibilityLabel="Assignment title"
              />
            ) : (
              <TouchableOpacity onPress={() => { setTitleOverride(autoTitle); setEditingTitle(true); }} style={{marginBottom: 4}}>
                <Text style={{color: c.textPrimary, fontSize: 15, fontWeight: '600'}}>{title}</Text>
                <Text style={{color: c.primary, fontSize: 11, marginTop: 1}}>Tap to rename</Text>
              </TouchableOpacity>
            )}
            <AppText variant="caption" style={{color: c.textMuted}}>
              Due {dueOffset === 0 ? 'today' : dueOffset === 1 ? 'tomorrow' : `on ${dueDate}`} · {repeatCount}× repeat
            </AppText>
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
