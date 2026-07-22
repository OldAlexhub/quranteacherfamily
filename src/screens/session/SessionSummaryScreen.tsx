import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '../../theme';
import {useLearnerStore} from '../../store/useLearnerStore';
import {
  useGamificationStore,
  ALL_BADGES,
  getLevelTitle,
} from '../../store/useGamificationStore';
import {useSessionStore} from '../../store/useSessionStore';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {XPProgressBar} from '../../components/gamification/XPProgressBar';
import {tryShowInterstitial} from '../../ads/interstitialAdService';
import type {MemorizeStackParamList} from '../../types';

type Nav = NativeStackNavigationProp<MemorizeStackParamList, 'SessionSummary'>;
type RouteP = RouteProp<MemorizeStackParamList, 'SessionSummary'>;

export function SessionSummaryScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteP>();
  const {sessionId} = route.params;

  const learner = useLearnerStore(s => s.getActiveLearner());
  const getProfile = useGamificationStore(s => s.getProfile);
  const getDailyGoal = useGamificationStore(s => s.getDailyGoal);
  const sessionHistory = useSessionStore(s => s.sessionHistory);
  const session = sessionHistory.find(s => s.id === sessionId);
  const profile = learner ? getProfile(learner.id) : null;
  const today = new Date().toISOString().split('T')[0];
  const dailyGoal = learner ? getDailyGoal(learner.id, today) : null;

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {toValue: 1, friction: 6, tension: 60, useNativeDriver: true}),
      Animated.timing(fadeAnim, {toValue: 1, duration: 400, useNativeDriver: true}),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  // New badges earned during this session (compare to a stored snapshot — simplified: show last 3 earned)
  const recentBadges = ALL_BADGES.filter(b =>
    (profile?.earnedBadgeIds ?? []).slice(-3).includes(b.id),
  );

  const levelTitle = profile ? getLevelTitle(profile.level) : 'Seeker';
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;

  function handlePracticeAgain() {
    tryShowInterstitial(false, () => {
      navigation.replace('MemorizeHome');
    });
  }

  function handleGoHome() {
    tryShowInterstitial(false, () => {
      navigation.getParent()?.navigate('HomeTab' as any);
    });
  }

  return (
    <ScreenWrapper scrollable={false}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[styles.heroCard, {backgroundColor: colors.primary, opacity: fadeAnim, transform: [{scale: scaleAnim}]}]}>
          <Text style={styles.trophyEmoji}>🎉</Text>
          <Text style={[styles.heroTitle, {color: colors.textInverse}]}>Session Complete!</Text>
          <Text style={[styles.heroSub, {color: colors.textInverse + '99'}]}>
            Amazing work, {learner?.displayName ?? 'Learner'}!
          </Text>
        </Animated.View>

        {/* Session stats */}
        <View style={[styles.statsCard, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>Session Stats</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, {backgroundColor: colors.accent + '15', borderColor: colors.accent + '44'}]}>
              <Text style={[styles.statNum, {color: colors.accent}]}>
                ⚡ {session?.xpEarned ?? 0}
              </Text>
              <Text style={[styles.statLbl, {color: colors.textMuted}]}>XP earned</Text>
            </View>
            <View style={[styles.statBox, {backgroundColor: colors.memorized + '15', borderColor: colors.memorized + '44'}]}>
              <Text style={[styles.statNum, {color: colors.memorized}]}>
                {session?.ayahsCompleted ?? 0}
              </Text>
              <Text style={[styles.statLbl, {color: colors.textMuted}]}>ayahs done</Text>
            </View>
            <View style={[styles.statBox, {backgroundColor: colors.info + '15', borderColor: colors.info + '44'}]}>
              <Text style={[styles.statNum, {color: colors.info}]}>
                {session?.studyDurationMinutes ?? 0}m
              </Text>
              <Text style={[styles.statLbl, {color: colors.textMuted}]}>studied</Text>
            </View>
            <View style={[styles.statBox, {backgroundColor: colors.primary + '15', borderColor: colors.primary + '33'}]}>
              <Text style={[styles.statNum, {color: colors.primary}]}>
                🔥 {profile?.streak ?? 0}
              </Text>
              <Text style={[styles.statLbl, {color: colors.textMuted}]}>day streak</Text>
            </View>
          </View>
        </View>

        {/* Level progress */}
        <View style={[styles.levelCard, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <View style={styles.levelRow}>
            <View style={[styles.levelBadge, {backgroundColor: colors.primary}]}>
              <Text style={[styles.levelBadgeText, {color: colors.textInverse}]}>{level}</Text>
            </View>
            <View style={styles.levelRight}>
              <Text style={[styles.levelTitle, {color: colors.textPrimary}]}>
                Level {level}: {levelTitle}
              </Text>
              <XPProgressBar xp={xp} level={level} showLabel compact />
            </View>
          </View>
        </View>

        {/* Daily goal */}
        {dailyGoal && (
          <View
            style={[
              styles.goalCard,
              {
                backgroundColor: dailyGoal.isCompleted ? colors.memorized + '15' : colors.surface,
                borderColor: dailyGoal.isCompleted ? colors.memorized + '55' : colors.border,
              },
            ]}>
            <Text style={[styles.goalTitle, {color: colors.textPrimary}]}>
              {dailyGoal.isCompleted ? '🎯 Daily Goal Complete!' : '🎯 Daily Goal'}
            </Text>
            <Text style={[styles.goalProgress, {color: dailyGoal.isCompleted ? colors.memorized : colors.textMuted}]}>
              {dailyGoal.completedAyahs} / {dailyGoal.targetAyahs} ayahs
              {dailyGoal.isCompleted ? ' ✅' : ''}
            </Text>
          </View>
        )}

        {/* New badges */}
        {recentBadges.length > 0 && (
          <View style={[styles.badgesCard, {backgroundColor: colors.surface, borderColor: colors.border}]}>
            <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>🏅 Recent Badges</Text>
            <View style={styles.badgeRow}>
              {recentBadges.map(b => (
                <View
                  key={b.id}
                  style={[styles.badgeItem, {backgroundColor: colors.accent + '18', borderColor: colors.accent + '44'}]}>
                  <Text style={styles.badgeEmoji}>{b.icon}</Text>
                  <Text style={[styles.badgeName, {color: colors.textPrimary}]}>{b.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity
          onPress={handlePracticeAgain}
          accessibilityLabel="Practice again"
          style={[styles.primaryBtn, {backgroundColor: colors.primary}]}>
          <Text style={[styles.primaryBtnText, {color: colors.textInverse}]}>
            🧠 Practice Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoHome}
          accessibilityLabel="Go to home"
          style={[styles.secondaryBtn, {borderColor: colors.border}]}>
          <Text style={[styles.secondaryBtnText, {color: colors.textSecondary}]}>
            🏠 Go Home
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12, paddingBottom: 32},
  heroCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  trophyEmoji: {fontSize: 56},
  heroTitle: {fontSize: 28, fontWeight: '900', textAlign: 'center'},
  heroSub: {fontSize: 15, textAlign: 'center'},
  cardTitle: {fontSize: 16, fontWeight: '700', marginBottom: 4},
  statsCard: {borderRadius: 16, borderWidth: 1, padding: 16, gap: 12},
  statsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  statBox: {
    flex: 1,
    minWidth: '44%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  statNum: {fontSize: 20, fontWeight: '800'},
  statLbl: {fontSize: 11},
  levelCard: {borderRadius: 16, borderWidth: 1, padding: 16},
  levelRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: {fontSize: 20, fontWeight: '900'},
  levelRight: {flex: 1, gap: 4},
  levelTitle: {fontSize: 16, fontWeight: '700'},
  goalCard: {borderRadius: 14, borderWidth: 1, padding: 16, gap: 4},
  goalTitle: {fontSize: 15, fontWeight: '700'},
  goalProgress: {fontSize: 14, fontWeight: '600'},
  badgesCard: {borderRadius: 16, borderWidth: 1, padding: 16, gap: 12},
  badgeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeEmoji: {fontSize: 18},
  badgeName: {fontSize: 12, fontWeight: '700'},
  primaryBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnText: {fontSize: 17, fontWeight: '800'},
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryBtnText: {fontSize: 15, fontWeight: '600'},
});
