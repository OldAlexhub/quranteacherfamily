import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '../../theme';
import {useLearnerStore} from '../../store/useLearnerStore';
import {useProgressStore} from '../../store/useProgressStore';
import {useGamificationStore, getLevelTitle} from '../../store/useGamificationStore';
import {useSessionStore} from '../../store/useSessionStore';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {StreakBadge} from '../../components/gamification/StreakBadge';
import {XPProgressBar} from '../../components/gamification/XPProgressBar';
import {SessionSetupModal} from '../../components/session/SessionSetupModal';
import {BannerAdComponent} from '../../ads/BannerAdComponent';
import {loadSurahs, getSurah} from '../../data/loaders';
import type {HomeStackParamList} from '../../types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

function greetingText(): string {
  const h = new Date().getHours();
  if (h < 5) {return 'Assalamu Alaikum 🌙';}
  if (h < 12) {return 'Good Morning ☀️';}
  if (h < 17) {return 'Good Afternoon 🌤️';}
  if (h < 20) {return 'Good Evening 🌆';}
  return 'Good Night 🌙';
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function HomeScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation<Nav>();

  const learner = useLearnerStore(s => s.getActiveLearner());
  const getContinueReadingLocation = useProgressStore(s => s.getContinueReadingLocation);
  const getNeedsReviewList = useProgressStore(s => s.getNeedsReviewList);
  const calculateMemorizationProgress = useProgressStore(s => s.calculateMemorizationProgress);

  const getProfile = useGamificationStore(s => s.getProfile);
  const getDailyGoal = useGamificationStore(s => s.getDailyGoal);
  const checkAndUpdateStreak = useGamificationStore(s => s.checkAndUpdateStreak);
  const setDailyTarget = useGamificationStore(s => s.setDailyTarget);

  const hasActiveSession = useSessionStore(s => s.hasActiveSession());
  const startSession = useSessionStore(s => s.startSession);

  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (learner) {
      checkAndUpdateStreak(learner.id);
    }
  }, [learner?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (learner) {checkAndUpdateStreak(learner.id);}
    setTick(t => t + 1);
    setTimeout(() => setRefreshing(false), 600);
  }, [learner, checkAndUpdateStreak]);

  const surahs = useMemo(() => loadSurahs(), []);
  const gamProfile = learner ? getProfile(learner.id) : null;
  const dailyGoal = learner ? getDailyGoal(learner.id, todayStr()) : null;
  const continueLocation = learner ? getContinueReadingLocation(learner.id) : null;
  const needsReviewList = learner ? getNeedsReviewList(learner.id) : [];

  const overdueReviews = needsReviewList.filter(item => {
    if (!item.reviewDueAt) {return false;}
    return item.reviewDueAt <= todayStr();
  }).length;

  const recentSurahProgress = useMemo(() => {
    if (!learner) {return [];}
    return surahs
      .slice(0, 15)
      .map(s => {
        const prog = calculateMemorizationProgress(learner.id, s.number);
        return {surah: s, prog};
      })
      .filter(x => x.prog.memorized + x.prog.practicing > 0)
      .slice(0, 4);
  }, [learner?.id, surahs, calculateMemorizationProgress, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const continuesurah = continueLocation ? getSurah(continueLocation.surahNumber) : null;
  const levelTitle = gamProfile ? getLevelTitle(gamProfile.level) : 'Seeker';
  const goalPct =
    dailyGoal && dailyGoal.targetAyahs > 0
      ? Math.min(dailyGoal.completedAyahs / dailyGoal.targetAyahs, 1)
      : 0;

  function handleStartSession(studyMins: number, breakMins: number, targetAyahs: number) {
    setSessionModalVisible(false);
    if (learner) {
      setDailyTarget(learner.id, targetAyahs);
      startSession(learner.id, studyMins, breakMins);
    }
    navigation.getParent()?.navigate('MemorizeTab' as any);
  }

  if (!learner) {
    return (
      <ScreenWrapper>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={[styles.emptyTitle, {color: colors.textPrimary}]}>
            No learner set up yet
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateLearner')}
            style={[styles.createBtn, {backgroundColor: colors.primary}]}>
            <Text style={[styles.createBtnText, {color: colors.textInverse}]}>
              Create Learner
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }>
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, {color: colors.textInverse + 'BB'}]}>
                {greetingText()}
              </Text>
              <Text style={[styles.learnerName, {color: colors.textInverse}]}>
                {learner.displayName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('LearnerProfiles')}
              accessibilityLabel="Switch learner"
              style={[
                styles.avatarBtn,
                {backgroundColor: learner.avatarColor, borderColor: colors.textInverse + '44'},
              ]}>
              <Text style={styles.avatarText}>
                {learner.displayName.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Streak + Level row */}
          <View style={styles.statsRow}>
            <View style={styles.streakBlock}>
              <StreakBadge streak={gamProfile?.streak ?? 0} size="md" />
              <View>
                <Text style={[styles.streakLabel, {color: colors.textInverse}]}>
                  {gamProfile?.streak ?? 0}-day streak
                </Text>
                <Text style={[styles.streakSub, {color: colors.textInverse + '88'}]}>
                  {(gamProfile?.streak ?? 0) === 0 ? 'Start today!' : 'Keep it going!'}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.levelChip,
                {backgroundColor: colors.accent + '22', borderColor: colors.accent + '55'},
              ]}>
              <Text style={[styles.levelNum, {color: colors.accent}]}>
                Lv {gamProfile?.level ?? 1}
              </Text>
              <Text style={[styles.levelTitle, {color: colors.accentLight}]}>
                {levelTitle}
              </Text>
            </View>
          </View>

          {/* XP Bar */}
          <View style={styles.xpBarWrapper}>
            <XPProgressBar
              xp={gamProfile?.xp ?? 0}
              level={gamProfile?.level ?? 1}
              showLabel={false}
              compact
            />
            <Text style={[styles.xpNote, {color: colors.textInverse + '88'}]}>
              {gamProfile?.xp ?? 0} XP total
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* ── Daily Goal Card ─────────────────────────────────────── */}
          <View style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.border}]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
                🎯 Today's Goal
              </Text>
              <Text style={[styles.cardMeta, {color: colors.textMuted}]}>
                {dailyGoal?.completedAyahs ?? 0} / {dailyGoal?.targetAyahs ?? 3} ayahs
              </Text>
            </View>
            <View style={[styles.goalTrack, {backgroundColor: colors.border}]}>
              <View
                style={[
                  styles.goalFill,
                  {
                    width: `${Math.round(goalPct * 100)}%`,
                    backgroundColor: goalPct >= 1 ? colors.memorized : colors.primary,
                  },
                ]}
              />
            </View>
            {goalPct >= 1 ? (
              <Text style={[styles.goalComplete, {color: colors.memorized}]}>
                ✅ Daily goal complete! Amazing work!
              </Text>
            ) : (
              <Text style={[styles.goalRemaining, {color: colors.textMuted}]}>
                {(dailyGoal?.targetAyahs ?? 3) - (dailyGoal?.completedAyahs ?? 0)} more ayahs to go
              </Text>
            )}
          </View>

          {/* ── Smart Suggestion: Overdue Reviews ───────────────────── */}
          {overdueReviews > 0 && (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('MemorizeTab' as any)}
              accessibilityLabel={`Review ${overdueReviews} ayahs`}
              style={[
                styles.suggestionCard,
                {
                  backgroundColor: colors.needsReview + '15',
                  borderColor: colors.needsReview + '44',
                },
              ]}>
              <Text style={styles.suggestionIcon}>📋</Text>
              <View style={styles.suggestionText}>
                <Text style={[styles.suggestionTitle, {color: colors.textPrimary}]}>
                  {overdueReviews} ayah{overdueReviews > 1 ? 's' : ''} need review
                </Text>
                <Text style={[styles.suggestionSub, {color: colors.textMuted}]}>
                  Review now to keep your memory sharp
                </Text>
              </View>
              <Text style={[styles.arrow, {color: colors.needsReview}]}>›</Text>
            </TouchableOpacity>
          )}

          {/* ── Continue Reading ────────────────────────────────────── */}
          {continueLocation && continuesurah && (
            <TouchableOpacity
              onPress={() =>
                navigation.getParent()?.navigate('QuranTab' as any, {
                  screen: 'QuranReader',
                  params: {
                    surahNumber: continueLocation.surahNumber,
                    startAyah: continueLocation.ayahNumber,
                  },
                })
              }
              accessibilityLabel={`Continue reading ${continuesurah.englishName}`}
              style={[
                styles.suggestionCard,
                {backgroundColor: colors.primary + '10', borderColor: colors.primary + '33'},
              ]}>
              <Text style={styles.suggestionIcon}>📖</Text>
              <View style={styles.suggestionText}>
                <Text style={[styles.suggestionTitle, {color: colors.textPrimary}]}>
                  Continue Reading
                </Text>
                <Text style={[styles.suggestionSub, {color: colors.textMuted}]}>
                  {continuesurah.arabicName} · Ayah {continueLocation.ayahNumber}
                </Text>
              </View>
              <Text style={[styles.arrow, {color: colors.primary}]}>›</Text>
            </TouchableOpacity>
          )}

          {/* ── Primary CTA Buttons ─────────────────────────────────── */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              onPress={() => setSessionModalVisible(true)}
              accessibilityLabel={hasActiveSession ? 'Resume session' : 'Start study session'}
              style={[styles.primaryCTA, {backgroundColor: colors.primary}]}>
              <Text style={styles.ctaEmoji}>
                {hasActiveSession ? '▶️' : '🧠'}
              </Text>
              <Text style={[styles.ctaLabel, {color: colors.textInverse}]}>
                {hasActiveSession ? 'Resume Session' : 'Start Session'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('QuranTab' as any)}
              accessibilityLabel="Open Quran"
              style={[
                styles.secondaryCTA,
                {backgroundColor: colors.surfaceAlt, borderColor: colors.border},
              ]}>
              <Text style={styles.ctaEmoji}>📖</Text>
              <Text style={[styles.secondaryCTALabel, {color: colors.textPrimary}]}>
                Open Quran
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Recent Progress ─────────────────────────────────────── */}
          {recentSurahProgress.length > 0 && (
            <View style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.border}]}>
              <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
                📊 My Progress
              </Text>
              {recentSurahProgress.map(({surah, prog}) => {
                const pct = prog.total > 0 ? prog.memorized / prog.total : 0;
                const isDone = prog.memorized === prog.total && prog.total > 0;
                return (
                  <View key={surah.number} style={styles.progressRow}>
                    <View style={styles.progressLeft}>
                      <Text style={[styles.surahName, {color: colors.textPrimary}]}>
                        {surah.englishName}
                        {isDone ? ' ✅' : ''}
                      </Text>
                      <Text style={[styles.surahSub, {color: colors.textMuted}]}>
                        {prog.memorized}/{prog.total} memorized
                      </Text>
                    </View>
                    <View style={styles.progressRight}>
                      <View style={[styles.miniTrack, {backgroundColor: colors.border}]}>
                        <View
                          style={[
                            styles.miniFill,
                            {
                              width: `${Math.round(pct * 100)}%`,
                              backgroundColor: isDone ? colors.memorized : colors.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Quick Links ─────────────────────────────────────────── */}
          <View style={styles.quickRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Achievements', {})}
              accessibilityLabel="View achievements"
              style={[
                styles.quickBtn,
                {backgroundColor: colors.accent + '18', borderColor: colors.accent + '44'},
              ]}>
              <Text style={styles.quickEmoji}>🏆</Text>
              <Text style={[styles.quickLabel, {color: colors.textPrimary}]}>Achievements</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('ProgressTab' as any)}
              accessibilityLabel="View full report"
              style={[
                styles.quickBtn,
                {backgroundColor: colors.info + '18', borderColor: colors.info + '44'},
              ]}>
              <Text style={styles.quickEmoji}>📊</Text>
              <Text style={[styles.quickLabel, {color: colors.textPrimary}]}>Full Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Assignments')}
              accessibilityLabel="View assignments"
              style={[
                styles.quickBtn,
                {backgroundColor: colors.primary + '18', borderColor: colors.primary + '33'},
              ]}>
              <Text style={styles.quickEmoji}>📝</Text>
              <Text style={[styles.quickLabel, {color: colors.textPrimary}]}>Assignments</Text>
            </TouchableOpacity>
          </View>

          {/* ── Banner Ad ───────────────────────────────────────────── */}
          <View style={styles.adContainer}>
            <BannerAdComponent />
          </View>
        </View>
      </ScrollView>

      <SessionSetupModal
        visible={sessionModalVisible}
        onClose={() => setSessionModalVisible(false)}
        onStart={handleStartSession}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 12},
  headerTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  greeting: {fontSize: 12, fontWeight: '500'},
  learnerName: {fontSize: 24, fontWeight: '800', marginTop: 2},
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 20, fontWeight: '800', color: '#FFF'},
  statsRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  streakBlock: {flexDirection: 'row', alignItems: 'center', gap: 10},
  streakLabel: {fontSize: 15, fontWeight: '700'},
  streakSub: {fontSize: 11},
  levelChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  levelNum: {fontSize: 13, fontWeight: '800'},
  levelTitle: {fontSize: 10, fontWeight: '600'},
  xpBarWrapper: {gap: 4},
  xpNote: {fontSize: 10, textAlign: 'right'},
  content: {padding: 16, gap: 12},
  card: {borderRadius: 16, borderWidth: 1, padding: 16, gap: 10},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  cardTitle: {fontSize: 16, fontWeight: '700'},
  cardMeta: {fontSize: 13, fontWeight: '600'},
  goalTrack: {height: 12, borderRadius: 6, overflow: 'hidden'},
  goalFill: {height: 12},
  goalComplete: {fontSize: 13, fontWeight: '600'},
  goalRemaining: {fontSize: 12},
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  suggestionIcon: {fontSize: 24},
  suggestionText: {flex: 1},
  suggestionTitle: {fontSize: 14, fontWeight: '700'},
  suggestionSub: {fontSize: 12, marginTop: 2},
  arrow: {fontSize: 24, fontWeight: '700'},
  ctaRow: {flexDirection: 'row', gap: 10},
  primaryCTA: {
    flex: 2,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  secondaryCTA: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
  },
  ctaEmoji: {fontSize: 26},
  ctaLabel: {fontSize: 15, fontWeight: '800'},
  secondaryCTALabel: {fontSize: 13, fontWeight: '700'},
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  progressLeft: {flex: 1},
  progressRight: {width: 80},
  surahName: {fontSize: 14, fontWeight: '600'},
  surahSub: {fontSize: 11, marginTop: 1},
  miniTrack: {height: 6, borderRadius: 3, overflow: 'hidden'},
  miniFill: {height: 6},
  quickRow: {flexDirection: 'row', gap: 8},
  quickBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  quickEmoji: {fontSize: 20},
  quickLabel: {fontSize: 11, fontWeight: '700', textAlign: 'center'},
  adContainer: {alignItems: 'center', marginTop: 4},
  emptyCenter: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40},
  emptyEmoji: {fontSize: 56},
  emptyTitle: {fontSize: 20, fontWeight: '700', textAlign: 'center'},
  createBtn: {paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8},
  createBtnText: {fontSize: 16, fontWeight: '700'},
});
