import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Share, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {AppButton} from '../../components/common/AppButton';
import {ProgressBar} from '../../components/progress/ProgressBar';
import {BannerAdComponent} from '../../ads/BannerAdComponent';
import {SectionHeader} from '../../components/layout/SectionHeader';
import {useLearnerStore} from '../../store/useLearnerStore';
import {useProgressStore} from '../../store/useProgressStore';
import {useAssignmentStore} from '../../store/useAssignmentStore';
import {useBookmarkStore} from '../../store/useBookmarkStore';

type Period = 'today' | '7days' | '30days' | 'all';

export function ProgressReportsScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<any>();
  const learners = useLearnerStore(s => s.learners);
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const [period, setPeriod] = useState<Period>('7days');

  const readingProgress = useProgressStore(s => activeLearner ? s.readingProgress[activeLearner.id] : null);
  const listeningProgress = useProgressStore(s => activeLearner ? s.listeningProgress[activeLearner.id] : null);
  const memProgress = useProgressStore(s => activeLearner ? s.calculateMemorizationProgress(activeLearner.id) : null);
  const sessions = useProgressStore(s => activeLearner ? s.getPracticeSessions(activeLearner.id) : []);
  const allAssignments = useAssignmentStore(s => activeLearner ? s.getAllAssignments(activeLearner.id) : []);
  const bookmarks = useBookmarkStore(s => s.getBookmarksByLearner(activeLearner?.id));
  const notes = useBookmarkStore(s => s.notes.filter(n => !n.learnerId || n.learnerId === activeLearner?.id));

  const completedAssignments = allAssignments.filter(a => a.status === 'completed').length;
  const listeningHours = Math.round(((listeningProgress?.listeningSeconds ?? 0) / 3600) * 10) / 10;

  async function exportReport() {
    if (!activeLearner) return;
    const report = [
      `Quran Teacher Family — Progress Report`,
      `Generated: ${new Date().toLocaleString()}`,
      `App: Quran Teacher Family by Old Alex Hub`,
      ``,
      `Learner: ${activeLearner.displayName || 'Unnamed'}`,
      `Created: ${new Date(activeLearner.createdAt).toLocaleDateString()}`,
      ``,
      `READING PROGRESS`,
      `Ayahs read: ${readingProgress?.ayahsRead ?? 0}`,
      `Reading sessions: ${readingProgress?.readingSessions ?? 0}`,
      `Last surah: ${readingProgress?.lastSurahNumber ?? '-'}`,
      ``,
      `LISTENING`,
      `Total listening time: ${listeningHours} hours`,
      ``,
      `MEMORIZATION`,
      `Memorized: ${memProgress?.memorized ?? 0} ayahs`,
      `Practicing: ${memProgress?.practicing ?? 0} ayahs`,
      `Needs review: ${memProgress?.needsReview ?? 0} ayahs`,
      ``,
      `ASSIGNMENTS`,
      `Total: ${allAssignments.length}`,
      `Completed: ${completedAssignments}`,
      ``,
      `PRACTICE SESSIONS`,
      `Total sessions: ${sessions.length}`,
      ``,
      `BOOKMARKS: ${bookmarks.length}`,
      `NOTES: ${notes.length}`,
      ``,
      `---`,
      `This report is generated from local device data only. No data is sent to any server.`,
    ].join('\n');

    try {
      await Share.share({message: report, title: 'Progress Report'});
    } catch {
      Alert.alert('Export', 'Could not share report. Copy the data below manually.');
    }
  }

  const periods: {key: Period; label: string}[] = [
    {key: 'today', label: 'Today'},
    {key: '7days', label: '7 days'},
    {key: '30days', label: '30 days'},
    {key: 'all', label: 'All time'},
  ];

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['bottom']}>
      <ScrollView contentContainerStyle={{padding: Spacing[4], paddingBottom: 40}} showsVerticalScrollIndicator={false}>

        {/* Learner selector */}
        <View style={{flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[4], flexWrap: 'wrap'}}>
          {learners.map(l => (
            <TouchableOpacity
              key={l.id}
              onPress={() => useLearnerStore.getState().setActiveLearner(l.id)}
              style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.full, backgroundColor: l.id === activeLearner?.id ? c.primary : c.surface, borderWidth: 1, borderColor: l.id === activeLearner?.id ? c.primary : c.border}}
              accessibilityLabel={l.displayName || 'Learner'}
            >
              <Text style={{color: l.id === activeLearner?.id ? '#fff' : c.textSecondary, fontSize: 13}}>{l.displayName || 'Unnamed'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period filter */}
        <View style={{flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[4]}}>
          {periods.map(p => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={{paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radii.full, backgroundColor: period === p.key ? c.primary : c.surface, borderWidth: 1, borderColor: period === p.key ? c.primary : c.border}}
              accessibilityLabel={p.label}
            >
              <Text style={{color: period === p.key ? '#fff' : c.textMuted, fontSize: 12}}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!activeLearner ? (
          <AppText variant="body" style={{color: c.textMuted}}>Select a learner to view their progress.</AppText>
        ) : (
          <>
            {/* Stats grid */}
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginBottom: Spacing[4]}}>
              {[
                {label: 'Ayahs Read', value: readingProgress?.ayahsRead ?? 0, color: c.primary},
                {label: 'Memorized', value: memProgress?.memorized ?? 0, color: c.memorized},
                {label: 'Needs Review', value: memProgress?.needsReview ?? 0, color: c.needsReview},
                {label: 'Assignments Done', value: completedAssignments, color: c.success},
                {label: 'Practice Sessions', value: sessions.length, color: c.info},
                {label: 'Listen Hours', value: listeningHours, color: c.accent},
              ].map(stat => (
                <View key={stat.label} style={{
                  flex: 1, minWidth: '44%',
                  backgroundColor: c.surface, borderRadius: Radii.lg, padding: Spacing[3],
                  borderWidth: 1, borderColor: stat.color + '30',
                  alignItems: 'center',
                }}>
                  <Text style={{color: stat.color, fontSize: 28, fontWeight: '700', marginBottom: 4}}>{stat.value}</Text>
                  <AppText variant="caption" center style={{color: c.textMuted}}>{stat.label}</AppText>
                </View>
              ))}
            </View>

            {/* Memorization progress */}
            <SectionHeader title="Memorization Progress" />
            <AppCard style={{marginBottom: Spacing[4]}}>
              {memProgress && memProgress.memorized + memProgress.practicing + memProgress.needsReview > 0 ? (
                <>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing[2]}}>
                    <AppText variant="caption" style={{color: c.memorized}}>Memorized: {memProgress.memorized}</AppText>
                    <AppText variant="caption" style={{color: c.practicing}}>Practicing: {memProgress.practicing}</AppText>
                    <AppText variant="caption" style={{color: c.needsReview}}>Review: {memProgress.needsReview}</AppText>
                  </View>
                  <ProgressBar progress={memProgress.memorized / 6236} color={c.memorized} height={6} />
                  <AppText variant="caption" style={{color: c.textMuted, marginTop: Spacing[1]}}>
                    {memProgress.memorized} of 6,236 ayahs marked memorized
                  </AppText>
                </>
              ) : (
                <AppText variant="caption" style={{color: c.textMuted}}>No memorization data yet.</AppText>
              )}
            </AppCard>

            {/* Recent sessions */}
            {sessions.length > 0 && (
              <>
                <SectionHeader title="Recent Practice Sessions" />
                {sessions.slice(-5).reverse().map(s => (
                  <AppCard key={s.id} style={{marginBottom: Spacing[2]}}>
                    <View style={{flexDirection: 'row'}}>
                      <AppText variant="body" weight="medium" style={{flex: 1}}>Surah {s.surahNumber}, {s.startAyah}–{s.endAyah}</AppText>
                      <AppText variant="caption" style={{color: c.textMuted}}>{new Date(s.completedAt).toLocaleDateString()}</AppText>
                    </View>
                    <AppText variant="caption" style={{color: c.textMuted}}>
                      {s.mode.replace('_', ' ')} · {s.repeatCount}× repeat{s.durationSeconds ? ` · ${Math.round(s.durationSeconds / 60)}min` : ''}
                    </AppText>
                  </AppCard>
                ))}
              </>
            )}

            {/* Export */}
            <AppButton
              label="Export Report"
              onPress={exportReport}
              variant="secondary"
              fullWidth
              style={{marginTop: Spacing[4]}}
            />

            <AppCard style={{marginTop: Spacing[3], backgroundColor: c.surfaceAlt}}>
              <AppText variant="caption" style={{color: c.textMuted, fontStyle: 'italic'}}>
                All progress data is stored locally on this device. Nothing is sent to any server. You can delete all data in Settings.
              </AppText>
            </AppCard>
          </>
        )}
      </ScrollView>
      {/* Banner ad — bottom of Progress screen, away from Quran content */}
      <BannerAdComponent />
    </SafeAreaView>
  );
}
