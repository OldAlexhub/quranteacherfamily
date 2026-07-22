import React from 'react';
import {View, ViewStyle} from 'react-native';
import {useTheme} from '../../theme';
import {Radii, Shadows, Spacing} from '../../theme/spacing';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevated?: boolean;
}

export function AppCard({children, style, padding, elevated = true}: AppCardProps) {
  const theme = useTheme();
  const c = theme.colors;

  const cardStyle: ViewStyle = {
    backgroundColor: c.surface,
    borderRadius: Radii.lg,
    padding: padding ?? Spacing[4],
    ...(elevated ? Shadows.sm : {}),
    borderWidth: 1,
    borderColor: c.border,
  };

  return <View style={[cardStyle, style]}>{children}</View>;
}
