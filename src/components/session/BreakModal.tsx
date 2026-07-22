import React, {useEffect, useRef} from 'react';
import {Modal, View, Text, StyleSheet, Animated} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../theme';
import {AppButton} from '../common/AppButton';
import {useSessionStore} from '../../store/useSessionStore';

interface Props {
  visible: boolean;
  onContinue: () => void;
  onEndSession: () => void;
  xpEarned: number;
  ayahsCompleted: number;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function BreakModal({visible, onContinue, onEndSession, xpEarned, ayahsCompleted}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const remainingBreak = useSessionStore(s => s.getRemainingBreakSeconds());
  const session = useSessionStore(s => s.activeSession);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  const breakTotal = session ? session.breakDurationMinutes * 60 : 300;
  const pct = breakTotal > 0 ? Math.max(0, 1 - remainingBreak / breakTotal) : 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onContinue}>
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: colors.modalBackground,
            paddingTop: Math.max(24, insets.top + 12),
            paddingRight: Math.max(24, insets.right + 12),
            paddingBottom: Math.max(24, insets.bottom + 12),
            paddingLeft: Math.max(24, insets.left + 12),
          },
        ]}>
        <Animated.View
          style={[styles.card, {backgroundColor: colors.surface, opacity: fadeAnim}]}>
          <Text style={styles.emoji}>☕</Text>
          <Text style={[styles.title, {color: colors.textPrimary}]}>
            Time for a Break!
          </Text>
          <Text style={[styles.subtitle, {color: colors.textMuted}]}>
            Great work! Rest your mind for a moment.
          </Text>

          {/* Break countdown ring */}
          <View style={[styles.timerRing, {borderColor: colors.info + '44', backgroundColor: colors.info + '11'}]}>
            <Text style={[styles.timerText, {color: colors.info}]}>
              {formatTime(remainingBreak)}
            </Text>
            <Text style={[styles.timerLabel, {color: colors.textMuted}]}>remaining</Text>
          </View>

          {/* Break progress bar */}
          <View style={[styles.track, {backgroundColor: colors.border}]}>
            <View
              style={[
                styles.trackFill,
                {width: `${Math.round(pct * 100)}%`, backgroundColor: colors.info},
              ]}
            />
          </View>

          {/* Session so far */}
          <View style={[styles.stats, {backgroundColor: colors.surfaceAlt, borderColor: colors.border}]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: colors.accent}]}>⚡ {xpEarned}</Text>
              <Text style={[styles.statLabel, {color: colors.textMuted}]}>XP earned</Text>
            </View>
            <View style={[styles.divider, {backgroundColor: colors.border}]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: colors.primary}]}>{ayahsCompleted}</Text>
              <Text style={[styles.statLabel, {color: colors.textMuted}]}>ayahs done</Text>
            </View>
          </View>

          <AppButton
            label="Continue Studying ▶"
            variant="primary"
            size="lg"
            fullWidth
            onPress={onContinue}
          />
          <AppButton
            label="End Session"
            variant="ghost"
            size="md"
            fullWidth
            onPress={onEndSession}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  emoji: {fontSize: 56, lineHeight: 68},
  title: {fontSize: 26, fontWeight: '800', textAlign: 'center'},
  subtitle: {fontSize: 14, textAlign: 'center', lineHeight: 20},
  timerRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums']},
  timerLabel: {fontSize: 11},
  track: {width: '100%', height: 8, borderRadius: 4, overflow: 'hidden'},
  trackFill: {height: 8},
  stats: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-around',
  },
  statItem: {alignItems: 'center', gap: 2},
  statValue: {fontSize: 20, fontWeight: '800'},
  statLabel: {fontSize: 11},
  divider: {width: 1, marginVertical: 4},
});
