import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
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

type TabName = 'chat' | 'contact' | 'wallet' | 'moments' | 'me';
type MeScreen = 'main' | 'profile' | 'settings' | 'invite' | 'setPin' | 'changePassword' | 'walletSettings' | 'privacySettings' | 'sendFeedback' | 'about' | 'qrCode';
type WalletScreen = 'main' | 'tokens' | 'properties' | 'lending' | 'marketplace';
type FXScreen = 'marketplace' | 'offer_detail' | 'trade_room';

interface UserData {
  id: string;
  email: string;
  name: string;
  isNewUser: boolean;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('wallet');
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [currentMeScreen, setCurrentMeScreen] = useState<MeScreen>('main');
  const [currentWalletScreen, setCurrentWalletScreen] = useState<WalletScreen>('main');
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{name: string; avatar?: string; id: string} | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const [showP2PSend, setShowP2PSend] = useState(false);
  const [showLoanRequest, setShowLoanRequest] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [currentFXScreen, setCurrentFXScreen] = useState<FXScreen>('marketplace');
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [currentTrade, setCurrentTrade] = useState<any>(null);
  const [showCreateFXOffer, setShowCreateFXOffer] = useState(false);
  const [showDepositFlow, setShowDepositFlow] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleLoginSuccess = (userData: UserData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    console.log('User logged in:', userData);
  };

  // Sample chat data
  const conversations: Conversation[] = [
    {
      id: '1',
      name: 'Property Agent Sarah',
      lastMessage: 'The new downtown property listing is available now!',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      unreadCount: 2,
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      isOnline: true,
      isPinned: true,
      bricksCount: 1250,
      trustBadge: 'verified',
    },
    {
      id: '2', 
      name: 'Investment Group',
      lastMessage: 'Monthly returns are looking great this quarter',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unreadCount: 0,
      isOnline: false,
      isGroup: true,
      isPinned: false,
      bricksCount: 3400,
      trustBadge: 'premium',
    },
    {
      id: '3',
      name: 'John Martinez',
      lastMessage: 'Thanks for the property recommendation!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      unreadCount: 0,
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      isOnline: false,
      isPinned: false,
      bricksCount: 890,
      trustBadge: null,
    },
    {
      id: '4',
      name: 'Real Estate Expert',
      lastMessage: 'Market analysis report is ready for review',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      unreadCount: 1,
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      isOnline: true,
      isPinned: true,
      bricksCount: 5600,
      trustBadge: 'agent',
    },
    {
      id: '5',
      name: 'Emma Thompson',
      lastMessage: 'Looking forward to the property tour tomorrow',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      unreadCount: 0,
      isOnline: false,
      isPinned: false,
      bricksCount: 425,
      trustBadge: null,
    },
  ];

  const renderWallet = () => {
    // Handle sub-screens
    switch (currentWalletScreen) {
      case 'tokens':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setCurrentWalletScreen('main')} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
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
          </ScrollView>
        );

