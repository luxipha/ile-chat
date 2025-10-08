import { apiService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WalletData {
  address: string;
  chain: string;
  type: string;
  privateKey?: string;
}

interface BackendWalletResponse {
  success: boolean;
  wallet?: {
    address: string;
    privateKey?: string;
    chains?: any[];
    balances?: any;
    walletId?: string;
  };
  error?: string;
}

class ServiceClass {
  
  // Test wallet address for staging environment
  getTestWalletAddress(): string {
    // Return a test wallet address for staging
    return "0x1234567890abcdef1234567890abcdef12345678";
  }

  // Get wallet from backend database
  async getWalletFromBackend(chain: string, type: string): Promise<BackendWalletResponse> {
    try {
      console.log(`🔍 Getting wallet from backend: chain=${chain}, type=${type}`);
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          error: 'No auth token available'
        };
      }

      const response = await apiService.get(`/api/wallet/get?chain=${chain}&type=${type}`, token);
      
      if (response.success && response.data) {
        return {
          success: true,
          wallet: response.data
        };
      }
      
      return {
        success: false,
        error: response.error || 'Failed to get wallet from backend'
      };
    } catch (error) {
      console.error('Error getting wallet from backend:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Save wallet to backend database
  async saveWalletToBackend(walletData: WalletData): Promise<BackendWalletResponse> {
    try {
      console.log(`💾 Saving wallet to backend: ${walletData.address}`);
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          error: 'No auth token available'
        };
      }

      const response = await apiService.post('/api/wallet/save', walletData, token);
      
      if (response.success) {
        return {
          success: true,
          wallet: response.data
        };
      }
      
      return {
        success: false,
        error: response.error || 'Failed to save wallet to backend'
      };
    } catch (error) {
      console.error('Error saving wallet to backend:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get wallet status from backend
  async getWalletStatus(): Promise<BackendWalletResponse> {
    try {
      console.log('🔍 Getting wallet status from backend');
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          error: 'No auth token available'
        };
      }

      const response = await apiService.get('/api/wallet/status', token);
      
      if (response.success && response.data) {
        return {
          success: true,
          wallet: response.data
        };
      }
      
      return {
        success: false,
        error: response.error || 'Failed to get wallet status'
      };
    } catch (error) {
      console.error('Error getting wallet status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

const Service = new ServiceClass();
export default Service;