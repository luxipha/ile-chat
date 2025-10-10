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
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { FXOffer, FXFilter, Currency, PaymentMethod } from '../../types/fx';
import fxService, { FXDebugUtils } from '../../services/fxService';

interface FXMarketplaceProps {
  onOfferSelect: (offer: FXOffer) => void;
  onCreateOffer: () => void;
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

  // Mock user data - this would come from user context/store in real app
  const mockUser = {
    balance: 800, // Less than $1000 to show eligibility gate
    isMerchant: false,
  };

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load offers when filters change
  useEffect(() => {
    if (currencies.length > 0) { // Only load offers after currencies are loaded
      loadOffers();
    }
  }, [filters]);

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
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Typography variant="caption" color="textSecondary">Pay with</Typography>
            <TouchableOpacity style={styles.currencyFilter}>
              <Typography variant="body2" style={styles.filterText}>
                {filters.sellCurrency || 'Any'} 
              </Typography>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          <MaterialIcons name="arrow-forward" size={20} color={Colors.gray600} style={styles.arrowIcon} />

          <View style={styles.filterGroup}>
            <Typography variant="caption" color="textSecondary">Receive</Typography>
            <TouchableOpacity style={styles.currencyFilter}>
              <Typography variant="body2" style={styles.filterText}>
                {filters.buyCurrency || 'Any'}
              </Typography>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterGroup}>
            <Typography variant="caption" color="textSecondary">Sort by</Typography>
            <TouchableOpacity 
              style={styles.sortFilter}
              onPress={() => {
                const sortOptions: FXFilter['sortBy'][] = ['best_rate', 'fastest', 'highest_trust', 'most_trades'];
                const currentIndex = sortOptions.indexOf(filters.sortBy);
                const nextIndex = (currentIndex + 1) % sortOptions.length;
                setFilters({...filters, sortBy: sortOptions[nextIndex]});
              }}
            >
              <Typography variant="body2" style={styles.filterText}>
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
      <View style={[styles.trustBadge, { backgroundColor: config.color + '20' }]}>
        <MaterialIcons name={config.icon as any} size={12} color={config.color} />
      </View>
    );
  };

  const renderOfferCard = ({ item: offer }: { item: FXOffer }) => {
    const timeAgo = Math.round((Date.now() - offer.updatedAt.getTime()) / (1000 * 60));
    const isGoodRate = offer.margin <= 0;
    
    // Debug logging for amounts
    console.log('📊 [FXMarketplace] Offer amounts:', {
      id: offer.id,
      sellAmount: offer.sellAmount,
      buyAmount: offer.buyAmount,
      availableAmount: offer.availableAmount,
      exchangeRate: offer.exchangeRate,
      sellCurrency: offer.sellCurrency.code,
      buyCurrency: offer.buyCurrency.code
    });
    
    return (
      <TouchableOpacity onPress={() => onOfferSelect(offer)}>
        <Card style={styles.offerCard}>
          {/* Header with trader info */}
          <View style={styles.offerHeader}>
            <View style={styles.traderInfo}>
              <View style={styles.traderAvatarContainer}>
                <View style={styles.traderAvatar}>
                  <Typography variant="caption" style={styles.traderAvatarText}>
                    {offer.maker.name.substring(0, 2).toUpperCase()}
                  </Typography>
                </View>
                {renderTrustBadge(offer.maker.trustBadge)}
                <View style={[styles.onlineIndicator, {
                  backgroundColor: offer.maker.onlineStatus === 'online' ? Colors.success : 
                                 offer.maker.onlineStatus === 'away' ? Colors.warning : Colors.gray400
                }]} />
              </View>
              
              <View style={styles.traderDetails}>
                <Typography variant="h6" style={styles.traderName}>
                  {offer.maker.name}
                </Typography>
                <View style={styles.traderStats}>
                  <Typography variant="caption" color="textSecondary">
                    {offer.maker.completedTrades} trades • {offer.maker.trustScore}% trust
                  </Typography>
                </View>
              </View>
            </View>
            
            <Typography variant="caption" color="textSecondary">
              {timeAgo}m ago
            </Typography>
          </View>

          {/* Trade details */}
          <View style={styles.tradeDetails}>
            <View style={styles.currencyRow}>
              <View style={styles.sellSide}>
                <Typography variant="caption" color="textSecondary">Selling</Typography>
                <View style={styles.currencyInfo}>
                  <Typography variant="h4" style={styles.currencyFlag}>
                    {offer.sellCurrency.flag}
                  </Typography>
                  <View>
                    <Typography variant="h6" style={styles.amount}>
                      {offer.sellCurrency.symbol}{offer.sellAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {offer.sellCurrency.code}
                    </Typography>
                  </View>
                </View>
              </View>

              <View style={styles.exchangeRate}>
                <MaterialIcons name="swap-horiz" size={24} color={Colors.primary} />
                <Typography variant="body2" color="primary" style={styles.rateText}>
                  Rate: {offer.exchangeRate}
                </Typography>
              </View>

              <View style={styles.buySide}>
                <Typography variant="caption" color="textSecondary">For</Typography>
                <View style={styles.currencyInfo}>
                  <Typography variant="h4" style={styles.currencyFlag}>
                    {offer.buyCurrency.flag}
                  </Typography>
                  <View>
                    <Typography variant="h6" style={styles.amount}>
                      {offer.buyCurrency.symbol}{offer.buyAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {offer.buyCurrency.code}
                    </Typography>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Payment methods */}
          <View style={styles.paymentMethods}>
            <Typography variant="caption" color="textSecondary">Payment:</Typography>
            <View style={styles.methodsList}>
              {offer.paymentMethods.map((method, index) => (
                <View key={method.id} style={styles.methodBadge}>
                  <MaterialIcons name={method.icon as any} size={12} color={Colors.primary} />
                  <Typography variant="caption" style={styles.methodText}>
                    {method.name}
                  </Typography>
                </View>
              ))}
            </View>
          </View>

          {/* Trade terms */}
          <View style={styles.tradeTerms}>
            <View style={styles.termItem}>
              <Typography variant="caption" color="textSecondary">Limits:</Typography>
              <Typography variant="caption">
                {offer.sellCurrency.symbol}{offer.minTrade} - {offer.sellCurrency.symbol}{offer.maxTrade}
              </Typography>
            </View>
            <View style={styles.termItem}>
              <Typography variant="caption" color="textSecondary">Window:</Typography>
              <Typography variant="caption">{offer.paymentWindow} min</Typography>
            </View>
            <View style={styles.termItem}>
              <Typography variant="caption" color="textSecondary">Available:</Typography>
              <Typography variant="caption" color="success">
                {offer.sellCurrency.symbol}{offer.availableAmount.toLocaleString()}
              </Typography>
            </View>
          </View>

          <Button
            title="Trade Now"
            onPress={() => onOfferSelect(offer)}
            style={styles.tradeButton}
            size="sm"
          />
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="currency-exchange" size={48} color={Colors.gray400} />
      <Typography variant="h6" style={styles.emptyTitle}>
        No offers found
      </Typography>
      <Typography variant="body2" color="textSecondary" style={styles.emptyText}>
        Try adjusting your filters or create your own offer
      </Typography>
      <Button
        title="Create Offer"
        onPress={handleCreateOffer}
        style={styles.createOfferButton}
        variant="outline"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Typography variant="h3">FX Marketplace</Typography>
          <Typography variant="body2" color="textSecondary">
            {filteredOffers.length} offers available
          </Typography>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateOffer}>
          <MaterialIcons name="add" size={24} color={Colors.background} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search traders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters */}
      {renderFilters()}



      {/* Offers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Typography variant="body1" style={styles.loadingText}>
            Loading offers...
          </Typography>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          <Typography variant="h6" style={styles.errorTitle}>
            Failed to load offers
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.errorText}>
            {error}
          </Typography>
          <Button
            title="Retry"
            onPress={loadOffers}
            style={styles.retryButton}
            variant="outline"
          />
          <Button
            title="Debug Info"
            onPress={async () => {
              const debugData = await FXDebugUtils.exportDebugLogs();
              Alert.alert('Debug Info', 'Check console for debug logs');
            }}
            style={styles.debugButton}
            variant="ghost"
            size="sm"
          />
        </View>
      ) : filteredOffers.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredOffers}
          keyExtractor={(item) => item.id}
          renderItem={renderOfferCard}
          contentContainerStyle={styles.offersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}

      {/* Eligibility Modal */}
      <Modal visible={showEligibilityModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="account-balance-wallet" size={48} color={Colors.primary} />
              <Typography variant="h5" style={styles.modalTitle}>
                Merchant Requirements
              </Typography>
            </View>
            
            <View style={styles.modalBody}>
              <Typography variant="body1" style={styles.modalText}>
                To create FX offers, you need to become a merchant. Here are the requirements:
              </Typography>
              
              <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                  <Typography variant="body2" style={styles.requirementText}>
                    Complete merchant application
                  </Typography>
                </View>
                
                <View style={styles.requirementItem}>
                  <MaterialIcons name="account-balance-wallet" size={20} color={Colors.info} />
                  <Typography variant="body2" style={styles.requirementText}>
                    Provide bank account details
                  </Typography>
                </View>
              </View>
              
              <Typography variant="body2" color="textSecondary" style={styles.modalSubtext}>
                Once approved, you can create unlimited FX offers and earn from trading fees.
              </Typography>
            </View>
            
            <View style={styles.modalButtons}>
              <Button
                title="Apply as Merchant"
                onPress={() => {
                  setShowEligibilityModal(false);
                  // TODO: Navigate to merchant application screen
                  Alert.alert('Merchant Application', 'This would navigate to the merchant application screen');
                }}
                style={styles.modalPrimaryButton}
              />
              <Button
                title="Close"
                onPress={() => setShowEligibilityModal(false)}
                style={styles.modalSecondaryButton}
                variant="outline"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  filterGroup: {
    alignItems: 'center',
  },
  currencyFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  sortFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  filterText: {
    marginRight: Spacing.xs,
    fontWeight: '500',
  },
  arrowIcon: {
    marginTop: Spacing.md,
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    maxHeight: 60, // Limit the height of stats container
  },
  statCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    minWidth: 90,
    maxHeight: 50, // Limit card height
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  offersList: {
    paddingHorizontal: Spacing.lg,
  },
  offerCard: {
    marginBottom: Spacing.md,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  traderInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  traderAvatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  traderAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  traderAvatarText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  trustBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  traderDetails: {
    flex: 1,
  },
  traderName: {
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  traderStats: {
    marginBottom: Spacing.xs / 2,
  },
  tradeDetails: {
    marginBottom: Spacing.md,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellSide: {
    flex: 1,
  },
  buySide: {
    flex: 1,
    alignItems: 'flex-end',
  },
  exchangeRate: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  currencyFlag: {
    marginRight: Spacing.sm,
  },
  amount: {
    fontWeight: '600',
  },
  rateText: {
    marginVertical: Spacing.xs,
    fontWeight: '600',
  },
  marginBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  marginText: {
    fontWeight: '600',
    fontSize: 10,
  },
  paymentMethods: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  methodsList: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
    gap: Spacing.sm,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.sm,
  },
  methodText: {
    marginLeft: Spacing.xs / 2,
    color: Colors.primary,
    fontWeight: '500',
    fontSize: 10,
  },
  tradeTerms: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    marginBottom: Spacing.md,
  },
  termItem: {
    alignItems: 'center',
  },
  tradeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginVertical: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  createOfferButton: {
    paddingHorizontal: Spacing.xl,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    marginTop: Spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalBody: {
    marginBottom: Spacing.lg,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  requirementsList: {
    marginBottom: Spacing.lg,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  requirementText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  balanceInfo: {
    marginLeft: Spacing.xl + 8,
    marginBottom: Spacing.md,
  },
  modalSubtext: {
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    gap: Spacing.md,
  },
  modalPrimaryButton: {
    width: '100%',
  },
  modalSecondaryButton: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.gray600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl * 2,
  },
  errorTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    marginBottom: Spacing.md,
    minWidth: 120,
  },
  debugButton: {
    minWidth: 100,
  },
});