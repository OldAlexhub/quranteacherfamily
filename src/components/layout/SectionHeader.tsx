import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {AppText} from '../common/AppText';
import {Spacing} from '../../theme/spacing';
import {useTheme} from '../../theme';

interface SectionHeaderProps {
  title: string;
  action?: {label: string; onPress: () => void};
}

export function SectionHeader({title, action}: SectionHeaderProps) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[3]}}>
      <AppText variant="subheading" weight="semibold">{title}</AppText>
      {action ? (
        <TouchableOpacity onPress={action.onPress}>
          <AppText variant="caption" style={{color: c.primary}}>{action.label}</AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
