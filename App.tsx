import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, ScrollView, Image, TextInput, RefreshControl } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from './src/components/ui/Button';
import { Card } from './src/components/ui/Card';
import { Typography } from './src/components/ui/Typography';
import { Colors, Spacing, BorderRadius } from './src/theme';
import { ConversationList, Conversation } from './src/components/chat/ConversationList';
import { ChatScreen } from './src/components/chat/ChatScreen';
import { ProfileScreen } from './src/components/profile/ProfileScreen';
import { SettingsScreen } from './src/components/profile/SettingsScreen';
import { InviteToEarnScreen } from './src/components/profile/InviteToEarnScreen';
import { SetPinScreen } from './src/components/settings/SetPinScreen';
import { PublicProfileScreen } from './src/components/profile/PublicProfileScreen';
import { P2PSendFlow } from './src/components/wallet/P2PSendFlow';
import { ProfileCard } from './src/components/ui/ProfileCard';
import { LendingMarketplace } from './src/components/lending/LendingMarketplace';
import { LoanRequestFlow } from './src/components/lending/LoanRequestFlow';
import { LoanDetailScreen } from './src/components/lending/LoanDetailScreen';
import { FXMarketplace } from './src/components/fx/FXMarketplace';
import { FXOfferDetail } from './src/components/fx/FXOfferDetail';
import { TradeRoom } from './src/components/fx/TradeRoom';
import { CreateFXOffer } from './src/components/fx/CreateFXOffer';
import { ChangePasswordScreen } from './src/components/settings/ChangePasswordScreen';
import { WalletSettingsScreen } from './src/components/settings/WalletSettingsScreen';
import { PrivacySettingsScreen } from './src/components/settings/PrivacySettingsScreen';
import { SendFeedbackScreen } from './src/components/settings/SendFeedbackScreen';
import { AboutScreen } from './src/components/settings/AboutScreen';
import { QRCodeScreen } from './src/components/profile/QRCodeScreen';
import { DepositFlow } from './src/components/wallet/DepositFlow';
import { CreateGroupModal } from './src/components/chat/CreateGroupModal';
import { LoginScreen } from './src/components/auth/LoginScreen';
import { MarketplaceWebView } from './src/components/webview/MarketplaceWebView';
import { CreateMomentModal } from './src/components/moments/CreateMomentModal';
import { QRScannerModal } from './src/components/scanner/QRScannerModal';
import { LoadingSpinner } from './src/components/ui/LoadingSpinner';
import { LoadingOverlay } from './src/components/ui/LoadingOverlay';
import { SkeletonContactItem, SkeletonCard } from './src/components/ui/SkeletonLoader';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';
import { ErrorMessage, NetworkError, ValidationError, PaymentError } from './src/components/ui/ErrorMessage';
import { ErrorScreen, NoInternetScreen, ServerErrorScreen } from './src/components/ui/ErrorScreen';
import { EmptyState, EmptyContacts, EmptyMoments, EmptyChat, EmptyWallet, EmptyProperties, EmptyTransactions, EmptySearch } from './src/components/ui/EmptyState';
import { ProfileEditScreen } from './src/components/profile/ProfileEditScreen';
import { NotificationScreen } from './src/components/notifications/NotificationScreen';
import { NotificationSettingsScreen } from './src/components/notifications/NotificationSettingsScreen';
import { InAppNotification } from './src/components/notifications/InAppNotification';
import { NotificationProvider, useNotifications } from './src/contexts/NotificationContext';
import authService, { User } from './src/services/authService';
import { communityService, CommunityPost } from './src/services/communityService';
import profileService from './src/services/profileService';
import chatService from './src/services/chatService';
import fxService from './src/services/fxService';
import aptosService from './src/services/aptosService';
// import { signInWithCustomFirebaseToken } from './src/services/firebaseConfig';
import crossmintService from './src/services/crossmintService';

import { FXOffer, FXTrade } from './src/types/fx';

type TabName = 'chat' | 'contact' | 'wallet' | 'moments' | 'me';
type MeScreen = 'main' | 'profile' | 'editProfile' | 'settings' | 'invite' | 'setPin' | 'changePassword' | 'walletSettings' | 'privacySettings' | 'sendFeedback' | 'about' | 'qrCode';
type WalletScreen = 'main' | 'tokens' | 'properties' | 'lending' | 'marketplace' | 'webview' | 'notifications' | 'notificationSettings';
type FXScreen = 'marketplace' | 'offer_detail' | 'trade_room';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  avatar?: string;
}

