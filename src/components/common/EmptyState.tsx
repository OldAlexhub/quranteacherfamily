import React from 'react';
import {View, ViewStyle} from 'react-native';
import {AppText} from './AppText';
import {AppButton} from './AppButton';
import {Spacing} from '../../theme/spacing';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: {label: string; onPress: () => void};
  style?: ViewStyle;
}

export function EmptyState({title, subtitle, action, style}: EmptyStateProps) {
  return (
    <View style={[{alignItems: 'center', paddingVertical: 48, paddingHorizontal: Spacing[6]}, style]}>
      <AppText variant="heading" center style={{marginBottom: 8}}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" center style={{marginBottom: action ? 24 : 0, opacity: 0.7}}>
          {subtitle}
        </AppText>
      ) : null}
      {action ? <AppButton label={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}
