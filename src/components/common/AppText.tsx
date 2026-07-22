import React from 'react';
import {Text, TextStyle, TextProps} from 'react-native';
import {useTheme} from '../../theme';

interface AppTextProps extends TextProps {
  variant?: 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'muted' | 'inverse';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  arabic?: boolean;
  english?: boolean;
  center?: boolean;
  style?: TextStyle | TextStyle[];
}

export function AppText({
  variant = 'body',
  weight,
  arabic = false,
  english = false,
  center = false,
  style,
  children,
  ...props
}: AppTextProps) {
  const theme = useTheme();
  const c = theme.colors;

  const baseStyle: TextStyle = {
    color: arabic ? c.textArabic : english ? c.textEnglish : variantColor(variant, c),
    fontSize: variantSize(variant),
    fontWeight: weight ? fontWeightMap[weight] : variantWeight(variant),
    textAlign: arabic ? 'right' : center ? 'center' : 'left',
    writingDirection: arabic ? 'rtl' : 'ltr',
    lineHeight: arabic ? variantSize(variant) * 2.5 : variantSize(variant) * 1.5,
  };

  return (
    <Text style={[baseStyle, style]} {...props}>
      {children}
    </Text>
  );
}

function variantColor(variant: string, c: ReturnType<typeof import('../../theme').getColors>) {
  switch (variant) {
    case 'title': case 'heading': case 'subheading': return c.textPrimary;
    case 'muted': return c.textMuted;
    case 'inverse': return c.textInverse;
    default: return c.textPrimary;
  }
}

function variantSize(variant: string): number {
  switch (variant) {
    case 'title': return 26;
    case 'heading': return 20;
    case 'subheading': return 17;
    case 'body': return 15;
    case 'caption': return 13;
    case 'muted': return 13;
    default: return 15;
  }
}

function variantWeight(variant: string): TextStyle['fontWeight'] {
  switch (variant) {
    case 'title': return '700';
    case 'heading': return '600';
    case 'subheading': return '600';
    default: return '400';
  }
}

const fontWeightMap: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
