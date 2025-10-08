import AsyncStorage from '@react-native-async-storage/async-storage';
import aptosService from './aptosService';

import { API_BASE_URL } from '../config/apiConfig';

export interface ContributionGroupWallet {
  id: string;
  groupId: string;
  contractAddress: string;
  chainId: number;
  signatories: string[];
  threshold: number;
  balance: { [token: string]: number };
  totalValue: number;
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'paused' | 'frozen';
  transactionCount: number;
  goalAmount?: number;
  goalProgress: number;
}

export interface ContributionTransaction {
  id: string;
  groupId: string;
  walletId: string;
  type: 'contribution' | 'withdrawal' | 'goal_payout';
  amount: number;
  token: string;
  fromAddress: string;
  toAddress: string;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  gasFee?: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
  confirmedAt?: Date;
  metadata: {
    userId: string;
    userName: string;
    userAvatar?: string;
    purpose?: string;
    isRecurring?: boolean;
    frequency?: 'weekly' | 'monthly' | 'quarterly';
  };
}

export interface MemberContribution {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  totalContributed: number;
  contributionCount: number;
  lastContribution?: Date;
  averageContribution: number;
  percentage: number;
  status: 'active' | 'inactive';
  recurringSettings?: {
    isEnabled: boolean;
    amount: number;
    frequency: 'weekly' | 'monthly' | 'quarterly';
    nextContribution?: Date;
  };
}

export interface WalletDeploymentConfig {
  networkId: number;
  networkName: string;
  signatories: string[];
  threshold: number;
  supportedTokens: string[];
  goalAmount?: number;
  purpose: string;
}

export interface WalletDeploymentStatus {
  step: 'initializing' | 'deploying' | 'configuring' | 'testing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  txHash?: string;
  contractAddress?: string;
  estimatedTime?: number; // seconds
  error?: string;
}

