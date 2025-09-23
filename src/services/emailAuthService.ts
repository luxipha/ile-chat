import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from './authService';

// Detect environment and use appropriate URL
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const API_BASE_URL = isWeb
  ? 'http://localhost:3000'  // Web browser
  : 'http://192.168.31.100:3000'; // Mobile device

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  error?: string;
}

export interface VerifyAndAuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  isNewUser?: boolean;
  requiresAdditionalInfo?: boolean;
  error?: string;
}

export interface AdditionalUserInfo {
  name: string;
  password: string;
}

class EmailAuthService {
  private sessionId: string | null = null;

  // Step 1: Send verification code to email
  async sendVerificationCode(email: string): Promise<EmailVerificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/v2/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: result.error || 'Failed to send verification code',
          error: result.error 
        };
      }

      // Store session ID for verification step
      this.sessionId = result.sessionId;
      
      return { 
        success: true, 
        message: result.message || 'Verification code sent successfully',
        sessionId: result.sessionId
      };
    } catch (error) {
      console.error('Send verification error:', error);
      return { 
        success: false, 
        message: 'Network error. Please try again.',
        error: 'NETWORK_ERROR'
      };
    }
  }

  // Step 2: Verify code and authenticate (frictionless - auto login/register)
  async verifyCodeAndAuth(code: string): Promise<VerifyAndAuthResponse> {
    try {
      if (!this.sessionId) {
        return { 
          success: false, 
          error: 'No verification session found. Please request a new code.'
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/v2/verify-and-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: code.trim(),
          sessionId: this.sessionId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: result.error || 'Verification failed'
        };
      }

      // Both existing and new users get complete authentication
      if (result.user && result.token) {
        await AsyncStorage.setItem('authToken', result.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));
        
        this.sessionId = null; // Clear session
        
        return {
          success: true,
          user: result.user,
          token: result.token,
          isNewUser: result.isNewUser || false
        };
      }

      return { 
        success: false, 
        error: 'Unexpected response from server'
      };
    } catch (error) {
      console.error('Verify code error:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.'
      };
    }
  }

  // Step 3: Complete registration for new users
  async completeRegistration(userInfo: AdditionalUserInfo): Promise<VerifyAndAuthResponse> {
    try {
      if (!this.sessionId) {
        return { 
          success: false, 
          error: 'No verification session found. Please start over.'
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/v2/complete-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId: this.sessionId,
          name: userInfo.name.trim(),
          password: userInfo.password
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: result.error || 'Registration failed'
        };
      }

      // Store authentication data
      await AsyncStorage.setItem('authToken', result.token);
      await AsyncStorage.setItem('userData', JSON.stringify(result.user));
      
      this.sessionId = null; // Clear session
      
      return {
        success: true,
        user: result.user,
        token: result.token,
        isNewUser: true
      };
    } catch (error) {
      console.error('Complete registration error:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.'
      };
    }
  }

  // Resend verification code
  async resendVerificationCode(): Promise<EmailVerificationResponse> {
    if (!this.sessionId) {
      return { 
        success: false, 
        message: 'No active verification session. Please start over.',
        error: 'NO_SESSION'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/v2/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: this.sessionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: result.error || 'Failed to resend verification code',
          error: result.error 
        };
      }

      return { 
        success: true, 
        message: result.message || 'Verification code sent successfully'
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { 
        success: false, 
        message: 'Network error. Please try again.',
        error: 'NETWORK_ERROR'
      };
    }
  }

  // Clear current session
  clearSession(): void {
    this.sessionId = null;
  }

  // Get current session status
  hasActiveSession(): boolean {
    return !!this.sessionId;
  }
}

export default new EmailAuthService();