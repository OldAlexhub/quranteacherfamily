import React from 'react';
import {Text, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {MainTabParamList} from '../types';
import {useTheme} from '../theme';
import {HomeStackNavigator} from './HomeStackNavigator';
import {QuranStackNavigator} from './QuranStackNavigator';
import {PracticeStackNavigator} from './PracticeStackNavigator';
import {ProgressStackNavigator} from './ProgressStackNavigator';
import {SettingsStackNavigator} from './SettingsStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({symbol, focused, color}: {symbol: string; focused: boolean; color: string}) {
  return (
    <Text style={{fontSize: focused ? 22 : 20, color, opacity: focused ? 1 : 0.7}}>{symbol}</Text>
  );
}

export function MainTabNavigator() {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          height: 54 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 4,
        },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: {fontSize: 11, fontWeight: '500'},
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{tabBarLabel: 'Home', tabBarIcon: ({focused, color}) => <TabIcon symbol="⌂" focused={focused} color={color} />}}
      />
      <Tab.Screen
        name="QuranTab"
        component={QuranStackNavigator}
        options={{tabBarLabel: 'Quran', tabBarIcon: ({focused, color}) => <TabIcon symbol="📖" focused={focused} color={color} />}}
      />
      <Tab.Screen
        name="PracticeTab"
        component={PracticeStackNavigator}
        options={{tabBarLabel: 'Practice', tabBarIcon: ({focused, color}) => <TabIcon symbol="🔄" focused={focused} color={color} />}}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressStackNavigator}
        options={{tabBarLabel: 'Progress', tabBarIcon: ({focused, color}) => <TabIcon symbol="📊" focused={focused} color={color} />}}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{tabBarLabel: 'Settings', tabBarIcon: ({focused, color}) => <TabIcon symbol="⚙" focused={focused} color={color} />}}
      />
    </Tab.Navigator>
  );
}
