import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { FXOffer, FXFilter, Currency, PaymentMethod } from '../../types/fx';

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
    icon: 'account-balance',
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
    sellCurrency: CURRENCIES.find(c => c.code === 'CNY')!,
    buyCurrency: CURRENCIES.find(c => c.code === 'NGN')!,
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
    sellCurrency: CURRENCIES.find(c => c.code === 'USD')!,
    buyCurrency: CURRENCIES.find(c => c.code === 'NGN')!,
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
    sellCurrency: CURRENCIES.find(c => c.code === 'EUR')!,
    buyCurrency: CURRENCIES.find(c => c.code === 'USDC')!,
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

  // Mock user data - this would come from user context/store in real app
  const mockUser = {
    balance: 800, // Less than $1000 to show eligibility gate
    isMerchant: false,
  };

  const checkUserEligibility = () => {
    // Check if user has at least $1000 balance for merchant eligibility
    return mockUser.balance >= 1000;
  };

  const handleCreateOffer = () => {
    if (!checkUserEligibility()) {
      setShowEligibilityModal(true);
      return;
    }
    onCreateOffer();
  };

  const filteredOffers = useMemo(() => {
    let offers = MOCK_OFFERS.filter(offer => {
      const matchesSearch = 
        offer.maker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.sellCurrency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.buyCurrency.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesOnlineFilter = !filters.onlineOnly || offer.maker.onlineStatus === 'online';
      const matchesCurrency = 
        (!filters.sellCurrency || offer.sellCurrency.code === filters.sellCurrency) &&
        (!filters.buyCurrency || offer.buyCurrency.code === filters.buyCurrency);
      
      return matchesSearch && matchesOnlineFilter && matchesCurrency;
    });

    // Sort offers
    offers.sort((a, b) => {
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

    return offers;
  }, [searchQuery, filters]);

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
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <MaterialIcons name="arrow-forward" size={20} color={Colors.textSecondary} style={styles.arrowIcon} />

          <View style={styles.filterGroup}>
            <Typography variant="caption" color="textSecondary">Receive</Typography>
            <TouchableOpacity style={styles.currencyFilter}>
              <Typography variant="body2" style={styles.filterText}>
                {filters.buyCurrency || 'Any'}
              </Typography>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.textSecondary} />
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

  const renderTrustBadge = (badge: string | null) => {
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
                <Typography variant="caption" color="textSecondary">
                  Responds in {offer.maker.responseTime}
                </Typography>
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
                <View style={[styles.marginBadge, {
                  backgroundColor: isGoodRate ? Colors.success + '20' : Colors.warning + '20'
                }]}>
                  <Typography variant="caption" style={[styles.marginText, {
                    color: isGoodRate ? Colors.success : Colors.warning
                  }]}>
                    {offer.margin > 0 ? '+' : ''}{offer.margin.toFixed(1)}%
                  </Typography>
                </View>
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
            size="small"
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
            placeholder="Search traders, currencies..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters */}
      {renderFilters()}

      {/* Market Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Typography variant="caption" color="textSecondary">24h Volume</Typography>
          <Typography variant="h6" color="primary">$2.4M</Typography>
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption" color="textSecondary">Active Offers</Typography>
          <Typography variant="h6" color="secondary">{filteredOffers.length}</Typography>
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption" color="textSecondary">Online Traders</Typography>
          <Typography variant="h6" color="success">
            {filteredOffers.filter(o => o.maker.onlineStatus === 'online').length}
          </Typography>
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption" color="textSecondary">Avg Response</Typography>
          <Typography variant="h6">~8 min</Typography>
        </Card>
      </ScrollView>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredOffers}
          keyExtractor={(item) => item.id}
          renderItem={renderOfferCard}
          contentContainerStyle={styles.offersList}
          showsVerticalScrollIndicator={false}
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
                  <MaterialIcons 
                    name={mockUser.balance >= 1000 ? "check-circle" : "cancel"} 
                    size={20} 
                    color={mockUser.balance >= 1000 ? Colors.success : Colors.error} 
                  />
                  <Typography variant="body2" style={styles.requirementText}>
                    Minimum wallet balance: $1,000
                  </Typography>
                </View>
                <Typography variant="caption" color="textSecondary" style={styles.balanceInfo}>
                  Your current balance: ${mockUser.balance.toLocaleString()}
                </Typography>
                
                <View style={styles.requirementItem}>
                  <MaterialIcons name="verified-user" size={20} color={Colors.info} />
                  <Typography variant="body2" style={styles.requirementText}>
                    Complete merchant application
                  </Typography>
                </View>
                
                <View style={styles.requirementItem}>
                  <MaterialIcons name="account-balance" size={20} color={Colors.info} />
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
                title="Add Funds"
                onPress={() => {
                  setShowEligibilityModal(false);
                  // TODO: Navigate to add funds screen
                  Alert.alert('Add Funds', 'This would navigate to the add funds screen');
                }}
                style={styles.modalPrimaryButton}
                disabled={mockUser.balance >= 1000}
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
    marginBottom: Spacing.md,
  },
  statCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginRight: Spacing.md,
    minWidth: 100,
    alignItems: 'center',
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
});