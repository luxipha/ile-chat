import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Typography } from './Typography';
import { Colors, Spacing } from '../../theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: any;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = Colors.primary,
  message,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Typography variant="body2" color="textSecondary" style={styles.message}>
          {message}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  message: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});