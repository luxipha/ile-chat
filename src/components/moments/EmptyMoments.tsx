import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Colors, Spacing } from '../../theme';

interface EmptyMomentsProps {
  onCreateMoment: () => void;
}

export const EmptyMoments: React.FC<EmptyMomentsProps> = ({ onCreateMoment }) => {
  return (
    <View style={styles.container}>
      <EmptyState
        title="No moments yet"
        message="Share your investment journey and connect with the community"
        actionLabel="Create your first moment"
        onAction={onCreateMoment}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
});