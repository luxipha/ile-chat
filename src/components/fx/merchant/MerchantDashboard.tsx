import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../../theme';
import { FXTheme, FXColors } from '../../../theme/fxTheme';
import { FXOffer, FXFilter, Currency, PaymentMethod, FXTrade } from '../../../types/fx';
import fxService, { FXDebugUtils } from '../../../services/fxService';
import authService, { User } from '../../../services/authService';
import { Avatar } from '../../ui/Avatar';

interface MerchantDashboardProps {
  onOfferSelect: (offer: FXOffer) => void;
  onCreateOffer: () => void;
  onViewPendingTrades?: () => void;
  onBack?: () => void;
  onEditOffer?: (offer: FXOffer) => void;
  onDeleteOffer?: (offerId: string) => void;
  onToggleOfferStatus?: (offerId: string, status: 'active' | 'paused') => void;
  currentUser?: any; // Add currentUser prop
  onViewProfile?: (merchant: User) => void;
}

// Mock data - same as FXMarketplace for now
const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', type: 'fiat' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', type: 'fiat' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', type: 'fiat' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', type: 'fiat' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', type: 'fiat' },
  { code: 'USDC', name: 'USD Coin', symbol: 'USDC', flag: '💰', type: 'crypto' },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'alipay',
    name: 'Alipay',
    type: 'digital_wallet',
    icon: 'payment',
    processingTime: '1-5 minutes',
    limits: { min: 100, max: 50000 },
  },
  {
    id: 'wechat',
    name: 'WeChat Pay',
    type: 'digital_wallet',
    icon: 'payment',
    processingTime: '1-5 minutes',
    limits: { min: 100, max: 30000 },
  },
  {
    id: 'bank_ng',
    name: 'Nigerian Bank',
    type: 'bank',
    icon: 'account-balance-wallet',
    processingTime: '5-15 minutes',
    limits: { min: 1000, max: 5000000 },
  },
  {
    id: 'bank_us',
    name: 'US Bank Wire',
    type: 'bank',
    icon: 'account-balance',
    processingTime: '30-60 minutes',
    limits: { min: 500, max: 100000 },
  },
];

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  onOfferSelect,
  onCreateOffer,
  onViewPendingTrades,
  onBack,
  onEditOffer,
  onDeleteOffer,
  onToggleOfferStatus,
  currentUser: propCurrentUser,
  onViewProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FXFilter>({
    sellCurrency: undefined,
    buyCurrency: undefined,
    paymentMethods: undefined,
    sortBy: 'best_rate',
  });
  const [offers, setOffers] = useState<FXOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingTrades, setPendingTrades] = useState<FXTrade[]>([]);
  const [loadingPendingTrades, setLoadingPendingTrades] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const displayUser = currentUser || propCurrentUser;

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Use prop currentUser if available, otherwise fetch from authService
        const user = propCurrentUser || await authService.getCachedUser();
        console.log('🏪 [MerchantDashboard] Loaded current user:', {
          userId: user?.id,
          userName: user?.name,
          userRole: user?.role,
          hasMerchantProfile: !!user?.merchantProfile,
          source: propCurrentUser ? 'props' : 'authService'
        });
        if (user) {
          setCurrentUser({
            ...user,
            profileUserId: user.profileUserId || user.firebaseUid || user.id,
            firebaseUid: user.firebaseUid,
          });
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, [propCurrentUser]);

  // Load merchant's own offers
  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, use mock data filtered to show only current user's offers
      const response = await fxService.getOffers();
      const merchantOffers = response.offers.filter(offer => 
        currentUser && offer.maker.id === currentUser.id
      );
      
      setOffers(merchantOffers);
    } catch (err) {
      console.error('Failed to load merchant offers:', err);
      setError('Failed to load your offers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load pending trade requests for merchant
  const loadPendingTrades = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingPendingTrades(true);
      
      // Get all trades where current user is the maker (merchant) and status is pending_acceptance
      const response = await fxService.getUserTrades({ limit: 50, offset: 0 });
      
      if (response.success) {
        const merchantPendingTrades = response.trades.filter(trade => {
          const isMyTrade = trade.maker.id === currentUser.id;
          const isActiveTrade = ['pending_acceptance', 'accepted', 'payment_pending', 'payment_sent'].includes(trade.status);
          return isMyTrade && isActiveTrade;
        });
        
        console.log('📋 [MerchantDashboard] Loaded pending trades:', {
          totalTrades: response.trades.length,
          pendingTrades: merchantPendingTrades.length,
          merchantId: currentUser.id
        });
        
        setPendingTrades(merchantPendingTrades);
      }
    } catch (error) {
      console.error('Failed to load pending trades:', error);
    } finally {
      setLoadingPendingTrades(false);
    }
  };

  // Handle accepting a trade request
  const handleAcceptTrade = async (trade: FXTrade) => {
    try {
      console.log('✅ Accepting trade request:', trade.id);
      
      const response = await fxService.updateTradeStatus(trade.id, 'accepted');
      
      if (response.success) {
        // Remove from pending trades and refresh both lists
        setPendingTrades(prev => prev.filter(t => t.id !== trade.id));
        // Refresh pending trades to show updated status
        await loadPendingTrades();
        Alert.alert('Success', 'Trade request accepted successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to accept trade request');
      }
    } catch (error) {
      console.error('Failed to accept trade:', error);
      Alert.alert('Error', 'Failed to accept trade request');
    }
  };

  // Handle declining a trade request
  const handleDeclineTrade = async (trade: FXTrade) => {
    try {
      console.log('❌ Declining trade request:', trade.id);
      
      const response = await fxService.updateTradeStatus(trade.id, 'cancelled');
      
      if (response.success) {
        // Remove from pending trades and refresh
        setPendingTrades(prev => prev.filter(t => t.id !== trade.id));
        await loadPendingTrades();
        Alert.alert('Success', 'Trade request declined');
      } else {
        Alert.alert('Error', response.error || 'Failed to decline trade request');
      }
    } catch (error) {
      console.error('Failed to decline trade:', error);
      Alert.alert('Error', 'Failed to decline trade request');
    }
  };

  // Calculate time remaining for trade request
  const getTimeRemaining = (createdAt: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    }
    return `${diffMinutes}m ago`;
  };

  // Render pending trade request card
  const renderPendingTradeCard = ({ item: trade }: { item: FXTrade }) => (
    <Card style={[FXTheme.cards.base, { marginRight: Spacing.md }]}>
      <View style={FXTheme.layouts.rowBetween}>
        <View style={{ flex: 1 }}>
          {/* Buyer Info */}
          <View style={FXTheme.layouts.row}>
            <View style={[FXTheme.layouts.center, { 
              width: 32, 
              height: 32, 
              borderRadius: 16, 
              backgroundColor: FXColors.primary + '20',
              marginRight: Spacing.sm 
            }]}>
              <Typography variant="body2" style={{ color: FXColors.primary, fontWeight: '600' }}>
                {trade.taker.name.charAt(0).toUpperCase()}
              </Typography>
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body2" style={FXTheme.text.bold}>
                {trade.taker.name}
              </Typography>
              <View style={FXTheme.layouts.row}>
                <MaterialIcons name="star" size={12} color={Colors.warning} />
                <Typography variant="caption" style={{ color: Colors.gray600, marginLeft: 2 }}>
                  {trade.taker.trustScore}
                </Typography>
              </View>
            </View>
          </View>

          {/* Trade Details */}
          <View style={[FXTheme.layouts.rowBetween, FXTheme.spacing.marginTop('sm')]}>
            <View>
              <Typography variant="caption" style={{ color: Colors.gray600 }}>
                Wants to buy
              </Typography>
              <Typography variant="body2" style={FXTheme.text.bold}>
                {trade.sellCurrency.symbol}{trade.sellAmount.toLocaleString()}
              </Typography>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Typography variant="caption" style={{ color: Colors.gray600 }}>
                Will pay
              </Typography>
              <Typography variant="body2" style={FXTheme.text.bold}>
                {trade.buyCurrency.symbol}{trade.buyAmount.toLocaleString()}
              </Typography>
            </View>
          </View>

          {/* Payment Method */}
          <View style={[FXTheme.layouts.row, FXTheme.spacing.marginTop('xs')]}>
            <MaterialIcons name="payment" size={14} color={Colors.gray600} />
            <Typography variant="caption" style={{ color: Colors.gray600, marginLeft: 4 }}>
              {trade.paymentMethod.name}
            </Typography>
          </View>

          {/* Time */}
          <Typography variant="caption" style={[{ color: Colors.gray500 }, FXTheme.spacing.marginTop('xs')]}>
            {getTimeRemaining(trade.createdAt)}
          </Typography>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[FXTheme.layouts.rowGap, FXTheme.spacing.marginTop('md')]}>
        <TouchableOpacity
          style={[FXTheme.buttons.secondary, { flex: 1 }]}
          onPress={() => handleDeclineTrade(trade)}
        >
          <Typography variant="body2" style={{ color: Colors.gray700 }}>
            Decline
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={[FXTheme.buttons.primary, { flex: 1 }]}
          onPress={() => handleAcceptTrade(trade)}
        >
          <Typography variant="body2" style={{ color: Colors.white, fontWeight: '600' }}>
            Accept
          </Typography>
        </TouchableOpacity>
      </View>
    </Card>
  );

  useEffect(() => {
    if (currentUser) {
      loadOffers();
      loadPendingTrades();
    }
  }, [currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOffers();
    setRefreshing(false);
  };

  // Filter and sort offers
  const filteredOffers = useMemo(() => {
    let filtered = offers.filter(offer => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          offer.sellCurrency.code.toLowerCase().includes(query) ||
          offer.sellCurrency.name.toLowerCase().includes(query) ||
          offer.buyCurrency.code.toLowerCase().includes(query) ||
          offer.buyCurrency.name.toLowerCase().includes(query) ||
          offer.maker.name.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Currency filters
      if (filter.sellCurrency && offer.sellCurrency.code !== filter.sellCurrency) {
        return false;
      }
      if (filter.buyCurrency && offer.buyCurrency.code !== filter.buyCurrency) {
        return false;
      }

      // Payment method filter
      if (filter.paymentMethods && filter.paymentMethods.length > 0) {
        const hasPaymentMethod = offer.paymentMethods.some(
          method => filter.paymentMethods!.includes(method.id)
        );
        if (!hasPaymentMethod) return false;
      }

      return true;
    });

    // Sort offers
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filter.sortBy) {
        case 'best_rate':
          comparison = a.exchangeRate - b.exchangeRate;
          break;
        case 'highest_trust':
          comparison = a.maker.trustScore - b.maker.trustScore;
          break;
        case 'most_trades':
          comparison = a.maker.completedTrades - b.maker.completedTrades;
          break;
        case 'fastest':
          // Sort by response time (assuming faster response time is better)
          comparison = parseInt(a.maker.responseTime) - parseInt(b.maker.responseTime);
          break;
        default:
          comparison = 0;
      }

      return -comparison; // Default to descending order
    });

    return filtered;
  }, [offers, searchQuery, filter]);

  // Calculate merchant stats
  const merchantStats = useMemo(() => {
    const totalOffers = offers.length;
    const activeOffers = offers.filter(offer => offer.status === 'active').length;
    const totalVolume = offers.reduce((sum, offer) => sum + (offer.sellAmount - offer.availableAmount), 0);
    const avgMargin = offers.length > 0 
      ? offers.reduce((sum, offer) => sum + offer.margin, 0) / offers.length 
      : 0;

    return {
      totalOffers,
      activeOffers,
      totalVolume,
      avgMargin,
    };
  }, [offers]);

  const handleOfferPress = (offer: FXOffer) => {
    onOfferSelect(offer);
  };

  const handleEditOffer = (offer: FXOffer) => {
    // TODO: Implement edit offer functionality
    Alert.alert('Edit Offer', 'Edit offer functionality coming soon!');
  };

  const handleToggleOfferStatus = async (offer: FXOffer) => {
    try {
      const newStatus = offer.status === 'active' ? 'paused' : 'active';
      // TODO: Implement API call to update offer status
      Alert.alert(
        'Status Updated', 
        `Offer ${newStatus === 'active' ? 'activated' : 'paused'} successfully`
      );
      
      // Update local state
      setOffers(prev => prev.map(o => 
        o.id === offer.id ? { ...o, status: newStatus } : o
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to update offer status');
    }
  };

  const handleDeleteOffer = (offer: FXOffer) => {
    Alert.alert(
      'Delete Offer',
      'Are you sure you want to delete this offer? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement API call to delete offer
              setOffers(prev => prev.filter(o => o.id !== offer.id));
              Alert.alert('Success', 'Offer deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete offer');
            }
          },
        },
      ]
    );
  };

  const renderOfferCard = ({ item: offer }: { item: FXOffer }) => {
    const isActive = offer.status === 'active';
    // Placeholder utilization - will implement proper calculation later
    const utilization = 0; // TODO: Implement proper utilization calculation
    
    return (
      <TouchableOpacity onPress={() => onOfferSelect(offer)}>
        <Card style={isActive ? FXTheme.cards.base : [FXTheme.cards.base, FXTheme.cards.inactive]}>
          {/* Offer Header */}
          <View style={FXTheme.layouts.rowBetween}>
            <View style={FXTheme.headers.content}>
              <View style={FXTheme.badges.status}>
                <Typography 
                  variant="caption" 
                  style={[FXTheme.text.bold, { 
                    color: isActive ? FXColors.text.success : FXColors.text.muted,
                    fontSize: 10 
                  }]}
                >
                  {isActive ? 'ACTIVE' : 'PAUSED'}
                </Typography>
              </View>
            </View>
            
            <View style={FXTheme.layouts.rowGap}>
              <TouchableOpacity
                onPress={() => onDeleteOffer?.(offer.id)}
              >
                <MaterialIcons name="delete" size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Trade Details */}
          <View style={FXTheme.cards.section}>
            <View style={FXTheme.currency.pair}>
              <View style={FXTheme.currency.side}>
                <Typography variant="caption" style={{ color: Colors.gray600 }}>Selling</Typography>
                <View style={FXTheme.currency.info}>
                <Typography style={FXTheme.currency.flag}>
                  {offer.sellCurrency.flag}
                </Typography>
                <View>
                  <Typography variant="body2" style={FXTheme.text.amount}>
                    {offer.sellCurrency.symbol}{offer.availableAmount.toLocaleString()}
                  </Typography>
                </View>
              </View>
              </View>

              <View style={FXTheme.currency.exchangeInfo}>
                <MaterialIcons name="swap-horiz" size={20} color={Colors.gray400} />
                <Typography variant="caption" style={FXTheme.text.rate}>
                  {offer.exchangeRate.toFixed(4)}
                </Typography>
                <View style={[FXTheme.badges.margin, { 
                  backgroundColor: offer.margin >= 0 ? Colors.success + '20' : Colors.error + '20' 
                }]}>
                  <Typography style={[FXTheme.text.bold, { 
                    color: offer.margin >= 0 ? Colors.success : Colors.error,
                    fontSize: 10 
                  }]}>
                    {offer.margin >= 0 ? '+' : ''}{offer.margin.toFixed(2)}%
                  </Typography>
                </View>
              </View>

              <View style={FXTheme.currency.sideRight}>
                <Typography variant="caption" style={{ color: Colors.gray600 }}>Buying</Typography>
                <View style={FXTheme.currency.info}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Typography variant="body2" style={FXTheme.text.amount}>
                      {offer.buyCurrency.symbol}{offer.buyAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" style={{ color: Colors.gray600 }}>
                      {offer.buyCurrency.code}
                    </Typography>
                  </View>
                  <Typography style={FXTheme.currency.flag}>
                    {offer.buyCurrency.flag}
                  </Typography>
                </View>
              </View>
            </View>

            {/* Payment Methods and Utilization */}
            <View style={FXTheme.payment.methods}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <MaterialIcons name="payment" size={16} color={Colors.gray600} />
                  <Typography variant="caption" style={{ color: Colors.gray600, marginLeft: 4 }}>
                    Payment Methods
                  </Typography>
                </View>
                <View style={FXTheme.payment.methodsList}>
                  {offer.paymentMethods.map((method) => (
                    <View key={method.id} style={FXTheme.badges.method}>
                      <MaterialIcons name={method.icon as any} size={10} color={Colors.primary} />
                      <Typography variant="caption" style={FXTheme.payment.methodText}>
                        {method.name}
                      </Typography>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={{ alignItems: 'flex-end' }}>
                <Typography variant="caption" style={{ color: Colors.gray600 }}>
                  Utilization
                </Typography>
                <Typography variant="body2" style={{ color: Colors.primary, fontWeight: '600' }}>
                  {utilization.toFixed(1)}%
                </Typography>
              </View>
            </View>

            {/* Trade Terms */}
            <View style={FXTheme.trade.terms}>
              <View style={FXTheme.trade.termItem}>
                <Typography variant="caption" style={{ color: Colors.gray600 }}>Min Trade</Typography>
              <Typography variant="body2" style={FXTheme.trade.limitValue}>
                {offer.sellCurrency.symbol}{offer.minTrade.toLocaleString()}
              </Typography>
            </View>
            <View style={FXTheme.trade.limitItem}>
              <Typography variant="caption" style={{ color: Colors.gray600 }}>Max Trade</Typography>
              <Typography variant="body2" style={FXTheme.trade.limitValue}>
                {offer.sellCurrency.symbol}{offer.maxTrade.toLocaleString()}
              </Typography>
            </View>
            <View style={FXTheme.trade.limitItem}>
              <Typography variant="caption" style={{ color: Colors.gray600 }}>Payment Window</Typography>
                <Typography variant="caption" style={FXTheme.text.bold}>
                  {offer.paymentWindow}h
                </Typography>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={FXTheme.states.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Typography variant="body2" style={FXTheme.states.loadingText}>
          Loading your offers...
        </Typography>
      </View>
    );
  }

  if (error) {
    return (
      <View style={FXTheme.states.error}>
        <MaterialIcons name="error-outline" size={48} color={Colors.error} />
        <Typography variant="h3" style={FXTheme.states.errorTitle}>
          Failed to load offers
        </Typography>
        <Typography variant="body2" style={[FXTheme.states.errorText, { color: Colors.gray600 }]}>
            {error}
          </Typography>
        <Button
          title="Retry"
          onPress={loadOffers}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={FXTheme.containers.screen}>
      {/* Header */}
      <View style={FXTheme.headers.main}>
        {onBack && (
          <TouchableOpacity style={FXTheme.buttons.back} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.gray800} />
          </TouchableOpacity>
        )}
        <View style={FXTheme.headers.content}>
          <Typography variant="h2">My FX Offers</Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your foreign exchange offers
          </Typography>
        </View>
        <View style={FXTheme.layouts.rowGap}>
          {displayUser && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => {
                if (onViewProfile) {
                  onViewProfile(displayUser as User);
                }
              }}
              activeOpacity={0.8}
            >
              <Avatar
                userId={displayUser.profileUserId || displayUser.firebaseUid || displayUser.id}
                name={displayUser.name}
                imageUrl={displayUser.avatar}
                size={40}
                style={styles.profileAvatar}
              />
            </TouchableOpacity>
          )}
          {/* Pending Trades Icon with Counter */}
          <TouchableOpacity 
            style={styles.pendingTradesButton}
            onPress={() => {
              if (onViewPendingTrades) {
                onViewPendingTrades();
              } else {
                Alert.alert('Pending Trade', `You have ${pendingTrades.length} pending trade requests`);
              }
            }}
          >
            <MaterialIcons name="pending-actions" size={24} color={Colors.gray700} />
            {pendingTrades.length > 0 && (
              <View style={styles.counterBadge}>
                <Typography variant="caption" style={styles.counterText}>
                  {pendingTrades.length > 99 ? '99+' : pendingTrades.length}
                </Typography>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Create Offer Button */}
          <TouchableOpacity style={FXTheme.buttons.create} onPress={onCreateOffer}>
            <MaterialIcons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={FXTheme.inputs.container}>
        <View style={FXTheme.inputs.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.gray500} />
          <TextInput
            style={FXTheme.inputs.searchInput}
            placeholder="Search offers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.gray500}
          />
        </View>
      </View>

      {/* Offers List */}
      <FlatList
        data={filteredOffers}
        renderItem={renderOfferCard}
        keyExtractor={(item) => item.id}
        style={FXTheme.containers.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={loading || loadingPendingTrades} 
            onRefresh={() => {
              loadOffers();
              loadPendingTrades();
            }} 
          />
        }
        ListEmptyComponent={
          <View style={FXTheme.states.empty}>
            <MaterialIcons name="account-balance" size={64} color={Colors.gray400} />
            <Typography variant="h3" style={FXTheme.states.emptyTitle}>
              No offers yet
            </Typography>
            <Typography variant="body2" style={[FXTheme.states.emptyText, { color: Colors.gray600 }]}>
              No offers found. Create your first offer to start trading.
            </Typography>
            <Button
              title="Create Offer"
              onPress={onCreateOffer}
              style={styles.createOfferButton}
            />
          </View>
        }
      />
    </View>
  );
};



// Keep only styles that are truly unique and can't be replaced by theme
const styles = StyleSheet.create({
  retryButton: {
    marginBottom: Spacing.md,
    minWidth: 120,
  },
  createOfferButton: {
    paddingHorizontal: Spacing.xl,
  },
  pendingTradesButton: {
    position: 'relative',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  counterText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 40,
    height: 40,
  },
});
