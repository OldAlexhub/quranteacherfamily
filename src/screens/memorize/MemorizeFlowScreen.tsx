import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp, RouteProp} from '@react-navigation/native-stack';
import {useTheme} from '../../theme';
import {useLearnerStore} from '../../store/useLearnerStore';
import {useProgressStore} from '../../store/useProgressStore';
import {useGamificationStore} from '../../store/useGamificationStore';
import {useSessionStore} from '../../store/useSessionStore';
import {usePreferencesStore} from '../../store/usePreferencesStore';
import {SessionTimerBar} from '../../components/session/SessionTimerBar';
import {BreakModal} from '../../components/session/BreakModal';
import {ScreenWrapper} from '../../components/layout/ScreenWrapper';
import {getAyahsBySurahAsync} from '../../data/loaders';
import {playAyah, pauseAudio, stopAudio} from '../../audio/audioPlayer';
import type {Ayah, MemorizeStackParamList} from '../../types';

type Nav = NativeStackNavigationProp<MemorizeStackParamList, 'MemorizeFlow'>;
type RouteP = RouteProp<MemorizeStackParamList, 'MemorizeFlow'>;

type Step = 'listen' | 'read_along' | 'repeat' | 'from_memory' | 'done';

const STEPS: Step[] = ['listen', 'read_along', 'repeat', 'from_memory', 'done'];

const STEP_META: Record<Step, {emoji: string; title: string; instruction: string; xpKey?: string}> = {
  listen:      {emoji: '🎧', title: 'Listen',        instruction: 'Close your eyes and listen carefully to the ayah.', xpKey: 'ayah_listened'},
  read_along:  {emoji: '👁️', title: 'Read Along',   instruction: 'Follow the words while listening again.',           xpKey: 'ayah_repeated'},
  repeat:      {emoji: '🔄', title: 'Repeat',        instruction: 'Say the ayah out loud after the reciter.',          xpKey: 'ayah_repeated'},
  from_memory: {emoji: '💪', title: 'From Memory',   instruction: 'Try to recite the ayah on your own!',             xpKey: undefined},
  done:        {emoji: '✅', title: 'Memorized!',    instruction: 'Well done! You have memorized this ayah.',         xpKey: undefined},
};

function XPToast({xp, visible}: {xp: number; visible: boolean}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.sequence([
        Animated.timing(anim, {toValue: 1, duration: 200, useNativeDriver: true}),
        Animated.delay(800),
        Animated.timing(anim, {toValue: 0, duration: 300, useNativeDriver: true}),
      ]).start();
    }
  }, [visible, anim]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        xpToastStyles.toast,
        {opacity: anim, transform: [{translateY: anim.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}]},
      ]}>
      <Text style={xpToastStyles.text}>+{xp} XP ⚡</Text>
    </Animated.View>
  );
}
const xpToastStyles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 12,
    right: 16,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 99,
  },
  text: {color: '#FFF', fontWeight: '800', fontSize: 14},
});

