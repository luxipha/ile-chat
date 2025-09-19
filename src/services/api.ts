import { ApiResponse, User, Transaction, Property } from '../types';

const API_BASE_URL = 'https://your-backend-api.com/api'; // Replace with actual backend URL

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
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
}

export const apiService = new ApiService();