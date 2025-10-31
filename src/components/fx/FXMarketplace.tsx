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
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { FXTheme, FXColors } from '../../theme/fxTheme';
import { FXOffer, FXFilter, Currency, PaymentMethod } from '../../types/fx';
import fxService, { FXDebugUtils } from '../../services/fxService';
import authService from '../../services/authService';
import { Avatar } from '../ui/Avatar';

interface FXMarketplaceProps {
  onOfferSelect: (offer: FXOffer) => void;
  onCreateOffer: () => void;
  onViewTrades?: () => void;
  onBack?: () => void;
}

// Mock data
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

const MOCK_OFFERS: FXOffer[] = [
  {
    id: '1',
    maker: {
      id: '3',
      name: 'John Martinez',
      trustScore: 96,
      trustBadge: 'verified',
      completedTrades: 342,
      responseTime: '~3 minutes',
      onlineStatus: 'online',
    },
    sellCurrency: CURRENCIES.find(c => c.code === 'CNY') || CURRENCIES[2], // Fallback to CNY
    buyCurrency: CURRENCIES.find(c => c.code === 'NGN') || CURRENCIES[1], // Fallback to NGN
    sellAmount: 1000,
    buyAmount: 220000,
    exchangeRate: 220,
    margin: -0.5, // 0.5% below market
    paymentMethods: [PAYMENT_METHODS[0], PAYMENT_METHODS[2]], // Alipay + NG Bank
    paymentWindow: 15,
    minTrade: 100,
    maxTrade: 10000,
    status: 'active',
    availableAmount: 1000,
    kycRequired: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
  },
  {
    id: '2',
    maker: {
      id: '4',
      name: 'Real Estate Expert',
      trustScore: 89,
      trustBadge: 'premium',
      completedTrades: 156,
      responseTime: '~8 minutes',
      onlineStatus: 'online',
    },
    sellCurrency: CURRENCIES.find(c => c.code === 'USD') || CURRENCIES[0], // Fallback to USD
    buyCurrency: CURRENCIES.find(c => c.code === 'NGN') || CURRENCIES[1], // Fallback to NGN
    sellAmount: 5000,
    buyAmount: 7750000,
    exchangeRate: 1550,
    margin: 1.2, // 1.2% above market
    paymentMethods: [PAYMENT_METHODS[3], PAYMENT_METHODS[2]], // US Bank + NG Bank
    paymentWindow: 45,
    minTrade: 200,
    maxTrade: 5000,
    status: 'active',
    availableAmount: 5000,
    kycRequired: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
  },
  {
    id: '3',
    maker: {
      id: '5',
      name: 'Emma Thompson',
      trustScore: 92,
      trustBadge: 'verified',
      completedTrades: 78,
      responseTime: '~12 minutes',
      onlineStatus: 'away',
    },
    sellCurrency: CURRENCIES.find(c => c.code === 'EUR') || CURRENCIES[3], // Fallback to EUR
    buyCurrency: CURRENCIES.find(c => c.code === 'USDC') || CURRENCIES[5], // Fallback to USDC
    sellAmount: 2000,
    buyAmount: 2150,
    exchangeRate: 1.075,
    margin: 0.8, // 0.8% above market
    paymentMethods: [PAYMENT_METHODS[3]], // US Bank only
    paymentWindow: 30,
    minTrade: 100,
    maxTrade: 2000,
    status: 'active',
    availableAmount: 1800,
    kycRequired: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 min ago
  },
];

