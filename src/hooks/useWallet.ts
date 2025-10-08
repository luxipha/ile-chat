import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WalletState } from '../types';

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
      // Check local storage for wallet connection
      const isConnected = await AsyncStorage.getItem('walletConnected');
      if (isConnected === 'true') {
        // Load basic wallet state - Aptos logic would go here
        setWallet({
          isConnected: true,
          balance: {},
        });
      }
    } catch (error) {
      console.error('Failed to load wallet state:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      // Aptos wallet connection logic would go here
      setWallet({
        isConnected: true,
        balance: {},
      });
      await AsyncStorage.setItem('walletConnected', 'true');
      return { success: true };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      setWallet({
        isConnected: false,
        balance: {},
      });
      await AsyncStorage.removeItem('walletConnected');
      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  };

  const refreshWalletData = async () => {
    try {
      setLoading(true);
      // Aptos wallet refresh logic would go here
      return { success: true };
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