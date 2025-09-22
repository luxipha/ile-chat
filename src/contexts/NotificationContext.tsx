import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { InAppNotificationData } from '../components/notifications/InAppNotification';

interface NotificationContextType {
  showNotification: (notification: Omit<InAppNotificationData, 'id'>) => void;
  showSuccess: (title: string, message: string, onPress?: () => void) => void;
  showError: (title: string, message: string, onPress?: () => void) => void;
  showWarning: (title: string, message: string, onPress?: () => void) => void;
  showInfo: (title: string, message: string, onPress?: () => void) => void;
  showPayment: (title: string, message: string, avatar?: string, onPress?: () => void) => void;
  showChat: (title: string, message: string, avatar?: string, onPress?: () => void) => void;
  hideNotification: () => void;
  currentNotification: InAppNotificationData | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [currentNotification, setCurrentNotification] = useState<InAppNotificationData | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<InAppNotificationData[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const processQueue = useCallback(() => {
    if (notificationQueue.length > 0 && !currentNotification) {
      const nextNotification = notificationQueue[0];
      setNotificationQueue(prev => prev.slice(1));
      setCurrentNotification(nextNotification);
    }
  }, [notificationQueue, currentNotification]);

  const showNotification = useCallback((notification: Omit<InAppNotificationData, 'id'>) => {
    const newNotification: InAppNotificationData = {
      ...notification,
      id: generateId(),
    };

    if (currentNotification) {
      // Queue the notification if one is already showing
      setNotificationQueue(prev => [...prev, newNotification]);
    } else {
      setCurrentNotification(newNotification);
    }
  }, [currentNotification]);

  const hideNotification = useCallback(() => {
    setCurrentNotification(null);
    // Process queue after hiding current notification
    setTimeout(processQueue, 100);
  }, [processQueue]);

  const showSuccess = useCallback((title: string, message: string, onPress?: () => void) => {
    showNotification({
      type: 'success',
      title,
      message,
      onPress,
      autoHide: true,
      duration: 3000,
    });
  }, [showNotification]);

  const showError = useCallback((title: string, message: string, onPress?: () => void) => {
    showNotification({
      type: 'error',
      title,
      message,
      onPress,
      autoHide: true,
      duration: 5000,
    });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string, onPress?: () => void) => {
    showNotification({
      type: 'warning',
      title,
      message,
      onPress,
      autoHide: true,
      duration: 4000,
    });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string, onPress?: () => void) => {
    showNotification({
      type: 'info',
      title,
      message,
      onPress,
      autoHide: true,
      duration: 4000,
    });
  }, [showNotification]);

  const showPayment = useCallback((title: string, message: string, avatar?: string, onPress?: () => void) => {
    showNotification({
      type: 'payment',
      title,
      message,
      avatar,
      onPress,
      autoHide: true,
      duration: 4000,
    });
  }, [showNotification]);

  const showChat = useCallback((title: string, message: string, avatar?: string, onPress?: () => void) => {
    showNotification({
      type: 'chat',
      title,
      message,
      avatar,
      onPress,
      autoHide: true,
      duration: 4000,
    });
  }, [showNotification]);

  const value: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showPayment,
    showChat,
    hideNotification,
    currentNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Hook for easy notification usage in components
export const useNotificationActions = () => {
  const { showSuccess, showError, showWarning, showInfo, showPayment, showChat } = useNotifications();
  
  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    payment: showPayment,
    chat: showChat,
  };
};