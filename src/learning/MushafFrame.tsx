// @refresh reset
import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';

// Original scalable ornament; the decoration never changes the Quran text.
export function MushafFrame({ children }: { children: React.ReactNode }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      style={frame.outer}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setSize(old =>
          old.width === width && old.height === height
            ? old
            : { width, height },
        );
      }}
    >
      <Svg
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
        width={size.width}
        height={size.height}
      >
        <Defs>
          <Pattern
            id="vine"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <Rect width="36" height="36" fill="#245D47" />
            <Path
              d="M0 18Q9 0 18 18T36 18M18 0Q0 9 18 18T18 36"
              fill="none"
              stroke="#D9C88A"
              strokeWidth="1"
            />
            <Path
              d="M18 18Q3 18 6 6Q18 3 18 18Q18 3 30 6Q33 18 18 18Q33 18 30 30Q18 33 18 18Q18 33 6 30Q3 18 18 18"
              fill="#97BA8E"
              stroke="#EDF0D0"
              strokeWidth=".6"
            />
            <Circle cx="18" cy="18" r="4" fill="#E5C06E" />
            <Circle cx="18" cy="18" r="1.4" fill="#FFF5D9" />
          </Pattern>
        </Defs>
        <Rect
          x="2"
          y="2"
          width={Math.max(0, size.width - 4)}
          height={Math.max(0, size.height - 4)}
          rx="5"
          fill="url(#vine)"
          stroke="#D2B56D"
          strokeWidth="2"
        />
      </Svg>
      <View style={frame.inner}>{children}</View>
    </View>
  );
}
export function SurahOrnament({ title }: { title: string }) {
  const flower = (
    <Svg width={34} height={34} viewBox="0 0 40 40" accessibilityElementsHidden>
      <Path
        d="M20 3L25 13L37 20L25 27L20 37L15 27L3 20L15 13Z"
        fill="#CDB473"
        stroke="#6B8C66"
      />
      <Circle cx="20" cy="20" r="8" fill="#E7EBCF" />
      <Circle cx="20" cy="20" r="4" fill="#44765B" />
    </Svg>
  );
  return (
    <View style={frame.heading}>
      {flower}
      <Text accessibilityRole="header" style={frame.title}>
        {title}
      </Text>
      {flower}
    </View>
  );
}
const frame = StyleSheet.create({
  outer: {
    padding: 15,
    backgroundColor: '#245D47',
    borderRadius: 6,
    shadowColor: '#163C2E',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  inner: {
    backgroundColor: '#FFFCED',
    borderWidth: 2,
    borderColor: '#C9B77C',
    padding: 10,
    minHeight: 350,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#B8BE8B',
    backgroundColor: '#EEF0D9',
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 25,
    lineHeight: 40,
    textAlign: 'center',
    color: '#214B37',
    writingDirection: 'rtl',
  },
});
