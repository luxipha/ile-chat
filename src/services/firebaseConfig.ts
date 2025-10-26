import { Platform } from 'react-native';

// Debug helper function
const debugLog = (message: string, data?: any) => {
  console.log(`🔧 [Firebase Debug] ${message}`, data || '');
};

let isExpo = true;
let app: any = null;
let db: any = null;
let auth: any = null;
let fieldValue: any = null;
let timestampConstructor: any = null;

const ensureEnv = () => ({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const initializeFirebase = () => {
  if (app && db && auth) {
    return;
  }

  try {
    const firebaseAppModule = require('@react-native-firebase/app');
    const firestoreModule = require('@react-native-firebase/firestore');
    const firebaseAuthModule = require('@react-native-firebase/auth');

    isExpo = false;

    app = firebaseAppModule.default;
    db = firestoreModule.default();
    auth = firebaseAuthModule.default();
    fieldValue = firestoreModule.FieldValue;
    timestampConstructor = firestoreModule.Timestamp;

    debugLog('React Native Firebase initialized successfully', {
      platform: Platform.OS,
      isDev: __DEV__,
      firebaseType: 'React Native Firebase',
      appName: app?.name,
      projectId: app?.options?.projectId,
    });
  } catch (nativeError) {
    debugLog('React Native Firebase not available, falling back to Firebase Web compat SDK', {
      error: nativeError?.message,
    });

    try {
      const firebaseCompatModule = require('firebase/compat/app');
      const firebaseCompat = firebaseCompatModule?.default || firebaseCompatModule;
      require('firebase/compat/firestore');
      require('firebase/compat/auth');

      isExpo = true;

      const firebaseConfig = ensureEnv();
      debugLog('Firebase config (Expo):', firebaseConfig);

      if (!firebaseCompat.apps || firebaseCompat.apps.length === 0) {
        app = firebaseCompat.initializeApp(firebaseConfig);
      } else {
        app = firebaseCompat.app();
      }

      db = firebaseCompat.firestore();
      auth = firebaseCompat.auth();
      fieldValue = firebaseCompat.firestore.FieldValue;
      timestampConstructor = firebaseCompat.firestore.Timestamp;

      debugLog('Firebase Web compat SDK initialized successfully', {
        platform: Platform.OS,
        isDev: __DEV__,
        firebaseType: 'Firebase Web Compat',
        projectId: firebaseConfig.projectId,
      });
    } catch (webError) {
      console.error('❌ Firebase initialization failed for both native and web SDKs:', webError);
      app = null;
      db = null;
      auth = null;
      fieldValue = null;
      timestampConstructor = null;
    }
  }
};

initializeFirebase();

const ensureInitialized = () => {
  if (!app || !db || !auth) {
    initializeFirebase();
  }
};

export const isUsingExpoFirebase = () => isExpo;

export const getFirebaseApp = () => {
  ensureInitialized();
  return app;
};

export const getFirestore = () => {
  ensureInitialized();
  return db;
};

export const getFirebaseAuth = () => {
  ensureInitialized();
  return auth;
};

export const getFirebaseFieldValue = () => {
  ensureInitialized();
  return fieldValue;
};

export const getFirebaseTimestamp = () => {
  ensureInitialized();
  return timestampConstructor;
};

// Function to sign in with custom token - works with both SDKs
export const signInWithCustomFirebaseToken = async (customToken: string) => {
  const firebaseAuth = getFirebaseAuth();

  debugLog('Firebase custom token sign-in', {
    hasToken: !!customToken,
    tokenLength: customToken?.length,
    platform: Platform.OS,
    environment: isExpo ? 'Expo' : 'Native',
    hasAuth: !!firebaseAuth,
  });

  if (!firebaseAuth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    debugLog('Attempting Firebase sign-in with custom token', {
      currentUidBefore: firebaseAuth.currentUser?.uid || null,
      hasCurrentUserBefore: !!firebaseAuth.currentUser,
    });

    const userCredential = await firebaseAuth.signInWithCustomToken(customToken);

    debugLog('Firebase sign-in completed', {
      currentUidAfter: firebaseAuth.currentUser?.uid || null,
      hasCurrentUserAfter: !!firebaseAuth.currentUser,
    });

    debugLog('Firebase authentication successful', {
      uid: userCredential.user?.uid,
      email: userCredential.user?.email,
    });

    return userCredential;
  } catch (error: any) {
    console.error('❌ Firebase custom token sign-in failed:', error);
    debugLog('Firebase auth error details:', {
      message: error?.message,
      code: error?.code,
    });

    throw error;
  }
};

// Debug function to check Firebase status
export const getFirebaseStatus = async () => {
  const firebaseApp = getFirebaseApp();
  const firebaseAuth = getFirebaseAuth();

  const status = {
    platform: Platform.OS,
    isDev: __DEV__,
    isExpo,
    environment: isExpo ? 'Expo Development' : 'Native Build',
    hasApp: !!firebaseApp,
    hasDb: !!db,
    hasAuth: !!firebaseAuth,
    projectId: firebaseApp?.options?.projectId || 'unknown',
    authCurrentUser: firebaseAuth?.currentUser?.uid || null,
    firebaseType: isExpo ? 'Firebase Web Compat SDK' : 'React Native Firebase',
    timestamp: new Date().toISOString(),
  };

  debugLog('Firebase status check:', status);
  return status;
};

debugLog('Firebase configuration module loaded');
