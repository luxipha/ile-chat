import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WalletState } from '../types';
import crossmintService from '../services/crossmintService';

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    balance: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletState();
  }, []);

  const loadWalletState = async () => {
    try {
      // First try to get wallet status from backend (database as source of truth)
      console.log('🔄 Loading wallet state - checking database first...');
      const backendWallet = await crossmintService.getWalletStatus();
      
      if (backendWallet.success && backendWallet.wallet) {
        console.log('✅ Using wallet data from database');
        const primaryChain = backendWallet.wallet.chains?.find((c: any) => c.isActive) || backendWallet.wallet.chains?.[0];
        setWallet({
          isConnected: true,
          address: primaryChain?.address,
          balance: backendWallet.wallet.balances || {},
          walletId: backendWallet.wallet.walletId,
          chains: backendWallet.wallet.chains
        });
        
        // Update local storage to match database
        await AsyncStorage.setItem('walletConnected', 'true');
        await AsyncStorage.setItem('walletData', JSON.stringify(backendWallet.wallet));
        
        return;
      }
      
      // Fallback to local storage if database check fails
      console.log('⚠️ Database wallet check failed, falling back to local storage');
      const isConnected = await crossmintService.isWalletConnected();
      if (isConnected) {
        const walletData = await crossmintService.getLocalWalletData();
        if (walletData) {
          const primaryChain = walletData.chains?.find((c: any) => c.isActive) || walletData.chains?.[0];
          setWallet({
            isConnected: true,
            address: primaryChain?.address,
            balance: walletData.balances || {},
            walletId: walletData.walletId,
            chains: walletData.chains
          });
        }
      }
    } catch (error) {
      console.error('Failed to load wallet state:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      const result = await crossmintService.connectWallet();
      if (result.success && result.wallet) {
        const primaryChain = result.wallet.chains?.find((c: any) => c.isActive) || result.wallet.chains?.[0];
        setWallet({
          isConnected: true,
          address: primaryChain?.address,
          balance: result.wallet.balances || {},
          walletId: result.wallet.walletId,
          chains: result.wallet.chains
        });
        return result;
      }
      throw new Error(result.error || 'Failed to connect wallet');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      const result = await crossmintService.disconnectWallet();
      if (result.success) {
        setWallet({
          isConnected: false,
          balance: {},
        });
      }
      return result;
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  };

  const refreshWalletData = async () => {
    try {
      setLoading(true);
      const result = await crossmintService.getWalletStatus();
      if (result.success && result.wallet) {
        const primaryChain = result.wallet.chains?.find((c: any) => c.isActive) || result.wallet.chains?.[0];
        setWallet({
          isConnected: true,
          address: primaryChain?.address,
          balance: result.wallet.balances || {},
          walletId: result.wallet.walletId,
          chains: result.wallet.chains
        });
      }
      return result;
    } catch (error) {
      console.error('Failed to refresh wallet data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = (token: string, balance: string) => {
    setWallet(prev => ({
      ...prev,
      balance: {
        ...prev.balance,
        [token]: balance,
      },
    }));
  };

  return {
    wallet,
    loading,
    connectWallet,
    disconnectWallet,
    refreshWalletData,
    updateBalance,
  };
};