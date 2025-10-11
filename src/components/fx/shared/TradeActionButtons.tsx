import React, { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../../theme';
import { FXTheme } from '../../../theme/fxTheme';
import { FXOffer, FXTrade } from '../../../types/fx';

interface TradeActionButtonsProps {
  offer: FXOffer;
  onStartTrade: (amount: number) => void;
  currentTrade?: FXTrade | null;
  currentUser?: any;
  isCurrentUserMerchant?: boolean;
  isOwnOffer?: boolean;
  showCalculator?: boolean;
}

export const TradeActionButtons: React.FC<TradeActionButtonsProps> = ({
  offer,
  onStartTrade,
  currentTrade,
  currentUser,
  isCurrentUserMerchant = false,
  isOwnOffer = false,
  showCalculator = true,
}) => {
  const [tradeAmount, setTradeAmount] = useState('');

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

  const renderTradeCalculator = () => {
    if (!showCalculator) return null;

    return (
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

        {renderActionButton()}
      </Card>
    );
  };

  const renderActionButton = () => {
    // If there's an active trade, show trade-specific actions
    if (currentTrade) {
      switch (currentTrade.status) {
        case 'pending':
        case 'pending_acceptance':
          return isOwnOffer ? (
            <Button
              title="Accept Trade Request"
              onPress={() => onStartTrade(parseFloat(tradeAmount))}
              style={{ width: '100%' }}
            />
          ) : (
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
          handleStartTrade();
        }}
        disabled={!tradeAmount || !isValidAmount()}
        style={{ width: '100%' }}
      />
    );
  };

  // If calculator is disabled, just show the action button
  if (!showCalculator) {
    return (
      <View style={{ padding: Spacing.md }}>
        {renderActionButton()}
      </View>
    );
  }

  return renderTradeCalculator();
};