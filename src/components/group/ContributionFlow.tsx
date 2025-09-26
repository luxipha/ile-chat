import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';
import contributionGroupService from '../../services/contributionGroupService';

interface ContributionFlowProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onContributionComplete: (contribution: ContributionData) => void;
}

interface ContributionData {
  amount: number;
  token: Token;
  type: ContributionType;
  frequency?: ContributionFrequency;
  purpose: string;
  isRecurring: boolean;
}

interface Token {
  symbol: string;
  name: string;
  balance: number;
  icon: string;
}

type ContributionType = 'general' | 'property' | 'emergency' | 'goal';
type ContributionFrequency = 'weekly' | 'monthly' | 'quarterly';

const AVAILABLE_TOKENS: Token[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 5240.50,
    icon: 'account-balance',
  },
  {
    symbol: 'APT',
    name: 'Aptos Token',
    balance: 12.5,
    icon: 'currency-bitcoin',
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    balance: 1250.00,
    icon: 'account-balance-wallet',
  },
];

const CONTRIBUTION_TYPES = [
  {
    id: 'general' as ContributionType,
    title: 'General Fund',
    description: 'Contribute to the group\'s general investment pool',
    icon: 'savings',
    color: ChatTheme.sendBubbleBackground,
  },
  {
    id: 'property' as ContributionType,
    title: 'Property Investment',
    description: 'Target specific real estate opportunities',
    icon: 'home',
    color: Colors.success,
  },
  {
    id: 'emergency' as ContributionType,
    title: 'Emergency Fund',
    description: 'Build a safety net for the group',
    icon: 'security',
    color: Colors.warning,
  },
  {
    id: 'goal' as ContributionType,
    title: 'Goal-Based Saving',
    description: 'Save towards a specific group target',
    icon: 'flag',
    color: Colors.error,
  },
];

const FREQUENCY_OPTIONS = [
  { id: 'weekly' as ContributionFrequency, title: 'Weekly', description: 'Every week' },
  { id: 'monthly' as ContributionFrequency, title: 'Monthly', description: 'Every month' },
  { id: 'quarterly' as ContributionFrequency, title: 'Quarterly', description: 'Every 3 months' },
];

