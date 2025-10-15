import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { StarRating } from '../../ui/StarRating';
import { Colors, Spacing } from '../../../theme';
import { FXTheme } from '../../../theme/fxTheme';
import { FXOffer } from '../../../types/fx';

interface OfferCardProps {
  offer: FXOffer;
  onPress?: (offer: FXOffer) => void;
  showFavoriteButton?: boolean;
  onFavoritePress?: (offer: FXOffer) => void;
  isFavorite?: boolean;
}

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
    <View style={[FXTheme.badges.status, { backgroundColor: config.color + '20' }]}>
      <MaterialIcons name={config.icon as any} size={12} color={config.color} />
    </View>
  );
};

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onPress,
  showFavoriteButton = false,
  onFavoritePress,
  isFavorite = false,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(offer);
    }
  };

  const handleFavoritePress = () => {
    if (onFavoritePress) {
      onFavoritePress(offer);
    }
  };

  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? { onPress: handlePress } : {};

  return (
    <TouchableOpacity onPress={handlePress} disabled={!onPress}>
      <Card style={FXTheme.cards.base}>
        <View style={FXTheme.layouts.rowBetween}>
          <View style={FXTheme.layouts.row}>
            <View style={FXTheme.layouts.centerHorizontal}>
              <View style={[
                {
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: Colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: Spacing.sm,
                }
              ]}>
                <Typography variant="body2" style={{ color: Colors.white, ...FXTheme.text.bold }}>
                  {offer.maker.name.charAt(0)}
                </Typography>
              </View>
              {offer.maker.onlineStatus === 'online' && (
                <View style={[
                  {
                    position: 'absolute',
                    bottom: -2,
                    right: Spacing.sm - 2,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: Colors.success,
                    borderWidth: 2,
                    borderColor: Colors.white,
                  }
                ]} />
              )}
            </View>
            <View style={FXTheme.layouts.column}>
              <Typography variant="body1" style={FXTheme.text.bold}>
                {offer.maker.name}
              </Typography>
              <View style={FXTheme.layouts.row}>
                <Typography variant="caption" color="textSecondary">
                  {offer.maker.completedTrades} trades •{' '}
                </Typography>
                <StarRating
                  initialRating={offer.maker.trustScore || 0}
                  readonly={true}
                  size={12}
                  showText={false}
                />
              </View>
            </View>
          </View>
          <View style={FXTheme.layouts.row}>
            {renderTrustBadge(offer.maker.trustBadge)}
            {showFavoriteButton && (
              <TouchableOpacity 
                onPress={handleFavoritePress}
                style={{
                  padding: 4,
                }}
              >
                <Typography variant="body2" style={{ color: isFavorite ? Colors.warning : Colors.gray400 }}>
                  {isFavorite ? '★' : '☆'}
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={FXTheme.trade.limits}>
          <View style={FXTheme.currency.side}>
            <Typography variant="caption" color="textSecondary">
              Selling
            </Typography>
            <View style={FXTheme.currency.info}>
              <Typography variant="body2" style={FXTheme.text.currencyCode}>
                {offer.sellCurrency.code}
              </Typography>
            </View>
            <Typography variant="h3" style={FXTheme.text.amount}>
              {offer.sellCurrency.symbol}{offer.sellAmount.toLocaleString()}
            </Typography>
          </View>

          <View style={FXTheme.currency.exchangeInfo}>
            <Typography variant="caption" color="textSecondary">
              Rate
            </Typography>
            <Typography variant="body1" style={FXTheme.text.rate}>
              {offer.exchangeRate}
            </Typography>
          </View>

          <View style={FXTheme.currency.sideRight}>
            <Typography variant="caption" color="textSecondary">
              Buying
            </Typography>
            <View style={FXTheme.currency.info}>
              <Typography variant="body2" style={FXTheme.text.currencyCode}>
                {offer.buyCurrency.code}
              </Typography>
            </View>
            <Typography variant="h3" style={FXTheme.text.amount}>
              {offer.buyCurrency.symbol}{offer.buyAmount.toLocaleString()}
            </Typography>
          </View>
        </View>

        <View style={FXTheme.payment.methods}>
          <Typography variant="caption" color="textSecondary">
            Payment:
          </Typography>
          <View style={FXTheme.payment.methodsList}>
            {offer.paymentMethods.map((method, index) => (
              <View key={index} style={FXTheme.badges.method}>
                <Typography variant="caption" style={FXTheme.payment.methodText}>
                  {method.name}
                </Typography>
              </View>
            ))}
          </View>
        </View>

        <View style={FXTheme.trade.terms}>
          <View style={FXTheme.trade.termItem}>
            <Typography variant="caption" color="textSecondary">
              Min Trade
            </Typography>
            <Typography variant="body2" style={FXTheme.trade.limitValue}>
              {offer.sellCurrency.symbol}{offer.minTrade.toLocaleString()}
            </Typography>
          </View>
          <View style={FXTheme.trade.termItem}>
            <Typography variant="caption" color="textSecondary">
              Max Trade
            </Typography>
            <Typography variant="body2" style={FXTheme.trade.limitValue}>
              {offer.sellCurrency.symbol}{offer.maxTrade.toLocaleString()}
            </Typography>
          </View>
          <View style={FXTheme.trade.termItem}>
            <Typography variant="caption" color="textSecondary">
              Time Limit
            </Typography>
            <Typography variant="body2" style={FXTheme.trade.limitValue}>
              {offer.paymentWindow}m
            </Typography>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};