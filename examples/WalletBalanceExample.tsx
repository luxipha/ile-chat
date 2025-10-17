import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import WalletBalanceManager, { CombinedBalanceData } from '../components/WalletBalanceManager';

// Example 1: Using render prop pattern
const WalletBalanceExample: React.FC = () => {
  const handleBalanceUpdate = (balanceData: CombinedBalanceData) => {
    console.log('💰 Balance updated:', balanceData);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet Balance Manager Example</Text>
      
      {/* Using render prop pattern for custom UI */}
      <WalletBalanceManager
        onBalanceUpdate={handleBalanceUpdate}
        autoRefresh={true}
        refreshInterval={30000} // 30 seconds
      >
        {(balanceData, refreshBalance) => (
          <View style={styles.balanceContainer}>
            <Text style={styles.totalBalance}>
              Total Balance: ${balanceData.totalUSD}
            </Text>
            
            {balanceData.isLoading && (
              <Text style={styles.loading}>Loading balances...</Text>
            )}
            
            {balanceData.error && (
              <Text style={styles.error}>Error: {balanceData.error}</Text>
            )}
            
            <View style={styles.walletsContainer}>
              {balanceData.wallets.map((wallet, index) => (
                <View key={index} style={styles.walletItem}>
                  <Text style={styles.chainName}>{wallet.chain.toUpperCase()}</Text>
                  <Text style={styles.balance}>{wallet.balance}</Text>
                  <Text style={styles.balanceUSD}>${wallet.balanceUSD}</Text>
                  {wallet.error && (
                    <Text style={styles.walletError}>Error: {wallet.error}</Text>
                  )}
                </View>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={refreshBalance}
              disabled={balanceData.isLoading}
            >
              <Text style={styles.refreshButtonText}>
                {balanceData.isLoading ? 'Refreshing...' : 'Refresh Balances'}
              </Text>
            </TouchableOpacity>
            
            {balanceData.lastUpdated && (
              <Text style={styles.lastUpdated}>
                Last updated: {balanceData.lastUpdated.toLocaleTimeString()}
              </Text>
            )}
          </View>
        )}
      </WalletBalanceManager>
    </View>
  );
};

// Example 2: Using default UI component
const SimpleWalletBalance: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Wallet Balance</Text>
      
      {/* Using default UI component */}
      <WalletBalanceManager 
        autoRefresh={true}
        refreshInterval={60000} // 1 minute
        onBalanceUpdate={(data) => console.log('Balance:', data)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  balanceContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  totalBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2E7D32',
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  error: {
    textAlign: 'center',
    color: '#D32F2F',
    marginBottom: 10,
  },
  walletsContainer: {
    marginBottom: 20,
  },
  walletItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  chainName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  balance: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  balanceUSD: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  walletError: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  lastUpdated: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
});

export default WalletBalanceExample;
export { SimpleWalletBalance };