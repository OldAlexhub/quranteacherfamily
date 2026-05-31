export * from './colors';
export * from './typography';
export * from './spacing';

import React, {createContext, useContext} from 'react';
import {getColors, type ColorScheme, type ThemeType} from './colors';
import {ArabicFontSizeDefaults, EnglishMeaningFontSizeDefaults} from './typography';

export interface AppTheme {
  colors: ColorScheme;
  themeType: ThemeType;
  arabicFontSize: number;
  englishFontSize: number;
}

export const ThemeContext = createContext<AppTheme>({
  colors: getColors('light'),
  themeType: 'light',
  arabicFontSize: ArabicFontSizeDefaults.medium,
  englishFontSize: EnglishMeaningFontSizeDefaults.medium,
});

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}

export function buildTheme(
  themeType: ThemeType,
  arabicFontSize: number,
  englishFontSize: number,
): AppTheme {
  return {
    colors: getColors(themeType),
    themeType,
    arabicFontSize,
    englishFontSize,
  };
}
