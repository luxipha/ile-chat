import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <SkeletonLoader width={size} height={size} borderRadius={size / 2} />
);

export const SkeletonText: React.FC<{ width?: number | string }> = ({ width = '100%' }) => (
  <SkeletonLoader width={width} height={16} />
);

export const SkeletonButton: React.FC = () => (
  <SkeletonLoader width={120} height={36} borderRadius={BorderRadius.md} />
);

export const SkeletonCard: React.FC = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonCardHeader}>
      <SkeletonAvatar size={40} />
      <View style={styles.skeletonCardHeaderText}>
        <SkeletonText width="60%" />
        <View style={{ height: 4 }} />
        <SkeletonText width="40%" />
      </View>
    </View>
    <View style={{ height: Spacing.md }} />
    <SkeletonText width="100%" />
    <View style={{ height: 4 }} />
    <SkeletonText width="80%" />
    <View style={{ height: 4 }} />
    <SkeletonText width="60%" />
  </View>
);

export const SkeletonContactItem: React.FC = () => (
  <View style={styles.skeletonContactItem}>
    <SkeletonAvatar />
    <View style={styles.skeletonContactInfo}>
      <SkeletonText width="70%" />
      <View style={{ height: 4 }} />
      <SkeletonText width="50%" />
    </View>
    <SkeletonLoader width={24} height={24} borderRadius={12} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.gray200,
  },
  skeletonCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  skeletonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonCardHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  skeletonContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  skeletonContactInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.md,
  },
});