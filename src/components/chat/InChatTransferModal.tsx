import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Avatar } from './Avatar';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';

interface ChatUserProfile {
  id: string;
  name: string;
  avatar?: string;
}

interface InChatTransferModalProps {
  visible: boolean;
  onClose: () => void;
  recipient: ChatUserProfile;
  onContinue: (amount: string, note: string) => void;
}

export const InChatTransferModal: React.FC<InChatTransferModalProps> = ({
  visible,
  onClose,
  recipient,
  onContinue,
}) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setAmount('');
    setNote('');
    setIsSubmitting(false);
    onClose();
  };

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > 1000000) { // Basic limit check
      Alert.alert('Error', 'Amount exceeds maximum limit');
      return;
    }

    setIsSubmitting(true);
    onContinue(amount, note);
    setIsSubmitting(false);
  };

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return numericValue;
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatAmount(value);
    setAmount(formatted);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={ChatTheme.textPrimary} />
          </TouchableOpacity>
          <Typography variant="h3" style={styles.title}>Transfer</Typography>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Recipient Info */}
          <View style={styles.recipientSection}>
            <View style={styles.recipientInfo}>
              <Avatar 
                name={recipient.name} 
                imageUrl={recipient.avatar} 
                size="large"
                online={false}
              />
              <View style={styles.recipientDetails}>
                <Typography variant="h4" style={styles.recipientName}>
                  {recipient.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" style={styles.recipientId}>
                  ID: {recipient.id.slice(-8)}
                </Typography>
              </View>
            </View>
          </View>

          {/* Amount Section */}
          <View style={styles.amountSection}>
            <Typography variant="h5" style={styles.sectionLabel}>
              Transfer Amount
            </Typography>
            
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00 USDC"
                placeholderTextColor={ChatTheme.textTertiary}
                keyboardType="decimal-pad"
                autoFocus
                maxLength={10}
              />
            </View>
          </View>

          {/* Note Section */}
          <View style={styles.noteSection}>
            <Typography variant="h6" style={styles.sectionLabel}>
              Add a note (optional)
            </Typography>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="What's this for?"
              placeholderTextColor={ChatTheme.textTertiary}
              multiline
              maxLength={100}
              returnKeyType="done"
              blurOnSubmit
            />
            <Typography variant="caption" color="textSecondary" style={styles.noteCounter}>
              {note.length}/100
            </Typography>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
            style={styles.continueButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatTheme.background1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ChatSpacing.lg,
    paddingVertical: ChatSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
    backgroundColor: ChatTheme.background1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    color: ChatTheme.textPrimary,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: ChatSpacing.lg,
  },
  recipientSection: {
    paddingVertical: ChatSpacing.xl,
    alignItems: 'center',
  },
  recipientInfo: {
    alignItems: 'center',
  },
  recipientDetails: {
    alignItems: 'center',
    marginTop: ChatSpacing.md,
  },
  recipientName: {
    fontWeight: '600',
    marginBottom: ChatSpacing.xs,
    color: ChatTheme.textPrimary,
  },
  recipientId: {
    fontSize: 14,
  },
  amountSection: {
    paddingVertical: ChatSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: ChatSpacing.md,
    color: ChatTheme.textPrimary,
  },
  amountInputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ChatSpacing.lg,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '300',
    color: ChatTheme.textPrimary,
    textAlign: 'center',
    minWidth: 200,
    padding: ChatSpacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: ChatTheme.sendBubbleBackground,
  },
  noteSection: {
    paddingVertical: ChatSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: ChatTheme.border,
    borderRadius: 12,
    padding: ChatSpacing.md,
    fontSize: 16,
    color: ChatTheme.textPrimary,
    backgroundColor: ChatTheme.background2,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  noteCounter: {
    textAlign: 'right',
    marginTop: ChatSpacing.xs,
  },
  footer: {
    paddingHorizontal: ChatSpacing.lg,
    paddingVertical: ChatSpacing.lg,
    backgroundColor: ChatTheme.background1,
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
  },
  continueButton: {
    paddingVertical: ChatSpacing.md,
  },
});