/**
 * Base Network Service
 * Provides wallet and transaction functionality for Base (Ethereum L2)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import authService from './authService';

// Base network configuration
const BASE_NETWORKS = {
  testnet: {
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    chainId: 84532,
    explorerUrl: 'https://sepolia.basescan.org',
    faucetUrl: 'https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Base Sepolia USDC
  },
  mainnet: {
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    chainId: 8453,
    explorerUrl: 'https://basescan.org',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base Mainnet USDC
  }
};

export interface BaseWalletResponse {
  success: boolean;
  address?: string;
  privateKey?: string;
  mnemonic?: string;
  network?: string;
  chainId?: number;
  balance?: string;
  balanceFormatted?: string;
  error?: string;
  message?: string;
}

export interface BaseBalanceResponse {
  success: boolean;
  ethBalance?: string;
  ethBalanceFormatted?: string;
  usdcBalance?: string;
  usdcBalanceFormatted?: string;
  error?: string;
  message?: string;
}

export interface BaseTransactionResponse {
  success: boolean;
  transactionHash?: string;
  gasUsed?: string;
  gasPrice?: string;
  error?: string;
  message?: string;
}

class BaseService {
  private network: 'testnet' | 'mainnet' = 'testnet';

  constructor() {
    this.network = process.env.EXPO_PUBLIC_CHAIN_ID === 'base' ? 'mainnet' : 'testnet';
    console.log('🔵 [BaseService] Initialized for network:', this.network);
  }

  /**
   * Generate a new Base wallet
   */
  async generateWallet(): Promise<BaseWalletResponse> {
    try {
      console.log('🔵 [BaseService] Generating new Base wallet...');

      // Check if user is authenticated
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        return {
          success: false,
          error: 'Authentication required',
          message: 'Please log in to create a Base wallet'
        };
      }

      // Call backend to generate wallet (using authenticated client)
      const response = await apiClient.post('/api/base/create-wallet', {});

      if (response.success && response.data) {
        const walletData = response.data;
        
        // Save wallet to local storage
        await this.saveWalletToStorage({
          address: walletData.address,
          network: walletData.network,
          chainId: walletData.chainId,
        });

        console.log('✅ [BaseService] Base wallet generated successfully:', walletData.address);

        return {
          success: true,
          address: walletData.address,
          network: walletData.network,
          chainId: walletData.chainId,
          balance: walletData.balance,
          balanceFormatted: walletData.balanceFormatted || '0.000000 ETH',
          message: 'Base wallet created successfully'
        };
      } else {
        // Check if it's an authentication error
        if (response.status === 401) {
          return {
            success: false,
            error: 'Authentication required',
            message: 'Your session has expired. Please log in again to create a Base wallet.'
          };
        }
        throw new Error(response.error || 'Failed to generate wallet');
      }
    } catch (error) {
      console.error('❌ [BaseService] Error generating wallet:', error);
      
      // Check if error message contains authentication info
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
        return {
          success: false,
          error: 'Authentication required',
          message: 'Please log in to create a Base wallet'
        };
      }
      
      return {
        success: false,
        error: 'Failed to generate Base wallet',
        message: errorMessage
      };
    }
  }

  /**
   * Get existing wallet from backend
   */
  async getWallet(): Promise<BaseWalletResponse> {
    try {
      console.log('🔵 [BaseService] Getting Base wallet from backend...');

      const response = await apiClient.get('/api/base/wallet');

      if (response.success && response.data) {
        const walletData = response.data;
        
        // Update local storage
        await this.saveWalletToStorage({
          address: walletData.address,
          network: walletData.network,
          chainId: walletData.chainId,
        });

        return {
          success: true,
          address: walletData.address,
          network: walletData.network,
          chainId: walletData.chainId,
          balance: walletData.balance?.balance,
          balanceFormatted: walletData.balance?.balanceFormatted || '0.000000 ETH'
        };
      } else {
        return {
          success: false,
          error: 'No Base wallet found',
          message: 'Create a Base wallet first'
        };
      }
    } catch (error) {
      console.error('❌ [BaseService] Error getting wallet:', error);
      return {
        success: false,
        error: 'Failed to get Base wallet',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if user has a Base wallet
   */
  async hasWallet(): Promise<boolean> {
    try {
      const walletData = await this.getWalletFromStorage();
      if (walletData?.address) {
        return true;
      }

      // Check backend
      const response = await this.getWallet();
      return response.success && !!response.address;
    } catch (error) {
      console.error('❌ [BaseService] Error checking wallet:', error);
      return false;
    }
  }

  /**
   * Get wallet balance (ETH and USDC)
   */
  async getBalance(address?: string): Promise<BaseBalanceResponse> {
    try {
      let walletAddress = address;
      
      if (!walletAddress) {
        const walletData = await this.getWalletFromStorage();
        walletAddress = walletData?.address;
      }

      if (!walletAddress) {
        throw new Error('No wallet address available');
      }

      console.log('🔵 [BaseService] Getting balance for:', walletAddress);

      // Get ETH balance from backend
      const response = await apiClient.get(`/api/base/balance/${walletAddress}`);

      if (response.success && response.data) {
        const balanceData = response.data;
        
        return {
          success: true,
          ethBalance: balanceData.balance,
          ethBalanceFormatted: balanceData.balanceFormatted,
          // TODO: Add USDC balance fetching
          usdcBalance: '0',
          usdcBalanceFormatted: '0.000000 USDC'
        };
      } else {
        throw new Error(response.error || 'Failed to get balance');
      }
    } catch (error) {
      console.error('❌ [BaseService] Error getting balance:', error);
      return {
        success: false,
        error: 'Failed to get balance',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send ETH on Base network
   */
  async sendETH(toAddress: string, amount: number): Promise<BaseTransactionResponse> {
    try {
      console.log('🔵 [BaseService] Sending ETH:', { toAddress, amount });

      // Note: For now, this is a placeholder
      // In production, you'd implement the actual transaction sending
      // This would require the private key which should be handled securely
      
      return {
        success: false,
        error: 'Transaction sending not implemented',
        message: 'ETH sending functionality coming soon'
      };
    } catch (error) {
      console.error('❌ [BaseService] Error sending ETH:', error);
      return {
        success: false,
        error: 'Failed to send ETH',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send USDC on Base network
   */
  async sendUSDC(toAddress: string, amount: number): Promise<BaseTransactionResponse> {
    try {
      console.log('🔵 [BaseService] Sending USDC:', { toAddress, amount });

      // Note: For now, this is a placeholder
      // In production, you'd implement the actual USDC transfer
      
      return {
        success: false,
        error: 'Transaction sending not implemented',
        message: 'USDC sending functionality coming soon'
      };
    } catch (error) {
      console.error('❌ [BaseService] Error sending USDC:', error);
      return {
        success: false,
        error: 'Failed to send USDC',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(address?: string): Promise<BaseTransactionResponse[]> {
    try {
      let walletAddress = address;
      
      if (!walletAddress) {
        const walletData = await this.getWalletFromStorage();
        walletAddress = walletData?.address;
      }

      if (!walletAddress) {
        throw new Error('No wallet address available');
      }

      console.log('🔵 [BaseService] Getting transaction history for:', walletAddress);

      // Note: For now, return empty array
      // In production, you'd implement actual transaction history fetching
      
      return [];
    } catch (error) {
      console.error('❌ [BaseService] Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    const networkConfig = BASE_NETWORKS[this.network];
    return {
      network: this.network,
      chainId: networkConfig.chainId,
      name: networkConfig.name,
      rpcUrl: networkConfig.rpcUrl,
      explorerUrl: networkConfig.explorerUrl,
      faucetUrl: networkConfig.faucetUrl,
      usdcAddress: networkConfig.usdcAddress
    };
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<BaseWalletResponse> {
    try {
      console.log('🔵 [BaseService] Disconnecting Base wallet...');

      // Remove from backend
      const response = await apiClient.delete('/api/base/disconnect-wallet');

      // Remove from local storage
      await AsyncStorage.removeItem('base_wallet');

      if (response.success) {
        return {
          success: true,
          message: 'Base wallet disconnected successfully'
        };
      } else {
        throw new Error(response.error || 'Failed to disconnect wallet');
      }
    } catch (error) {
      console.error('❌ [BaseService] Error disconnecting wallet:', error);
      return {
        success: false,
        error: 'Failed to disconnect Base wallet',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods

  private async saveWalletToStorage(walletData: any) {
    try {
      await AsyncStorage.setItem('base_wallet', JSON.stringify(walletData));
    } catch (error) {
      console.error('❌ [BaseService] Error saving wallet to storage:', error);
    }
  }

  private async getWalletFromStorage() {
    try {
      const walletData = await AsyncStorage.getItem('base_wallet');
      return walletData ? JSON.parse(walletData) : null;
    } catch (error) {
      console.error('❌ [BaseService] Error getting wallet from storage:', error);
      return null;
    }
  }
}

// Export singleton instance
const baseService = new BaseService();
export default baseService;