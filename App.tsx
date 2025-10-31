// Polyfills must be imported first
import './polyfills';

import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, TouchableOpacity, ScrollView, TextInput, Alert, Linking } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from './src/components/ui/Button';
import { Card } from './src/components/ui/Card';
import { Typography } from './src/components/ui/Typography';
import { Avatar } from './src/components/ui/Avatar';
import { Colors, Spacing } from './src/theme';
import { styles } from './src/styles/appStyles';
import { ConversationList, Conversation } from './src/components/chat/ConversationList';
import { ChatScreen } from './src/components/chat/ChatScreen';
// import { VideoCallScreen } from './src/components/call/VideoCallScreen';
// import { useVideoCall } from './src/hooks/useVideoCall';
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
import { FXContainer } from './src/components/fx/FXContainer';
import { ChangePasswordScreen } from './src/components/settings/ChangePasswordScreen';
import { WalletSettingsScreen } from './src/components/settings/WalletSettingsScreen';
import { PrivacySettingsScreen } from './src/components/settings/PrivacySettingsScreen';
import { BlockedUsersScreen } from './src/components/settings/BlockedUsersScreen';
import { SendFeedbackScreen } from './src/components/settings/SendFeedbackScreen';
import { AboutScreen } from './src/components/settings/AboutScreen';
import { QRCodeScreen } from './src/components/profile/QRCodeScreen';
import { DepositFlow } from './src/components/wallet/DepositFlow';
import { CreateGroupModal } from './src/components/chat/CreateGroupModal';
import { GroupChatDebugPanel } from './src/components/debug/GroupChatDebugPanel';
import { GroupCreationErrorHandler, useGroupCreationErrorHandler } from './src/components/chat/GroupCreationErrorHandler';
import { LoginScreen } from './src/components/auth/LoginScreen';
import { OnboardingModal } from './src/components/auth/OnboardingModal';
import { MarketplaceWebView } from './src/components/webview/MarketplaceWebView';
import { MomentsContainer } from './src/components/moments';
import { QRScannerModal } from './src/components/scanner/QRScannerModal';
import { AddContactScreen } from './src/components/contacts/AddContactScreen';
import { GameModal } from './src/components/games/GameModal';
import { FriendRequestsScreen } from './src/components/friends/FriendRequestsScreen';
import { LoadingSpinner } from './src/components/ui/LoadingSpinner';
import { MainNavigation, TabName } from './src/components/ui/MainNavigation';
import { LoadingOverlay } from './src/components/ui/LoadingOverlay';
import { SkeletonContactItem } from './src/components/ui/SkeletonLoader';
import Toast from 'react-native-toast-message';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';
import { ErrorMessage, NetworkError, ValidationError, PaymentError } from './src/components/ui/ErrorMessage';
import { ErrorScreen, NoInternetScreen, ServerErrorScreen } from './src/components/ui/ErrorScreen';
import { EmptyState, EmptyContacts, EmptyChat, EmptyWallet, EmptyProperties, EmptyTransactions, EmptySearch } from './src/components/ui/EmptyState';
import { ProfileEditScreen } from './src/components/profile/ProfileEditScreen';
import WalletBalanceManager, { CombinedBalanceData } from './src/components/WalletBalanceManager';
import { NotificationScreen } from './src/components/notifications/NotificationScreen';
import { NotificationSettingsScreen } from './src/components/notifications/NotificationSettingsScreen';
import { InAppNotification } from './src/components/notifications/InAppNotification';
import { NotificationProvider, useNotifications } from './src/contexts/NotificationContext';
import NewsHubScreen from './src/components/news/NewsHubScreen';
import authService, { User } from './src/services/authService';
import profileService from './src/services/profileService';
import chatService, { createConversationId, createTradeConversationId } from './src/services/chatService';
import fxService from './src/services/fxService';
// aptosService removed - using Circle/Hedera instead
import friendService from './src/services/friendService';
import emailAuthService from './src/services/emailAuthService';
import { apiService } from './src/services/api';
import { contactsService, ContactDiscoveryResult, DiscoveredContact } from './src/services/contactsService';
import paymentRequestService from './src/services/paymentRequestService';
import { API_BASE_URL } from './src/config/apiConfig';
// Firebase Web SDK imports removed - using React Native Firebase only
// Firebase auth handled via firebaseAuthService.ts
import firebaseAuthService from './src/services/firebaseAuthService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { debugGroupAction, printGroupChatDebugSummary } from './src/utils/groupChatDebugHelper';
import { useMainNavVisibility } from './src/hooks/useMainNavVisibility';
import { clearAllAppCaches } from './src/utils/cacheUtils';

import { FXOffer, FXTrade } from './src/types/fx';
import { PaymentRequest } from './src/types';

type MeScreen = 'main' | 'profile' | 'editProfile' | 'settings' | 'invite' | 'setPin' | 'changePassword' | 'walletSettings' | 'privacySettings' | 'blockedUsers' | 'sendFeedback' | 'about' | 'qrCode';
type WalletScreen = 'main' | 'tokens' | 'properties' | 'lending' | 'marketplace' | 'webview' | 'notifications' | 'notificationSettings' | 'news';
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

// Create QueryClient instance for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 2,
    },
  },
});

// Main App component
function App() {
  //  functionality removed - focusing on Aptos wallet only
  
  // Video calling functionality - temporarily disabled
  // const { isInCall, callData, startCall, endCall } = useVideoCall();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    dateOfBirth: '',
    gender: '',
  });
  
  // Wallet state (Aptos only)
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
  const [currentWalletScreen, setCurrentWalletScreenInternal] = useState<WalletScreen>('main');
  
  // DEBUGGING: Wrapper to log all currentWalletScreen changes
  const setCurrentWalletScreen = (screen: WalletScreen) => {
    console.log('🔧 setCurrentWalletScreen called:', { from: currentWalletScreen, to: screen });
    setCurrentWalletScreenInternal(screen);
  };
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{
    name: string; 
    avatar?: string; 
    id: string;
    friendRequestId?: string;
    isFriendRequest?: boolean;
  } | null>(null);
  
  // Contact management state
  const [currentContactScreen, setCurrentContactScreen] = useState<'main' | 'add' | 'requests'>('main');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
