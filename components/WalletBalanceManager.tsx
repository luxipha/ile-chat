import React, { useState, useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import Service from '../src/services/Service';

interface WalletBalance {
  chain: string;
  balance: string;
  balanceUSD?: string;
  error?: string;
}

interface CombinedBalanceData {
  totalUSD: string;
  wallets: WalletBalance[];
  isLoading: boolean;
  lastUpdated: Date | null;
  error?: string;
}

interface WalletBalanceManagerProps {
  onBalanceUpdate?: (balanceData: CombinedBalanceData) => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  children?: (balanceData: CombinedBalanceData, refreshBalance: () => void) => React.ReactNode;
}

const WalletBalanceManager: React.FC<WalletBalanceManagerProps> = ({
  onBalanceUpdate,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds default
  children
}) => {
  const [balanceData, setBalanceData] = useState<CombinedBalanceData>({
    totalUSD: '0.00',
    wallets: [],
    isLoading: false,
    lastUpdated: null
  });

  const [refreshTimer, setRefreshTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Combined balance fetching for Aptos + Base in parallel
  const fetchCombinedBalances = useCallback(async () => {
    if (balanceData.isLoading) {
      console.log('⚠️ Balance fetch already in progress, skipping...');
      return;
    }

    setBalanceData(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      console.log('🔄 Fetching combined Aptos + Base balances in parallel...');
      
      // Create promises for parallel execution
      const balancePromises: Promise<{type: string, data: any}>[] = [];
      
      // 1. Aptos balance - TODO: Replace with correct method name
      // balancePromises.push(
      //   Service.getAptosBalance()
      //     .then((data: any) => ({ type: 'aptos', data }))
      //     .catch((error: any) => ({ type: 'aptos', data: { error: error.message } }))
      // );
      
      // 2. Base balance  
      balancePromises.push(
        Service.getCurrentUserBaseBalance()
          .then((data: any) => ({ type: 'base', data }))
          .catch((error: any) => ({ type: 'base', data: { error: error.message } }))
      );

      // Execute all balance fetches in parallel
      const results = await Promise.allSettled(balancePromises);
      
      const wallets: WalletBalance[] = [];
      let totalUSDValue = 0;
      let hasErrors = false;

      // Process results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { type, data } = result.value;
          
          if (data.error) {
            console.warn(`❌ ${type} balance fetch failed:`, data.error);
            wallets.push({
              chain: type,
              balance: '0.00',
              balanceUSD: '0.00',
              error: data.error
            });
            hasErrors = true;
          } else {
            // Handle successful balance fetch
            const balance = data.balance || '0.00';
            const balanceUSD = data.balanceUSD || data.usdValue || '0.00';
            
            wallets.push({
              chain: type,
              balance: balance.toString(),
              balanceUSD: balanceUSD.toString()
            });
            
            // Add to total USD value
            const usdAmount = parseFloat(balanceUSD.toString()) || 0;
            totalUSDValue += usdAmount;
            
            console.log(`✅ ${type} balance: ${balance} (${balanceUSD} USD)`);
          }
        } else {
          console.error(`❌ Failed to fetch balance:`, result.reason);
          hasErrors = true;
        }
      }

      const newBalanceData: CombinedBalanceData = {
        totalUSD: totalUSDValue.toFixed(2),
        wallets,
        isLoading: false,
        lastUpdated: new Date(),
        error: hasErrors ? 'Some wallet balances could not be fetched' : undefined
      };

      setBalanceData(newBalanceData);
      onBalanceUpdate?.(newBalanceData);

      console.log('✅ Combined balance fetch completed:', {
        totalUSD: newBalanceData.totalUSD,
        walletCount: wallets.length,
        hasErrors
      });

    } catch (error) {
      console.error('❌ Combined balance fetch failed:', error);
      const errorData: CombinedBalanceData = {
        totalUSD: '0.00',
        wallets: [],
        isLoading: false,
        lastUpdated: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      setBalanceData(errorData);
      onBalanceUpdate?.(errorData);
    }
  }, [balanceData.isLoading, onBalanceUpdate]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh) {
      // Initial fetch
      fetchCombinedBalances();
      
      // Set up interval
      const timer = setInterval(fetchCombinedBalances, refreshInterval);
      setRefreshTimer(timer);
      
      return () => {
        if (timer) {
          clearInterval(timer);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchCombinedBalances]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [refreshTimer]);

  // Manual refresh function
  const refreshBalance = useCallback(() => {
    fetchCombinedBalances();
  }, [fetchCombinedBalances]);

  // If children render prop is provided, use it
  if (children) {
    return <>{children(balanceData, refreshBalance)}</>;
  }

  // Default UI component
  return (
    <View>
      <Text>Total Balance: ${balanceData.totalUSD}</Text>
      {balanceData.isLoading && <Text>Loading...</Text>}
      {balanceData.error && <Text style={{color: 'red'}}>Error: {balanceData.error}</Text>}
      {balanceData.wallets.map((wallet, index) => (
        <View key={index}>
          <Text>{wallet.chain}: {wallet.balance} ({wallet.balanceUSD} USD)</Text>
          {wallet.error && <Text style={{color: 'red'}}>Error: {wallet.error}</Text>}
        </View>
      ))}
      {balanceData.lastUpdated && (
        <Text>Last updated: {balanceData.lastUpdated.toLocaleTimeString()}</Text>
      )}
    </View>
  );
};

export default WalletBalanceManager;

// Export types for use in other components
export type { CombinedBalanceData, WalletBalance, WalletBalanceManagerProps };