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

interface WalletApiResponse {
  success: boolean;
  wallet: {
    address: string;
    privateKey?: string;
    chain?: string;
    type?: string;
  };
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

      const response = await apiService.get<WalletApiResponse>(`/api/wallet/get?chain=${chain}&type=${type}`, token);
      
      console.log('🔍 [DEBUG] API response from backend:', JSON.stringify(response, null, 2));
      console.log('🔍 [DEBUG] Response data:', response.data);
      console.log('🔍 [DEBUG] Response data wallet:', response.data?.wallet);
      
      if (response.success && response.data && response.data.wallet) {
        return {
          success: true,
          wallet: response.data.wallet
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

      const response = await apiService.post<WalletApiResponse>('/api/wallet/save', walletData, token);
      
      if (response.success && response.data) {
        return {
          success: true,
          wallet: response.data.wallet
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

      const response = await apiService.get<WalletApiResponse>('/api/wallet/status', token);
      
      if (response.success && response.data && response.data.wallet) {
        return {
          success: true,
          wallet: response.data.wallet
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

  // Base wallet operations
  
  /**
   * Get Base wallet from backend
   */
  async getBaseWallet(): Promise<BackendWalletResponse> {
    try {
      console.log('🔵 Getting Base wallet from backend');
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          error: 'No auth token available'
        };
      }

      const response = await apiService.get<any>('/api/base/wallet', token);
      
      console.log('🔍 [Service] Full response from /api/base/wallet:', JSON.stringify(response, null, 2));
      console.log('🔍 [Service] response.data:', response.data);
      console.log('🔍 [Service] response.data.address:', response.data?.address);
      console.log('🔍 [Service] response.data.data:', response.data?.data);
      console.log('🔍 [Service] response.data.data?.address:', response.data?.data?.address);
      
      if (response.success && response.data) {
        // Try both response.data.address and response.data.data.address
        const walletAddress = response.data.address || response.data.data?.address;
        const walletData = response.data.data || response.data;
        
        console.log('🔍 [Service] Extracted walletAddress:', walletAddress);
        console.log('🔍 [Service] Extracted walletData:', walletData);
        
        return {
          success: true,
          wallet: {
            address: walletAddress,
            walletId: walletAddress,
            chains: [{
              chain: 'base-sepolia',
              address: walletAddress,
              isActive: true,
              createdAt: walletData.connectedAt || new Date().toISOString()
            }],
            balances: walletData.balance
          }
        };
      }
      
      return {
        success: false,
        error: response.error || 'No Base wallet found'
      };
    } catch (error) {
      console.error('❌ Error getting Base wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create Base wallet via backend
   */
  async createBaseWallet(): Promise<BackendWalletResponse> {
    try {
      console.log('🔵 Creating Base wallet via backend');
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          error: 'No auth token available'
        };
      }

      const response = await apiService.post<any>('/api/base/create-wallet', {}, token);
      
      if (response.success && response.data) {
        return {
          success: true,
          wallet: {
            address: response.data.address,
            walletId: response.data.address,
            chains: [{
              chain: 'base-sepolia',
              address: response.data.address,
              isActive: true,
              createdAt: response.data.createdAt || new Date().toISOString()
            }],
            balances: {
              ETH: response.data.balance || '0',
              USDC: '0'
            }
          }
        };
      }
      
      return {
        success: false,
        error: response.error || 'Failed to create Base wallet'
      };
    } catch (error) {
      console.error('❌ Error creating Base wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get Base wallet balance
   */
  async getBaseBalance(address: string): Promise<BackendWalletResponse> {
    try {
      console.log('🔵 Getting Base balance for:', address);
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          error: 'No auth token available'
        };
      }

      const response = await apiService.get<any>(`/api/base/balance/${address}`, token);
      
      if (response.success && response.data) {
        return {
          success: true,
          wallet: {
            address: response.data.address,
            balances: {
              ETH: response.data.balance,
              ETH_FORMATTED: response.data.balanceFormatted
            }
          }
        };
      }
      
      return {
        success: false,
        error: response.error || 'Failed to get Base balance'
      };
    } catch (error) {
      console.error('❌ Error getting Base balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current user's Base wallet balance (auto-generates wallet if missing)
   */
  async getCurrentUserBaseBalance(): Promise<{
    success: boolean;
    balance?: string;
    balanceUSD?: string;
    usdcBalance?: string;
    address?: string;
    error?: string;
  }> {
    try {
      console.log('🔵 Getting current user Base wallet balance');
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          error: 'No auth token available'
        };
      }

      // Call the /api/base/wallet endpoint which auto-generates wallet if missing
      const response = await apiService.get<any>('/api/base/wallet', token);
      
      if (response.success && response.data) {
        // Handle nested data structure - the actual data is in response.data.data
        const actualData = response.data.data || response.data;
        const balanceData = actualData.balance;
        
        // Extract USDC balance if available
        let usdcBalance = '0.00';
        let totalUSD = '0.00';
        
        console.log('🔍 [Service] Checking for USDC in:', {
          hasUsdc: !!actualData.usdc,
          usdcData: actualData.usdc
        });
        
        // Check if the response includes USDC data
        if (actualData.usdc) {
          usdcBalance = actualData.usdc.balanceUSD || actualData.usdc.balanceFormatted || '0.00';
          totalUSD = usdcBalance; // USDC is pegged to USD
          console.log('✅ [Service] Extracted USDC balance:', usdcBalance);
        } else {
          console.log('❌ [Service] No USDC data found in response');
        }
        
        return {
          success: true,
          balance: balanceData?.balanceFormatted || '0.000000 ETH',
          balanceUSD: totalUSD,
          usdcBalance: usdcBalance,
          address: actualData.address
        };
      }
      
      return {
        success: false,
        error: response.error || 'Failed to get Base wallet balance'
      };
    } catch (error) {
      console.error('❌ Error getting Base balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Disconnect Base wallet
   */
  async disconnectBaseWallet(): Promise<BackendWalletResponse> {
    try {
      console.log('🔵 Disconnecting Base wallet from backend');
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          error: 'No auth token available'
        };
      }

      const response = await apiService.delete<any>('/api/base/disconnect-wallet', token);
      
      if (response.success) {
        return {
          success: true
        };
      }
      
      return {
        success: false,
        error: response.error || 'Failed to disconnect Base wallet'
      };
    } catch (error) {
      console.error('❌ Error disconnecting Base wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

const Service = new ServiceClass();
export default Service;