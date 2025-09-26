import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { PaymentMessageBubble, PaymentMessageData } from './PaymentMessageBubble';

export interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  senderName?: string;
  senderAvatar?: string;
  type?: 'text' | 'payment' | 'attachment' | 'loan_request' | 'loan_funded' | 'loan_offer' | 'loan_repayment';
  paymentData?: {
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    note?: string;
  };
  attachmentData?: {
    type: 'camera' | 'gallery' | 'document';
    filename?: string;
    url?: string;
  };
  loanData?: {
    loanId: string;
    amount: number;
    currency: string;
    apr?: number;
    term?: number;
    type: 'collateralized' | 'uncollateralized';
    status: 'open' | 'funded' | 'active' | 'completed' | 'defaulted';
    borrowerName?: string;
    lenderName?: string;
    dueDate?: Date;
  };
}

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  showSenderName?: boolean;
  onAvatarPress?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar = false,
  showSenderName = false,
  onAvatarPress,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusIcon = () => {
    if (!message.isOwn) return null;
    
    switch (message.status) {
      case 'sending':
        return <MaterialIcons name="schedule" size={12} color={ChatTheme.textTertiary} />;
      case 'sent':
        return <MaterialIcons name="done" size={12} color={ChatTheme.textTertiary} />;
      case 'delivered':
        return <MaterialIcons name="done-all" size={12} color={ChatTheme.textTertiary} />;
      case 'read':
        return <MaterialIcons name="done-all" size={12} color={ChatTheme.success} />;
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'payment':
        if (!message.paymentData) return null;
        
        const paymentData: PaymentMessageData = {
          amount: message.paymentData.amount,
          currency: message.paymentData.currency,
          status: message.paymentData.status === 'pending' ? 'sending' : 
                 message.paymentData.status === 'completed' ? 'completed' : 'failed',
          senderName: message.isOwn ? undefined : message.senderName,
          recipientName: message.isOwn ? 'Recipient' : undefined,
          note: message.paymentData.note,
          transactionId: message.id,
        };
        
        return (
          <PaymentMessageBubble
            paymentData={paymentData}
            isOwn={message.isOwn}
            timestamp={message.timestamp}
            onPress={() => {
              // Handle payment message press - could show transaction details
              console.log('Payment message pressed:', message.id);
            }}
          />
        );
      
      case 'attachment':
        return (
          <View style={styles.attachmentContainer}>
            <MaterialIcons 
              name={
                message.attachmentData?.type === 'camera' ? 'camera-alt' :
                message.attachmentData?.type === 'gallery' ? 'photo' : 'attach-file'
              } 
              size={20} 
              color={ChatTheme.primary} 
            />
            <Text style={[
              styles.attachmentText,
              message.isOwn ? styles.ownText : styles.otherText
            ]}>
              {message.attachmentData?.filename || 
               `${message.attachmentData?.type} attachment`}
            </Text>
          </View>
        );
      
      case 'loan_request':
        return (
          <View style={styles.loanContainer}>
            <View style={styles.loanHeader}>
              <MaterialIcons name="handshake" size={20} color={ChatTheme.warning} />
              <Text style={[
                styles.loanTitle,
                message.isOwn ? styles.ownText : styles.otherText
              ]}>
                Loan Request
              </Text>
            </View>
            <Text style={[
              styles.loanAmount,
              message.isOwn ? styles.ownText : styles.otherText
            ]}>
              ${message.loanData?.amount?.toLocaleString()} {message.loanData?.currency}
            </Text>
            <Text style={[
              styles.loanDetails,
              message.isOwn ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              {message.loanData?.apr}% APR • {message.loanData?.term} months • {message.loanData?.type}
            </Text>
            <Text style={[
              styles.loanStatus,
              message.isOwn ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              Status: {message.loanData?.status}
            </Text>
          </View>
        );

      case 'loan_funded':
        return (
          <View style={styles.loanContainer}>
            <View style={styles.loanHeader}>
              <MaterialIcons name="account-balance" size={20} color={ChatTheme.success} />
              <Text style={[
                styles.loanTitle,
                message.isOwn ? styles.ownText : styles.otherText
              ]}>
                Loan Funded
              </Text>
            </View>
            <Text style={[
              styles.loanAmount,
              message.isOwn ? styles.ownText : styles.otherText
            ]}>
              ${message.loanData?.amount?.toLocaleString()} {message.loanData?.currency}
            </Text>
            <Text style={[
              styles.loanDetails,
              message.isOwn ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              Funded by {message.loanData?.lenderName}
            </Text>
            <Text style={[
              styles.loanStatus,
              message.isOwn ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              Loan is now active
            </Text>
          </View>
        );

      case 'loan_offer':
        return (
          <View style={styles.loanContainer}>
            <View style={styles.loanHeader}>
              <MaterialIcons name="local-offer" size={20} color={ChatTheme.primary} />
              <Text style={[
                styles.loanTitle,
                message.isOwn ? styles.ownText : styles.otherText
              ]}>
                Loan Offer
              </Text>
            </View>
            <Text style={[
              styles.loanAmount,
              message.isOwn ? styles.ownText : styles.otherText
            ]}>
              ${message.loanData?.amount?.toLocaleString()} {message.loanData?.currency}
            </Text>
            <Text style={[
              styles.loanDetails,
              message.isOwn ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              {message.loanData?.apr}% APR • {message.loanData?.term} months
            </Text>
            <Text style={[
              styles.loanStatus,
              message.isOwn ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              From {message.loanData?.lenderName}
            </Text>
          </View>
        );

      case 'loan_repayment':
        return (
          <View style={styles.loanContainer}>
            <View style={styles.loanHeader}>
              <MaterialIcons name="payment" size={20} color={ChatTheme.accent} />
              <Text style={[
                styles.loanTitle,
                message.isOwn ? styles.ownText : styles.otherText
              ]}>
                Loan Payment
              </Text>
            </View>
            <Text style={[
              styles.loanAmount,
              message.isOwn ? styles.ownText : styles.otherText
            ]}>
              ${message.loanData?.amount?.toLocaleString()} {message.loanData?.currency}
            </Text>
            <Text style={[
              styles.loanDetails,
              message.isOwn ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              {message.loanData?.dueDate ? `Due: ${message.loanData.dueDate.toLocaleDateString()}` : 'Payment received'}
            </Text>
            <Text style={[
              styles.loanStatus,
              message.isOwn ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              {message.loanData?.borrowerName}
            </Text>
          </View>
        );
      
      default:
        return (
          <Text style={[
            styles.messageText,
            message.isOwn ? styles.ownText : styles.otherText
          ]}>
            {message.text}
          </Text>
        );
    }
  };

  // Payment messages are rendered as standalone components
  if (message.type === 'payment') {
    return (
      <View style={[
        styles.container,
        message.isOwn ? styles.ownContainer : styles.otherContainer
      ]}>
        {renderMessageContent()}
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      message.isOwn ? styles.ownContainer : styles.otherContainer
    ]}>
      <View style={styles.messageRow}>
        {/* Avatar for other users */}
        {!message.isOwn && (
          <TouchableOpacity 
            onPress={() => onAvatarPress?.(message)}
            style={styles.avatarContainer}
          >
            <Avatar
              name={message.senderName || 'User'}
              imageUrl={message.senderAvatar}
              size="small"
            />
          </TouchableOpacity>
        )}
        
        <View style={[
          styles.messageContent,
          message.isOwn ? styles.ownMessageContent : styles.otherMessageContent
        ]}>
          {showSenderName && !message.isOwn && (
            <Text style={styles.senderName}>{message.senderName}</Text>
          )}
          
          <View style={[
            styles.bubble,
            message.isOwn ? styles.ownBubble : styles.otherBubble
          ]}>
            {renderMessageContent()}
            
            <View style={styles.footer}>
              <Text style={[
                styles.timestamp,
                message.isOwn ? styles.ownTimestamp : styles.otherTimestamp
              ]}>
                {formatTime(message.timestamp)}
              </Text>
              {getStatusIcon()}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: ChatSpacing.xs / 2,
    paddingHorizontal: ChatSpacing.lg,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '100%',
  },
  avatarContainer: {
    marginRight: ChatSpacing.sm,
    marginBottom: ChatSpacing.xs,
  },
  messageContent: {
    flex: 1,
    maxWidth: '85%',
  },
  ownMessageContent: {
    alignItems: 'flex-end',
  },
  otherMessageContent: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: ChatTheme.textSecondary,
    marginBottom: ChatSpacing.xs / 2,
    marginLeft: ChatSpacing.sm,
  },
  bubble: {
    minWidth: 90,
    maxWidth: '80%',
    paddingHorizontal: ChatSpacing.md,
    paddingTop: ChatSpacing.md,
    paddingBottom: ChatSpacing.xs,
    borderRadius: 12,
  },
  ownBubble: {
    backgroundColor: ChatTheme.sendBubbleBackground,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: ChatTheme.receiveBubbleBackground,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: ChatSpacing.xs,
  },
  ownText: {
    color: ChatTheme.sendBubbleText,
  },
  otherText: {
    color: ChatTheme.receiveBubbleText,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: ChatSpacing.xs / 2,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  ownTimestamp: {
    color: ChatTheme.sendBubbleText,
  },
  otherTimestamp: {
    color: ChatTheme.textSecondary,
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ChatSpacing.xs,
    marginBottom: ChatSpacing.xs,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentStatus: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginLeft: 'auto',
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ChatSpacing.xs,
    marginBottom: ChatSpacing.xs,
  },
  attachmentText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loanContainer: {
    marginBottom: ChatSpacing.xs,
  },
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ChatSpacing.xs,
    marginBottom: ChatSpacing.xs,
  },
  loanTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: ChatSpacing.xs / 2,
  },
  loanDetails: {
    fontSize: 12,
    marginBottom: ChatSpacing.xs / 2,
  },
  loanStatus: {
    fontSize: 11,
    fontWeight: '500',
  },
});