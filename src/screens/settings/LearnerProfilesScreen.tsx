import React from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../../types';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {AppButton} from '../../components/common/AppButton';
import {SectionHeader} from '../../components/layout/SectionHeader';
import {useTheme} from '../../theme';
import {Spacing, Radii} from '../../theme/spacing';
import {useLearnerStore} from '../../store/useLearnerStore';
import {storageClearLearner} from '../../storage/storage';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export function LearnerProfilesScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();
  const learners = useLearnerStore(s => s.learners);
  const deleteLearnerStore = useLearnerStore(s => s.deleteLearner);

  function deleteLearner(id: string, name: string) {
    Alert.alert(
      'Delete Learner',
      `Delete "${name || 'this learner'}"? All their local progress, assignments, bookmarks, and notes will be permanently deleted.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteLearnerStore(id);
          await storageClearLearner(id);
        }},
      ],
    );
  }

  return (
    <ScreenWrapper>
      <SectionHeader
        title="Learner Profiles"
        action={{label: '+ Add', onPress: () => navigation.navigate('CreateLearner')}}
      />
      {learners.length === 0 ? (
        <AppCard>
          <AppText variant="body" style={{color: c.textMuted, marginBottom: Spacing[3]}}>No learners yet. Add the first learner to start tracking their Quran progress.</AppText>
          <AppButton label="Create Learner" onPress={() => navigation.navigate('CreateLearner')} />
        </AppCard>
      ) : (
        learners.map(l => (
          <AppCard key={l.id} style={{marginBottom: Spacing[3]}}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[3]}}>
              <View style={{width: 44, height: 44, borderRadius: 22, backgroundColor: l.avatarColor, alignItems: 'center', justifyContent: 'center', marginRight: Spacing[3]}}>
                <Text style={{color: '#fff', fontSize: 18}}>👦</Text>
              </View>
              <View style={{flex: 1}}>
                <AppText variant="body" weight="semibold">{l.displayName || 'Unnamed Learner'}</AppText>
                <AppText variant="caption" style={{color: c.textMuted}}>Since {new Date(l.createdAt).toLocaleDateString()}</AppText>
              </View>
            </View>
            <View style={{flexDirection: 'row', gap: Spacing[2]}}>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditLearner', {learnerId: l.id})}
                style={{flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: Radii.md, padding: 8, alignItems: 'center'}}
                accessibilityLabel="Edit learner"
              >
                <AppText variant="caption">Edit Profile</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteLearner(l.id, l.displayName)}
                style={{flex: 1, borderWidth: 1, borderColor: c.error, borderRadius: Radii.md, padding: 8, alignItems: 'center'}}
                accessibilityLabel="Delete learner"
              >
                <AppText variant="caption" style={{color: c.error}}>Delete</AppText>
              </TouchableOpacity>
            </View>
          </AppCard>
        ))
      )}
    </ScreenWrapper>
  );
}
