import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../theme';
import {getXPForNextLevel} from '../../store/useGamificationStore';

interface Props {
  xp: number;
  level: number;
  showLabel?: boolean;
  compact?: boolean;
}

export function XPProgressBar({xp, level, showLabel = true, compact = false}: Props) {
  const {colors} = useTheme();
  const {current, needed} = getXPForNextLevel(xp);
  const pct = needed > 0 ? Math.min(current / needed, 1) : 1;

  return (
    <View style={styles.wrapper}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, {color: colors.textSecondary}]}>
            Level {level}
          </Text>
          <Text style={[styles.xpText, {color: colors.accent}]}>
            {current} / {needed} XP
          </Text>
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height: compact ? 6 : 10,
            backgroundColor: colors.border,
            borderRadius: compact ? 3 : 5,
          },
        ]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.round(pct * 100)}%`,
              backgroundColor: colors.accent,
              borderRadius: compact ? 3 : 5,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {gap: 4},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {fontSize: 12, fontWeight: '600'},
  xpText: {fontSize: 11, fontWeight: '700'},
  track: {width: '100%', overflow: 'hidden'},
  fill: {height: '100%'},
});
