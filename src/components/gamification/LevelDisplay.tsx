import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../theme';
import {getLevelTitle} from '../../store/useGamificationStore';

interface Props {
  level: number;
  xp?: number;
  showXP?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelDisplay({level, xp, showXP = false, size = 'md'}: Props) {
  const {colors} = useTheme();
  const title = getLevelTitle(level);

  const sizeMap = {
    sm: {badge: 28, badgeText: 12, title: 11},
    md: {badge: 36, badgeText: 15, title: 13},
    lg: {badge: 48, badgeText: 20, title: 16},
  };
  const s = sizeMap[size];

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.badge,
          {
            width: s.badge,
            height: s.badge,
            borderRadius: s.badge / 2,
            backgroundColor: colors.primary,
          },
        ]}>
        <Text style={[styles.badgeText, {fontSize: s.badgeText, color: colors.textInverse}]}>
          {level}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, {fontSize: s.title, color: colors.textPrimary}]}>
          {title}
        </Text>
        {showXP && xp !== undefined && (
          <Text style={[styles.xp, {color: colors.textMuted}]}>{xp} XP total</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 8},
  badge: {alignItems: 'center', justifyContent: 'center'},
  badgeText: {fontWeight: '800'},
  info: {gap: 1},
  title: {fontWeight: '700'},
  xp: {fontSize: 11},
});
