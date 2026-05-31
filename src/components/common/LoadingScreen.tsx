import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {useTheme} from '../../theme';
import {AppText} from './AppText';

export function LoadingScreen({message}: {message?: string}) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background}}>
      <ActivityIndicator size="large" color={c.primary} />
      {message ? <AppText variant="caption" style={{marginTop: 12}}>{message}</AppText> : null}
    </View>
  );
}
