import React, {useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, SectionList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {ProgressBar} from '../../components/progress/ProgressBar';
import {EmptyState} from '../../components/common/EmptyState';
import {loadSurahs} from '../../data/loaders';
import {useProgressStore} from '../../store/useProgressStore';
import {useLearnerStore} from '../../store/useLearnerStore';
import type {PracticeStatusType, Surah} from '../../types';

const STATUS_COLORS: Record<PracticeStatusType, string> = {
  not_started: '#BDC3C7',
  learning: '#2980B9',
  practicing: '#D4AF37',
  needs_review: '#E74C3C',
  memorized: '#27AE60',
};

const STATUS_LABELS: Record<PracticeStatusType, string> = {
  not_started: 'Not started',
  learning: 'Learning',
  practicing: 'Practicing',
  needs_review: 'Needs review',
  memorized: 'Memorized',
};

export function MemorizationTrackerScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const surahs = loadSurahs();
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const getPracticeStatus = useProgressStore(s => s.getPracticeStatus);
  const updatePracticeStatus = useProgressStore(s => s.updatePracticeStatus);
  const bulkUpdate = useProgressStore(s => s.bulkUpdatePracticeStatus);
  const needsReview = useProgressStore(s => activeLearner ? s.getNeedsReviewList(activeLearner.id) : []);
  const memorized = useProgressStore(s => activeLearner ? s.getMemorizedList(activeLearner.id) : []);
  const [expandedSurah, setExpandedSurah] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'surahs' | 'needs_review' | 'memorized'>('surahs');

  function getSurahProgress(surah: Surah): {count: number; total: number} {
    if (!activeLearner) return {count: 0, total: surah.ayahCount};
    let count = 0;
    for (let i = 1; i <= surah.ayahCount; i++) {
      if (getPracticeStatus(activeLearner.id, surah.number, i) === 'memorized') count++;
    }
    return {count, total: surah.ayahCount};
  }

  function bulkMarkSurah(surahNumber: number, status: PracticeStatusType) {
    if (!activeLearner) return;
    const surah = surahs.find(s => s.number === surahNumber);
    if (!surah) return;
    bulkUpdate(activeLearner.id, surahNumber, 1, surah.ayahCount, status);
  }

  if (!activeLearner) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: c.background}}>
        <EmptyState title="No learner selected" subtitle="Select a learner to track memorization" />
      </SafeAreaView>
    );
  }

  const tabs = [
    {key: 'surahs', label: 'Surahs'},
    {key: 'needs_review', label: `Review (${needsReview.length})`},
    {key: 'memorized', label: `Memorized (${memorized.length})`},
  ] as const;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['bottom']}>
      {/* Tabs */}
      <View style={{flexDirection: 'row', borderBottomWidth: 1, borderColor: c.border}}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderColor: activeTab === tab.key ? c.primary : 'transparent'}}
            accessibilityLabel={tab.label}
          >
            <Text style={{color: activeTab === tab.key ? c.primary : c.textMuted, fontSize: 13, fontWeight: '500'}}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'surahs' && (
        <FlatList
          data={surahs}
          keyExtractor={s => String(s.number)}
          contentContainerStyle={{padding: Spacing[4], paddingBottom: 32}}
          showsVerticalScrollIndicator={false}
          renderItem={({item: surah}) => {
            const {count, total} = getSurahProgress(surah);
            const isExpanded = expandedSurah === surah.number;
            return (
              <View>
                <TouchableOpacity
                  onPress={() => setExpandedSurah(isExpanded ? null : surah.number)}
                  style={{
                    backgroundColor: c.surface,
                    borderRadius: Radii.md,
                    padding: Spacing[3],
                    marginBottom: Spacing[1],
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                  accessibilityLabel={`${surah.transliteration} memorization`}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={{color: c.textMuted, fontSize: 12, width: 24, textAlign: 'right', marginRight: Spacing[3]}}>{surah.number}</Text>
                    <Text style={{color: c.textArabic, fontSize: 17, flex: 1, textAlign: 'right'}}>{surah.arabicName}</Text>
                    <AppText variant="caption" style={{color: count === total ? c.memorized : c.textMuted, marginLeft: Spacing[2]}}>
                      {count}/{total}
                    </AppText>
                    <Text style={{color: c.textMuted, marginLeft: Spacing[2]}}>{isExpanded ? '⌄' : '›'}</Text>
                  </View>
                  {count > 0 && (
                    <ProgressBar progress={count / total} height={4} color={count === total ? c.memorized : c.practicing} style={{marginTop: 6}} />
                  )}
                </TouchableOpacity>
                {isExpanded && (
                  <View style={{backgroundColor: c.surfaceAlt, borderRadius: Radii.md, padding: Spacing[3], marginBottom: Spacing[2]}}>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: Spacing[2]}}>
                      {Array.from({length: surah.ayahCount}, (_, i) => i + 1).map(ayahNum => {
                        const status = getPracticeStatus(activeLearner.id, surah.number, ayahNum);
                        return (
                          <TouchableOpacity
                            key={ayahNum}
                            onPress={() => {
                              const next: PracticeStatusType = status === 'memorized' ? 'needs_review' : status === 'needs_review' ? 'practicing' : 'memorized';
                              updatePracticeStatus(activeLearner.id, surah.number, ayahNum, next);
                            }}
                            style={{width: 32, height: 32, borderRadius: 8, backgroundColor: STATUS_COLORS[status], alignItems: 'center', justifyContent: 'center'}}
                            accessibilityLabel={`Ayah ${ayahNum}: ${STATUS_LABELS[status]}`}
                          >
                            <Text style={{color: '#fff', fontSize: 11, fontWeight: '700'}}>{ayahNum}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <View style={{flexDirection: 'row', gap: Spacing[2]}} >
                      <TouchableOpacity onPress={() => bulkMarkSurah(surah.number, 'memorized')} style={{flex: 1, backgroundColor: c.memorized, borderRadius: Radii.md, padding: 8, alignItems: 'center'}} accessibilityLabel="Mark all memorized">
                        <Text style={{color: '#fff', fontSize: 12}}>All memorized</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => bulkMarkSurah(surah.number, 'needs_review')} style={{flex: 1, backgroundColor: c.needsReview, borderRadius: Radii.md, padding: 8, alignItems: 'center'}} accessibilityLabel="Mark all needs review">
                        <Text style={{color: '#fff', fontSize: 12}}>All review</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => bulkMarkSurah(surah.number, 'not_started')} style={{flex: 1, backgroundColor: c.surfaceAlt, borderRadius: Radii.md, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: c.border}} accessibilityLabel="Reset all">
                        <Text style={{color: c.textSecondary, fontSize: 12}}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {activeTab === 'needs_review' && (
        <FlatList
          data={needsReview}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: Spacing[4], paddingBottom: 32}}
          ListEmptyComponent={<EmptyState title="No items need review" subtitle="Great work! Keep up the practice." />}
          renderItem={({item}) => (
            <AppCard style={{marginBottom: Spacing[2]}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <AppText variant="body" style={{flex: 1}}>Surah {item.surahNumber}, Ayah {item.ayahNumber}</AppText>
                <TouchableOpacity
                  onPress={() => updatePracticeStatus(activeLearner.id, item.surahNumber, item.ayahNumber, 'practicing')}
                  style={{backgroundColor: c.primary, borderRadius: Radii.md, paddingHorizontal: 10, paddingVertical: 6}}
                  accessibilityLabel="Mark as practicing"
                >
                  <Text style={{color: '#fff', fontSize: 12}}>Mark practiced</Text>
                </TouchableOpacity>
              </View>
            </AppCard>
          )}
        />
      )}

      {activeTab === 'memorized' && (
        <FlatList
          data={memorized}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: Spacing[4], paddingBottom: 32}}
          ListEmptyComponent={<EmptyState title="Nothing memorized yet" subtitle="Start practicing and mark ayahs as memorized to track them here." />}
          renderItem={({item}) => (
            <AppCard style={{marginBottom: Spacing[2]}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={{color: c.memorized, marginRight: Spacing[2]}}>✓</Text>
                <AppText variant="body">Surah {item.surahNumber}, Ayah {item.ayahNumber}</AppText>
              </View>
            </AppCard>
          )}
        />
      )}
    </SafeAreaView>
  );
}
