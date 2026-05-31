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
      <SafeAreaView style={{flex: 1, backgroundColor: c.background}}>
        <EmptyState title="No learner selected" subtitle="Select a learner to view assignments" />
      </SafeAreaView>
    );
  }

  const all = getAllAssignments(activeLearner.id);
  const shown = filter === 'all' ? all : all.filter(a => a.status === filter);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: c.background}} edges={['bottom']}>
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
        renderItem={({item: a}) => (
          <AppCard style={{marginBottom: Spacing[2]}}>
            <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
              <View style={{flex: 1}}>
                <AppText variant="body" weight="semibold">{a.title}</AppText>
                <AppText variant="caption" style={{color: c.textMuted}}>
                  Surah {a.surahNumber}, Ayah {a.startAyah}–{a.endAyah} · Due {a.dueDate.slice(0, 10)}
                </AppText>
                {a.parentNote ? <AppText variant="caption" style={{color: c.textSecondary, marginTop: 2}}>{a.parentNote}</AppText> : null}
              </View>
              <View style={{paddingHorizontal: 8, paddingVertical: 3, backgroundColor: STATUS_COLORS[a.status] + '20', borderRadius: Radii.full, borderWidth: 1, borderColor: STATUS_COLORS[a.status] + '60', marginLeft: Spacing[2]}}>
                <Text style={{color: STATUS_COLORS[a.status], fontSize: 11}}>{a.status.replace('_', ' ')}</Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[2]}}>
              {a.status !== 'completed' && (
                <TouchableOpacity
                  onPress={() => {
                    completeAssignment(a.id, activeLearner.id);
                    recordCompletionEvent();
                    // Show interstitial at natural stopping point after completion
                    setTimeout(() => tryShowInterstitial(false), 800);
                  }}
                  style={{flex: 1, backgroundColor: c.success + '20', borderRadius: Radii.md, padding: 7, alignItems: 'center', borderWidth: 1, borderColor: c.success + '60'}}
                  accessibilityLabel="Mark complete"
                >
                  <Text style={{color: c.success, fontSize: 12}}>✓ Done</Text>
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
        )}
      />
    </SafeAreaView>
  );
}
