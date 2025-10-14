import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Colors, Shadows } from '../../theme';
import { Typography } from '../ui/Typography';
import { LinearGradient } from 'expo-linear-gradient';

export interface PaymentMessageData {
  amount: number;
  currency: string;
  status: 'sending' | 'completed' | 'failed' | 'received';
  senderName?: string;
  recipientName?: string;
  note?: string;
  transactionId?: string;
  receipt?: string; // Image URL for payment proof
  method?: string;
}

interface PaymentMessageBubbleProps {
  paymentData: PaymentMessageData;
  isOwn: boolean;
  timestamp: Date;
  onPress?: () => void;
}

export const PaymentMessageBubble: React.FC<PaymentMessageBubbleProps> = ({
  paymentData,
  isOwn,
  timestamp,
  onPress,
}) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    }
    if (currency === 'USDC') {
      return `${amount.toFixed(2)} ${currency}`;
    }
    if (currency === 'APT') {
      return `${amount.toFixed(4)} ${currency}`;
    }
    return `${amount.toFixed(4)} ${currency}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (paymentData.status) {
      case 'sending':
        return 'schedule';
      case 'completed':
        return 'check-circle';
      case 'failed':
        return 'error';
      case 'received':
        return 'download';
      default:
        return 'payment';
    }
  };

  const getStatusColor = () => {
    switch (paymentData.status) {
      case 'sending':
        return ChatTheme.warning;
      case 'completed':
        return ChatTheme.success;
      case 'failed':
        return ChatTheme.error;
      case 'received':
        return ChatTheme.success;
      default:
        return ChatTheme.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (paymentData.status) {
      case 'sending':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'received':
        return isOwn ? 'Sent' : 'Received';
      default:
        return 'Pending';
    }
  };

  const getPaymentMessage = () => {
    if (isOwn) {
      return paymentData.recipientName 
        ? `Sent to ${paymentData.recipientName}`
        : 'Money sent';
    } else {
      return paymentData.senderName 
        ? `Received from ${paymentData.senderName}`
        : 'Money received';
    }
  };

  // Gold gradient colors for completed payments, navy for others
  const isCompleted = paymentData.status === 'completed' || paymentData.status === 'received';
  const gradientColors = isCompleted 
    ? Colors.gradientGold
    : Colors.gradientNavy;

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isOwn ? styles.ownContainer : styles.otherContainer
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header with icon and status */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialIcons 
              name="payments" 
              size={20} 
              color="white" 
            />
            <Typography variant="body1" style={styles.headerText}>
              {getPaymentMessage()}
            </Typography>
          </View>
          <MaterialIcons 
            name={getStatusIcon()} 
            size={16} 
            color="white"
          />
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Typography variant="h3" style={styles.amount}>
            {formatAmount(paymentData.amount, paymentData.currency)}
          </Typography>
        </View>

        {/* Note */}
        {paymentData.note && (
          <View style={styles.noteContainer}>
            <Typography variant="body2" style={styles.noteText}>
              "{paymentData.note}"
            </Typography>
          </View>
        )}

        {/* Footer with status and timestamp */}
        <View style={styles.footer}>
          <View style={styles.statusContainer}>
            <Typography variant="body2" style={styles.statusText}>
              {getStatusText()}
            </Typography>
          </View>
          <Typography variant="caption" style={styles.timestamp}>
            {formatTime(timestamp)}
          </Typography>
        </View>

        {/* Payment Method */}
        {paymentData.method && (
          <View style={styles.methodContainer}>
            <Typography variant="caption" style={styles.methodText}>
              Method: {paymentData.method}
            </Typography>
          </View>
        )}

        {/* Payment Proof Image */}
        {paymentData.receipt && (
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={() => setShowImageModal(true)}
          >
            <Image 
              source={{ uri: paymentData.receipt }} 
              style={styles.proofImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <MaterialIcons name="zoom-in" size={16} color="white" />
              <Typography variant="caption" style={styles.imageOverlayText}>
                Tap to view
              </Typography>
            </View>
          </TouchableOpacity>
        )}

        {/* Transaction ID for completed payments */}
        {isCompleted && paymentData.transactionId && (
          <View style={styles.transactionIdContainer}>
            <Typography variant="caption" style={styles.transactionId}>
              {`ID: ${paymentData.transactionId.slice(-8)}`}
            </Typography>
          </View>
        )}
      </LinearGradient>

      {/* Decorative elements */}
      <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle3]} />

      {/* Full-screen image modal */}
      {paymentData.receipt && (
        <Modal
          visible={showImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImageModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowImageModal(false)}
              >
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Image 
                source={{ uri: paymentData.receipt }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              <View style={styles.modalFooter}>
                <Typography variant="body2" style={styles.modalText}>
                  Payment Proof - {paymentData.method || 'Unknown Method'}
                </Typography>
                <Typography variant="caption" style={styles.modalSubText}>
                  Transaction ID: {paymentData.transactionId}
                </Typography>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: ChatSpacing.xs,
    maxWidth: '85%',
    position: 'relative',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  gradient: {
    borderRadius: 16,
    padding: ChatSpacing.md,
    minHeight: 120,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ChatSpacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: ChatSpacing.xs,
    fontSize: 14,
  },
  amountContainer: {
    alignItems: 'center',
    marginVertical: ChatSpacing.sm,
  },
  amount: {
    color: 'white',
    fontWeight: '700',
    fontSize: 24,
    textAlign: 'center',
  },
  noteContainer: {
    backgroundColor: Colors.overlayLight,
    borderRadius: 8,
    paddingHorizontal: ChatSpacing.sm,
    paddingVertical: ChatSpacing.xs,
    marginBottom: ChatSpacing.sm,
  },
  noteText: {
    color: 'white',
    fontStyle: 'italic',
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timestamp: {
    color: Colors.overlayText,
    fontSize: 11,
  },
  transactionIdContainer: {
    marginTop: ChatSpacing.xs,
    paddingTop: ChatSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.overlayMedium,
  },
  transactionId: {
    color: Colors.overlayTextSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  decorativeCircle: {
    position: 'absolute',
    backgroundColor: Colors.overlayDark,
    borderRadius: 50,
  },
  decorativeCircle1: {
    width: 20,
    height: 20,
    top: 10,
    right: 15,
  },
  decorativeCircle2: {
    width: 12,
    height: 12,
    bottom: 20,
    left: 20,
  },
  decorativeCircle3: {
    width: 8,
    height: 8,
    top: 40,
    right: 25,
  },
  methodContainer: {
    marginTop: ChatSpacing.xs,
    paddingTop: ChatSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.overlayMedium,
  },
  methodText: {
    color: Colors.overlayTextSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  imageContainer: {
    marginTop: ChatSpacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  proofImage: {
    width: '100%',
    height: 80,
    backgroundColor: Colors.overlayMedium,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.overlayDark,
    paddingVertical: ChatSpacing.xs,
    paddingHorizontal: ChatSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 10,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ChatSpacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    backgroundColor: Colors.overlayDark,
    borderRadius: 20,
    padding: ChatSpacing.sm,
  },
  fullScreenImage: {
    width: '100%',
    height: '70%',
    backgroundColor: Colors.overlayMedium,
  },
  modalFooter: {
    marginTop: ChatSpacing.lg,
    alignItems: 'center',
  },
  modalText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  modalSubText: {
    color: Colors.overlayText,
    textAlign: 'center',
    marginTop: ChatSpacing.xs,
  },
});