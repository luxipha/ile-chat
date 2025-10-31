import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { formatTime } from '../../utils/timeUtils';

export type PaymentRequestStatus = 'pending' | 'paid' | 'expired' | 'cancelled';

interface PaymentRequestBubbleProps {
  requestId: string;
  amount: number;
  currency: string;
  status: PaymentRequestStatus;
  isOwn: boolean;
  timestamp: Date;
  onPay?: (requestId: string) => void;
  onViewDetails?: (requestId: string) => void;
  network?: 'base' | 'hedera' | 'ethereum';
}

export const PaymentRequestBubble: React.FC<PaymentRequestBubbleProps> = ({
  requestId,
  amount,
  currency,
  status,
  isOwn,
  timestamp,
  onPay,
  onViewDetails,
  network = 'base',
}) => {
  const canPay = status === 'pending' && !isOwn && typeof onPay === 'function';

  const statusColor = (() => {
    switch (status) {
      case 'paid':
        return Colors.success;
      case 'expired':
      case 'cancelled':
        return Colors.gray500;
      default:
        return Colors.secondary;
    }
  })();

  const statusLabel = (() => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  })();

  const networkLabel = (() => {
    switch (network) {
      case 'hedera':
        return 'Hedera';
      case 'ethereum':
        return 'Ethereum';
      default:
        return 'Base';
    }
  })();

  const handlePress = () => {
    if (canPay) {
      onPay?.(requestId);
    } else if (typeof onViewDetails === 'function') {
      onViewDetails(requestId);
    }
  };

  const gradientColors = isOwn ? Colors.gradientGold : ['#FFFFFF', '#F6F7FF'];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={!canPay && typeof onViewDetails !== 'function'}
      style={[styles.container, isOwn ? styles.alignEnd : styles.alignStart]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, isOwn ? styles.ownCard : styles.otherCard]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <MaterialIcons
              name="request-page"
              size={20}
              color={isOwn ? 'white' : Colors.primary}
            />
            <Typography
              variant="body1"
              style={[styles.headerTitle, isOwn && styles.headerTitleDark]}
            >
              Payment Request
            </Typography>
          </View>
          <View
            style={[
              styles.statusChip,
              {
                backgroundColor: isOwn ? 'rgba(255,255,255,0.25)' : statusColor + '1A',
              },
            ]}
          >
            <Typography
              variant="caption"
              style={[
                styles.statusText,
                { color: isOwn ? '#FFFFFF' : statusColor },
              ]}
            >
              {statusLabel}
            </Typography>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Typography
            variant="h3"
            style={[styles.amountText, isOwn && styles.amountTextDark]}
          >
            {amount.toFixed(2)} {currency}
          </Typography>
          <Typography
            variant="body2"
            style={[styles.networkTag, isOwn && styles.networkTagDark]}
          >
            ({networkLabel} network)
          </Typography>
        </View>

        <View style={styles.footerRow}>
          <Typography
            variant="caption"
            style={[styles.timeText, isOwn && styles.timeTextDark]}
          >
            {formatTime(timestamp)}
          </Typography>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '88%',
    minWidth: 260,
  },
  alignEnd: {
    alignSelf: 'flex-end',
  },
  alignStart: {
    alignSelf: 'flex-start',
  },
  card: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius['3xl'] ?? BorderRadius.lg,
    shadowColor: '#1A1747',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    flexShrink: 0,
  },
  ownCard: {
    minWidth: 220,
  },
  otherCard: {
    borderWidth: 1,
    borderColor: Colors.primary + '12',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  statusChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontWeight: '600',
  },
  amountRow: {
    marginTop: Spacing.lg,
  },
  amountText: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  amountTextDark: {
    color: '#FFFFFF',
  },
  networkTag: {
    marginTop: Spacing.xs,
    color: Colors.gray600,
  },
  networkTagDark: {
    color: 'rgba(255,255,255,0.85)',
  },
  footerRow: {
    marginTop: Spacing['2xl'],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: Colors.gray600,
  },
  timeTextDark: {
    color: 'rgba(255,255,255,0.75)',
  },
});

export default PaymentRequestBubble;
