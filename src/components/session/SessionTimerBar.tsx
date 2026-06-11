import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../theme';
import {useSessionStore} from '../../store/useSessionStore';

interface Props {
  onPause?: () => void;
  onEnd?: () => void;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function SessionTimerBar({onPause, onEnd}: Props) {
  const {colors} = useTheme();
  const session = useSessionStore(s => s.activeSession);
  const remainingStudy = useSessionStore(s => s.getRemainingStudySeconds());
  const remainingBreak = useSessionStore(s => s.getRemainingBreakSeconds());

  if (!session || session.phase === 'idle' || session.phase === 'completed') {
    return null;
  }

  const isBreak = session.phase === 'break';
  const remaining = isBreak ? remainingBreak : remainingStudy;
  const totalSecs = isBreak
    ? session.breakDurationMinutes * 60
    : session.studyDurationMinutes * 60;
  const pct = totalSecs > 0 ? 1 - remaining / totalSecs : 0;

  const barColor = isBreak ? colors.info : colors.primary;
  const bgColor = isBreak ? colors.info + '18' : colors.primary + '12';

  return (
    <View style={[styles.container, {backgroundColor: bgColor, borderBottomColor: colors.border}]}>
      {/* Progress track */}
      <View style={[styles.track, {backgroundColor: colors.border}]}>
        <View style={[styles.trackFill, {width: `${Math.round(pct * 100)}%`, backgroundColor: barColor}]} />
      </View>

      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={[styles.phase, {color: barColor}]}>
            {isBreak ? '☕ Break' : '📖 Studying'}
          </Text>
          <Text style={[styles.timer, {color: colors.textPrimary}]}>
            {formatTime(remaining)}
          </Text>
        </View>

        <View style={styles.center}>
          <Text style={[styles.xp, {color: colors.accent}]}>
            ⚡ {session.xpEarnedThisSession} XP
          </Text>
          <Text style={[styles.ayahs, {color: colors.textMuted}]}>
            {session.ayahsCompletedThisSession} ayahs
          </Text>
        </View>

        <View style={styles.right}>
          {onPause && !isBreak && (
            <TouchableOpacity
              onPress={onPause}
              accessibilityLabel="Pause session"
              style={[styles.btn, {borderColor: barColor}]}>
              <Text style={[styles.btnText, {color: barColor}]}>⏸</Text>
            </TouchableOpacity>
          )}
          {onEnd && (
            <TouchableOpacity
              onPress={onEnd}
              accessibilityLabel="End session"
              style={[styles.btn, {borderColor: colors.error}]}>
              <Text style={[styles.btnText, {color: colors.error}]}>■</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {borderBottomWidth: 1},
  track: {height: 3, width: '100%'},
  trackFill: {height: 3},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  left: {gap: 1},
  center: {alignItems: 'center', gap: 1},
  right: {flexDirection: 'row', gap: 6},
  phase: {fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5},
  timer: {fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums']},
  xp: {fontSize: 13, fontWeight: '700'},
  ayahs: {fontSize: 11},
  btn: {
    width: 28,
    height: 28,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {fontSize: 12, fontWeight: '700'},
});
