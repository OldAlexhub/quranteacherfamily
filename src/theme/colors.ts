export const LightColors = {
  primary: '#1B4332',
  primaryDark: '#0A2618',
  primaryLight: '#2D6A4F',
  accent: '#D4AF37',
  accentLight: '#F0D060',

  background: '#F8F5EE',
  surface: '#FFFFFF',
  surfaceAlt: '#F2EDE3',
  border: '#E2D9C8',

  textPrimary: '#1A1410',
  textSecondary: '#5C4A2A',
  textMuted: '#9B8A6E',
  textArabic: '#1A1410',
  textEnglish: '#5C4A2A',
  textInverse: '#FFFFFF',

  success: '#2D6A4F',
  warning: '#D4AF37',
  error: '#C0392B',
  info: '#2980B9',

  memorized: '#2D6A4F',
  practicing: '#D4AF37',
  needsReview: '#E74C3C',
  notStarted: '#BDC3C7',

  bookmarkBlue: '#2980B9',
  bookmarkGreen: '#27AE60',
  bookmarkYellow: '#F39C12',
  bookmarkRed: '#E74C3C',

  overlayLight: 'rgba(0,0,0,0.05)',
  overlayMedium: 'rgba(0,0,0,0.2)',
  overlayDark: 'rgba(0,0,0,0.5)',
  modalBackground: 'rgba(0,0,0,0.6)',
};

export const WarmColors = {
  ...LightColors,
  background: '#FDF6E9',
  surface: '#FEFAF2',
  surfaceAlt: '#F5EDDA',
  border: '#E8D9BC',
};

export const DarkColors = {
  primary: '#2D6A4F',
  primaryDark: '#1B4332',
  primaryLight: '#40916C',
  accent: '#D4AF37',
  accentLight: '#F0D060',

  background: '#0D1B0F',
  surface: '#1A2E1F',
  surfaceAlt: '#243328',
  border: '#2D4A34',

  textPrimary: '#F0EBE0',
  textSecondary: '#C8B89A',
  textMuted: '#8A7A62',
  textArabic: '#F0EBE0',
  textEnglish: '#C8B89A',
  textInverse: '#0D1B0F',

  success: '#40916C',
  warning: '#D4AF37',
  error: '#E74C3C',
  info: '#3498DB',

  memorized: '#40916C',
  practicing: '#D4AF37',
  needsReview: '#E74C3C',
  notStarted: '#4A5568',

  bookmarkBlue: '#3498DB',
  bookmarkGreen: '#2ECC71',
  bookmarkYellow: '#F39C12',
  bookmarkRed: '#E74C3C',

  overlayLight: 'rgba(255,255,255,0.05)',
  overlayMedium: 'rgba(255,255,255,0.15)',
  overlayDark: 'rgba(255,255,255,0.3)',
  modalBackground: 'rgba(0,0,0,0.75)',
};

export type ColorScheme = typeof LightColors;
export type ThemeType = 'light' | 'warm' | 'dark';

export function getColors(theme: ThemeType): ColorScheme {
  switch (theme) {
    case 'dark': return DarkColors;
    case 'warm': return WarmColors;
    default: return LightColors;
  }
}
