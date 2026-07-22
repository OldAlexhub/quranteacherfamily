import React from 'react';
import {StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Circle, Path} from 'react-native-svg';
import type {MainTabParamList} from '../types';
import {useTheme} from '../theme';
import {HomeStackNavigator} from './HomeStackNavigator';
import {QuranStackNavigator} from './QuranStackNavigator';
import {MemorizeStackNavigator} from './MemorizeStackNavigator';
import {ProgressStackNavigator} from './ProgressStackNavigator';
import {SettingsStackNavigator} from './SettingsStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconName = 'home' | 'quran' | 'practice' | 'progress' | 'settings';

function TabIcon({name, focused, color}: {name: TabIconName; focused: boolean; color: string}) {
  const strokeWidth = focused ? 2.3 : 1.9;
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" accessibilityElementsHidden>
      {name === 'home' && (
        <>
          <Path {...common} d="M3 10.5 12 3l9 7.5" />
          <Path {...common} d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6" />
        </>
      )}
      {name === 'quran' && (
        <>
          <Path {...common} d="M3.5 5.5c3.2-1 6-.5 8.5 1.5v13c-2.5-2-5.3-2.5-8.5-1.5z" />
          <Path {...common} d="M20.5 5.5c-3.2-1-6-.5-8.5 1.5v13c2.5-2 5.3-2.5 8.5-1.5z" />
        </>
      )}
      {name === 'practice' && (
        <>
          <Circle {...common} cx="12" cy="12" r="8.5" />
          <Circle {...common} cx="12" cy="12" r="4.5" />
          <Circle cx="12" cy="12" r="1.7" fill={color} />
        </>
      )}
      {name === 'progress' && (
        <>
          <Path {...common} d="M4 20V5M4 20h16" />
          <Path {...common} d="m7 16 4-4 3 2 5-6" />
        </>
      )}
      {name === 'settings' && (
        <>
          <Path {...common} d="M4 7h5M15 7h5M4 17h9M19 17h1" />
          <Circle {...common} cx="12" cy="7" r="3" />
          <Circle {...common} cx="16" cy="17" r="3" />
        </>
      )}
    </Svg>
  );
}

export function MainTabNavigator() {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          {
            backgroundColor: c.surface,
            borderTopColor: c.border,
            height: 58 + insets.bottom,
            paddingBottom: insets.bottom + 4,
            paddingTop: 5,
          },
          route.name === 'MemorizeTab' &&
          getFocusedRouteNameFromRoute(route) === 'MemorizeFlow'
            ? styles.hiddenTabBar
            : undefined,
        ],
        tabBarItemStyle: styles.tabItem,
        tabBarActiveBackgroundColor: c.primary + '10',
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{tabBarLabel: 'Today', tabBarIcon: ({focused, color}) => <TabIcon name="home" focused={focused} color={color} />}}
      />
      <Tab.Screen
        name="QuranTab"
        component={QuranStackNavigator}
        options={{tabBarLabel: 'Quran', tabBarIcon: ({focused, color}) => <TabIcon name="quran" focused={focused} color={color} />}}
      />
      <Tab.Screen
        name="MemorizeTab"
        component={MemorizeStackNavigator}
        options={{tabBarLabel: 'Practice', tabBarIcon: ({focused, color}) => <TabIcon name="practice" focused={focused} color={color} />}}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressStackNavigator}
        options={{tabBarLabel: 'Progress', tabBarIcon: ({focused, color}) => <TabIcon name="progress" focused={focused} color={color} />}}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{tabBarLabel: 'Settings', tabBarIcon: ({focused, color}) => <TabIcon name="settings" focused={focused} color={color} />}}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  hiddenTabBar: {display: 'none'},
  tabItem: {borderRadius: 12, marginHorizontal: 2},
  tabLabel: {fontSize: 11, fontWeight: '600'},
});
