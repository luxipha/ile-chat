import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Button } from './Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: any;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  type = 'error',
  icon,
  actionLabel,
  onAction,
  onDismiss,
  style,
}) => {
  const getIconName = () => {
    if (icon) return icon;
    switch (type) {
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'error';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'warning': return Colors.warning;
      case 'info': return Colors.info;
      default: return Colors.error;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'warning': return Colors.warning + '10';
      case 'info': return Colors.info + '10';
      default: return Colors.error + '10';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'warning': return Colors.warning;
      case 'info': return Colors.info;
      default: return Colors.error;
    }
  };

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor(),
      },
      style
    ]}>
      <View style={styles.content}>
        <MaterialIcons 
          name={getIconName()} 
          size={24} 
          color={getIconColor()} 
          style={styles.icon}
        />
        
        <View style={styles.textContainer}>
          <Typography variant="h6" style={[styles.title, { color: getIconColor() }]}>
            {title}
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.message}>
            {message}
          </Typography>
        </View>

        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <MaterialIcons name="close" size={20} color={Colors.gray500} />
          </TouchableOpacity>
        )}
      </View>

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={[styles.actionButton, { borderColor: getBorderColor() }]}
          textStyle={{ color: getIconColor() }}
        />
      )}
    </View>
  );
};

// Predefined error components for common scenarios
export const NetworkError: React.FC<{ onRetry?: () => void; onDismiss?: () => void }> = ({ onRetry, onDismiss }) => (
  <ErrorMessage
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    icon="wifi-off"
    actionLabel={onRetry ? "Retry" : undefined}
    onAction={onRetry}
    onDismiss={onDismiss}
  />
);

export const ValidationError: React.FC<{ message: string; onDismiss?: () => void }> = ({ message, onDismiss }) => (
  <ErrorMessage
    title="Validation Error"
    message={message}
    type="warning"
    icon="warning"
    onDismiss={onDismiss}
  />
);

export const PaymentError: React.FC<{ message: string; onRetry?: () => void; onDismiss?: () => void }> = ({ 
  message, 
  onRetry, 
  onDismiss 
}) => (
  <ErrorMessage
    title="Payment Failed"
    message={message}
    icon="payment"
    actionLabel={onRetry ? "Try Again" : undefined}
    onAction={onRetry}
    onDismiss={onDismiss}
  />
);

export const AuthError: React.FC<{ onLogin?: () => void; onDismiss?: () => void }> = ({ onLogin, onDismiss }) => (
  <ErrorMessage
    title="Authentication Required"
    message="Please log in to continue using this feature."
    type="warning"
    icon="lock"
    actionLabel={onLogin ? "Log In" : undefined}
    onAction={onLogin}
    onDismiss={onDismiss}
  />
);

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4,
    marginLeft: Spacing.sm,
  },
  actionButton: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
});