// Wrapper component to use the notification context
const AppNotificationWrapper: React.FC = () => {
  const { currentNotification, hideNotification } = useNotifications();
  
  return (
    <InAppNotification 
      notification={currentNotification} 
      onDismiss={hideNotification} 
    />
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    dateOfBirth: '',
    gender: '',
  });
  
  // Dual wallet state (CrossMint + Aptos)
  const [hasWallet, setHasWallet] = useState(false);
  const [hasAptosWallet, setHasAptosWallet] = useState(false);
  // REMOVED: isCreatingWallet state - no longer needed since wallet creation removed from main screen
  const [aptosAddress, setAptosAddress] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [walletBalance, setWalletBalance] = useState<{[key: string]: number}>({});
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [activeTab, setActiveTab] = useState<TabName>('wallet');
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMeScreen, setCurrentMeScreen] = useState<MeScreen>('main');
  const [currentWalletScreen, setCurrentWalletScreen] = useState<WalletScreen>('main');
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{name: string; avatar?: string; id: string} | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const [showP2PSend, setShowP2PSend] = useState(false);
  const [showLoanRequest, setShowLoanRequest] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [currentFXScreen, setCurrentFXScreen] = useState<FXScreen>('marketplace');
  const [selectedOffer, setSelectedOffer] = useState<FXOffer | null>(null);
  const [currentTrade, setCurrentTrade] = useState<FXTrade | null>(null);
  const [showCreateFXOffer, setShowCreateFXOffer] = useState(false);
  const [showDepositFlow, setShowDepositFlow] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateMoment, setShowCreateMoment] = useState(false);
  const [moments, setMoments] = useState<any[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'agents' | 'investors' | 'recent'>('all');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMoments, setIsLoadingMoments] = useState(false);
  const [refreshingMoments, setRefreshingMoments] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(false);
  const [generalLoadingMessage, setGeneralLoadingMessage] = useState('Loading...');
  const [networkError, setNetworkError] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [momentsError, setMomentsError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Check for existing authentication on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Authenticate with Firebase and fetch conversations
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const authenticateAndFetchData = async () => {
        try {
          // 1. Get custom token from your backend
          // const tokenResponse = await authService.getFirebaseToken(); // You need to implement this in authService
          // if (tokenResponse.success && tokenResponse.token) {
          //   // 2. Sign in to Firebase
          //   await signInWithCustomFirebaseToken(tokenResponse.token);
            
            // 3. Listen for conversations
            const unsubscribe = chatService.getConversations(currentUser.id, setConversations);
            return () => unsubscribe(); // Cleanup listener on unmount
          // }
        } catch (error) {
          console.error("Failed to setup Firebase chat:", error);
        }
      };
      authenticateAndFetchData();
    }
  }, [isAuthenticated, currentUser]);
  // Community posts loading function
  const loadPosts = async (refresh = false, retryCount = 0) => {
    console.log('📱 App.loadPosts() called:', { refresh, retryCount, isAuthenticated, currentUserId: currentUser?.id });
    
    if (refresh) {
      console.log('🔄 Setting refresh state...');
      setRefreshingMoments(true);
    } else {
      console.log('🔄 Setting loading state...');
      setIsLoadingMoments(true);
    }
    setMomentsError(null);
    
    try {
      console.log('🔄 Calling communityService.getPosts(1, 20)...');
      const response = await communityService.getPosts(1, 20);
      console.log('📥 getPosts response received:', {
        success: response.success,
        error: response.error,
        postsCount: response.data?.posts?.length || 0
      });
      
      if (response.success) {
        console.log('✅ Posts loaded successfully, formatting for UI...');
        const formattedPosts = response.data.posts.map(post => 
          communityService.formatPostForUI(post, currentUser?.id)
        );
        console.log('📝 Formatted posts:', {
          count: formattedPosts.length,
          firstPostId: formattedPosts[0]?.id || 'none'
        });
        setMoments(formattedPosts);
      } else {
        console.log('❌ Failed to load posts:', response.error);
        
        // Retry once for authentication-related errors
        if ((response.error?.includes('token') || response.error?.includes('auth') || response.error?.includes('Access token required')) && retryCount === 0) {
          console.log('🔄 Retrying due to auth error...');
          setTimeout(() => loadPosts(refresh, retryCount + 1), 1000);
          return;
        }
        
        setMomentsError(response.error || 'Failed to load posts');
      }
    } catch (error: any) {
      console.error('❌ Exception in loadPosts:', error);
      console.error('❌ Exception details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Retry once for network errors
      if (retryCount === 0 && (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch'))) {
        console.log('🔄 Retrying due to network error...');
        setTimeout(() => loadPosts(refresh, retryCount + 1), 1000);
        return;
      }
      
      setMomentsError('Failed to load posts. Please try again.');
    } finally {
      console.log('🏁 loadPosts cleanup - setting loading states to false');
      setIsLoadingMoments(false);
      setRefreshingMoments(false);
    }
  };

  // Load posts when moments tab is active and user is authenticated
  useEffect(() => {
    console.log('🔄 Posts loading effect triggered:', {
      activeTab,
      isAuthenticated,
      isCheckingAuth,
      shouldLoad: activeTab === 'moments' && isAuthenticated && !isCheckingAuth
    });
    
    if (activeTab === 'moments' && isAuthenticated && !isCheckingAuth) {
      console.log('📡 Loading posts because conditions are met');
      loadPosts();
    } else if (activeTab === 'moments' && !isAuthenticated && !isCheckingAuth) {
      console.log('❌ Cannot load posts - not authenticated');
      setMomentsError('Authentication required to view moments');
    }
  }, [activeTab, isAuthenticated, isCheckingAuth]);

  // Moments interaction handlers
  const handleLike = async (momentId: string) => {
    try {
      console.log('👍 handleLike called with momentId:', { momentId, type: typeof momentId });
      
      if (!momentId) {
        console.error('❌ momentId is undefined or null');
        return;
      }
      
      const response = await communityService.likePost(momentId);
      console.log('📥 Like response:', { success: response?.success, error: response?.error });
      
      if (response && response.success) {
        setMoments(prev => prev.map(post => 
          post.id === momentId 
            ? { ...post, likes: response.data.likes, isLikedByUser: response.data.isLiked }
            : post
        ));
      } else {
        console.error('❌ Like failed:', response?.error);
      }
    } catch (error) {
      console.error('❌ Failed to like post:', error);
    }
  };

  const handleShare = async (momentId: string) => {
    try {
      const response = await communityService.sharePost(momentId);
      if (response.success) {
        setMoments(prev => prev.map(post => 
          post.id === momentId 
            ? { ...post, shares: response.data.shares }
            : post
        ));
      }
    } catch (error) {
      console.error('Failed to share post:', error);
    }
  };

  const handleDeleteMoment = async (momentId: string) => {
    try {
      const response = await communityService.deletePost(momentId);
      if (response.success) {
        setMoments(prev => prev.filter(post => post.id !== momentId));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setShowDeleteMenu(null);
    }
  };

  const handleDeleteMenuToggle = (momentId: string) => {
    setShowDeleteMenu(showDeleteMenu === momentId ? null : momentId);
  };

  // Check if user has CrossMint wallet and fetch balance
  const checkWalletStatus = async () => {
    try {
      console.log('🔍 Checking wallet status...');
      
      // First check local storage
      const localConnected = await crossmintService.isWalletConnected();
      console.log('📱 Local wallet connected:', localConnected);
      
      // Also check with backend to ensure accuracy
      const walletStatusResponse = await crossmintService.getWalletStatus();
      console.log('☁️ Backend wallet status:', walletStatusResponse);
      
      const hasBackendWallet = walletStatusResponse.success && walletStatusResponse.wallet?.walletId;
      console.log('🏦 Has backend wallet:', hasBackendWallet);
      
      // If backend says we have a wallet but local storage doesn't know, update local storage
      if (hasBackendWallet && !localConnected) {
        console.log('✅ Updating local storage - wallet found on backend');
        await AsyncStorage.setItem('walletConnected', 'true');
        if (walletStatusResponse.wallet) {
          await AsyncStorage.setItem('walletData', JSON.stringify(walletStatusResponse.wallet));
        }
      }
      
      const crossmintConnected = hasBackendWallet || localConnected;
      
      // Check Aptos wallet - prioritize database over AsyncStorage
      console.log('🟣 Checking Aptos wallet status...');
      
      // First check database for existing Aptos wallet
      let backendAptosWallet;
      try {
        backendAptosWallet = await crossmintService.getWalletFromBackend('aptos-testnet', 'aptos');
        console.log('🏦 Backend Aptos wallet check:', backendAptosWallet);
      } catch (error) {
        console.log('⚠️ Error checking backend Aptos wallet:', error);
        backendAptosWallet = { success: false };
      }
      
      let aptosConnected = false;
      
      if (backendAptosWallet && backendAptosWallet.success && backendAptosWallet.wallet) {
        // Database has the wallet - use it as source of truth
        console.log('✅ Using Aptos wallet from database:', backendAptosWallet.wallet.address);
        setAptosAddress(backendAptosWallet.wallet.address);
        aptosConnected = true;
        
        // Update AsyncStorage to match database
        try {
          await AsyncStorage.setItem('aptosWalletAddress', backendAptosWallet.wallet.address);
          if (backendAptosWallet.wallet.privateKey) {
            await AsyncStorage.setItem('aptosWalletPrivateKey', backendAptosWallet.wallet.privateKey);
          }
          console.log('✅ Updated AsyncStorage with database Aptos wallet');
        } catch (storageError) {
          console.warn('⚠️ Failed to update AsyncStorage:', storageError);
        }
        
        // Run blockchain checks on the database wallet
        await aptosService.debugAccountState(backendAptosWallet.wallet.address);
        
        // Activation Check: Ensure the account is active on-chain
        try {
          const balanceCheck = await aptosService.getAllBalances(backendAptosWallet.wallet.address);
          if (balanceCheck.success) {
            console.log('✅ Database Aptos account is active on-chain.');
          } else {
            console.log('⚠️ Database Aptos account might not be active. Activating with faucet...');
            await aptosService.fundWithFaucet(backendAptosWallet.wallet.address);
            console.log('🚰 Database Aptos wallet funded to activate on-chain.');
          }
        } catch (activationError) {
          console.error('⚠️ Activation check failed for database wallet:', activationError);
        }
      } else {
        // No database wallet, check AsyncStorage but DON'T auto-create
        const localAptosConnected = await aptosService.hasWallet();
        console.log('📱 Local Aptos wallet connected:', localAptosConnected);
        
        if (localAptosConnected) {
          const aptosWallet = await aptosService.getWallet();
          if (aptosWallet.success && aptosWallet.address) {
            console.log('⚠️ Found Aptos wallet in AsyncStorage but not in database:', aptosWallet.address);
            console.log('🔄 This wallet will need to be manually created from the main screen');
            // Don't set as connected - user needs to create wallet properly
            aptosConnected = false;
          }
        } else {
          console.log('ℹ️ No Aptos wallet found. User needs to create one from the main screen.');
          aptosConnected = false;
        }
      }
      
      console.log('🎯 Final wallet status:', {
        crossmint: crossmintConnected,
        aptos: aptosConnected
      });
      
      setHasWallet(crossmintConnected);
      setHasAptosWallet(aptosConnected);
      
      console.log('🔧 State will be updated to:', {
        hasWallet: crossmintConnected,
        hasAptosWallet: aptosConnected,
        aptosAddress: aptosAddress // This might not reflect the latest value due to async state
      });
      
      // Fetch balances for connected wallets - force check to ensure it runs
      console.log('🔄 Balance fetch conditions:', { crossmintConnected, aptosConnected });
      
      if (crossmintConnected || aptosConnected) {
        console.log('✅ Triggering balance fetch...');
        // Pass the detected states directly to avoid async state issues
        await fetchWalletBalanceWithStates(crossmintConnected, aptosConnected);
      } else {
        console.log('⚠️ No wallets detected, skipping balance fetch');
        // Still try to fetch if we have persistent state
        if (hasWallet || hasAptosWallet) {
          console.log('🔄 Found wallet state, force fetching anyway...');
          await fetchWalletBalance(true);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check wallet status:', error);
      setHasWallet(false);
      setHasAptosWallet(false);
    }
  };

  // Fetch wallet balance from both Aptos and EVM (CrossMint)
  const fetchWalletBalance = async (forceCheck = false) => {
    // Skip if no wallets at all
    if (!forceCheck && !hasAptosWallet && !hasWallet) {
      console.log('⚠️ fetchWalletBalance skipped - no wallets detected:', { forceCheck, hasAptosWallet, hasWallet });
      return;
    }
    
    setIsLoadingWallet(true);
    try {
      console.log('🔄 Fetching wallet balances from Aptos + EVM...');
      
      // Create promises for parallel execution
      const balanceFetches: Promise<{type: 'aptos' | 'evm', balances: any}>[] = [];
      
      // 1. Add Aptos balance fetch promise
      console.log('🔍 Checking Aptos wallet for balance fetch:', { hasAptosWallet });
      if (hasAptosWallet) {
        const aptosPromise = aptosService.getWallet().then(async (aptosWallet) => {
          if (aptosWallet.success && aptosWallet.address) {
            console.log('🟣 Fetching Aptos USDC balance for address:', aptosWallet.address);
            const aptosBalances = await aptosService.getAllBalances(aptosWallet.address);
            return { type: 'aptos' as const, balances: aptosBalances };
          }
          return { type: 'aptos' as const, balances: { success: false, error: 'No Aptos wallet' } };
        });
        balanceFetches.push(aptosPromise);
      }
      
      // 2. Add EVM balance fetch promise
      console.log('🔍 Checking EVM wallet for balance fetch:', { hasWallet });
      if (hasWallet) {
        const evmPromise = crossmintService.getWalletFromBackend('ethereum', 'crossmint').then(async (evmWalletData) => {
          console.log('🔷 Fetching EVM wallet balances...');
          
          let evmAddress = '0x678bCC985D12C5fF769A2F4A5ff323A2029284Bb'; // fallback
          if (evmWalletData.success && evmWalletData.wallet?.address) {
            evmAddress = evmWalletData.wallet.address;
            console.log('✅ Using EVM address from database:', evmAddress);
          } else {
            console.log('⚠️ Using fallback EVM address:', evmAddress);
          }
          
          // Try CrossMint service first
          const evmBalances = await crossmintService.getWalletBalance(evmAddress);
          
          // Check if CrossMint returned any non-zero balances
          let hasNonZeroBalances = false;
          if (evmBalances.success && evmBalances.balances) {
            hasNonZeroBalances = Object.values(evmBalances.balances).some(balance => parseFloat(balance) > 0);
          }
          
          if (evmBalances.success && evmBalances.balances && hasNonZeroBalances) {
            return { type: 'evm' as const, balances: evmBalances };
          } else {
            // Fallback to direct RPC calls
            const directBalances = await crossmintService.getEVMBalancesDirect(evmAddress);
            return { type: 'evm' as const, balances: directBalances };
          }
        });
        balanceFetches.push(evmPromise);
      }
      
      // 3. Execute all promises in parallel and wait for completion
      if (balanceFetches.length === 0) {
        console.log('⚠️ No balance fetches to execute');
        setWalletBalance({});
        setTotalPortfolioValue(0);
        return;
      }
      
      console.log(`⏳ Waiting for ${balanceFetches.length} balance fetches to complete...`);
      const results = await Promise.allSettled(balanceFetches);
      
      // 4. Process all results atomically
      const flattenedBalances: { [key: string]: number } = {};
      let totalUSDCValue = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { type, balances } = result.value;
          
          if (type === 'aptos' && balances.success && balances.balances) {
            console.log('✅ Processing Aptos balances:', balances.balances);
            Object.entries(balances.balances).forEach(([token, balance]) => {
              const balanceNum = parseFloat(balance) || 0;
              
              // Only include USDC from Aptos in portfolio calculation
              if (token.includes('USDC') || token.toUpperCase() === 'USDC') {
                flattenedBalances['USDC (Aptos)'] = balanceNum;
                totalUSDCValue += balanceNum;
                console.log(`💰 Added USDC from Aptos: ${balanceNum}`);
              }
              
              // Also include APT for display but not in USDC total
              if (token.includes('APT') || token.toUpperCase() === 'APT') {
                flattenedBalances['APT (Aptos)'] = balanceNum;
                console.log(`🟣 Added APT from Aptos: ${balanceNum} (display only)`);
              }
            });
          }
          
          if (type === 'evm' && balances.success && balances.balances) {
            console.log('✅ Processing EVM balances:', balances.balances);
            Object.entries(balances.balances).forEach(([token, balance]) => {
              const balanceNum = parseFloat(balance) || 0;
              
              // Handle USDC from testnets or CrossMint
              if (token.includes('USDC')) {
                const chainName = token.includes('Ethereum') ? 'Ethereum Sepolia' : 
                                 token.includes('Polygon') ? 'Polygon Amoy' : 
                                 token.toUpperCase() === 'USDC' ? 'EVM' : token;
                flattenedBalances[`USDC (${chainName})`] = balanceNum;
                totalUSDCValue += balanceNum;
                console.log(`💰 Added USDC from ${chainName}: ${balanceNum}`);
              }
              
              // Handle native tokens (only if non-zero)
              if ((token === 'ETH' || token === 'MATIC' || token === 'SOL') && balanceNum > 0) {
                flattenedBalances[`${token} (${token === 'ETH' ? 'Ethereum' : token === 'MATIC' ? 'Polygon' : 'Solana'})`] = balanceNum;
                console.log(`🔷 Added ${token} from EVM: ${balanceNum} (display only)`);
              }
            });
          }
        } else {
          console.error(`❌ Balance fetch ${index} failed:`, result.reason);
        }
      });
      
      // 5. Update UI atomically with all balances at once
      console.log('📊 Final combined balances:', flattenedBalances);
      console.log('📈 Total USDC portfolio value:', totalUSDCValue);
      
      // Single atomic update to prevent UI flickering
      setWalletBalance(flattenedBalances);
      setTotalPortfolioValue(totalUSDCValue);
    } catch (error: any) {
      console.error('❌ Failed to get wallet balances:', error);
      setWalletError(error.message || 'Failed to load wallet balances');
    } finally {
      setIsLoadingWallet(false);
    }
  };

  // Fetch wallet balance using provided wallet states (bypasses async React state issues)
  const fetchWalletBalanceWithStates = async (evmConnected: any, aptosConnected: boolean) => {
    setIsLoadingWallet(true);
    try {
      console.log('🔄 Fetching wallet balances with direct states:', { evmConnected, aptosConnected });
      
      // Create promises for parallel execution
      const balanceFetches: Promise<{type: 'aptos' | 'evm', balances: any}>[] = [];
      
      // 1. Add Aptos balance fetch promise
      if (aptosConnected) {
        const aptosPromise = aptosService.getWallet().then(async (aptosWallet) => {
          if (aptosWallet.success && aptosWallet.address) {
            console.log('🟣 Fetching Aptos USDC balance for address:', aptosWallet.address);
            const aptosBalances = await aptosService.getAllBalances(aptosWallet.address);
            return { type: 'aptos' as const, balances: aptosBalances };
          }
          return { type: 'aptos' as const, balances: { success: false, error: 'No Aptos wallet' } };
        });
        balanceFetches.push(aptosPromise);
      }
      
      // 2. Add EVM balance fetch promise
      if (evmConnected) {
        const evmPromise = crossmintService.getWalletFromBackend('ethereum', 'crossmint').then(async (evmWalletData) => {
          console.log('🔷 Fetching EVM wallet balances...');
          
          let evmAddress = '0x678bCC985D12C5fF769A2F4A5ff323A2029284Bb'; // fallback
          if (evmWalletData.success && evmWalletData.wallet?.address) {
            evmAddress = evmWalletData.wallet.address;
            console.log('✅ Using EVM address from database:', evmAddress);
          } else {
            console.log('⚠️ Using fallback EVM address:', evmAddress);
          }
          
          // Try CrossMint service first
          const evmBalances = await crossmintService.getWalletBalance(evmAddress);
          
          // Check if CrossMint returned any non-zero balances
          let hasNonZeroBalances = false;
          if (evmBalances.success && evmBalances.balances) {
            hasNonZeroBalances = Object.values(evmBalances.balances).some(balance => parseFloat(balance) > 0);
          }
          
          if (evmBalances.success && evmBalances.balances && hasNonZeroBalances) {
            return { type: 'evm' as const, balances: evmBalances };
          } else {
            // Fallback to direct RPC calls
            const directBalances = await crossmintService.getEVMBalancesDirect(evmAddress);
            return { type: 'evm' as const, balances: directBalances };
          }
        });
        balanceFetches.push(evmPromise);
      }
      
      // 3. Execute all promises in parallel and wait for completion
      if (balanceFetches.length === 0) {
        console.log('⚠️ No balance fetches to execute');
        setWalletBalance({});
        setTotalPortfolioValue(0);
        return;
      }
      
      console.log(`⏳ Waiting for ${balanceFetches.length} balance fetches to complete...`);
      const results = await Promise.allSettled(balanceFetches);
      
      // 4. Process all results atomically
      const flattenedBalances: { [key: string]: number } = {};
      let totalUSDCValue = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { type, balances } = result.value;
          
          if (type === 'aptos' && balances.success && balances.balances) {
            console.log('✅ Processing Aptos balances:', balances.balances);
            Object.entries(balances.balances).forEach(([token, balance]) => {
              const balanceNum = parseFloat(balance) || 0;
              
              // Only include USDC from Aptos in portfolio calculation
              if (token.includes('USDC') || token.toUpperCase() === 'USDC') {
                flattenedBalances['USDC (Aptos)'] = balanceNum;
                totalUSDCValue += balanceNum;
                console.log(`💰 Added USDC from Aptos: ${balanceNum}`);
              }
              
              // Also include APT for display but not in USDC total
              if (token.includes('APT') || token.toUpperCase() === 'APT') {
                flattenedBalances['APT (Aptos)'] = balanceNum;
                console.log(`🟣 Added APT from Aptos: ${balanceNum} (display only)`);
              }
            });
          }
          
          if (type === 'evm' && balances.success && balances.balances) {
            console.log('✅ Processing EVM balances:', balances.balances);
            Object.entries(balances.balances).forEach(([token, balance]) => {
              const balanceNum = parseFloat(balance) || 0;
              
              // Handle USDC from testnets or CrossMint
              if (token.includes('USDC')) {
                const chainName = token.includes('Ethereum') ? 'Ethereum Sepolia' : 
                                 token.includes('Polygon') ? 'Polygon Amoy' : 
                                 token.toUpperCase() === 'USDC' ? 'EVM' : token;
                flattenedBalances[`USDC (${chainName})`] = balanceNum;
                totalUSDCValue += balanceNum;
                console.log(`💰 Added USDC from ${chainName}: ${balanceNum}`);
              }
              
              // Handle native tokens (only if non-zero)
              if ((token === 'ETH' || token === 'MATIC' || token === 'SOL') && balanceNum > 0) {
                flattenedBalances[`${token} (${token === 'ETH' ? 'Ethereum' : token === 'MATIC' ? 'Polygon' : 'Solana'})`] = balanceNum;
                console.log(`🔷 Added ${token} from EVM: ${balanceNum} (display only)`);
              }
            });
          }
        } else {
          console.error(`❌ Balance fetch failed:`, result.reason);
        }
      });
      
      console.log('💎 Final aggregated balances:', flattenedBalances);
      console.log('💰 Total USDC value:', totalUSDCValue);
      
      // Update state atomically
      setWalletBalance(flattenedBalances);
      setTotalPortfolioValue(totalUSDCValue);
    } catch (error: any) {
      console.error('❌ Failed to get wallet balances with states:', error);
      setWalletError(error.message || 'Failed to load wallet balances');
    } finally {
      setIsLoadingWallet(false);
    }
  };

  // REMOVED: handleCreateWallet function - wallet creation now happens at chain level during deposit
  // This prevents creating multiple wallets and ensures consistency with database wallets

  // Check wallet status when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      checkWalletStatus();
    }
  }, [isAuthenticated, currentUser]);

  // Periodic balance refresh when wallet is connected
  useEffect(() => {
    if (hasWallet && isAuthenticated) {
      const interval = setInterval(() => {
        fetchWalletBalance(true);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [hasWallet, isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      await authService.initialize();
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        const sessionResult = await authService.getSession();
        if (sessionResult.success && sessionResult.user) {
          setCurrentUser(sessionResult.user);
          setIsAuthenticated(true);
          
          // Update profile data from user
          setUserProfile(prev => ({
            ...prev,
            name: sessionResult.user?.name || '',
            email: sessionResult.user?.email || '',
          }));
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginSuccess = (userData: User) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    
    // Update profile data from user
    setUserProfile(prev => ({
      ...prev,
      name: userData.name || '',
      email: userData.email || '',
    }));
    
    console.log('User logged in:', userData);
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 App.handleLogout() called');
      console.log('🔄 Current authentication state before logout:', {
        isAuthenticated,
        hasCurrentUser: !!currentUser,
        currentUserEmail: currentUser?.email
      });
      
      console.log('🔄 Calling authService.logout()...');
      await authService.logout();
      console.log('✅ authService.logout() completed');
      
      console.log('🗑️ Clearing profile cache...');
      profileService.clearCache();
      
      console.log('🗑️ Clearing app state...');
      // Clear user data
      setCurrentUser(null);
      setIsAuthenticated(false);
      setUserProfile({
        name: '',
        email: '',
        phone: '',
        bio: '',
        location: '',
        dateOfBirth: '',
        gender: '',
      });
      
      // Clear community data
      setMoments([]);
      setMomentsError(null);
      
      console.log('🔄 Resetting to default tab...');
      // Reset to default tab
      setActiveTab('wallet');
      
      console.log('✅ Logout completed successfully');
      console.log('🔄 Final authentication state:', {
        isAuthenticated: false,
        hasCurrentUser: false
      });
    } catch (error) {
      console.error('❌ Logout error in App.handleLogout():', error);
      console.error('❌ Logout error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      });
    }
  };

  // Loading simulation helper
  const simulateLoading = (
    setLoading: (loading: boolean) => void,
    duration: number = 2000,
    message?: string
  ) => {
    if (message) setGeneralLoadingMessage(message);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, duration);
  };

  // Error simulation helper
  const simulateError = (errorType: 'network' | 'wallet' | 'contacts' | 'moments' | 'payment', message?: string) => {
    // Randomly fail 20% of the time to demonstrate error handling
    if (Math.random() < 0.2) {
      switch (errorType) {
        case 'network':
          setNetworkError(true);
          break;
        case 'wallet':
          setWalletError(message || 'Failed to load wallet data');
          break;
        case 'contacts':
          setContactsError(message || 'Failed to load contacts');
          break;
        case 'moments':
          setMomentsError(message || 'Failed to load moments');
          break;
        case 'payment':
          setPaymentError(message || 'Payment failed');
          break;
      }
      return true;
    }
    return false;
  };

  // Clear all errors
  const clearErrors = () => {
    setNetworkError(false);
    setWalletError(null);
    setContactsError(null);
    setMomentsError(null);
    setPaymentError(null);
  };

  // Tab switch with loading and error handling
  const handleTabSwitch = (tab: TabName) => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    clearErrors(); // Clear previous errors
    
    // Reset sub-screen states when switching tabs
    if (tab !== 'me') setCurrentMeScreen('main');
    if (tab !== 'wallet') setCurrentWalletScreen('main');
    
    // Simulate loading for different tabs
    switch (tab) {
      case 'contact':
        simulateLoading(setIsLoadingContacts, 1500);
        setTimeout(() => simulateError('contacts'), 1500);
        break;
      case 'moments':
        simulateLoading(setIsLoadingMoments, 1200);
        setTimeout(() => simulateError('moments'), 1200);
        break;
      case 'wallet':
        simulateLoading(setIsLoadingWallet, 1000);
        setTimeout(() => simulateError('wallet'), 1000);
        break;
    }
  };

  const renderWallet = () => {
    // Handle sub-screens
    switch (currentWalletScreen) {
      case 'notifications':
        return (
          <NotificationScreen
            onBack={() => setCurrentWalletScreen('main')}
            onNotificationPress={(notification) => {
              console.log('Notification pressed:', notification);
              // Handle notification action
            }}
            onMarkAsRead={(notificationId) => {
              console.log('Mark as read:', notificationId);
              // Update notification status
            }}
            onMarkAllAsRead={() => {
              console.log('Mark all as read');
              // Update all notifications
            }}
            onClearAll={() => {
              console.log('Clear all notifications');
              // Clear all notifications
            }}
            onManageSettings={() => setCurrentWalletScreen('notificationSettings')}
          />
        );
      
      case 'notificationSettings':
        return (
          <NotificationSettingsScreen
            onBack={() => setCurrentWalletScreen('notifications')}
          />
        );
      
      case 'tokens':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setCurrentWalletScreen('main')} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors.gray700} />
              </TouchableOpacity>
              <Typography variant="h3">My Tokens</Typography>
              <View style={styles.headerSpacer} />
            </View>
            
            <View style={[styles.tokenRow, styles.tokenRowSpacing]}>
              <View style={styles.tokenInfo}>
                <Typography variant="h6">ETH</Typography>
                <Typography variant="body2" color="textSecondary">Ethereum</Typography>
              </View>
              <View style={styles.tokenBalance}>
                <Typography variant="h6">0.00 ETH</Typography>
                <Typography variant="body2" color="textSecondary">$0.00</Typography>
              </View>
            </View>
            
            <View style={[styles.tokenRow, styles.tokenRowSpacing]}>
              <View style={styles.tokenInfo}>
                <Typography variant="h6">USDC</Typography>
                <Typography variant="body2" color="textSecondary">USD Coin</Typography>
              </View>
              <View style={styles.tokenBalance}>
                <Typography variant="h6">0.00 USDC</Typography>
                <Typography variant="body2" color="textSecondary">$0.00</Typography>
              </View>
            </View>

            <View style={[styles.tokenRow, styles.tokenRowSpacing]}>
              <View style={styles.tokenInfo}>
                <Typography variant="h6">BTC</Typography>
                <Typography variant="body2" color="textSecondary">Bitcoin</Typography>
              </View>
              <View style={styles.tokenBalance}>
                <Typography variant="h6">0.00 BTC</Typography>
                <Typography variant="body2" color="textSecondary">$0.00</Typography>
              </View>
            </View>

            {/* Empty Transactions State */}
            <View style={{ marginTop: Spacing.xl }}>
              <Typography variant="h6" style={{ marginBottom: Spacing.md, paddingHorizontal: Spacing.lg }}>
                Recent Transactions
              </Typography>
              <EmptyTransactions
                onMakeTransaction={() => setShowP2PSend(true)}
              />
            </View>
          </ScrollView>
        );

      case 'properties':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setCurrentWalletScreen('main')} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors.gray700} />
              </TouchableOpacity>
              <Typography variant="h3">Property Investments</Typography>
              <View style={styles.headerSpacer} />
            </View>
            
            <EmptyProperties
              onBrowse={() => setCurrentWalletScreen('marketplace')}
              onLearnMore={() => {
                // TODO: Navigate to learning resources
                console.log('Learn more about property investment');
              }}
            />
          </ScrollView>
        );

      case 'lending':
        if (selectedLoan) {
          return (
            <LoanDetailScreen
              loan={selectedLoan}
              onBack={() => setSelectedLoan(null)}
              onMakeOffer={(offer) => {
                console.log('Made loan offer:', offer);
              }}
              onFundLoan={(amount) => {
                console.log('Funded loan:', amount);
              }}
              onContactBorrower={() => {
                setSelectedLoan(null);
                setCurrentWalletScreen('main');
                setActiveTab('chat');
              }}
            />
          );
        }
        return (
          <LendingMarketplace
            onLoanSelect={(loan) => {
              setSelectedLoan(loan);
            }}
            onCreateRequest={() => setShowLoanRequest(true)}
            onBack={() => setCurrentWalletScreen('main')}
          />
        );

      case 'marketplace':
        switch (currentFXScreen) {
          case 'offer_detail':
            if (selectedOffer) {
              return (
                <FXOfferDetail
                  offer={selectedOffer}
                  onBack={() => {
                    setSelectedOffer(null);
                    setCurrentFXScreen('marketplace');
                  }}
                  onStartTrade={handleStartTrade}
                  onContactTrader={() => {
                    // Find the conversation for this trader
                    const traderConversation = conversations.find(c => c.id === selectedOffer.maker.id);
                    if (traderConversation) {
                      setSelectedChat(traderConversation);
                      // Don't change tabs, keep the user in wallet/FX context
                    }
                  }}
                />
              );
            }
            return null;
            
          case 'trade_room':
            if (currentTrade) {
              return (
                <TradeRoom
                  trade={currentTrade}
                  onBack={() => {
                    setCurrentTrade(null);
                    setCurrentFXScreen('marketplace');
                  }}
                  onUploadPaymentProof={handleUploadPaymentProof}
                  onConfirmPayment={handleConfirmPayment}
                  onSignRelease={handleSignRelease}
                  onOpenDispute={handleOpenDispute}
                  onCompleteRating={handleCompleteRating}
                />
              );
            }
            return null;
            
          default:
            return (
              <FXMarketplace
                onOfferSelect={(offer) => {
                  setSelectedOffer(offer);
                  setCurrentFXScreen('offer_detail');
                }}
                onCreateOffer={() => setShowCreateFXOffer(true)}
                onBack={() => setCurrentWalletScreen('main')}
              />
            );
        }

      case 'webview':
        return (
          <MarketplaceWebView
            onBack={() => setCurrentWalletScreen('main')}
            userToken={currentUser?.id} // Pass user token for authentication
            userId={currentUser?.id}
          />
        );

      default:
        // Main wallet screen
        return (
          <ScrollView style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Typography variant="h3">My Wallet</Typography>
                {/* <Typography variant="body1" color="textSecondary">Financial hub & services</Typography> */}
              </View>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => {
                  setCurrentWalletScreen('notifications');
                }}
              >
                <MaterialIcons name="notifications" size={24} color={Colors.gray600} />
                {/* Small dot for unread notifications */}
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>

            {/* Balance Card */}
            {walletError ? (
              <Card style={styles.balanceCard}>
                <ErrorMessage
                  title="Wallet Error"
                  message={walletError}
                  actionLabel="Retry"
                  onAction={() => {
                    setWalletError(null);
                    handleTabSwitch('wallet');
                  }}
                  onDismiss={() => setWalletError(null)}
                />
              </Card>
            ) : isLoadingWallet ? (
              <Card style={styles.balanceCard}>
                <LoadingSpinner message="Loading balance..." />
              </Card>
            ) : (
              <Card style={styles.balanceCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                  <Typography variant="caption" color="textSecondary">Total Portfolio</Typography>
                  {hasWallet && (
                    <TouchableOpacity onPress={() => fetchWalletBalance(true)} disabled={isLoadingWallet}>
                      <MaterialIcons 
                        name="refresh" 
                        size={16} 
                        color={isLoadingWallet ? Colors.gray400 : Colors.primary} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <Typography variant="h1" align="center" style={{ marginVertical: Spacing.sm }}>
                  {profileService.formatBalance(totalPortfolioValue)}
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Total USDC Balance
                </Typography>
                
                {/* Balance Breakdown */}
                {hasWallet && Object.keys(walletBalance).length > 0 ? (
                  <View style={{ marginTop: Spacing.md }}>
                    {Object.entries(walletBalance).map(([token, balance]) => (
                      <View key={token} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                        <Typography variant="caption" color="textSecondary">{token}:</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {typeof balance === 'number' ? balance.toFixed(4) : parseFloat(String(balance)).toFixed(4)}
                        </Typography>
                      </View>
                    ))}
                  </View>
                ) : (
                  /* Empty Wallet Helper */
                  <View style={{ marginTop: Spacing.lg, alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary" align="center" style={{ marginBottom: Spacing.sm }}>
                      {hasWallet ? 'Your wallet is empty' : 'Create a wallet to get started'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" align="center">
                      Add funds to start investing in real estate
                    </Typography>
                  </View>
                )}
              </Card>
            )}

            {/* Quick Actions */}
            <View style={styles.actionButtons}>
              <Button 
                title="Deposit" 
                icon="add" 
                onPress={() => {
                  if (simulateError('payment', 'Deposit service temporarily unavailable')) {
                    return;
                  }
                  simulateLoading(setIsLoadingGeneral, 1500, 'Opening deposit...');
                  setTimeout(() => setShowDepositFlow(true), 1500);
                }}
                style={{ flex: 1 }}
              />
              <Button 
                title="Send" 
                icon="send" 
                variant="outline"
                onPress={() => {
                  if (!hasWallet) {
                    Alert.alert('Wallet Required', 'Please create a wallet first to send payments.');
                    return;
                  }
                  simulateLoading(setIsLoadingGeneral, 1000, 'Loading contacts...');
                  setTimeout(() => setShowP2PSend(true), 1000);
                }} 
                style={{ flex: 1 }}
              />
              <Button 
                title="Scan" 
                icon="qr-code-scanner" 
                variant="outline"
                onPress={() => setShowQRScanner(true)} 
                style={{ flex: 1 }}
              />
            </View>

            {/* Portfolio Quick Access */}
            <View style={styles.portfolioSection}>
              <Typography variant="h6" style={{ marginBottom: Spacing.md }}>Portfolio</Typography>
              <View style={styles.portfolioGrid}>
                <TouchableOpacity 
                  style={styles.portfolioItem}
                  onPress={() => setCurrentWalletScreen('tokens')}
                >
                  <MaterialIcons name="toll" size={24} color={Colors.primary} />
                  <Typography variant="caption" style={styles.portfolioLabel}>Tokens</Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.portfolioItem}
                  onPress={() => setCurrentWalletScreen('webview')}
                >
                  <MaterialIcons name="home" size={24} color={Colors.primary} />
                  <Typography variant="caption" style={styles.portfolioLabel}>Properties</Typography>
                </TouchableOpacity>
              </View>
            </View>

            {/* Financial Services */}
            <View style={styles.section}>
              <Typography variant="h6" style={{ marginBottom: Spacing.md }}>Financial Services</Typography>
              <View style={styles.servicesGrid}>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="currency-exchange" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Swap/FX</Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.serviceItem}
                  onPress={() => setCurrentWalletScreen('lending')}
                >
                  <MaterialIcons name="handshake" size={24} color={Colors.primary} />
                  <Typography variant="caption" style={styles.serviceLabel}>Lending</Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.serviceItem}
                  onPress={() => setCurrentWalletScreen('marketplace')}
                >
                  <MaterialIcons name="currency-exchange" size={24} color={Colors.primary} />
                  <Typography variant="caption" style={styles.serviceLabel}>FX Market</Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.serviceItem}
                  onPress={() => setCurrentWalletScreen('webview')}
                >
                  <MaterialIcons name="home-work" size={24} color={Colors.primary} />
                  <Typography variant="caption" style={styles.serviceLabel}>Properties</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="savings" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Savings</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="security" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Insurance</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="receipt" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Statements</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="money" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Cash Out</Typography>
                </TouchableOpacity>
              </View>
            </View>

            {/* Daily Services */}
            <View style={styles.section}>
              <Typography variant="h6" style={{ marginBottom: Spacing.md }}>Daily Services</Typography>
              <View style={styles.servicesGrid}>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="phone-android" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Mobile Top-Up</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="electrical-services" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Utilities</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="card-giftcard" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Gift Cards</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="payment" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Bill Pay</Typography>
                </TouchableOpacity>
              </View>
            </View>

            {/* Community & Tools */}
            <View style={styles.section}>
              <Typography variant="h6" style={{ marginBottom: Spacing.md }}>Community & Tools</Typography>
              <View style={styles.servicesGrid}>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="grain" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Bricks</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="school" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Learn</Typography>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );
    }
  };

  // Enhanced Contact Data and Functions
  const allContacts = [
    {
      id: 'sarah_anderson',
      name: 'Sarah Anderson',
      role: 'Senior Property Agent',
      category: 'agents',
      avatar: 'SA',
      imageUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
      bricks: 4500,
      trustBadge: 'verified',
      isOnline: true,
      lastSeen: 'Online',
      conversationId: '1',
    },
    {
      id: 'michael_roberts',
      name: 'Michael Roberts',
      role: 'Luxury Property Specialist',
      category: 'agents',
      avatar: 'MR',
      imageUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
      bricks: 2100,
      trustBadge: 'premium',
      isOnline: true,
      lastSeen: '5 min ago',
      conversationId: 'michael_roberts',
    },
    {
      id: 'lisa_johnson',
      name: 'Lisa Johnson',
      role: 'Commercial Real Estate',
      category: 'agents',
      avatar: 'LJ',
      imageUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
      bricks: 3200,
      trustBadge: 'agent',
      isOnline: false,
      lastSeen: '2 hours ago',
      conversationId: 'lisa_johnson',
    },
    {
      id: 'real_estate_investors',
      name: 'Real Estate Investors',
      role: '42 members',
      category: 'investors',
      avatar: 'REI',
      bricks: 15600,
      trustBadge: 'community',
      isGroup: true,
      isOnline: true,
      lastSeen: 'Active',
    },
    {
      id: 'lagos_property_club',
      name: 'Lagos Property Club',
      role: '128 members',
      category: 'investors',
      avatar: 'LPC',
      bricks: 28400,
      trustBadge: 'premium',
      isGroup: true,
      isOnline: true,
      lastSeen: 'Active',
      conversationId: '2',
    },
    {
      id: 'alex_davis',
      name: 'Alex Davis',
      role: 'Property Investor',
      category: 'recent',
      avatar: 'AD',
      bricks: 890,
      trustBadge: 'member',
      isOnline: false,
      lastSeen: '1 day ago',
    },
    {
      id: 'nina_kumar',
      name: 'Nina Kumar',
      role: 'Real Estate Analyst',
      category: 'recent',
      avatar: 'NK',
      bricks: 1250,
      trustBadge: 'verified',
      isOnline: true,
      lastSeen: 'Online',
    },
    {
      id: 'tom_okafor',
      name: 'Tom Okafor',
      role: 'Property Developer',
      category: 'recent',
      avatar: 'TO',
      bricks: 5600,
      trustBadge: 'premium',
      isOnline: false,
      lastSeen: '3 hours ago',
    },
  ];

  const filteredContacts = allContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                         contact.role.toLowerCase().includes(contactSearchQuery.toLowerCase());
    
    if (contactFilter === 'all') return matchesSearch;
    return matchesSearch && contact.category === contactFilter;
  });

  const handleContactPress = (contact: any) => {
    simulateLoading(setIsLoadingGeneral, 800, 'Loading profile...');
    setTimeout(() => {
      setSelectedContact({ name: contact.name, id: contact.id });
      setShowContactProfile(true);
    }, 800);
  };

  const handleMessageContact = (contact: any) => {
    setActiveTab('chat');
    
    if (contact.conversationId) {
      const existingConversation = conversations.find(c => c.id === contact.conversationId);
      if (existingConversation) {
        setSelectedChat(existingConversation);
        return;
      }
    }
    
    // Create new conversation
    const newConversation = {
      id: contact.id,
      name: contact.name,
      lastMessage: contact.isGroup ? 'Welcome to the group!' : 'Hello! How can I help you?',
      timestamp: new Date(),
      unreadCount: 0,
      avatar: contact.imageUrl,
      isOnline: contact.isOnline,
      isPinned: false,
      bricksCount: contact.bricks,
      trustBadge: contact.trustBadge,
      isGroup: contact.isGroup,
    };
    setSelectedChat(newConversation);
  };

  const renderContact = () => {
    const getTrustBadgeIcon = (badge: string) => {
      switch (badge) {
        case 'verified': return 'verified';
        case 'premium': return 'star';
        case 'agent': return 'business';
        case 'community': return 'groups';
        default: return 'person';
      }
    };

    const getTrustBadgeColor = (badge: string) => {
      switch (badge) {
        case 'verified': return Colors.success;
        case 'premium': return Colors.warning;
        case 'agent': return Colors.info;
        case 'community': return Colors.primary;
        default: return Colors.gray400;
      }
    };

    const renderContactItem = (contact: any) => (
      <View key={contact.id} style={styles.enhancedContactRow}>
        <TouchableOpacity 
          style={styles.enhancedContactAvatar}
          onPress={() => handleContactPress(contact)}
        >
          <Typography variant="h6" style={styles.avatarText}>
            {contact.avatar}
          </Typography>
          {contact.isOnline && <View style={styles.onlineIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.enhancedContactInfo}
          onPress={() => handleContactPress(contact)}
        >
          <View style={styles.contactNameRow}>
            <Typography variant="h6" style={styles.contactName}>
              {contact.name}
            </Typography>
            <MaterialIcons 
              name={getTrustBadgeIcon(contact.trustBadge)} 
              size={14} 
              color={getTrustBadgeColor(contact.trustBadge)}
              style={styles.trustBadge}
            />
          </View>
          <Typography variant="body2" color="textSecondary" style={styles.contactRole}>
            {contact.role}
          </Typography>
          <View style={styles.contactStats}>
            <Typography variant="caption" color="textSecondary">
              {contact.bricks} bricks • {contact.lastSeen}
            </Typography>
          </View>
        </TouchableOpacity>
        
        <View style={styles.contactActions}>
          <TouchableOpacity 
            onPress={() => handleMessageContact(contact)}
            style={styles.actionButton}
          >
            <MaterialIcons 
              name={contact.isGroup ? "group" : "message"} 
              size={20} 
              color={Colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Add Contact Button */}
        <View style={styles.enhancedHeader}>
          <Typography variant="h2">Contacts</Typography>
          <TouchableOpacity 
            onPress={() => setShowQRScanner(true)}
            style={styles.addContactButton}
          >
            <MaterialIcons name="person-add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color={Colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor={Colors.gray400}
              value={contactSearchQuery}
              onChangeText={setContactSearchQuery}
            />
            {contactSearchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setContactSearchQuery('')}
                style={styles.clearSearchButton}
              >
                <MaterialIcons name="close" size={16} color={Colors.gray400} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {[
            { key: 'all', label: 'All', count: allContacts.length },
            { key: 'agents', label: 'Agents', count: allContacts.filter(c => c.category === 'agents').length },
            { key: 'investors', label: 'Groups', count: allContacts.filter(c => c.category === 'investors').length },
            { key: 'recent', label: 'Recent', count: allContacts.filter(c => c.category === 'recent').length },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                contactFilter === filter.key && styles.activeFilterTab
              ]}
              onPress={() => setContactFilter(filter.key as any)}
            >
              <Typography 
                variant="body2" 
                style={[
                  styles.filterTabText,
                  contactFilter === filter.key && styles.activeFilterTabText
                ]}
              >
                {filter.label} ({filter.count})
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Contact List */}
        {contactsError ? (
          <ErrorMessage
            title="Failed to load contacts"
            message={contactsError}
            actionLabel="Retry"
            onAction={() => {
              setContactsError(null);
              handleTabSwitch('contact');
            }}
            onDismiss={() => setContactsError(null)}
          />
        ) : isLoadingContacts ? (
          <View>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonContactItem key={i} />
            ))}
          </View>
        ) : filteredContacts.length > 0 ? (
          filteredContacts.map(renderContactItem)
        ) : contactSearchQuery ? (
          <EmptySearch
            searchQuery={contactSearchQuery}
            onClearSearch={() => setContactSearchQuery('')}
          />
        ) : (
          <EmptyContacts
            onAddContact={() => setShowQRScanner(true)}
            onInviteFriends={() => {
              // TODO: Implement invite friends functionality
              console.log('Invite friends');
            }}
          />
        )}
      </ScrollView>
    );
  };


  const handleCreateMoment = async (content: string, image?: string) => {
    try {
      console.log('📝 App.handleCreateMoment() called:', { content, hasImage: !!image, currentUserId: currentUser?.id });
      
      setIsLoadingGeneral(true);
      setGeneralLoadingMessage('Creating moment...');
      
      console.log('🔄 Calling communityService.createPost...');
      const postData = { content };
      if (image) {
        console.log('📷 Including image in post data:', {
          imageSize: image.length,
          imageType: image.substring(0, 30) + '...',
          isBase64: image.startsWith('data:')
        });
        // For now, we'll include the image in the post data
        // In a real implementation, you'd upload to Cloudinary first
        (postData as any).image = image;
      } else {
        console.log('📷 No image provided for post');
      }
      const response = await communityService.createPost(postData);
      console.log('📥 Create post response:', {
        success: response.success,
        error: response.error,
        hasData: !!response.data
      });
      
      if (response.success) {
        console.log('✅ Post created successfully, formatting for UI...');
        
        // Debug the complete response structure
        console.log('🔍 Complete response structure:', JSON.stringify(response, null, 2));
        
        // Backend returns { message, post }, so we need response.data.post
        const postData = response.data?.post || response.data;
        console.log('📝 Raw post data from backend:', {
          hasPost: !!response.data?.post,
          postData: postData,
          postKeys: postData ? Object.keys(postData) : null,
          authorName: postData?.author?.name || postData?.authorName,
          hasImage: !!postData?.image,
          imageSize: postData?.image ? postData.image.length : 0
        });
        
        // Format the new post and add it to the beginning of the list
        const formattedPost = communityService.formatPostForUI(postData, currentUser?.id);
        console.log('📝 Formatted post for UI:', {
          id: formattedPost.id,
          _id: formattedPost._id,
          hasId: !!formattedPost.id,
          authorName: formattedPost.authorName,
          content: formattedPost.content,
          hasImage: !!formattedPost.image
        });
        console.log('📝 Adding new post to moments list');
        // Ensure the new post has a unique ID before adding to list
        if (!formattedPost.id && !formattedPost._id) {
          formattedPost.id = `temp_${Date.now()}_${Math.random()}`;
        }
        setMoments(prev => [formattedPost, ...prev]);
        
        console.log('✅ handleCreateMoment completed successfully');
      } else {
        console.error('❌ Failed to create post:', response.error);
        setMomentsError(response.error || 'Failed to create moment');
        throw new Error(response.error || 'Failed to create moment');
      }
    } catch (error: any) {
      console.error('❌ Error creating moment:', error);
      setMomentsError('Failed to create moment. Please try again.');
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleQRCodeScanned = (data: string) => {
    console.log('QR Code scanned:', data);
    
    // Handle different QR code types
    if (data.startsWith('wallet:')) {
      // Navigate to wallet with address
      setActiveTab('wallet');
    } else if (data.startsWith('payment:')) {
      // Parse and initiate payment
      setShowP2PSend(true);
    } else if (data.startsWith('contact:')) {
      // Add contact and switch to contacts tab
      setActiveTab('contact');
    } else {
      // Default action - could be a wallet address
      setActiveTab('wallet');
    }
  };

  const renderMoments = () => {

    const renderMoment = (moment: any) => {
      const isOwn = moment.authorId === currentUser?.id;
      const userName = moment.authorName || moment.userName || 'Unknown User';
      const userAvatar = moment.avatar || moment.userAvatar;
      const postTime = moment.time || moment.postTime || 'Unknown time';
      
      console.log('🔍 Rendering moment:', {
        momentId: moment.id,
        momentIdType: typeof moment.id,
        authorName: moment.authorName,
        authorId: moment.authorId,
        hasId: !!moment.id,
        hasAuthor: !!moment.author,
        userName
      });
      
      return (
        <View key={moment.id || moment._id} style={styles.momentItem}>
          {/* User header */}
          <View style={styles.momentUserHeader}>
            <View style={styles.momentUserInfo}>
              <View style={styles.momentAvatar}>
                {userAvatar ? (
                  <Image source={{ uri: userAvatar }} style={styles.momentAvatarImage} />
                ) : (
                  <Typography variant="h6">{userName.split(' ').map((n: string) => n[0]).join('')}</Typography>
                )}
              </View>
              <View style={styles.momentUserDetails}>
                <Typography variant="h6" style={styles.momentUserName}>{userName}</Typography>
                <Typography variant="body2" color="textSecondary">{postTime}</Typography>
              </View>
            </View>
            {isOwn && (
              <View style={styles.momentDeleteContainer}>
                <TouchableOpacity onPress={() => handleDeleteMenuToggle(moment.id || moment._id)} style={styles.momentDeleteButton}>
                  <MaterialIcons name="more-vert" size={20} color={Colors.gray600} />
                </TouchableOpacity>
                {showDeleteMenu === (moment.id || moment._id) && (
                  <View style={styles.deleteDropdown}>
                    <TouchableOpacity onPress={() => handleDeleteMoment(moment.id || moment._id)} style={styles.deleteOption}>
                      <MaterialIcons name="delete" size={16} color={Colors.error} />
                      <Typography variant="body2" style={[styles.deleteOptionText, { color: Colors.error }]}>
                        Delete
                      </Typography>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Post content */}
          <Typography variant="body1" style={styles.momentPostContent}>
            {moment.content}
          </Typography>

          {/* Post image */}
          {moment.image && (
            <Image source={{ uri: moment.image }} style={styles.momentPostImage} />
          )}

          {/* Actions */}
          <View style={styles.momentActions}>
            <TouchableOpacity 
              onPress={() => handleLike(moment.id || moment._id)}
              style={styles.momentActionButton}
            >
              <MaterialIcons 
                name={moment.isLikedByUser || moment.isLiked ? 'favorite' : 'favorite-border'} 
                size={20} 
                color={moment.isLikedByUser || moment.isLiked ? Colors.error : Colors.gray600} 
              />
              <Typography variant="body2" style={styles.momentActionText}>
                {moment.likes || 0}
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleShare(moment.id || moment._id)}
              style={styles.momentActionButton}
            >
              <MaterialIcons name="share" size={20} color={Colors.gray600} />
              <Typography variant="body2" style={styles.momentActionText}>
                {moment.shares ? `${moment.shares}` : 'Share'}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.momentsContainer}>
        <ScrollView 
          style={styles.momentsScrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshingMoments}
              onRefresh={() => loadPosts(true)}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.header}>
            <Typography variant="h2">Moments</Typography>
          </View>
          
          {momentsError ? (
            <ErrorMessage
              title="Failed to load moments"
              message={momentsError}
              actionLabel="Retry"
              onAction={() => {
                setMomentsError(null);
                loadPosts();
              }}
              onDismiss={() => setMomentsError(null)}
            />
          ) : isLoadingMoments ? (
            <View>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </View>
          ) : moments.length > 0 ? (
            moments.map((moment) => renderMoment(moment))
          ) : (
            <EmptyMoments
              onCreateMoment={() => setShowCreateMoment(true)}
            />
          )}
          
          {/* Bottom padding to ensure last moment is visible above FAB */}
          <View style={{ height: 80 }} />
        </ScrollView>
        
        {/* Floating Action Button */}
        <TouchableOpacity 
          onPress={() => setShowCreateMoment(true)}
          style={styles.fabButton}
        >
          <MaterialIcons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderMe = () => {
    switch (currentMeScreen) {
      case 'profile':
        return (
          <ProfileScreen
            onBack={() => setCurrentMeScreen('main')}
            onEditProfile={() => setCurrentMeScreen('editProfile')}
          />
        );
      
      case 'editProfile':
        return (
          <ProfileEditScreen
            onBack={() => setCurrentMeScreen('profile')}
            onSave={async (updatedProfile) => {
              try {
                // Update backend via profile service
                const result = await profileService.updateProfile({
                  name: updatedProfile.name,
                });
                
                if (result.success && result.profile) {
                  setCurrentUser(result.profile);
                  setUserProfile(updatedProfile);
                  setCurrentMeScreen('profile');
                } else {
                  console.error('Profile update failed:', result.error);
                  // Handle error - could show a toast/alert
                }
              } catch (error) {
                console.error('Profile update error:', error);
                // Handle error - could show a toast/alert
              }
            }}
            initialProfile={{
              ...userProfile,
              name: currentUser?.name || userProfile.name,
              email: currentUser?.email || userProfile.email,
            }}
          />
        );
      
      case 'settings':
        return (
          <SettingsScreen
            onBack={() => setCurrentMeScreen('main')}
            onChangePassword={() => setCurrentMeScreen('changePassword')}
            onInviteToEarn={() => setCurrentMeScreen('invite')}
            onSetPin={() => setCurrentMeScreen('setPin')}
            onWalletSettings={() => setCurrentMeScreen('walletSettings')}
            onPrivacySettings={() => setCurrentMeScreen('privacySettings')}
            onSendFeedback={() => setCurrentMeScreen('sendFeedback')}
            onAbout={() => setCurrentMeScreen('about')}
            onLogout={handleLogout}
          />
        );
      
      case 'invite':
        return (
          <InviteToEarnScreen
            onBack={() => setCurrentMeScreen('settings')}
          />
        );

      case 'setPin':
        return (
          <SetPinScreen
            onBack={() => setCurrentMeScreen('settings')}
            onPinSet={(pin) => {
              console.log('PIN set:', pin);
              setCurrentMeScreen('settings');
            }}
          />
        );

      case 'changePassword':
        return (
          <ChangePasswordScreen
            onBack={() => setCurrentMeScreen('settings')}
          />
        );

      case 'walletSettings':
        return (
          <WalletSettingsScreen
            onBack={() => setCurrentMeScreen('settings')}
          />
        );

      case 'privacySettings':
        return (
          <PrivacySettingsScreen
            onBack={() => setCurrentMeScreen('settings')}
          />
        );

      case 'sendFeedback':
        return (
          <SendFeedbackScreen
            onBack={() => setCurrentMeScreen('settings')}
          />
        );

      case 'about':
        return (
          <AboutScreen
            onBack={() => setCurrentMeScreen('settings')}
          />
        );

      case 'qrCode':
        return (
          <QRCodeScreen
            onBack={() => setCurrentMeScreen('main')}
            userName="John Doe"
            userId="john_doe_123"
          />
        );
      
      default:
        return (
          <ScrollView style={styles.content}>
            <View style={styles.header}>
              <Typography variant="h2">Me</Typography>
            </View>
            
            <ProfileCard
              name={currentUser?.name || 'User'}
              role="Investor"
              region="Lagos, Nigeria"
              joinDate="March 2024"
              bricksCount={currentUser?.bricks || 0}
              trustBadge="verified"
              trustLevel={4}
              showQRIcon={true}
              onQRPress={() => setCurrentMeScreen('qrCode')}
            />

            <View style={styles.section}>
              <TouchableOpacity onPress={() => setCurrentMeScreen('profile')}>
                <View style={[styles.menuItem, styles.menuItemSpacing]}>
                  <MaterialIcons name="person" size={24} color={Colors.primary} />
                  <Typography variant="h6" style={{ marginLeft: Spacing.md }}>Profile</Typography>
                  <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} style={{ marginLeft: 'auto' }} />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setCurrentMeScreen('settings')}>
                <View style={[styles.menuItem, styles.menuItemSpacing]}>
                  <MaterialIcons name="settings" size={24} color={Colors.primary} />
                  <Typography variant="h6" style={{ marginLeft: Spacing.md }}>Settings</Typography>
                  <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} style={{ marginLeft: 'auto' }} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setCurrentMeScreen('invite')}>
                <View style={[styles.menuItem, styles.menuItemSpacing]}>
                  <MaterialIcons name="share" size={24} color={Colors.secondary} />
                  <Typography variant="h6" style={{ marginLeft: Spacing.md }}>Invite to Earn Bricks</Typography>
                  <View style={styles.inviteBadge}>
                    <Typography variant="caption" style={styles.inviteBadgeText}>New</Typography>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} style={{ marginLeft: Spacing.sm }} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity>
                <View style={[styles.menuItem, styles.menuItemSpacing]}>
                  <MaterialIcons name="account-balance-wallet" size={24} color={Colors.primary} />
                  <Typography variant="h6" style={{ marginLeft: Spacing.md }}>Wallet Settings</Typography>
                  <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} style={{ marginLeft: 'auto' }} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity>
                <View style={[styles.menuItem, styles.menuItemSpacing]}>
                  <MaterialIcons name="help" size={24} color={Colors.primary} />
                  <Typography variant="h6" style={{ marginLeft: Spacing.md }}>Help & Support</Typography>
                  <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} style={{ marginLeft: 'auto' }} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
    }
  };

  const renderChat = () => {
    return (
      <View style={styles.chatContainer}>
        <ConversationList 
          conversations={conversations}
          onConversationPress={(conversation) => setSelectedChat(conversation)}
          onPin={(conversationId) => {
            console.log('Pin conversation:', conversationId);
            // Update conversation pin status
          }}
          onHide={(conversationId) => {
            console.log('Hide conversation:', conversationId);
            // Hide conversation
          }}
          onDelete={(conversationId) => {
            console.log('Delete conversation:', conversationId);
            // Delete conversation
          }}
          onCreateGroup={() => setShowCreateGroup(true)}
          userBricksCount={currentUser?.bricks || 0}
        />
      </View>
    );
  };


  const renderPlaceholder = (title: string) => (
    <View style={styles.placeholder}>
      <Typography variant="h3">{title}</Typography>
      <Typography variant="body1" color="textSecondary" style={{ marginTop: Spacing.sm }}>
        Coming Soon
      </Typography>
    </View>
  );

  // FX Trading Handlers
  const handleStartTrade = async (amount: number) => {
    if (!selectedOffer) {
      console.error('No offer selected for trade');
      return;
    }

    try {
      console.log('🔄 Starting trade with FX service...');
      setIsLoadingGeneral(true);

      const response = await fxService.createTrade(
        selectedOffer.id,
        amount,
        selectedOffer.paymentMethods[0],
        currentUser?.id || 'current_user'
      );

      if (response.success && response.trade) {
        console.log('✅ Trade created successfully:', response.trade);
        setCurrentTrade(response.trade);
        setCurrentFXScreen('trade_room');
      } else {
        console.error('❌ Failed to create trade:', response.error);
        // Show error to user
      }
    } catch (error) {
      console.error('❌ Exception creating trade:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleUploadPaymentProof = async (file: any) => {
    if (!currentTrade) return;

    try {
      console.log('📄 Uploading payment proof...');
      setIsLoadingGeneral(true);

      const response = await fxService.uploadPaymentProof(currentTrade.id, file);
      
      if (response.success) {
        console.log('✅ Payment proof uploaded successfully');
        // Update trade status
        await updateTradeStatus('payment_sent');
      } else {
        console.error('❌ Failed to upload payment proof:', response.error);
      }
    } catch (error) {
      console.error('❌ Exception uploading payment proof:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentTrade) return;

    try {
      console.log('✅ Confirming payment...');
      setIsLoadingGeneral(true);

      const response = await fxService.confirmPayment(currentTrade.id);
      
      if (response.success) {
        console.log('✅ Payment confirmed successfully');
        await updateTradeStatus('payment_confirmed');
      } else {
        console.error('❌ Failed to confirm payment:', response.error);
      }
    } catch (error) {
      console.error('❌ Exception confirming payment:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleSignRelease = async () => {
    if (!currentTrade) return;

    try {
      console.log('🔐 Signing release...');
      setIsLoadingGeneral(true);

      const response = await fxService.signRelease(currentTrade.id);
      
      if (response.success) {
        console.log('✅ Release signed successfully');
        await updateTradeStatus('completed');
      } else {
        console.error('❌ Failed to sign release:', response.error);
      }
    } catch (error) {
      console.error('❌ Exception signing release:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleOpenDispute = async (reason: string) => {
    if (!currentTrade) return;

    try {
      console.log('⚠️ Opening dispute...');
      setIsLoadingGeneral(true);

      const response = await fxService.openDispute(currentTrade.id, reason);
      
      if (response.success) {
        console.log('✅ Dispute opened successfully');
        await updateTradeStatus('disputed');
      } else {
        console.error('❌ Failed to open dispute:', response.error);
      }
    } catch (error) {
      console.error('❌ Exception opening dispute:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleCompleteRating = async (rating: number, review?: string) => {
    if (!currentTrade) return;

    try {
      console.log('⭐ Submitting rating...');
      
      const response = await fxService.submitRating(currentTrade.id, rating, review);
      
      if (response.success) {
        console.log('✅ Rating submitted successfully');
        // Navigate back to marketplace
        setCurrentTrade(null);
        setCurrentFXScreen('marketplace');
      } else {
        console.error('❌ Failed to submit rating:', response.error);
      }
    } catch (error) {
      console.error('❌ Exception submitting rating:', error);
    }
  };

  const updateTradeStatus = async (status: FXTrade['status']) => {
    if (!currentTrade) return;

    try {
      const response = await fxService.updateTradeStatus(currentTrade.id, status);
      
      if (response.success) {
        // Update local trade state
        setCurrentTrade({
          ...currentTrade,
          status: status,
        });
      }
    } catch (error) {
      console.error('❌ Failed to update trade status:', error);
    }
  };

  const renderContent = () => {
    // If a chat is selected, render it regardless of active tab
    if (selectedChat) {
      return (
        <ChatScreen
          chatId={selectedChat.id}
          chatName={selectedChat.name}
          chatAvatar={selectedChat.avatar}
          isOnline={selectedChat.isOnline}
          currentUser={currentUser}
          isGroup={selectedChat.isGroup}
          onBack={() => setSelectedChat(null)}
          onInfo={() => console.log('Show chat info')}
          onNavigateToMoments={() => {
            setSelectedChat(null);
            setActiveTab('moments');
          }}
        />
      );
    }

    if (showContactProfile && selectedContact) {
      return (
        <PublicProfileScreen
          onBack={() => setShowContactProfile(false)}
          onMessage={() => {
            setShowContactProfile(false);
            // Navigate to chat with this contact
          }}
          onSendMoney={() => {
            setShowContactProfile(false);
            setShowP2PSend(true);
          }}
          onViewMoments={() => {
            setShowContactProfile(false);
            // Navigate to moments
          }}
          onNavigateToMoments={() => {
            setShowContactProfile(false);
            setActiveTab('moments');
          }}
          onShareProfile={() => {
            // Share profile logic
          }}
          userName={selectedContact.name}
          userAvatar={selectedContact.avatar}
          userId={selectedContact.id}
        />
      );
    }
    
    switch (activeTab) {
      case 'chat': return renderChat();
      case 'contact': return renderContact();
      case 'wallet': return renderWallet();
      case 'moments': return renderMoments();
      case 'me': return renderMe();
      default: return renderWallet();
    }
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <LoadingSpinner size="large" />
          <Typography variant="body1" color="textSecondary" style={{ marginTop: Spacing.md }}>
            Loading...
          </Typography>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaProvider>
    );
  }

  return (
    <NotificationProvider>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('App Error Boundary:', error, errorInfo);
          // In production, send to error reporting service
        }}
      >
        <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          {/* Content */}
          {renderContent()}

        {/* Tab Bar - Hide when in chat room or on sub-screens */}
        {!selectedChat && currentMeScreen === 'main' && !showContactProfile && !selectedLoan && currentWalletScreen === 'main' && currentFXScreen === 'marketplace' && (
          <View style={styles.tabBar}>
          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => handleTabSwitch('chat')}
          >
            <MaterialIcons 
              name="chat" 
              size={24} 
              color={activeTab === 'chat' ? Colors.primary : Colors.gray600} 
            />
            <Typography variant="caption" color={activeTab === 'chat' ? 'primary' : 'textSecondary'}>
              Chat
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => handleTabSwitch('contact')}
          >
            <MaterialIcons 
              name="contacts" 
              size={24} 
              color={activeTab === 'contact' ? Colors.primary : Colors.gray600} 
            />
            <Typography variant="caption" color={activeTab === 'contact' ? 'primary' : 'textSecondary'}>
              Contact
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => handleTabSwitch('wallet')}
          >
            <MaterialIcons 
              name="account-balance-wallet" 
              size={24} 
              color={activeTab === 'wallet' ? Colors.primary : Colors.gray600} 
            />
            <Typography variant="caption" color={activeTab === 'wallet' ? 'primary' : 'textSecondary'}>
              Wallet
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => handleTabSwitch('moments')}
          >
            <MaterialIcons 
              name="photo-library" 
              size={24} 
              color={activeTab === 'moments' ? Colors.primary : Colors.gray600} 
            />
            <Typography variant="caption" color={activeTab === 'moments' ? 'primary' : 'textSecondary'}>
              Moments
            </Typography>
          </TouchableOpacity>


          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => handleTabSwitch('me')}
          >
            <MaterialIcons 
              name="person" 
              size={24} 
              color={activeTab === 'me' ? Colors.primary : Colors.gray600} 
            />
            <Typography variant="caption" color={activeTab === 'me' ? 'primary' : 'textSecondary'}>
              Me
            </Typography>
          </TouchableOpacity>
          </View>
        )}

        <StatusBar style="auto" />

        {/* P2P Send Flow Modal */}
        <P2PSendFlow
          visible={showP2PSend}
          onClose={() => setShowP2PSend(false)}
          initialRecipient={selectedContact ? {
            id: selectedContact.id,
            name: selectedContact.name,
            avatar: selectedContact.avatar,
          } : undefined}
          onSendComplete={(amount, token, recipient) => {
            console.log('P2P Send completed:', { amount, token, recipient });
            setShowP2PSend(false);
          }}
        />

        {/* Loan Request Flow Modal */}
        <LoanRequestFlow
          visible={showLoanRequest}
          onClose={() => setShowLoanRequest(false)}
          onRequestComplete={(loanRequest) => {
            console.log('Loan request created:', loanRequest);
            // Could add this to moments or chat as loan request
          }}
        />

        {/* Create FX Offer Modal */}
        <CreateFXOffer
          visible={showCreateFXOffer}
          onClose={() => setShowCreateFXOffer(false)}
          onOfferCreated={(offer) => {
            console.log('FX offer created:', offer);
            // Could add this to moments or chat as offer created
          }}
        />

        {/* Deposit Flow Modal */}
        <DepositFlow
          visible={showDepositFlow}
          onClose={() => setShowDepositFlow(false)}
        />

        {/* Create Group Modal */}
        <CreateGroupModal
          visible={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(group) => {
            console.log('Group created:', group);
            // Could add group to conversations or moments
          }}
        />

        {/* Create Moment Modal */}
        <CreateMomentModal
          isVisible={showCreateMoment}
          onClose={() => setShowCreateMoment(false)}
          onCreateMoment={handleCreateMoment}
          currentUser={currentUser}
        />

        {/* QR Scanner Modal */}
        <QRScannerModal
          isVisible={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onQRCodeScanned={handleQRCodeScanned}
          title="Scan QR Code"
          description="Scan any QR code for payments, contacts, or other actions"
        />

        {/* Global Loading Overlay */}
        <LoadingOverlay
          visible={isLoadingGeneral}
          message={generalLoadingMessage}
          transparent={true}
        />

        {/* Payment Error Modal */}
        {paymentError && (
          <PaymentError
            message={paymentError}
            onRetry={() => setPaymentError(null)}
            onDismiss={() => setPaymentError(null)}
          />
        )}

        {/* Network Error Screen */}
        {networkError && (
          <NoInternetScreen
            onRetry={() => {
              setNetworkError(false);
              clearErrors();
            }}
          />
        )}
        {/* In-App Notifications */}
        <AppNotificationWrapper />
      </SafeAreaView>
    </SafeAreaProvider>
    </ErrorBoundary>
  </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  
  // Cards
  balanceCard: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['4xl'],
  },
  
  // Sections
  section: {
    marginBottom: Spacing['3xl'],
  },
  
  // Wallet Screen
  walletHeader: {
    marginBottom: Spacing['3xl'],
  },
  connectCard: {
    alignItems: 'center',
  },
  
  // Placeholder
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['4xl'],
  },
  
  // Chat
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  chatHeader: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  
  // Token row
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  
  // Contact row
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  
  // Enhanced Contact Styles
  contactsContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  enhancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  addContactButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '10',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    fontSize: 16,
    color: Colors.gray700,
  },
  clearSearchButton: {
    padding: Spacing.xs,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  filterTab: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
    minWidth: 60,
    alignItems: 'center',
    height: 32,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    color: Colors.gray600,
    fontSize: 12,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: Colors.white,
    fontWeight: '600',
  },
  contactList: {
    flex: 1,
  },
  enhancedContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  enhancedContactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    position: 'relative',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  enhancedContactInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  contactName: {
    fontWeight: '600',
    fontSize: 16,
  },
  trustBadge: {
    marginLeft: Spacing.xs,
  },
  contactRole: {
    fontSize: 14,
    marginBottom: 2,
  },
  contactStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '10',
  },
  
  // Profile
  profileSection: {
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Menu item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  
  // Profile section updates
  profileBricks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  
  // Invite badge
  inviteBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
    marginLeft: 'auto',
  },
  inviteBadgeText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: '600',
  },

  // Token row spacing
  tokenRowSpacing: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  // Menu item spacing
  menuItemSpacing: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  // Moment item (removed card styling for more space)
  momentItem: {
    backgroundColor: Colors.background,
    marginBottom: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray200,
  },
  momentUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  momentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  momentAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md, // Square with rounded corners
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  momentAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md, // Square with rounded corners
  },
  momentUserDetails: {
    flex: 1,
  },
  momentUserName: {
    fontWeight: '600',
  },
  momentDeleteContainer: {
    position: 'relative',
  },
  momentDeleteButton: {
    padding: Spacing.xs,
  },
  deleteDropdown: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  deleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  deleteOptionText: {
    marginLeft: Spacing.xs,
  },
  momentPostContent: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  momentPostImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  momentActions: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  momentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xl,
  },
  momentActionText: {
    marginLeft: Spacing.xs,
    color: Colors.gray600,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  momentsContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  momentsScrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  
  // Wallet Specific Styles
  backButton: {
    padding: Spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  portfolioSection: {
    marginBottom: Spacing.xl,
  },
  portfolioGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  portfolioItem: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    flex: 1,
  },
  portfolioLabel: {
    marginTop: Spacing.sm,
    fontWeight: '500',
    color: Colors.primary,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  serviceItem: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    width: '22%', // 4 items per row with gaps
    minHeight: 80,
    justifyContent: 'center',
  },
  serviceLabel: {
    marginTop: Spacing.sm,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
    fontSize: 10,
  },
});
