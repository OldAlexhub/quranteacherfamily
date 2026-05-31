import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

function makeIcon(symbol: string) {
  return function Icon({size = 24, color = '#1B4332'}: IconProps) {
    return (
      <Text style={{fontSize: size * 0.85, color, lineHeight: size, textAlign: 'center'}} accessibilityElementsHidden={true}>
        {symbol}
      </Text>
    );
  };
}

export const Icons = {
  Home: makeIcon('⌂'),
  Quran: makeIcon('📖'),
  Practice: makeIcon('🔄'),
  Progress: makeIcon('📊'),
  Settings: makeIcon('⚙'),
  Play: makeIcon('▶'),
  Pause: makeIcon('⏸'),
  Stop: makeIcon('⏹'),
  Next: makeIcon('⏭'),
  Previous: makeIcon('⏮'),
  Repeat: makeIcon('↻'),
  Bookmark: makeIcon('🔖'),
  BookmarkFilled: makeIcon('🔖'),
  Search: makeIcon('🔍'),
  Add: makeIcon('+'),
  Edit: makeIcon('✎'),
  Delete: makeIcon('✕'),
  Check: makeIcon('✓'),
  ArrowRight: makeIcon('›'),
  ArrowLeft: makeIcon('‹'),
  ArrowUp: makeIcon('›'),
  ArrowDown: makeIcon('›'),
  ChevronRight: makeIcon('›'),
  ChevronDown: makeIcon('⌄'),
  Back: makeIcon('←'),
  Close: makeIcon('✕'),
  Menu: makeIcon('≡'),
  Parent: makeIcon('👤'),
  Learner: makeIcon('👦'),
  Assignment: makeIcon('📋'),
  Note: makeIcon('📝'),
  Export: makeIcon('↑'),
  Reset: makeIcon('↺'),
  Info: makeIcon('ℹ'),
  Warning: makeIcon('⚠'),
  Eye: makeIcon('👁'),
  EyeOff: makeIcon('◯'),
  Clock: makeIcon('⏱'),
  Calendar: makeIcon('📅'),
  Star: makeIcon('★'),
  Word: makeIcon('ا'),
  Audio: makeIcon('🔊'),
  AudioOff: makeIcon('🔇'),
  Speed: makeIcon('⚡'),
  Microphone: makeIcon('🎙'),
  Share: makeIcon('↗'),
};

export type IconName = keyof typeof Icons;

interface AppIconProps extends IconProps {
  name: IconName;
}

export function AppIcon({name, size, color}: AppIconProps) {
  const IconComponent = Icons[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} color={color} />;
}
