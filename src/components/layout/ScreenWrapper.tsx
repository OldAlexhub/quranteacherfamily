import React from 'react';
import {ScrollView, View, ViewStyle, RefreshControl} from 'react-native';
import {SafeAreaView, type Edge} from 'react-native-safe-area-context';
import {useTheme} from '../../theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
  safeAreaEdges?: Edge[];
}

export function ScreenWrapper({
  children,
  scrollable = true,
  style,
  contentStyle,
  onRefresh,
  refreshing = false,
  safeAreaEdges = ['left', 'right'],
}: ScreenWrapperProps) {
  const theme = useTheme();
  const c = theme.colors;

  const bg: ViewStyle = {flex: 1, backgroundColor: c.background};

  if (scrollable) {
    return (
      <SafeAreaView style={[bg, style]} edges={safeAreaEdges}>
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={[{padding: 16, paddingBottom: 32}, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[bg, style]} edges={safeAreaEdges}>
      <View style={[{flex: 1}, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}
