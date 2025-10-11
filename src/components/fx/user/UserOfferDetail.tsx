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
import { FXTheme } from '../../../theme/fxTheme';
import { FXOffer, FXTrade } from '../../../types/fx';
import authService from '../../../services/authService';

interface UserOfferDetailProps {
  offer: FXOffer;
  onBack: () => void;
  onStartTrade: (amount: number) => void;
  onContactTrader: () => void;
  onSaveOffer: () => void;
  onReportOffer: () => void;
  currentTrade?: FXTrade | null;
  isSaved?: boolean;
}

export const UserOfferDetail: React.FC<UserOfferDetailProps> = ({
  offer,
  onBack,
  onStartTrade,
  onContactTrader,
  onSaveOffer,
  onReportOffer,
  currentTrade,
  isSaved = false,
}) => {
  const [tradeAmount, setTradeAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'terms' | 'profile' | 'reviews'>('details');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showCalculator, setShowCalculator] = useState(true);
  const [favoriteOffers, setFavoriteOffers] = useState<string[]>([]);

  useEffect(() => {
    loadCurrentUser();
    loadFavoriteOffers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await authService.getCachedUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadFavoriteOffers = async () => {
    try {
      const saved = await AsyncStorage.getItem('favoriteOffers');
      if (saved) {
        setFavoriteOffers(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load favorite offers:', error);
    }
  };

  const handleSaveOffer = async () => {
    try {
      const updatedFavorites = isSaved 
        ? favoriteOffers.filter(id => id !== offer.id)
        : [...favoriteOffers, offer.id];
      
      await AsyncStorage.setItem('favoriteOffers', JSON.stringify(updatedFavorites));
      setFavoriteOffers(updatedFavorites);
      onSaveOffer();
    } catch (error) {
      console.error('Failed to save offer:', error);
    }
  };

  const calculateReceiveAmount = (sellAmount: number) => {
    return Math.round(sellAmount * offer.exchangeRate);
  };

  const isValidAmount = () => {
    const amount = parseFloat(tradeAmount);
    return amount >= offer.minTrade && amount <= Math.min(offer.maxTrade, offer.availableAmount);
  };

  const handleStartTrade = () => {
    if (!isValidAmount()) {
      Alert.alert('Invalid Amount', `Please enter amount between ${offer.sellCurrency.symbol}${offer.minTrade} and ${offer.sellCurrency.symbol}${Math.min(offer.maxTrade, offer.availableAmount)}`);
      return;
    }
    
    const amount = parseFloat(tradeAmount);
    
    Alert.alert(
      'Start Trade',
      `You will buy ${offer.sellCurrency.symbol}${amount} for ${offer.buyCurrency.symbol}${calculateReceiveAmount(amount)}.\n\nThis will lock the quote for 10 minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Trade', onPress: () => {
          onStartTrade(amount);
        }}
      ]
    );
  };

  const renderTrustBadge = (trustBadge: string | null | undefined) => {
    if (!trustBadge) return null;
    
    const badgeConfig = {
      'verified': { icon: 'verified', color: Colors.success, text: 'Verified' },
      'trusted': { icon: 'star', color: Colors.warning, text: 'Trusted' },
      'new': { icon: 'fiber-new', color: Colors.info, text: 'New' },
    };

    const config = badgeConfig[trustBadge as keyof typeof badgeConfig] || badgeConfig.new;

    return (
      <View style={FXTheme.badges.method}>
        <MaterialIcons name={config.icon as any} size={16} color={config.color} />
        <Typography variant="caption" style={[FXTheme.payment.methodText, { color: config.color }]}>
          {config.text}
        </Typography>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={FXTheme.headers.withBorder}>
      <TouchableOpacity onPress={onBack} style={FXTheme.buttons.back}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Typography variant="h3">Offer Details</Typography>
      <View style={FXTheme.layouts.row}>
        <TouchableOpacity onPress={handleSaveOffer} style={FXTheme.buttons.icon}>
          <MaterialIcons 
            name={isSaved ? "bookmark" : "bookmark-border"} 
            size={24} 
            color={isSaved ? Colors.warning : Colors.textPrimary} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onReportOffer} style={FXTheme.buttons.icon}>
          <MaterialIcons name="flag" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOfferSummary = () => (
    <Card style={FXTheme.cards.section}>
      <View style={FXTheme.currency.pair}>
        <View style={FXTheme.currency.side}>
          <Typography variant="h4" style={FXTheme.currency.flag}>
            {offer.sellCurrency.flag}
          </Typography>
          <View>
            <Typography variant="h5" style={FXTheme.text.currencyCode}>
              {offer.sellCurrency.code}
            </Typography>
            <Typography variant="h6" style={FXTheme.text.amountPrimary}>
              {offer.sellCurrency.symbol}{offer.sellAmount.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              You buy
            </Typography>
          </View>
        </View>

        <View style={FXTheme.currency.exchangeInfo}>
          <MaterialIcons name="swap-horiz" size={32} color={Colors.primary} />
          <Typography variant="h6" color="primary" style={FXTheme.text.rate}>
            Rate: {offer.exchangeRate}
          </Typography>
        </View>

        <View style={FXTheme.currency.sideRight}>
          <Typography variant="h4" style={FXTheme.currency.flag}>
            {offer.buyCurrency.flag}
          </Typography>
          <View>
            <Typography variant="h5" style={FXTheme.text.currencyCode}>
              {offer.buyCurrency.code}
            </Typography>
            <Typography variant="h6" style={FXTheme.text.amountPrimary}>
              {offer.buyCurrency.symbol}{offer.buyAmount.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              You pay
            </Typography>
          </View>
        </View>
      </View>

      <View style={FXTheme.trade.limits}>
        <View style={FXTheme.trade.limitItem}>
          <Typography variant="caption" color="textSecondary">Min Trade</Typography>
          <Typography variant="body2" style={FXTheme.trade.limitValue}>
            {offer.sellCurrency.symbol}{offer.minTrade.toLocaleString()}
          </Typography>
        </View>
        <View style={FXTheme.trade.limitItem}>
          <Typography variant="caption" color="textSecondary">Max Trade</Typography>
          <Typography variant="body2" style={FXTheme.trade.limitValue}>
            {offer.sellCurrency.symbol}{Math.min(offer.maxTrade, offer.availableAmount).toLocaleString()}
          </Typography>
        </View>
        <View style={FXTheme.trade.limitItem}>
          <Typography variant="caption" color="textSecondary">Available</Typography>
          <Typography variant="body2" style={FXTheme.trade.limitValue}>
            {offer.sellCurrency.symbol}{offer.availableAmount.toLocaleString()}
          </Typography>
        </View>
      </View>
    </Card>
  );

  const renderTradeCalculator = () => (
    <Card style={FXTheme.cards.section}>
      <View style={FXTheme.layouts.rowBetween}>
        <Typography variant="h6" style={FXTheme.text.bold}>Trade Calculator</Typography>
        <TouchableOpacity onPress={() => setShowCalculator(!showCalculator)}>
          <MaterialIcons 
            name={showCalculator ? "expand-less" : "expand-more"} 
            size={24} 
            color={Colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      {showCalculator && (
        <View style={[FXTheme.layouts.column, { marginTop: Spacing.lg }]}>
          <View style={[FXTheme.layouts.column, { marginBottom: Spacing.lg }]}>
            <Typography variant="body2" style={[FXTheme.text.bold, { marginBottom: Spacing.sm }]}>
              Amount to buy ({offer.sellCurrency.code})
            </Typography>
            <View style={FXTheme.inputs.searchContainer}>
              <TextInput
                style={FXTheme.inputs.searchInput}
                value={tradeAmount}
                onChangeText={setTradeAmount}
                placeholder="0"
                keyboardType="numeric"
                editable={!currentTrade || currentTrade.status === 'pending_acceptance'}
              />
              <Typography variant="body2" color="textSecondary">
                {offer.sellCurrency.symbol}
              </Typography>
            </View>
          </View>

          <View style={[FXTheme.layouts.row, { justifyContent: 'center', marginBottom: Spacing.lg }]}>
            <MaterialIcons name="arrow-downward" size={24} color={Colors.primary} />
          </View>

          <View style={[FXTheme.layouts.column, { marginBottom: Spacing.lg }]}>
            <Typography variant="body2" style={[FXTheme.text.bold, { marginBottom: Spacing.sm }]}>
              You will pay ({offer.buyCurrency.code})
            </Typography>
            <View style={[FXTheme.inputs.searchContainer, { backgroundColor: Colors.gray100, minHeight: 48, justifyContent: 'center' }]}>
              <Typography variant="h5" color="primary">
                {offer.buyCurrency.symbol}{tradeAmount ? calculateReceiveAmount(parseFloat(tradeAmount)).toLocaleString() : '0'}
              </Typography>
            </View>
          </View>

          {tradeAmount && !isValidAmount() && (
            <View style={[FXTheme.layouts.row, { 
              backgroundColor: Colors.error + '10', 
              padding: Spacing.md, 
              borderRadius: BorderRadius.md, 
              marginBottom: Spacing.lg,
              alignItems: 'flex-start'
            }]}>
              <MaterialIcons name="error" size={16} color={Colors.error} style={{ marginTop: 2 }} />
              <Typography variant="caption" color="error" style={[FXTheme.spacing.marginHorizontal('sm'), { flex: 1 }]}>
                Amount must be between {offer.sellCurrency.symbol}{offer.minTrade} and {offer.sellCurrency.symbol}{Math.min(offer.maxTrade, offer.availableAmount)}
              </Typography>
            </View>
          )}

          {renderTradeButton()}
        </View>
      )}
    </Card>
  );

  const renderTradeButton = () => {
    if (currentTrade) {
      switch (currentTrade.status) {
        case 'pending_acceptance':
          return (
            <Button
              title="Pending Acceptance"
              onPress={() => {}}
              disabled={true}
              style={{ width: '100%', backgroundColor: Colors.warning }}
            />
          );
        case 'accepted':
        case 'quote_locked':
        case 'escrow_pending':
        case 'escrow_locked':
        case 'payment_pending':
        case 'payment_sent':
        case 'payment_confirmed':
          return (
            <Button
              title="View Trade Room"
              onPress={() => {}}
              style={{ width: '100%' }}
            />
          );
        default:
          return (
            <Button
              title="Start Trade"
              onPress={() => {
                if (offer.kycRequired && !currentUser?.kycVerified) {
                  Alert.alert(
                    'KYC Required',
                    'This offer requires KYC verification. Please complete your verification first.',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                handleStartTrade();
              }}
              disabled={!tradeAmount || !isValidAmount()}
              style={{ width: '100%' }}
            />
          );
      }
    }

    return (
      <Button
        title="Start Trade"
        onPress={() => {
          if (offer.kycRequired && !currentUser?.kycVerified) {
            Alert.alert(
              'KYC Required',
              'This offer requires KYC verification. Please complete your verification first.',
              [{ text: 'OK' }]
            );
            return;
          }
          handleStartTrade();
        }}
        disabled={!tradeAmount || !isValidAmount()}
        style={{ width: '100%' }}
      />
    );
  };

  const renderTabNavigation = () => (
    <View style={FXTheme.tabs.navigation}>
      {[
        { key: 'details', label: 'Details' },
        { key: 'terms', label: 'Terms' },
        { key: 'profile', label: 'Trader' },
        { key: 'reviews', label: 'Reviews' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[FXTheme.tabs.tab, activeTab === tab.key && FXTheme.tabs.activeTab]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Typography 
            variant="body2" 
            style={[FXTheme.tabs.tabText, activeTab === tab.key && FXTheme.tabs.activeTabText]}
          >
            {tab.label}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDetailsTab = () => (
    <View>
      <Card style={FXTheme.cards.section}>
        <Typography variant="h6" style={FXTheme.text.bold}>Payment Methods</Typography>
        {offer.paymentMethods.map((method) => (
          <View key={method.id} style={FXTheme.payment.methods}>
            <MaterialIcons name={method.icon as any} size={24} color={Colors.primary} />
            <View style={FXTheme.layouts.column}>
              <Typography variant="body1" style={FXTheme.text.bold}>
                {method.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {method.processingTime} • {method.limits.min} - {method.limits.max} limit
              </Typography>
            </View>
          </View>
        ))}
      </Card>

      <Card style={FXTheme.cards.section}>
        <Typography variant="h6" style={FXTheme.text.bold}>Trade Information</Typography>
        <View style={FXTheme.stats.grid}>
          <View style={FXTheme.stats.item}>
            <Typography variant="caption" color="textSecondary">Exchange Rate</Typography>
            <Typography variant="body1" style={FXTheme.text.bold}>
              {offer.exchangeRate}
            </Typography>
          </View>
          <View style={FXTheme.stats.item}>
            <Typography variant="caption" color="textSecondary">Payment Window</Typography>
            <Typography variant="body1" style={FXTheme.text.bold}>
              {offer.paymentWindow} minutes
            </Typography>
          </View>
          <View style={FXTheme.stats.item}>
            <Typography variant="caption" color="textSecondary">Available Amount</Typography>
            <Typography variant="body1" style={FXTheme.text.bold}>
              {offer.sellCurrency.symbol}{offer.availableAmount.toLocaleString()}
            </Typography>
          </View>
          <View style={FXTheme.stats.item}>
            <Typography variant="caption" color="textSecondary">Status</Typography>
            <Typography variant="body1" style={FXTheme.text.bold}>
              {offer.status}
            </Typography>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderTermsTab = () => (
    <View>
      <Card style={FXTheme.cards.section}>
        <Typography variant="h6" style={[FXTheme.text.bold, { marginBottom: Spacing.lg }]}>Trading Terms</Typography>
        <View style={FXTheme.layouts.column}>
          <View style={[FXTheme.layouts.row, { marginBottom: Spacing.md, alignItems: 'flex-start' }]}>
            <MaterialIcons name="access-time" size={16} color={Colors.gray600} style={{ marginTop: 2, marginRight: Spacing.sm }} />
            <Typography variant="body2" style={{ flex: 1, lineHeight: 20 }}>
              Payment must be completed within {offer.paymentWindow} minutes of trade start
            </Typography>
          </View>
          <View style={[FXTheme.layouts.row, { marginBottom: Spacing.md, alignItems: 'flex-start' }]}>
            <MaterialIcons name="security" size={16} color={Colors.success} style={{ marginTop: 2, marginRight: Spacing.sm }} />
            <Typography variant="body2" style={{ flex: 1, lineHeight: 20 }}>
              Your funds are protected by our escrow service
            </Typography>
          </View>
          <View style={[FXTheme.layouts.row, { marginBottom: Spacing.md, alignItems: 'flex-start' }]}>
            <MaterialIcons name="receipt" size={16} color={Colors.gray600} style={{ marginTop: 2, marginRight: Spacing.sm }} />
            <Typography variant="body2" style={{ flex: 1, lineHeight: 20 }}>
              Payment proof must be uploaded for verification
            </Typography>
          </View>
          <View style={[FXTheme.layouts.row, { alignItems: 'flex-start' }]}>
            <MaterialIcons name="gavel" size={16} color={Colors.gray600} style={{ marginTop: 2, marginRight: Spacing.sm }} />
            <Typography variant="body2" style={{ flex: 1, lineHeight: 20 }}>
              Disputes will be resolved through platform arbitration
            </Typography>
          </View>
        </View>
      </Card>

      {offer.kycRequired && (
        <Card style={FXTheme.cards.section}>
          <View style={[FXTheme.layouts.row, { alignItems: 'flex-start' }]}>
            <MaterialIcons name="verified-user" size={24} color={Colors.warning} style={{ marginRight: Spacing.md }} />
            <View style={[FXTheme.layouts.column, { flex: 1 }]}>
              <Typography variant="h6" style={[FXTheme.text.bold, { marginBottom: Spacing.xs }]}>KYC Required</Typography>
              <Typography variant="body2" color="textSecondary" style={{ lineHeight: 20 }}>
                This offer requires identity verification to proceed with the trade.
              </Typography>
            </View>
          </View>
        </Card>
      )}

      {offer.autoReply && (
        <Card style={FXTheme.cards.section}>
          <Typography variant="h6" style={[FXTheme.text.bold, { marginBottom: Spacing.md }]}>Auto-Reply Message</Typography>
          <Typography variant="body2" style={{ 
            lineHeight: 22, 
            backgroundColor: Colors.gray100, 
            padding: Spacing.md, 
            borderRadius: BorderRadius.md, 
            fontStyle: 'italic' 
          }}>
            "{offer.autoReply}"
          </Typography>
        </Card>
      )}
    </View>
  );

  const renderProfileTab = () => (
    <View>
      <Card style={FXTheme.cards.section}>
        <Typography variant="h6" style={FXTheme.text.bold}>Trader Profile</Typography>
        <View style={FXTheme.layouts.column}>
          <View style={FXTheme.layouts.row}>
            <View style={{
                position: 'relative',
                width: 80,
                height: 80,
                borderRadius: BorderRadius.full,
                backgroundColor: Colors.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: Spacing.lg,
              }}>
              <Typography variant="h4" style={FXTheme.text.bold}>
                {offer.maker.name.substring(0, 2).toUpperCase()}
              </Typography>
              <View style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  width: 16,
                  height: 16,
                  borderRadius: BorderRadius.full,
                  borderWidth: 3,
                  borderColor: Colors.background,
                  backgroundColor: offer.maker.onlineStatus === 'online' ? Colors.success : 
                                 offer.maker.onlineStatus === 'away' ? Colors.warning : Colors.gray400
                }} />
            </View>
            <View style={FXTheme.layouts.column}>
              <View style={FXTheme.layouts.column}>
                <Typography variant="h5" style={FXTheme.text.bold}>
                  {offer.maker.name}
                </Typography>
                <View style={FXTheme.layouts.rowGap}>
                  {renderTrustBadge(offer.maker.trustBadge)}
                  <View style={FXTheme.badges.method}>
                    <MaterialIcons name="store" size={16} color={Colors.primary} />
                    <Typography variant="caption" style={FXTheme.payment.methodText}>
                      Merchant
                    </Typography>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={FXTheme.stats.grid}>
          <View style={FXTheme.stats.item}>
            <Typography variant="caption" color="textSecondary" style={FXTheme.stats.label}>
              Trust Score
            </Typography>
            <Typography variant="body1" style={FXTheme.stats.value}>
              {offer.maker.trustScore}%
            </Typography>
          </View>
          <View style={FXTheme.stats.item}>
            <Typography variant="caption" color="textSecondary" style={FXTheme.stats.label}>
              Total Trades
            </Typography>
            <Typography variant="body1" style={FXTheme.stats.value}>
              {offer.maker.completedTrades}
            </Typography>
          </View>
          <View style={FXTheme.stats.item}>
            <Typography variant="caption" color="textSecondary" style={FXTheme.stats.label}>
              Success Rate
            </Typography>
            <Typography variant="body1" style={FXTheme.stats.value}>
              {Math.round((offer.maker.completedTrades / (offer.maker.completedTrades + 5)) * 100)}%
            </Typography>
          </View>
          <View style={FXTheme.stats.item}>
            <Typography variant="caption" color="textSecondary" style={FXTheme.stats.label}>
              Avg Response
            </Typography>
            <Typography variant="body1" style={FXTheme.stats.value}>
              {offer.maker.responseTime}
            </Typography>
          </View>
        </View>

        {offer.maker.completedTrades < 10 && (
          <View style={[FXTheme.layouts.row, { 
            backgroundColor: Colors.info + '10', 
            paddingHorizontal: Spacing.md, 
            paddingVertical: Spacing.sm, 
            borderRadius: BorderRadius.md, 
            marginTop: Spacing.md 
          }]}>
            <MaterialIcons name="info" size={16} color={Colors.info} />
            <Typography variant="caption" style={[FXTheme.spacing.marginHorizontal('sm'), { 
              flex: 1, 
              color: Colors.info, 
              fontWeight: '500' 
            }]}>
              New trader - Consider starting with smaller amounts
            </Typography>
          </View>
        )}
      </Card>
    </View>
  );

  const renderReviewsTab = () => (
    <View>
      <Card style={FXTheme.cards.section}>
        <View style={[FXTheme.layouts.center, { paddingVertical: Spacing.xl }]}>
          <MaterialIcons name="rate-review" size={48} color={Colors.gray400} style={{ marginBottom: Spacing.md }} />
          <Typography variant="h6" style={[FXTheme.text.bold, { color: Colors.gray600, marginBottom: Spacing.sm }]}>
            Reviews Coming Soon
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center' }}>
            We're working on bringing you trader reviews and ratings to help you make informed trading decisions.
          </Typography>
        </View>
      </Card>
    </View>
  );

  return (
    <View style={FXTheme.containers.screen}>
      {renderHeader()}
      <ScrollView style={FXTheme.containers.content}>
        {renderOfferSummary()}
        {renderTradeCalculator()}
        {renderTabNavigation()}
        {activeTab === 'details' && renderDetailsTab()}
        {activeTab === 'terms' && renderTermsTab()}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'reviews' && renderReviewsTab()}
      </ScrollView>
    </View>
  );
};