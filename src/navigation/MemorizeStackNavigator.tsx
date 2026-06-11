import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {MemorizeStackParamList} from '../types';
import {useTheme} from '../theme';
import {MemorizeHomeScreen} from '../screens/memorize/MemorizeHomeScreen';
import {MemorizeFlowScreen} from '../screens/memorize/MemorizeFlowScreen';
import {SessionSummaryScreen} from '../screens/session/SessionSummaryScreen';
import {MemorizationTrackerScreen} from '../screens/practice/MemorizationTrackerScreen';
import {RepeatPracticeScreen} from '../screens/practice/RepeatPracticeScreen';

const Stack = createNativeStackNavigator<MemorizeStackParamList>();

export function MemorizeStackNavigator() {
  const {colors} = useTheme();
  const headerStyle = {
    backgroundColor: colors.surface,
    headerTintColor: colors.primary,
    headerTitleStyle: {color: colors.textPrimary, fontWeight: '600' as const},
  };

  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen
        name="MemorizeHome"
        component={MemorizeHomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="MemorizeFlow"
        component={MemorizeFlowScreen}
        options={{headerShown: false, gestureEnabled: false}}
      />
      <Stack.Screen
        name="SessionSummary"
        component={SessionSummaryScreen}
        options={{title: 'Session Complete', gestureEnabled: false}}
      />
      <Stack.Screen
        name="MemorizationTracker"
        component={MemorizationTrackerScreen}
        options={{title: 'Memorization Tracker'}}
      />
      <Stack.Screen
        name="RepeatPractice"
        component={RepeatPracticeScreen}
        options={{title: 'Repeat Practice'}}
      />
    </Stack.Navigator>
  );
}