export function MemorizeFlowScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteP>();
  const {surahNumber, startAyah, endAyah, sessionId} = route.params;

  const learner = useLearnerStore(s => s.getActiveLearner());
  const updatePracticeStatus = useProgressStore(s => s.updatePracticeStatus);
  const addXP = useGamificationStore(s => s.addXP);
  const updateDailyGoal = useGamificationStore(s => s.updateDailyGoal);
  const checkAndUpdateStreak = useGamificationStore(s => s.checkAndUpdateStreak);
  const incrementTotalAyahsMemorized = useGamificationStore(s => s.incrementTotalAyahsMemorized);
  const incrementTotalSessions = useGamificationStore(s => s.incrementTotalSessions);
  const activeSession = useSessionStore(s => s.activeSession);
  const recordAyahCompleted = useSessionStore(s => s.recordAyahCompleted);
  const endSession = useSessionStore(s => s.endSession);
  const resumeStudy = useSessionStore(s => s.resumeStudy);
  const recStyle = usePreferencesStore(s => s.preferences.selectedRecitationStyle);

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [ayahIdx, setAyahIdx] = useState(0);
  const [step, setStep] = useState<Step>('listen');
  const [showArabic, setShowArabic] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [xpToastXP, setXpToastXP] = useState(0);
  const [xpToastVisible, setXpToastVisible] = useState(false);
  const stepAnim = useRef(new Animated.Value(1)).current;

  // Load ayahs
  useEffect(() => {
    setLoading(true);
    getAyahsBySurahAsync(surahNumber).then(all => {
      const slice = all.filter(
        a => a.ayahNumber >= startAyah && a.ayahNumber <= endAyah,
      );
      setAyahs(slice);
      setLoading(false);
    });
    return () => {stopAudio().catch(() => {});};
  }, [surahNumber, startAyah, endAyah]);

  // Watch for break phase
  useEffect(() => {
    if (activeSession?.phase === 'break' && !showBreakModal) {
      setIsPlaying(false);
      pauseAudio().catch(() => {});
      setShowBreakModal(true);
    }
  }, [activeSession?.phase, showBreakModal]);

  // Auto-play on Listen step
  useEffect(() => {
    if (!loading && ayahs.length > 0 && step === 'listen') {
      handlePlay();
    }
  }, [step, ayahIdx, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentAyah = ayahs[ayahIdx];
  const isLastAyah = ayahIdx >= ayahs.length - 1;

  const showToast = useCallback((xp: number) => {
    setXpToastXP(xp);
    setXpToastVisible(true);
    setTimeout(() => setXpToastVisible(false), 1200);
  }, []);

  const animateStep = useCallback((next: () => void) => {
    Animated.sequence([
      Animated.timing(stepAnim, {toValue: 0, duration: 150, useNativeDriver: true}),
      Animated.timing(stepAnim, {toValue: 1, duration: 200, useNativeDriver: true}),
    ]).start(next);
  }, [stepAnim]);

  const handlePlay = useCallback(async () => {
    if (!currentAyah) {return;}
    setIsPlaying(true);
    try {
      await playAyah(surahNumber, currentAyah.ayahNumber, recStyle, 1);
    } finally {
      setIsPlaying(false);
    }
  }, [currentAyah, surahNumber, recStyle]);

  const advanceStep = useCallback(() => {
    const stepIdx = STEPS.indexOf(step);
    const meta = STEP_META[step];

    // Award XP for this step
    if (meta.xpKey && learner) {
      const result = addXP(learner.id, meta.xpKey as any);
      showToast(result.xpAdded);
      if (activeSession) {recordAyahCompleted(result.xpAdded);}
    }

    if (step === 'from_memory') {
      // Move to done
      animateStep(() => setStep('done'));
    } else if (step === 'done') {
      handleMarkMemorized();
    } else {
      const nextStep = STEPS[stepIdx + 1];
      animateStep(() => setStep(nextStep as Step));
      if (nextStep === 'read_along' || nextStep === 'repeat') {
        setTimeout(() => handlePlay(), 200);
      }
    }
  }, [step, learner, addXP, showToast, activeSession, recordAyahCompleted, animateStep, handlePlay]);

  const handleMarkMemorized = useCallback(() => {
    if (!currentAyah || !learner) {return;}

    // Update practice status
    const today = new Date();
    const reviewDue = new Date(today);
    reviewDue.setDate(reviewDue.getDate() + 1);
    updatePracticeStatus(learner.id, surahNumber, currentAyah.ayahNumber, 'memorized', reviewDue.toISOString().split('T')[0]);

    // Award XP for memorizing
    const result = addXP(learner.id, 'ayah_memorized');
    showToast(result.xpAdded);
    incrementTotalAyahsMemorized(learner.id);
    checkAndUpdateStreak(learner.id);
    const {justCompleted} = updateDailyGoal(learner.id, 1);
    if (justCompleted) {
      addXP(learner.id, 'daily_goal_hit');
    }
    if (activeSession) {recordAyahCompleted(result.xpAdded);}

    // Advance to next ayah or finish
    if (!isLastAyah) {
      setTimeout(() => {
        animateStep(() => {
          setAyahIdx(i => i + 1);
          setStep('listen');
          setShowArabic(true);
        });
      }, 800);
    } else {
      handleSessionComplete();
    }
  }, [
    currentAyah, learner, surahNumber, updatePracticeStatus, addXP,
    showToast, incrementTotalAyahsMemorized, checkAndUpdateStreak,
    updateDailyGoal, activeSession, recordAyahCompleted, isLastAyah, animateStep,
  ]);

  const handleTryAgain = useCallback(() => {
    animateStep(() => setStep('listen'));
  }, [animateStep]);

  const handleSessionComplete = useCallback(() => {
    if (learner) {
      incrementTotalSessions(learner.id);
      addXP(learner.id, 'session_completed');
    }
    const summary = endSession();
    if (summary && sessionId) {
      navigation.replace('SessionSummary', {sessionId: summary.id});
    } else {
      navigation.goBack();
    }
  }, [learner, incrementTotalSessions, addXP, endSession, navigation, sessionId]);

  function handleBreakContinue() {
    setShowBreakModal(false);
    resumeStudy();
  }

  function handleBreakEndSession() {
    setShowBreakModal(false);
    handleSessionComplete();
  }

  if (loading || !currentAyah) {
    return (
      <ScreenWrapper>
        <View style={[styles.loading, {backgroundColor: colors.background}]}>
          <Text style={[styles.loadingText, {color: colors.textMuted}]}>Loading ayahs…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const stepMeta = STEP_META[step];
  const stepIdx = STEPS.indexOf(step);
  const isDoneStep = step === 'done';
  const isFromMemory = step === 'from_memory';
  const hideArabic = isFromMemory && !showArabic;

  return (
    <ScreenWrapper>
      {/* Session timer bar */}
      {activeSession && (
        <SessionTimerBar
          onEnd={() =>
            Alert.alert('End Session?', 'This will end your current session.', [
              {text: 'Cancel', style: 'cancel'},
              {text: 'End', style: 'destructive', onPress: handleSessionComplete},
            ])
          }
        />
      )}

      {/* XP Toast */}
      <XPToast xp={xpToastXP} visible={xpToastVisible} />

      {/* Progress header */}
      <View style={[styles.progressHeader, {backgroundColor: colors.surface, borderBottomColor: colors.border}]}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Leave?', 'Your progress on the current ayah will be lost.', [
              {text: 'Stay', style: 'cancel'},
              {text: 'Leave', style: 'destructive', onPress: () => navigation.goBack()},
            ])
          }
          accessibilityLabel="Go back"
          style={styles.backBtn}>
          <Text style={[styles.backText, {color: colors.textMuted}]}>✕</Text>
        </TouchableOpacity>

        <View style={styles.progressInfo}>
          <Text style={[styles.progressLabel, {color: colors.textMuted}]}>
            Ayah {ayahIdx + 1} of {ayahs.length}
          </Text>
          {/* Step dots */}
          <View style={styles.dots}>
            {STEPS.slice(0, -1).map((s, i) => (
              <View
                key={s}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i < stepIdx
                        ? colors.memorized
                        : i === stepIdx
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <Text style={[styles.stepBadge, {color: colors.accent}]}>
          {activeSession ? `⚡ ${activeSession.xpEarnedThisSession}` : ''}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.stepCard, {opacity: stepAnim}]}>
          {/* Step indicator */}
          <View style={[styles.stepIndicator, {backgroundColor: colors.primary + '15'}]}>
            <Text style={styles.stepEmoji}>{stepMeta.emoji}</Text>
            <View>
              <Text style={[styles.stepTitle, {color: colors.primary}]}>
                {stepMeta.title}
              </Text>
              <Text style={[styles.stepInstruction, {color: colors.textMuted}]}>
                {stepMeta.instruction}
              </Text>
            </View>
          </View>

          {/* Arabic text */}
          {!isDoneStep && (
            <View style={[styles.arabicBlock, {backgroundColor: colors.surfaceAlt, borderColor: colors.border}]}>
              {hideArabic ? (
                <TouchableOpacity
                  onPress={() => setShowArabic(true)}
                  accessibilityLabel="Show ayah text"
                  style={[styles.hiddenText, {borderColor: colors.border}]}>
                  <Text style={[styles.hiddenHint, {color: colors.textMuted}]}>
                    👁️ Tap to reveal
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text
                    style={[
                      styles.arabicText,
                      {color: colors.textArabic},
                    ]}
                    textBreakStrategy="balanced">
                    {currentAyah.arabicText}
                  </Text>
                  {currentAyah.transliteration && (
                    <Text style={[styles.translitText, {color: colors.textSecondary}]}>
                      {currentAyah.transliteration}
                    </Text>
                  )}
                  {currentAyah.englishMeaning && (
                    <Text style={[styles.meaningText, {color: colors.textMuted}]}>
                      "{currentAyah.englishMeaning}"
                    </Text>
                  )}
                  <Text style={[styles.ayahRef, {color: colors.textMuted}]}>
                    {currentAyah.surahNumber}:{currentAyah.ayahNumber}
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Done celebration */}
          {isDoneStep && (
            <View style={styles.doneBlock}>
              <Text style={styles.doneEmoji}>🎉</Text>
              <Text style={[styles.doneTitle, {color: colors.textPrimary}]}>
                Ayah Memorized!
              </Text>
              <Text style={[styles.doneSub, {color: colors.textMuted}]}>
                {isLastAyah
                  ? 'All ayahs complete! Great session!'
                  : 'Moving to next ayah…'}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {/* Play button (on listen/read_along/repeat steps) */}
            {(step === 'listen' || step === 'read_along' || step === 'repeat') && (
              <TouchableOpacity
                onPress={handlePlay}
                disabled={isPlaying}
                accessibilityLabel={isPlaying ? 'Playing' : 'Play ayah'}
                style={[
                  styles.playBtn,
                  {
                    backgroundColor: isPlaying ? colors.border : colors.primary,
                  },
                ]}>
                <Text style={[styles.playBtnText, {color: colors.textInverse}]}>
                  {isPlaying ? '▶ Playing…' : '▶ Play'}
                </Text>
              </TouchableOpacity>
            )}

            {/* From memory: show/hide + I got it + try again */}
            {isFromMemory && (
              <View style={styles.memoryBtns}>
                {!showArabic && (
                  <TouchableOpacity
                    onPress={() => setShowArabic(true)}
                    accessibilityLabel="Show text"
                    style={[styles.hintBtn, {borderColor: colors.border}]}>
                    <Text style={[styles.hintBtnText, {color: colors.textMuted}]}>
                      👁️ Show Text
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setShowArabic(false);
                    handlePlay();
                  }}
                  accessibilityLabel="Play audio hint"
                  style={[styles.hintBtn, {borderColor: colors.border}]}>
                  <Text style={[styles.hintBtnText, {color: colors.textMuted}]}>
                    🎧 Audio Hint
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Primary advance button */}
            {!isDoneStep && (
              <TouchableOpacity
                onPress={
                  step === 'from_memory'
                    ? advanceStep
                    : advanceStep
                }
                accessibilityLabel={step === 'from_memory' ? 'I got it!' : 'Continue'}
                style={[styles.continueBtn, {backgroundColor: colors.primary}]}>
                <Text style={[styles.continueBtnText, {color: colors.textInverse}]}>
                  {step === 'from_memory' ? '✅ I Got It!' : 'Continue →'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Try again on from_memory */}
            {isFromMemory && (
              <TouchableOpacity
                onPress={handleTryAgain}
                accessibilityLabel="Try again from the beginning"
                style={[styles.tryAgainBtn, {borderColor: colors.border}]}>
                <Text style={[styles.tryAgainText, {color: colors.textMuted}]}>
                  🔄 Try Again
                </Text>
              </TouchableOpacity>
            )}

            {/* Done: next ayah or finish */}
            {isDoneStep && isLastAyah && (
              <TouchableOpacity
                onPress={handleSessionComplete}
                accessibilityLabel="Finish session"
                style={[styles.continueBtn, {backgroundColor: colors.memorized}]}>
                <Text style={[styles.continueBtnText, {color: colors.textInverse}]}>
                  🎉 Finish Session
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <BreakModal
        visible={showBreakModal}
        onContinue={handleBreakContinue}
        onEndSession={handleBreakEndSession}
        xpEarned={activeSession?.xpEarnedThisSession ?? 0}
        ayahsCompleted={activeSession?.ayahsCompletedThisSession ?? 0}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {fontSize: 16},
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {padding: 4},
  backText: {fontSize: 18, fontWeight: '700'},
  progressInfo: {flex: 1, alignItems: 'center', gap: 6},
  progressLabel: {fontSize: 12, fontWeight: '600'},
  dots: {flexDirection: 'row', gap: 6},
  dot: {width: 8, height: 8, borderRadius: 4},
  stepBadge: {fontSize: 13, fontWeight: '700', minWidth: 60, textAlign: 'right'},
  scrollContent: {padding: 16, flexGrow: 1},
  stepCard: {gap: 16},
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  stepEmoji: {fontSize: 28, lineHeight: 36},
  stepTitle: {fontSize: 18, fontWeight: '800'},
  stepInstruction: {fontSize: 13, marginTop: 2, lineHeight: 18},
  arabicBlock: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    alignItems: 'flex-end',
  },
  arabicText: {
    fontSize: 28,
    fontFamily: 'System',
    lineHeight: 48,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translitText: {fontSize: 14, textAlign: 'left', alignSelf: 'flex-start', fontStyle: 'italic'},
  meaningText: {fontSize: 14, textAlign: 'left', alignSelf: 'flex-start', lineHeight: 20},
  ayahRef: {fontSize: 12, alignSelf: 'flex-start'},
  hiddenText: {
    width: '100%',
    paddingVertical: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenHint: {fontSize: 16},
  doneBlock: {alignItems: 'center', gap: 8, paddingVertical: 24},
  doneEmoji: {fontSize: 64},
  doneTitle: {fontSize: 24, fontWeight: '800'},
  doneSub: {fontSize: 14, textAlign: 'center'},
  actions: {gap: 10, marginTop: 8},
  playBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  playBtnText: {fontSize: 16, fontWeight: '700'},
  memoryBtns: {flexDirection: 'row', gap: 10},
  hintBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  hintBtnText: {fontSize: 13, fontWeight: '600'},
  continueBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueBtnText: {fontSize: 16, fontWeight: '800'},
  tryAgainBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  tryAgainText: {fontSize: 14, fontWeight: '600'},
});
