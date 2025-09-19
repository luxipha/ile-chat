import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { RecipientPicker } from './RecipientPicker';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  address?: string;
}

interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  icon: string;
  type: 'crypto' | 'property';
}

interface FundingSource {
  id: string;
  name: string;
  type: 'wallet' | 'bank' | 'card' | 'momo';
  icon: string;
  balance?: number;
  currency?: string;
}

interface P2PSendFlowProps {
  visible: boolean;
  onClose: () => void;
  onSendComplete: (amount: number, token: Token, recipient: Contact) => void;
  initialRecipient?: Contact;
}

export const P2PSendFlow: React.FC<P2PSendFlowProps> = ({
  visible,
  onClose,
  onSendComplete,
  initialRecipient,
}) => {
  const [step, setStep] = useState<'recipient' | 'amount' | 'funding' | 'review' | 'processing'>('recipient');
  const [selectedRecipient, setSelectedRecipient] = useState<Contact | null>(initialRecipient || null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedFunding, setSelectedFunding] = useState<FundingSource | null>(null);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [lockTimer, setLockTimer] = useState(300); // 5 minutes

  const tokens: Token[] = [
    {
      id: '1',
      symbol: 'USDC',
      name: 'USD Coin',
      balance: 1000,
      icon: 'attach-money',
      type: 'crypto',
    },
    {
      id: '2',
      symbol: 'ETH',
      name: 'Ethereum',
      balance: 2.5,
      icon: 'currency-bitcoin',
      type: 'crypto',
    },
    {
      id: '3',
      symbol: 'NGN',
      name: 'Nigerian Naira',
      balance: 50000,
      icon: 'money',
      type: 'crypto',
    },
  ];

  const fundingSources: FundingSource[] = [
    {
      id: '1',
      name: 'USDC Wallet',
      type: 'wallet',
      icon: 'account-balance-wallet',
      balance: 1000,
      currency: 'USDC',
    },
    {
      id: '2',
      name: 'Bank Transfer',
      type: 'bank',
      icon: 'account-balance',
    },
    {
      id: '3',
      name: 'Debit Card',
      type: 'card',
      icon: 'credit-card',
    },
    {
      id: '4',
      name: 'Mobile Money',
      type: 'momo',
      icon: 'phone-android',
    },
  ];

  const handleReset = () => {
    setStep('recipient');
    setSelectedRecipient(initialRecipient || null);
    setSelectedToken(null);
    setSelectedFunding(null);
    setAmount('');
    setMemo('');
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleRecipientSelected = (recipient: Contact) => {
    setSelectedRecipient(recipient);
    setStep('amount');
  };

  const handleAmountNext = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (!selectedToken) {
      Alert.alert('Error', 'Please select a token');
      return;
    }
    
    if (parseFloat(amount) > (selectedToken?.balance || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }
    
    setStep('funding');
  };

  const handleFundingNext = () => {
    if (!selectedFunding) {
      Alert.alert('Error', 'Please select a funding source');
      return;
    }
    
    setStep('review');
  };

  const handleSend = async () => {
    if (!selectedRecipient || !selectedToken || !selectedFunding) return;
    
    setLoading(true);
    setStep('processing');
    
    // Simulate transaction processing
    setTimeout(() => {
      setLoading(false);
      onSendComplete(parseFloat(amount), selectedToken, selectedRecipient);
      handleClose();
      Alert.alert('Success', `Sent ${amount} ${selectedToken.symbol} to ${selectedRecipient.name}`);
    }, 3000);
  };

  const renderRecipientStep = () => (
    <RecipientPicker
      onSelectRecipient={handleRecipientSelected}
      onBack={handleClose}
    />
  );

  const renderAmountStep = () => {
    const fees = {
      network: 0.001,
      platform: parseFloat(amount) * 0.01 || 0,
    };
    
    const totalFees = fees.network + fees.platform;
    const totalAmount = parseFloat(amount) + totalFees;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('recipient')} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Typography variant="h3">Send Money</Typography>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content}>
          {/* Recipient Info */}
          <Card style={styles.recipientCard}>
            <View style={styles.recipientInfo}>
              <View style={styles.recipientAvatar}>
                <Typography variant="h6">
                  {selectedRecipient?.name.split(' ').map(n => n[0]).join('')}
                </Typography>
              </View>
              <View>
                <Typography variant="h6">{selectedRecipient?.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedRecipient?.address?.slice(0, 6)}...{selectedRecipient?.address?.slice(-4)}
                </Typography>
              </View>
            </View>
          </Card>

          {/* Token Selection */}
          <View style={styles.section}>
            <Typography variant="h6" style={styles.sectionTitle}>Select Currency</Typography>
            {tokens.map((token) => (
              <TouchableOpacity
                key={token.id}
                style={[
                  styles.tokenItem,
                  selectedToken?.id === token.id && styles.selectedTokenItem
                ]}
                onPress={() => setSelectedToken(token)}
              >
                <View style={styles.tokenInfo}>
                  <MaterialIcons name={token.icon as any} size={24} color={Colors.primary} />
                  <View style={styles.tokenDetails}>
                    <Typography variant="h6">{token.symbol}</Typography>
                    <Typography variant="body2" color="textSecondary">{token.name}</Typography>
                  </View>
                </View>
                <View style={styles.tokenBalance}>
                  <Typography variant="h6">{token.balance} {token.symbol}</Typography>
                  {selectedToken?.id === token.id && (
                    <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Typography variant="h6" style={styles.sectionTitle}>Amount</Typography>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              autoFocus
            />
            
            {/* Exchange Rate & Fees */}
            {selectedToken && amount && (
              <Card style={styles.feeCard}>
                <View style={styles.feeRow}>
                  <Typography variant="body1">Exchange Rate:</Typography>
                  <Typography variant="body1">1 {selectedToken.symbol} = ${exchangeRate}</Typography>
                </View>
                <View style={styles.feeRow}>
                  <Typography variant="body2" color="textSecondary">Network Fee:</Typography>
                  <Typography variant="body2" color="textSecondary">{fees.network} {selectedToken.symbol}</Typography>
                </View>
                <View style={styles.feeRow}>
                  <Typography variant="body2" color="textSecondary">Platform Fee (1%):</Typography>
                  <Typography variant="body2" color="textSecondary">{fees.platform.toFixed(4)} {selectedToken.symbol}</Typography>
                </View>
                <View style={[styles.feeRow, styles.totalRow]}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">{totalAmount.toFixed(4)} {selectedToken.symbol}</Typography>
                </View>
              </Card>
            )}

            {/* Rate Lock Timer */}
            {lockTimer > 0 && (
              <View style={styles.lockTimer}>
                <MaterialIcons name="timer" size={16} color={Colors.secondary} />
                <Typography variant="body2" color="textSecondary" style={styles.lockText}>
                  Rate locked for {Math.floor(lockTimer / 60)}:{(lockTimer % 60).toString().padStart(2, '0')}
                </Typography>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.stepButtons}>
          <Button
            title="Next"
            onPress={handleAmountNext}
            disabled={!amount || !selectedToken}
            style={styles.fullButton}
          />
        </View>
      </View>
    );
  };

  const renderFundingStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('amount')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">Funding Source</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <Typography variant="h6" style={styles.sectionTitle}>How would you like to pay?</Typography>
        
        {fundingSources.map((source) => (
          <TouchableOpacity
            key={source.id}
            style={[
              styles.fundingItem,
              selectedFunding?.id === source.id && styles.selectedFundingItem
            ]}
            onPress={() => setSelectedFunding(source)}
          >
            <MaterialIcons name={source.icon as any} size={24} color={Colors.primary} />
            <View style={styles.fundingInfo}>
              <Typography variant="h6">{source.name}</Typography>
              {source.balance && (
                <Typography variant="body2" color="textSecondary">
                  Balance: {source.balance} {source.currency}
                </Typography>
              )}
            </View>
            {selectedFunding?.id === source.id && (
              <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.stepButtons}>
        <Button
          title="Next"
          onPress={handleFundingNext}
          disabled={!selectedFunding}
          style={styles.fullButton}
        />
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('funding')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">Review & Confirm</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.reviewCard}>
          <View style={styles.reviewRow}>
            <Typography variant="body1" color="textSecondary">To:</Typography>
            <Typography variant="h6">{selectedRecipient?.name}</Typography>
          </View>
          <View style={styles.reviewRow}>
            <Typography variant="body1" color="textSecondary">Amount:</Typography>
            <Typography variant="h6">{amount} {selectedToken?.symbol}</Typography>
          </View>
          <View style={styles.reviewRow}>
            <Typography variant="body1" color="textSecondary">From:</Typography>
            <Typography variant="h6">{selectedFunding?.name}</Typography>
          </View>
          <View style={styles.reviewRow}>
            <Typography variant="body1" color="textSecondary">Network Fee:</Typography>
            <Typography variant="h6">0.001 {selectedToken?.symbol}</Typography>
          </View>
        </Card>

        <View style={styles.section}>
          <Typography variant="h6" style={styles.sectionTitle}>Add memo (optional)</Typography>
          <TextInput
            style={styles.memoInput}
            value={memo}
            onChangeText={setMemo}
            placeholder="What's this for?"
            multiline
            maxLength={100}
          />
        </View>
      </ScrollView>

      <View style={styles.stepButtons}>
        <Button
          title="Send Money"
          onPress={handleSend}
          style={styles.fullButton}
        />
      </View>
    </View>
  );

  const renderProcessingStep = () => (
    <View style={styles.processingContainer}>
      <MaterialIcons name="hourglass-empty" size={64} color={Colors.primary} />
      <Typography variant="h4" style={styles.processingTitle}>Processing Transaction</Typography>
      <Typography variant="body1" color="textSecondary" style={styles.processingText}>
        Your payment is being processed on the blockchain...
      </Typography>
      <View style={styles.processingSteps}>
        <View style={styles.processingStep}>
          <MaterialIcons name="check-circle" size={20} color={Colors.success} />
          <Typography variant="body2" style={styles.processingStepText}>Transaction submitted</Typography>
        </View>
        <View style={styles.processingStep}>
          <MaterialIcons name="hourglass-empty" size={20} color={Colors.secondary} />
          <Typography variant="body2" style={styles.processingStepText}>Awaiting confirmation</Typography>
        </View>
        <View style={styles.processingStep}>
          <MaterialIcons name="radio-button-unchecked" size={20} color={Colors.gray400} />
          <Typography variant="body2" color="textSecondary" style={styles.processingStepText}>Complete</Typography>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (step) {
      case 'recipient': return renderRecipientStep();
      case 'amount': return renderAmountStep();
      case 'funding': return renderFundingStep();
      case 'review': return renderReviewStep();
      case 'processing': return renderProcessingStep();
      default: return renderRecipientStep();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      {renderContent()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  recipientCard: {
    marginBottom: Spacing.lg,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: Spacing.sm,
  },
  selectedTokenItem: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenDetails: {
    marginLeft: Spacing.md,
  },
  tokenBalance: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  feeCard: {
    marginBottom: Spacing.md,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  lockTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  lockText: {
    fontSize: 12,
  },
  fundingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: Spacing.sm,
  },
  selectedFundingItem: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  fundingInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  reviewCard: {
    marginBottom: Spacing.lg,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  memoInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  stepButtons: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  fullButton: {
    width: '100%',
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  processingTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  processingSteps: {
    gap: Spacing.md,
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  processingStepText: {
    marginLeft: Spacing.sm,
  },
});