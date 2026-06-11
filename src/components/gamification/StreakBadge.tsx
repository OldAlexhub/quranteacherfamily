import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../theme';

interface Props {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({streak, size = 'md'}: Props) {
  const {colors} = useTheme();
  const isActive = streak > 0;

  const sizeMap = {
    sm: {container: 36, emoji: 16, count: 11},
    md: {container: 52, emoji: 22, count: 14},
    lg: {container: 70, emoji: 30, count: 18},
  };
  const s = sizeMap[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: s.container,
          height: s.container,
          borderRadius: s.container / 2,
          backgroundColor: isActive ? colors.accent + '22' : colors.surfaceAlt,
          borderColor: isActive ? colors.accent : colors.border,
        },
      ]}>
      <Text style={{fontSize: s.emoji, lineHeight: s.emoji + 4}}>
        {isActive ? '🔥' : '💤'}
      </Text>
      <Text
        style={[
          styles.count,
          {fontSize: s.count, color: isActive ? colors.accent : colors.textMuted},
        ]}>
        {streak}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  count: {
    fontWeight: '700',
    lineHeight: 14,
  },
});
