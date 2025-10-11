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
import { FXTheme } from '../../theme/fxTheme';
import { FXTrade, TradeMessage } from '../../types/fx';
import authService from '../../services/authService';
import chatService, { createTradeRoomId } from '../../services/chatService';

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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCurrentUserMerchant, setIsCurrentUserMerchant] = useState(false);
  const [chatExpiresAt, setChatExpiresAt] = useState<Date | undefined>(undefined);
  const flatListRef = useRef<FlatList>(null);

  const isUserMaker = currentUser?.id === trade.maker.id;
  const isUserTaker = currentUser?.id === trade.taker.id;
  const otherParty = isUserMaker ? trade.taker : trade.maker;

  // User role detection
  useEffect(() => {
    const detectUserRole = async () => {
      try {
        const user = await authService.getCachedUser();
        console.log('👤 [TradeRoom] Current user:', user ? Object.keys(user) : 'null');
        console.log('👤 [TradeRoom] User role:', user?.role);
        console.log('👤 [TradeRoom] User ID:', user?.id);
        console.log('🎯 [TradeRoom] Trade context:', {
          tradeId: trade.id,
          makerId: trade.maker.id,
          takerId: trade.taker.id,
          currentUserId: user?.id,
          isUserMaker: user?.id === trade.maker.id,
          isUserTaker: user?.id === trade.taker.id,
          tradeStatus: trade.status
        });
        
        setCurrentUser(user);
        
        // Check if user is a merchant
        const isMerchant = user?.role === 'merchant' || user?.merchantProfile?.status === 'approved';
        setIsCurrentUserMerchant(isMerchant);
        console.log('🏪 [TradeRoom] Is current user merchant?', isMerchant);
        
      } catch (error) {
        console.error('❌ [TradeRoom] Error detecting user role:', error);
      }
    };

    detectUserRole();
  }, [trade.id, trade.maker.id, trade.taker.id]);

  useEffect(() => {
    // Payment window timer
    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = trade.paymentWindow.end.getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    // Firebase chat subscriptions
    const setupChat = async () => {
      const conversationId = trade.chatRoomId || createTradeRoomId(trade.id);
      await chatService.ensureConversation(conversationId, [trade.maker.id, trade.taker.id], false);

      const metaUnsub = chatService.subscribeToConversationMeta(conversationId, (meta) => {
        setChatExpiresAt(meta.expiresAt);
      });

      const msgUnsub = chatService.getMessages(conversationId, (chatMsgs) => {
        const mapped: TradeMessage[] = chatMsgs.map(m => {
          const paymentProof = m.paymentData ? {
            amount: m.paymentData.amount,
            currency: m.paymentData.currency,
            // ensure required string type
            method: m.paymentData.method || 'unknown',
            // include optional fields only when defined
            ...(m.paymentData.transactionId ? { transactionId: m.paymentData.transactionId } : {}),
            ...(m.paymentData.receipt ? { receipt: m.paymentData.receipt } : {}),
          } : undefined;

          return {
            id: m._id,
            tradeId: trade.id,
            type: m.type === 'payment' ? 'payment_proof' : (m.type === 'dispute' ? 'dispute' : 'user'),
            senderId: m.user?._id,
            content: m.text || '',
            timestamp: m.createdAt,
            paymentProof,
            disputeData: m.disputeData ? { reason: m.disputeData.reason } : undefined,
          };
        });
        setMessages(mapped);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      return () => {
        metaUnsub();
        msgUnsub();
      };
    };

    let cleanup: (() => void) | undefined;
    setupChat().then((fn) => { cleanup = fn; }).catch((e) => console.error('Chat setup error', e));

    return () => {
      clearInterval(timer);
      if (cleanup) cleanup();
    };
  }, [trade.id, trade.chatRoomId, trade.maker.id, trade.taker.id]);

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !currentUser?.id) return;
    const isExpired = chatExpiresAt && new Date() >= chatExpiresAt;
    if (isExpired) {
      Alert.alert('Chat expired', 'This trade chat has expired.');
      return;
    }

    const conversationId = trade.chatRoomId || createTradeRoomId(trade.id);
    await chatService.ensureConversation(conversationId, [trade.maker.id, trade.taker.id], false);
    await chatService.sendMessage(
      conversationId,
      messageText.trim(),
      { _id: currentUser.id, name: currentUser.name || 'You', avatar: currentUser.avatar },
      isUserMaker ? trade.taker.id : trade.maker.id,
      'text'
    );
    setMessageText('');
    setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
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

  const uploadProof = async (type: 'camera' | 'gallery') => {
    // Mock upload - in real app would use image picker
    const mockProof = {
      transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9),
      receipt: 'https://example.com/receipt.jpg',
      amount: trade.sellAmount,
      currency: trade.sellCurrency.code,
      method: trade.paymentMethod.name,
    };
    const conversationId = trade.chatRoomId || createTradeRoomId(trade.id);
    await chatService.ensureConversation(conversationId, [trade.maker.id, trade.taker.id], false);
    await chatService.sendMessage(
      conversationId,
      `Payment sent: ${trade.sellCurrency.symbol}${trade.sellAmount}`,
      { _id: currentUser?.id, name: currentUser?.name || 'You', avatar: currentUser?.avatar },
      isUserMaker ? trade.taker.id : trade.maker.id,
      'payment',
      { paymentData: mockProof }
    );
    onUploadPaymentProof(mockProof);
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

  const handleOpenDispute = async () => {
    if (!disputeReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the dispute');
      return;
    }

    onOpenDispute(disputeReason);
    const conversationId = trade.chatRoomId || createTradeRoomId(trade.id);
    await chatService.ensureConversation(conversationId, [trade.maker.id, trade.taker.id], false);
    await chatService.sendMessage(
      conversationId,
      'Dispute opened',
      { _id: currentUser?.id, name: currentUser?.name || 'You', avatar: currentUser?.avatar },
      isUserMaker ? trade.taker.id : trade.maker.id,
      'dispute',
      { disputeData: { reason: disputeReason, openedBy: currentUser?.id, status: 'open' } }
    );
    setShowDispute(false);
    setDisputeReason('');
  };

  const renderTradeHeader = () => (
    <View style={FXTheme.headers.withBorder}>
      <TouchableOpacity onPress={onBack} style={FXTheme.buttons.icon}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      
      <View style={FXTheme.layouts.column}>
        <Typography variant="h6" style={FXTheme.text.bold}>
          Trade with {otherParty.name}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          ID: {trade.id.substr(0, 8)}...
        </Typography>
      </View>

      <View style={FXTheme.layouts.row}>
        <View style={[{ 
          width: 8,
          height: 8,
          borderRadius: 4,
          marginRight: Spacing.sm,
          backgroundColor: getStatusColor(trade.status) 
        }]} />
        <Typography variant="caption" style={FXTheme.text.bold}>
          {getStatusLabel(trade.status)}
        </Typography>
      </View>
    </View>
  );

  const renderTradeProgress = () => (
    <Card style={FXTheme.cards.base}>
      <View style={FXTheme.layouts.rowBetween}>
        <Typography variant="h6">Trade Progress</Typography>
        {timeRemaining > 0 && trade.status === 'payment_pending' && (
          <View style={FXTheme.layouts.row}>
            <MaterialIcons name="timer" size={16} color={Colors.warning} />
            <Typography variant="caption" color="warning" style={[FXTheme.text.bold, { marginLeft: Spacing.xs }]}>
              {formatTimeRemaining(timeRemaining)} left
            </Typography>
          </View>
        )}
      </View>

      {chatExpiresAt && (
        <View style={[FXTheme.layouts.row, {
          backgroundColor: Colors.gray100,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.xs,
          borderRadius: BorderRadius.lg,
          marginBottom: Spacing.md,
        }]}>
          <MaterialIcons name="hourglass-top" size={16} color={Colors.gray600} />
          <Typography variant="caption" color="textSecondary" style={{ marginLeft: Spacing.xs }}>
            {new Date() >= chatExpiresAt ? 'Chat expired' : `Chat expires ${chatExpiresAt.toLocaleString()}`}
          </Typography>
        </View>
      )}

      <View style={[FXTheme.layouts.center, { marginBottom: Spacing.lg }]}>
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
            <View style={FXTheme.layouts.rowGap}>
              <Button
                title="Upload Payment Proof"
                onPress={handleUploadPaymentProof}
                style={{ flex: 1 }}
              />
              <Button
                title="Open Dispute"
                variant="outline"
                onPress={() => setShowDispute(true)}
                style={{ flex: 1 }}
              />
            </View>
          );
        } else {
          return (
            <View style={FXTheme.layouts.rowGap}>
              <Button
                title="Confirm Payment Received"
                onPress={handleConfirmPayment}
                style={{ flex: 1 }}
                disabled={!hasPaymentProof()}
              />
              <Button
                title="Open Dispute"
                variant="outline"
                onPress={() => setShowDispute(true)}
                style={{ flex: 1 }}
              />
            </View>
          );
        }

      case 'payment_confirmed':
        return (
          <View style={FXTheme.layouts.rowGap}>
            <Button
              title="Release Funds"
              onPress={onSignRelease}
              style={{ flex: 1 }}
            />
          </View>
        );

      case 'completed':
        return (
          <View style={FXTheme.layouts.rowGap}>
            <Button
              title="Rate Trading Partner"
              onPress={() => {/* Show rating modal */}}
              style={{ flex: 1 }}
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
    const isOwnMessage = message.senderId === currentUser?.id;
    const isSystemMessage = message.type === 'system';

    if (isSystemMessage) {
      return (
        <View style={FXTheme.layouts.center}>
          <View style={[FXTheme.layouts.row, {
            backgroundColor: Colors.gray100,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            borderRadius: BorderRadius.lg,
          }]}>
            <MaterialIcons 
              name={getSystemMessageIcon(message.systemEventType)} 
              size={16} 
              color={Colors.primary} 
            />
            <Typography variant="body2" style={[FXTheme.text.bold, { marginLeft: Spacing.sm, textAlign: 'center' }]}>
              {message.content}
            </Typography>
          </View>
          <Typography variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </View>
      );
    }

    if (message.type === 'payment_proof') {
      return (
        <View style={[FXTheme.layouts.column, isOwnMessage ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          <Card style={[{
            backgroundColor: isOwnMessage ? Colors.primary + '10' : Colors.success + '10',
            borderWidth: 1,
            borderColor: isOwnMessage ? Colors.primary + '20' : Colors.success + '20',
          }]}>
            <View style={FXTheme.layouts.row}>
              <MaterialIcons name="receipt" size={20} color={Colors.success} />
              <Typography variant="h6" style={[FXTheme.text.bold, { marginLeft: Spacing.sm }]}>
                Payment Proof
              </Typography>
            </View>
            <Typography variant="body2" style={[FXTheme.text.bold, { marginBottom: Spacing.xs }]}>
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
          <Typography variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </View>
      );
    }

    return (
      <View style={[FXTheme.layouts.column, isOwnMessage ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
        <View style={[{
          backgroundColor: isOwnMessage ? Colors.primary : Colors.gray100,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          borderRadius: BorderRadius.lg,
          maxWidth: '80%',
        }]}>
          <Typography 
            variant="body2" 
            style={[FXTheme.text.bold, { color: isOwnMessage ? Colors.background : Colors.textPrimary }]}
          >
            {message.content}
          </Typography>
        </View>
        <Typography variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
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
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <View style={{
          backgroundColor: Colors.background,
          borderRadius: BorderRadius.lg,
          padding: Spacing.xl,
          margin: Spacing.lg,
          width: '90%',
        }}>
          <Typography variant="h6" style={[FXTheme.text.bold, { marginBottom: Spacing.md }]}>
            Open Dispute
          </Typography>
          <Typography variant="body2" color="textSecondary" style={[FXTheme.text.bold, { marginBottom: Spacing.lg, lineHeight: 20 }]}>
            Describe the issue you're experiencing with this trade.
          </Typography>
          
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: Colors.gray300,
              borderRadius: BorderRadius.md,
              padding: Spacing.md,
              marginBottom: Spacing.lg,
              textAlignVertical: 'top',
            }}
            value={disputeReason}
            onChangeText={setDisputeReason}
            placeholder="Explain the problem..."
            multiline
            numberOfLines={4}
          />

          <View style={FXTheme.layouts.rowGap}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowDispute(false)}
              style={{ flex: 1 }}
            />
            <Button
              title="Open Dispute"
              onPress={handleOpenDispute}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={FXTheme.containers.screen}>
      {renderTradeHeader()}
      {renderTradeProgress()}
      
      <View style={{
        flex: 1,
        margin: Spacing.lg,
        marginTop: Spacing.md,
      }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: Spacing.md }}
        />

        <View style={[{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingTop: Spacing.md,
          borderTopWidth: 1,
          borderTopColor: Colors.gray200,
        }, chatExpiresAt && new Date() >= chatExpiresAt ? { opacity: 0.6 } : null]}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: Colors.gray300,
              borderRadius: BorderRadius.lg,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              marginRight: Spacing.md,
              maxHeight: 100,
            }}
            value={messageText}
            onChangeText={setMessageText}
            placeholder={chatExpiresAt && new Date() >= chatExpiresAt ? 'Chat expired' : 'Type a message...'}
            editable={!(chatExpiresAt && new Date() >= chatExpiresAt)}
            multiline
          />
          <TouchableOpacity 
            onPress={sendMessage}
            style={[{
              width: 40,
              height: 40,
              borderRadius: BorderRadius.full,
              backgroundColor: Colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }, { opacity: messageText.trim() && !(chatExpiresAt && new Date() >= chatExpiresAt) ? 1 : 0.5 }]}
            disabled={!messageText.trim() || !!(chatExpiresAt && new Date() >= chatExpiresAt)}
          >
            <MaterialIcons name="send" size={20} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {renderDisputeModal()}
    </View>
  );
};