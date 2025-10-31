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
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { FXTheme } from '../../theme/fxTheme';
import { FXOffer, FXTrade } from '../../types/fx';
import authService from '../../services/authService';
import profileService from '../../services/profileService';
import { Avatar } from '../ui/Avatar';

interface FXOfferDetailProps {
  offer: FXOffer;
  onBack: () => void;
  onStartTrade: (amount: number) => void;
  onContactTrader: () => void;
  currentTrade?: FXTrade | null;
}

export const FXOfferDetail: React.FC<FXOfferDetailProps> = ({
  offer,
  onBack,
  onStartTrade,
  onContactTrader,
  currentTrade,
}) => {
  const [tradeAmount, setTradeAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'terms' | 'profile'>('details');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCurrentUserMerchant, setIsCurrentUserMerchant] = useState(false);
  const [isOwnOffer, setIsOwnOffer] = useState(false);
  const [debugMode, setDebugMode] = useState(__DEV__); // Enable debug mode in development
  const [makerProfile, setMakerProfile] = useState<{ name?: string; avatar?: string; email?: string } | null>(null);
  const makerProfileId = offer.maker.profileUserId || offer.maker.firebaseUid || offer.maker.id;

  // Debug: Handle message icon click with rich logging (inside component scope)
  const handleContactTraderPress = () => {
    const currentUserId = currentUser?.id;
    const isMerchant = currentUser?.role === 'merchant' || currentUser?.merchantProfile?.status === 'approved';
    const ownOffer = currentUserId && currentUserId === offer.maker.id;
    console.log('💬 [FXOfferDetail] Message icon clicked', {
      offerId: offer.id,
      makerId: offer.maker.id,
      makerName: offer.maker.name,
      currentUserId,
      currentUserRole: currentUser?.role,
      isMerchant,
      isOwnOffer: ownOffer,
    });
    try {
      onContactTrader();
    } catch (e) {
      console.warn('⚠️ [FXOfferDetail] onContactTrader threw an error', e);
    }
  };

  // Role detection and user context
  useEffect(() => {
    const detectUserRole = async () => {
      try {
        const user = await authService.getCachedUser();
        
        setCurrentUser(user);
        
        // Check if this is the user's own offer - be more thorough
        const currentUserId = user?.id;
        const offerMakerId = offer.maker.id;
        const isOwn = !!currentUserId && currentUserId === offerMakerId;
        
        setIsOwnOffer(isOwn);
        
        // Check if user is a merchant - users who create FX offers are automatically merchants
        const isMerchant = user?.role === 'merchant' || user?.merchantProfile?.status === 'approved' || isOwn;
        setIsCurrentUserMerchant(isMerchant);
        
      } catch (error) {
        console.error('❌ [FXOfferDetail] Error detecting user role:', error);
      }
    };

    detectUserRole();
  }, [offer.maker.id]);

  useEffect(() => {
    const loadMakerProfile = async () => {
      if (!makerProfileId) {
        setMakerProfile({
          name: offer.maker.name,
          avatar: offer.maker.avatar,
          email: (offer.maker as any)?.email,
        });
        return;
      }
      try {
        const result = await profileService.getUserProfile(makerProfileId, true);
        if (result.success && result.profile) {
          setMakerProfile({
            name: result.profile.name,
            avatar: result.profile.avatar,
            email: result.profile.email,
          });
          return;
        }
      } catch (error) {
        console.warn('⚠️ [FXOfferDetail] Failed to load maker profile info:', error);
      }

      setMakerProfile({
        name: offer.maker.name,
        avatar: offer.maker.avatar,
        email: (offer.maker as any)?.email,
      });
    };

    loadMakerProfile();
  }, [makerProfileId, offer.maker.name, offer.maker.avatar]);

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
    
    // Context-aware dialog based on user role
    const title = isCurrentUserMerchant ? 'Accept Trade' : 'Start Trade';
    const message = isCurrentUserMerchant 
      ? `You will accept this trade: Buyer wants ${offer.sellCurrency.symbol}${amount} for ${offer.buyCurrency.symbol}${calculateReceiveAmount(amount)}.\n\nThis will create a trade room for 30 minutes.`
      : `You will sell ${offer.sellCurrency.symbol}${amount} for ${offer.buyCurrency.symbol}${calculateReceiveAmount(amount)}.\n\nThis will lock the quote for 10 minutes.`;
    
    const actionText = isCurrentUserMerchant ? 'Accept Trade' : 'Start Trade';
    
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: actionText, onPress: () => {
          onStartTrade(amount);
        }}
      ]
    );
  };

  const renderTrustBadge = (badge: string | null | undefined) => {
    if (!badge) return null;
    
    const badgeConfig = {
      verified: { icon: 'verified', color: Colors.success, label: 'Verified' },
      premium: { icon: 'star', color: Colors.secondary, label: 'Premium' },
      pro: { icon: 'workspace-premium', color: Colors.primary, label: 'Pro' },
    };
    
    const config = badgeConfig[badge as keyof typeof badgeConfig];
    if (!config) return null;
    
    return (
      <View style={[FXTheme.badges.status, { backgroundColor: config.color + '20' }]}>
        <MaterialIcons name={config.icon as any} size={16} color={config.color} />
        <Typography variant="caption" style={[FXTheme.text.bold, { color: config.color, marginLeft: Spacing.sm }]}>
          {config.label}
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
      {/* Only show message icon when there's an active trade (accepted or later status) */}
      {currentTrade && ['accepted', 'quote_locked', 'escrow_pending', 'escrow_locked', 'payment_pending', 'payment_sent', 'payment_confirmed'].includes(currentTrade.status) ? (
        <TouchableOpacity style={FXTheme.buttons.icon} onPress={() => {
          onContactTrader();
        }}>
          <MaterialIcons name="message" size={24} color={Colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={FXTheme.buttons.icon} />
      )}
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
              Selling
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
              Receiving
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
      <Typography variant="h6" style={FXTheme.text.bold}>Trade Calculator</Typography>
      
      <View style={FXTheme.layouts.column}>
        <View style={FXTheme.layouts.column}>
          <Typography variant="body2" style={FXTheme.text.bold}>
            You sell ({offer.sellCurrency.code})
          </Typography>
          <View style={FXTheme.inputs.searchContainer}>
            <TextInput
              style={FXTheme.inputs.searchInput}
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

        <MaterialIcons name="arrow-downward" size={24} color={Colors.primary} style={FXTheme.spacing.marginVertical('md')} />

        <View style={FXTheme.layouts.column}>
          <Typography variant="body2" style={FXTheme.text.bold}>
            You receive ({offer.buyCurrency.code})
          </Typography>
          <View style={[FXTheme.inputs.searchContainer, { backgroundColor: Colors.gray100 }]}>
            <Typography variant="h5" color="primary">
              {offer.buyCurrency.symbol}{tradeAmount ? calculateReceiveAmount(parseFloat(tradeAmount)).toLocaleString() : '0'}
            </Typography>
          </View>
        </View>
      </View>

      {tradeAmount && !isValidAmount() && (
        <View style={[FXTheme.layouts.row, { backgroundColor: Colors.error + '10', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md }]}>
          <MaterialIcons name="error" size={16} color={Colors.error} />
          <Typography variant="caption" color="error" style={FXTheme.spacing.marginHorizontal('sm')}>
            Amount must be between {offer.sellCurrency.symbol}{offer.minTrade} and {offer.sellCurrency.symbol}{Math.min(offer.maxTrade, offer.availableAmount)}
          </Typography>
        </View>
      )}

      {/* Context-aware button based on user role, ownership, and trade state */}
      {(() => {
        // Debug logging for button context
        console.log('🔘 [FXOfferDetail] Button context:', {
          isCurrentUserMerchant,
          isOwnOffer,
          currentTrade: currentTrade?.id,
          tradeStatus: currentTrade?.status,
          tradeAmount,
          isValidAmount: isValidAmount(),
          'user.name': currentUser?.name,
          'offer.maker.name': offer.maker.name
        });

        // If there's an active trade, show trade-specific actions
        if (currentTrade) {
          switch (currentTrade.status) {
            case 'pending':
              return isOwnOffer ? (
                <Button
                  title="Accept Trade Request"
                  onPress={() => onStartTrade(parseFloat(tradeAmount))}
                  style={{ width: '100%' }}
                />
              ) : (
                <Button
                  title="Cancel Request"
                  onPress={() => onStartTrade(parseFloat(tradeAmount))}
                  style={{ width: '100%', backgroundColor: Colors.error }}
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
                  title="View Trade Details"
                  onPress={() => onStartTrade(parseFloat(tradeAmount))}
                  style={{ width: '100%' }}
                />
              );
            default:
              return null;
          }
        }

        // If user owns this offer, show edit button
        if (isOwnOffer) {
          return (
            <Button
              title="Edit Offer"
              onPress={() => onStartTrade(parseFloat(tradeAmount))}
              style={{ width: '100%', backgroundColor: Colors.secondary }}
            />
          );
        }

        // For other users, show start trade button
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
              onStartTrade(parseFloat(tradeAmount));
            }}
            disabled={!tradeAmount || !isValidAmount()}
            style={{ width: '100%' }}
          />
        );
      })()}
    </Card>
  );

  const renderTabNavigation = () => (
    <View style={FXTheme.tabs.navigation}>
      {[
        { key: 'details', label: 'Details' },
        { key: 'terms', label: 'Terms' },
        { key: 'profile', label: 'Trader' },
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
        <Typography variant="h6" style={FXTheme.text.bold}>Trading Terms</Typography>
        <View style={FXTheme.layouts.column}>
          <View style={FXTheme.layouts.row}>
            <MaterialIcons name="access-time" size={16} color={Colors.gray600} />
            <Typography variant="body2" style={FXTheme.spacing.marginHorizontal('md')}>
              Payment must be completed within 30 minutes of trade start
            </Typography>
          </View>
          <View style={FXTheme.layouts.row}>
            <MaterialIcons name="warning" size={16} color={Colors.warning} />
            <Typography variant="body2" style={FXTheme.spacing.marginHorizontal('md')}>
              No escrow service - this is a peer-to-peer transaction
            </Typography>
          </View>
          <View style={FXTheme.layouts.row}>
            <MaterialIcons name="receipt" size={16} color={Colors.gray600} />
            <Typography variant="body2" style={FXTheme.spacing.marginHorizontal('md')}>
              Payment proof must be uploaded for verification
            </Typography>
          </View>
          <View style={FXTheme.layouts.row}>
            <MaterialIcons name="gavel" size={16} color={Colors.gray600} />
            <Typography variant="body2" style={FXTheme.spacing.marginHorizontal('md')}>
              Disputes will be resolved through platform arbitration
            </Typography>
          </View>
          {offer.kycRequired && (
            <View style={FXTheme.layouts.row}>
              <MaterialIcons name="verified-user" size={16} color={Colors.warning} />
              <Typography variant="body2" style={FXTheme.spacing.marginHorizontal('md')}>
                KYC verification required before trade completion
              </Typography>
            </View>
          )}
        </View>
      </Card>

      {offer.terms && (
        <Card style={FXTheme.cards.section}>
          <Typography variant="h6" style={FXTheme.text.bold}>Additional Terms</Typography>
          <Typography variant="body2" style={{ lineHeight: 22, fontStyle: 'italic' }}>
            {offer.terms}
          </Typography>
        </Card>
      )}

      {offer.autoReply && (
        <Card style={FXTheme.cards.section}>
          <Typography variant="h6" style={FXTheme.text.bold}>Auto Reply Message</Typography>
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

  const renderProfileTab = () => {
    const makerName = makerProfile?.name || offer.maker.name;
    const makerAvatar = makerProfile?.avatar || offer.maker.avatar;
    const makerEmail = makerProfile?.email || (offer.maker as any)?.email;

    return (
      <View>
        <Card style={FXTheme.cards.section}>
          <Typography variant="h6" style={FXTheme.text.bold}>Trader Profile</Typography>
          <View style={FXTheme.layouts.column}>
            <View style={FXTheme.layouts.row}>
              <View style={{ marginRight: Spacing.lg }}>
                <Avatar
                  userId={makerProfileId}
                  name={makerName}
                  imageUrl={makerAvatar}
                  size={80}
                  disableAutoLoad={!!makerProfile?.avatar}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    borderRadius: BorderRadius.full,
                    borderWidth: 3,
                    borderColor: Colors.background,
                    backgroundColor:
                      offer.maker.onlineStatus === 'online'
                        ? Colors.success
                        : offer.maker.onlineStatus === 'away'
                          ? Colors.warning
                          : Colors.gray400,
                  }}
                />
              </View>
              <View style={FXTheme.layouts.column}>
                <Typography variant="h5" style={FXTheme.text.bold}>
                  {makerName}
                </Typography>
                {makerEmail && (
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                    {makerEmail}
                  </Typography>
                )}
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
                Completed Trades
              </Typography>
              <Typography variant="body1" style={FXTheme.stats.value}>
                {offer.maker.completedTrades}
              </Typography>
            </View>
            <View style={FXTheme.stats.item}>
              <Typography variant="caption" color="textSecondary" style={FXTheme.stats.label}>
                Response Time
              </Typography>
              <Typography variant="body1" style={FXTheme.stats.value}>
                {offer.maker.responseTime}
              </Typography>
            </View>
            <View style={FXTheme.stats.item}>
              <Typography variant="caption" color="textSecondary" style={FXTheme.stats.label}>
                Online Status
              </Typography>
              <Typography variant="body1" style={FXTheme.stats.value}>
                {offer.maker.onlineStatus}
              </Typography>
            </View>
          </View>

          {offer.maker.completedTrades < 10 && (
            <View
              style={[
                FXTheme.layouts.row,
                {
                  backgroundColor: Colors.info + '10',
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  borderRadius: BorderRadius.md,
                  marginTop: Spacing.md,
                },
              ]}
            >
              <MaterialIcons name="info" size={16} color={Colors.info} />
              <Typography
                variant="caption"
                style={[
                  FXTheme.spacing.marginHorizontal('sm'),
                  {
                    flex: 1,
                    color: Colors.info,
                    fontWeight: '500',
                  },
                ]}
              >
                New merchant - Trade with caution and start with smaller amounts
              </Typography>
            </View>
          )}
        </Card>
      </View>
    );
  };

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
      </ScrollView>
    </View>
  );
};
