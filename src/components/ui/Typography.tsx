import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors, Typography as TypographyTheme } from '../../theme';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
type TypographyColor = 'primary' | 'secondary' | 'text' | 'textSecondary' | 'error' | 'warning' | 'success';

interface TypographyProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: TypographyColor;
  align?: 'left' | 'center' | 'right';
  weight?: keyof typeof TypographyTheme.weights;
  style?: TextStyle;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body1',
  color = 'text',
  align = 'left',
  weight,
  style,
}) => {
  const textStyle = [
    styles[variant],
    styles[color],
    { textAlign: align },
    weight && { fontWeight: TypographyTheme.weights[weight] },
    style,
  ];

  return <Text style={textStyle}>{children}</Text>;
};

const styles = StyleSheet.create({
  // Variants
  h1: {
    fontSize: TypographyTheme.sizes['5xl'],
    fontWeight: TypographyTheme.weights.bold,
    lineHeight: TypographyTheme.sizes['5xl'] * TypographyTheme.lineHeights.tight,
  },
  h2: {
    fontSize: TypographyTheme.sizes['4xl'],
    fontWeight: TypographyTheme.weights.bold,
    lineHeight: TypographyTheme.sizes['4xl'] * TypographyTheme.lineHeights.tight,
  },
  h3: {
    fontSize: TypographyTheme.sizes['3xl'],
    fontWeight: TypographyTheme.weights.semibold,
    lineHeight: TypographyTheme.sizes['3xl'] * TypographyTheme.lineHeights.tight,
  },
  h4: {
    fontSize: TypographyTheme.sizes['2xl'],
    fontWeight: TypographyTheme.weights.semibold,
    lineHeight: TypographyTheme.sizes['2xl'] * TypographyTheme.lineHeights.normal,
  },
  h5: {
    fontSize: TypographyTheme.sizes.xl,
    fontWeight: TypographyTheme.weights.semibold,
    lineHeight: TypographyTheme.sizes.xl * TypographyTheme.lineHeights.normal,
  },
  h6: {
    fontSize: TypographyTheme.sizes.lg,
    fontWeight: TypographyTheme.weights.semibold,
    lineHeight: TypographyTheme.sizes.lg * TypographyTheme.lineHeights.normal,
  },
  body1: {
    fontSize: TypographyTheme.sizes.base,
    fontWeight: TypographyTheme.weights.normal,
    lineHeight: TypographyTheme.sizes.base * TypographyTheme.lineHeights.normal,
  },
  body2: {
    fontSize: TypographyTheme.sizes.sm,
    fontWeight: TypographyTheme.weights.normal,
    lineHeight: TypographyTheme.sizes.sm * TypographyTheme.lineHeights.normal,
  },
  caption: {
    fontSize: TypographyTheme.sizes.xs,
    fontWeight: TypographyTheme.weights.normal,
    lineHeight: TypographyTheme.sizes.xs * TypographyTheme.lineHeights.normal,
  },
  overline: {
    fontSize: TypographyTheme.sizes.xs,
    fontWeight: TypographyTheme.weights.medium,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  
  // Colors
  primary: {
    color: Colors.primary,
  },
  secondary: {
    color: Colors.secondary,
  },
  text: {
    color: Colors.gray900,
  },
  textSecondary: {
    color: Colors.gray600,
  },
  error: {
    color: Colors.error,
  },
  warning: {
    color: Colors.warning,
  },
  success: {
    color: Colors.success,
  },
});