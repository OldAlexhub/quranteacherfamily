import React, {useMemo} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii, Shadows} from '../../theme/spacing';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {BannerAdComponent} from '../../ads/BannerAdComponent';
import {AppButton} from '../../components/common/AppButton';
import {SectionHeader} from '../../components/layout/SectionHeader';
import {ProgressBar} from '../../components/progress/ProgressBar';
import {useLearnerStore} from '../../store/useLearnerStore';
import {useProgressStore} from '../../store/useProgressStore';
import {useAssignmentStore} from '../../store/useAssignmentStore';
import {storageClearLearner} from '../../storage/storage';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

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
  const memorizationProgressByLearner = useMemo(() => {
    return Object.fromEntries(
      learners.map(learner => {
        const items = Object.values(practiceStatus[learner.id] ?? {});
        return [learner.id, items.filter(s => s.status === 'memorized').length];
      }),
    );
  }, [learners, practiceStatus]);

  function deleteLearner(id: string) {
    Alert.alert(
      'Delete Learner',
      'This will permanently delete this learner\'s profile and all their local progress, assignments, and notes. This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
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
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetLearnerProgress(id),
        },
      ],
    );
  }

  return (
    <ScreenWrapper>
      {/* Learner profiles */}
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
            const completedToday = assignments.filter(a => a.status === 'completed' && a.dueDate.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

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

      {/* Assignments section */}
      <SectionHeader
        title="Assignments"
        action={{label: 'View all', onPress: () => navigation.navigate('Assignments')}}
      />
      <AppCard style={{marginBottom: Spacing[4]}}>
        <AppButton
          label="+ Create Assignment"
          onPress={() => navigation.navigate('CreateAssignment', {learnerId: activeLearner?.id})}
          size="sm"
          disabled={!activeLearner}
        />
        {!activeLearner && <AppText variant="caption" style={{color: c.textMuted, marginTop: 6}}>Select a learner first</AppText>}
      </AppCard>

      {/* Parent notes */}
      <SectionHeader title="Parent Notes" />
      <AppCard style={{marginBottom: Spacing[4]}}>
        <AppText variant="body" style={{color: c.textMuted}}>
          Use the Notes section to add observations about your learner's progress, areas needing review, and teaching notes.
        </AppText>
        <AppButton label="Open Notes" onPress={() => navigation.navigate('Notes')} variant="ghost" size="sm" style={{marginTop: Spacing[2]}} />
      </AppCard>

      {/* Export */}
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
      {/* Banner ad — bottom of Parent Dashboard, away from Quran content */}
      <BannerAdComponent />
    </ScreenWrapper>
  );
}
