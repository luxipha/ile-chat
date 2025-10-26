import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithCustomFirebaseToken, getFirebaseStatus, getFirebaseAuth } from './firebaseConfig';
import { API_BASE_URL } from '../config/apiConfig';

export interface FirebaseAuthResponse {
  success: boolean;
  customToken?: string;
  message: string;
  error?: string;
}

class FirebaseAuthService {
  /**
   * Gets a custom Firebase token from the backend for the authenticated user
   * @returns Promise<FirebaseAuthResponse>
   */
  async getCustomFirebaseToken(): Promise<FirebaseAuthResponse> {
    try {
      console.log('🔍 Getting auth token from AsyncStorage...');
      const authToken = await AsyncStorage.getItem('authToken');
      
      if (!authToken) {
        console.error('❌ No auth token found in AsyncStorage');
        return {
          success: false,
          message: 'No authentication token found. Please log in first.',
          error: 'MISSING_AUTH_TOKEN'
        };
      }

      console.log('🔍 Auth token found, requesting custom Firebase token from backend...');
      const response = await fetch(`${API_BASE_URL}/api/firebase-auth/custom-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const result = await response.json();
      console.log('🔍 Backend response for custom token:', { 
        ok: response.ok, 
        status: response.status, 
        hasCustomToken: !!result.customToken,
        success: result.success,
        error: result.error 
      });

      if (!response.ok) {
        console.error('❌ Backend rejected custom token request:', result);
        return {
          success: false,
          message: result.message || 'Failed to get custom Firebase token',
          error: result.error || 'BACKEND_ERROR'
        };
      }

      console.log('✅ Custom Firebase token received from backend');
      return result;
    } catch (error) {
      console.error('❌ Error getting custom Firebase token:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        error: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Completes the Firebase authentication flow:
   * 1. Gets custom token from backend
   * 2. Signs into Firebase using the custom token
   * @returns Promise<{success: boolean, error?: string}>
   */
  async authenticateWithFirebase(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔥 [FirebaseAuth Debug] Starting Firebase authentication process...');
      
      // Check Firebase status first
      const firebaseStatus = await getFirebaseStatus();
      console.log('🔥 [FirebaseAuth Debug] Current Firebase status:', firebaseStatus);
      
      // Step 1: Get custom token from backend
      console.log('🔥 [FirebaseAuth Debug] Step 1: Getting custom token from backend...');
      const tokenResponse = await this.getCustomFirebaseToken();
      
      console.log('🔥 [FirebaseAuth Debug] Backend token response:', {
        success: tokenResponse.success,
        hasToken: !!tokenResponse.customToken,
        tokenLength: tokenResponse.customToken?.length,
        message: tokenResponse.message,
        error: tokenResponse.error
      });
      
      if (!tokenResponse.success || !tokenResponse.customToken) {
        console.log('🔥 [FirebaseAuth Debug] Failed to get custom token from backend');
        return {
          success: false,
          error: tokenResponse.message || 'Failed to get custom token'
        };
      }

      // Step 2: Sign into Firebase with the custom token
      console.log('🔥 [FirebaseAuth Debug] Step 2: Attempting to sign into Firebase with custom token...');
      
      const userCredential = await signInWithCustomFirebaseToken(tokenResponse.customToken);
      
      console.log('🔥 [FirebaseAuth Debug] Firebase sign-in result:', { 
        hasCredential: !!userCredential, 
        hasUser: !!userCredential?.user,
        uid: userCredential?.user?.uid,
        email: userCredential?.user?.email,
        isAnonymous: userCredential?.user?.isAnonymous
      });
      
      if (userCredential && userCredential.user) {
        // Store Firebase UID for future reference
        const firebaseUid = userCredential.user.uid;
        await AsyncStorage.setItem('firebaseUid', firebaseUid);
        
        console.log('🔥 [FirebaseAuth Debug] Firebase authentication successful');
        console.log('🔥 [FirebaseAuth Debug] Firebase UID stored:', firebaseUid);
        console.log('🔥 [FirebaseAuth Debug] AsyncStorage update completed');
        
        return { success: true };
      }

      console.log('🔥 [FirebaseAuth Debug] No user credential returned from Firebase');
      return {
        success: false,
        error: 'Failed to authenticate with Firebase - no user credential'
      };

    } catch (error) {
      console.error('🔥 [FirebaseAuth Debug] Firebase authentication error:', error);
      console.error('🔥 [FirebaseAuth Debug] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Firebase authentication failed'
      };
    }
  }

  /**
   * Checks if the user is authenticated with Firebase
   * @returns Promise<boolean>
   */
  async isFirebaseAuthenticated(): Promise<boolean> {
    try {
      const authInstance = getFirebaseAuth();
      const currentUid = authInstance?.currentUser?.uid || null;

      if (currentUid) {
        return true;
      }

      const storedFirebaseUid = await AsyncStorage.getItem('firebaseUid');

      if (storedFirebaseUid) {
        console.log('🔥 [FirebaseAuth Debug] Stored Firebase UID found but no current user. Re-authentication required.', {
          storedFirebaseUid,
        });
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Clears Firebase authentication data on logout
   */
  async clearFirebaseAuth(): Promise<void> {
    try {
      const authInstance = getFirebaseAuth();
      await AsyncStorage.removeItem('firebaseUid');
      if (authInstance?.currentUser) {
        await authInstance.signOut();
      }
    } catch (error) {
      console.error('Error clearing Firebase auth:', error);
    }
  }

  /**
   * Gets the stored Firebase UID
   * @returns Promise<string | null>
   */
  async getFirebaseUid(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('firebaseUid');
    } catch {
      return null;
    }
  }

  /**
   * Debug function to test Firebase setup
   */
  async debugFirebaseSetup(): Promise<void> {
    console.log('🔧 [FirebaseAuth Debug] === Firebase Setup Debug ===');
    
    try {
      const status = await getFirebaseStatus();
      console.log('🔧 [FirebaseAuth Debug] Firebase Status:', status);
      
      const authToken = await AsyncStorage.getItem('authToken');
      console.log('🔧 [FirebaseAuth Debug] Has Auth Token:', !!authToken);
      
      const firebaseUid = await AsyncStorage.getItem('firebaseUid');
      console.log('🔧 [FirebaseAuth Debug] Has Firebase UID:', !!firebaseUid, firebaseUid);
      
    } catch (error) {
      console.error('🔧 [FirebaseAuth Debug] Debug setup failed:', error);
    }
    
    console.log('🔧 [FirebaseAuth Debug] === End Debug ===');
  }
}

export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