      case 'properties':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setCurrentWalletScreen('main')} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Typography variant="h3">Property Investments</Typography>
              <View style={styles.headerSpacer} />
            </View>
            
            <View style={styles.emptyState}>
              <MaterialIcons name="home" size={48} color={Colors.gray400} />
              <Typography variant="body1" color="textSecondary" align="center" style={{ marginTop: Spacing.md }}>
                No properties yet
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center" style={{ marginTop: Spacing.xs }}>
                Start investing in real estate
              </Typography>
            </View>
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
                  onStartTrade={(amount) => {
                    // Create mock trade
                    const mockTrade = {
                      id: 'trade_' + Math.random().toString(36).substr(2, 9),
                      offerId: selectedOffer.id,
                      maker: selectedOffer.maker,
                      taker: {
                        id: 'current_user',
                        name: 'You',
                        trustScore: 85,
                      },
                      sellCurrency: selectedOffer.sellCurrency,
                      buyCurrency: selectedOffer.buyCurrency,
                      sellAmount: amount,
                      buyAmount: Math.round(amount * selectedOffer.exchangeRate),
                      exchangeRate: selectedOffer.exchangeRate,
                      paymentMethod: selectedOffer.paymentMethods[0],
                      escrowAmount: amount * 1.1, // 110% of trade amount
                      escrowCurrency: 'USDC',
                      status: 'payment_pending',
                      createdAt: new Date(),
                      quoteLockExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min
                      paymentWindow: {
                        start: new Date(),
                        end: new Date(Date.now() + selectedOffer.paymentWindow * 60 * 1000),
                      },
                      chatRoomId: 'chat_' + Math.random().toString(36).substr(2, 9),
                    };
                    setCurrentTrade(mockTrade);
                    setCurrentFXScreen('trade_room');
                  }}
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
                  onUploadPaymentProof={(file) => {
                    console.log('Payment proof uploaded:', file);
                  }}
                  onConfirmPayment={() => {
                    console.log('Payment confirmed');
                    setCurrentTrade({...currentTrade, status: 'payment_confirmed'});
                  }}
                  onSignRelease={() => {
                    console.log('Funds released');
                    setCurrentTrade({...currentTrade, status: 'completed'});
                  }}
                  onOpenDispute={(reason) => {
                    console.log('Dispute opened:', reason);
                    setCurrentTrade({...currentTrade, status: 'disputed'});
                  }}
                  onCompleteRating={(rating, review) => {
                    console.log('Rating completed:', rating, review);
                  }}
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

      default:
        // Main wallet screen
        return (
          <ScrollView style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Typography variant="h3">My Wallet</Typography>
                <Typography variant="body1" color="textSecondary">Financial hub & services</Typography>
              </View>
              <TouchableOpacity style={styles.avatar}>
                <MaterialIcons name="account-balance-wallet" size={24} color={Colors.gray600} />
              </TouchableOpacity>
            </View>

            {/* Balance Card */}
            <Card style={styles.balanceCard}>
              <Typography variant="caption" color="textSecondary" align="center">Total Portfolio</Typography>
              <Typography variant="h1" align="center" style={{ marginVertical: Spacing.sm }}>$0.00</Typography>
              <Typography variant="body2" color="textSecondary" align="center">≈ 0.00 ETH</Typography>
            </Card>

            {/* Quick Actions */}
            <View style={styles.actionButtons}>
              <Button 
                title="Deposit" 
                icon="add" 
                onPress={() => setShowDepositFlow(true)} 
                style={{ flex: 1 }}
              />
              <Button 
                title="Send" 
                icon="send" 
                variant="outline"
                onPress={() => setShowP2PSend(true)} 
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
                  onPress={() => setCurrentWalletScreen('properties')}
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
                <TouchableOpacity style={styles.serviceItem} disabled>
                  <MaterialIcons name="credit-card" size={24} color={Colors.gray400} />
                  <Typography variant="caption" color="textSecondary">Cards</Typography>
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

  const renderContact = () => (
    <ScrollView style={styles.content}>
      <View style={styles.header}>
        <Typography variant="h2">Contacts</Typography>
      </View>
      
      <View style={styles.section}>
        <Typography variant="h5" style={{ marginBottom: Spacing.md }}>Property Agents</Typography>
        
        <View style={styles.contactRow}>
          <TouchableOpacity 
            style={styles.contactAvatar}
            onPress={() => {
              setSelectedContact({
                name: 'Sarah Anderson',
                id: 'sarah_anderson'
              });
              setShowContactProfile(true);
            }}
          >
            <Typography variant="h6">SA</Typography>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactInfo}
            onPress={() => {
              setSelectedContact({
                name: 'Sarah Anderson',
                id: 'sarah_anderson'
              });
              setShowContactProfile(true);
            }}
          >
            <Typography variant="h6">Sarah Anderson</Typography>
            <Typography variant="body2" color="textSecondary">Senior Property Agent</Typography>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setActiveTab('chat');
            const sarahConversation = conversations.find(c => c.name === 'Property Agent Sarah');
            if (sarahConversation) {
              setSelectedChat(sarahConversation);
            }
          }}>
            <MaterialIcons name="message" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.contactRow}>
          <View style={styles.contactAvatar}>
            <Typography variant="h6">MR</Typography>
          </View>
          <TouchableOpacity 
            style={styles.contactInfo}
            onPress={() => {
              setSelectedContact({
                name: 'Michael Roberts',
                id: 'michael_roberts'
              });
              setShowContactProfile(true);
            }}
          >
            <Typography variant="h6">Michael Roberts</Typography>
            <Typography variant="body2" color="textSecondary">Luxury Property Specialist</Typography>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setActiveTab('chat');
            // Create a new conversation for Michael Roberts since he's not in the main conversations
            const michaelConversation = {
              id: 'michael_roberts',
              name: 'Michael Roberts',
              lastMessage: 'Hello! How can I help you with luxury properties?',
              timestamp: new Date(),
              unreadCount: 0,
              avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
              isOnline: true,
              isPinned: false,
              bricksCount: 2100,
              trustBadge: 'premium' as const,
            };
            setSelectedChat(michaelConversation);
          }}>
            <MaterialIcons name="message" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.contactRow}>
          <View style={styles.contactAvatar}>
            <Typography variant="h6">LJ</Typography>
          </View>
          <TouchableOpacity 
            style={styles.contactInfo}
            onPress={() => {
              setSelectedContact({
                name: 'Lisa Johnson',
                id: 'lisa_johnson'
              });
              setShowContactProfile(true);
            }}
          >
            <Typography variant="h6">Lisa Johnson</Typography>
            <Typography variant="body2" color="textSecondary">Commercial Real Estate</Typography>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setActiveTab('chat');
            // Create a new conversation for Lisa Johnson
            const lisaConversation = {
              id: 'lisa_johnson',
              name: 'Lisa Johnson',
              lastMessage: 'Hi! I specialize in commercial real estate investments.',
              timestamp: new Date(),
              unreadCount: 0,
              avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
              isOnline: false,
              isPinned: false,
              bricksCount: 3200,
              trustBadge: 'agent' as const,
            };
            setSelectedChat(lisaConversation);
          }}>
            <MaterialIcons name="message" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Typography variant="h5" style={{ marginBottom: Spacing.md }}>Investment Groups</Typography>
        
        <View style={styles.contactRow}>
          <View style={styles.contactAvatar}>
            <Typography variant="h6">REI</Typography>
          </View>
          <View style={styles.contactInfo}>
            <Typography variant="h6">Real Estate Investors</Typography>
            <Typography variant="body2" color="textSecondary">42 members</Typography>
          </View>
          <TouchableOpacity>
            <MaterialIcons name="group" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.contactRow}>
          <View style={styles.contactAvatar}>
            <Typography variant="h6">LPC</Typography>
          </View>
          <View style={styles.contactInfo}>
            <Typography variant="h6">Lagos Property Club</Typography>
            <Typography variant="body2" color="textSecondary">128 members</Typography>
          </View>
          <TouchableOpacity>
            <MaterialIcons name="group" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Typography variant="h5" style={{ marginBottom: Spacing.md }}>Recent Connections</Typography>
        
        <View style={styles.contactRow}>
          <View style={styles.contactAvatar}>
            <Typography variant="h6">AD</Typography>
          </View>
          <View style={styles.contactInfo}>
            <Typography variant="h6">Alex Davis</Typography>
            <Typography variant="body2" color="textSecondary">Property Investor</Typography>
          </View>
          <TouchableOpacity onPress={() => setActiveTab('chat')}>
            <MaterialIcons name="message" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.contactRow}>
          <View style={styles.contactAvatar}>
            <Typography variant="h6">NK</Typography>
          </View>
          <View style={styles.contactInfo}>
            <Typography variant="h6">Nina Kumar</Typography>
            <Typography variant="body2" color="textSecondary">Real Estate Analyst</Typography>
          </View>
          <TouchableOpacity onPress={() => setActiveTab('chat')}>
            <MaterialIcons name="message" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.contactRow}>
          <View style={styles.contactAvatar}>
            <Typography variant="h6">TO</Typography>
          </View>
          <View style={styles.contactInfo}>
            <Typography variant="h6">Tom Okafor</Typography>
            <Typography variant="body2" color="textSecondary">Property Developer</Typography>
          </View>
          <TouchableOpacity onPress={() => setActiveTab('chat')}>
            <MaterialIcons name="message" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );


  const renderMoments = () => {
    const mockMoments = [
      {
        id: '1',
        userName: 'John Doe',
        userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        postTime: '2 hours ago',
        content: 'Just completed my first investment in Lagos Premium Apartments! Excited about the tokenized real estate opportunity 🏢💰',
        image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
        likes: 24,
        isLiked: false,
        isOwn: true,
      },
      {
        id: '2',
        userName: 'Sarah Anderson',
        userAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
        postTime: '5 hours ago',
        content: 'New property listing available in Victoria Island! Fractional ownership starting from $100. Great opportunity for investors.',
        image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400',
        likes: 18,
        isLiked: true,
        isOwn: false,
      },
      {
        id: '3',
        userName: 'Michael Roberts',
        userAvatar: 'https://randomuser.me/api/portraits/men/2.jpg',
        postTime: '1 day ago',
        content: 'Market analysis shows 15% growth in tokenized real estate this quarter. Perfect time to diversify your portfolio!',
        likes: 32,
        isLiked: false,
        isOwn: false,
      },
      {
        id: '4',
        userName: 'Emma Thompson',
        userAvatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        postTime: '2 days ago',
        content: 'Attended the Lagos Real Estate Summit today. Amazing insights on blockchain integration and property tokenization! 🚀',
        image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400',
        likes: 45,
        isLiked: true,
        isOwn: false,
      },
      {
        id: '5',
        userName: 'David Chen',
        userAvatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        postTime: '3 days ago',
        content: 'Monthly returns from my property token portfolio are in! 8.2% yield this month. Decentralized real estate is the future! 📈',
        likes: 67,
        isLiked: false,
        isOwn: false,
      },
      {
        id: '6',
        userName: 'Alex Rodriguez',
        userAvatar: 'https://randomuser.me/api/portraits/men/4.jpg',
        postTime: '4 days ago',
        content: 'Successfully liquidated 20% of my VIC tokens. The marketplace is working beautifully - transaction completed in under 2 minutes! ⚡',
        likes: 29,
        isLiked: false,
        isOwn: false,
      },
      {
        id: '7',
        userName: 'Lisa Parker',
        userAvatar: 'https://randomuser.me/api/portraits/women/3.jpg',
        postTime: '5 days ago',
        content: 'New to ile? Here are my top 3 tips for property investment: 1) Start small 2) Diversify across locations 3) Hold long-term',
        image: 'https://images.unsplash.com/photo-1565402170291-8491f14678db?w=400',
        likes: 156,
        isLiked: true,
        isOwn: false,
      },
      {
        id: '8',
        userName: 'Tom Wilson',
        userAvatar: 'https://randomuser.me/api/portraits/men/5.jpg',
        postTime: '6 days ago',
        content: 'Community update: We now have over 10,000 active investors on the platform! Welcome to all new members 🎉',
        likes: 234,
        isLiked: false,
        isOwn: false,
      },
    ];

    const handleLike = (momentId: string) => {
      console.log('Like moment:', momentId);
    };

    const handleShare = (momentId: string) => {
      console.log('Share moment:', momentId);
    };

    const handleDelete = (momentId: string) => {
      console.log('Delete moment:', momentId);
      setShowDeleteMenu(null);
    };

    const handleDeleteMenuToggle = (momentId: string) => {
      setShowDeleteMenu(showDeleteMenu === momentId ? null : momentId);
    };

    const renderMoment = (moment: any) => (
      <View key={moment.id} style={styles.momentCard}>
        {/* User header */}
        <View style={styles.momentUserHeader}>
          <View style={styles.momentUserInfo}>
            <View style={styles.momentAvatar}>
              {moment.userAvatar ? (
                <Image source={{ uri: moment.userAvatar }} style={styles.momentAvatarImage} />
              ) : (
                <Typography variant="h6">{moment.userName.split(' ').map((n: string) => n[0]).join('')}</Typography>
              )}
            </View>
            <View style={styles.momentUserDetails}>
              <Typography variant="h6" style={styles.momentUserName}>{moment.userName}</Typography>
              <Typography variant="body2" color="textSecondary">{moment.postTime}</Typography>
            </View>
          </View>
          {moment.isOwn && (
            <View style={styles.momentDeleteContainer}>
              <TouchableOpacity onPress={() => handleDeleteMenuToggle(moment.id)} style={styles.momentDeleteButton}>
                <MaterialIcons name="more-vert" size={20} color={Colors.gray600} />
              </TouchableOpacity>
              {showDeleteMenu === moment.id && (
                <View style={styles.deleteDropdown}>
                  <TouchableOpacity onPress={() => handleDelete(moment.id)} style={styles.deleteOption}>
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
            onPress={() => handleLike(moment.id)}
            style={styles.momentActionButton}
          >
            <MaterialIcons 
              name={moment.isLiked ? 'favorite' : 'favorite-border'} 
              size={20} 
              color={moment.isLiked ? Colors.error : Colors.gray600} 
            />
            <Typography variant="body2" style={styles.momentActionText}>
              {moment.likes}
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleShare(moment.id)}
            style={styles.momentActionButton}
          >
            <MaterialIcons name="share" size={20} color={Colors.gray600} />
            <Typography variant="body2" style={styles.momentActionText}>
              Share
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    );

    return (
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Typography variant="h2">Moments</Typography>
        </View>
        
        {mockMoments.map(renderMoment)}
      </ScrollView>
    );
  };

  const renderMe = () => {
    switch (currentMeScreen) {
      case 'profile':
        return (
          <ProfileScreen
            onBack={() => setCurrentMeScreen('main')}
            onEditProfile={() => {
              // Handle edit profile
              console.log('Edit profile');
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
              name="John Doe"
              role="Investor"
              region="Lagos, Nigeria"
              joinDate="March 2024"
              bricksCount={7850}
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
          userBricksCount={7850}
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
      return (
        <ChatScreen
          chatId={selectedChat.id}
          chatName={selectedChat.name}
          chatAvatar={selectedChat.avatar}
          isOnline={selectedChat.isOnline}
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

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Content */}
        {renderContent()}

        {/* Tab Bar - Hide when in chat room or on sub-screens */}
        {!selectedChat && currentMeScreen === 'main' && !showContactProfile && !selectedLoan && currentWalletScreen === 'main' && currentFXScreen === 'marketplace' && (
          <View style={styles.tabBar}>
          <TouchableOpacity 
            style={styles.tabItem}
            onPress={() => setActiveTab('chat')}
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
            onPress={() => setActiveTab('contact')}
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
            onPress={() => setActiveTab('wallet')}
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
            onPress={() => setActiveTab('moments')}
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
            onPress={() => setActiveTab('me')}
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
          onDepositInitiated={(deposit) => {
            console.log('Deposit initiated:', deposit);
            // Could add this to moments or transaction history
          }}
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
      </SafeAreaView>
    </SafeAreaProvider>
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

  // Moment card
  momentCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  momentAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
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
