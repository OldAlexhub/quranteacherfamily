import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {SettingsStackParamList} from '../types';
import {useTheme} from '../theme';
import {SettingsScreen} from '../screens/settings/SettingsScreen';
import {AudioSettingsScreen} from '../screens/settings/AudioSettingsScreen';
import {AboutScreen} from '../screens/about/AboutScreen';
import {AttributionScreen} from '../screens/about/AttributionScreen';
import {PrivacyPolicyScreen} from '../screens/about/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  const theme = useTheme();
  const c = theme.colors;
  const headerStyle = {backgroundColor: c.surface, headerTintColor: c.primary, headerTitleStyle: {color: c.textPrimary, fontWeight: '600' as const}};
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="Settings" component={SettingsScreen} options={{title: 'Settings'}} />
      <Stack.Screen name="AudioSettings" component={AudioSettingsScreen} options={{title: 'Audio'}} />
      <Stack.Screen name="About" component={AboutScreen} options={{title: 'About'}} />
      <Stack.Screen name="Attribution" component={AttributionScreen} options={{title: 'Content Sources'}} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{title: 'Privacy Policy'}} />
    </Stack.Navigator>
  );
}
