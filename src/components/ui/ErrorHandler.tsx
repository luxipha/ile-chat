import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Button } from './Button';
import { Card } from './Card';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';

export interface ErrorDetails {
  type: 'network' | 'firebase' | 'authentication' | 'validation' | 'unknown';
  message: string;
  code?: string;
  timestamp: Date;
  context?: any;
}

interface ErrorHandlerProps {
  visible: boolean;
  error: ErrorDetails;
  onClose: () => void;
  onRetry?: () => Promise<void>;
  onContactSupport?: () => void;
  retryText?: string;
  showRetry?: boolean;
  showContactSupport?: boolean;
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  visible,
  error,
  onClose,
  onRetry,
  onContactSupport,
  retryText = 'Try Again',
  showRetry = true,
  showContactSupport = true,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return 'wifi-off';
      case 'firebase':
        return 'cloud-off';
      case 'authentication':
        return 'lock';
      case 'validation':
        return 'warning';
      default:
        return 'error';
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'network':
        return 'Network Error';
      case 'firebase':
        return 'Server Error';
      case 'authentication':
        return 'Authentication Error';
      case 'validation':
        return 'Validation Error';
      default:
        return 'Something went wrong';
    }
  };

  const getErrorDescription = () => {
    switch (error.type) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'firebase':
        return 'We\'re having trouble connecting to our servers. Please try again in a moment.';
      case 'authentication':
        return 'You need to sign in again to continue.';
      case 'validation':
        return 'Please check your input and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
      onClose();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      // The error will be handled by the parent component
    } finally {
      setIsRetrying(false);
    }
  };

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      // Default contact support action
      Alert.alert(
        'Contact Support',
        `Error: ${error.message}\nCode: ${error.code || 'N/A'}\nTime: ${error.timestamp.toLocaleString()}\n\nPlease contact support with this information.`,
        [
          { text: 'Copy Error Info', onPress: () => {
            // In a real app, this would copy to clipboard
            console.log('Error info copied to clipboard');
          }},
          { text: 'Close', style: 'cancel' }
        ]
      );
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card style={styles.errorCard}>
          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons
              name={getErrorIcon() as any}
              size={48}
              color={ChatTheme.error}
            />
          </View>

          {/* Error Title */}
          <Typography variant="h5" style={styles.errorTitle}>
            {getErrorTitle()}
          </Typography>

          {/* Error Description */}
          <Typography variant="body2" color="textSecondary" style={styles.errorDescription}>
            {getErrorDescription()}
          </Typography>

          {/* Error Details */}
          <View style={styles.errorDetails}>
            <Typography variant="caption" color="textSecondary">
              {error.message}
            </Typography>
            {error.code && (
              <Typography variant="caption" color="textSecondary" style={styles.errorCode}>
                Code: {error.code}
              </Typography>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {showRetry && onRetry && (
              <Button
                title={isRetrying ? 'Retrying...' : retryText}
                onPress={handleRetry}
                disabled={isRetrying}
                style={styles.retryButton}
              />
            )}
            
            {showContactSupport && (
              <Button
                title="Contact Support"
                variant="outline"
                onPress={handleContactSupport}
                style={styles.supportButton}
              />
            )}
            
            <Button
              title="Close"
              variant="text"
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

// Hook for managing error states
export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [showError, setShowError] = useState(false);

  const handleError = (
    type: ErrorDetails['type'],
    message: string,
    code?: string,
    context?: any
  ) => {
    const errorDetails: ErrorDetails = {
      type,
      message,
      code,
      context,
      timestamp: new Date(),
    };

    console.error('Error handled:', errorDetails);
    setError(errorDetails);
    setShowError(true);
  };

  const clearError = () => {
    setError(null);
    setShowError(false);
  };

  const retryWithErrorHandling = async (
    operation: () => Promise<void>,
    errorContext?: string
  ) => {
    try {
      await operation();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      handleError('unknown', message, undefined, errorContext);
      throw err; // Re-throw so parent can handle it if needed
    }
  };

  return {
    error,
    showError,
    handleError,
    clearError,
    retryWithErrorHandling,
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ChatSpacing.lg,
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
    padding: ChatSpacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: ChatSpacing.lg,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: ChatSpacing.md,
    color: ChatTheme.textPrimary,
    fontWeight: '600',
  },
  errorDescription: {
    textAlign: 'center',
    marginBottom: ChatSpacing.lg,
    lineHeight: 20,
  },
  errorDetails: {
    backgroundColor: ChatTheme.background3,
    padding: ChatSpacing.md,
    borderRadius: 8,
    width: '100%',
    marginBottom: ChatSpacing.lg,
  },
  errorCode: {
    marginTop: ChatSpacing.xs,
  },
  actions: {
    width: '100%',
    gap: ChatSpacing.sm,
  },
  retryButton: {
    width: '100%',
  },
  supportButton: {
    width: '100%',
  },
  closeButton: {
    width: '100%',
  },
});