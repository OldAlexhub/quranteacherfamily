import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {QuranStackParamList} from '../types';
import {useTheme} from '../theme';
import {SurahListScreen} from '../screens/quran/SurahListScreen';
import {QuranReaderScreen} from '../screens/quran/QuranReaderScreen';
import {AyahDetailScreen} from '../screens/quran/AyahDetailScreen';
import {WordTeacherModeScreen} from '../screens/quran/WordTeacherModeScreen';

const Stack = createNativeStackNavigator<QuranStackParamList>();

export function QuranStackNavigator() {
  const theme = useTheme();
  const c = theme.colors;
  const headerStyle = {
    backgroundColor: c.surface,
    headerTintColor: c.primary,
    headerTitleStyle: {color: c.textPrimary, fontWeight: '600' as const},
  };
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="SurahList" component={SurahListScreen} options={{title: 'Quran'}} />
      <Stack.Screen name="QuranReader" component={QuranReaderScreen} options={{title: ''}} />
      <Stack.Screen name="AyahDetail" component={AyahDetailScreen} options={{title: 'Ayah Detail'}} />
      <Stack.Screen name="WordTeacherMode" component={WordTeacherModeScreen} options={{title: 'Word Practice'}} />
    </Stack.Navigator>
  );
}