class ContributionGroupService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  /**
   * Create a new contribution group wallet
   */
  async createContributionWallet(
    groupId: string, 
    config: WalletDeploymentConfig
  ): Promise<{ success: boolean; walletId?: string; message: string }> {
    try {
      console.log('🔄 [ContributionGroupService] Creating contribution wallet:', { 
        groupId, 
        config 
      });

      const result = await this.makeRequest('/api/contribution-groups/wallet/create', {
        method: 'POST',
        body: JSON.stringify({
          groupId,
          networkId: config.networkId,
          networkName: config.networkName,
          signatories: config.signatories,
          threshold: config.threshold,
          supportedTokens: config.supportedTokens,
          goalAmount: config.goalAmount,
          purpose: config.purpose,
        }),
      });

      console.log('✅ [ContributionGroupService] Wallet creation initiated:', result);
      return result;
    } catch (error) {
      console.error('❌ [ContributionGroupService] Failed to create wallet:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create wallet'
      };
    }
  }

  /**
   * Get wallet deployment status
   */
  async getWalletDeploymentStatus(walletId: string): Promise<{ success: boolean; status?: WalletDeploymentStatus }> {
    try {
      console.log('🔄 [ContributionGroupService] Getting wallet deployment status:', walletId);

      const result = await this.makeRequest(`/api/contribution-groups/wallet/${walletId}/deployment-status`);
      
      console.log('✅ [ContributionGroupService] Deployment status received:', result);
      return result;
    } catch (error) {
      console.error('❌ [ContributionGroupService] Failed to get deployment status:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Get contribution group wallet details with real Aptos balance
   */
  async getGroupWallet(groupId: string): Promise<{ success: boolean; wallet?: ContributionGroupWallet }> {
    try {
      console.log('🔄 [ContributionGroupService] Getting group wallet:', groupId);

      const result = await this.makeRequest(`/api/contribution-groups/${groupId}/wallet`);
      
      // Convert date strings to Date objects
      if (result.success && result.wallet) {
        result.wallet.createdAt = new Date(result.wallet.createdAt);
        result.wallet.lastActivity = new Date(result.wallet.lastActivity);

        // Get real-time balance from Aptos blockchain
        if (result.wallet.contractAddress) {
          console.log('📊 [ContributionGroupService] Fetching real Aptos balance for:', result.wallet.contractAddress);
          
          try {
            const aptosBalances = await aptosService.getAllBalances(result.wallet.contractAddress);
            
            if (aptosBalances.success && aptosBalances.balances) {
              // Update wallet balance with real blockchain data
              const updatedBalance: { [token: string]: number } = {};
              let totalValue = 0;

              // Process APT balance
              if (aptosBalances.balances.APT) {
                const aptAmount = parseFloat(aptosBalances.balances.APT) / 100_000_000; // Convert from octas
                updatedBalance.APT = aptAmount;
                totalValue += aptAmount * 10; // Rough APT price estimate for demo
              }

              // Process USDC balance
              if (aptosBalances.balances.USDC) {
                const usdcAmount = parseFloat(aptosBalances.balances.USDC);
                updatedBalance.USDC = usdcAmount;
                totalValue += usdcAmount; // USDC is ~$1
              }

              // Process other tokens
              Object.keys(aptosBalances.balances).forEach(symbol => {
                if (symbol !== 'APT' && symbol !== 'USDC') {
                  const amount = parseFloat(aptosBalances.balances![symbol]);
                  updatedBalance[symbol] = amount;
                  // Add estimated value for other tokens
                  totalValue += amount * 0.5; // Conservative estimate
                }
              });

              result.wallet.balance = updatedBalance;
              result.wallet.totalValue = totalValue;
              result.wallet.lastActivity = new Date(); // Update last activity

              console.log('✅ [ContributionGroupService] Updated wallet with real Aptos balances:', {
                balance: updatedBalance,
                totalValue,
              });
            }
          } catch (balanceError) {
            console.warn('⚠️ [ContributionGroupService] Failed to fetch real balance, using cached:', balanceError);
            // Continue with cached balance from database
          }
        }
      }

      console.log('✅ [ContributionGroupService] Group wallet retrieved:', result);
      return result;
    } catch (error) {
      console.error('❌ [ContributionGroupService] Failed to get group wallet:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Make a contribution to the group wallet using Aptos
   */
  async contributeToGroup(
    groupId: string,
    amount: number,
    token: string,
    purpose?: string,
    isRecurring?: boolean,
    frequency?: 'weekly' | 'monthly' | 'quarterly'
  ): Promise<{ success: boolean; transactionId?: string; txHash?: string; message: string }> {
    try {
      console.log('🔄 [ContributionGroupService] Making Aptos contribution:', {
        groupId,
        amount,
        token,
        purpose,
        isRecurring,
        frequency
      });

      // Step 1: Get group wallet address from backend
      const walletResponse = await this.getGroupWallet(groupId);
      if (!walletResponse.success || !walletResponse.wallet) {
        throw new Error('Group wallet not found');
      }

      const groupWalletAddress = walletResponse.wallet.contractAddress;
      console.log('📍 [ContributionGroupService] Group wallet address:', groupWalletAddress);

      // Step 2: Send tokens using Aptos service
      let txResult;
      if (token === 'USDC') {
        console.log('💵 Sending USDC via Aptos...');
        txResult = await aptosService.sendUSDC(groupWalletAddress, amount);
      } else if (token === 'APT') {
        console.log('🟡 Sending APT via Aptos...');
        txResult = await aptosService.sendAPT(groupWalletAddress, amount);
      } else {
        throw new Error(`Unsupported token: ${token}`);
      }

      if (!txResult.success) {
        throw new Error(txResult.error || 'Blockchain transaction failed');
      }

      console.log('✅ [ContributionGroupService] Aptos transaction successful:', txResult.hash);

      // Step 3: Record contribution in backend database
      const recordResult = await this.makeRequest('/api/contribution-groups/contribute', {
        method: 'POST',
        body: JSON.stringify({
          groupId,
          amount,
          token,
          txHash: txResult.hash,
          purpose,
          isRecurring,
          frequency,
        }),
      });

      console.log('✅ [ContributionGroupService] Contribution recorded in database');
      
      return {
        success: true,
        transactionId: recordResult.transactionId,
        txHash: txResult.hash,
        message: 'Contribution successful'
      };
      
    } catch (error) {
      console.error('❌ [ContributionGroupService] Failed to contribute:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process contribution'
      };
    }
  }

  /**
   * Request withdrawal from group wallet (requires multi-sig approval)
   */
  async requestWithdrawal(
    groupId: string,
    amount: number,
    token: string,
    purpose: string,
    recipientAddress: string
  ): Promise<{ success: boolean; withdrawalId?: string; message: string }> {
    try {
      console.log('🔄 [ContributionGroupService] Requesting withdrawal:', {
        groupId,
        amount,
        token,
        purpose,
        recipientAddress
      });

      const result = await this.makeRequest('/api/contribution-groups/withdraw/request', {
        method: 'POST',
        body: JSON.stringify({
          groupId,
          amount,
          token,
          purpose,
          recipientAddress,
        }),
      });

      console.log('✅ [ContributionGroupService] Withdrawal request created:', result);
      return result;
    } catch (error) {
      console.error('❌ [ContributionGroupService] Failed to request withdrawal:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to request withdrawal'
      };
    }
  }

  /**
   * Approve a withdrawal request (for multi-sig signatories)
   */
  async approveWithdrawal(
    withdrawalId: string,
    signature: string
  ): Promise<{ success: boolean; message: string; executed?: boolean }> {
    try {
      console.log('🔄 [ContributionGroupService] Approving withdrawal:', { withdrawalId });

      const result = await this.makeRequest(`/api/contribution-groups/withdraw/${withdrawalId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          signature,
        }),
      });

      console.log('✅ [ContributionGroupService] Withdrawal approved:', result);
      return result;
    } catch (error) {
      console.error('❌ [ContributionGroupService] Failed to approve withdrawal:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve withdrawal'
      };
    }
  }

  /**
   * Get member contributions for a group
   */
  async getMemberContributions(groupId: string): Promise<{ success: boolean; contributions: MemberContribution[] }> {
    try {
      console.log('🔄 [ContributionGroupService] Getting member contributions:', groupId);

      const result = await this.makeRequest(`/api/contribution-groups/${groupId}/contributions`);
      
      // Convert date strings to Date objects
      if (result.success && result.contributions) {
        result.contributions.forEach((contribution: any) => {
          if (contribution.lastContribution) {
            contribution.lastContribution = new Date(contribution.lastContribution);
          }
          if (contribution.recurringSettings?.nextContribution) {
            contribution.recurringSettings.nextContribution = new Date(contribution.recurringSettings.nextContribution);
          }
        });
      }

      console.log('✅ [ContributionGroupService] Member contributions retrieved:', {
        count: result.contributions?.length || 0
      });
      return result;
    } catch (error) {
      console.error('❌ [ContributionGroupService] Failed to get member contributions:', error);
      return {
        success: false,
        contributions: []
      };
    }
  }

  /**
   * Get transaction history for a group
   */
  async getTransactionHistory(
    groupId: string,
    limit: number = 20,
    offset: number = 0,
    type?: 'contribution' | 'withdrawal' | 'goal_payout'
  ): Promise<{ success: boolean; transactions: ContributionTransaction[]; hasMore: boolean }> {
    try {
      console.log('🔄 [ContributionGroupService] Getting transaction history:', {
        groupId,
        limit,
        offset,
        type
      });

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(type && { type }),
      });

      const result = await this.makeRequest(`/api/contribution-groups/${groupId}/transactions?${params}`);
      
      // Convert date strings to Date objects
      if (result.success && result.transactions) {
        result.transactions.forEach((tx: any) => {
          tx.createdAt = new Date(tx.createdAt);
          if (tx.confirmedAt) {
            tx.confirmedAt = new Date(tx.confirmedAt);
          }
        });
      }

      console.log('✅ [ContributionGroupService] Transaction history retrieved:', {
        count: result.transactions?.length || 0,
        hasMore: result.hasMore
      });
      return result;
    } catch (error) {
      console.error('❌ [ContributionGroupService] Failed to get transaction history:', error);
      return {
        success: false,
        transactions: [],
        hasMore: false
      };
    }
  }

  /**
   * Get transaction details by ID
   */
  async getTransactionDetails(transactionId: string): Promise<{ success: boolean; transaction?: ContributionTransaction }> {
    try {
      console.log('🔄 [ContributionGroupService] Getting transaction details:', transactionId);

      const result = await this.makeRequest(`/api/contribution-groups/transactions/${transactionId}`);
      
      // Convert date strings to Date objects
      if (result.success && result.transaction) {
        result.transaction.createdAt = new Date(result.transaction.createdAt);
        if (result.transaction.confirmedAt) {
          result.transaction.confirmedAt = new Date(result.transaction.confirmedAt);
        }
      }

      console.log('✅ [ContributionGroupService] Transaction details retrieved:', result);
      return result;
    } catch (error) {
      console.error('❌ [ContributionGroupService] Failed to get transaction details:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Update recurring contribution settings
   */
  async updateRecurringContribution(
    groupId: string,
    isEnabled: boolean,
    amount?: number,
    frequency?: 'weekly' | 'monthly' | 'quarterly'
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 [ContributionGroupService] Updating recurring contribution:', {
        groupId,
        isEnabled,
        amount,
        frequency
      });

      const result = await this.makeRequest(`/api/contribution-groups/${groupId}/recurring`, {
        method: 'PUT',
        body: JSON.stringify({
          isEnabled,
          amount,
          frequency,
        }),
      });

      console.log('✅ [ContributionGroupService] Recurring contribution updated:', result);
      return result;
    } catch (error) {
      console.error('❌ [ContributionGroupService] Failed to update recurring contribution:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update recurring contribution'
      };
    }
  }

  /**
   * Get supported blockchain networks for wallet deployment
   */
  async getSupportedNetworks(): Promise<{ success: boolean; networks: Array<{
    id: number;
    name: string;
    symbol: string;
    rpcUrl: string;
    explorerUrl: string;
    gasPrice: string;
    deploymentCost: number;
    confirmationTime: number;
    isActive: boolean;
  }> }> {
    try {
      console.log('🔄 [ContributionGroupService] Getting supported networks');

      const result = await this.makeRequest('/api/contribution-groups/networks');

      console.log('✅ [ContributionGroupService] Supported networks retrieved:', {
        count: result.networks?.length || 0
      });
      return result;
    } catch (error) {
      console.error('❌ [ContributionGroupService] Failed to get supported networks:', error);
      return {
        success: false,
        networks: []
      };
    }
  }
}

export const contributionGroupService = new ContributionGroupService();
export default contributionGroupService;