import React, {useMemo} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {HomeStackParamList, Assignment} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {BannerAdComponent} from '../../ads/BannerAdComponent';
import {AppButton} from '../../components/common/AppButton';
import {SectionHeader} from '../../components/layout/SectionHeader';
import {useLearnerStore} from '../../store/useLearnerStore';
import {useProgressStore} from '../../store/useProgressStore';
import {useAssignmentStore} from '../../store/useAssignmentStore';
import {storageClearLearner} from '../../storage/storage';
import {getSurah} from '../../data/loaders';
import {tryShowInterstitial, recordCompletionEvent} from '../../ads/interstitialAdService';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const TYPE_ICONS: Record<string, string> = {
  read_arabic: '📖', listen: '🔊', word_by_word: 'ا',
  memorization_review: '⭐', free_reading: '🌙',
};

export function ParentDashboardScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();
  const learners = useLearnerStore(s => s.learners);
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const setActiveLearner = useLearnerStore(s => s.setActiveLearner);
  const deleteLearnerFromStore = useLearnerStore(s => s.deleteLearner);
  const progressData = useProgressStore(s => s.readingProgress);
  const practiceStatus = useProgressStore(s => s.practiceStatus);
  const resetLearnerProgress = useProgressStore(s => s.resetLearnerProgress);
  const allAssignments = useAssignmentStore(s => s.assignments);
  const completeAssignment = useAssignmentStore(s => s.completeAssignment);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const memorizationProgressByLearner = useMemo(() => {
    return Object.fromEntries(
      learners.map(learner => {
        const items = Object.values(practiceStatus[learner.id] ?? {});
        return [learner.id, items.filter(s => s.status === 'memorized').length];
      }),
    );
  }, [learners, practiceStatus]);

  const activeAssignments: Assignment[] = useMemo(() => {
    if (!activeLearner) return [];
    return (allAssignments[activeLearner.id] ?? []).filter(
      a => a.dueDate.slice(0, 10) <= today && a.status !== 'completed',
    );
  }, [allAssignments, activeLearner, today]);

  function deleteLearner(id: string) {
    Alert.alert(
      'Delete Learner',
      "This will permanently delete this learner's profile and all their local progress, assignments, and notes. This cannot be undone.",
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteLearnerFromStore(id);
            await storageClearLearner(id);
          },
        },
      ],
    );
  }

  function resetProgress(id: string, name: string) {
    Alert.alert(
      'Reset Progress',
      `Reset all learning progress for ${name || 'this learner'}? Bookmarks and notes will be kept, but reading progress, memorization status, and practice sessions will be cleared.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Reset', style: 'destructive', onPress: () => resetLearnerProgress(id)},
      ],
    );
  }

  function startAssignment(a: Assignment) {
    (navigation as any).navigate('PracticeTab', {
      screen: 'RepeatPractice',
      params: {surahNumber: a.surahNumber, startAyah: a.startAyah, endAyah: a.endAyah},
    });
  }

  async function markDone(a: Assignment) {
    if (!activeLearner) return;
    await completeAssignment(a.id, activeLearner.id);
    recordCompletionEvent();
    setTimeout(() => tryShowInterstitial(false), 800);
  }

  return (
    <ScreenWrapper>
      {/* ── Learner profiles ── */}
      <SectionHeader
        title="Learner Profiles"
        action={{label: '+ Add', onPress: () => navigation.navigate('CreateLearner')}}
      />

      {learners.length === 0 ? (
        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="body" style={{color: c.textMuted, marginBottom: Spacing[2]}}>No learner profiles yet.</AppText>
          <AppButton label="Create First Learner" onPress={() => navigation.navigate('CreateLearner')} size="sm" />
        </AppCard>
      ) : (
        <>
          {learners.map(learner => {
            const progress = progressData[learner.id];
            const isActive = learner.id === activeLearner?.id;
            const assignments = allAssignments[learner.id] ?? [];
            const completedToday = assignments.filter(
              a => a.status === 'completed' && a.dueDate.slice(0, 10) === today,
            ).length;

            return (
              <AppCard
                key={learner.id}
                style={{marginBottom: Spacing[3], borderColor: isActive ? c.primary : c.border, borderWidth: isActive ? 2 : 1}}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[2]}}>
                  <View style={{width: 42, height: 42, borderRadius: 21, backgroundColor: learner.avatarColor, alignItems: 'center', justifyContent: 'center', marginRight: Spacing[3]}}>
                    <Text style={{color: '#fff', fontSize: 18}}>👦</Text>
                  </View>
                  <View style={{flex: 1}}>
                    <AppText variant="subheading" weight="semibold">{learner.displayName || 'Unnamed Learner'}</AppText>
                    {isActive && <AppText variant="caption" style={{color: c.primary}}>Active learner</AppText>}
                  </View>
                  {!isActive && (
                    <TouchableOpacity onPress={() => setActiveLearner(learner.id)} accessibilityLabel="Set as active learner">
                      <AppText variant="caption" style={{color: c.primary}}>Select</AppText>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{flexDirection: 'row', marginBottom: Spacing[2], gap: Spacing[3]}}>
                  <View style={{flex: 1, backgroundColor: c.surfaceAlt, borderRadius: Radii.md, padding: Spacing[2], alignItems: 'center'}}>
                    <AppText variant="heading" weight="bold" style={{color: c.primary}}>{progress?.ayahsRead ?? 0}</AppText>
                    <AppText variant="caption" style={{color: c.textMuted}}>Ayahs read</AppText>
                  </View>
                  <View style={{flex: 1, backgroundColor: c.surfaceAlt, borderRadius: Radii.md, padding: Spacing[2], alignItems: 'center'}}>
                    <AppText variant="heading" weight="bold" style={{color: c.success}}>{completedToday}</AppText>
                    <AppText variant="caption" style={{color: c.textMuted}}>Done today</AppText>
                  </View>
                  <View style={{flex: 1, backgroundColor: c.surfaceAlt, borderRadius: Radii.md, padding: Spacing[2], alignItems: 'center'}}>
                    <AppText variant="heading" weight="bold" style={{color: c.memorized}}>{memorizationProgressByLearner[learner.id] ?? 0}</AppText>
                    <AppText variant="caption" style={{color: c.textMuted}}>Memorized</AppText>
                  </View>
                </View>

                <View style={{flexDirection: 'row', gap: Spacing[2]}}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('EditLearner', {learnerId: learner.id})}
                    style={{flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: Radii.md, padding: 8, alignItems: 'center'}}
                    accessibilityLabel="Edit learner"
                  >
                    <AppText variant="caption">Edit</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => resetProgress(learner.id, learner.displayName)}
                    style={{flex: 1, borderWidth: 1, borderColor: c.warning, borderRadius: Radii.md, padding: 8, alignItems: 'center'}}
                    accessibilityLabel="Reset progress"
                  >
                    <AppText variant="caption" style={{color: c.warning}}>Reset</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteLearner(learner.id)}
                    style={{flex: 1, borderWidth: 1, borderColor: c.error, borderRadius: Radii.md, padding: 8, alignItems: 'center'}}
                    accessibilityLabel="Delete learner"
                  >
                    <AppText variant="caption" style={{color: c.error}}>Delete</AppText>
                  </TouchableOpacity>
                </View>
              </AppCard>
            );
          })}
        </>
      )}

      {/* ── Today's assignments ── */}
      <SectionHeader
        title="Today's Assignments"
        action={{label: '+ New', onPress: () => navigation.navigate('CreateAssignment', {learnerId: activeLearner?.id})}}
      />

      {!activeLearner ? (
        <AppCard style={{marginBottom: Spacing[4]}}>
          <AppText variant="caption" style={{color: c.textMuted}}>Select a learner above to see their assignments.</AppText>
        </AppCard>
      ) : activeAssignments.length === 0 ? (
        <AppCard style={{marginBottom: Spacing[4], alignItems: 'center', paddingVertical: Spacing[5]}}>
          <Text style={{fontSize: 32, marginBottom: Spacing[2]}}>✅</Text>
          <AppText variant="body" weight="semibold" style={{marginBottom: 4}}>All clear for today!</AppText>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[3]}}>No pending assignments due today.</AppText>
          <AppButton
            label="+ Create Assignment"
            onPress={() => navigation.navigate('CreateAssignment', {learnerId: activeLearner.id})}
            size="sm"
            variant="secondary"
          />
        </AppCard>
      ) : (
        <>
          {activeAssignments.map(a => {
            const surah = getSurah(a.surahNumber);
            const isOverdue = a.dueDate.slice(0, 10) < today;
            return (
              <AppCard key={a.id} style={{marginBottom: Spacing[3]}}>
                {/* Header row */}
                <View style={{flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing[2]}}>
                  <View style={{
                    width: 40, height: 40, borderRadius: Radii.md,
                    backgroundColor: c.primary + '18',
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: Spacing[2],
                  }}>
                    <Text style={{fontSize: 20}}>{TYPE_ICONS[a.type] ?? '📋'}</Text>
                  </View>
                  <View style={{flex: 1}}>
                    <AppText variant="body" weight="semibold" numberOfLines={1} style={{marginBottom: 1}}>{a.title}</AppText>
                    <AppText variant="caption" style={{color: c.textMuted}}>
                      {surah?.transliteration ?? `Surah ${a.surahNumber}`} · Ayah {a.startAyah}–{a.endAyah} · {a.repeatCount ?? 3}× repeat
                    </AppText>
                  </View>
                  {isOverdue && (
                    <View style={{paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.error + '20', borderRadius: Radii.full, marginLeft: 4}}>
                      <Text style={{color: c.error, fontSize: 10, fontWeight: '700'}}>OVERDUE</Text>
                    </View>
                  )}
                </View>

                {/* Parent note */}
                {a.parentNote ? (
                  <View style={{backgroundColor: c.surfaceAlt, borderRadius: Radii.md, padding: Spacing[2], marginBottom: Spacing[2]}}>
                    <AppText variant="caption" style={{color: c.textSecondary, fontStyle: 'italic'}} numberOfLines={2}>
                      {a.parentNote}
                    </AppText>
                  </View>
                ) : null}

                {/* Actions */}
                <View style={{flexDirection: 'row', gap: Spacing[2]}}>
                  <TouchableOpacity
                    onPress={() => startAssignment(a)}
                    style={{
                      flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                      backgroundColor: c.primary, borderRadius: Radii.md, paddingVertical: Spacing[2],
                    }}
                    accessibilityLabel="Start practice"
                  >
                    <Text style={{color: '#fff', fontSize: 14}}>▶</Text>
                    <Text style={{color: '#fff', fontSize: 13, fontWeight: '700'}}>Start Practice</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => markDone(a)}
                    style={{
                      flex: 1, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: c.success + '20', borderRadius: Radii.md, paddingVertical: Spacing[2],
                      borderWidth: 1, borderColor: c.success + '60',
                    }}
                    accessibilityLabel="Mark done"
                  >
                    <Text style={{color: c.success, fontSize: 13, fontWeight: '700'}}>✓ Done</Text>
                  </TouchableOpacity>
                </View>
              </AppCard>
            );
          })}

          <TouchableOpacity
            onPress={() => navigation.navigate('Assignments')}
            style={{marginBottom: Spacing[4], alignItems: 'center'}}
          >
            <AppText variant="caption" style={{color: c.primary}}>View all assignments →</AppText>
          </TouchableOpacity>
        </>
      )}

      {/* ── Parent notes ── */}
      <SectionHeader title="Parent Notes" />
      <AppCard style={{marginBottom: Spacing[4]}}>
        <AppText variant="body" style={{color: c.textMuted}}>
          Use the Notes section to add observations about your learner's progress, areas needing review, and teaching notes.
        </AppText>
        <AppButton label="Open Notes" onPress={() => navigation.navigate('Notes')} variant="ghost" size="sm" style={{marginTop: Spacing[2]}} />
      </AppCard>

      {/* ── Export ── */}
      <SectionHeader title="Export & Reports" />
      <AppCard>
        <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>
          Export learning progress and assignments as text or JSON reports. All data is local to this device.
        </AppText>
        <AppButton
          label="View Progress Reports"
          onPress={() => (navigation as any).navigate('ProgressTab')}
          variant="secondary"
          size="sm"
        />
      </AppCard>

      <BannerAdComponent />
    </ScreenWrapper>
  );
}
