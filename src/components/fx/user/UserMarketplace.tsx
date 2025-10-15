import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../../theme';
import { FXTheme, FXColors } from '../../../theme/fxTheme';
import { FXOffer, FXFilter, Currency, PaymentMethod, FXTrade } from '../../../types/fx';
import fxService, { FXDebugUtils } from '../../../services/fxService';
import authService from '../../../services/authService';

interface UserMarketplaceProps {
  onOfferSelect: (offer: FXOffer) => void;
  onBack?: () => void;
  onTradeRoomNavigate?: (offerId: string) => void;
  userActiveTrades?: FXTrade[];
  onViewMyTrades?: () => void;
}

// Enhanced filter interface for users
interface UserFXFilter extends FXFilter {
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  trustScoreMin?: number;
  kycRequired?: boolean;
  showFavoritesOnly?: boolean;
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

export const UserMarketplace: React.FC<UserMarketplaceProps> = ({
  onOfferSelect,
  onBack,
  onTradeRoomNavigate,
  userActiveTrades = [],
  onViewMyTrades,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real API data state
  const [offers, setOffers] = useState<FXOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // User-specific state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [favoriteOffers, setFavoriteOffers] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<{fromCurrency: string, toCurrency: string}[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
    loadUserPreferences();
  }, []);

  // Load offers when currencies are available
  useEffect(() => {
    if (currencies.length > 0) {
      loadOffers();
    }
  }, [currencies.length]);

