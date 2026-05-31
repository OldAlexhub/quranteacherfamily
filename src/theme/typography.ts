export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 40,
  '5xl': 48,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.8,
  loose: 2.2,
  arabic: 2.5,
};

export const ArabicFontSizeDefaults = {
  small: 22,
  medium: 28,
  large: 34,
  xlarge: 40,
};

export const EnglishMeaningFontSizeDefaults = {
  small: 13,
  medium: 15,
  large: 17,
};

export type ArabicFontSize = keyof typeof ArabicFontSizeDefaults;
export type EnglishFontSize = keyof typeof EnglishMeaningFontSizeDefaults;
