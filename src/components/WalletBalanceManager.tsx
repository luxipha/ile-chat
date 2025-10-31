import React, { useState, useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import Service from '../services/Service';
import { HederaBalanceService } from './wallet/HederaBalanceService';
// aptosService removed - using Circle/Hedera instead

interface WalletBalance {
  chain: string;
  balance: string;
  balanceUSD?: string;
  usdcBalance?: string;
  ethBalance?: string;
  aptBalance?: string;
  address?: string;
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
  children?: (balanceData: CombinedBalanceData, refreshBalance: () => void, forceRefresh: () => void) => React.ReactNode;
}

const WalletBalanceManager: React.FC<WalletBalanceManagerProps> = ({
  onBalanceUpdate,
  autoRefresh = false,
  refreshInterval = 60000, // 60 seconds default (increased to reduce rate limiting)
  children
}) => {
  const [balanceData, setBalanceData] = useState<CombinedBalanceData>({
    totalUSD: '0.00',
    wallets: [],
    isLoading: false,
    lastUpdated: null
  });

  const [refreshTimer, setRefreshTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const MINIMUM_FETCH_INTERVAL = 5000; // Minimum 5 seconds between fetches (reduced for better UX)

  // Combined balance fetching for Base (Aptos removed)
  const fetchCombinedBalances = useCallback(async (forceRefresh: boolean = false) => {
    const now = Date.now();
    
    // Silent rate limiting: prevent too frequent requests (but allow manual force refresh)
    if (!forceRefresh && now - lastFetchTime < MINIMUM_FETCH_INTERVAL) {
      // Silently skip - no need to log rate limiting for automatic calls
      return;
    }
    
    if (balanceData.isLoading) {
      // Silently skip if already loading
      return;
    }
    
    setLastFetchTime(now);

    setBalanceData(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      console.log('🔄 Fetching Base balances (Aptos support removed)...');
      
      // Create promises for parallel execution
      const balancePromises: Promise<{type: string, data: any}>[] = [];
      
      // Aptos service removed - skip Aptos balance fetching
      balancePromises.push(
        Promise.resolve({ type: 'aptos', data: { success: false, error: 'Aptos support removed' } })
      );
      
      // 2. Base balance with delay to stagger requests
      balancePromises.push(
        new Promise(resolve => setTimeout(resolve, 500))
          .then(() => Service.getCurrentUserBaseBalance())
          .then((data: any) => ({ type: 'base', data }))
          .catch((error: any) => {
            console.error('❌ Base balance fetch error:', error);
            return { type: 'base', data: { error: error.message } };
          })
      );

      // 3. Hedera balance with delay to stagger requests
      balancePromises.push(
        new Promise(resolve => setTimeout(resolve, 1000))
          .then(() => HederaBalanceService.getCurrentUserBalance())
          .then((data: any) => ({ type: 'hedera', data }))
          .catch((error: any) => {
            console.error('❌ Hedera balance fetch error:', error);
            return { type: 'hedera', data: { error: error.message } };
          })
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
            if (type === 'aptos' && data.success && data.balances) {
              // Handle Aptos balances - extract USDC and APT
              let aptosUSDC = 0;
              let aptosAPT = 0;
              
              Object.entries(data.balances).forEach(([token, balance]) => {
                const balanceNum = parseFloat(balance as string) || 0;
                
                // Add USDC from Aptos
                if (token.includes('USDC') || token.toUpperCase() === 'USDC') {
                  aptosUSDC += balanceNum;
                }
                
                // Add APT for display
                if (token.includes('APT') || token.toUpperCase() === 'APT') {
                  aptosAPT = balanceNum;
                }
              });
              
              wallets.push({
                chain: type,
                balance: `${aptosUSDC.toFixed(6)} USDC`,
                balanceUSD: aptosUSDC.toFixed(2),
                usdcBalance: aptosUSDC.toFixed(6),
                aptBalance: aptosAPT.toFixed(6),
                address: data.address
              });
              
              totalUSDValue += aptosUSDC;
              console.log(`✅ ${type} balance: ${aptosUSDC.toFixed(6)} USDC, ${aptosAPT.toFixed(6)} APT (${aptosUSDC.toFixed(2)} USD)`);
              
            } else if (type === 'base') {
              // Handle Base balances - ETH and USDC
              console.log('🔵 [WalletBalanceManager] Raw Base balance data:', JSON.stringify(data, null, 2));
              
              const ethBalance = data.balance || '0.000000 ETH';
              const usdcBalance = data.usdcBalance || '0.00';
              const balanceUSD = data.balanceUSD || '0.00';
              
              console.log('🔵 [WalletBalanceManager] Parsed Base values:', {
                ethBalance,
                usdcBalance, 
                balanceUSD,
                address: data.address
              });
              
              wallets.push({
                chain: type,
                balance: `${ethBalance}, ${usdcBalance} USDC`,
                balanceUSD: balanceUSD.toString(),
                ethBalance: ethBalance,
                usdcBalance: usdcBalance,
                address: data.address
              });
              
              // Add to total USD value
              const usdAmount = parseFloat(balanceUSD.toString()) || 0;
              totalUSDValue += usdAmount;
              
              console.log(`✅ ${type} balance: ${ethBalance}, ${usdcBalance} USDC (${balanceUSD} USD)`);
            } else if (type === 'hedera') {
              // Handle Hedera balances - only show USDC (HBAR is for gas fees only)
              console.log('🔗 [WalletBalanceManager] Raw Hedera balance data:', JSON.stringify(data, null, 2));
              
              const usdcBalance = data.usdcBalance || '0.00';
              
              console.log('🔗 [WalletBalanceManager] Parsed Hedera USDC balance:', {
                usdcBalance
              });
              
              wallets.push({
                chain: type,
                balance: `${usdcBalance} USDC`,
                balanceUSD: usdcBalance.toString(), // USDC is 1:1 with USD
                usdcBalance: usdcBalance,
                address: data.address || 'N/A'
              });
              
              // Add USDC to total USD value
              const usdAmount = parseFloat(usdcBalance) || 0;
              totalUSDValue += usdAmount;
              
              console.log(`✅ ${type} balance: ${usdcBalance} USDC (${usdAmount.toFixed(2)} USD)`);
            } else {
              // Fallback for other chain types
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
  }, [balanceData.isLoading, onBalanceUpdate, lastFetchTime]);

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

  // Manual refresh function (respects rate limiting)
  const refreshBalance = useCallback(() => {
    fetchCombinedBalances();
  }, [fetchCombinedBalances]);

  // Force refresh function (bypasses rate limiting for manual user actions)
  const forceRefresh = useCallback(() => {
    fetchCombinedBalances(true);
  }, [fetchCombinedBalances]);

  // If children render prop is provided, use it
  if (children) {
    return <>{children(balanceData, refreshBalance, forceRefresh)}</>;
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
          {wallet.address && <Text style={{fontSize: 12, color: 'gray'}}>Address: {wallet.address.slice(0, 10)}...{wallet.address.slice(-6)}</Text>}
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