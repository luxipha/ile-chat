import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { FXTrade, TradeMessage } from '../../types/fx';

interface TradeRoomProps {
  trade: FXTrade;
  onBack: () => void;
  onUploadPaymentProof: (file: any) => void;
  onConfirmPayment: () => void;
  onSignRelease: () => void;
  onOpenDispute: (reason: string) => void;
  onCompleteRating: (rating: number, review: string) => void;
}

export const TradeRoom: React.FC<TradeRoomProps> = ({
  trade,
  onBack,
  onUploadPaymentProof,
  onConfirmPayment,
  onSignRelease,
  onOpenDispute,
  onCompleteRating,
}) => {
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const isUserMaker = trade.maker.id === 'current_user_id'; // Replace with actual user ID check
  const otherParty = isUserMaker ? trade.taker : trade.maker;

  useEffect(() => {
    // Initialize with system messages based on trade status
    const systemMessages: TradeMessage[] = [
      {
        id: '1',
        tradeId: trade.id,
        type: 'system',
        content: `Trade started! ${trade.maker.name} will receive ${trade.sellCurrency.symbol}${trade.sellAmount} and send ${trade.buyCurrency.symbol}${trade.buyAmount}.`,
        timestamp: trade.createdAt,
        systemEventType: 'escrow_locked',
      },
    ];

    if (trade.status === 'escrow_locked') {
      systemMessages.push({
        id: '2',
        tradeId: trade.id,
        type: 'system',
        content: `Escrow locked: ${trade.escrowAmount} ${trade.escrowCurrency} secured in smart contract.`,
        timestamp: new Date(trade.createdAt.getTime() + 30000),
        systemEventType: 'escrow_locked',
      });

      systemMessages.push({
        id: '3',
        tradeId: trade.id,
        type: 'system',
        content: `Payment window started: ${trade.paymentWindow.end.getMinutes() - trade.paymentWindow.start.getMinutes()} minutes to complete payment.`,
        timestamp: trade.paymentWindow.start,
        systemEventType: 'payment_window_started',
      });
    }

    setMessages(systemMessages);

    // Set up timer for payment window
    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = trade.paymentWindow.end.getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [trade]);

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage: TradeMessage = {
      id: Date.now().toString(),
      tradeId: trade.id,
      type: 'user',
      senderId: 'current_user_id', // Replace with actual user ID
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText('');

    // Auto-scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleUploadPaymentProof = () => {
    Alert.alert(
      'Upload Payment Proof',
      'Choose how to upload payment confirmation',
      [
        { text: 'Take Photo', onPress: () => uploadProof('camera') },
        { text: 'Choose from Gallery', onPress: () => uploadProof('gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const uploadProof = (type: 'camera' | 'gallery') => {
    // Mock upload - in real app would use image picker
    const mockProof = {
      transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9),
      receipt: 'https://example.com/receipt.jpg',
      amount: trade.sellAmount,
      currency: trade.sellCurrency.code,
      method: trade.paymentMethod.name,
    };

    const proofMessage: TradeMessage = {
      id: Date.now().toString(),
      tradeId: trade.id,
      type: 'payment_proof',
      senderId: 'current_user_id',
      content: `Payment sent: ${trade.sellCurrency.symbol}${trade.sellAmount}`,
      timestamp: new Date(),
      paymentProof: mockProof,
    };

    setMessages(prev => [...prev, proofMessage]);
    onUploadPaymentProof(mockProof);

    // Add system confirmation
    setTimeout(() => {
      const systemMessage: TradeMessage = {
        id: (Date.now() + 1).toString(),
        tradeId: trade.id,
        type: 'system',
        content: 'Payment proof uploaded. Waiting for seller confirmation.',
        timestamp: new Date(),
        systemEventType: 'payment_sent',
      };
      setMessages(prev => [...prev, systemMessage]);
    }, 1000);
  };

  const handleConfirmPayment = () => {
    Alert.alert(
      'Confirm Payment Received',
      'Have you received the payment? This action cannot be undone.',
      [
        { text: 'No, Not Yet', style: 'cancel' },
        { text: 'Yes, Received', onPress: () => {
          onConfirmPayment();
          
          const systemMessage: TradeMessage = {
            id: Date.now().toString(),
            tradeId: trade.id,
            type: 'system',
            content: 'Payment confirmed! Initiating fund release...',
            timestamp: new Date(),
            systemEventType: 'payment_confirmed',
          };
          setMessages(prev => [...prev, systemMessage]);
        }},
      ]
    );
  };

  const handleOpenDispute = () => {
    if (!disputeReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the dispute');
      return;
    }

    onOpenDispute(disputeReason);
    
    const disputeMessage: TradeMessage = {
      id: Date.now().toString(),
      tradeId: trade.id,
      type: 'dispute',
      senderId: 'current_user_id',
      content: 'Dispute opened',
      timestamp: new Date(),
      disputeData: {
        reason: disputeReason,
      },
    };

    setMessages(prev => [...prev, disputeMessage]);
    setShowDispute(false);
    setDisputeReason('');
  };

  const renderTradeHeader = () => (
    <View style={styles.tradeHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      
      <View style={styles.tradeInfo}>
        <Typography variant="h6" style={styles.tradeTitle}>
          Trade with {otherParty.name}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          ID: {trade.id.substr(0, 8)}...
        </Typography>
      </View>

      <View style={styles.tradeStatus}>
        <View style={[styles.statusIndicator, { 
          backgroundColor: getStatusColor(trade.status) 
        }]} />
        <Typography variant="caption" style={styles.statusText}>
          {getStatusLabel(trade.status)}
        </Typography>
      </View>
    </View>
  );

  const renderTradeProgress = () => (
    <Card style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Typography variant="h6">Trade Progress</Typography>
        {timeRemaining > 0 && trade.status === 'payment_pending' && (
          <View style={styles.timer}>
            <MaterialIcons name="timer" size={16} color={Colors.warning} />
            <Typography variant="caption" color="warning" style={styles.timerText}>
              {formatTimeRemaining(timeRemaining)} left
            </Typography>
          </View>
        )}
      </View>

      <View style={styles.tradeAmount}>
        <Typography variant="body2" color="textSecondary">
          {isUserMaker ? 'You sell' : 'You buy'}
        </Typography>
        <Typography variant="h5" color="primary">
          {trade.sellCurrency.symbol}{trade.sellAmount.toLocaleString()} {trade.sellCurrency.code}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {isUserMaker ? 'You receive' : 'You pay'}
        </Typography>
        <Typography variant="h5">
          {trade.buyCurrency.symbol}{trade.buyAmount.toLocaleString()} {trade.buyCurrency.code}
        </Typography>
      </View>

      {renderActionButtons()}
    </Card>
  );

  const renderActionButtons = () => {
    switch (trade.status) {
      case 'payment_pending':
        if (!isUserMaker) {
          return (
            <View style={styles.actionButtons}>
              <Button
                title="Upload Payment Proof"
                onPress={handleUploadPaymentProof}
                style={styles.actionButton}
              />
              <Button
                title="Open Dispute"
                variant="outline"
                onPress={() => setShowDispute(true)}
                style={styles.actionButton}
              />
            </View>
          );
        } else {
          return (
            <View style={styles.actionButtons}>
              <Button
                title="Confirm Payment Received"
                onPress={handleConfirmPayment}
                style={styles.actionButton}
                disabled={!hasPaymentProof()}
              />
              <Button
                title="Open Dispute"
                variant="outline"
                onPress={() => setShowDispute(true)}
                style={styles.actionButton}
              />
            </View>
          );
        }

      case 'payment_confirmed':
        return (
          <View style={styles.actionButtons}>
            <Button
              title="Release Funds"
              onPress={onSignRelease}
              style={styles.actionButton}
            />
          </View>
        );

      case 'completed':
        return (
          <View style={styles.actionButtons}>
            <Button
              title="Rate Trading Partner"
              onPress={() => {/* Show rating modal */}}
              style={styles.actionButton}
              variant="outline"
            />
          </View>
        );

      default:
        return null;
    }
  };

  const hasPaymentProof = () => {
    return messages.some(msg => msg.type === 'payment_proof');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quote_locked': return Colors.primary;
      case 'escrow_locked': return Colors.primary;
      case 'payment_pending': return Colors.warning;
      case 'payment_confirmed': return Colors.success;
      case 'completed': return Colors.success;
      case 'disputed': return Colors.error;
      case 'cancelled': return Colors.gray400;
      default: return Colors.gray400;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'quote_locked': return 'Quote Locked';
      case 'escrow_locked': return 'Escrow Active';
      case 'payment_pending': return 'Payment Pending';
      case 'payment_confirmed': return 'Payment Confirmed';
      case 'completed': return 'Completed';
      case 'disputed': return 'Disputed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const renderMessage = ({ item: message }: { item: TradeMessage }) => {
    const isOwnMessage = message.senderId === 'current_user_id';
    const isSystemMessage = message.type === 'system';

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessage}>
          <View style={styles.systemMessageContent}>
            <MaterialIcons 
              name={getSystemMessageIcon(message.systemEventType)} 
              size={16} 
              color={Colors.primary} 
            />
            <Typography variant="body2" style={styles.systemMessageText}>
              {message.content}
            </Typography>
          </View>
          <Typography variant="caption" color="textSecondary" style={styles.systemTimestamp}>
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </View>
      );
    }

    if (message.type === 'payment_proof') {
      return (
        <View style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}>
          <Card style={[styles.paymentProofCard, isOwnMessage && styles.ownPaymentProof]}>
            <View style={styles.paymentProofHeader}>
              <MaterialIcons name="receipt" size={20} color={Colors.success} />
              <Typography variant="h6" style={styles.paymentProofTitle}>
                Payment Proof
              </Typography>
            </View>
            <Typography variant="body2" style={styles.paymentProofAmount}>
              {message.paymentProof?.currency} {message.paymentProof?.amount?.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Method: {message.paymentProof?.method}
            </Typography>
            {message.paymentProof?.transactionId && (
              <Typography variant="caption" color="textSecondary">
                ID: {message.paymentProof.transactionId}
              </Typography>
            )}
          </Card>
          <Typography variant="caption" color="textSecondary" style={styles.messageTimestamp}>
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}>
        <View style={[styles.messageBubble, isOwnMessage && styles.ownBubble]}>
          <Typography 
            variant="body2" 
            style={[styles.messageText, isOwnMessage && styles.ownMessageText]}
          >
            {message.content}
          </Typography>
        </View>
        <Typography variant="caption" color="textSecondary" style={styles.messageTimestamp}>
          {message.timestamp.toLocaleTimeString()}
        </Typography>
      </View>
    );
  };

  const getSystemMessageIcon = (eventType?: string) => {
    switch (eventType) {
      case 'escrow_locked': return 'lock';
      case 'payment_window_started': return 'timer';
      case 'payment_sent': return 'send';
      case 'payment_confirmed': return 'check-circle';
      case 'trade_completed': return 'done-all';
      default: return 'info';
    }
  };

  const renderDisputeModal = () => {
    if (!showDispute) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.disputeModal}>
          <Typography variant="h6" style={styles.disputeTitle}>
            Open Dispute
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.disputeDescription}>
            Describe the issue you're experiencing with this trade.
          </Typography>
          
          <TextInput
            style={styles.disputeInput}
            value={disputeReason}
            onChangeText={setDisputeReason}
            placeholder="Explain the problem..."
            multiline
            numberOfLines={4}
          />

          <View style={styles.disputeActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowDispute(false)}
              style={styles.disputeButton}
            />
            <Button
              title="Open Dispute"
              onPress={handleOpenDispute}
              style={styles.disputeButton}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderTradeHeader()}
      {renderTradeProgress()}
      
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity 
            onPress={sendMessage}
            style={[styles.sendButton, { opacity: messageText.trim() ? 1 : 0.5 }]}
            disabled={!messageText.trim()}
          >
            <MaterialIcons name="send" size={20} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {renderDisputeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  tradeInfo: {
    flex: 1,
  },
  tradeTitle: {
    fontWeight: '600',
  },
  tradeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusText: {
    fontWeight: '500',
  },
  progressCard: {
    margin: Spacing.lg,
    marginBottom: 0,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  tradeAmount: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    margin: Spacing.lg,
    marginTop: Spacing.md,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: Spacing.md,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  systemMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  systemMessageText: {
    marginLeft: Spacing.sm,
    textAlign: 'center',
  },
  systemTimestamp: {
    marginTop: Spacing.xs,
  },
  messageContainer: {
    alignItems: 'flex-start',
    marginVertical: Spacing.sm,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    maxWidth: '80%',
  },
  ownBubble: {
    backgroundColor: Colors.primary,
  },
  messageText: {
    color: Colors.textPrimary,
  },
  ownMessageText: {
    color: Colors.background,
  },
  messageTimestamp: {
    marginTop: Spacing.xs,
  },
  paymentProofCard: {
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '20',
  },
  ownPaymentProof: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary + '20',
  },
  paymentProofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentProofTitle: {
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  paymentProofAmount: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.md,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disputeModal: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    margin: Spacing.lg,
    width: '90%',
  },
  disputeTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  disputeDescription: {
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  disputeInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    textAlignVertical: 'top',
  },
  disputeActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  disputeButton: {
    flex: 1,
  },
});