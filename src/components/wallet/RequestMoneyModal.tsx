import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Clipboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { paymentRequestService, CreatePaymentRequestPayload } from '../../services/paymentRequestService';
import { PaymentRequest } from '../../types';
import authService from '../../services/authService';
import chatService, { createConversationId } from '../../services/chatService';
import friendService, { Friend } from '../../services/friendService';
import shareService from '../../services/shareService';

interface RequestMoneyModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestCreated?: (request: PaymentRequest) => void;
}

type RequestStep = 'form' | 'preview' | 'share';

const INITIAL_STATE = {
  amount: '',
  note: '',
};

const NETWORK_LABELS: Record<'base' | 'hedera' | 'ethereum', string> = {
  base: 'Base (USDC)',
  hedera: 'Hedera (USDC)',
  ethereum: 'Ethereum (USDC)',
};

export const RequestMoneyModal: React.FC<RequestMoneyModalProps> = ({
  visible,
  onClose,
  onRequestCreated,
}) => {
  const [step, setStep] = useState<RequestStep>('form');
  const [amount, setAmount] = useState(INITIAL_STATE.amount);
  const [note, setNote] = useState(INITIAL_STATE.note);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [network] = useState<'base' | 'hedera' | 'ethereum'>('base');

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setStep('form');
    setAmount(INITIAL_STATE.amount);
    setNote(INITIAL_STATE.note);
    setIsSubmitting(false);
    setRequest(null);
    setError(null);
    setFriends([]);
    setIsLoadingFriends(false);
    setIsSharing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateAmount = (value: string) => {
    const numericAmount = parseFloat(value);
    return !Number.isNaN(numericAmount) && numericAmount > 0;
  };

  const formattedAmount = useMemo(() => {
    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount)) {
      return '0.00';
    }
    return numericAmount.toFixed(2);
  }, [amount]);

  const handleCreateRequest = async () => {
    if (!validateAmount(amount)) {
      setError('Enter a valid amount greater than zero.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload: CreatePaymentRequestPayload = {
        amount: parseFloat(amount),
        currency: 'USDC',
        network,
        note: note.trim() ? note.trim() : undefined,
      };

      const response = await paymentRequestService.createRequest(payload);
      if (!response.success || !response.data?.request) {
        throw new Error(response.error || 'Failed to create request');
      }

      setRequest(response.data.request);
      setStep('preview');
      onRequestCreated?.(response.data.request);
    } catch (createError) {
      console.error('Failed to create payment request:', createError);
      Alert.alert(
        'Request Failed',
        createError instanceof Error ? createError.message : 'Unable to create payment request.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!request) return;
    try {
      await Clipboard.setString(request.deepLink);
      Alert.alert('Copied', 'Payment request link copied to clipboard.');
    } catch (copyError) {
      Alert.alert('Copy Failed', 'Unable to copy link. Please try again.');
    }
  };

  const handleShareLink = async () => {
    if (!request) return;
    await shareService.shareText(
      `Payment request (${NETWORK_LABELS[request.network || 'base']}): ${request.amount.toFixed(2)} ${request.currency}. Note: ${request.note || 'No note'}. Link: ${request.deepLink}`,
      'ilePay Payment Request'
    );
  };

  const loadFriends = async () => {
    if (friends.length || isLoadingFriends) return;

    setIsLoadingFriends(true);
    try {
      const response = await friendService.getFriends();
      if (response.success) {
        setFriends(response.friends || []);
      }
    } catch (friendsError) {
      console.error('Failed to load friends list:', friendsError);
      Alert.alert('Error', 'Unable to load your contacts. Please try again later.');
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleShareInChat = async (friend: Friend) => {
    if (!request) return;
    setIsSharing(true);

    try {
      const session = await authService.getSession();
      if (!session.success || !session.user) {
        throw new Error('You must be logged in to share payment requests.');
      }

      const senderId = session.user.id || session.user._id;
      if (!senderId) {
        throw new Error('Missing user identifier');
      }

      const senderName = session.user.name || session.user.email || 'You';
      const conversationId = friend.conversationId || createConversationId(senderId, friend.id);

      await chatService.ensureConversation(conversationId, [senderId, friend.id]);

      const messageText = `Payment request: ${request.amount.toFixed(2)} ${request.currency}`;

      const paymentRequestMetadata: any = {
        requestId: request.id,
        amount: request.amount,
        currency: request.currency,
        status: request.status,
        deepLink: request.deepLink,
        creatorId: request.creatorId || senderId,
        expiresAt: request.expiresAt,
      };

      if (request.note) {
        paymentRequestMetadata.note = request.note;
      }
      if (request.paidAt) {
        paymentRequestMetadata.paidAt = request.paidAt;
      }
      if (request.network) {
        paymentRequestMetadata.network = request.network;
      }

      const messageResult = await chatService.sendMessage(
        conversationId,
        messageText,
        {
          _id: senderId,
          name: senderName,
          avatar: session.user.avatar,
        },
        friend.id,
        'payment_request',
        {
          paymentRequest: paymentRequestMetadata,
        }
      );

      if (!messageResult?.success || !messageResult.messageId) {
        throw new Error('Failed to share payment request in chat');
      }

      const linkResponse = await paymentRequestService.attachMessage(request.id, {
        conversationId,
        messageId: messageResult.messageId,
      });

      if (linkResponse.success && linkResponse.data?.request) {
        setRequest(linkResponse.data.request);
      }

      Alert.alert('Shared', `Payment request sent to ${friend.name}.`);
      setStep('preview');
    } catch (shareError) {
      console.error('Failed to share payment request in chat:', shareError);
      Alert.alert(
        'Share Failed',
        shareError instanceof Error ? shareError.message : 'Unable to share request. Please try again.'
      );
    } finally {
      setIsSharing(false);
    }
  };

  const renderHeader = (title: string, subtitle?: string) => (
    <View style={styles.header}>
      <View>
        <Typography variant="h4" style={styles.headerTitle}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="textSecondary" style={styles.headerSubtitle}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <MaterialIcons name="close" size={24} color={Colors.gray700} />
      </TouchableOpacity>
    </View>
  );

  const renderForm = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {renderHeader('Request Money', 'Generate a payment link or QR to share with friends')}

      <Card style={styles.card}>
        <Typography variant="caption" color="textSecondary" style={styles.label}>
          Amount (USDC)
        </Typography>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          style={styles.input}
          placeholderTextColor={Colors.gray400}
        />

        <Typography variant="caption" color="textSecondary" style={[styles.label, { marginTop: Spacing.lg }]}>
          Note (optional)
        </Typography>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a message"
          style={[styles.input, styles.multilineInput]}
          multiline
          numberOfLines={3}
          maxLength={200}
          placeholderTextColor={Colors.gray400}
        />

        {error ? (
          <Typography variant="caption" color="error" style={styles.errorText}>
            {error}
          </Typography>
        ) : null}

        <Button
          title={isSubmitting ? 'Creating...' : 'Generate Request'}
          onPress={handleCreateRequest}
          disabled={isSubmitting}
          style={styles.primaryButton}
        />
      </Card>
    </ScrollView>
  );

  const renderPreview = () => {
    if (!request) return null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderHeader('Share Request', 'Share the link or QR code to get paid')}

        <Card style={styles.card}>
          <View style={styles.summaryRow}>
            <View>
              <Typography variant="caption" color="textSecondary">
                Amount
              </Typography>
              <Typography variant="h3">
                {request.amount.toFixed(2)} {request.currency}
              </Typography>
            </View>
            <View style={styles.statusBadge}>
              <Typography variant="caption" style={styles.statusBadgeText}>
                Pending
              </Typography>
            </View>
          </View>

          <View style={[styles.summaryRow, { marginTop: Spacing.md }]}>
            <Typography variant="caption" color="textSecondary">
              Network
            </Typography>
            <Typography variant="body2" style={styles.networkValue}>
              {NETWORK_LABELS[request.network || 'base']}
            </Typography>
          </View>

          {request.note ? (
            <View style={styles.noteBox}>
              <MaterialIcons name="notes" size={16} color={Colors.gray600} />
              <Typography variant="body2" style={styles.noteText}>
                {request.note}
              </Typography>
            </View>
          ) : null}

          <View style={styles.qrWrapper}>
            <Card style={styles.qrCard}>
              <QRCode value={request.qrData} size={180} backgroundColor="white" color="black" />
            </Card>
            <Typography variant="caption" color="textSecondary" style={{ marginTop: Spacing.sm }}>
              Scan to open payment request
            </Typography>
          </View>

          <View style={{ marginTop: Spacing.lg }}>
            <Button title="Copy Link" onPress={handleCopyLink} style={styles.outlineButton} variant="outline" />
            <Button title="Share Link" onPress={handleShareLink} style={styles.outlineButton} variant="outline" />
            <Button
              title="Share in Chat"
              onPress={() => {
                setStep('share');
                loadFriends();
              }}
              style={styles.primaryButton}
            />
          </View>
        </Card>
      </ScrollView>
    );
  };

  const renderShareList = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {renderHeader('Share in Chat', 'Select a contact to send your request')}

      <Card style={styles.card}>
        <TouchableOpacity style={styles.backRow} onPress={() => setStep('preview')}>
          <MaterialIcons name="arrow-back" size={20} color={Colors.primary} />
          <Typography variant="body2" style={{ color: Colors.primary }}>
            Back to request
          </Typography>
        </TouchableOpacity>

        {isLoadingFriends ? (
          <View style={styles.loadingBox}>
            <Typography variant="body2" color="textSecondary">
              Loading contacts...
            </Typography>
          </View>
        ) : friends.length === 0 ? (
          <View style={styles.loadingBox}>
            <Typography variant="body2" color="textSecondary">
              No friends found. Add contacts to share directly in chat.
            </Typography>
          </View>
        ) : (
          friends.map((friend) => (
            <TouchableOpacity
              key={friend.id}
              style={styles.friendRow}
              onPress={() => handleShareInChat(friend)}
              disabled={isSharing}
            >
              <View style={styles.friendAvatar}>
                <MaterialIcons name="person" size={20} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="body1">{friend.name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {friend.email || 'ilePay friend'}
                </Typography>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          ))
        )}
      </Card>
    </ScrollView>
  );

  const renderContent = () => {
    switch (step) {
      case 'form':
        return renderForm();
      case 'preview':
        return renderPreview();
      case 'share':
        return renderShareList();
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>{renderContent()}</View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Spacing['3xl'],
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerSubtitle: {
    marginTop: Spacing.xs,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
  },
  label: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  errorText: {
    marginTop: Spacing.sm,
  },
  primaryButton: {
    marginTop: Spacing.lg,
  },
  outlineButton: {
    marginTop: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    color: Colors.white,
    fontWeight: '600',
  },
  networkValue: {
    fontWeight: '600',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  noteText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  qrWrapper: {
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  qrCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  loadingBox: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
});

export default RequestMoneyModal;
