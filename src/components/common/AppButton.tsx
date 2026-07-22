import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {useTheme} from '../../theme';
import {Radii} from '../../theme/spacing';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  labelStyle,
  accessibilityLabel,
}: AppButtonProps) {
  const theme = useTheme();
  const c = theme.colors;

  const containerStyle: ViewStyle = {
    backgroundColor: variantBg(variant, c),
    borderRadius: Radii.md,
    paddingVertical: size === 'lg' ? 16 : size === 'sm' ? 8 : 12,
    paddingHorizontal: size === 'lg' ? 28 : size === 'sm' ? 14 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: variant === 'ghost' || variant === 'secondary' ? 1.5 : 0,
    borderColor: variant === 'secondary' ? c.primary : variant === 'ghost' ? c.border : 'transparent',
    opacity: disabled ? 0.5 : 1,
    alignSelf: fullWidth ? 'stretch' : 'auto',
  };

  const textStyle: TextStyle = {
    color: variantText(variant, c),
    fontSize: size === 'lg' ? 17 : size === 'sm' ? 13 : 15,
    fontWeight: '600',
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={variantText(variant, c)} size="small" />
      ) : (
        <Text style={[textStyle, labelStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function variantBg(variant: string, c: any): string {
  switch (variant) {
    case 'primary': return c.primary;
    case 'danger': return c.error;
    case 'secondary': case 'ghost': return 'transparent';
    default: return c.primary;
  }
}

function variantText(variant: string, c: any): string {
  switch (variant) {
    case 'primary': return c.textInverse;
    case 'danger': return '#fff';
    case 'secondary': return c.primary;
    case 'ghost': return c.textSecondary;
    default: return c.textInverse;
  }
}
