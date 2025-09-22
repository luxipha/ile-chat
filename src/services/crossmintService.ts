import { createCrossmint } from '@crossmint/wallets-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

interface WalletResponse {
  success: boolean;
  wallet?: {
    walletId: string;
    userId: string;
    chains: Array<{
      chain: string;
      address: string;
      isActive: boolean;
      createdAt: string;
    }>;
    balances?: any;
    isConnected: boolean;
    supportedChains?: string[];
  };
  message?: string;
  error?: string;
}

interface TransactionResponse {
  success: boolean;
  transaction?: {
    id: string;
    hash?: string;
    status: string;
    chain: string;
    amount: string;
    to: string;
  };
  message?: string;
  error?: string;
}

class CrossmintService {
  private crossmint: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    // Skip CrossMint SDK initialization on mobile - we use backend APIs instead
    this.isInitialized = true;
    console.log('CrossMint service initialized (using backend APIs)');
  }

  /**
   * Connect or create CrossMint wallet for user
   * This makes a call to the backend API which handles CrossMint integration
   */
  async connectWallet(): Promise<WalletResponse> {
    try {
      await this.initialize();

      console.log('Making wallet connect request...');
      const response = await apiClient.post('/api/wallet/connect');
      console.log('Wallet connect response:', response);
      
      if (response.data && response.data.success) {
        // Store wallet info locally for quick access
        await AsyncStorage.setItem('walletConnected', 'true');
        await AsyncStorage.setItem('walletData', JSON.stringify(response.data.wallet));
      }

      return response.data || { success: false, error: 'No response data' };
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect wallet'
      };
    }
  }

  /**
   * Get wallet status and balance information
   */
  async getWalletStatus(): Promise<WalletResponse> {
    try {
      await this.initialize();

      const response = await apiClient.get('/api/wallet/status');
      
      if (response.data.success) {
        // Update local wallet data
        await AsyncStorage.setItem('walletData', JSON.stringify(response.data.wallet));
      }

      return response.data;
    } catch (error: any) {
      console.error('Get wallet status error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get wallet status'
      };
    }
  }

  /**
   * Send tokens to another wallet
   */
  async sendTokens(
    toAddress: string, 
    amount: string, 
    chain: string = 'ethereum', 
    token: string = 'native'
  ): Promise<TransactionResponse> {
    try {
      await this.initialize();

      const response = await apiClient.post('/api/wallet/send', {
        toAddress,
        amount,
        chain,
        token
      });

      return response.data;
    } catch (error: any) {
      console.error('Send tokens error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send tokens'
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(chain: string = 'ethereum') {
    try {
      await this.initialize();

      const response = await apiClient.get(`/api/wallet/transactions?chain=${chain}`);
      return response.data;
    } catch (error: any) {
      console.error('Get transaction history error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get transaction history'
      };
    }
  }

  /**
   * Disconnect wallet (soft disconnect)
   */
  async disconnectWallet(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      await this.initialize();

      const response = await apiClient.post('/api/wallet/disconnect');
      
      if (response.data.success) {
        // Clear local wallet data
        await AsyncStorage.removeItem('walletConnected');
        await AsyncStorage.removeItem('walletData');
      }

      return response.data;
    } catch (error: any) {
      console.error('Disconnect wallet error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to disconnect wallet'
      };
    }
  }

  /**
   * Add a new blockchain to the wallet
   */
  async addChainToWallet(chain: string) {
    try {
      await this.initialize();

      const response = await apiClient.post('/api/wallet/add-chain', { chain });
      
      if (response.data.success) {
        // Refresh wallet data
        await this.getWalletStatus();
      }

      return response.data;
    } catch (error: any) {
      console.error('Add chain error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to add chain'
      };
    }
  }

  /**
   * Check if wallet is connected (from local storage)
   */
  async isWalletConnected(): Promise<boolean> {
    try {
      const connected = await AsyncStorage.getItem('walletConnected');
      return connected === 'true';
    } catch (error) {
      console.error('Check wallet connection error:', error);
      return false;
    }
  }

  /**
   * Get locally stored wallet data
   */
  async getLocalWalletData() {
    try {
      const walletData = await AsyncStorage.getItem('walletData');
      return walletData ? JSON.parse(walletData) : null;
    } catch (error) {
      console.error('Get local wallet data error:', error);
      return null;
    }
  }

  /**
   * Format wallet address for display
   */
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): string[] {
    return ['ethereum', 'polygon', 'solana'];
  }

  /**
   * Get chain display name
   */
  getChainDisplayName(chain: string): string {
    const displayNames: { [key: string]: string } = {
      ethereum: 'Ethereum',
      polygon: 'Polygon',
      solana: 'Solana',
      bitcoin: 'Bitcoin'
    };
    return displayNames[chain] || chain;
  }

  /**
   * Send payment to another user (P2P transfer)
   */
  async sendPayment(
    recipientUserId: string | null,
    recipientAddress: string | null,
    amount: string,
    currency: string = 'native',
    chain: string = 'ethereum',
    memo: string = ''
  ): Promise<TransactionResponse> {
    try {
      await this.initialize();

      const response = await apiClient.post('/api/wallet/integrations/crossmint/payments/send', {
        recipientUserId,
        recipientAddress,
        amount,
        currency,
        chain,
        memo
      });

      return response.data;
    } catch (error: any) {
      console.error('Send payment error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send payment'
      };
    }
  }

  /**
   * Generate receive address and QR code for payment
   */
  async generateReceiveRequest(
    chain: string = 'ethereum',
    currency: string = 'native',
    amount: string | null = null
  ): Promise<{
    success: boolean;
    paymentRequest?: {
      recipientAddress: string;
      chain: string;
      currency: string;
      amount: string | null;
      qrCodeData: string;
      displayAddress: string;
      networkName: string;
    };
    error?: string;
  }> {
    try {
      await this.initialize();

      const response = await apiClient.post('/api/wallet/integrations/crossmint/payments/receive', {
        chain,
        currency,
        amount
      });

      return response.data;
    } catch (error: any) {
      console.error('Generate receive request error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to generate receive request'
      };
    }
  }

  /**
   * Get payment history (sent and received)
   */
  async getPaymentHistory(
    chain: string = 'ethereum',
    limit: number = 50,
    offset: number = 0,
    type: 'all' | 'sent' | 'received' = 'all'
  ): Promise<{
    success: boolean;
    transactions?: any[];
    pagination?: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
    error?: string;
  }> {
    try {
      await this.initialize();

      const response = await apiClient.get(
        `/api/wallet/integrations/crossmint/payments/history?chain=${chain}&limit=${limit}&offset=${offset}&type=${type}`
      );

      return response.data;
    } catch (error: any) {
      console.error('Get payment history error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get payment history'
      };
    }
  }
}

export default new CrossmintService();