export const ContributionFlow: React.FC<ContributionFlowProps> = ({
  visible,
  onClose,
  groupId,
  groupName,
  onContributionComplete,
}) => {
  const [step, setStep] = useState<'type' | 'token' | 'amount' | 'details' | 'confirm'>('type');
  const [selectedType, setSelectedType] = useState<ContributionType | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<ContributionFrequency>('monthly');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setStep('type');
    setSelectedType(null);
    setSelectedToken(null);
    setAmount('');
    setPurpose('');
    setIsRecurring(false);
    setFrequency('monthly');
    setPin('');
    onClose();
  };

  const handleNext = () => {
    switch (step) {
      case 'type':
        if (selectedType) setStep('token');
        break;
      case 'token':
        if (selectedToken) setStep('amount');
        break;
      case 'amount':
        if (amount && parseFloat(amount) > 0) setStep('details');
        break;
      case 'details':
        setStep('confirm');
        break;
      case 'confirm':
        handleContribute();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'token': setStep('type'); break;
      case 'amount': setStep('token'); break;
      case 'details': setStep('amount'); break;
      case 'confirm': setStep('details'); break;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'type': return selectedType !== null;
      case 'token': return selectedToken !== null;
      case 'amount': return amount && parseFloat(amount) > 0 && parseFloat(amount) <= (selectedToken?.balance || 0);
      case 'details': return purpose.trim().length > 0;
      case 'confirm': return pin.length === 4;
      default: return false;
    }
  };

  const handleContribute = async () => {
    if (!selectedType || !selectedToken || !amount) return;

    console.log('🔄 [ContributionFlow] Starting contribution process:', {
      groupId,
      amount: parseFloat(amount),
      token: selectedToken.symbol,
      type: selectedType,
      isRecurring,
      frequency: isRecurring ? frequency : undefined,
    });

    setIsLoading(true);
    
    try {
      // Make contribution using backend service
      const result = await contributionGroupService.contributeToGroup(
        groupId,
        parseFloat(amount),
        selectedToken.symbol,
        purpose.trim(),
        isRecurring,
        isRecurring ? frequency : undefined
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      console.log('✅ [ContributionFlow] Contribution successful:', {
        transactionId: result.transactionId,
        txHash: result.txHash,
      });
      
      const contributionData: ContributionData = {
        amount: parseFloat(amount),
        token: selectedToken,
        type: selectedType,
        frequency: isRecurring ? frequency : undefined,
        purpose: purpose.trim(),
        isRecurring,
      };
      
      console.log('✅ [ContributionFlow] Contribution flow completed successfully:', {
        contributionData,
        transactionId: result.transactionId,
        txHash: result.txHash,
        groupId,
        timestamp: new Date().toISOString(),
      });

      onContributionComplete(contributionData);
      handleClose();
      
      // Show success message with transaction details
      if (result.txHash) {
        console.log('🎉 [ContributionFlow] Showing success alert with transaction hash');
        Alert.alert(
          'Contribution Successful!', 
          `Your contribution of ${amount} ${selectedToken.symbol} has been processed.\n\nTransaction: ${result.txHash.substring(0, 10)}...\n\nYou can view this transaction on the Aptos explorer.`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('🎉 [ContributionFlow] Showing success alert without transaction hash');
        Alert.alert('Contribution Successful!', `Your contribution of ${amount} ${selectedToken.symbol} has been processed.`);
      }
      
    } catch (error) {
      console.error('❌ [ContributionFlow] Contribution failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process contribution';
      
      Alert.alert(
        'Contribution Failed', 
        errorMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: () => handleContribute() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={step === 'type' ? handleClose : handleBack}>
        <MaterialIcons 
          name={step === 'type' ? 'close' : 'arrow-back'} 
          size={24} 
          color={ChatTheme.textPrimary} 
        />
      </TouchableOpacity>
      <Typography variant="h6" style={styles.headerTitle}>
        Contribute to {groupName}
      </Typography>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderTypeStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Choose Contribution Type
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Select what you'd like to contribute towards
      </Typography>

      <View style={styles.typeGrid}>
        {CONTRIBUTION_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              selectedType === type.id && styles.selectedTypeCard
            ]}
            onPress={() => setSelectedType(type.id)}
          >
            <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
              <MaterialIcons name={type.icon as any} size={32} color={type.color} />
            </View>
            <Typography variant="h6" style={styles.typeTitle}>
              {type.title}
            </Typography>
            <Typography variant="body2" color="textSecondary" style={styles.typeDescription}>
              {type.description}
            </Typography>
            {selectedType === type.id && (
              <MaterialIcons name="check-circle" size={20} color={ChatTheme.sendBubbleBackground} style={styles.typeCheck} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderTokenStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Select Token
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Choose which token to contribute
      </Typography>

      <View style={styles.tokenList}>
        {AVAILABLE_TOKENS.map((token) => (
          <TouchableOpacity
            key={token.symbol}
            style={[
              styles.tokenCard,
              selectedToken?.symbol === token.symbol && styles.selectedTokenCard
            ]}
            onPress={() => setSelectedToken(token)}
          >
            <View style={styles.tokenIcon}>
              <MaterialIcons name={token.icon as any} size={24} color={ChatTheme.sendBubbleBackground} />
            </View>
            <View style={styles.tokenInfo}>
              <Typography variant="h6">{token.symbol}</Typography>
              <Typography variant="caption" color="textSecondary">{token.name}</Typography>
            </View>
            <View style={styles.tokenBalance}>
              <Typography variant="body1">{token.balance.toLocaleString()}</Typography>
              <Typography variant="caption" color="textSecondary">Available</Typography>
            </View>
            {selectedToken?.symbol === token.symbol && (
              <MaterialIcons name="check-circle" size={20} color={ChatTheme.sendBubbleBackground} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderAmountStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Enter Amount
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        How much {selectedToken?.symbol} would you like to contribute?
      </Typography>

      <Card style={styles.amountCard}>
        <View style={styles.amountHeader}>
          <Typography variant="body1">Amount</Typography>
          <Typography variant="caption" color="textSecondary">
            Available: {selectedToken?.balance.toLocaleString()} {selectedToken?.symbol}
          </Typography>
        </View>
        
        <View style={styles.amountInputContainer}>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <Typography variant="h6" color="textSecondary">
            {selectedToken?.symbol}
          </Typography>
        </View>

        <View style={styles.quickAmounts}>
          {[25, 50, 75, 100].map((percent) => {
            const quickAmount = ((selectedToken?.balance || 0) * percent / 100);
            return (
              <TouchableOpacity
                key={percent}
                style={styles.quickAmountButton}
                onPress={() => setAmount(quickAmount.toString())}
              >
                <Typography variant="caption">{percent}%</Typography>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Card style={styles.recurringCard}>
        <View style={styles.recurringHeader}>
          <View style={styles.recurringInfo}>
            <Typography variant="h6">Make this recurring</Typography>
            <Typography variant="caption" color="textSecondary">
              Automatically contribute this amount regularly
            </Typography>
          </View>
          <TouchableOpacity
            style={[styles.toggle, isRecurring && styles.toggleActive]}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View style={[styles.toggleThumb, isRecurring && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        {isRecurring && (
          <View style={styles.frequencyOptions}>
            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.frequencyOption,
                  frequency === option.id && styles.selectedFrequencyOption
                ]}
                onPress={() => setFrequency(option.id)}
              >
                <Typography variant="body1">{option.title}</Typography>
                <Typography variant="caption" color="textSecondary">{option.description}</Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );

  const renderDetailsStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Contribution Details
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Add a purpose for this contribution
      </Typography>

      <Card style={styles.detailsCard}>
        <Typography variant="body1" style={styles.inputLabel}>
          Purpose / Note
        </Typography>
        <TextInput
          style={styles.purposeInput}
          value={purpose}
          onChangeText={setPurpose}
          placeholder="e.g., Monthly investment contribution"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Card>

      {/* Summary */}
      <Card style={styles.summaryCard}>
        <Typography variant="h6" style={styles.summaryTitle}>
          Contribution Summary
        </Typography>
        
        <View style={styles.summaryRow}>
          <Typography variant="body1" color="textSecondary">Amount</Typography>
          <Typography variant="h6">{amount} {selectedToken?.symbol}</Typography>
        </View>
        
        <View style={styles.summaryRow}>
          <Typography variant="body1" color="textSecondary">Type</Typography>
          <Typography variant="body1">
            {CONTRIBUTION_TYPES.find(t => t.id === selectedType)?.title}
          </Typography>
        </View>
        
        {isRecurring && (
          <View style={styles.summaryRow}>
            <Typography variant="body1" color="textSecondary">Frequency</Typography>
            <Typography variant="body1">
              {FREQUENCY_OPTIONS.find(f => f.id === frequency)?.title}
            </Typography>
          </View>
        )}
      </Card>
    </ScrollView>
  );

  const renderConfirmStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Confirm Contribution
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Enter your PIN to confirm the transaction
      </Typography>

      <Card style={styles.confirmCard}>
        <View style={styles.confirmIcon}>
          <MaterialIcons name="lock" size={32} color={ChatTheme.sendBubbleBackground} />
        </View>
        
        <Typography variant="body1" style={styles.confirmText}>
          Enter your 4-digit PIN to confirm this contribution
        </Typography>
        
        <TextInput
          style={styles.pinInput}
          value={pin}
          onChangeText={setPin}
          placeholder="••••"
          secureTextEntry
          keyboardType="numeric"
          maxLength={4}
          textAlign="center"
        />
      </Card>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'type': return renderTypeStep();
      case 'token': return renderTokenStep();
      case 'amount': return renderAmountStep();
      case 'details': return renderDetailsStep();
      case 'confirm': return renderConfirmStep();
      default: return renderTypeStep();
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'type': return 'Next';
      case 'token': return 'Next';
      case 'amount': return 'Next';
      case 'details': return 'Review';
      case 'confirm': return isLoading ? 'Processing...' : 'Confirm';
      default: return 'Next';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        {renderStepContent()}
        
        <View style={styles.footer}>
          <Button
            title={getStepTitle()}
            onPress={handleNext}
            disabled={!canProceed() || isLoading}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSpacer: {
    width: 24,
  },
  stepContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  stepTitle: {
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  typeGrid: {
    gap: Spacing.md,
  },
  typeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ChatTheme.border,
    backgroundColor: ChatTheme.background1,
    position: 'relative',
  },
  selectedTypeCard: {
    borderColor: ChatTheme.sendBubbleBackground,
    backgroundColor: ChatTheme.sendBubbleBackground + '10',
  },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  typeTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  typeDescription: {
    lineHeight: 18,
  },
  typeCheck: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  tokenList: {
    gap: Spacing.sm,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ChatTheme.border,
    backgroundColor: ChatTheme.background1,
  },
  selectedTokenCard: {
    borderColor: ChatTheme.sendBubbleBackground,
    backgroundColor: ChatTheme.sendBubbleBackground + '10',
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ChatTheme.background3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenBalance: {
    alignItems: 'flex-end',
    marginRight: Spacing.md,
  },
  amountCard: {
    marginBottom: Spacing.md,
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChatTheme.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'right',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAmountButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: ChatTheme.background3,
  },
  recurringCard: {
    marginBottom: Spacing.md,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recurringInfo: {
    flex: 1,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: ChatTheme.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: ChatTheme.sendBubbleBackground,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ChatTheme.background1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  frequencyOptions: {
    gap: Spacing.sm,
  },
  frequencyOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ChatTheme.border,
  },
  selectedFrequencyOption: {
    borderColor: ChatTheme.sendBubbleBackground,
    backgroundColor: ChatTheme.sendBubbleBackground + '10',
  },
  detailsCard: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  purposeInput: {
    borderWidth: 1,
    borderColor: ChatTheme.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 80,
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  confirmCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  confirmIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ChatTheme.background3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  confirmText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  pinInput: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
    borderBottomWidth: 2,
    borderBottomColor: ChatTheme.sendBubbleBackground,
    paddingVertical: Spacing.md,
    minWidth: 120,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
  },
  continueButton: {
    width: '100%',
  },
});