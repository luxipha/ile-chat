import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';

export interface InAppNotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'payment' | 'chat';
  title: string;
  message: string;
  avatar?: string;
  icon?: string;
  autoHide?: boolean;
  duration?: number;
  onPress?: () => void;
  onDismiss?: () => void;
}

interface InAppNotificationProps {
  notification: InAppNotificationData | null;
  onDismiss: () => void;
}

export const InAppNotification: React.FC<InAppNotificationProps> = ({
  notification,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (notification) {
      showNotification();
    } else {
      hideNotification();
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [notification]);

  const showNotification = () => {
    // Reset animations
    slideAnim.setValue(-100);
    opacityAnim.setValue(0);
    progressAnim.setValue(0);

    // Animate in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide if enabled
    if (notification?.autoHide !== false) {
      const duration = notification?.duration || 4000;
      
      // Start progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start();

      hideTimeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDismiss = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideNotification();
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handlePress = () => {
    if (notification?.onPress) {
      notification.onPress();
    }
    handleDismiss();
  };

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: Colors.success,
          icon: 'check-circle',
          iconColor: Colors.white,
        };
      case 'error':
        return {
          backgroundColor: Colors.error,
          icon: 'error',
          iconColor: Colors.white,
        };
      case 'warning':
        return {
          backgroundColor: Colors.warning,
          icon: 'warning',
          iconColor: Colors.white,
        };
      case 'info':
        return {
          backgroundColor: Colors.primary,
          icon: 'info',
          iconColor: Colors.white,
        };
      case 'payment':
        return {
          backgroundColor: Colors.success,
          icon: 'payment',
          iconColor: Colors.white,
        };
      case 'chat':
        return {
          backgroundColor: Colors.primary,
          icon: 'chat',
          iconColor: Colors.white,
        };
      default:
        return {
          backgroundColor: Colors.primary,
          icon: 'notifications',
          iconColor: Colors.white,
        };
    }
  };

  const renderIcon = () => {
    if (!notification) return null;

    if (notification.avatar) {
      return (
        <Image source={{ uri: notification.avatar }} style={styles.avatar} />
      );
    }

    const config = getNotificationConfig(notification.type);
    const iconName = notification.icon || config.icon;

    return (
      <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor }]}>
        <MaterialIcons 
          name={iconName as any} 
          size={20} 
          color={config.iconColor} 
        />
      </View>
    );
  };

  if (!notification) return null;

  const config = getNotificationConfig(notification.type);

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.notificationContainer,
          {
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.notification,
            { borderLeftColor: config.backgroundColor }
          ]}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          {renderIcon()}
          
          <View style={styles.content}>
            <Typography 
              variant="h6" 
              style={styles.title}
              numberOfLines={1}
            >
              {notification.title}
            </Typography>
            <Typography 
              variant="body2" 
              color="textSecondary"
              style={styles.message}
              numberOfLines={2}
            >
              {notification.message}
            </Typography>
          </View>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={18} color={Colors.gray500} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Progress indicator for auto-hide */}
        {notification.autoHide !== false && (
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: config.backgroundColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: Spacing.md,
  },
  notificationContainer: {
    borderRadius: BorderRadius.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 68,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    lineHeight: 18,
  },
  dismissButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  progressBar: {
    height: 2,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
});