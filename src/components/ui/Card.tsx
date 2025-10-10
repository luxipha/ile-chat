import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../../theme';

type CardVariant = 'elevated' | 'outlined' | 'filled';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle | ViewStyle[];
  padding?: keyof typeof Spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  style,
  padding = 'xl',
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    { padding: Spacing[padding] },
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
  },
  elevated: {
    ...Shadows.base,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  filled: {
    backgroundColor: Colors.gray50,
  },
});