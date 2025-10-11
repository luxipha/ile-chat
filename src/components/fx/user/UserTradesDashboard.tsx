import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../../theme';
import { FXTheme, FXColors } from '../../../theme/fxTheme';
import { FXTrade, Currency } from '../../../types/fx';
import fxService from '../../../services/fxService';
import authService from '../../../services/authService';

interface UserTradesDashboardProps {
  onTradeSelect: (trade: FXTrade) => void;
  onBack?: () => void;
}

export const UserTradesDashboard: React.FC<UserTradesDashboardProps> = ({
  onTradeSelect,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trades, setTrades] = useState<FXTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        // TODO: Replace with actual getCurrentUser method when available
        const user = { id: '2', name: 'Current User' }; // Mock user for now
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  // Load user's trades
  const loadTrades = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call to get user's trades
      // For now, using mock data filtered by current user
      const mockTrades: FXTrade[] = [
        {
          id: 'trade_1',
          offerId: 'offer_1',
          maker: {
            id: '1',
            name: 'Alice Chen',
            avatar: undefined,
            trustScore: 95,
            trustBadge: 'verified',
            completedTrades: 127,
            responseTime: '~5 minutes',
            onlineStatus: 'online',
          },
          taker: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: undefined,
            trustScore: 85,
          },
          sellCurrency: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', type: 'fiat' },
          buyCurrency: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', type: 'fiat' },
          sellAmount: 1000,
          buyAmount: 750000,
          exchangeRate: 750,
          paymentMethod: {
            id: 'bank_ng',
            name: 'Nigerian Bank',
            type: 'bank',
            icon: 'account-balance-wallet',
            processingTime: '5-15 minutes',
            limits: { min: 1000, max: 5000000 },
          },
          escrowAmount: 1000,
          escrowCurrency: 'USDC',
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          quoteLockExpiry: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          paymentWindow: {
            start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          },
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
          chatRoomId: 'chat_trade_1',
        },
        {
          id: 'trade_2',
          offerId: 'offer_2',
          maker: {
            id: '3',
            name: 'Bob Wilson',
            avatar: undefined,
            trustScore: 88,
            trustBadge: 'premium',
            completedTrades: 89,
            responseTime: '~8 minutes',
            onlineStatus: 'online',
          },
          taker: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: undefined,
            trustScore: 85,
          },
          sellCurrency: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', type: 'fiat' },
          buyCurrency: { code: 'USDC', name: 'USD Coin', symbol: 'USDC', flag: '💰', type: 'crypto' },
          sellAmount: 5000,
          buyAmount: 700,
          exchangeRate: 0.14,
          paymentMethod: {
            id: 'alipay',
            name: 'Alipay',
            type: 'digital_wallet',
            icon: 'payment',
            processingTime: '1-5 minutes',
            limits: { min: 100, max: 50000 },
          },
          escrowAmount: 700,
          escrowCurrency: 'USDC',
          status: 'payment_pending',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          quoteLockExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
          paymentWindow: {
            start: new Date(Date.now() - 30 * 60 * 1000),
            end: new Date(Date.now() + 30 * 60 * 1000),
          },
          chatRoomId: 'chat_trade_2',
        },
        {
          id: 'trade_3',
          offerId: 'offer_3',
          maker: {
            id: '4',
            name: 'Carol Davis',
            avatar: undefined,
            trustScore: 92,
            trustBadge: 'pro',
            completedTrades: 156,
            responseTime: '~3 minutes',
            onlineStatus: 'away',
          },
          taker: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: undefined,
            trustScore: 85,
          },
          sellCurrency: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', type: 'fiat' },
          buyCurrency: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', type: 'fiat' },
          sellAmount: 800,
          buyAmount: 850,
          exchangeRate: 1.0625,
          paymentMethod: {
            id: 'bank_us',
            name: 'US Bank Wire',
            type: 'bank',
            icon: 'account-balance',
            processingTime: '30-60 minutes',
            limits: { min: 500, max: 100000 },
          },
          escrowAmount: 850,
          escrowCurrency: 'USDC',
          status: 'disputed',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          quoteLockExpiry: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          paymentWindow: {
            start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            end: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          },
          chatRoomId: 'chat_trade_3',
          disputeReason: 'Payment not received',
        },
      ];

      setTrades(mockTrades);
    } catch (err) {
      console.error('Failed to load trades:', err);
      setError('Failed to load trades. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadTrades();
    }
  }, [currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrades();
    setRefreshing(false);
  };

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    let filtered = trades.filter(trade => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          trade.sellCurrency.code.toLowerCase().includes(query) ||
          trade.sellCurrency.name.toLowerCase().includes(query) ||
          trade.buyCurrency.code.toLowerCase().includes(query) ||
          trade.buyCurrency.name.toLowerCase().includes(query) ||
          trade.maker.name.toLowerCase().includes(query) ||
          trade.id.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && trade.status !== statusFilter) {
        return false;
      }

      return true;
    });

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return filtered;
  }, [trades, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'payment_pending':
      case 'payment_sent':
        return Colors.warning;
      case 'disputed':
      case 'cancelled':
        return Colors.error;
      case 'pending':
      case 'accepted':
        return Colors.info;
      default:
        return Colors.gray600;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'payment_pending':
        return 'Payment Pending';
      case 'payment_sent':
        return 'Payment Sent';
      case 'disputed':
        return 'Disputed';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const renderTradeCard = ({ item: trade }: { item: FXTrade }) => {
    const statusColor = getStatusColor(trade.status);
    const statusText = getStatusText(trade.status);
    
    return (
      <TouchableOpacity onPress={() => onTradeSelect(trade)}>
        <Card style={FXTheme.cards.base}>
          {/* Trade Header */}
          <View style={FXTheme.layouts.rowBetween}>
            <View style={FXTheme.headers.content}>
              <Typography variant="body2" style={FXTheme.text.bold}>
                Trade #{trade.id.slice(-6).toUpperCase()}
              </Typography>
              <Typography variant="caption" style={{ color: Colors.gray600 }}>
                {trade.createdAt.toLocaleDateString()}
              </Typography>
            </View>
            
            <View style={[FXTheme.badges.status, { backgroundColor: statusColor + '20' }]}>
              <Typography 
                variant="caption" 
                style={[FXTheme.text.bold, { 
                  color: statusColor,
                  fontSize: 10 
                }]}
              >
                {statusText.toUpperCase()}
              </Typography>
            </View>
          </View>

          {/* Trade Details */}
          <View style={FXTheme.cards.section}>
            <View style={FXTheme.currency.pair}>
              <View style={FXTheme.currency.side}>
                <Typography variant="caption" style={{ color: Colors.gray600 }}>You Sold</Typography>
                <View style={FXTheme.currency.info}>
                  <Typography style={FXTheme.currency.flag}>
                    {trade.sellCurrency.flag}
                  </Typography>
                  <View>
                    <Typography variant="body2" style={FXTheme.text.amount}>
                      {trade.sellCurrency.symbol}{trade.sellAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" style={{ color: Colors.gray600 }}>
                      {trade.sellCurrency.code}
                    </Typography>
                  </View>
                </View>
              </View>

              <View style={FXTheme.currency.exchangeInfo}>
                <MaterialIcons name="swap-horiz" size={20} color={Colors.gray400} />
                <Typography variant="caption" style={FXTheme.text.rate}>
                  {trade.exchangeRate.toFixed(4)}
                </Typography>
              </View>

              <View style={FXTheme.currency.sideRight}>
                <Typography variant="caption" style={{ color: Colors.gray600 }}>You Bought</Typography>
                <View style={FXTheme.currency.info}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Typography variant="body2" style={FXTheme.text.amount}>
                      {trade.buyCurrency.symbol}{trade.buyAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" style={{ color: Colors.gray600 }}>
                      {trade.buyCurrency.code}
                    </Typography>
                  </View>
                  <Typography style={FXTheme.currency.flag}>
                    {trade.buyCurrency.flag}
                  </Typography>
                </View>
              </View>
            </View>

            {/* Trader Info */}
            <View style={FXTheme.layouts.row}>
              <MaterialIcons name="person" size={16} color={Colors.gray600} />
              <Typography variant="body2" style={[FXTheme.spacing.marginHorizontal('sm'), { flex: 1 }]}>
                Traded with {trade.maker.name}
              </Typography>
              <View style={FXTheme.layouts.row}>
                <MaterialIcons name="star" size={12} color={Colors.warning} />
                <Typography variant="caption" style={{ color: Colors.gray600, marginLeft: 2 }}>
                  {trade.maker.trustScore}%
                </Typography>
              </View>
            </View>

            {/* Payment Method */}
            <View style={FXTheme.layouts.row}>
              <MaterialIcons name="payment" size={16} color={Colors.gray600} />
              <Typography variant="body2" style={FXTheme.spacing.marginHorizontal('sm')}>
                {trade.paymentMethod.name}
              </Typography>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderStatusFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={FXTheme.stats.container}
    >
      {[
        { key: 'all', label: 'All', count: trades.length },
        { key: 'completed', label: 'Completed', count: trades.filter(t => t.status === 'completed').length },
        { key: 'payment_pending', label: 'Pending', count: trades.filter(t => t.status === 'payment_pending').length },
        { key: 'disputed', label: 'Disputed', count: trades.filter(t => t.status === 'disputed').length },
      ].map((filter) => (
        <TouchableOpacity
          key={filter.key}
          onPress={() => setStatusFilter(filter.key)}
          style={[
            FXTheme.cards.stat,
            statusFilter === filter.key && { backgroundColor: Colors.primary + '10', borderColor: Colors.primary }
          ]}
        >
          <Typography 
            variant="caption" 
            style={[
              FXTheme.stats.label, 
              { color: statusFilter === filter.key ? Colors.primary : Colors.gray600 }
            ]}
          >
            {filter.label}
          </Typography>
          <Typography 
            variant="h3" 
            style={[
              FXTheme.stats.value,
              { color: statusFilter === filter.key ? Colors.primary : Colors.gray800 }
            ]}
          >
            {filter.count}
          </Typography>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={FXTheme.states.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Typography variant="body2" style={FXTheme.states.loadingText}>
          Loading your trades...
        </Typography>
      </View>
    );
  }

  if (error) {
    return (
      <View style={FXTheme.states.error}>
        <MaterialIcons name="error-outline" size={48} color={Colors.error} />
        <Typography variant="h3" style={FXTheme.states.errorTitle}>
          Failed to load trades
        </Typography>
        <Typography variant="body2" style={[FXTheme.states.errorText, { color: Colors.gray600 }]}>
          {error}
        </Typography>
        <Button
          title="Retry"
          onPress={loadTrades}
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
          <Typography variant="h2">My Trades</Typography>
          <Typography variant="body2" color="textSecondary">
            View your trading history
          </Typography>
        </View>
      </View>

      {/* Status Filter */}
      {renderStatusFilter()}

      {/* Search */}
      <View style={FXTheme.inputs.container}>
        <View style={FXTheme.inputs.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.gray500} />
          <TextInput
            style={FXTheme.inputs.searchInput}
            placeholder="Search trades..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.gray500}
          />
        </View>
      </View>

      {/* Trades List */}
      <FlatList
        data={filteredTrades}
        renderItem={renderTradeCard}
        keyExtractor={(item) => item.id}
        style={FXTheme.containers.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={FXTheme.states.empty}>
            <MaterialIcons name="swap-horiz" size={64} color={Colors.gray400} />
            <Typography variant="h3" style={FXTheme.states.emptyTitle}>
              No trades yet
            </Typography>
            <Typography variant="body2" style={[FXTheme.states.emptyText, { color: Colors.gray600 }]}>
              {statusFilter === 'all' 
                ? "You haven't made any trades yet. Start trading to see your history here."
                : `No ${statusFilter.replace('_', ' ')} trades found.`
              }
            </Typography>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  retryButton: {
    marginBottom: Spacing.md,
    minWidth: 120,
  },
});