import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { FXOffer, FXTrade } from '../../types/fx';

interface FXOfferDetailProps {
  offer: FXOffer;
  onBack: () => void;
  onStartTrade: (amount: number) => void;
  onContactTrader: () => void;
}

export const FXOfferDetail: React.FC<FXOfferDetailProps> = ({
  offer,
  onBack,
  onStartTrade,
  onContactTrader,
}) => {
  const [tradeAmount, setTradeAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'terms' | 'profile'>('details');

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
      `You will sell ${offer.sellCurrency.symbol}${amount} for ${offer.buyCurrency.symbol}${calculateReceiveAmount(amount)}.\n\nThis will lock the quote for 10 minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Trade', onPress: () => onStartTrade(amount) }
      ]
    );
  };

  const renderTrustBadge = (badge: string | null) => {
    if (!badge) return null;
    
    const badgeConfig = {
      verified: { icon: 'verified', color: Colors.success, label: 'Verified' },
      premium: { icon: 'star', color: Colors.secondary, label: 'Premium' },
      pro: { icon: 'workspace-premium', color: Colors.primary, label: 'Pro' },
    };
    
    const config = badgeConfig[badge as keyof typeof badgeConfig];
    if (!config) return null;
    
    return (
      <View style={[styles.trustBadge, { backgroundColor: config.color + '20' }]}>
        <MaterialIcons name={config.icon as any} size={16} color={config.color} />
        <Typography variant="caption" style={[styles.badgeText, { color: config.color }]}>
          {config.label}
        </Typography>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Typography variant="h3">Offer Details</Typography>
      <TouchableOpacity style={styles.moreButton} onPress={onContactTrader}>
        <MaterialIcons name="message" size={24} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderOfferSummary = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.currencyPair}>
        <View style={styles.sellSide}>
          <Typography variant="h4" style={styles.currencyFlag}>
            {offer.sellCurrency.flag}
          </Typography>
          <View>
            <Typography variant="h5" style={styles.currencyCode}>
              {offer.sellCurrency.code}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Selling
            </Typography>
          </View>
        </View>

        <View style={styles.exchangeInfo}>
          <MaterialIcons name="swap-horiz" size={32} color={Colors.primary} />
          <Typography variant="h6" color="primary" style={styles.rateText}>
            Rate: {offer.exchangeRate}
          </Typography>
          <View style={[styles.marginBadge, {
            backgroundColor: offer.margin <= 0 ? Colors.success + '20' : Colors.warning + '20'
          }]}>
            <Typography variant="caption" style={[styles.marginText, {
              color: offer.margin <= 0 ? Colors.success : Colors.warning
            }]}>
              {offer.margin > 0 ? '+' : ''}{offer.margin.toFixed(1)}% margin
            </Typography>
          </View>
        </View>

        <View style={styles.buySide}>
          <Typography variant="h4" style={styles.currencyFlag}>
            {offer.buyCurrency.flag}
          </Typography>
          <View>
            <Typography variant="h5" style={styles.currencyCode}>
              {offer.buyCurrency.code}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Receiving
            </Typography>
          </View>
        </View>
      </View>

      <View style={styles.tradeLimits}>
        <View style={styles.limitItem}>
          <Typography variant="caption" color="textSecondary">Min Trade</Typography>
          <Typography variant="body2" style={styles.limitValue}>
            {offer.sellCurrency.symbol}{offer.minTrade.toLocaleString()}
          </Typography>
        </View>
        <View style={styles.limitItem}>
          <Typography variant="caption" color="textSecondary">Max Trade</Typography>
          <Typography variant="body2" style={styles.limitValue}>
            {offer.sellCurrency.symbol}{offer.maxTrade.toLocaleString()}
          </Typography>
        </View>
        <View style={styles.limitItem}>
          <Typography variant="caption" color="textSecondary">Available</Typography>
          <Typography variant="body2" color="success" style={styles.limitValue}>
            {offer.sellCurrency.symbol}{offer.availableAmount.toLocaleString()}
          </Typography>
        </View>
      </View>
    </Card>
  );

  const renderTradeCalculator = () => (
    <Card style={styles.calculatorCard}>
      <Typography variant="h6" style={styles.sectionTitle}>Trade Calculator</Typography>
      
      <View style={styles.calculatorRow}>
        <View style={styles.inputGroup}>
          <Typography variant="body2" style={styles.inputLabel}>
            You sell ({offer.sellCurrency.code})
          </Typography>
          <View style={styles.amountInput}>
            <TextInput
              style={styles.textInput}
              value={tradeAmount}
              onChangeText={setTradeAmount}
              placeholder="0"
              keyboardType="numeric"
            />
            <Typography variant="body2" color="textSecondary">
              {offer.sellCurrency.symbol}
            </Typography>
          </View>
        </View>

        <MaterialIcons name="arrow-downward" size={24} color={Colors.primary} style={styles.arrowIcon} />

        <View style={styles.outputGroup}>
          <Typography variant="body2" style={styles.inputLabel}>
            You receive ({offer.buyCurrency.code})
          </Typography>
          <View style={styles.receiveAmount}>
            <Typography variant="h5" color="primary">
              {offer.buyCurrency.symbol}{tradeAmount ? calculateReceiveAmount(parseFloat(tradeAmount)).toLocaleString() : '0'}
            </Typography>
          </View>
        </View>
      </View>

      {tradeAmount && !isValidAmount() && (
        <View style={styles.errorMessage}>
          <MaterialIcons name="error" size={16} color={Colors.error} />
          <Typography variant="caption" color="error" style={styles.errorText}>
            Amount must be between {offer.sellCurrency.symbol}{offer.minTrade} and {offer.sellCurrency.symbol}{Math.min(offer.maxTrade, offer.availableAmount)}
          </Typography>
        </View>
      )}

      <Button
        title={`Start Trade (${offer.paymentWindow} min window)`}
        onPress={handleStartTrade}
        disabled={!tradeAmount || !isValidAmount()}
        style={styles.startTradeButton}
      />
    </Card>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { key: 'details', label: 'Details' },
        { key: 'terms', label: 'Terms' },
        { key: 'profile', label: 'Trader' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Typography 
            variant="body2" 
            style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}
          >
            {tab.label}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDetailsTab = () => (
    <View>
      <Card style={styles.sectionCard}>
        <Typography variant="h6" style={styles.sectionTitle}>Payment Methods</Typography>
        {offer.paymentMethods.map((method) => (
          <View key={method.id} style={styles.paymentMethod}>
            <MaterialIcons name={method.icon as any} size={24} color={Colors.primary} />
            <View style={styles.methodInfo}>
              <Typography variant="body1" style={styles.methodName}>
                {method.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {method.processingTime} • {method.limits.min} - {method.limits.max} limit
              </Typography>
            </View>
          </View>
        ))}
      </Card>

      <Card style={styles.sectionCard}>
        <Typography variant="h6" style={styles.sectionTitle}>Trade Information</Typography>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Typography variant="caption" color="textSecondary">Payment Window</Typography>
            <Typography variant="body2">{offer.paymentWindow} minutes</Typography>
          </View>
          <View style={styles.infoItem}>
            <Typography variant="caption" color="textSecondary">KYC Required</Typography>
            <Typography variant="body2" color={offer.kycRequired ? "warning" : "success"}>
              {offer.kycRequired ? 'Yes' : 'No'}
            </Typography>
          </View>
          <View style={styles.infoItem}>
            <Typography variant="caption" color="textSecondary">Created</Typography>
            <Typography variant="body2">
              {offer.createdAt.toLocaleDateString()}
            </Typography>
          </View>
          <View style={styles.infoItem}>
            <Typography variant="caption" color="textSecondary">Last Updated</Typography>
            <Typography variant="body2">
              {Math.round((Date.now() - offer.updatedAt.getTime()) / (1000 * 60))} min ago
            </Typography>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderTermsTab = () => (
    <View>
      <Card style={styles.sectionCard}>
        <Typography variant="h6" style={styles.sectionTitle}>Trading Terms</Typography>
        <View style={styles.termsList}>
          <View style={styles.termItem}>
            <MaterialIcons name="access-time" size={16} color={Colors.textSecondary} />
            <Typography variant="body2" style={styles.termText}>
              Payment must be completed within {offer.paymentWindow} minutes of trade start
            </Typography>
          </View>
          <View style={styles.termItem}>
            <MaterialIcons name="security" size={16} color={Colors.textSecondary} />
            <Typography variant="body2" style={styles.termText}>
              Funds will be held in escrow until payment is confirmed
            </Typography>
          </View>
          <View style={styles.termItem}>
            <MaterialIcons name="receipt" size={16} color={Colors.textSecondary} />
            <Typography variant="body2" style={styles.termText}>
              Payment proof must be uploaded for verification
            </Typography>
          </View>
          <View style={styles.termItem}>
            <MaterialIcons name="gavel" size={16} color={Colors.textSecondary} />
            <Typography variant="body2" style={styles.termText}>
              Disputes will be resolved through platform arbitration
            </Typography>
          </View>
          {offer.kycRequired && (
            <View style={styles.termItem}>
              <MaterialIcons name="verified-user" size={16} color={Colors.warning} />
              <Typography variant="body2" style={styles.termText}>
                KYC verification required before trade completion
              </Typography>
            </View>
          )}
        </View>
      </Card>

      {offer.terms && (
        <Card style={styles.sectionCard}>
          <Typography variant="h6" style={styles.sectionTitle}>Additional Terms</Typography>
          <Typography variant="body2" style={styles.additionalTerms}>
            {offer.terms}
          </Typography>
        </Card>
      )}

      {offer.autoReply && (
        <Card style={styles.sectionCard}>
          <Typography variant="h6" style={styles.sectionTitle}>Auto Reply Message</Typography>
          <Typography variant="body2" style={styles.autoReplyText}>
            "{offer.autoReply}"
          </Typography>
        </Card>
      )}
    </View>
  );

  const renderProfileTab = () => (
    <View>
      <Card style={styles.sectionCard}>
        <Typography variant="h6" style={styles.sectionTitle}>Trader Profile</Typography>
        <View style={styles.traderProfile}>
          <View style={styles.traderHeader}>
            <View style={styles.traderAvatarLarge}>
              <Typography variant="h4" style={styles.traderAvatarText}>
                {offer.maker.name.substring(0, 2).toUpperCase()}
              </Typography>
              <View style={[styles.onlineIndicator, {
                backgroundColor: offer.maker.onlineStatus === 'online' ? Colors.success : 
                               offer.maker.onlineStatus === 'away' ? Colors.warning : Colors.gray400
              }]} />
            </View>
            <View style={styles.traderInfo}>
              <Typography variant="h5" style={styles.traderName}>
                {offer.maker.name}
              </Typography>
              <View style={styles.badgeContainer}>
                {renderTrustBadge(offer.maker.trustBadge)}
              </View>
              <Typography variant="caption" color="textSecondary">
                {offer.maker.onlineStatus === 'online' ? 'Online now' : 
                 offer.maker.onlineStatus === 'away' ? 'Away' : 'Offline'}
              </Typography>
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Typography variant="h6" style={styles.sectionTitle}>Trading Statistics</Typography>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Typography variant="h4" color="primary">
              {offer.maker.trustScore}%
            </Typography>
            <Typography variant="caption" color="textSecondary">Trust Score</Typography>
          </View>
          <View style={styles.statItem}>
            <Typography variant="h4" color="secondary">
              {offer.maker.completedTrades}
            </Typography>
            <Typography variant="caption" color="textSecondary">Completed Trades</Typography>
          </View>
          <View style={styles.statItem}>
            <Typography variant="h4" color="success">
              {offer.maker.responseTime}
            </Typography>
            <Typography variant="caption" color="textSecondary">Response Time</Typography>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details': return renderDetailsTab();
      case 'terms': return renderTermsTab();
      case 'profile': return renderProfileTab();
      default: return renderDetailsTab();
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOfferSummary()}
        {renderTradeCalculator()}
        {renderTabNavigation()}
        {renderTabContent()}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: Spacing.sm,
  },
  moreButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  currencyPair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  sellSide: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buySide: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  exchangeInfo: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  currencyFlag: {
    marginRight: Spacing.md,
  },
  currencyCode: {
    fontWeight: '600',
  },
  rateText: {
    marginVertical: Spacing.sm,
    fontWeight: '600',
  },
  marginBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  marginText: {
    fontWeight: '600',
    fontSize: 12,
  },
  tradeLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  limitItem: {
    alignItems: 'center',
  },
  limitValue: {
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  calculatorCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  calculatorRow: {
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  inputLabel: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  textInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 18,
    fontWeight: '600',
  },
  arrowIcon: {
    marginVertical: Spacing.md,
  },
  outputGroup: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  receiveAmount: {
    backgroundColor: Colors.gray100,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  startTradeButton: {
    width: '100%',
  },
  tabNavigation: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  sectionCard: {
    marginBottom: Spacing.lg,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  methodInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  methodName: {
    fontWeight: '500',
    marginBottom: Spacing.xs / 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  termsList: {
    gap: Spacing.md,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  termText: {
    marginLeft: Spacing.md,
    flex: 1,
    lineHeight: 20,
  },
  additionalTerms: {
    lineHeight: 22,
    fontStyle: 'italic',
  },
  autoReplyText: {
    lineHeight: 22,
    backgroundColor: Colors.gray100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontStyle: 'italic',
  },
  traderProfile: {
    marginBottom: Spacing.md,
  },
  traderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  traderAvatarLarge: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  traderAvatarText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  traderInfo: {
    flex: 1,
  },
  traderName: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  badgeContainer: {
    marginBottom: Spacing.sm,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  badgeText: {
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
});