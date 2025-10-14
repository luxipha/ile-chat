import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Colors, Spacing } from '../../../theme';
import { FXTheme } from '../../../theme/fxTheme';
import { FXTrade } from '../../../types/fx';
import { User } from '../../../services/authService';
import fxService from '../../../services/fxService';

interface PendingTradesScreenProps {
  onBack: () => void;
  onTradeSelect: (trade: FXTrade) => void;
  currentUser: User | null;
}

type TradeTab = 'active' | 'completed' | 'cancelled';

export const PendingTradesScreen: React.FC<PendingTradesScreenProps> = ({
  onBack,
  onTradeSelect,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<TradeTab>('active');
  const [activeTrades, setActiveTrades] = useState<FXTrade[]>([]);
  const [completedTrades, setCompletedTrades] = useState<FXTrade[]>([]);
  const [cancelledTrades, setCancelledTrades] = useState<FXTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load all trades and categorize them
  const loadTrades = async (isRefresh = false) => {
    if (!currentUser) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Get all trades where current user is the merchant
      const response = await fxService.getUserTrades({ limit: 100, offset: 0 });
      
      if (response.success) {
        const myTrades = response.trades.filter(trade => 
          trade.maker?.id === currentUser.id || trade.merchant?.id === currentUser.id
        );
        
        // Categorize trades by status
        const active = myTrades.filter(trade => 
          ['pending_acceptance', 'accepted', 'payment_pending', 'payment_sent', 'buyer_payment_sent', 'merchant_payment_sent', 'both_payments_sent', 'payment_confirmed'].includes(trade.status)
        );
        
        const completed = myTrades.filter(trade => 
          trade.status === 'completed'
        );
        
        const cancelled = myTrades.filter(trade => 
          ['cancelled', 'disputed'].includes(trade.status)
        );
        
        console.log('📋 [PendingTradesScreen] Loaded all trades:', {
          totalTrades: response.trades.length,
          myTrades: myTrades.length,
          active: active.length,
          completed: completed.length,
          cancelled: cancelled.length,
          merchantId: currentUser.id
        });
        
        setActiveTrades(active);
        setCompletedTrades(completed);
        setCancelledTrades(cancelled);
      }
    } catch (error) {
      console.error('Failed to load pending trades:', error);
      Alert.alert('Error', 'Failed to load pending trades');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle accepting a trade request
  const handleAcceptTrade = async (trade: FXTrade) => {
    try {
      console.log('✅ Accepting trade request:', trade.id);
      
      const response = await fxService.updateTradeStatus(trade.id, 'accepted');
      
      if (response.success) {
        // Remove from active trades and navigate to trade room
        setActiveTrades(prev => prev.filter(t => t.id !== trade.id));
        Alert.alert('Success', 'Trade request accepted! Opening trade room...', [
          {
            text: 'OK',
            onPress: () => onTradeSelect(trade)
          }
        ]);
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
    Alert.alert(
      'Decline Trade',
      'Are you sure you want to decline this trade request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fxService.updateTradeStatus(trade.id, 'cancelled');
              
              if (response.success) {
                setActiveTrades(prev => prev.filter(t => t.id !== trade.id));
                Alert.alert('Success', 'Trade request declined');
              } else {
                Alert.alert('Error', response.error || 'Failed to decline trade request');
              }
            } catch (error) {
              console.error('Failed to decline trade:', error);
              Alert.alert('Error', 'Failed to decline trade request');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadTrades();
  }, [currentUser]);

  const renderTradeCard = (trade: FXTrade) => {
    const isExpired = trade.timeWindows?.paymentDeadline && new Date() > new Date(trade.timeWindows.paymentDeadline);
    const isPendingAcceptance = trade.status === 'pending_acceptance';
    const isCompleted = trade.status === 'completed';
    const isCancelled = ['cancelled', 'disputed'].includes(trade.status);
    
    return (
      <Card key={trade.id} style={styles.tradeCard}>
        <View style={FXTheme.layouts.rowBetween}>
          <View style={FXTheme.layouts.column}>
            <Typography variant="h6" style={FXTheme.text.bold}>
              {trade.taker?.name || trade.buyer?.name || 'Unknown'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ID: {trade.id.substring(0, 8)}...
            </Typography>
          </View>
          
          <View style={[FXTheme.layouts.column, { alignItems: 'flex-end' }]}>
            <Typography variant="caption" color="textSecondary">
              {new Date(trade.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {new Date(trade.createdAt).toLocaleTimeString()}
            </Typography>
            {isExpired && (
              <Typography variant="caption" color="error" style={FXTheme.text.bold}>
                EXPIRED
              </Typography>
            )}
          </View>
        </View>

        <View style={[FXTheme.layouts.center, { marginVertical: Spacing.md }]}>
          <Typography variant="body2" color="textSecondary">
            They want to buy
          </Typography>
          <Typography variant="h5" color="primary">
            {trade.sellCurrency.symbol}{trade.sellAmount.toLocaleString()} {trade.sellCurrency.code}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            For
          </Typography>
          <Typography variant="h5">
            {trade.buyCurrency.symbol}{trade.buyAmount.toLocaleString()} {trade.buyCurrency.code}
          </Typography>
          <Typography variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
            Rate: 1 {trade.sellCurrency.code} = {trade.exchangeRate} {trade.buyCurrency.code}
          </Typography>
        </View>

        {isExpired ? (
          <View style={FXTheme.layouts.center}>
            <Typography variant="body2" color="error" style={FXTheme.text.bold}>
              Trade Expired - Will be auto-cancelled
            </Typography>
          </View>
        ) : isCompleted ? (
          <View style={FXTheme.layouts.center}>
            <Typography variant="body2" color="success" style={FXTheme.text.bold}>
              ✅ Trade Completed
            </Typography>
          </View>
        ) : isCancelled ? (
          <View style={FXTheme.layouts.center}>
            <Typography variant="body2" color="error" style={FXTheme.text.bold}>
              ❌ Trade {trade.status === 'disputed' ? 'Disputed' : 'Cancelled'}
            </Typography>
          </View>
        ) : isPendingAcceptance ? (
          <View style={FXTheme.layouts.row}>
            <Button
              title="Decline"
              onPress={() => handleDeclineTrade(trade)}
              style={{ flex: 1, marginRight: Spacing.sm }}
              variant="outline"
            />
            <Button
              title="Accept"
              onPress={() => handleAcceptTrade(trade)}
              style={{ flex: 1 }}
              variant="primary"
            />
          </View>
        ) : (
          <Button
            title="View Trade Room"
            onPress={() => onTradeSelect(trade)}
            style={{ width: '100%' }}
            variant="primary"
          />
        )}
      </Card>
    );
  };

  const getCurrentTrades = () => {
    switch (activeTab) {
      case 'active':
        return activeTrades;
      case 'completed':
        return completedTrades;
      case 'cancelled':
        return cancelledTrades;
      default:
        return activeTrades;
    }
  };

  const getEmptyStateText = () => {
    switch (activeTab) {
      case 'active':
        return {
          title: 'No Active Trades',
          description: 'When users trade with your offers, they\'ll appear here for you to manage.'
        };
      case 'completed':
        return {
          title: 'No Completed Trades',
          description: 'Your completed trades will appear here once you finish transactions.'
        };
      case 'cancelled':
        return {
          title: 'No Cancelled Trades',
          description: 'Cancelled or disputed trades will appear here.'
        };
      default:
        return {
          title: 'No Trades',
          description: 'Your trades will appear here.'
        };
    }
  };

  const renderEmptyState = () => {
    const emptyState = getEmptyStateText();
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="pending-actions" size={64} color={Colors.gray400} />
        <Typography variant="h6" color="textSecondary" style={{ marginTop: Spacing.md }}>
          {emptyState.title}
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.sm }}>
          {emptyState.description}
        </Typography>
      </View>
    );
  };

  return (
    <View style={FXTheme.containers.screen}>
      {/* Header */}
      <View style={FXTheme.headers.withBorder}>
        <TouchableOpacity onPress={onBack} style={FXTheme.buttons.icon}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <Typography variant="h6" style={FXTheme.text.bold}>
          My Trades
        </Typography>

        <View style={styles.headerBadge}>
          <Typography variant="caption" style={styles.headerBadgeText}>
            {getCurrentTrades().length}
          </Typography>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Typography
            variant="body2"
            style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}
          >
            Active ({activeTrades.length})
          </Typography>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Typography
            variant="body2"
            style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}
          >
            Completed ({completedTrades.length})
          </Typography>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Typography
            variant="body2"
            style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}
          >
            Cancelled ({cancelledTrades.length})
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTrades(true)}
            colors={[Colors.primary]}
          />
        }
      >
        {loading && getCurrentTrades().length === 0 ? (
          <View style={styles.loadingState}>
            <Typography variant="body2" color="textSecondary">
              Loading trades...
            </Typography>
          </View>
        ) : getCurrentTrades().length === 0 ? (
          renderEmptyState()
        ) : (
          getCurrentTrades().map(renderTradeCard)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tradeCard: {
    marginBottom: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    minHeight: 400,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  scrollContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  headerBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  headerBadgeText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.gray600,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});