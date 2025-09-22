import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Button } from './Button';
import { Colors, Spacing } from '../../theme';

export interface ErrorScreenProps {
  title?: string;
  message?: string;
  icon?: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  icon = 'error-outline',
  primaryAction,
  secondaryAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons name={icon} size={80} color={Colors.gray400} />
        
        <Typography variant="h4" style={styles.title}>
          {title}
        </Typography>
        
        <Typography variant="body1" color="textSecondary" style={styles.message}>
          {message}
        </Typography>

        <View style={styles.actions}>
          {primaryAction && (
            <Button
              title={primaryAction.label}
              onPress={primaryAction.onPress}
              style={styles.primaryButton}
            />
          )}
          
          {secondaryAction && (
            <Button
              title={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant="outline"
              style={styles.secondaryButton}
            />
          )}
        </View>
      </View>
    </View>
  );
};

// Predefined error screens for common scenarios
export const NoInternetScreen: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <ErrorScreen
    title="No Internet Connection"
    message="Please check your internet connection and try again."
    icon="wifi-off"
    primaryAction={{
      label: "Try Again",
      onPress: onRetry,
    }}
  />
);

export const ServerErrorScreen: React.FC<{ onRetry: () => void; onGoBack?: () => void }> = ({ 
  onRetry, 
  onGoBack 
}) => (
  <ErrorScreen
    title="Server Error"
    message="Our servers are experiencing issues. Please try again in a few moments."
    icon="cloud-off"
    primaryAction={{
      label: "Retry",
      onPress: onRetry,
    }}
    secondaryAction={onGoBack ? {
      label: "Go Back",
      onPress: onGoBack,
    } : undefined}
  />
);

export const NotFoundScreen: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => (
  <ErrorScreen
    title="Page Not Found"
    message="The page you're looking for doesn't exist or has been moved."
    icon="search-off"
    primaryAction={{
      label: "Go Home",
      onPress: onGoHome,
    }}
  />
);

export const MaintenanceScreen: React.FC<{ onCheckAgain?: () => void }> = ({ onCheckAgain }) => (
  <ErrorScreen
    title="Under Maintenance"
    message="We're currently performing maintenance to improve your experience. Please check back soon."
    icon="build"
    primaryAction={onCheckAgain ? {
      label: "Check Again",
      onPress: onCheckAgain,
    } : undefined}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
});