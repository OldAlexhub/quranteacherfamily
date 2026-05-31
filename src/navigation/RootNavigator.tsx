import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import {usePreferencesStore} from '../store/usePreferencesStore';
import {useTheme} from '../theme';
import {MainTabNavigator} from './MainTabNavigator';
import {OnboardingScreen} from '../screens/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const onboardingCompleted = usePreferencesStore(s => s.preferences.onboardingCompleted);
  const theme = useTheme();
  const c = theme.colors;

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: c.background,
      card: c.surface,
      text: c.textPrimary,
      border: c.border,
      primary: c.primary,
      notification: c.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!onboardingCompleted ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