const [showP2PSend, setShowP2PSend] = useState(false);
const [pendingPaymentRequest, setPendingPaymentRequest] = useState<PaymentRequest | null>(null);
const [isFetchingPaymentRequest, setIsFetchingPaymentRequest] = useState(false);
const [showLoanRequest, setShowLoanRequest] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [showCreateFXOffer, setShowCreateFXOffer] = useState(false);
  const [showDepositFlow, setShowDepositFlow] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Group creation error handling
  const { 
    error: groupCreationError, 
    showError: showGroupCreationError, 
    clearError: clearGroupCreationError,
    handleGroupCreationError,
    handleValidationErrors 
  } = useGroupCreationErrorHandler();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'friends'>('all');
  
  // Onboarding flow state
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginInitialEmail, setLoginInitialEmail] = useState<string | undefined>(undefined);
  const [loginInitialStep, setLoginInitialStep] = useState<'email' | 'verification' | 'complete'>('email');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  
  // Use the custom hook for MainNavigation visibility
  const isMainNavVisible = useMainNavVisibility({
    selectedChat,
    currentMeScreen,
    showContactProfile,
    selectedLoan,
    currentWalletScreen,
    currentContactScreen
  });
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(false);
  const [generalLoadingMessage, setGeneralLoadingMessage] = useState('Loading...');
  const [networkError, setNetworkError] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  // const [hiddenConversations, setHiddenConversations] = useState<string[]>([]); // TODO: Implement hide feature later
  
  // Device contacts discovery state
  const [deviceContactsResult, setDeviceContactsResult] = useState<ContactDiscoveryResult | null>(null);
  const [isLoadingDeviceContacts, setIsLoadingDeviceContacts] = useState(false);
  const [deviceContactsPermissionGranted, setDeviceContactsPermissionGranted] = useState<boolean | null>(null);
  const [showContactsPermissionPrompt, setShowContactsPermissionPrompt] = useState(false);
  
  // Chat state
  const [conversationsLoading, setConversationsLoading] = useState(false);

  // Test backend connectivity on app start
  useEffect(() => {
    const testConnectivity = async () => {
      console.log('🔗 Testing backend connectivity...');
      try {
        const result = await apiService.healthCheck();
        if (result.success) {
          console.log('✅ Backend connectivity test successful:', result.data);
        } else {
          console.log('❌ Backend connectivity test failed:', result.error);
        }
      } catch (error) {
        console.log('❌ Backend connectivity test error:', error);
      }
    };
    
    testConnectivity();
  }, []);

  // Check for existing authentication on app start
  useEffect(() => {
    // Clear all caches on app start to ensure fresh data
    clearAllAppCaches();
    checkAuthStatus();
  }, []);

  // Setup Firebase chat when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const setupFirebaseChat = async () => {
        try {
          console.log('🔥 Setting up Firebase chat for user:', currentUser.email);
          
          // Check if user is already authenticated with Firebase
          const isFirebaseAuth = await firebaseAuthService.isFirebaseAuthenticated();
          
          if (!isFirebaseAuth) {
            console.log('🔄 Authenticating with Firebase...');
            const authResult = await firebaseAuthService.authenticateWithFirebase();
            
            if (!authResult.success) {
              console.error('❌ Firebase authentication failed:', authResult.error);
              return;
            }
            console.log('✅ Firebase authentication successful');
          }
          
          // Setup conversations listener
          console.log('🔄 Setting up conversations listener...');
          const unsubscribe = chatService.getConversations(currentUser.id, (firebaseConversations) => {
            console.log('📱 Conversations update received:', {
              count: firebaseConversations.length,
              groupCount: firebaseConversations.filter(c => c.isGroup).length,
              directCount: firebaseConversations.filter(c => !c.isGroup).length,
              conversations: firebaseConversations.map(conv => ({
                id: conv.id,
                name: conv.name,
                isGroup: conv.isGroup,
                lastMessage: conv.lastMessage?.slice(0, 30) + '...'
              }))
            });
            setConversations(firebaseConversations);
          });
          
          // Cleanup function
          return () => {
            if (unsubscribe) unsubscribe();
          };
          
        } catch (error) {
          console.error("❌ Failed to setup Firebase chat:", error);
        }
      };
      
      setupFirebaseChat();
    }
  }, [isAuthenticated, currentUser]);

  // Navigation visibility conditions tracking removed to reduce frequent logging


  // Helper function to extract other participant ID from chat ID
  const getOtherParticipantId = (chatId: string, currentUserId: string): string | null => {
    // Chat IDs are formatted as "userId1_userId2" (sorted)
    // For trade conversations: "trade_userId1_userId2_tradeId"
    // For trade rooms: "traderoom_tradeId"
    
    if (chatId.startsWith('trade_') || chatId.startsWith('traderoom_')) {
      // For now, trade calls are not supported
      return null;
    }
    
    const parts = chatId.split('_');
    if (parts.length === 2) {
      // Standard 1-on-1 conversation: "userId1_userId2"
      const [userId1, userId2] = parts;
      return userId1 === currentUserId ? userId2 : userId1;
    }
    
    return null;
  };

  // Call handlers - in-app video calling - temporarily disabled
  // const handleStartVideoCall = async () => {
  //   if (!selectedChat) return;
  //   console.log('📹 Starting video call with:', selectedChat.name);
  //   await startCall(selectedChat.name, selectedChat.avatar, true);
  // };

  // const handleStartVoiceCall = async () => {
  //   if (!selectedChat) return;
  //   console.log('📞 Starting voice call with:', selectedChat.name);
  //   await startCall(selectedChat.name, selectedChat.avatar, false);
  // };

  // Check if user has  wallet and fetch balance
  const checkWalletStatus = async () => {
    try {
      console.log('🔍 Checking wallet status...');
      
      //  wallet status check removed
      
      // Check Aptos wallet - prioritize database over AsyncStorage
      console.log('🟣 Checking Aptos wallet status...');
      
      // First check database for existing Aptos wallet
      // Define proper type for Aptos wallet response
      interface AptosWalletWithData {
        success: boolean;
        wallet?: {
          address: string;
          privateKey?: string;
        };
        error?: string;
      }
      
      let backendAptosWallet: AptosWalletWithData;
      //  service removed - skip backend wallet check
      backendAptosWallet = { success: false };
      
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
        
        // Aptos service removed - using Circle/Hedera instead
        console.log('✅ Database wallet found (Aptos support removed).');
      }
      
      console.log('🎯 Aptos support removed - using Circle/Hedera instead');
      
      console.log('🔧 State will be updated to:', {
        hasWallet: aptosConnected,
        hasAptosWallet: aptosConnected,
        aptosAddress: aptosAddress // This might not reflect the latest value due to async state
      });
      
      // Fetch balances for connected wallets - force check to ensure it runs
      console.log('🔄 Balance fetch conditions:', { aptosConnected });
      
      if (aptosConnected) {
        console.log('✅ Triggering balance fetch...');
        // Pass the detected states directly to avoid async state issues
        fetchCombinedBalances();
      } else {
        console.log('⚠️ No wallets detected, skipping balance fetch');
        // Still try to fetch if we have persistent state
        if (hasWallet || hasAptosWallet) {
          console.log('🔄 Found wallet state, force fetching anyway...');
          fetchCombinedBalances();
        }
      }
    } catch (error) {
      console.error('❌ Failed to check wallet status:', error);
      setHasWallet(false);
      setHasAptosWallet(false);
    }
  };

  // REMOVED: fetchWalletBalance function - replaced by WalletBalanceManager

  // Handle signup button press in preview mode
  const handleSignupPress = () => {
    setShowOnboardingModal(true);
  };

  // Handle onboarding flow actions
  const handleOnboardingSignup = async (email?: string) => {
    setShowOnboardingModal(false);

    if (!email) {
      setLoginInitialEmail(undefined);
      setLoginInitialStep('email');
      setShowLoginModal(true);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setLoginInitialEmail(normalizedEmail);
    
    // Show login modal immediately for better UX
    setLoginInitialStep('verification');
    setShowLoginModal(true);
    
    // Note: The LoginScreen will handle sending the verification code
    // This prevents users from waiting in limbo while SMTP processes
  };

  const handleOnboardingLogin = () => {
    setShowOnboardingModal(false);
    setLoginInitialEmail(undefined);
    setLoginInitialStep('email');
    setShowLoginModal(true);
  };

  // fetchWalletBalanceWithStates function removed - replaced by WalletBalanceManager

  // Handle balance updates from WalletBalanceManager
  const handleBalanceUpdate = (balanceData: CombinedBalanceData) => {
    console.log('💎 Received combined balance update:', balanceData);
    
    // Check if any wallets exist and are working (not errored)
    const workingWallets = balanceData.wallets.filter(wallet => !wallet.error && wallet.address);
    const hasBaseWallet = workingWallets.some(wallet => wallet.chain === 'base');
    const hasHederaWallet = workingWallets.some(wallet => wallet.chain === 'hedera');
    const hasAnyWallet = workingWallets.length > 0;
    
    console.log('💎 Wallet existence check:', {
      totalWallets: balanceData.wallets.length,
      workingWallets: workingWallets.length,
      hasBaseWallet,
      hasHederaWallet,
      hasAnyWallet
    });
    
    // Update wallet existence states based on actual wallet data
    setHasWallet(hasAnyWallet);
    setHasAptosWallet(hasAnyWallet); // Legacy state, now represents "has any wallet"
    
    // Update wallet balance state for UI display
    const combinedBalances: { [key: string]: number } = {};
    let totalUSDCValue = parseFloat(balanceData.totalUSD) || 0;
    
    // Process wallet data to extract token balances
    balanceData.wallets.forEach(wallet => {
      if (wallet.chain === 'aptos') {
        if (wallet.usdcBalance) {
          combinedBalances['USDC'] = (combinedBalances['USDC'] || 0) + parseFloat(wallet.usdcBalance);
        }
        if (wallet.aptBalance) {
          combinedBalances['APT'] = parseFloat(wallet.aptBalance);
        }
      } else if (wallet.chain === 'base') {
        if (wallet.usdcBalance) {
          combinedBalances['USDC'] = (combinedBalances['USDC'] || 0) + parseFloat(wallet.usdcBalance);
        }
        if (wallet.ethBalance) {
          combinedBalances['ETH'] = parseFloat(wallet.ethBalance.replace(' ETH', ''));
        }
      } else if (wallet.chain === 'hedera') {
        if (wallet.usdcBalance) {
          combinedBalances['USDC'] = (combinedBalances['USDC'] || 0) + parseFloat(wallet.usdcBalance);
        }
      }
    });
    
    setWalletBalance(combinedBalances);
    setTotalPortfolioValue(totalUSDCValue);
    setIsLoadingWallet(balanceData.isLoading);
    
    if (balanceData.error) {
      setWalletError(balanceData.error);
    } else {
      setWalletError(null);
    }
  };

  // Ref to trigger balance refresh
  const walletBalanceManagerRef = React.useRef<{ refreshBalance: () => void; forceRefresh: () => void } | null>(null);
  
  // Function to trigger balance refresh (replaces fetchCombinedBalances)
  const fetchCombinedBalances = () => {
    walletBalanceManagerRef.current?.refreshBalance();
  };

  // Function to force refresh (bypasses rate limiting for manual actions)
  const forceRefreshBalances = () => {
    walletBalanceManagerRef.current?.forceRefresh();
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
        fetchCombinedBalances(); // Refetch combined balances
      }, 60000); // Refresh every 60 seconds (less frequent since we have real-time updates)

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
          
          // Get and store the auth token for marketplace integration
          const token = authService.getToken();
          console.log('🔑 checkAuthStatus: Setting auth token', {
            hasToken: !!token,
            tokenLength: token?.length,
            tokenPrefix: token?.substring(0, 30) + '...'
          });
          setAuthToken(token);
          
          // Update profile data from user
          setUserProfile(prev => ({
            ...prev,
            name: sessionResult.user?.name || '',
            email: sessionResult.user?.email || '',
          }));
          
          // DEBUGGING: Ensure wallet screen is set to main after auth restore
          console.log('🔧 checkAuthStatus: Setting currentWalletScreen to main');
          setCurrentWalletScreen('main');
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
    setIsCheckingAuth(false); // Ensure loading state is cleared after login
    
    // Get and store the auth token for marketplace integration
    const token = authService.getToken();
    console.log('🔑 handleLoginSuccess: Setting auth token', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 30) + '...'
    });
    setAuthToken(token);
    
    // Update profile data from user
    setUserProfile(prev => ({
      ...prev,
      name: userData.name || '',
      email: userData.email || '',
    }));
    
    // Reset all navigation state variables to default values
    console.log('🔧 handleLoginSuccess: Resetting all navigation state to defaults');
    setCurrentMeScreen('main');
    setCurrentWalletScreen('main');
    setCurrentContactScreen('main');
    setSelectedChat(null);
    setShowContactProfile(false);
    setSelectedLoan(null);
    setActiveTab('wallet');
    
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
      setAuthToken(null);
      setUserProfile({
        name: '',
        email: '',
        phone: '',
        bio: '',
        location: '',
        dateOfBirth: '',
        gender: '',
      });
      
      
      // Reset all navigation state variables to default values
      console.log('🔧 handleLogout: Resetting all navigation state to defaults');
      setCurrentMeScreen('main');
      setCurrentWalletScreen('main');
      setCurrentContactScreen('main');
      setSelectedChat(null);
      setShowContactProfile(false);
      setSelectedLoan(null);
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
    setPaymentError(null);
  };

  // Device contacts discovery functions
  const handleContactsPermissionRequest = async () => {
    try {
      setIsLoadingDeviceContacts(true);
      const hasPermission = await contactsService.requestPermission();
      setDeviceContactsPermissionGranted(hasPermission);
      
      if (hasPermission) {
        await performContactsDiscovery();
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      setContactsError('Failed to access contacts. Please check your permissions.');
    } finally {
      setIsLoadingDeviceContacts(false);
    }
  };

  const performContactsDiscovery = async () => {
    try {
      setIsLoadingDeviceContacts(true);
      const result = await contactsService.performContactDiscovery();
      setDeviceContactsResult(result);
      console.log('📱 Device contacts discovery completed:', result);
    } catch (error) {
      console.error('Error performing contacts discovery:', error);
      setContactsError('Failed to sync contacts. Please try again.');
    } finally {
      setIsLoadingDeviceContacts(false);
    }
  };

  const handleInviteContact = (contact: any) => {
    const inviteLink = contactsService.generateInviteLink(contact);
    // Open SMS with invite link
    Alert.alert(
      'Invite Contact',
      `Send an invite to ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Invite', 
          onPress: () => {
            // In a real app, this would open the SMS app
            console.log('Opening SMS with invite link:', inviteLink);
            Alert.alert('Invite Sent', `Invitation sent to ${contact.name}`);
          }
        }
      ]
    );
  };

  // Load conversations when user is authenticated
  useEffect(() => {
    if (currentUser && activeTab === 'chat') {
      setConversationsLoading(true);
      
      const unsubscribe = chatService.getConversations(currentUser.id, (firebaseConversations) => {
        console.log('💬 Chat tab - Conversations loaded:', {
          count: firebaseConversations.length,
          groupCount: firebaseConversations.filter(c => c.isGroup).length,
          directCount: firebaseConversations.filter(c => !c.isGroup).length,
          groups: firebaseConversations.filter(c => c.isGroup).map(g => g.name)
        });
        setConversations(firebaseConversations);
        setConversationsLoading(false);
      });

      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [currentUser, activeTab]);

  // Friend requests management
  useEffect(() => {
    // Load friend requests and friends when app starts
    loadFriendRequests();
    loadFriends();
    
    // Set up periodic refresh for contact tab
    const interval = setInterval(() => {
      if (activeTab === 'contact') {
        loadPendingRequests();
        loadFriends(); // Also refresh friends list
      }
    }, 30000); // Refresh every 30 seconds when on contact tab
    
    return () => clearInterval(interval);
  }, [activeTab]);

  // Tab switch with loading and error handling
  const loadFriendRequests = async () => {
    try {
      const [pendingResult, sentResult] = await Promise.all([
        friendService.getPendingRequests(),
        friendService.getSentRequests()
      ]);
      
      if (pendingResult.success) {
        setPendingRequests(pendingResult.requests);
      }
      
      if (sentResult.success) {
        setSentRequests(sentResult.requests);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      console.log('🔄 Refreshing pending friend requests...');
      const pendingResult = await friendService.getPendingRequests();
      
      if (pendingResult.success) {
        setPendingRequests(pendingResult.requests);
        console.log('✅ Updated pending requests:', pendingResult.requests.length);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadFriends = async () => {
    try {
      console.log('👥 Loading friends list...');
      const result = await friendService.getFriends();
      
      if (result.success) {
        // Transform friends data to match contact format
        const transformedFriends = result.friends.map((friend: any) => ({
          id: friend.id,
          name: friend.name,
          role: 'Friend', // Default role for friends
          category: 'friends',
          avatar: friend.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          imageUrl: friend.avatar,
          bricks: 0, // Will be populated if available
          trustBadge: null,
          isOnline: true, // Default to online, could be enhanced with real status
          lastSeen: 'Online',
          conversationId: friend.conversationId,
          friendshipId: friend.friendshipId,
          email: friend.email
        }));
        
        setFriends(transformedFriends);
        console.log('✅ Loaded friends:', transformedFriends.length);
      }
    } catch (error) {
      console.error('❌ Error loading friends:', error);
    }
  };

  const handleQuickRequestResponse = async (request: any, action: 'accept' | 'reject') => {
    try {
      const result = await friendService.respondToRequest(request._id, action);
      
      if (result.success) {
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(r => r._id !== request._id));
        
        if (action === 'accept') {
          // Refresh friends list to show the newly accepted friend
          await loadFriends();
          
          Alert.alert(
            'Success',
            `You are now friends with ${request.sender.name}!`,
            [
              {
                text: 'Start Chatting',
                onPress: () => {
                  setActiveTab('chat');
                }
              },
              { text: 'OK', style: 'default' }
            ]
          );
        } else {
          Alert.alert('Request Declined', 'Friend request declined');
        }
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      Alert.alert('Error', 'Failed to respond to request');
    }
  };

  const handleProfileFriendRequestResponse = async (action: 'accept' | 'reject') => {
    try {
      console.log('🔄 Profile friend request response:', { action, selectedContact: selectedContact?.name });
      
      // Remove the request from pending requests immediately (optimistic update)
      if (selectedContact?.friendRequestId) {
        setPendingRequests(prev => prev.filter(r => r._id !== selectedContact.friendRequestId));
      }
      
      // Close the profile screen
      setShowContactProfile(false);
      setSelectedContact(null);
      
      if (action === 'accept') {
        Alert.alert(
          'Success',
          `You are now friends with ${selectedContact?.name}!`,
          [
            {
              text: 'Start Chatting',
              onPress: () => {
                setActiveTab('chat');
              }
            },
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        Alert.alert('Request Declined', 'Friend request declined');
      }
      
      // Refresh the friend requests and friends list to sync with server
      await loadPendingRequests();
      await loadFriends(); // Refresh friends list to show newly accepted friends
    } catch (error) {
      console.error('Error handling profile friend request response:', error);
      // Refresh the list in case of error
      await loadPendingRequests();
    }
  };

  const handleTabSwitch = (tab: TabName) => {
    if (tab === activeTab) return;
    
    console.log('🔧 handleTabSwitch:', { from: activeTab, to: tab });
    
    setActiveTab(tab);
    clearErrors(); // Clear previous errors
    
    // Reset sub-screen states when switching tabs
    if (tab !== 'me') setCurrentMeScreen('main');
    if (tab !== 'wallet') {
      console.log('🔧 Setting currentWalletScreen to main because switching away from wallet');
      setCurrentWalletScreen('main');
    }
    if (tab !== 'contact') setCurrentContactScreen('main');
    
    // Load friend requests when switching to contact tab
    if (tab === 'contact') {
      loadFriendRequests();
    }
    
    // Simulate loading for different tabs
    switch (tab) {
      case 'contact':
        simulateLoading(setIsLoadingContacts, 1500);
        setTimeout(() => simulateError('contacts'), 1500);
        break;
      case 'wallet':
        simulateLoading(setIsLoadingWallet, 1000);
        setTimeout(() => simulateError('wallet'), 1000);
        break;
    }
  };

  const renderWallet = (previewMode = false) => {
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
      
      case 'news':
        return (
          <NewsHubScreen
            onBack={() => setCurrentWalletScreen('main')}
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
            
            <View style={styles.disabledSection}>
              <Typography variant="body1" style={styles.disabledText}>
                Property investments feature coming soon
              </Typography>
            </View>
          </ScrollView>
        );

      case 'lending':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setCurrentWalletScreen('main')} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors.gray700} />
              </TouchableOpacity>
              <Typography variant="h3">Lending Marketplace</Typography>
              <View style={styles.headerSpacer} />
            </View>
            
            <View style={styles.disabledSection}>
              <Typography variant="body1" style={styles.disabledText}>
                Lending marketplace feature coming soon
              </Typography>
            </View>
          </ScrollView>
        );

      case 'marketplace':
        return (
          <FXContainer 
            currentUser={currentUser}
            isLoadingGeneral={isLoadingGeneral}
            setIsLoadingGeneral={setIsLoadingGeneral}
            onBack={() => setCurrentWalletScreen('main')}
          />
        );

      case 'webview':
        // Debug authentication state before opening marketplace
        console.log('🔍 Opening MarketplaceWebView with auth state:', {
          isAuthenticated,
          hasCurrentUser: !!currentUser,
          currentUserId: currentUser?.id,
          hasAuthToken: !!authToken,
          authTokenLength: authToken?.length,
          authTokenPrefix: authToken?.substring(0, 30) + '...'
        });
        
        return (
          <MarketplaceWebView
            onBack={() => setCurrentWalletScreen('main')}
            userToken={authToken || undefined} // Pass JWT token for seamless authentication
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
              {previewMode ? (
                <TouchableOpacity 
                  style={styles.signupButton}
                  onPress={handleSignupPress}
                >
                  <Typography variant="h6" style={styles.signupButtonText}>
                    Sign up
                  </Typography>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.notificationButton}
                  onPress={() => {
                    console.log('🔧 User tapped notifications button - setting currentWalletScreen to notifications');
                    setCurrentWalletScreen('notifications');
                  }}
                >
                  <MaterialIcons name="notifications" size={24} color={Colors.gray600} />
                  {/* Small dot for unread notifications */}
                  <View style={styles.notificationDot} />
                </TouchableOpacity>
              )}
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
                  {!previewMode && (hasWallet || hasAptosWallet) && (
                    <TouchableOpacity onPress={() => {
                      forceRefreshBalances(); // Force refresh for manual user action
                    }} disabled={isLoadingWallet}>
                      <MaterialIcons 
                        name="refresh" 
                        size={16} 
                        color={isLoadingWallet ? Colors.gray400 : Colors.primary} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <Typography variant="h1" align="center" style={{ marginVertical: Spacing.sm }}>
                  {previewMode ? '₦0.00' : profileService.formatBalance(totalPortfolioValue)}
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Total USDC Balance
                </Typography>
                
                {/* Show empty state only when no wallet or no balance */}
                {!previewMode && (!(hasWallet || hasAptosWallet) || (totalPortfolioValue === 0 && Object.keys(walletBalance).length === 0)) ? (
                  <View style={{ marginTop: Spacing.lg, alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary" align="center" style={{ marginBottom: Spacing.sm }}>
                      {(hasWallet || hasAptosWallet) ? 'Your wallet is empty' : 'Create a wallet to get started'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" align="center">
                      Add funds to start investing in real estate
                    </Typography>
                  </View>
                ) : null}
              </Card>
            )}

            {/* Quick Actions */}
            <View style={styles.actionButtons}>
              <Button 
                title="Deposit" 
                icon="add" 
                onPress={previewMode ? handleSignupPress : () => {
                  if (simulateError('payment', 'Deposit service temporarily unavailable')) {
                    return;
                  }
                  simulateLoading(setIsLoadingGeneral, 1500, 'Opening deposit...');
                  setTimeout(() => setShowDepositFlow(true), 1500);
                }}
                style={{ flex: 1 }}
                disabled={previewMode}
              />
              <Button 
                title="Send" 
                icon="send" 
                variant="outline"
                onPress={previewMode ? handleSignupPress : () => {
                  simulateLoading(setIsLoadingGeneral, 1000, 'Loading contacts...');
                  setTimeout(() => setShowP2PSend(true), 1000);
                }} 
                style={{ flex: 1 }}
                disabled={previewMode}
              />
              <Button 
                title="Scan" 
                icon="qr-code-scanner" 
                variant="outline"
                onPress={previewMode ? handleSignupPress : () => setShowQRScanner(true)} 
                style={{ flex: 1 }}
                disabled={previewMode}
              />
            </View>


            {/* Portfolio Quick Access */}
            <View style={styles.portfolioSection}>
              <Typography variant="h6" style={{ marginBottom: Spacing.md }}>Portfolio</Typography>
              <View style={styles.portfolioGrid}>
                <TouchableOpacity 
                  style={[styles.portfolioItem, styles.disabledItem]}
                  disabled={true}
                >
                  <MaterialIcons name="toll" size={24} color={Colors.gray400} />
                  <Typography variant="caption" style={[styles.portfolioLabel, { color: Colors.gray400 }]}>Tokens</Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.portfolioItem, styles.disabledItem]}
                  disabled={true}
                >
                  <MaterialIcons name="home" size={24} color={Colors.gray400} />
                  <Typography variant="caption" style={[styles.portfolioLabel, { color: Colors.gray400 }]}>Properties</Typography>
                </TouchableOpacity>
              </View>
            </View>

            {/* Financial Services */}
            <View style={styles.section}>
              <Typography variant="h6" style={{ marginBottom: Spacing.md }}>Financial Services</Typography>
              <View style={styles.servicesGrid}>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="trending-up" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Stake</Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.serviceItem, styles.disabledItem]}
                  disabled={true}
                >
                  <MaterialIcons name="handshake" size={24} color={Colors.gray400} />
                  <Typography variant="caption" style={[styles.serviceLabel, { color: Colors.gray400 }]}>Lending</Typography>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.serviceItem, previewMode && styles.disabledItem]}
                  onPress={previewMode ? handleSignupPress : () => setCurrentWalletScreen('marketplace')}
                  disabled={previewMode}
                >
                  <MaterialIcons name="currency-exchange" size={24} color={previewMode ? Colors.gray400 : Colors.primary} />
                  <Typography variant="caption" style={[styles.serviceLabel, previewMode && { color: Colors.gray400 }]}>FX Market</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="credit-card" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Cards</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="flight" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Flight</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="whatshot" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Fire test</Typography>
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
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="restaurant" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Food</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="favorite" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Charity</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="travel-explore" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Travel</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="hotel" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Hotels</Typography>
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
                <TouchableOpacity
                  style={[
                    styles.serviceItem,
                    previewMode && styles.disabledItem,
                  ]}
                  onPress={() => {
                    if (previewMode) return;
                    setCurrentWalletScreen('news');
                  }}
                  disabled={previewMode}
                >
                  <MaterialIcons
                    name="article"
                    size={24}
                    color={previewMode ? Colors.gray400 : Colors.primary}
                  />
                  <Typography
                    variant="caption"
                    color={previewMode ? 'textSecondary' : 'primary'}
                  >
                    News Hub
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.serviceItem,
                    previewMode && styles.disabledItem,
                  ]}
                  onPress={() => {
                    if (previewMode) return;
                    setShowGameModal(true);
                  }}
                  disabled={previewMode}
                >
                  <MaterialIcons
                    name="sports-esports"
                    size={24}
                    color={previewMode ? Colors.gray400 : Colors.primary}
                  />
                  <Typography
                    variant="caption"
                    color={previewMode ? 'textSecondary' : 'primary'}
                  >
                    Play & Earn
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );
    }
  };

  // Real friends only - no more mock data
  const allContacts = friends;

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
    
    // Create new conversation with proper conversation ID
    // Generate consistent conversation ID by sorting user IDs
    const currentUserId = currentUser?.id || '';
    const otherUserId = contact.id;
    const conversationId = [currentUserId, otherUserId].sort().join('_');
    
    const newConversation = {
      id: conversationId,
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
    // Handle different contact screens
    switch (currentContactScreen) {
      case 'add':
        return (
          <AddContactScreen
            onBack={() => setCurrentContactScreen('main')}
            onUserSelect={(user) => {
              // Navigate to user's profile
              setSelectedContact({
                id: user.id,
                name: user.name,
                avatar: user.avatar
              });
              setShowContactProfile(true);
              setCurrentContactScreen('main');
            }}
            onOpenQRScanner={() => {
              setCurrentContactScreen('main');
              setShowQRScanner(true);
            }}
          />
        );
      
      case 'requests':
        return (
          <FriendRequestsScreen
            onBack={() => setCurrentContactScreen('main')}
            onFriendAdded={(conversationId) => {
              // Navigate to new chat
              setCurrentContactScreen('main');
              setActiveTab('chat');
            }}
          />
        );
      
      default:
        return renderContactMain();
    }
  };

  const renderContactMain = () => {
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
          onPress={() => handleContactPress(contact)}
        >
          <Avatar
            userId={contact.userId || contact.id}
            name={contact.name}
            online={contact.isOnline}
            size="medium"
          />
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
          <View style={styles.headerActions}>
            {(pendingRequests.length > 0 || sentRequests.length > 0) && (
              <TouchableOpacity 
                onPress={() => setCurrentContactScreen('requests')}
                style={styles.requestsButton}
              >
                <MaterialIcons name="notifications" size={20} color={Colors.primary} />
                {pendingRequests.length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Typography variant="caption" style={styles.badgeText}>
                      {pendingRequests.length}
                    </Typography>
                  </View>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => setCurrentContactScreen('add')}
              style={styles.addContactButton}
            >
              <MaterialIcons name="person-add" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
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

        {/* Pending Friend Requests Section */}
        {(pendingRequests.length > 0 || sentRequests.length > 0) && (
          <View style={styles.friendRequestsSection}>
            <View style={styles.pendingRequestsHeader}>
              <Typography variant="h6" style={styles.pendingRequestsTitle}>
                Friend Requests
              </Typography>
              <TouchableOpacity 
                onPress={() => setCurrentContactScreen('requests')}
                style={styles.viewAllRequestsButton}
              >
                <Typography variant="body2" color="primary">
                  View All
                </Typography>
              </TouchableOpacity>
            </View>
            
            {/* Show first 2 pending requests */}
            {pendingRequests.slice(0, 2).map((request, index) => (
              <TouchableOpacity 
                key={request._id} 
                style={styles.friendRequestRow}
                onPress={async () => {
                  // Validate that the request is still pending before opening profile
                  try {
                    const currentRequests = await friendService.getPendingRequests();
                    const stillPending = currentRequests.requests.find(r => r._id === request._id);
                    
                    if (!stillPending) {
                      Alert.alert(
                        'Request Not Found', 
                        'This friend request has already been processed or is no longer available.',
                        [
                          {
                            text: 'OK',
                            onPress: () => loadPendingRequests() // Refresh the list
                          }
                        ]
                      );
                      return;
                    }
                  } catch (error) {
                    console.warn('Could not validate friend request, proceeding anyway:', error);
                  }
                  
                  // Navigate to the sender's profile with friend request context
                  setSelectedContact({
                    id: request.sender._id,
                    name: request.sender.name,
                    avatar: undefined,
                    friendRequestId: request._id,
                    isFriendRequest: true
                  });
                  setShowContactProfile(true);
                }}
              >
                <View style={styles.friendRequestAvatar}>
                  <Typography variant="h6" style={styles.avatarText}>
                    {request.sender.name.charAt(0).toUpperCase()}
                  </Typography>
                </View>
                <View style={styles.friendRequestInfo}>
                  <View style={styles.contactNameRow}>
                    <Typography variant="h6" style={styles.contactName}>
                      {request.sender.name}
                    </Typography>
                    <View style={styles.pendingIndicator}>
                      <Typography variant="caption" style={styles.pendingIndicatorText}>
                        Pending
                      </Typography>
                    </View>
                  </View>
                  <Typography variant="body2" color="textSecondary" style={styles.contactRole}>
                    Wants to connect
                  </Typography>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Show first 2 sent requests */}
            {sentRequests.slice(0, 2).map((request, index) => (
              <View key={request._id} style={styles.friendRequestRow}>
                <View style={styles.friendRequestAvatar}>
                  <Typography variant="h6" style={styles.avatarText}>
                    {request.recipient.name.charAt(0).toUpperCase()}
                  </Typography>
                </View>
                <View style={styles.friendRequestInfo}>
                  <View style={styles.contactNameRow}>
                    <Typography variant="h6" style={styles.contactName}>
                      {request.recipient.name}
                    </Typography>
                    <View style={styles.sentIndicator}>
                      <Typography variant="caption" style={styles.sentIndicatorText}>
                        Request Sent
                      </Typography>
                    </View>
                  </View>
                  <Typography variant="body2" color="textSecondary" style={styles.contactRole}>
                    Pending response
                  </Typography>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Device Contacts Section */}
        {!deviceContactsPermissionGranted && (
          <Card style={styles.deviceContactsPrompt}>
            <View style={styles.deviceContactsHeader}>
              <MaterialIcons name="contacts" size={24} color={Colors.primary} />
              <Typography variant="h6" style={styles.deviceContactsTitle}>
                Find Friends on Ilé
              </Typography>
            </View>
            <Typography variant="body2" color="textSecondary" style={styles.deviceContactsDescription}>
              Sync your contacts to see which friends are already on Ilé and invite others.
            </Typography>
            <Button
              title="Sync Contacts"
              onPress={handleContactsPermissionRequest}
              loading={isLoadingDeviceContacts}
              style={styles.syncContactsButton}
            />
          </Card>
        )}

        {/* Device Contacts Results */}
        {deviceContactsResult && (
          <>
            {/* On Ilé Section */}
            {deviceContactsResult.onIle.length > 0 && (
              <View style={styles.deviceContactsSection}>
                <View style={styles.sectionHeader}>
                  <Typography variant="h6" style={styles.sectionTitle}>
                    On Ilé ({deviceContactsResult.onIle.length})
                  </Typography>
                  <MaterialIcons name="verified" size={20} color={Colors.success} />
                </View>
                {deviceContactsResult.onIle.slice(0, 3).map((contact) => (
                  <TouchableOpacity
                    key={contact.userId}
                    style={styles.deviceContactItem}
                    onPress={() => {
                      // Navigate to user profile or start chat
                      console.log('View profile:', contact.userId);
                    }}
                  >
                    <View style={styles.contactAvatar}>
                      <Typography variant="h6" style={styles.avatarText}>
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </Typography>
                    </View>
                    <View style={styles.contactInfo}>
                      <Typography variant="h6">{contact.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {contact.username ? `@${contact.username}` : 'On Ilé'}
                      </Typography>
                    </View>
                    {contact.trustBadge && (
                      <MaterialIcons name="verified" size={16} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                {deviceContactsResult.onIle.length > 3 && (
                  <TouchableOpacity style={styles.showMoreButton}>
                    <Typography variant="body2" color="primary">
                      Show {deviceContactsResult.onIle.length - 3} more
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Invite Friends Section */}
            {deviceContactsResult.toInvite.length > 0 && (
              <View style={styles.deviceContactsSection}>
                <View style={styles.sectionHeader}>
                  <Typography variant="h6" style={styles.sectionTitle}>
                    Invite to Ilé ({deviceContactsResult.toInvite.length})
                  </Typography>
                  <MaterialIcons name="person-add" size={20} color={Colors.secondary} />
                </View>
                {deviceContactsResult.toInvite.slice(0, 3).map((contact) => (
                  <View key={contact.id} style={styles.deviceContactItem}>
                    <View style={styles.contactAvatar}>
                      <Typography variant="h6" style={styles.avatarText}>
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </Typography>
                    </View>
                    <View style={styles.contactInfo}>
                      <Typography variant="h6">{contact.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {contact.phoneNumbers?.[0] || 'Phone contact'}
                      </Typography>
                    </View>
                    <Button
                      title="Invite"
                      variant="outline"
                      size="sm"
                      onPress={() => handleInviteContact(contact)}
                      style={styles.inviteButton}
                    />
                  </View>
                ))}
                {deviceContactsResult.toInvite.length > 3 && (
                  <TouchableOpacity style={styles.showMoreButton}>
                    <Typography variant="body2" color="primary">
                      Show {deviceContactsResult.toInvite.length - 3} more
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {[
            { key: 'all', label: 'All', count: allContacts.length },
            { key: 'friends', label: 'Friends', count: allContacts.filter(c => c.category === 'friends').length },
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



  const [lastScannedData, setLastScannedData] = useState<string | null>(null);
  const [lastScannedTime, setLastScannedTime] = useState<number>(0);

  const handlePaymentRequestLink = useCallback(async (requestId: string) => {
    if (!requestId) {
      return;
    }

    if (isFetchingPaymentRequest) {
      console.log('🔗 Payment request fetch already in progress');
      return;
    }

    if (pendingPaymentRequest?.id === requestId && showP2PSend) {
      console.log('🔗 Payment request already open:', requestId);
      return;
    }

    console.log('🔗 Fetching payment request:', requestId);
    setIsFetchingPaymentRequest(true);
    try {
      const response = await paymentRequestService.getRequest(requestId);

      if (!response.success || !response.data?.request) {
        Alert.alert('Payment Request', response.error || 'Unable to open this payment request.');
        return;
      }

      const request = response.data.request;

      if (request.status && request.status !== 'pending') {
        Alert.alert('Payment Request', `This payment request is already ${request.status}.`);
        return;
      }

      const hasRequiredWallet = (() => {
        if (!request.creatorProfile) return false;
        if (request.network === 'hedera') {
          return !!request.creatorProfile.hederaAccountId;
        }
        const lowerWallets = request.creatorProfile.wallets || [];
        const baseMatch = lowerWallets.find((wallet) => wallet.chain?.toLowerCase().includes('base'));
        return !!request.creatorProfile.baseWalletAddress || !!baseMatch;
      })();

      if (!hasRequiredWallet) {
        Alert.alert(
          'Payment Request',
          'The sender has not configured a wallet for this network yet. You can still view the request details.'
        );
      }

      setPendingPaymentRequest(request);
      setShowP2PSend(true);
      setActiveTab('wallet');
    } catch (error) {
      console.error('Failed to load payment request:', error);
      Alert.alert('Payment Request', 'Unable to open this payment request. Please try again later.');
    } finally {
      setIsFetchingPaymentRequest(false);
    }
  }, [isFetchingPaymentRequest, pendingPaymentRequest?.id, showP2PSend]);

  const handleIncomingUrl = useCallback((incomingUrl: string | null) => {
    if (!incomingUrl) {
      return;
    }

    console.log('🔗 Received deep link:', incomingUrl);

    const requestMatch = incomingUrl.match(/ilepay:\/\/(?:app\/)?request\/(.+?)(?:[?/].*)?$/i);
    if (requestMatch && requestMatch[1]) {
      handlePaymentRequestLink(requestMatch[1]);
      return;
    }
  }, [handlePaymentRequestLink]);

  useEffect(() => {
    const urlSubscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url);
    });

    Linking.getInitialURL()
      .then(handleIncomingUrl)
      .catch((error) => {
        console.error('Failed to fetch initial URL:', error);
      });

    return () => {
      urlSubscription.remove();
    };
  }, [handleIncomingUrl]);

  const handleQRCodeScanned = async (data: string) => {
    const currentTime = Date.now();
    
    // Prevent duplicate scans within 2 seconds
    if (lastScannedData === data && currentTime - lastScannedTime < 2000) {
      console.log('Duplicate QR scan ignored:', data);
      return;
    }
    
    setLastScannedData(data);
    setLastScannedTime(currentTime);
    setShowQRScanner(false); // Close scanner immediately
    
    console.log('QR Code scanned:', data);
    
    // Handle different QR code types
    if (data.startsWith('wallet:')) {
      // Navigate to wallet with address
      setActiveTab('wallet');
    } else if (data.startsWith('payment:')) {
      // Parse and initiate payment
      setShowP2PSend(true);
    } else if (data.startsWith('contact:')) {
      // Parse contact QR code and send friend request
      try {
        const contactInfo = friendService.parseContactQRData(data);
        
        if (contactInfo && contactInfo.userId !== currentUser?.id) {
          Alert.alert(
            'Add Contact',
            `Send friend request to ${contactInfo.userName}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Send Request',
                onPress: async () => {
                  const result = await friendService.sendFriendRequest(
                    contactInfo.userId,
                    `Hi ${contactInfo.userName}! I'd like to connect with you on ilePay.`
                  );
                  
                  if (result.success) {
                    Alert.alert('Success', 'Friend request sent!');
                  } else {
                    Alert.alert('Error', result.message);
                  }
                }
              }
            ]
          );
        } else if (contactInfo?.userId === currentUser?.id) {
          Alert.alert('Info', "You can't add yourself as a contact!");
        } else {
          Alert.alert('Error', 'Invalid contact QR code');
        }
      } catch (error) {
        console.error('Error processing contact QR:', error);
        Alert.alert('Error', 'Failed to process contact QR code');
      }
      
      setActiveTab('contact');
    } else if (data.startsWith('ilepay://')) {
      // Handle ilePay deep links
      if (data.includes('/contact/') || data.includes('/profile/')) {
        // Parse the ilepay:// URL to extract user info
        try {
          // Extract user ID and name from URL like "ilepay://profile/68d29ddb1658e154861934f7:Notaword113"
          const urlParts = data.replace('ilepay://', '').split('/');
          if (urlParts.length >= 2) {
            const userPart = urlParts[1]; // "68d29ddb1658e154861934f7:Notaword113"
            const [userId, userName] = userPart.split(':');
            
            if (userId && userName && userId !== currentUser?.id) {
              // Navigate directly to the user's profile
              setSelectedContact({
                id: userId,
                name: userName,
                avatar: undefined
              });
              setShowContactProfile(true);
            } else if (userId === currentUser?.id) {
              Alert.alert('Info', "This is your own QR code!");
              setActiveTab('me'); // Navigate to their own profile
            } else {
              Alert.alert('Error', 'Invalid QR code format');
            }
          } else {
            Alert.alert('Error', 'Invalid QR code format');
          }
        } catch (error) {
          console.error('Error processing ilepay QR:', error);
          Alert.alert('Error', 'Failed to process QR code');
        }
      } else if (data.includes('/pay/')) {
        setShowP2PSend(true);
      } else if (data.includes('/request/')) {
        const requestSegment = data.replace('ilepay://', '').split('/request/')[1];
        const requestId = requestSegment ? requestSegment.split(/[?#]/)[0] : null;

        if (requestId) {
          handlePaymentRequestLink(requestId);
        } else {
          Alert.alert('Payment Request', 'Invalid payment request link.');
        }
      }
    } else {
      // Default action - could be a wallet address
      setActiveTab('wallet');
    }
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
            onBlockedUsers={() => setCurrentMeScreen('blockedUsers')}
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
      
      case 'blockedUsers':
        return (
          <BlockedUsersScreen
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
        // Debug current user data
        console.log('🔍 QR Code Screen - Current User:', currentUser);
        
        return (
          <QRCodeScreen
            onBack={() => setCurrentMeScreen('main')}
            userName={currentUser?.name || 'User'}
            userId={currentUser?.id || currentUser?._id || ''}
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
              createdAt={currentUser?.createdAt}
              bricksCount={currentUser?.bricks || 0}
              trustBadge="verified"
              trustLevel={4}
              showQRIcon={true}
              onQRPress={() => setCurrentMeScreen('qrCode')}
              style={{ marginTop: -5 }}
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

              {/* Debug Panel - Only show in development */}
              {/* {__DEV__ && (
                <TouchableOpacity onPress={() => setShowDebugPanel(true)}>
                  <View style={[styles.menuItem, styles.menuItemSpacing]}>
                    <MaterialIcons name="bug-report" size={24} color={Colors.warning} />
                    <Typography variant="h6" style={{ marginLeft: Spacing.md }}>Group Chat Debug</Typography>
                    <View style={styles.debugBadge}>
                      <Typography variant="caption" style={styles.debugBadgeText}>DEV</Typography>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} style={{ marginLeft: Spacing.sm }} />
                  </View>
                </TouchableOpacity>
              )} */}
            </View>
          </ScrollView>
        );
    }
  };

  const renderChat = () => {
    if (conversationsLoading) {
      return (
        <View style={styles.chatContainer}>
          <View style={styles.loadingContainer}>
            <Typography variant="body2" color="textSecondary">Loading conversations...</Typography>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.chatContainer}>
        <ConversationList 
          conversations={conversations}
          onConversationPress={(conversation) => {
            console.log('💬 User selected conversation:', {
              id: conversation.id,
              name: conversation.name,
              isGroup: conversation.isGroup,
              lastMessage: conversation.lastMessage
            });
            setSelectedChat(conversation);
          }}
          onAvatarPress={async (conversation) => {
            console.log('👤 User clicked avatar for conversation:', conversation.name);
            
            // For group chats, we don't show individual profiles
            if (conversation.isGroup) {
              console.log('Group chat avatar clicked - no profile to show');
              return;
            }
            
            try {
              setIsLoadingGeneral(true);
              
              // Extract the other user's ID from the conversation ID
              // Conversation ID format: "userId1_userId2"
              const participantIds = conversation.id.includes('_') ? conversation.id.split('_') : [conversation.id];
              const currentUserId = currentUser?.id || '';
              const otherUserId = participantIds.find(id => id !== currentUserId);
              
              if (!otherUserId) {
                console.error('Unable to identify other user from conversation ID:', conversation.id);
                return;
              }
              
              console.log('👤 Getting profile for user ID:', otherUserId);
              
              // Get user profile using the correct Firebase UID
              const userProfileResult = await profileService.getUserProfile(otherUserId);
              
              if (userProfileResult.success && userProfileResult.profile) {
                setSelectedContact({
                  name: userProfileResult.profile.name,
                  id: userProfileResult.profile.id,
                  avatar: userProfileResult.profile.avatar
                });
                setShowContactProfile(true);
              } else {
                console.log('No profile found for user ID:', otherUserId);
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
            } finally {
              setIsLoadingGeneral(false);
            }
          }}
          onPin={(conversationId) => {
            console.log('Pin conversation:', conversationId);
            // Update conversation pin status
          }}
          onHide={(conversationId) => {
            // TODO: Implement hide feature later
            // console.log('Hide conversation:', conversationId);
            // Hide conversation
          }}
          onDelete={(conversationId) => {
            Alert.alert(
              "Delete Conversation",
              "Are you sure you want to delete this conversation? This action cannot be undone.",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      setIsLoadingGeneral(true);
                      await chatService.deleteConversation(conversationId);
                      // Remove the conversation from the local state
                      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
                      Toast.show({
                        type: 'success',
                        text1: 'Conversation deleted successfully',
                        position: 'bottom'
                      });
                    } catch (error) {
                      console.error('Failed to delete conversation:', error);
                      Toast.show({
                        type: 'error',
                        text1: 'Failed to delete conversation',
                        text2: 'Please try again later',
                        position: 'bottom'
                      });
                    } finally {
                      setIsLoadingGeneral(false);
                    }
                  }
                }
              ]
            );
          }}
          onCreateGroup={() => setShowCreateGroup(true)}
          onAddContact={() => {
            // Navigate to the add contact screen
            setActiveTab('contact');
            setCurrentContactScreen('add');
          }}
          userBricksCount={0}
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

  const renderContent = () => {
    // If a chat is selected, render it regardless of active tab
    if (selectedChat) {
      console.log('🔄 Rendering chat screen for:', {
        chatId: selectedChat.id,
        chatName: selectedChat.name,
        isGroup: selectedChat.isGroup,
        hasAvatar: !!selectedChat.avatar
      });
      
      return (
        <ChatScreen
          chatId={selectedChat.id}
          chatName={selectedChat.name}
          chatAvatar={selectedChat.avatar}
          isOnline={selectedChat.isOnline}
          isGroup={selectedChat.isGroup}
          onBack={() => {
            console.log('🔙 User navigating back from chat:', selectedChat.name);
            setSelectedChat(null);
          }}
          onInfo={() => {
            console.log('ℹ️ Show chat info requested for:', selectedChat.name);
          }}
          onNavigateToMoments={() => {
            console.log('📸 Navigate to moments from chat:', selectedChat.name);
            setSelectedChat(null);
            setActiveTab('moments');
          }}
          // onStartVideoCall={handleStartVideoCall}
          // onStartVoiceCall={handleStartVoiceCall}
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
          friendRequestId={selectedContact.friendRequestId}
          isFriendRequest={selectedContact.isFriendRequest}
          onFriendRequestResponse={handleProfileFriendRequestResponse}
        />
      );
    }
    
    switch (activeTab) {
      case 'chat': return renderChat();
      case 'contact': return renderContact();
      case 'wallet': return renderWallet();
      case 'moments': return (
        <MomentsContainer
          isActive={activeTab === 'moments'}
          isAuthenticated={isAuthenticated}
          isCheckingAuth={isCheckingAuth}
          currentUser={currentUser}
          onSetGeneralLoading={(message) => {
            setIsLoadingGeneral(true);
            setGeneralLoadingMessage(message);
          }}
          onClearGeneralLoading={() => setIsLoadingGeneral(false)}
        />
      );
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
        <Toast />
      </SafeAreaProvider>
    );
  }

  // Show wallet preview if not authenticated
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
              {/* Render wallet in preview mode */}
              {renderWallet(true)}
              
              {/* Onboarding Modal */}
              <OnboardingModal
                visible={showOnboardingModal}
                onClose={() => setShowOnboardingModal(false)}
                onSignup={handleOnboardingSignup}
                onLogin={handleOnboardingLogin}
                onAppleSignup={() => {
                  // Apple sign-in logic would go here
                  console.log('Apple sign-in pressed');
                  handleOnboardingSignup();
                }}
                onGoogleSignup={() => {
                  // Google sign-in logic would go here
                  console.log('Google sign-in pressed');
                }}
              />
              
              {/* Login Modal (slide-in) */}
              <LoginScreen 
                visible={showLoginModal}
                onClose={() => {
                  setShowLoginModal(false);
                  setLoginInitialStep('email');
                }}
                onLoginSuccess={handleLoginSuccess}
                initialEmail={loginInitialEmail}
                initialStep={loginInitialStep}
              />
            </SafeAreaView>
          </SafeAreaProvider>
        </NotificationProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
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

        {/* Main Navigation */}
        <MainNavigation
          activeTab={activeTab}
          onTabSwitch={handleTabSwitch}
          isVisible={isMainNavVisible}
        />

        <StatusBar style="auto" />

        {/* Background Balance Manager */}
        <WalletBalanceManager
          onBalanceUpdate={handleBalanceUpdate}
          autoRefresh={isAuthenticated}
          refreshInterval={60000}
        >
          {(balanceData, refreshBalance, forceRefresh) => {
            // Expose refresh functions via ref
            React.useImperativeHandle(walletBalanceManagerRef, () => ({
              refreshBalance,
              forceRefresh
            }), [refreshBalance, forceRefresh]);
            
            return null; // This component runs in background
          }}
        </WalletBalanceManager>

        {/* P2P Send Flow Modal */}
        <P2PSendFlow
          visible={showP2PSend}
          onClose={() => {
            setShowP2PSend(false);
            setPendingPaymentRequest(null);
          }}
          initialRecipient={selectedContact ? {
            id: selectedContact.id,
            name: selectedContact.name,
            avatar: selectedContact.avatar,
          } : undefined}
          currentUser={currentUser}
          requestContext={pendingPaymentRequest}
          onPaymentRequestCompleted={(updatedRequest) => {
            setPendingPaymentRequest(updatedRequest);
          }}
          onSendComplete={(amount, token, recipient) => {
            console.log('P2P Send completed:', { amount, token, recipient });
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
          onGroupCreated={async (group) => {
            try {
              console.log('🔄 Creating group:', group);

              // Validate group data before proceeding
              if (handleValidationErrors(group, currentUser?.id)) {
                return; // Validation errors will be displayed by the error handler
              }

              setGeneralLoadingMessage('Creating group...');
              setIsLoadingGeneral(true);

              // Get current user
              const currentUserSession = await authService.getSession();
              if (!currentUserSession.success || !currentUserSession.user) {
                throw new Error('User not authenticated');
              }

              // Prepare participants array (current user + selected members)
              const participantIds = [
                currentUserSession.user.id,
                ...group.members.map(member => member.id)
              ];

              console.log('👥 Group participants:', participantIds);
              console.log('🏷️ Group details:', {
                name: group.name,
                description: group.description,
                privacy: group.privacy,
                hasAvatar: !!group.avatar
              });

              // Create group conversation in Firebase
              const groupId = await chatService.createConversation(
                participantIds,
                true, // isGroup
                group.name,
                group.description,
                group.avatar // Pass the avatar to Firebase
              );

              console.log('✅ Group created successfully with ID:', groupId);

              // Send initial group welcome message
              try {
                await chatService.sendMessage(
                  groupId,
                  `Welcome to ${group.name}! 👋`,
                  {
                    _id: currentUserSession.user.id,
                    name: currentUserSession.user.name || 'Admin',
                    avatar: currentUserSession.user.avatar || undefined,
                  },
                  undefined, // no specific recipient for group messages
                  'text'
                );
                console.log('✅ Welcome message sent to group');
              } catch (welcomeError) {
                console.warn('⚠️ Failed to send welcome message:', welcomeError);
                // Don't fail the entire group creation for this
              }

              // Create new conversation object for local state
              const newConversation = {
                id: groupId,
                name: group.name,
                lastMessage: `Welcome to ${group.name}! 👋`,
                timestamp: new Date(),
                unreadCount: 0,
                isGroup: true,
                avatar: group.avatar, // Use the group avatar
                isOnline: false,
                isPinned: false,
              };

              // Add to conversations list immediately for better UX
              console.log('🔄 Adding new group to conversations list:', {
                groupId,
                groupName: group.name,
                participantCount: participantIds.length,
                currentConversationsCount: conversations.length
              });
              
              setConversations(prev => {
                const updated = [newConversation, ...prev];
                console.log('✅ Conversations list updated:', {
                  previousCount: prev.length,
                  newCount: updated.length,
                  newGroupAtTop: updated[0]?.name === group.name
                });
                return updated;
              });

              // Close modal and navigate to the new group
              console.log('🔄 Navigating to new group chat...');
              setShowCreateGroup(false);
              setSelectedChat(newConversation);
              console.log('✅ Navigation completed - user should now see group chat');

              console.log('✅ Group creation completed successfully');
              debugGroupAction(currentUserSession.user.id, 'GROUP_CREATION_SUCCESS', true, {
                groupId,
                groupName: group.name,
                memberCount: participantIds.length
              });
            } catch (error) {
              console.error('❌ Failed to create group:', error);
              
              // Use enhanced error handling
              handleGroupCreationError(error, currentUser?.id, group);
              
              debugGroupAction(
                currentUser?.id || 'unknown',
                'GROUP_CREATION_FAILED',
                false,
                group,
                error
              );
            } finally {
              setIsLoadingGeneral(false);
            }
          }}
          contacts={friends.map((friend: any) => ({
            id: friend.id,
            name: friend.name,
            avatar: friend.imageUrl,
            isOnline: friend.isOnline,
            lastSeen: friend.lastSeen,
          }))}
        />

        {/* Group Creation Error Handler */}
        <GroupCreationErrorHandler
          visible={showGroupCreationError}
          error={groupCreationError}
          onClose={clearGroupCreationError}
          onRetryGroupCreation={async () => {
            // Re-open the create group modal for retry
            clearGroupCreationError();
            setShowCreateGroup(true);
          }}
          userId={currentUser?.id}
          groupData={groupCreationError?.context?.groupData}
        />

        {/* Group Chat Debug Panel */}
        {__DEV__ && (
          <GroupChatDebugPanel
            visible={showDebugPanel}
            onClose={() => setShowDebugPanel(false)}
            currentUser={currentUser}
          />
        )}


        {/* QR Scanner Modal */}
        <QRScannerModal
          isVisible={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onQRCodeScanned={handleQRCodeScanned}
          title="Scan QR Code"
          description="Scan any QR code for payments, contacts, or other actions"
        />

        {/* Game Modal */}
        <GameModal
          visible={showGameModal}
          onClose={() => setShowGameModal(false)}
          gameUrl={`${API_BASE_URL}/public/game/`}
          gameTitle="Ile Match Game"
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

        {/* Video Call Screen - temporarily disabled */}
        {/* {isInCall && callData && (
          <VideoCallScreen
            contactName={callData.contactName}
            contactAvatar={callData.contactAvatar}
            isVideo={callData.isVideo}
            onEndCall={endCall}
          />
        )} */}

      </SafeAreaView>
    </SafeAreaProvider>
    </ErrorBoundary>
  </NotificationProvider>
  </QueryClientProvider>
  );
}

// Export the main App component with providers
export default function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
