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
      const address = await AsyncStorage.getItem('walletAddress');
      if (address) {
        setWallet(prev => ({
          ...prev,
          isConnected: true,
          address,
        }));
      }
    } catch (error) {
      console.error('Failed to load wallet state:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async (address: string) => {
    try {
      await AsyncStorage.setItem('walletAddress', address);
      setWallet(prev => ({
        ...prev,
        isConnected: true,
        address,
      }));
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      await AsyncStorage.removeItem('walletAddress');
      setWallet({
        isConnected: false,
        balance: {},
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
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
    updateBalance,
  };
};