export const FXMarketplace: React.FC<FXMarketplaceProps> = ({
  onOfferSelect,
  onCreateOffer,
  onViewTrades,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FXFilter>({
    sortBy: 'best_rate',
    onlineOnly: true,
  });
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  
  // Real API data state
  const [offers, setOffers] = useState<FXOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // User role detection state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCurrentUserMerchant, setIsCurrentUserMerchant] = useState(false);

  // Debug function for development
  const handleDebugPress = () => {
    if (__DEV__) {
      console.log('FX Debug - Offers:', offers);
      Alert.alert('Debug Info', `Offers: ${offers.length}\nFilters: ${JSON.stringify(filters, null, 2)}`);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // User role detection
  useEffect(() => {
    const detectUserRole = async () => {
      try {
        const user = await authService.getCachedUser();
        console.log('👤 [FXMarketplace] Current user:', user ? Object.keys(user) : 'null');
        console.log('👤 [FXMarketplace] User role:', user?.role);
        console.log('👤 [FXMarketplace] User ID:', user?.id);
        
        setCurrentUser(user);
        
        // Check if user is a merchant
        const isMerchant = user?.role === 'merchant' || user?.merchantProfile?.status === 'approved';
        setIsCurrentUserMerchant(isMerchant);
        console.log('🏪 [FXMarketplace] Is current user merchant?', isMerchant);
        
        
      } catch (error) {
        console.error('❌ [FXMarketplace] Error detecting user role:', error);
      }
    };

    detectUserRole();
  }, []);


  // Load offers when filters change
  useEffect(() => {
    if (currencies.length > 0) { // Only load offers after currencies are loaded
      loadOffers();
    }
  }, [filters, currencies.length]);

  const loadInitialData = async () => {
    console.log('🔄 FX Marketplace - Loading initial data...');
    try {
      setLoading(true);
      setError(null);

      // Load currencies and payment methods
      const loadedCurrencies = fxService.getCurrencies();
      const loadedPaymentMethods = fxService.getPaymentMethods();

      console.log('✅ FX Marketplace - Static data loaded:', {
        currenciesCount: loadedCurrencies.length,
        paymentMethodsCount: loadedPaymentMethods.length
      });

      setCurrencies(loadedCurrencies);
      setPaymentMethods(loadedPaymentMethods);

      // Load offers
      await loadOffers();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load marketplace data';
      console.error('❌ FX Marketplace - Initial load error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    console.log('🔄 FX Marketplace - Loading offers with filters:', filters);
    try {
      const response = await fxService.getOffers(filters);
      
      if (response.success) {
        console.log('✅ FX Marketplace - Offers loaded successfully:', {
          offersCount: response.offers.length,
          isMockData: (response as any)._isMockData || false
        });
        setOffers(response.offers);
        setError(null);
      } else {
        console.error('❌ FX Marketplace - Failed to load offers:', response.error);
        setError(response.error || 'Failed to load offers');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load offers';
      console.error('❌ FX Marketplace - Load offers error:', err);
      setError(errorMessage);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 FX Marketplace - Manual refresh triggered');
    setRefreshing(true);
    await loadOffers();
    setRefreshing(false);
  };

  const checkUserEligibility = () => {
    // Allow all users to become merchants (balance requirement removed)
    return true;
  };

  const handleCreateOffer = () => {
    if (!checkUserEligibility()) {
      setShowEligibilityModal(true);
      return;
    }
    onCreateOffer();
  };

  const filteredOffers = useMemo(() => {
    console.log('🔄 FX Marketplace - Filtering offers:', {
      totalOffers: offers.length,
      searchQuery,
      filters
    });

    let filteredResults = offers.filter(offer => {
      const matchesSearch = 
        offer.maker.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesOnlineFilter = !filters.onlineOnly || offer.maker.onlineStatus === 'online';
      const matchesCurrency = 
        (!filters.sellCurrency || offer.sellCurrency.code === filters.sellCurrency) &&
        (!filters.buyCurrency || offer.buyCurrency.code === filters.buyCurrency);
      
      return matchesSearch && matchesOnlineFilter && matchesCurrency;
    });

    // Sort offers
    filteredResults.sort((a, b) => {
      switch (filters.sortBy) {
        case 'best_rate':
          return a.margin - b.margin; // Lower margin = better rate for buyer
        case 'fastest':
          return a.paymentWindow - b.paymentWindow;
        case 'highest_trust':
          return b.maker.trustScore - a.maker.trustScore;
        case 'most_trades':
          return b.maker.completedTrades - a.maker.completedTrades;
        default:
          return 0;
      }
    });

    console.log('✅ FX Marketplace - Offers filtered:', {
      filteredCount: filteredResults.length,
      totalCount: offers.length
    });

    return filteredResults;
  }, [offers, searchQuery, filters]);

  const renderFilters = () => (
    <View style={FXTheme.inputs.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={FXTheme.layouts.row}>
          <View style={FXTheme.layouts.column}>
            <Typography variant="caption" color="textSecondary">Pay with</Typography>
            <TouchableOpacity style={FXTheme.buttons.action}>
              <Typography variant="body2" style={{ color: Colors.primary }}>
                {filters.sellCurrency || 'Any'} 
              </Typography>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          <MaterialIcons name="arrow-forward" size={20} color={Colors.gray600} style={{ marginHorizontal: Spacing.md }} />

          <View style={FXTheme.layouts.column}>
            <Typography variant="caption" color="textSecondary">Receive</Typography>
            <TouchableOpacity style={FXTheme.buttons.action}>
              <Typography variant="body2" style={{ color: Colors.primary }}>
                {filters.buyCurrency || 'Any'}
              </Typography>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          <View style={FXTheme.layouts.column}>
            <Typography variant="caption" color="textSecondary">Sort by</Typography>
            <TouchableOpacity 
              style={FXTheme.buttons.action}
              onPress={() => {
                const sortOptions: FXFilter['sortBy'][] = ['best_rate', 'fastest', 'highest_trust', 'most_trades'];
                const currentIndex = sortOptions.indexOf(filters.sortBy);
                const nextIndex = (currentIndex + 1) % sortOptions.length;
                setFilters({...filters, sortBy: sortOptions[nextIndex]});
              }}
            >
              <Typography variant="body2" style={{ color: Colors.primary }}>
                {filters.sortBy === 'best_rate' ? 'Best Rate' :
                 filters.sortBy === 'fastest' ? 'Fastest' :
                 filters.sortBy === 'highest_trust' ? 'Highest Trust' : 'Most Trades'}
              </Typography>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderTrustBadge = (badge: string | null | undefined) => {
    if (!badge) return null;
    
    const badgeConfig = {
      verified: { icon: 'verified', color: Colors.success },
      premium: { icon: 'star', color: Colors.secondary },
      pro: { icon: 'workspace-premium', color: Colors.primary },
    };
    
    const config = badgeConfig[badge as keyof typeof badgeConfig];
    if (!config) return null;
    
    return (
      <View style={[FXTheme.badges.status, { backgroundColor: config.color + '20' }]}>
        <MaterialIcons name={config.icon as any} size={12} color={config.color} />
      </View>
    );
  };

  const renderOfferCard = ({ item: offer }: { item: FXOffer }) => {
    return (
      <TouchableOpacity onPress={() => onOfferSelect(offer)}>
        <Card style={FXTheme.cards.base}>
        <View style={FXTheme.layouts.rowBetween}>
          <View style={FXTheme.layouts.row}>
            <View style={{ position: 'relative', marginRight: Spacing.sm }}>
              <Avatar
                userId={offer.maker.profileUserId || offer.maker.firebaseUid || offer.maker.id}
                name={offer.maker.name}
                imageUrl={offer.maker.avatar}
                size={40}
              />
              {offer.maker.onlineStatus === 'online' && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: Colors.success,
                    borderWidth: 2,
                    borderColor: Colors.white,
                  }}
                />
              )}
            </View>
            <View style={FXTheme.layouts.column}>
              <Typography variant="body1" style={FXTheme.text.bold}>
                {offer.maker.name}
              </Typography>
              <View style={FXTheme.layouts.row}>
                <Typography variant="caption" color="textSecondary">
                  {offer.maker.completedTrades} trades • {offer.maker.trustScore}⭐
                </Typography>
              </View>
            </View>
          </View>
          {renderTrustBadge(offer.maker.trustBadge)}
        </View>

        <View style={FXTheme.trade.limits}>
          <View style={FXTheme.currency.side}>
            <Typography variant="caption" color="textSecondary">
              Selling
            </Typography>
            <View style={FXTheme.currency.info}>
              <Typography variant="body2" style={FXTheme.text.currencyCode}>
                {offer.sellCurrency.code}
              </Typography>
            </View>
            <Typography variant="h3" style={FXTheme.text.amount}>
              {offer.sellCurrency.symbol}{offer.sellAmount.toLocaleString()}
            </Typography>
          </View>

          <View style={FXTheme.currency.exchangeInfo}>
            <Typography variant="caption" color="textSecondary">
              Rate
            </Typography>
            <Typography variant="body1" style={FXTheme.text.rate}>
              {offer.exchangeRate}
            </Typography>
          </View>

          <View style={FXTheme.currency.sideRight}>
            <Typography variant="caption" color="textSecondary">
              Buying
            </Typography>
            <View style={FXTheme.currency.info}>
              <Typography variant="body2" style={FXTheme.text.currencyCode}>
                {offer.buyCurrency.code}
              </Typography>
            </View>
            <Typography variant="h3" style={FXTheme.text.amount}>
              {offer.buyCurrency.symbol}{offer.buyAmount.toLocaleString()}
            </Typography>
          </View>
        </View>

        <View style={FXTheme.payment.methods}>
          <Typography variant="caption" color="textSecondary">
            Payment:
          </Typography>
          <View style={FXTheme.payment.methodsList}>
            {offer.paymentMethods.map((method, index) => (
              <View key={index} style={FXTheme.badges.method}>
                <Typography variant="caption" style={FXTheme.payment.methodText}>
                  {method.name}
                </Typography>
              </View>
            ))}
          </View>
        </View>

        <View style={FXTheme.trade.terms}>
          <View style={FXTheme.trade.termItem}>
            <Typography variant="caption" color="textSecondary">
              Min Trade
            </Typography>
            <Typography variant="body2" style={FXTheme.trade.limitValue}>
              {offer.sellCurrency.symbol}{offer.minTrade.toLocaleString()}
            </Typography>
          </View>
          <View style={FXTheme.trade.termItem}>
            <Typography variant="caption" color="textSecondary">
              Max Trade
            </Typography>
            <Typography variant="body2" style={FXTheme.trade.limitValue}>
              {offer.sellCurrency.symbol}{offer.maxTrade.toLocaleString()}
            </Typography>
          </View>
          <View style={FXTheme.trade.termItem}>
            <Typography variant="caption" color="textSecondary">
              Time Limit
            </Typography>
            <Typography variant="body2" style={FXTheme.trade.limitValue}>
              {offer.paymentWindow}m
            </Typography>
          </View>
        </View>
      </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={FXTheme.states.empty}>
      <MaterialIcons name="currency-exchange" size={48} color={Colors.gray400} />
      <Typography variant="h6" style={FXTheme.states.emptyTitle}>
        No offers found
      </Typography>
      <Typography variant="body2" color="textSecondary" style={FXTheme.states.emptyText}>
        Try adjusting your filters or create your own offer
      </Typography>
      <Button
        title="Create Offer"
        onPress={handleCreateOffer}
        style={FXTheme.buttons.create}
        variant="outline"
      />
    </View>
  );

  return (
    <View style={FXTheme.containers.screen}>
      {/* Header */}
      <View style={FXTheme.headers.main}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={FXTheme.buttons.back}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        
        <View style={FXTheme.headers.content}>
          <Typography variant="h4">FX Marketplace</Typography>
          <Typography variant="body2" color="textSecondary">
            Find the best exchange rates
          </Typography>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {onViewTrades && (
            <TouchableOpacity 
              style={[FXTheme.buttons.secondary, { paddingHorizontal: 12, paddingVertical: 8 }]} 
              onPress={onViewTrades}
            >
              <MaterialIcons name="history" size={20} color={Colors.primary} />
              <Typography variant="caption" style={{ color: Colors.primary, marginLeft: 4 }}>
                Trades
              </Typography>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={FXTheme.buttons.create} onPress={handleCreateOffer}>
            <MaterialIcons name="add" size={24} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={FXTheme.inputs.container}>
        <View style={FXTheme.inputs.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.gray600} />
          <TextInput
            style={FXTheme.inputs.searchInput}
            placeholder="Search by currency or trader..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.gray600}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={FXTheme.containers.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={FXTheme.layouts.rowGap}>
            <View style={FXTheme.layouts.column}>
              <Typography variant="caption" style={{ color: Colors.gray600 }}>From</Typography>
              <TouchableOpacity style={[FXTheme.buttons.secondary, { paddingHorizontal: 12, paddingVertical: 8 }]}>
                <Typography variant="body2" style={FXTheme.text.bold}>
                  {filters.sellCurrency || 'Any'}
                </Typography>
                <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.gray600} />
              </TouchableOpacity>
            </View>
            
            <MaterialIcons name="arrow-forward" size={20} color={Colors.gray600} style={{ marginTop: 16 }} />
            
            <View style={FXTheme.layouts.column}>
              <Typography variant="caption" style={{ color: Colors.gray600 }}>To</Typography>
              <TouchableOpacity style={[FXTheme.buttons.secondary, { paddingHorizontal: 12, paddingVertical: 8 }]}>
                <Typography variant="body2" style={FXTheme.text.bold}>
                  {filters.buyCurrency || 'Any'}
                </Typography>
                <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.gray600} />
              </TouchableOpacity>
            </View>
            
            <View style={FXTheme.layouts.column}>
              <Typography variant="caption" style={{ color: Colors.gray600 }}>Sort by</Typography>
              <TouchableOpacity
                style={[FXTheme.buttons.secondary, { paddingHorizontal: 12, paddingVertical: 8 }]}
                onPress={() => {
                  const nextSort = filters.sortBy === 'best_rate' ? 'fastest' : 
                                  filters.sortBy === 'fastest' ? 'highest_trust' : 
                                  filters.sortBy === 'highest_trust' ? 'most_trades' : 'best_rate';
                  setFilters(prev => ({ ...prev, sortBy: nextSort }));
                }}
              >
                <Typography variant="body2" style={FXTheme.text.bold}>
                  {filters.sortBy === 'best_rate' ? 'Best Rate' : 
                   filters.sortBy === 'fastest' ? 'Fastest' : 
                   filters.sortBy === 'highest_trust' ? 'Highest Trust' : 'Most Trades'}
                </Typography>
                <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={FXTheme.states.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Typography variant="body1" style={FXTheme.states.loadingText}>
            Loading offers...
          </Typography>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={FXTheme.states.error}>
          <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          <Typography variant="h6" style={FXTheme.states.errorTitle}>
            Unable to load offers
          </Typography>
          <Typography variant="body2" color="textSecondary" style={FXTheme.states.errorText}>
            {error}
          </Typography>
          <Button
            title="Retry"
            onPress={loadOffers}
            style={FXTheme.buttons.retry}
          />
          {__DEV__ && (
            <Button
              title="Debug"
              onPress={handleDebugPress}
              style={FXTheme.buttons.debug}
            />
          )}
        </View>
      )}

      {/* Offers List */}
      {!loading && !error && (
        <FlatList
          data={filteredOffers}
          keyExtractor={(item) => item.id}
          renderItem={renderOfferCard}
          contentContainerStyle={FXTheme.containers.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadOffers} />
          }
          ListEmptyComponent={
            <View style={FXTheme.states.empty}>
              <MaterialIcons name="currency-exchange" size={64} color={Colors.gray400} />
              <Typography variant="h6" style={FXTheme.states.emptyTitle}>
                No offers found
              </Typography>
              <Typography variant="body2" color="textSecondary" style={FXTheme.states.emptyText}>
                Try adjusting your filters or create your own offer
              </Typography>
              <Button
                title="Create Offer"
                onPress={onCreateOffer}
                style={FXTheme.buttons.createOffer}
              />
            </View>
          }
        />
      )}

      {/* KYC Required Modal */}
      <Modal
        visible={showEligibilityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEligibilityModal(false)}
      >
        <View style={FXTheme.modals.overlay}>
          <View style={FXTheme.modals.content}>
            <View style={FXTheme.modals.header}>
              <MaterialIcons name="verified-user" size={48} color={Colors.primary} />
              <Typography variant="h5" style={FXTheme.modals.title}>
                KYC Verification Required
              </Typography>
            </View>

            <View style={FXTheme.modals.body}>
              <Typography variant="body1" style={FXTheme.modals.text}>
                This offer requires identity verification to proceed with the trade.
              </Typography>

              <View style={FXTheme.modals.requirementsList}>
                <View style={FXTheme.modals.requirementItem}>
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                  <Typography variant="body2" style={FXTheme.modals.requirementText}>
                    Government-issued ID verification
                  </Typography>
                </View>
                <View style={FXTheme.modals.requirementItem}>
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                  <Typography variant="body2" style={FXTheme.modals.requirementText}>
                    Address verification
                  </Typography>
                </View>
              </View>

              <Typography variant="body2" color="textSecondary" style={FXTheme.modals.subtext}>
                Your information is encrypted and secure. Verification typically takes 5-10 minutes.
              </Typography>
            </View>

            <View style={FXTheme.modals.buttons}>
              <Button
                title="Complete KYC"
                onPress={() => {
                  setShowEligibilityModal(false);
                  // Navigate to KYC flow
                }}
                style={FXTheme.modals.primaryButton}
              />
              <Button
                title="Cancel"
                onPress={() => setShowEligibilityModal(false)}
                style={FXTheme.modals.secondaryButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles have been replaced with FXTheme
