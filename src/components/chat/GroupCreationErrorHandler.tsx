import React from 'react';
import { Alert } from 'react-native';
import { ErrorHandler, ErrorDetails, useErrorHandler } from '../ui/ErrorHandler';
import { debugGroupAction } from '../../utils/groupChatDebugHelper';

interface GroupCreationErrorHandlerProps {
  visible: boolean;
  error: ErrorDetails | null;
  onClose: () => void;
  onRetryGroupCreation?: () => Promise<void>;
  userId?: string;
  groupData?: any;
}

export const GroupCreationErrorHandler: React.FC<GroupCreationErrorHandlerProps> = ({
  visible,
  error,
  onClose,
  onRetryGroupCreation,
  userId,
  groupData,
}) => {
  if (!error) return null;

  const handleContactSupport = () => {
    const supportInfo = {
      errorType: error.type,
      errorMessage: error.message,
      errorCode: error.code,
      timestamp: error.timestamp.toISOString(),
      userId,
      groupData: {
        name: groupData?.name,
        memberCount: groupData?.members?.length,
        privacy: groupData?.privacy,
      },
    };

    Alert.alert(
      'Group Creation Support',
      'We\'ll help you create your group. Here\'s what happened:\n\n' +
      `Error: ${error.message}\n` +
      `Time: ${error.timestamp.toLocaleString()}\n\n` +
      'Our support team has been notified.',
      [
        {
          text: 'Copy Debug Info',
          onPress: () => {
            console.log('Support Info:', JSON.stringify(supportInfo, null, 2));
            Alert.alert('Debug Info', 'Debug information has been copied to console for support.');
          }
        },
        { text: 'OK' }
      ]
    );
  };

  const handleRetry = async () => {
    if (!onRetryGroupCreation) return;
    
    console.log('🔄 Retrying group creation...');
    debugGroupAction(userId || 'unknown', 'GROUP_CREATION_RETRY', true, groupData);
    
    try {
      await onRetryGroupCreation();
      debugGroupAction(userId || 'unknown', 'GROUP_CREATION_RETRY_SUCCESS', true, groupData);
    } catch (retryError) {
      debugGroupAction(userId || 'unknown', 'GROUP_CREATION_RETRY_FAILED', false, groupData, retryError);
      throw retryError;
    }
  };

  return (
    <ErrorHandler
      visible={visible}
      error={error}
      onClose={onClose}
      onRetry={onRetryGroupCreation ? handleRetry : undefined}
      onContactSupport={handleContactSupport}
      retryText="Try Creating Group Again"
      showRetry={!!onRetryGroupCreation}
      showContactSupport={true}
    />
  );
};

// Hook for group creation error handling
export const useGroupCreationErrorHandler = () => {
  const { error, showError, handleError, clearError } = useErrorHandler();

  const handleGroupCreationError = (
    err: any,
    userId?: string,
    groupData?: any
  ): ErrorDetails => {
    let errorType: ErrorDetails['type'] = 'unknown';
    let errorMessage = 'Failed to create group';
    let errorCode: string | undefined;

    // Classify the error
    if (err?.code?.includes('network') || err?.message?.toLowerCase().includes('network')) {
      errorType = 'network';
      errorMessage = 'Network error while creating group. Please check your connection.';
    } else if (err?.code?.includes('firebase') || err?.code?.includes('firestore')) {
      errorType = 'firebase';
      errorMessage = 'Server error while creating group. Please try again.';
      errorCode = err.code;
    } else if (err?.code?.includes('auth')) {
      errorType = 'authentication';
      errorMessage = 'Authentication error. Please sign in and try again.';
      errorCode = err.code;
    } else if (err?.message?.toLowerCase().includes('validation')) {
      errorType = 'validation';
      errorMessage = err.message;
    } else {
      errorMessage = err?.message || 'An unexpected error occurred while creating the group.';
    }

    const errorDetails: ErrorDetails = {
      type: errorType,
      message: errorMessage,
      code: errorCode,
      timestamp: new Date(),
      context: { userId, groupData },
    };

    console.error('Group creation error classified:', errorDetails);
    debugGroupAction(userId || 'unknown', 'GROUP_CREATION_ERROR_HANDLED', false, groupData, errorDetails);

    handleError(errorType, errorMessage, errorCode, { userId, groupData });
    
    return errorDetails;
  };

  const validateGroupData = (groupData: any): string[] => {
    const errors: string[] = [];

    if (!groupData.name || groupData.name.trim().length === 0) {
      errors.push('Group name is required');
    }

    if (groupData.name && groupData.name.trim().length > 50) {
      errors.push('Group name must be 50 characters or less');
    }

    if (!groupData.members || groupData.members.length === 0) {
      errors.push('At least one member must be selected');
    }

    if (groupData.members && groupData.members.length > 100) {
      errors.push('Groups cannot have more than 100 members');
    }

    if (groupData.privacy === 'private' && (!groupData.pin || groupData.pin.length !== 4)) {
      errors.push('Private groups require a 4-digit PIN');
    }

    if (groupData.description && groupData.description.length > 200) {
      errors.push('Group description must be 200 characters or less');
    }

    return errors;
  };

  const handleValidationErrors = (groupData: any, userId?: string) => {
    const validationErrors = validateGroupData(groupData);
    
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(', ');
      handleError('validation', errorMessage, 'VALIDATION_FAILED', { userId, groupData });
      return true;
    }
    
    return false;
  };

  return {
    error,
    showError,
    clearError,
    handleGroupCreationError,
    handleValidationErrors,
    validateGroupData,
  };
};

// Utility function to determine if an error is retryable
export const isRetryableError = (error: ErrorDetails): boolean => {
  switch (error.type) {
    case 'network':
    case 'firebase':
      return true;
    case 'authentication':
    case 'validation':
      return false;
    default:
      return true; // Unknown errors are generally retryable
  }
};