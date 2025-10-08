import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithCustomFirebaseToken } from './firebaseConfig';
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
      const authToken = await AsyncStorage.getItem('authToken');
      
      if (!authToken) {
        return {
          success: false,
          message: 'No authentication token found. Please log in first.',
          error: 'MISSING_AUTH_TOKEN'
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/firebase-auth/custom-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to get custom Firebase token',
          error: result.error || 'BACKEND_ERROR'
        };
      }

      return result;
    } catch (error) {
      console.error('Error getting custom Firebase token:', error);
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
      // Step 1: Get custom token from backend
      const tokenResponse = await this.getCustomFirebaseToken();
      
      if (!tokenResponse.success || !tokenResponse.customToken) {
        return {
          success: false,
          error: tokenResponse.message || 'Failed to get custom token'
        };
      }

      // Step 2: Sign into Firebase with the custom token
      const userCredential = await signInWithCustomFirebaseToken(tokenResponse.customToken);
      
      if (userCredential && userCredential.user) {
        // Store Firebase UID for future reference
        await AsyncStorage.setItem('firebaseUid', userCredential.user.uid);
        
        console.log('✅ Firebase authentication successful:', userCredential.user.uid);
        return { success: true };
      }

      return {
        success: false,
        error: 'Failed to authenticate with Firebase'
      };

    } catch (error) {
      console.error('Firebase authentication error:', error);
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
      const firebaseUid = await AsyncStorage.getItem('firebaseUid');
      return !!firebaseUid;
    } catch {
      return false;
    }
  }

  /**
   * Clears Firebase authentication data on logout
   */
  async clearFirebaseAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem('firebaseUid');
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
}

export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;