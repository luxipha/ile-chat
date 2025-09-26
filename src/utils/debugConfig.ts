// Debug configuration for group chat functionality
export const DEBUG_CONFIG = {
  // Enable/disable different debug categories
  GROUP_CREATION: __DEV__, // Only in development
  NAVIGATION: __DEV__,
  STATE_MANAGEMENT: __DEV__,
  FIREBASE_OPERATIONS: __DEV__,
  UI_INTERACTIONS: __DEV__,
  
  // Helper function to conditionally log
  log: (category: keyof typeof DEBUG_CONFIG, message: string, data?: any) => {
    if (DEBUG_CONFIG[category] && typeof DEBUG_CONFIG[category] === 'boolean') {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  },

  // Helper for error logging (always enabled in dev)
  error: (message: string, error?: any) => {
    if (__DEV__) {
      if (error) {
        console.error(message, error);
      } else {
        console.error(message);
      }
    }
  },

  // Helper for success logging
  success: (message: string, data?: any) => {
    if (__DEV__) {
      if (data) {
        console.log(`✅ ${message}`, data);
      } else {
        console.log(`✅ ${message}`);
      }
    }
  },

  // Helper for warning logging
  warn: (message: string, data?: any) => {
    if (__DEV__) {
      if (data) {
        console.warn(`⚠️ ${message}`, data);
      } else {
        console.warn(`⚠️ ${message}`);
      }
    }
  }
};

// Export common debug patterns
export const debugGroupCreation = (stage: string, data?: any) => {
  DEBUG_CONFIG.log('GROUP_CREATION', `🔄 Group Creation - ${stage}`, data);
};

export const debugNavigation = (action: string, data?: any) => {
  DEBUG_CONFIG.log('NAVIGATION', `🧭 Navigation - ${action}`, data);
};

export const debugStateUpdate = (component: string, update: string, data?: any) => {
  DEBUG_CONFIG.log('STATE_MANAGEMENT', `🔄 ${component} - ${update}`, data);
};

export const debugFirebase = (operation: string, data?: any) => {
  DEBUG_CONFIG.log('FIREBASE_OPERATIONS', `🔥 Firebase - ${operation}`, data);
};