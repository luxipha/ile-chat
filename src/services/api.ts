import { ApiResponse, User, Transaction, Property } from '../types';

// Detect environment and use appropriate URL
const API_BASE_URL = typeof window !== 'undefined' 
  ? 'http://localhost:3000'  // Web browser
  : 'http://192.168.31.100:3000'; // Mobile device

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      console.log('🚀 Making HTTP request:', {
        url: fullUrl,
        method: options.method || 'GET',
        hasHeaders: !!options.headers,
        headers: options.headers
      });

      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log('📥 HTTP response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: fullUrl
      });

      const data = await response.json();
      console.log('📄 Response data:', { 
        dataType: typeof data,
        hasData: !!data,
        keys: data && typeof data === 'object' ? Object.keys(data) : null
      });

      if (!response.ok) {
        console.log('❌ Request failed:', {
          status: response.status,
          error: data.message || 'An error occurred',
          data
        });
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      console.log('✅ Request successful');
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('❌ Network error in request:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Wallet methods
  async getWalletStatus(): Promise<ApiResponse<{ walletId: string; balances: { [token: string]: number } }>> {
    // This is an authenticated route, so we use the `get` helper which includes the token.
    return this.get('/api/wallet/status');
  }

  async getWalletBalance(address: string): Promise<ApiResponse<{ [token: string]: string }>> {
    return this.request(`/wallet/balance/${address}`);
  }

  async getTransactions(address: string): Promise<ApiResponse<Transaction[]>> {
    return this.request(`/wallet/transactions/${address}`);
  }

  // Property methods
  async getProperties(): Promise<ApiResponse<Property[]>> {
    return this.request('/properties');
  }

  async getProperty(id: string): Promise<ApiResponse<Property>> {
    return this.request(`/properties/${id}`);
  }

  // Transaction methods
  async sendTransaction(
    from: string,
    to: string,
    amount: string,
    token: string
  ): Promise<ApiResponse<{ hash: string }>> {
    return this.request('/transactions/send', {
      method: 'POST',
      body: JSON.stringify({ from, to, amount, token }),
    });
  }

  // Add POST method for requests that need authentication
  async post<T>(endpoint: string, data?: any, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    let body: any;

    // Check if data is FormData
    if (data instanceof FormData) {
      // Don't set Content-Type for FormData, let browser set it with boundary
      body = data;
    } else {
      // Use JSON for regular data
      headers['Content-Type'] = 'application/json';
      body = data ? JSON.stringify(data) : undefined;
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request(endpoint, {
      method: 'POST',
      headers,
      body,
    });
  }

  // Add GET method for requests that need authentication
  async get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    console.log('📡 ApiService.get() called:', { endpoint, hasToken: !!token });
    
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Added Authorization header with token:', `${token.substring(0, 20)}...`);
    } else {
      console.log('⚠️ No token provided for authenticated request');
    }

    return this.request(endpoint, {
      method: 'GET',
      headers,
    });
  }

  // Add DELETE method for requests that need authentication
  async delete<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    console.log('🗑️ ApiService.delete() called:', { endpoint, hasToken: !!token });
    
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Added Authorization header with token:', `${token.substring(0, 20)}...`);
    } else {
      console.log('⚠️ No token provided for authenticated request');
    }

    return this.request(endpoint, {
      method: 'DELETE',
      headers,
    });
  }
}

export const apiService = new ApiService();

// Export a simpler client for direct use
export const apiClient = {
  post: async (endpoint: string, data?: any) => {
    const token = await getAuthToken(); // We'll need to implement this
    return apiService.post(endpoint, data, token);
  },
  get: async (endpoint: string) => {
    const token = await getAuthToken();
    return apiService.get(endpoint, token);
  },
  delete: async (endpoint: string) => {
    const token = await getAuthToken();
    return apiService.delete(endpoint, token);
  }
};

// Helper to get auth token from storage
async function getAuthToken(): Promise<string | undefined> {
  try {
    console.log('🔑 Getting auth token from AsyncStorage...');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('authToken');
    console.log('🔑 Auth token retrieved:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  } catch (error) {
    console.error('❌ Failed to get auth token:', error);
    return undefined;
  }
}