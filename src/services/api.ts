import { API_BASE_URL } from '../config/apiConfig';
import { ApiResponse, Property, Transaction, User } from '../types';

if (__DEV__) {
  const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
  console.log('🔧 API_BASE_URL configured as:', API_BASE_URL);
  console.log('🔧 Environment check - isWeb:', isWeb);
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    const maxRetries = 2;
    
    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      console.log('🚀 Making HTTP request:', {
        url: fullUrl,
        method: options.method || 'GET',
        hasHeaders: !!options.headers,
        headers: options.headers,
        timestamp: new Date().toISOString()
      });

      // Add a timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for better reliability
      
      // Build headers carefully - don't set Content-Type for FormData
      const headers: Record<string, string> = {};
      
      // Only set Content-Type if not FormData and not already set in options
      const optionsHeaders = options.headers as Record<string, string> | undefined;
      if (!(options.body instanceof FormData) && 
          !optionsHeaders?.['Content-Type'] && 
          !optionsHeaders?.['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      
      const requestOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          ...headers,
          ...options.headers,
        },
      };

      const response = await fetch(fullUrl, requestOptions);
      
      clearTimeout(timeoutId); // Clear timeout if request completes

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
      
      // Create a safe error object to prevent issues with non-Error objects
      const safeError = error instanceof Error ? error : new Error(String(error));
      
      // Enhanced error logging for DOMException and fetch errors
      console.error('❌ DETAILED Error Analysis:', {
        // Basic error info
        message: safeError.message || 'Unknown error',
        name: safeError.name || 'Unknown',
        stack: safeError.stack || null,
        
        // Request context
        endpoint: endpoint,
        fullUrl: `${API_BASE_URL}${endpoint}`,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
        
        // Error type analysis
        isDOMException: safeError.name === 'DOMException',
        isAbortError: safeError.name === 'AbortError',
        isNetworkFailed: safeError.message?.includes('Network request failed'),
        isFetchError: safeError.message?.includes('fetch'),
        
        // Raw error object inspection
        errorConstructor: safeError.constructor.name,
        errorKeys: Object.keys(safeError),
        errorType: typeof error,
        
        // Network connectivity hints
        apiBaseUrl: API_BASE_URL,
        isDevMode: __DEV__
      });
      
      // Log specific DOMException details if applicable
      if (safeError.name === 'DOMException' || error.name === 'DOMException') {
        console.error('❌ DOMException Specific Analysis:', {
          originalError: error,
          possibleCauses: [
            'Backend server is down or unreachable',
            'Network timeout (request took longer than 15 seconds)',
            'CORS policy blocking the request',
            'Invalid request format or headers',
            'DNS resolution failure'
          ]
        });
      }
      
      let errorMessage = 'Network error';
      let errorCategory = 'unknown';
      
      if (safeError.name === 'AbortError') {
        errorMessage = 'Request timeout. The server is taking longer than expected to respond.';
        errorCategory = 'timeout';
        console.log('⚠️ Request timeout detected - consider retrying the request');
      } else if (safeError.name === 'DOMException') {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        errorCategory = 'dom_exception';
        console.log('⚠️ DOMException detected - likely network connectivity issue');
      } else if (safeError.message?.includes('Network request failed')) {
        errorMessage = 'Cannot reach server. Check your network connection and server status.';
        errorCategory = 'network_failed';
      } else if (safeError.message?.includes('fetch')) {
        errorMessage = 'Failed to connect to server. Please try again.';
        errorCategory = 'fetch_error';
      } else {
        errorMessage = safeError.message || 'Unknown network error';
        errorCategory = 'other';
      }
      
      // Retry logic for recoverable errors
      const isRecoverableError = safeError.name === 'DOMException' || 
                                 safeError.message?.includes('Network request failed') ||
                                 safeError.name === 'TypeError'; // Often network related
      
      if (isRecoverableError && retryCount < maxRetries) {
        console.log(`🔄 Retrying request (attempt ${retryCount + 1}/${maxRetries}) for ${endpoint}`);
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.request(endpoint, options, retryCount + 1);
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCategory,
        isTimeout: safeError.name === 'AbortError',
        isDOMException: safeError.name === 'DOMException',
        isNetworkError: safeError.message?.includes('Network request failed'),
        endpoint: endpoint,
        retriesAttempted: retryCount
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

  async put<T>(endpoint: string, data?: any, token?: string): Promise<ApiResponse<T>> {
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
      method: 'PUT',
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

  // Add health check method for testing connectivity
  async healthCheck(): Promise<ApiResponse<any>> {
    console.log('🏥 Testing backend connectivity...');
    return this.request('/api/health');
  }
}

export const apiService = new ApiService();

// Export a simpler client for direct use
export const apiClient = {
  post: async (endpoint: string, data?: any) => {
    const token = await getAuthToken(); // We'll need to implement this
    return apiService.post(endpoint, data, token);
  },
  put: async (endpoint: string, data?: any) => {
    const token = await getAuthToken();
    return apiService.put(endpoint, data, token);
  },
  get: async (endpoint: string, options?: { params?: Record<string, any> }) => {
    const token = await getAuthToken();
    let fullEndpoint = endpoint;
    
    // Add query parameters if provided
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        fullEndpoint += `?${queryString}`;
      }
    }
    
    return apiService.get(fullEndpoint, token);
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