  const loadInitialData = async () => {
    console.log('🔄 User FX Marketplace - Loading initial data...');
    try {
      setLoading(true);
      setError(null);

      // Load currencies and payment methods
      const loadedCurrencies = fxService.getCurrencies();
      const loadedPaymentMethods = fxService.getPaymentMethods();

      console.log('✅ User FX Marketplace - Static data loaded:', {
        currenciesCount: loadedCurrencies.length,
        paymentMethodsCount: loadedPaymentMethods.length
      });

      setCurrencies(loadedCurrencies);
      setPaymentMethods(loadedPaymentMethods);

      // Load user data
      const user = await authService.getCachedUser();
      setCurrentUser(user);

      // Load offers
      await loadOffers();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load marketplace data';
      console.error('❌ User FX Marketplace - Initial load error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const [favorites, searches, watchlistData] = await Promise.all([
        AsyncStorage.getItem('favoriteOffers'),
        AsyncStorage.getItem('recentSearches'),
        AsyncStorage.getItem('currencyWatchlist'),
      ]);

      if (favorites) setFavoriteOffers(JSON.parse(favorites));
      if (searches) setRecentSearches(JSON.parse(searches));
      if (watchlistData) setWatchlist(JSON.parse(watchlistData));
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  const saveUserPreferences = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('favoriteOffers', JSON.stringify(favoriteOffers)),
        AsyncStorage.setItem('recentSearches', JSON.stringify(recentSearches)),
        AsyncStorage.setItem('currencyWatchlist', JSON.stringify(watchlist)),
      ]);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  };

  const loadOffers = async () => {
    console.log('🔄 User FX Marketplace - Loading offers...');
    try {
      const response = await fxService.getOffers({ sortBy: 'best_rate' });
      
      if (response.success) {
        console.log('✅ User FX Marketplace - Offers loaded successfully:', {
          offersCount: response.offers.length,
          isMockData: (response as any)._isMockData || false
        });
        setOffers(response.offers);
        setError(null);
      } else {
        console.error('❌ User FX Marketplace - Failed to load offers:', response.error);
        setError(response.error || 'Failed to load offers');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load offers';
      console.error('❌ User FX Marketplace - Load offers error:', err);
      setError(errorMessage);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 User FX Marketplace - Manual refresh triggered');
    setRefreshing(true);
    await loadOffers();
    setRefreshing(false);
  };

  const addToRecentSearches = (query: string) => {
    if (query.trim() && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      addToRecentSearches(text);
    }
  };

  const toggleFavoriteOffer = async (offerId: string) => {
    const updatedFavorites = favoriteOffers.includes(offerId)
      ? favoriteOffers.filter(id => id !== offerId)
      : [...favoriteOffers, offerId];
    
    setFavoriteOffers(updatedFavorites);
    await AsyncStorage.setItem('favoriteOffers', JSON.stringify(updatedFavorites));
  };

  const filteredOffers = useMemo(() => {
    if (!offers) return [];
    
    return offers.filter(offer => {
      // Search filter
      const searchMatch = searchQuery === '' || 
        offer.maker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.sellCurrency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.buyCurrency.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      return searchMatch;
    }).sort((a, b) => {
      // Sort by best rate (lowest margin first)
      return a.margin - b.margin;
    });
  }, [offers, searchQuery]);

  const getActiveTradeForOffer = (offerId: string): FXTrade | undefined => {
    return userActiveTrades.find(trade => {
      const matchesOffer = trade.offerId === offerId;
      const isActiveStatus = ['accepted', 'payment_pending', 'payment_sent', 'payment_confirmed'].includes(trade.status);
      
      // Double-check that trade is not expired (safety check)
      const isExpired = trade.timeWindows?.paymentDeadline && new Date() > new Date(trade.timeWindows.paymentDeadline);
      
      return matchesOffer && isActiveStatus && !isExpired;
    });
  };

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
    const activeTrade = getActiveTradeForOffer(offer.id);
    
    return (
      <Card style={[FXTheme.cards.base, { padding: Spacing.lg }]}>
        {/* Header with user info and timestamp */}
        <View style={[FXTheme.layouts.rowBetween, { marginBottom: Spacing.md }]}>
          <View style={FXTheme.layouts.row}>
            <View style={[
              {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.gray200,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: Spacing.sm,
              }
            ]}>
              <Typography variant="body1" style={{ color: Colors.gray600, fontWeight: 'bold' }}>
                {offer.maker.name.substring(0, 2).toUpperCase()}
              </Typography>
            </View>
            <View style={FXTheme.layouts.column}>
              <View style={FXTheme.layouts.row}>
                <Typography variant="h6" style={{ fontWeight: 'bold', marginRight: Spacing.xs }}>
                  {offer.maker.name}
                </Typography>
                <MaterialIcons name="star" size={16} color={Colors.warning} />
              </View>
              <Typography variant="caption" color="textSecondary">
                {offer.maker.completedTrades} trades • {Math.round(offer.maker.trustScore * 100)}% trust
              </Typography>
            </View>
            {offer.maker.onlineStatus === 'online' && (
              <View style={[
                {
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.success,
                  marginLeft: Spacing.xs,
                  marginTop: 4,
                }
              ]} />
            )}
          </View>
          <Typography variant="caption" color="textSecondary">
            5m ago
          </Typography>
        </View>

        {/* Currency exchange section */}
        <View style={[FXTheme.layouts.rowBetween, { marginBottom: Spacing.lg }]}>
          {/* Selling section */}
          <View style={FXTheme.layouts.column}>
            <Typography variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
              Selling
            </Typography>
            <Typography variant="h2" style={{ fontWeight: 'bold', marginBottom: Spacing.xs }}>
              {offer.sellCurrency.symbol}{(offer.availableAmount || offer.sellAmount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Typography>
            <View style={[FXTheme.layouts.row, { alignItems: 'center' }]}>
              <Typography variant="body1" style={{ marginRight: Spacing.xs }}>
                {offer.sellCurrency.flag}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {offer.sellCurrency.code}
              </Typography>
            </View>
          </View>

          {/* Exchange arrows and rate */}
          <View style={[FXTheme.layouts.column, { alignItems: 'center', flex: 1 }]}>
            <MaterialIcons name="swap-horiz" size={24} color={Colors.gray400} />
            <Typography variant="h6" style={{ fontWeight: 'bold', marginVertical: Spacing.xs }}>
              Rate: {Math.round(offer.exchangeRate)}
            </Typography>
            <View style={[
              {
                backgroundColor: Colors.success + '20',
                paddingHorizontal: Spacing.sm,
                paddingVertical: 2,
                borderRadius: BorderRadius.sm,
              }
            ]}>
              <Typography variant="caption" style={{ color: Colors.success, fontWeight: '600' }}>
                0.0%
              </Typography>
            </View>
          </View>

          {/* For section */}
          <View style={[FXTheme.layouts.column, { alignItems: 'flex-end' }]}>
            <Typography variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
              For
            </Typography>
            <Typography variant="h2" style={{ fontWeight: 'bold', marginBottom: Spacing.xs }}>
              {offer.buyCurrency.symbol}{offer.buyAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Typography>
            <View style={[FXTheme.layouts.row, { alignItems: 'center' }]}>
              <Typography variant="body1" style={{ marginRight: Spacing.xs }}>
                {offer.buyCurrency.flag}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {offer.buyCurrency.code}
              </Typography>
            </View>
          </View>
        </View>

        {/* Payment methods */}
        <View style={[FXTheme.layouts.row, { marginBottom: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray200 }]}>
          <Typography variant="caption" color="textSecondary" style={{ marginRight: Spacing.md }}>
            Payment:
          </Typography>
          {offer.paymentMethods.map((method, index) => (
            <View key={index} style={FXTheme.layouts.row}>
              <MaterialIcons name={method.icon as any} size={16} color={Colors.gray600} style={{ marginRight: 4 }} />
              <Typography variant="caption" style={{ color: Colors.gray600, marginRight: Spacing.md }}>
                {method.name}
              </Typography>
            </View>
          ))}
        </View>

        {/* Limits and details */}
        <View style={[FXTheme.layouts.rowBetween, { marginBottom: Spacing.lg }]}>
          <View style={FXTheme.layouts.column}>
            <Typography variant="caption" color="textSecondary">
              Limits:
            </Typography>
            <Typography variant="body2" style={{ fontWeight: '500' }}>
              {offer.sellCurrency.symbol}{offer.minTrade.toLocaleString()} - {offer.sellCurrency.symbol}{offer.maxTrade.toLocaleString()}
            </Typography>
          </View>
          <View style={FXTheme.layouts.column}>
            <Typography variant="caption" color="textSecondary">
              Window:
            </Typography>
            <Typography variant="body2" style={{ fontWeight: '500' }}>
              {offer.paymentWindow} min
            </Typography>
          </View>
          <View style={[FXTheme.layouts.column, { alignItems: 'flex-end' }]}>
            <Typography variant="caption" color="textSecondary">
              Available:
            </Typography>
            <Typography variant="body2" style={{ color: Colors.success, fontWeight: '600' }}>
              {offer.sellCurrency.symbol}{(offer.availableAmount || offer.sellAmount).toLocaleString()}
            </Typography>
          </View>
        </View>

        {/* Trade button and trade room icon */}
        <View style={[FXTheme.layouts.row, { alignItems: 'center', justifyContent: 'flex-end' }]}>
          {/* Trade Room Icon - show only if user has active trade with this merchant */}
          {activeTrade && onTradeRoomNavigate && (
            <TouchableOpacity
              style={[
                {
                  backgroundColor: Colors.success + '20',
                  borderColor: Colors.success,
                  borderWidth: 1,
                  borderRadius: BorderRadius.md,
                  padding: Spacing.sm,
                  marginRight: Spacing.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 44,
                  minHeight: 44,
                }
              ]}
              onPress={() => onTradeRoomNavigate(offer.id)}
            >
              <MaterialIcons name="chat" size={20} color={Colors.success} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              FXTheme.buttons.primary,
              {
                backgroundColor: activeTrade ? Colors.warning : Colors.primary,
                paddingVertical: Spacing.sm,
                paddingHorizontal: Spacing.lg,
                borderRadius: BorderRadius.md,
                minWidth: 100,
              }
            ]}
            onPress={() => onOfferSelect(offer)}
          >
            <Typography variant="body2" style={{ color: Colors.white, fontWeight: '600' }}>
              {activeTrade ? 'View Trade' : 'Trade Now'}
            </Typography>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

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

        {/* My Trades Button */}
        {onViewMyTrades && (
          <TouchableOpacity 
            style={styles.myTradesButton}
            onPress={onViewMyTrades}
          >
            <MaterialIcons name="history" size={24} color={Colors.gray700} />
            {userActiveTrades.length > 0 && (
              <View style={styles.counterBadge}>
                <Typography variant="caption" style={styles.counterText}>
                  {userActiveTrades.length > 99 ? '99+' : userActiveTrades.length}
                </Typography>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={FXTheme.inputs.container}>
        <View style={FXTheme.inputs.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.gray600} />
          <TextInput
            style={FXTheme.inputs.searchInput}
            placeholder="Search by currency or trader..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={Colors.gray600}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color={Colors.gray600} />
            </TouchableOpacity>
          )}
        </View>
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={FXTheme.states.empty}>
              <MaterialIcons name="currency-exchange" size={64} color={Colors.gray400} />
              <Typography variant="h6" style={FXTheme.states.emptyTitle}>
                No offers found
              </Typography>
              <Typography variant="body2" color="textSecondary" style={FXTheme.states.emptyText}>
                Try adjusting your search terms
              </Typography>
            </View>
          }
        />
      )}

      {/* Modals */}
    </View>
  );
};

const styles = StyleSheet.create({
  myTradesButton: {
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
    backgroundColor: Colors.primary,
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
});