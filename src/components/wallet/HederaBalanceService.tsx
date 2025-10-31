/**
 * Hedera Balance Service Component
 * Reusable component for fetching Hedera wallet balances
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Service from '../../services/Service';
import { apiService } from '../../services/api';

export interface HederaBalanceResult {
  success: boolean;
  hbarBalance?: string;
  usdcBalance?: string;
  error?: string;
}

export class HederaBalanceService {
  
  /**
   * Fetch current user's Hedera wallet balances
   * @returns Balance result with HBAR and USDC balances
   */
  static async getCurrentUserBalance(): Promise<HederaBalanceResult> {
    try {
      console.log('🔗 [HederaBalanceService] Fetching current user balance...');
      
      // Get auth token first
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ [HederaBalanceService] No auth token available');
        return {
          success: false,
          error: 'No auth token available',
          hbarBalance: '0',
          usdcBalance: '0'
        };
      }
      
      // Get user's Hedera wallet first
      const walletResult = await Service.getWalletFromBackend('hedera-testnet', 'hedera');
      
      if (!walletResult || !walletResult.success || !walletResult.wallet) {
        console.warn('⚠️ [HederaBalanceService] No Hedera wallet found');
        return {
          success: false,
          error: 'No Hedera wallet found',
          hbarBalance: '0',
          usdcBalance: '0'
        };
      }

      const accountId = walletResult.wallet.address;
      console.log('🔗 [HederaBalanceService] Getting balance for account:', accountId);

      // Call backend API to get Hedera balance with auth token
      const balanceData = await apiService.get(`/api/hedera/balance/${accountId}`, token);
      
      if (balanceData.success) {
        console.log('✅ [HederaBalanceService] Balance fetched:', balanceData.data);
        
        return {
          success: true,
          hbarBalance: (balanceData.data as any)?.hbarBalance || '0',
          usdcBalance: (balanceData.data as any)?.usdcBalance || '0'
        };
      } else {
        throw new Error(balanceData.error || 'Failed to fetch balance');
      }

    } catch (error) {
      console.error('❌ [HederaBalanceService] Balance fetch failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hbarBalance: '0',
        usdcBalance: '0'
      };
    }
  }

  /**
   * Format balance for display
   * @param balance - Raw balance string
   * @param symbol - Token symbol (HBAR or USDC)
   * @returns Formatted balance string
   */
  static formatBalance(balance: string, symbol: string): string {
    const numBalance = parseFloat(balance);
    
    if (symbol === 'HBAR') {
      return `${numBalance.toFixed(6)} HBAR`;
    } else if (symbol === 'USDC') {
      return `${numBalance.toFixed(2)} USDC`;
    }
    
    return `${numBalance} ${symbol}`;
  }

  /**
   * Parse balance to number for calculations
   * @param balance - Raw balance string
   * @returns Parsed number
   */
  static parseBalance(balance: string): number {
    return parseFloat(balance) || 0;
  }
}