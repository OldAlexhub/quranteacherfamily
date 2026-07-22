import React, {useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {HomeStackParamList, Assignment} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {AppButton} from '../../components/common/AppButton';
import {EmptyState} from '../../components/common/EmptyState';
import {useLearnerStore} from '../../store/useLearnerStore';
import {useAssignmentStore} from '../../store/useAssignmentStore';
import {tryShowInterstitial, recordCompletionEvent} from '../../ads/interstitialAdService';
import {getSurah} from '../../data/loaders';
import {
  ASSIGNMENT_ICONS,
  getAssignmentActionLabel,
  getAssignmentDetail,
  launchAssignment,
} from '../../navigation/assignmentNavigation';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const STATUS_COLORS: Record<Assignment['status'], string> = {
  pending: '#D4AF37',
  in_progress: '#2980B9',
  completed: '#27AE60',
  needs_review: '#E74C3C',
};

export function AssignmentsScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const getAllAssignments = useAssignmentStore(s => s.getAllAssignments);
  const completeAssignment = useAssignmentStore(s => s.completeAssignment);
  const deleteAssignment = useAssignmentStore(s => s.deleteAssignment);
  const [filter, setFilter] = useState<Assignment['status'] | 'all'>('all');

  if (!activeLearner) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['left', 'right']}>
        <EmptyState title="No learner selected" subtitle="Select a learner to view assignments" />
      </SafeAreaView>
    );
  }

  const all = getAllAssignments(activeLearner.id);
  const shown = filter === 'all' ? all : all.filter(a => a.status === filter);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['left', 'right']}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing[4], paddingTop: Spacing[3]}}>
        <AppText variant="body" style={{color: c.textMuted}}>{all.length} total</AppText>
        <AppButton label="+ New" onPress={() => navigation.navigate('CreateAssignment', {learnerId: activeLearner.id})} size="sm" />
      </View>

      {/* Filter chips */}
      <View style={{flexDirection: 'row', paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], gap: Spacing[2]}}>
        {(['all', 'pending', 'completed', 'needs_review'] as const).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={{paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full, backgroundColor: filter === f ? c.primary : c.surface, borderWidth: 1, borderColor: filter === f ? c.primary : c.border}}
            accessibilityLabel={`Filter ${f}`}
          >
            <Text style={{color: filter === f ? '#fff' : c.textMuted, fontSize: 12}}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={shown}
        keyExtractor={a => a.id}
        contentContainerStyle={{padding: Spacing[4], paddingBottom: 32}}
        ListEmptyComponent={
          <EmptyState
            title="No assignments"
            subtitle={filter === 'all' ? 'Create the first assignment for this learner.' : `No ${filter.replace('_', ' ')} assignments.`}
            action={{label: '+ Create Assignment', onPress: () => navigation.navigate('CreateAssignment', {learnerId: activeLearner.id})}}
          />
        }
        renderItem={({item: a}) => {
          const surah = getSurah(a.surahNumber);
          return (
            <AppCard style={{marginBottom: Spacing[2]}}>
              {/* Header */}
              <View style={{flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing[2]}}>
                <View style={{
                  width: 38, height: 38, borderRadius: Radii.md,
                  backgroundColor: c.primary + '18',
                  alignItems: 'center', justifyContent: 'center', marginRight: Spacing[2],
                }}>
                  <Text style={{fontSize: 18}}>{ASSIGNMENT_ICONS[a.type]}</Text>
                </View>
                <View style={{flex: 1}}>
                  <AppText variant="body" weight="semibold">{a.title}</AppText>
                  <AppText variant="caption" style={{color: c.textMuted}}>
                    {getAssignmentDetail(a, surah?.transliteration ?? `Surah ${a.surahNumber}`, true)}
                  </AppText>
                </View>
                <View style={{paddingHorizontal: 8, paddingVertical: 3, backgroundColor: STATUS_COLORS[a.status] + '20', borderRadius: Radii.full, borderWidth: 1, borderColor: STATUS_COLORS[a.status] + '60', marginLeft: Spacing[2]}}>
                  <Text style={{color: STATUS_COLORS[a.status], fontSize: 11}}>{a.status.replace('_', ' ')}</Text>
                </View>
              </View>

              {a.parentNote ? (
                <View style={{backgroundColor: c.surfaceAlt, borderRadius: Radii.md, padding: Spacing[2], marginBottom: Spacing[2]}}>
                  <AppText variant="caption" style={{color: c.textSecondary, fontStyle: 'italic'}}>{a.parentNote}</AppText>
                </View>
              ) : null}

              {/* Start button — primary action */}
              {a.status !== 'completed' && (
                <TouchableOpacity
                  onPress={() => launchAssignment(navigation, a)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                    backgroundColor: c.primary, borderRadius: Radii.md,
                    paddingVertical: Spacing[2], marginBottom: Spacing[2],
                  }}
                  accessibilityLabel={getAssignmentActionLabel(a.type)}
                >
                  <Text style={{color: '#fff', fontSize: 14}}>▶</Text>
                  <Text style={{color: '#fff', fontSize: 13, fontWeight: '700'}}>
                    {getAssignmentActionLabel(a.type)}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Secondary actions */}
              <View style={{flexDirection: 'row', gap: Spacing[2]}}>
                {a.status !== 'completed' && (
                  <TouchableOpacity
                    onPress={() => {
                      completeAssignment(a.id, activeLearner.id);
                      recordCompletionEvent();
                      setTimeout(() => tryShowInterstitial(false), 800);
                    }}
                    style={{flex: 1, backgroundColor: c.success + '20', borderRadius: Radii.md, padding: 7, alignItems: 'center', borderWidth: 1, borderColor: c.success + '60'}}
                    accessibilityLabel="Mark complete"
                  >
                    <Text style={{color: c.success, fontSize: 12, fontWeight: '600'}}>✓ Done</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => navigation.navigate('EditAssignment', {assignmentId: a.id})}
                  style={{flex: 1, backgroundColor: c.surfaceAlt, borderRadius: Radii.md, padding: 7, alignItems: 'center', borderWidth: 1, borderColor: c.border}}
                  accessibilityLabel="Edit assignment"
                >
                  <Text style={{color: c.textSecondary, fontSize: 12}}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Alert.alert('Delete', 'Delete this assignment?', [
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'Delete', style: 'destructive', onPress: () => deleteAssignment(a.id, activeLearner.id)},
                  ])}
                  style={{width: 36, backgroundColor: c.error + '15', borderRadius: Radii.md, padding: 7, alignItems: 'center', borderWidth: 1, borderColor: c.error + '40'}}
                  accessibilityLabel="Delete assignment"
                >
                  <Text style={{color: c.error, fontSize: 14}}>✕</Text>
                </TouchableOpacity>
              </View>
            </AppCard>
          );
        }}
      />
    </SafeAreaView>
  );
}
