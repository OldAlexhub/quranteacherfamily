import React, {useMemo, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '../../theme';
import {useLearnerStore} from '../../store/useLearnerStore';
import {useProgressStore} from '../../store/useProgressStore';
import {useGamificationStore} from '../../store/useGamificationStore';
import {useSessionStore} from '../../store/useSessionStore';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {SessionSetupModal} from '../../components/session/SessionSetupModal';
import {BannerAdComponent} from '../../ads/BannerAdComponent';
import {loadSurahs} from '../../data/loaders';
import type {MemorizeStackParamList} from '../../types';

type Nav = NativeStackNavigationProp<MemorizeStackParamList, 'MemorizeHome'>;

export function MemorizeHomeScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation<Nav>();

  const learner = useLearnerStore(s => s.getActiveLearner());
  const practiceStatus = useProgressStore(s => s.practiceStatus);
  const calculateMemorizationProgress = useProgressStore(s => s.calculateMemorizationProgress);
  const getNeedsReviewList = useProgressStore(s => s.getNeedsReviewList);
  const getProfile = useGamificationStore(s => s.getProfile);
  const startSession = useSessionStore(s => s.startSession);
  const setDailyTarget = useGamificationStore(s => s.setDailyTarget);
  const hasActiveSession = useSessionStore(s => s.hasActiveSession());

  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(3);

  const surahs = useMemo(() => loadSurahs(), []);
  const profile = learner ? getProfile(learner.id) : null;

  const needsReview = learner ? getNeedsReviewList(learner.id) : [];
  const overdueCount = needsReview.filter(r => {
    if (!r.reviewDueAt) {return false;}
    return r.reviewDueAt <= new Date().toISOString().split('T')[0];
  }).length;

  const memorizedList = useMemo(() => {
    if (!learner) {return [];}
    return Object.values(practiceStatus[learner.id] ?? {}).filter(
      s => s.status === 'memorized',
    );
  }, [learner?.id, practiceStatus]);

  // Top surahs with progress
  const surahsWithProgress = useMemo(() => {
    if (!learner) {return [];}
    return surahs
      .slice(0, 20)
      .map(s => ({surah: s, prog: calculateMemorizationProgress(learner.id, s.number)}))
      .filter(x => x.prog.total > 0 || x.surah.number <= 5);
  }, [learner?.id, surahs, calculateMemorizationProgress]);

  function handleStartSession(studyMins: number, breakMins: number, targetAyahs: number) {
    setSessionModalVisible(false);
    if (learner) {
      setDailyTarget(learner.id, targetAyahs);
      const session = startSession(learner.id, studyMins, breakMins);
      navigation.navigate('MemorizeFlow', {
        surahNumber: selectedSurah,
        startAyah,
        endAyah,
        sessionId: session.id,
      });
    }
  }

  function handleQuickStart(surahNum: number, start: number, end: number) {
    setSelectedSurah(surahNum);
    setStartAyah(start);
    setEndAyah(end);
    setSessionModalVisible(true);
  }

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <Text style={[styles.headerTitle, {color: colors.textInverse}]}>🧠 Memorize</Text>
          <Text style={[styles.headerSub, {color: colors.textInverse + '99'}]}>
            {profile?.totalAyahsMemorized ?? 0} ayahs memorized · 🔥 {profile?.streak ?? 0}-day streak
          </Text>
        </View>

        {/* Overdue reviews alert */}
        {overdueCount > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('MemorizationTracker', {})}
            accessibilityLabel={`${overdueCount} ayahs need review`}
            style={[styles.alertCard, {backgroundColor: colors.needsReview + '15', borderColor: colors.needsReview + '55'}]}>
            <Text style={styles.alertEmoji}>⚠️</Text>
            <View style={{flex: 1}}>
              <Text style={[styles.alertTitle, {color: colors.textPrimary}]}>
                {overdueCount} ayah{overdueCount > 1 ? 's' : ''} need review
              </Text>
              <Text style={[styles.alertSub, {color: colors.textMuted}]}>
                Tap to review and keep your memory fresh
              </Text>
            </View>
            <Text style={[styles.arrow, {color: colors.needsReview}]}>›</Text>
          </TouchableOpacity>
        )}

        {/* Main actions */}
        <View style={styles.mainActions}>
          <TouchableOpacity
            onPress={() => {
              setSelectedSurah(1);
              setStartAyah(1);
              setEndAyah(3);
              setSessionModalVisible(true);
            }}
            accessibilityLabel={hasActiveSession ? 'Resume session' : 'Start memorization session'}
            style={[styles.bigBtn, {backgroundColor: colors.primary}]}>
            <Text style={styles.bigBtnEmoji}>{hasActiveSession ? '▶️' : '🧠'}</Text>
            <Text style={[styles.bigBtnLabel, {color: colors.textInverse}]}>
              {hasActiveSession ? 'Resume Session' : 'New Session'}
            </Text>
            <Text style={[styles.bigBtnSub, {color: colors.textInverse + '99'}]}>
              Guided 5-step memorization
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('RepeatPractice', {})}
              accessibilityLabel="Repeat practice"
              style={[styles.smallBtn, {backgroundColor: colors.surfaceAlt, borderColor: colors.border}]}>
              <Text style={styles.smallBtnEmoji}>🔄</Text>
              <Text style={[styles.smallBtnLabel, {color: colors.textPrimary}]}>Repeat</Text>
              <Text style={[styles.smallBtnSub, {color: colors.textMuted}]}>Listen & repeat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('MemorizationTracker', {})}
              accessibilityLabel="View memorization tracker"
              style={[styles.smallBtn, {backgroundColor: colors.surfaceAlt, borderColor: colors.border}]}>
              <Text style={styles.smallBtnEmoji}>📊</Text>
              <Text style={[styles.smallBtnLabel, {color: colors.textPrimary}]}>Tracker</Text>
              <Text style={[styles.smallBtnSub, {color: colors.textMuted}]}>
                {memorizedList.length} memorized
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick start surahs */}
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
          📖 Quick Start
        </Text>
        {surahsWithProgress.slice(0, 8).map(({surah, prog}) => {
          const pct = prog.total > 0 ? prog.memorized / prog.total : 0;
          const isDone = prog.memorized >= surah.ayahCount;
          return (
            <TouchableOpacity
              key={surah.number}
              onPress={() => handleQuickStart(surah.number, 1, Math.min(5, surah.ayahCount))}
              accessibilityLabel={`Memorize ${surah.englishName}`}
              style={[styles.surahRow, {backgroundColor: colors.surface, borderColor: colors.border}]}>
              <View style={[styles.surahNum, {backgroundColor: colors.primary + '18'}]}>
                <Text style={[styles.surahNumText, {color: colors.primary}]}>{surah.number}</Text>
              </View>
              <View style={styles.surahInfo}>
                <Text style={[styles.surahArabic, {color: colors.textArabic}]}>
                  {surah.arabicName}
                </Text>
                <Text style={[styles.surahEng, {color: colors.textMuted}]}>
                  {surah.englishName} · {surah.ayahCount} ayahs
                </Text>
                {prog.total > 0 && (
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
                )}
              </View>
              <Text style={[styles.arrow, {color: colors.textMuted}]}>›</Text>
            </TouchableOpacity>
          );
        })}

        <BannerAdComponent />
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
  container: {gap: 12, paddingBottom: 32},
  header: {padding: 20, gap: 4},
  headerTitle: {fontSize: 24, fontWeight: '800'},
  headerSub: {fontSize: 13},
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  alertEmoji: {fontSize: 22},
  alertTitle: {fontSize: 14, fontWeight: '700'},
  alertSub: {fontSize: 12, marginTop: 2},
  arrow: {fontSize: 22, fontWeight: '700'},
  mainActions: {paddingHorizontal: 16, gap: 10},
  bigBtn: {
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  bigBtnEmoji: {fontSize: 36},
  bigBtnLabel: {fontSize: 20, fontWeight: '800'},
  bigBtnSub: {fontSize: 13},
  secondaryRow: {flexDirection: 'row', gap: 10},
  smallBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 2,
  },
  smallBtnEmoji: {fontSize: 24},
  smallBtnLabel: {fontSize: 14, fontWeight: '700'},
  smallBtnSub: {fontSize: 11},
  sectionTitle: {fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginTop: 4},
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  surahNum: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumText: {fontSize: 14, fontWeight: '800'},
  surahInfo: {flex: 1, gap: 2},
  surahArabic: {fontSize: 16, fontWeight: '600'},
  surahEng: {fontSize: 12},
  miniTrack: {height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 4},
  miniFill: {height: 4},
});
