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
import { Colors, Spacing, BorderRadius } from '../../../theme';
import { FXTheme } from '../../../theme/fxTheme';
import { FXTrade } from '../../../types/fx';
import { User } from '../../../services/authService';
import fxService from '../../../services/fxService';

interface PendingTradesScreenProps {
  onBack: () => void;
  onTradeSelect: (trade: FXTrade) => void;
  currentUser: User | null;
}

export const PendingTradesScreen: React.FC<PendingTradesScreenProps> = ({
  onBack,
  onTradeSelect,
  currentUser,
}) => {
  const [pendingTrades, setPendingTrades] = useState<FXTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load pending trades
  const loadPendingTrades = async (isRefresh = false) => {
    if (!currentUser) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Get all trades where current user is the maker (merchant) and status is pending_acceptance
      const response = await fxService.getUserTrades({ limit: 50, offset: 0 });
      
      if (response.success) {
        const merchantPendingTrades = response.trades.filter(trade => 
          trade.maker.id === currentUser.id && 
          trade.status === 'pending_acceptance'
        );
        
        console.log('📋 [PendingTradesScreen] Loaded pending trades:', {
          totalTrades: response.trades.length,
          pendingTrades: merchantPendingTrades.length,
          merchantId: currentUser.id
        });
        
        setPendingTrades(merchantPendingTrades);
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
        // Remove from pending trades and navigate to trade room
        setPendingTrades(prev => prev.filter(t => t.id !== trade.id));
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
                setPendingTrades(prev => prev.filter(t => t.id !== trade.id));
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
    loadPendingTrades();
  }, [currentUser]);

  const renderTradeCard = (trade: FXTrade) => (
    <Card key={trade.id} style={styles.tradeCard}>
      <View style={FXTheme.layouts.rowBetween}>
        <View style={FXTheme.layouts.column}>
          <Typography variant="h6" style={FXTheme.text.bold}>
            {trade.taker.name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            ID: {trade.id.substr(0, 8)}...
          </Typography>
        </View>
        
        <View style={[FXTheme.layouts.column, { alignItems: 'flex-end' }]}>
          <Typography variant="caption" color="textSecondary">
            {new Date(trade.createdAt).toLocaleDateString()}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {new Date(trade.createdAt).toLocaleTimeString()}
          </Typography>
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
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="pending-actions" size={64} color={Colors.gray400} />
      <Typography variant="h6" color="textSecondary" style={{ marginTop: Spacing.md }}>
        No Pending Trade
      </Typography>
      <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.sm }}>
        When users trade with your offers, they'll appear here for your approval.
      </Typography>
    </View>
  );

  return (
    <View style={FXTheme.containers.screen}>
      {/* Header */}
      <View style={FXTheme.headers.withBorder}>
        <TouchableOpacity onPress={onBack} style={FXTheme.buttons.icon}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <Typography variant="h6" style={FXTheme.text.bold}>
          Pending Trade
        </Typography>

        <View />
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPendingTrades(true)}
            colors={[Colors.primary]}
          />
        }
      >
        {loading && pendingTrades.length === 0 ? (
          <View style={styles.loadingState}>
            <Typography variant="body2" color="textSecondary">
              Loading pending trades...
            </Typography>
          </View>
        ) : pendingTrades.length === 0 ? (
          renderEmptyState()
        ) : (
          pendingTrades.map(renderTradeCard)
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
});