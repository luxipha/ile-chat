/**
 * Hedera Wallet Handler Component
 * Reusable component for handling Hedera wallet operations in DepositFlow
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Service from '../../services/Service';

export interface HederaWalletResult {
  success: boolean;
  address?: string;
  error?: string;
}

export class HederaWalletHandler {
  
  /**
   * Get or create Hedera wallet
   * @param chain - Network chain (hedera-testnet)
   * @returns Wallet result with address or error
   */
  static async getOrCreateWallet(chain: string): Promise<HederaWalletResult> {
    console.log('🔗 [HederaWalletHandler] Checking for wallet on chain:', chain);
    
    try {
      // Step 1: Check backend database first
      const backendWallet = await this.checkBackendWallet(chain);
      if (backendWallet.success && backendWallet.address) {
        return backendWallet;
      }

      // Step 2: Check AsyncStorage as fallback
      const localWallet = await this.checkLocalStorage(chain);
      if (localWallet.success && localWallet.address) {
        return localWallet;
      }

      // Step 3: Create new wallet
      return await this.createNewWallet(chain);
      
    } catch (error) {
      console.error('❌ [HederaWalletHandler] Error:', error);
      return {
        success: false,
        error: `Failed to get Hedera wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check backend database for existing Hedera wallet
   */
  private static async checkBackendWallet(chain: string): Promise<HederaWalletResult> {
    try {
      console.log('🔗 [HederaWalletHandler] Checking backend database...');
      const backendWallet = await Service.getWalletFromBackend(chain, 'hedera');
      
      if (backendWallet && backendWallet.success && backendWallet.wallet) {
        console.log('✅ [HederaWalletHandler] Found existing wallet in database:', backendWallet.wallet.address);
        
        // Update AsyncStorage to match database
        await this.saveToLocalStorage(backendWallet.wallet);
        
        return {
          success: true,
          address: backendWallet.wallet.address
        };
      }
      
      console.log('🔍 [HederaWalletHandler] No wallet found in database');
      return { success: false };
      
    } catch (error) {
      console.warn('⚠️ [HederaWalletHandler] Backend check failed:', error);
      return { success: false };
    }
  }

  /**
   * Check AsyncStorage for existing Hedera wallet
   */
  private static async checkLocalStorage(chain: string): Promise<HederaWalletResult> {
    try {
      console.log('🔗 [HederaWalletHandler] Checking AsyncStorage...');
      const localWalletData = await AsyncStorage.getItem('hedera_wallet');
      
      if (localWalletData) {
        const parsedWallet = JSON.parse(localWalletData);
        
        if (parsedWallet && parsedWallet.address && typeof parsedWallet.address === 'string') {
          console.log('✅ [HederaWalletHandler] Found wallet in AsyncStorage:', parsedWallet.address);
          
          // Try to save to backend for future use
          await this.saveToBackend(parsedWallet, chain);
          
          return {
            success: true,
            address: parsedWallet.address
          };
        } else {
          console.log('❌ [HederaWalletHandler] Invalid wallet data, clearing...');
          await AsyncStorage.removeItem('hedera_wallet');
        }
      }
      
      console.log('🔍 [HederaWalletHandler] No wallet found in AsyncStorage');
      return { success: false };
      
    } catch (error) {
      console.warn('⚠️ [HederaWalletHandler] AsyncStorage check failed:', error);
      return { success: false };
    }
  }

  /**
   * Create new Hedera wallet
   */
  private static async createNewWallet(chain: string): Promise<HederaWalletResult> {
    try {
      console.log('🆕 [HederaWalletHandler] Creating new Hedera wallet...');
      
      // Call backend to generate wallet (using the wallet route auto-generation)
      const backendWallet = await Service.getWalletFromBackend(chain, 'hedera');
      
      if (backendWallet && backendWallet.success && backendWallet.wallet) {
        console.log('✅ [HederaWalletHandler] Created new wallet:', backendWallet.wallet.address);
        
        // Save to AsyncStorage
        await this.saveToLocalStorage(backendWallet.wallet);
        
        return {
          success: true,
          address: backendWallet.wallet.address
        };
      } else {
        throw new Error(backendWallet?.error || 'Failed to create Hedera wallet');
      }
      
    } catch (error) {
      console.error('❌ [HederaWalletHandler] Wallet creation failed:', error);
      return {
        success: false,
        error: `Failed to create Hedera wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Save wallet to AsyncStorage
   */
  private static async saveToLocalStorage(wallet: any): Promise<void> {
    try {
      const walletData = {
        address: wallet.address,
        accountId: wallet.accountId || wallet.address,
        privateKey: wallet.privateKey,
        createdAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('hedera_wallet', JSON.stringify(walletData));
      console.log('✅ [HederaWalletHandler] Saved wallet to AsyncStorage');
    } catch (error) {
      console.warn('⚠️ [HederaWalletHandler] Failed to save to AsyncStorage:', error);
    }
  }

  /**
   * Save wallet to backend database
   */
  private static async saveToBackend(wallet: any, chain: string): Promise<void> {
    try {
      await Service.saveWalletToBackend({
        address: wallet.address,
        chain: chain,
        type: 'hedera',
        privateKey: wallet.privateKey
      });
      console.log('✅ [HederaWalletHandler] Saved wallet to backend');
    } catch (error) {
      console.warn('⚠️ [HederaWalletHandler] Failed to save to backend:', error);
    }
  }
}