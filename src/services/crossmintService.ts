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
   * Get wallet status and balance information (with testnet support)
   */
  async getWalletStatus(): Promise<WalletResponse> {
    try {
      await this.initialize();

      // For staging/testnet environment, we need to specify testnets
      // Try with testnet parameter first
      console.log('🔄 Fetching wallet status with testnet support...');
      
      let response;
      try {
        // First try with testnet parameter
        response = await apiClient.get('/api/wallet/status?testnet=true');
        console.log('✅ Testnet wallet status response:', response);
      } catch (testnetError) {
        console.log('⚠️ Testnet parameter failed, trying default...');
        // Fallback to default endpoint
        response = await apiClient.get('/api/wallet/status');
        console.log('📡 Default wallet status response:', response);
      }
      
      if (response.data && response.data.success) {
        // Update local wallet data
        await AsyncStorage.setItem('walletData', JSON.stringify(response.data.wallet));
        
        // Log the wallet data to understand the structure
        console.log('💾 Stored wallet data:', JSON.stringify(response.data.wallet, null, 2));
      }

      return response.data || response;
    } catch (error: any) {
      console.error('❌ Get wallet status error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get wallet status'
      };
    }
  }

  /**
   * Get wallet balance using CrossMint staging API (works with test address)
   */
  async getWalletBalance(address: string = "0x678bCC985D12C5fF769A2F4A5ff323A2029284Bb"): Promise<{ success: boolean; balances?: { [token: string]: string }; error?: string }> {
    try {
      console.log('🔄 Getting CrossMint balance for address:', address);
      
      // Use the working CrossMint staging API
      const apiKey = process.env.EXPO_PUBLIC_CROSSMINT_CLIENT_API_KEY || 'ck_staging_5zjWiW7TV26xSe1p117tHktSNAQmTwSLu51cB326brCKVc3DW8j5JDGx6yki39kDpAGjWd7fgrK7g17d9cCJeciWAG4ugruJABAMPS2PUxR2ECAwKnNju4pTKaSS1GkHZvvobJdPsJSHQxKnfBDHSZM9yKhsVHh8v9P6BiueSVF1aB3W5YN4kGY6mz3m85McCUTwre9rBCjTMbdy3kEkeCoP';
      const balanceUrl = `https://staging.crossmint.com/api/v1-alpha2/wallets/${address}/balances?tokens=usdc,eth`;
      
      const response = await fetch(balanceUrl, {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`CrossMint API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ CrossMint API response:', data);
      
      const formattedBalances: { [token: string]: string } = {};
      
      // Process the response data
      data.forEach((tokenData: any) => {
        if (tokenData.token === 'usdc' && tokenData.balances) {
          // Convert USDC balances (6 decimals)
          Object.entries(tokenData.balances).forEach(([chain, balance]: [string, any]) => {
            const balanceNum = Number(balance) / Math.pow(10, tokenData.decimals || 6);
            if (balanceNum > 0) {
              const chainName = chain === 'ethereum-sepolia' ? 'Ethereum Sepolia' :
                               chain === 'polygon-amoy' ? 'Polygon Amoy' :
                               chain === 'base-sepolia' ? 'Base Sepolia' : chain;
              formattedBalances[`USDC (${chainName})`] = balanceNum.toString();
              console.log(`💰 Found USDC on ${chainName}: ${balanceNum}`);
            }
          });
        }
        
        if (tokenData.token === 'eth' && tokenData.balances) {
          // Convert ETH balances (18 decimals)
          Object.entries(tokenData.balances).forEach(([chain, balance]: [string, any]) => {
            const balanceNum = Number(balance) / Math.pow(10, tokenData.decimals || 18);
            if (balanceNum > 0) {
              const chainName = chain === 'ethereum-sepolia' ? 'Ethereum Sepolia' :
                               chain === 'polygon-amoy' ? 'Polygon Amoy' :
                               chain === 'base-sepolia' ? 'Base Sepolia' : chain;
              const tokenSymbol = chain.includes('polygon') ? 'MATIC' : 'ETH';
              formattedBalances[`${tokenSymbol} (${chainName})`] = balanceNum.toString();
              console.log(`🔷 Found ${tokenSymbol} on ${chainName}: ${balanceNum}`);
            }
          });
        }
      });
      
      return {
        success: true,
        balances: formattedBalances
      };
      
    } catch (error: any) {
      console.error('❌ Get CrossMint balance error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get CrossMint balance'
      };
    }
  }

  /**
   * Get the test wallet address for CrossMint staging
   */
  getTestWalletAddress(): string {
    return "0x678bCC985D12C5fF769A2F4A5ff323A2029284Bb";
  }

  /**
   * Check if we have a CrossMint wallet (for staging, we use the test address)
   */
  async hasWalletConnected(): Promise<boolean> {
    // For staging/testing, we always have the test wallet
    return true;
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
   * Get supported chains (testnets for staging)
   */
  getSupportedChains(): string[] {
    return ['sepolia', 'mumbai', 'solana-devnet'];
  }

  /**
   * Get chain display name
   */
  getChainDisplayName(chain: string): string {
    const displayNames: { [key: string]: string } = {
      ethereum: 'Ethereum',
      sepolia: 'Ethereum (Sepolia)',
      polygon: 'Polygon', 
      mumbai: 'Polygon (Mumbai)',
      solana: 'Solana',
      'solana-devnet': 'Solana (Devnet)',
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

  /**
   * Save wallet (including Aptos) to backend database
   */
  async saveWalletToBackend(walletData: {
    address: string;
    chain: string;
    type: 'crossmint' | 'aptos';
    privateKey?: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      await this.initialize();

      const response = await apiClient.post('/api/wallet/save', {
        address: walletData.address,
        chain: walletData.chain,
        walletType: walletData.type,
        privateKey: walletData.privateKey // Backend should encrypt this
      });

      return response.data;
    } catch (error: any) {
      console.error('Save wallet to backend error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to save wallet to backend'
      };
    }
  }

  /**
   * Get wallet from backend database (including Aptos)
   */
  async getWalletFromBackend(chain: string, type: 'crossmint' | 'aptos'): Promise<{
    success: boolean;
    wallet?: {
      address: string;
      chain: string;
      type: string;
      privateKey?: string;
    };
    error?: string;
  }> {
    try {
      console.log('🔄 Initializing crossmintService...');
      await this.initialize();
      
      console.log('🔄 Making wallet GET request:', {
        endpoint: `/api/wallet/get?chain=${chain}&type=${type}`,
        chain,
        type
      });

      const response = await apiClient.get(`/api/wallet/get?chain=${chain}&type=${type}`);
      
      console.log('✅ Wallet GET response:', {
        success: response.success,
        hasData: !!response.data,
        data: response.data
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Get wallet from backend error:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      return {
        success: false,
        error: error.response?.data?.message || error?.message || 'Failed to get wallet from backend'
      };
    }
  }

  /**
   * Get EVM wallet balances directly via RPC (fallback method)
   */
  async getEVMBalancesDirect(address: string): Promise<{ success: boolean; balances?: { [token: string]: string }; error?: string }> {
    try {
      console.log('🔍 Getting EVM balances directly via RPC for:', address);
      
      const balances: { [token: string]: string } = {};
      
      const networks = [
        {
          name: "Ethereum Sepolia",
          rpc: "https://ethereum-sepolia-rpc.publicnode.com",
          symbol: "ETH",
          usdcContracts: [
            { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", name: "USDC" },
            { address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", name: "USDC.e" }
          ]
        },
        {
          name: "Polygon Amoy",
          rpc: "https://rpc-amoy.polygon.technology", 
          symbol: "MATIC",
          usdcContracts: [
            { address: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", name: "USDC" },
            { address: "0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97", name: "USDC.e" }
          ]
        }
      ];

      for (const network of networks) {
        try {
          // 1. Check native balance (ETH/MATIC)
          const response = await fetch(network.rpc, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_getBalance",
              params: [address, "latest"],
              id: 1
            })
          });
          
          const result = await response.json();
          if (result.result) {
            const balanceWei = BigInt(result.result);
            const balanceEth = Number(balanceWei) / 1e18;
            if (balanceEth > 0) {
              balances[network.symbol] = balanceEth.toString();
              console.log(`✅ ${network.name}: ${balanceEth} ${network.symbol}`);
            }
          }

          // 2. Check USDC balances
          if (network.usdcContracts) {
            for (const usdc of network.usdcContracts) {
              try {
                const usdcResponse = await fetch(network.rpc, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "eth_call",
                    params: [{
                      to: usdc.address,
                      data: `0x70a08231000000000000000000000000${address.slice(2).toLowerCase()}`
                    }, "latest"],
                    id: 2
                  })
                });
                
                const usdcResult = await usdcResponse.json();
                if (usdcResult.result && usdcResult.result !== "0x" && usdcResult.result !== "0x0") {
                  const usdcBalanceWei = BigInt(usdcResult.result);
                  const usdcBalance = Number(usdcBalanceWei) / 1e6; // USDC has 6 decimals
                  if (usdcBalance > 0) {
                    balances[`USDC_${network.name.replace(' ', '_')}`] = usdcBalance.toString();
                    console.log(`✅ ${network.name}: ${usdcBalance} ${usdc.name}`);
                  }
                }
              } catch (usdcError) {
                console.log(`⚠️ ${network.name} ${usdc.name} error:`, usdcError);
              }
            }
          }
        } catch (networkError) {
          console.log(`⚠️ ${network.name} error:`, networkError);
        }
      }
      
      return {
        success: true,
        balances
      };
    } catch (error: any) {
      console.error('❌ Direct EVM balance fetch error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch EVM balances directly'
      };
    }
  }
}

export default new CrossmintService();