import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseAuthService from './firebaseAuthService';

// API Base URL from environment variables with fallbacks
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const API_BASE_URL = process.env.API_BASE_URL || (isWeb
  ? 'http://localhost:3000'  // Web browser
  : 'http://192.168.31.102:3000'); // Mobile device

export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  bricks: number;
  referralCode: string;
  loginStreak?: number;
  onboardingCompleted: boolean;
  authMethod: 'email' | 'google' | 'telegram';
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
}

class AuthService {
  private token: string | null = null;

  async initialize() {
    try {
      this.token = await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
    }
  }

  async login(data: LoginData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/v2/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Login failed' };
      }

      const authData: AuthResponse = result;
      this.token = authData.token;
      
      await AsyncStorage.setItem('authToken', authData.token);
      await AsyncStorage.setItem('userData', JSON.stringify(authData.user));

      // Authenticate with Firebase after successful login
      try {
        console.log('🔥 Initiating Firebase authentication...');
        const firebaseResult = await firebaseAuthService.authenticateWithFirebase();
        if (!firebaseResult.success) {
          console.warn('⚠️ Firebase authentication failed:', firebaseResult.error);
          // Continue with login success even if Firebase fails - Firebase is for chat only
        }
      } catch (error) {
        console.warn('⚠️ Firebase authentication error:', error);
        // Don't fail the login if Firebase fails
      }

      return { success: true, user: authData.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/v2/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Registration failed' };
      }

      const authData: AuthResponse = result;
      this.token = authData.token;
      
      await AsyncStorage.setItem('authToken', authData.token);
      await AsyncStorage.setItem('userData', JSON.stringify(authData.user));

      // Authenticate with Firebase after successful registration
      try {
        console.log('🔥 Initiating Firebase authentication for new user...');
        const firebaseResult = await firebaseAuthService.authenticateWithFirebase();
        if (!firebaseResult.success) {
          console.warn('⚠️ Firebase authentication failed:', firebaseResult.error);
          // Continue with registration success even if Firebase fails
        }
      } catch (error) {
        console.warn('⚠️ Firebase authentication error:', error);
        // Don't fail the registration if Firebase fails
      }

      return { success: true, user: authData.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Unified auth method - checks if user exists, then signs in or registers
  async authenticateUser(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string; isNewUser?: boolean }> {
    // First try to login (if user exists)
    const loginResult = await this.login({ email: data.email, password: data.password });
    
    if (loginResult.success) {
      return { ...loginResult, isNewUser: false };
    }

    // If login failed because user doesn't exist, try registration
    if (loginResult.error?.includes('Invalid email or password')) {
      const registerResult = await this.register(data);
      if (registerResult.success) {
        return { ...registerResult, isNewUser: true };
      }
      return registerResult;
    }

    // Return login error if it's something else
    return loginResult;
  }

  async getSession(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🔄 Getting session...');
      
      if (!this.token) {
        console.log('🔍 No token in memory, checking AsyncStorage...');
        this.token = await AsyncStorage.getItem('authToken');
      }

      if (!this.token) {
        console.log('❌ No authentication token found');
        return { success: false, error: 'No authentication token' };
      }

      console.log('🔑 Using token for session:', `${this.token.substring(0, 20)}...`);
      const url = `${API_BASE_URL}/auth/v2/session`;
      console.log('🌐 Making session request to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Session response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const result = await response.json();
      console.log('📄 Session result:', {
        hasUser: !!result.user,
        error: result.error,
        userKeys: result.user ? Object.keys(result.user) : null
      });

      if (!response.ok) {
        console.log('❌ Session invalid:', {
          status: response.status,
          error: result.error
        });
        
        if (response.status === 401) {
          console.log('🚪 401 Unauthorized - clearing invalid token');
          await this.logout(); // Clear invalid token
        }
        return { success: false, error: result.error || 'Session invalid' };
      }

      console.log('✅ Session valid, saving user data');
      await AsyncStorage.setItem('userData', JSON.stringify(result.user));
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Session error:', error);
      console.error('❌ Session error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      });
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (!this.token) {
        this.token = await AsyncStorage.getItem('authToken');
      }

      if (!this.token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/v2/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Update failed' };
      }

      await AsyncStorage.setItem('userData', JSON.stringify(result.user));
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async completeOnboarding(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (!this.token) {
        this.token = await AsyncStorage.getItem('authToken');
      }

      if (!this.token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/v2/complete-onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Onboarding completion failed' };
      }

      await AsyncStorage.setItem('userData', JSON.stringify(result.user));
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🚪 Logout initiated...');
      console.log('🔑 Current token before logout:', this.token ? `${this.token.substring(0, 20)}...` : 'null');
      
      this.token = null;
      console.log('🗑️ Clearing AsyncStorage items: authToken, userData');
      
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      
      // Clear Firebase authentication data
      try {
        await firebaseAuthService.clearFirebaseAuth();
        console.log('🔥 Firebase authentication cleared');
      } catch (error) {
        console.warn('⚠️ Error clearing Firebase auth:', error);
      }
      
      console.log('✅ Logout completed successfully');
      
      // Verify items were removed
      const tokenCheck = await AsyncStorage.getItem('authToken');
      const userDataCheck = await AsyncStorage.getItem('userData');
      console.log('🔍 Post-logout verification:', {
        authTokenExists: !!tokenCheck,
        userDataExists: !!userDataCheck
      });
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      console.error('❌ Logout error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      });
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      console.log('🔐 Checking authentication status...');
      console.log('🔑 Current token in memory:', this.token ? `${this.token.substring(0, 20)}...` : 'null');
      
      if (!this.token) {
        console.log('🔍 No token in memory, checking AsyncStorage...');
        this.token = await AsyncStorage.getItem('authToken');
        console.log('🔑 Token from AsyncStorage:', this.token ? `${this.token.substring(0, 20)}...` : 'null');
      }
      
      const isAuth = !!this.token;
      console.log('✅ Authentication check result:', isAuth);
      return isAuth;
    } catch (error) {
      console.error('❌ Authentication check error:', error);
      return false;
    }
  }

  async getCachedUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }


  getToken(): string | null {
    return this.token;
  }
}

export default new AuthService();