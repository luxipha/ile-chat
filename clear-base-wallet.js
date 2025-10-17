/**
 * Simple script to clear Base wallet AsyncStorage data
 * Run this to fix the "Invalid wallet data in AsyncStorage" error
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function clearBaseWallet() {
  try {
    console.log('🧹 Clearing Base wallet AsyncStorage data...');
    
    // Remove the corrupted base_wallet data
    await AsyncStorage.removeItem('base_wallet');
    
    console.log('✅ Base wallet data cleared successfully');
    console.log('💡 The app will now create a fresh Base wallet when needed');
    
  } catch (error) {
    console.error('❌ Error clearing Base wallet data:', error);
  }
}

clearBaseWallet();