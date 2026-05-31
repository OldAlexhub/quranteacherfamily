import React, {useMemo} from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {PracticeStackParamList} from '../../types';
import {useTheme} from '../../theme';
import {Spacing, Radii, Shadows} from '../../theme/spacing';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {AppText} from '../../components/common/AppText';
import {AppCard} from '../../components/common/AppCard';
import {useLearnerStore} from '../../store/useLearnerStore';
import {useProgressStore} from '../../store/useProgressStore';

type Nav = NativeStackNavigationProp<PracticeStackParamList>;

export function PracticeHomeScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<Nav>();
  const activeLearner = useLearnerStore(s => s.getActiveLearner());
  const practiceStatus = useProgressStore(s => s.practiceStatus);
  const learnerPracticeStatus = activeLearner ? practiceStatus[activeLearner.id] : undefined;
  const needsReviewList = useMemo(
    () => Object.values(learnerPracticeStatus ?? {}).filter(s => s.status === 'needs_review'),
    [learnerPracticeStatus],
  );
  const memorizedList = useMemo(
    () => Object.values(learnerPracticeStatus ?? {}).filter(s => s.status === 'memorized'),
    [learnerPracticeStatus],
  );

  const practiceCards = [
    {
      icon: '🔄',
      title: 'Repeat Practice',
      desc: 'Listen and repeat selected ayahs multiple times to build memorization.',
      action: () => navigation.navigate('RepeatPractice', {}),
      color: c.primary,
    },
    {
      icon: '📖',
      title: 'Memorization Tracker',
      desc: 'Track memorization status for each surah and ayah.',
      action: () => navigation.navigate('MemorizationTracker', {}),
      color: c.success,
    },
  ];

  return (
    <ScreenWrapper>
      <AppText variant="title" weight="bold" style={{marginBottom: Spacing[5], color: c.primary}}>Practice</AppText>

      {practiceCards.map(card => (
        <TouchableOpacity
          key={card.title}
          onPress={card.action}
          style={{
            backgroundColor: c.surface,
            borderRadius: Radii.lg,
            padding: Spacing[5],
            marginBottom: Spacing[4],
            borderWidth: 1,
            borderColor: c.border,
            ...Shadows.md,
          }}
          accessibilityLabel={card.title}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[2]}}>
            <Text style={{fontSize: 28, marginRight: Spacing[3]}}>{card.icon}</Text>
            <AppText variant="heading" weight="semibold">{card.title}</AppText>
          </View>
          <AppText variant="body" style={{color: c.textMuted}}>{card.desc}</AppText>
          <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing[2]}}>
            <Text style={{color: card.color, fontSize: 16}}>Start ›</Text>
          </View>
        </TouchableOpacity>
      ))}

      {activeLearner && needsReviewList.length > 0 && (
        <AppCard style={{marginBottom: Spacing[4], borderColor: c.needsReview + '40'}}>
          <AppText variant="body" weight="semibold" style={{color: c.needsReview, marginBottom: Spacing[2]}}>
            ⚠ {needsReviewList.length} ayah{needsReviewList.length > 1 ? 's' : ''} need review
          </AppText>
          <AppText variant="caption" style={{color: c.textMuted, marginBottom: Spacing[2]}}>
            {activeLearner.displayName || 'Learner'} has ayahs marked for review.
          </AppText>
          <TouchableOpacity onPress={() => navigation.navigate('MemorizationTracker', {})}>
            <AppText variant="caption" style={{color: c.primary}}>Review now →</AppText>
          </TouchableOpacity>
        </AppCard>
      )}

      {activeLearner && memorizedList.length > 0 && (
        <AppCard style={{borderColor: c.memorized + '40'}}>
          <AppText variant="body" weight="semibold" style={{color: c.memorized, marginBottom: Spacing[1]}}>
            ✓ {memorizedList.length} ayah{memorizedList.length > 1 ? 's' : ''} marked memorized
          </AppText>
          <AppText variant="caption" style={{color: c.textMuted}}>
            Remember to review memorized ayahs regularly to retain them.
          </AppText>
        </AppCard>
      )}
    </ScreenWrapper>
  );
}
