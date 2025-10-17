/**
 * Debug script to check Base wallet AsyncStorage data
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function debugBaseWallet() {
  try {
    console.log('🔍 Checking Base wallet AsyncStorage data...');
    
    // Get the stored wallet data
    const baseWalletData = await AsyncStorage.getItem('base_wallet');
    
    console.log('📱 Raw AsyncStorage data for "base_wallet":');
    console.log(baseWalletData);
    
    if (baseWalletData) {
      try {
        const parsedData = JSON.parse(baseWalletData);
        console.log('\n📋 Parsed wallet data:');
        console.log(JSON.stringify(parsedData, null, 2));
        
        console.log('\n🔍 Validation checks:');
        console.log('- Has address:', !!parsedData.address);
        console.log('- Address value:', parsedData.address);
        console.log('- Data type:', typeof parsedData);
        console.log('- Keys present:', Object.keys(parsedData));
        
        if (!parsedData.address) {
          console.log('❌ ISSUE FOUND: Missing address field in wallet data');
          console.log('💡 This explains the "Invalid wallet data in AsyncStorage" error');
        } else {
          console.log('✅ Wallet data appears valid');
        }
        
      } catch (parseError) {
        console.log('❌ JSON Parse Error:', parseError.message);
        console.log('💡 This explains the AsyncStorage error - corrupted JSON data');
      }
    } else {
      console.log('❌ No Base wallet data found in AsyncStorage');
      console.log('💡 This explains the "No Base wallet found" error');
    }
    
    // Also check other wallet-related keys
    console.log('\n🔍 Checking other wallet-related AsyncStorage keys:');
    const aptosAddress = await AsyncStorage.getItem('aptosWalletAddress');
    const aptosPrivateKey = await AsyncStorage.getItem('aptosWalletPrivateKey');
    const walletConnected = await AsyncStorage.getItem('walletConnected');
    
    console.log('- aptosWalletAddress:', aptosAddress);
    console.log('- aptosWalletPrivateKey:', aptosPrivateKey ? '[PRESENT]' : '[MISSING]');
    console.log('- walletConnected:', walletConnected);
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// For React Native environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugBaseWallet };
}

// For direct execution
if (require.main === module) {
  debugBaseWallet();
}