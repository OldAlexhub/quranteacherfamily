import React from 'react';
import {View, ViewStyle} from 'react-native';
import {useTheme} from '../../theme';
import {Radii} from '../../theme/spacing';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  style?: ViewStyle;
}

export function ProgressBar({progress, height = 8, color, style}: ProgressBarProps) {
  const theme = useTheme();
  const c = theme.colors;
  const clamp = Math.min(1, Math.max(0, progress));

  return (
    <View style={[{height, backgroundColor: c.border, borderRadius: Radii.full, overflow: 'hidden'}, style]}>
      <View
        style={{
          height: '100%',
          width: `${clamp * 100}%`,
          backgroundColor: color ?? c.primary,
          borderRadius: Radii.full,
        }}
      />
    </View>
  );
}
