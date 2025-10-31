import AsyncStorage from '@react-native-async-storage/async-storage';
import profileService from '../services/profileService';
import { clearAvatarCache } from '../components/ui/Avatar';

export const clearAllAppCaches = async () => {
  try {
    console.log('🗑️ Clearing all app caches...');
    
    // Clear profile service cache
    profileService.clearAllCaches();
    
    // Clear avatar cache
    clearAvatarCache();
    
    // Clear any AsyncStorage cache keys (add more as needed)
    const cacheKeys = [
      'userProfile',
      'chatCache',
      'conversationCache',
      'lastSyncTime'
    ];
    
    await Promise.all(cacheKeys.map(key => AsyncStorage.removeItem(key)));
    
    console.log('✅ All app caches cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing app caches:', error);
  }
};

// Call this when you want to force refresh everything
export const forceRefreshAllData = async () => {
  console.log('🔄 Force refreshing all data...');
  await clearAllAppCaches();
  // You can add more refresh logic here if needed
};