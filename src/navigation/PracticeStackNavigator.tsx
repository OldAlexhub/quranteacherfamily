import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {PracticeStackParamList} from '../types';
import {useTheme} from '../theme';
import {PracticeHomeScreen} from '../screens/practice/PracticeHomeScreen';
import {RepeatPracticeScreen} from '../screens/practice/RepeatPracticeScreen';
import {MemorizationTrackerScreen} from '../screens/practice/MemorizationTrackerScreen';

const Stack = createNativeStackNavigator<PracticeStackParamList>();

export function PracticeStackNavigator() {
  const theme = useTheme();
  const c = theme.colors;
  const headerStyle = {backgroundColor: c.surface, headerTintColor: c.primary, headerTitleStyle: {color: c.textPrimary, fontWeight: '600' as const}};
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="PracticeHome" component={PracticeHomeScreen} options={{title: 'Practice'}} />
      <Stack.Screen name="RepeatPractice" component={RepeatPracticeScreen} options={{title: 'Repeat Practice'}} />
      <Stack.Screen name="MemorizationTracker" component={MemorizationTrackerScreen} options={{title: 'Memorization'}} />
    </Stack.Navigator>
  );
}
