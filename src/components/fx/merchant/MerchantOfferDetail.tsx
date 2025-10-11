import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../../theme';
import { FXOffer, FXTrade } from '../../../types/fx';
import authService from '../../../services/authService';
import { FXTheme, FXColors } from '../../../theme/fxTheme';

interface MerchantOfferDetailProps {
  offer: FXOffer;
  onBack: () => void;
  onEditOffer: (offer: FXOffer) => void;
  onDeleteOffer: (offerId: string) => void;
  onToggleOfferStatus: (offerId: string, isActive: boolean) => void;
  currentTrade?: FXTrade | null;
}

export const MerchantOfferDetail: React.FC<MerchantOfferDetailProps> = ({
  offer,
  onBack,
  onEditOffer,
  onDeleteOffer,
  onToggleOfferStatus,
  currentTrade,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'performance' | 'trades'>('details');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [debugMode, setDebugMode] = useState(__DEV__);

  // Mock performance data for merchant offers
  const [offerPerformance] = useState({
    totalTrades: 24,
    completedTrades: 22,
    successRate: 91.7,
    totalVolume: 45600,
    avgTradeSize: 1900,
    avgCompletionTime: '18 mins',
    recentTrades: [
      { id: '1', amount: 2500, status: 'completed', completedAt: '2024-01-15T10:30:00Z' },
      { id: '2', amount: 1800, status: 'completed', completedAt: '2024-01-15T09:15:00Z' },
      { id: '3', amount: 3200, status: 'in_progress', startedAt: '2024-01-15T11:00:00Z' },
    ]
  });

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      // Mock user for development since getCurrentUser doesn't exist
      setCurrentUser({
        id: 'merchant-123',
        name: 'John Merchant',
        role: 'merchant',
        merchantProfile: { verified: true }
      });
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const handleEditOffer = () => {
    onEditOffer(offer);
  };

  const handleDeleteOffer = () => {
    Alert.alert(
      'Delete Offer',
      'Are you sure you want to delete this offer? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeleteOffer(offer.id)
        }
      ]
    );
  };

  const handleToggleStatus = () => {
    const newStatus = offer.status !== 'active';
    Alert.alert(
      newStatus ? 'Activate Offer' : 'Deactivate Offer',
      `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this offer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: newStatus ? 'Activate' : 'Deactivate',
          onPress: () => onToggleOfferStatus(offer.id, newStatus)
        }
      ]
    );
  };

  return (
    <View style={FXTheme.containers.screen}>
      {/* Header */}
      <View style={FXTheme.headers.withBorder}>
        <TouchableOpacity style={FXTheme.buttons.back} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={FXTheme.buttons.icon} onPress={() => {}}>
          <MaterialIcons name="more-vert" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={FXTheme.containers.content} showsVerticalScrollIndicator={false}>
        {/* Offer Summary */}
        <Card style={FXTheme.cards.section}>
          <View style={FXTheme.currency.pair}>
            <View style={FXTheme.currency.side}>
              <Typography variant="h4" style={FXTheme.currency.flag}>
                {offer.sellCurrency.flag}
              </Typography>
              <Typography variant="h5" style={FXTheme.text.currencyCode}>
                {offer.sellCurrency.code}
              </Typography>
              <Typography variant="h6" style={FXTheme.text.amountPrimary}>
                {offer.sellAmount.toLocaleString()}
              </Typography>
            </View>

            <View style={FXTheme.currency.exchangeInfo}>
              <MaterialIcons name="swap-horiz" size={24} color={Colors.primary} />
              <Typography variant="h6" color="primary" style={FXTheme.text.rate}>
                {offer.exchangeRate}
              </Typography>
            </View>

            <View style={FXTheme.currency.sideRight}>
              <Typography variant="h4" style={FXTheme.currency.flag}>
                {offer.buyCurrency.flag}
              </Typography>
              <Typography variant="h5" style={FXTheme.text.currencyCode}>
                {offer.buyCurrency.code}
              </Typography>
              <Typography variant="h6" style={FXTheme.text.amountPrimary}>
                {offer.buyAmount.toLocaleString()}
              </Typography>
            </View>
          </View>

          {/* Trade Limits */}
          <View style={FXTheme.trade.terms}>
            <View style={FXTheme.trade.termItem}>
              <Typography variant="caption" color="textSecondary">Min Trade</Typography>
              <Typography variant="body2" style={FXTheme.trade.limitValue}>
                {offer.minTrade.toLocaleString()} {offer.sellCurrency.code}
              </Typography>
            </View>
            <View style={FXTheme.trade.termItem}>
              <Typography variant="caption" color="textSecondary">Max Trade</Typography>
              <Typography variant="body2" style={FXTheme.trade.limitValue}>
                {offer.maxTrade.toLocaleString()} {offer.sellCurrency.code}
              </Typography>
            </View>
            <View style={FXTheme.trade.termItem}>
              <Typography variant="caption" color="textSecondary">Margin</Typography>
              <Typography variant="body2" color="success" style={FXTheme.trade.limitValue}>
                {offer.margin}%
              </Typography>
            </View>
          </View>
        </Card>

        {/* Tab Navigation */}
        <View style={FXTheme.tabs.navigation}>
          {['details', 'performance', 'trades'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[FXTheme.tabs.tab, activeTab === tab && FXTheme.tabs.activeTab]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Typography 
                variant="body2" 
                style={[FXTheme.tabs.tabText, activeTab === tab && FXTheme.tabs.activeTabText]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <>
            {/* Payment Methods */}
            <Card style={FXTheme.cards.section}>
              <Typography variant="h6" style={FXTheme.text.bold}>Payment Methods</Typography>
              {offer.paymentMethods.map((method) => (
                <View key={method.id} style={FXTheme.layouts.row}>
                  <MaterialIcons name="payment" size={20} color={Colors.primary} />
                  <View style={FXTheme.spacing.marginHorizontal('md')}>
                    <Typography variant="body1" style={FXTheme.text.bold}>
                      {method.name}
                    </Typography>
                  </View>
                </View>
              ))}
            </Card>

            {/* Trade Information */}
            <Card style={FXTheme.cards.section}>
              <Typography variant="h6" style={FXTheme.text.bold}>Trade Information</Typography>
              <View style={FXTheme.layouts.rowBetween}>
                <View style={{ width: '48%', marginBottom: Spacing.md }}>
                  <Typography variant="caption" color="textSecondary">Payment Window</Typography>
                  <Typography variant="body2">{offer.paymentWindow} minutes</Typography>
                </View>
                <View style={{ width: '48%', marginBottom: Spacing.md }}>
                  <Typography variant="caption" color="textSecondary">Response Time</Typography>
                  <Typography variant="body2">~5 minutes</Typography>
                </View>
              </View>
            </Card>

            {/* Additional Terms */}
            {offer.terms && (
              <Card style={FXTheme.cards.section}>
                <Typography variant="h6" style={FXTheme.text.bold}>Additional Terms</Typography>
                <Typography variant="body2" style={{ lineHeight: 22, fontStyle: 'italic' }}>
                  {offer.terms}
                </Typography>
              </Card>
            )}
          </>
        )}

        {activeTab === 'performance' && (
          <>
            {/* Performance Stats */}
            <Card style={FXTheme.cards.section}>
              <Typography variant="h6" style={FXTheme.text.bold}>Performance Overview</Typography>
              <View style={FXTheme.stats.grid}>
                <View style={FXTheme.stats.item}>
                  <Typography variant="caption" style={FXTheme.stats.label} color="textSecondary">Total Trades</Typography>
                  <Typography variant="h3" style={FXTheme.stats.value}>{offerPerformance.totalTrades}</Typography>
                </View>
                <View style={FXTheme.stats.item}>
                  <Typography variant="caption" style={FXTheme.stats.label} color="textSecondary">Success Rate</Typography>
                  <Typography variant="h3" style={[FXTheme.stats.value, { color: Colors.success }]}>
                    {offerPerformance.successRate}%
                  </Typography>
                </View>
                <View style={FXTheme.stats.item}>
                  <Typography variant="caption" style={FXTheme.stats.label} color="textSecondary">Total Volume</Typography>
                  <Typography variant="h3" style={FXTheme.stats.value}>
                    ${offerPerformance.totalVolume.toLocaleString()}
                  </Typography>
                </View>
                <View style={FXTheme.stats.item}>
                  <Typography variant="caption" style={FXTheme.stats.label} color="textSecondary">Avg Trade Size</Typography>
                  <Typography variant="h3" style={[FXTheme.stats.value, { color: Colors.success }]}>
                    ${offerPerformance.avgTradeSize.toLocaleString()}
                  </Typography>
                </View>
              </View>
            </Card>
          </>
        )}

        {activeTab === 'trades' && (
          <Card style={FXTheme.cards.section}>
            <Typography variant="h6" style={FXTheme.text.bold}>Recent Trades</Typography>
            <Typography variant="body2" color="textSecondary">
              Recent trade history will be displayed here.
            </Typography>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={{ marginTop: Spacing.xl, gap: Spacing.md }}>
          <Button
            title={offer.status === 'active' ? "Deactivate Offer" : "Activate Offer"}
            onPress={handleToggleStatus}
            style={{
              width: '100%',
              backgroundColor: offer.status === 'active' ? Colors.warning : Colors.success
            }}
          />
          <Button
            title="Edit Offer"
            onPress={handleEditOffer}
            style={{
              width: '100%',
              backgroundColor: Colors.secondary
            }}
          />
          <Button
            title="Delete Offer"
            onPress={handleDeleteOffer}
            style={{
              width: '100%',
              backgroundColor: Colors.error
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
};