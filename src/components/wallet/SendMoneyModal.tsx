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

interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  icon: string;
  type: 'crypto' | 'property';
}

interface SendMoneyModalProps {
  visible: boolean;
  onClose: () => void;
  recipientName: string;
  onSendComplete: (amount: number, token: Token) => void;
}

export const SendMoneyModal: React.FC<SendMoneyModalProps> = ({
  visible,
  onClose,
  recipientName,
  onSendComplete,
}) => {
  const [step, setStep] = useState<'select' | 'amount' | 'pin' | 'confirm'>('select');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const tokens: Token[] = [
    {
      id: '1',
      symbol: 'ETH',
      name: 'Ethereum',
      balance: 2.5,
      icon: 'currency-bitcoin',
      type: 'crypto',
    },
    {
      id: '2',
      symbol: 'USDC',
      name: 'USD Coin',
      balance: 1000,
      icon: 'attach-money',
      type: 'crypto',
    },
    {
      id: '3',
      symbol: 'VIC',
      name: 'Victoria Island Complex',
      balance: 10,
      icon: 'home',
      type: 'property',
    },
    {
      id: '4',
      symbol: 'LAG',
      name: 'Lagos Premium Apartments',
      balance: 5,
      icon: 'apartment',
      type: 'property',
    },
  ];

  const handleReset = () => {
    setStep('select');
    setSelectedToken(null);
    setAmount('');
    setPin('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setStep('amount');
  };

  const handleAmountNext = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > (selectedToken?.balance || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }
    
    setStep('pin');
  };

  const handlePinNext = () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'Please enter your 4-digit PIN');
      return;
    }
    
    setStep('confirm');
  };

  const handleSend = async () => {
    if (!selectedToken) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onSendComplete(parseFloat(amount), selectedToken);
      handleClose();
      Alert.alert('Success', `Sent ${amount} ${selectedToken.symbol} to ${recipientName}`);
    }, 2000);
  };

  const renderTokenSelect = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Select Token to Send
      </Typography>
      
      <ScrollView style={styles.tokenList}>
        {tokens.map((token) => (
          <TouchableOpacity 
            key={token.id} 
            style={styles.tokenItem}
            onPress={() => handleTokenSelect(token)}
          >
            <View style={styles.tokenInfo}>
              <View style={styles.tokenIcon}>
                <MaterialIcons name={token.icon as any} size={24} color={Colors.primary} />
              </View>
              <View style={styles.tokenDetails}>
                <Typography variant="h6">{token.symbol}</Typography>
                <Typography variant="body2" color="textSecondary">{token.name}</Typography>
              </View>
            </View>
            <View style={styles.tokenBalance}>
              <Typography variant="h6">{token.balance} {token.symbol}</Typography>
              <Typography variant="body2" color="textSecondary">
                {token.type === 'crypto' ? 'Cryptocurrency' : 'Property Token'}
              </Typography>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAmountStep = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Enter Amount
      </Typography>
      
      <Card style={styles.selectedTokenCard}>
        <View style={styles.selectedTokenInfo}>
          <MaterialIcons name={selectedToken?.icon as any} size={32} color={Colors.primary} />
          <View style={styles.selectedTokenDetails}>
            <Typography variant="h5">{selectedToken?.symbol}</Typography>
            <Typography variant="body1" color="textSecondary">
              Balance: {selectedToken?.balance} {selectedToken?.symbol}
            </Typography>
          </View>
        </View>
      </Card>
      
      <View style={styles.amountInput}>
        <Typography variant="h6" style={styles.inputLabel}>Amount</Typography>
        <TextInput
          style={styles.textInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          autoFocus
        />
        <Typography variant="body2" color="textSecondary" style={styles.recipientText}>
          To: {recipientName}
        </Typography>
      </View>
      
      <View style={styles.stepButtons}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => setStep('select')}
          style={styles.stepButton}
        />
        <Button
          title="Next"
          onPress={handleAmountNext}
          style={styles.stepButton}
        />
      </View>
    </View>
  );

  const renderPinStep = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Enter PIN
      </Typography>
      
      <Typography variant="body1" color="textSecondary" style={styles.pinDescription}>
        Enter your 4-digit PIN to authorize this transaction
      </Typography>
      
      <View style={styles.pinInput}>
        <TextInput
          style={styles.pinTextInput}
          value={pin}
          onChangeText={setPin}
          placeholder="••••"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          autoFocus
        />
      </View>
      
      <View style={styles.stepButtons}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => setStep('amount')}
          style={styles.stepButton}
        />
        <Button
          title="Continue"
          onPress={handlePinNext}
          style={styles.stepButton}
        />
      </View>
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Confirm Transaction
      </Typography>
      
      <Card style={styles.confirmCard}>
        <View style={styles.confirmRow}>
          <Typography variant="body1" color="textSecondary">Amount:</Typography>
          <Typography variant="h6">{amount} {selectedToken?.symbol}</Typography>
        </View>
        
        <View style={styles.confirmRow}>
          <Typography variant="body1" color="textSecondary">To:</Typography>
          <Typography variant="h6">{recipientName}</Typography>
        </View>
        
        <View style={styles.confirmRow}>
          <Typography variant="body1" color="textSecondary">Token:</Typography>
          <Typography variant="h6">{selectedToken?.name}</Typography>
        </View>
        
        <View style={styles.confirmRow}>
          <Typography variant="body1" color="textSecondary">Network Fee:</Typography>
          <Typography variant="h6">0.001 ETH</Typography>
        </View>
      </Card>
      
      <View style={styles.stepButtons}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => setStep('pin')}
          style={styles.stepButton}
        />
        <Button
          title={loading ? "Sending..." : "Send"}
          onPress={handleSend}
          style={styles.stepButton}
          disabled={loading}
        />
      </View>
    </View>
  );

  const renderContent = () => {
    switch (step) {
      case 'select': return renderTokenSelect();
      case 'amount': return renderAmountStep();
      case 'pin': return renderPinStep();
      case 'confirm': return renderConfirmStep();
      default: return renderTokenSelect();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Typography variant="h3">Send Money</Typography>
          <View style={styles.headerSpacer} />
        </View>
        
        {renderContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
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
  headerSpacer: {
    width: 24,
  },
  stepContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontWeight: '600',
  },
  tokenList: {
    flex: 1,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tokenDetails: {
    flex: 1,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  selectedTokenCard: {
    marginBottom: Spacing.xl,
  },
  selectedTokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTokenDetails: {
    marginLeft: Spacing.md,
  },
  amountInput: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
  },
  textInput: {
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  recipientText: {
    textAlign: 'center',
  },
  pinDescription: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  pinInput: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  pinTextInput: {
    fontSize: 48,
    fontWeight: '600',
    letterSpacing: 20,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    width: 200,
  },
  confirmCard: {
    marginBottom: Spacing.xl,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  stepButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
  },
  stepButton: {
    flex: 1,
  },
});