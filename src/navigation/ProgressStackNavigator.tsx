import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {ProgressStackParamList} from '../types';
import {useTheme} from '../theme';
import {ProgressReportsScreen} from '../screens/progress/ProgressReportsScreen';
import {LearnerReportScreen} from '../screens/progress/LearnerReportScreen';

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export function ProgressStackNavigator() {
  const theme = useTheme();
  const c = theme.colors;
  const headerStyle = {backgroundColor: c.surface, headerTintColor: c.primary, headerTitleStyle: {color: c.textPrimary, fontWeight: '600' as const}};
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="ProgressReports" component={ProgressReportsScreen} options={{title: 'Progress'}} />
      <Stack.Screen name="LearnerReport" component={LearnerReportScreen} options={{title: 'Learner Report'}} />
      <Stack.Screen name="SurahReport" component={LearnerReportScreen} options={{title: 'Surah Report'}} />
    </Stack.Navigator>
  );
}
