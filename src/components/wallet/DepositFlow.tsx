import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Clipboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface DepositFlowProps {
  visible: boolean;
  onClose: () => void;
  onDepositInitiated: (deposit: DepositRequest) => void;
}

interface DepositRequest {
  method: 'crypto' | 'bank' | 'card';
  currency: string;
  amount: number;
  network?: string;
  address?: string;
  bankDetails?: any;
}

const CRYPTO_OPTIONS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: 'currency-btc', networks: ['Bitcoin'] },
  { symbol: 'ETH', name: 'Ethereum', icon: 'currency-eth', networks: ['Ethereum', 'Polygon'] },
  { symbol: 'USDC', name: 'USD Coin', icon: 'attach-money', networks: ['Ethereum', 'Polygon', 'BSC'] },
  { symbol: 'USDT', name: 'Tether', icon: 'attach-money', networks: ['Ethereum', 'Polygon', 'BSC', 'Tron'] },
];

const FIAT_OPTIONS = [
  { symbol: 'NGN', name: 'Nigerian Naira', icon: 'account-balance', methods: ['bank', 'card'] },
  { symbol: 'USD', name: 'US Dollar', icon: 'attach-money', methods: ['bank', 'card'] },
  { symbol: 'EUR', name: 'Euro', icon: 'euro', methods: ['bank', 'card'] },
];

export const DepositFlow: React.FC<DepositFlowProps> = ({
  visible,
  onClose,
  onDepositInitiated,
}) => {
  const [step, setStep] = useState<'method' | 'currency' | 'amount' | 'details' | 'confirm'>('method');
  const [depositMethod, setDepositMethod] = useState<'crypto' | 'bank' | 'card' | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [depositAddress] = useState<string>('0x742d35Cc6ed6446C2532510E420677b5BcCa5dB9'); // Mock address
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setStep('method');
    setDepositMethod(null);
    setSelectedCurrency('');
    setSelectedNetwork('');
    setAmount('');
    onClose();
  };

  const handleNext = () => {
    if (step === 'method') setStep('currency');
    else if (step === 'currency') setStep('amount');
    else if (step === 'amount') setStep('details');
    else if (step === 'details') setStep('confirm');
    else if (step === 'confirm') handleConfirmDeposit();
  };

  const handleBack = () => {
    if (step === 'currency') setStep('method');
    else if (step === 'amount') setStep('currency');
    else if (step === 'details') setStep('amount');
    else if (step === 'confirm') setStep('details');
  };

  const canProceed = () => {
    switch (step) {
      case 'method':
        return depositMethod !== null;
      case 'currency':
        return selectedCurrency.length > 0;
      case 'amount':
        return amount.length > 0 && parseFloat(amount) > 0;
      case 'details':
        return depositMethod === 'crypto' ? selectedNetwork.length > 0 : true;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const handleConfirmDeposit = async () => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const depositRequest: DepositRequest = {
        method: depositMethod!,
        currency: selectedCurrency,
        amount: parseFloat(amount),
        network: selectedNetwork,
        address: depositMethod === 'crypto' ? depositAddress : undefined,
      };
      
      onDepositInitiated(depositRequest);
      handleClose();
      Alert.alert('Success', 'Deposit request initiated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate deposit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={step === 'method' ? handleClose : handleBack}>
        <MaterialIcons 
          name={step === 'method' ? 'close' : 'arrow-back'} 
          size={24} 
          color={Colors.textPrimary} 
        />
      </TouchableOpacity>
      <Typography variant="h6" style={styles.headerTitle}>
        {step === 'method' && 'Deposit Method'}
        {step === 'currency' && 'Select Currency'}
        {step === 'amount' && 'Enter Amount'}
        {step === 'details' && 'Deposit Details'}
        {step === 'confirm' && 'Confirm Deposit'}
      </Typography>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderMethodStep = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>
        How would you like to deposit?
      </Typography>
      
      <View style={styles.methodOptions}>
        <TouchableOpacity
          style={[
            styles.methodOption,
            depositMethod === 'crypto' && styles.selectedMethodOption
          ]}
          onPress={() => setDepositMethod('crypto')}
        >
          <MaterialIcons name="currency-bitcoin" size={32} color={Colors.primary} />
          <Typography variant="h6" style={styles.methodTitle}>
            Cryptocurrency
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.methodDescription}>
            Deposit BTC, ETH, USDC, USDT and more
          </Typography>
          <View style={styles.methodBadge}>
            <Typography variant="caption" style={styles.methodBadgeText}>
              Instant
            </Typography>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.methodOption,
            depositMethod === 'bank' && styles.selectedMethodOption
          ]}
          onPress={() => setDepositMethod('bank')}
        >
          <MaterialIcons name="account-balance" size={32} color={Colors.primary} />
          <Typography variant="h6" style={styles.methodTitle}>
            Bank Transfer
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.methodDescription}>
            Transfer from your bank account
          </Typography>
          <View style={styles.methodBadge}>
            <Typography variant="caption" style={styles.methodBadgeText}>
              1-3 days
            </Typography>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.methodOption,
            depositMethod === 'card' && styles.selectedMethodOption
          ]}
          onPress={() => setDepositMethod('card')}
        >
          <MaterialIcons name="credit-card" size={32} color={Colors.primary} />
          <Typography variant="h6" style={styles.methodTitle}>
            Debit/Credit Card
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.methodDescription}>
            Instant deposit with your card
          </Typography>
          <View style={styles.methodBadge}>
            <Typography variant="caption" style={styles.methodBadgeText}>
              Instant
            </Typography>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrencyStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>
        Select Currency
      </Typography>
      
      <View style={styles.currencyOptions}>
        {depositMethod === 'crypto' ? (
          CRYPTO_OPTIONS.map((crypto) => (
            <TouchableOpacity
              key={crypto.symbol}
              style={[
                styles.currencyOption,
                selectedCurrency === crypto.symbol && styles.selectedCurrencyOption
              ]}
              onPress={() => setSelectedCurrency(crypto.symbol)}
            >
              <MaterialIcons name={crypto.icon as any} size={24} color={Colors.primary} />
              <View style={styles.currencyInfo}>
                <Typography variant="h6">{crypto.symbol}</Typography>
                <Typography variant="body2" color="textSecondary">{crypto.name}</Typography>
              </View>
              {selectedCurrency === crypto.symbol && (
                <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))
        ) : (
          FIAT_OPTIONS.filter(fiat => fiat.methods.includes(depositMethod!)).map((fiat) => (
            <TouchableOpacity
              key={fiat.symbol}
              style={[
                styles.currencyOption,
                selectedCurrency === fiat.symbol && styles.selectedCurrencyOption
              ]}
              onPress={() => setSelectedCurrency(fiat.symbol)}
            >
              <MaterialIcons name={fiat.icon as any} size={24} color={Colors.primary} />
              <View style={styles.currencyInfo}>
                <Typography variant="h6">{fiat.symbol}</Typography>
                <Typography variant="body2" color="textSecondary">{fiat.name}</Typography>
              </View>
              {selectedCurrency === fiat.symbol && (
                <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderAmountStep = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>
        Enter Amount
      </Typography>
      
      <View style={styles.amountInputContainer}>
        <Typography variant="h2" style={styles.currencySymbol}>
          {selectedCurrency === 'NGN' ? '₦' : selectedCurrency === 'EUR' ? '€' : '$'}
        </Typography>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
          autoFocus
        />
        <Typography variant="body1" style={styles.currencyCode}>
          {selectedCurrency}
        </Typography>
      </View>

      <View style={styles.quickAmounts}>
        <Typography variant="body2" style={styles.quickAmountsTitle}>
          Quick amounts:
        </Typography>
        <View style={styles.quickAmountButtons}>
          {['100', '500', '1000', '5000'].map((quickAmount) => (
            <TouchableOpacity
              key={quickAmount}
              style={styles.quickAmountButton}
              onPress={() => setAmount(quickAmount)}
            >
              <Typography variant="body2" color="primary">
                {quickAmount}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {depositMethod !== 'crypto' && (
        <Card style={styles.feeCard}>
          <Typography variant="body2" style={styles.feeTitle}>
            Fee Information
          </Typography>
          <View style={styles.feeRow}>
            <Typography variant="body2" color="textSecondary">
              Processing Fee
            </Typography>
            <Typography variant="body2">
              {depositMethod === 'card' ? '2.9%' : 'Free'}
            </Typography>
          </View>
          <View style={styles.feeRow}>
            <Typography variant="body2" color="textSecondary">
              You'll receive
            </Typography>
            <Typography variant="body2" color="primary" style={styles.feeReceiveAmount}>
              {selectedCurrency === 'NGN' ? '₦' : selectedCurrency === 'EUR' ? '€' : '$'}
              {amount ? (depositMethod === 'card' 
                ? (parseFloat(amount) * 0.971).toFixed(2)
                : parseFloat(amount).toFixed(2)
              ) : '0.00'}
            </Typography>
          </View>
        </Card>
      )}
    </View>
  );

  const renderDetailsStep = () => {
    if (depositMethod === 'crypto') {
      const crypto = CRYPTO_OPTIONS.find(c => c.symbol === selectedCurrency);
      
      return (
        <View style={styles.stepContainer}>
          <Typography variant="h5" style={styles.stepTitle}>
            Select Network
          </Typography>
          
          <View style={styles.networkOptions}>
            {crypto?.networks.map((network) => (
              <TouchableOpacity
                key={network}
                style={[
                  styles.networkOption,
                  selectedNetwork === network && styles.selectedNetworkOption
                ]}
                onPress={() => setSelectedNetwork(network)}
              >
                <Typography variant="h6">{network}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {network === 'Ethereum' ? 'Higher fees, widely supported' :
                   network === 'Polygon' ? 'Lower fees, fast confirmation' :
                   network === 'BSC' ? 'Low fees, fast transactions' :
                   network === 'Bitcoin' ? 'Secure, 10-60 min confirmation' :
                   'Fast and cheap transactions'}
                </Typography>
                {selectedNetwork === network && (
                  <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.stepContainer}>
        <Typography variant="h5" style={styles.stepTitle}>
          {depositMethod === 'bank' ? 'Bank Details' : 'Card Details'}
        </Typography>
        
        <Card style={styles.detailsCard}>
          <Typography variant="body1" style={styles.detailsTitle}>
            {depositMethod === 'bank' 
              ? 'Transfer money to the account below:'
              : 'Enter your card details to complete the deposit:'
            }
          </Typography>
          
          {depositMethod === 'bank' ? (
            <View style={styles.bankDetails}>
              <View style={styles.bankDetailRow}>
                <Typography variant="body2" color="textSecondary">Bank Name:</Typography>
                <Typography variant="body2">ilePay Bank</Typography>
              </View>
              <View style={styles.bankDetailRow}>
                <Typography variant="body2" color="textSecondary">Account Number:</Typography>
                <Typography variant="body2">1234567890</Typography>
              </View>
              <View style={styles.bankDetailRow}>
                <Typography variant="body2" color="textSecondary">Account Name:</Typography>
                <Typography variant="body2">John Doe</Typography>
              </View>
              <View style={styles.bankDetailRow}>
                <Typography variant="body2" color="textSecondary">Reference:</Typography>
                <Typography variant="body2">DEP-{Date.now().toString().slice(-6)}</Typography>
              </View>
            </View>
          ) : (
            <View style={styles.cardForm}>
              <View style={styles.inputGroup}>
                <Typography variant="body2" style={styles.inputLabel}>Card Number</Typography>
                <TextInput style={styles.input} placeholder="1234 5678 9012 3456" />
              </View>
              <View style={styles.cardRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Typography variant="body2" style={styles.inputLabel}>Expiry</Typography>
                  <TextInput style={styles.input} placeholder="MM/YY" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.md }]}>
                  <Typography variant="body2" style={styles.inputLabel}>CVV</Typography>
                  <TextInput style={styles.input} placeholder="123" secureTextEntry />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Typography variant="body2" style={styles.inputLabel}>Cardholder Name</Typography>
                <TextInput style={styles.input} placeholder="John Doe" />
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    );
  };

  const renderConfirmStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>
        Confirm Deposit
      </Typography>
      
      {depositMethod === 'crypto' ? (
        <Card style={styles.confirmCard}>
          <Typography variant="h6" style={styles.confirmTitle}>
            Deposit Address
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.confirmSubtitle}>
            Send {selectedCurrency} to this address on {selectedNetwork} network:
          </Typography>
          
          <View style={styles.addressContainer}>
            <Typography variant="body2" style={styles.address}>
              {depositAddress}
            </Typography>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(depositAddress)}
            >
              <MaterialIcons name="content-copy" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.warningContainer}>
            <MaterialIcons name="warning" size={20} color={Colors.warning} />
            <Typography variant="caption" color="warning" style={styles.warningText}>
              Only send {selectedCurrency} on {selectedNetwork} network to this address. 
              Sending other tokens or using wrong network may result in permanent loss.
            </Typography>
          </View>
        </Card>
      ) : (
        <Card style={styles.confirmCard}>
          <Typography variant="h6" style={styles.confirmTitle}>
            Deposit Summary
          </Typography>
          
          <View style={styles.summaryRow}>
            <Typography variant="body2" color="textSecondary">Method:</Typography>
            <Typography variant="body2">
              {depositMethod === 'bank' ? 'Bank Transfer' : 'Credit/Debit Card'}
            </Typography>
          </View>
          <View style={styles.summaryRow}>
            <Typography variant="body2" color="textSecondary">Currency:</Typography>
            <Typography variant="body2">{selectedCurrency}</Typography>
          </View>
          <View style={styles.summaryRow}>
            <Typography variant="body2" color="textSecondary">Amount:</Typography>
            <Typography variant="body2">
              {selectedCurrency === 'NGN' ? '₦' : selectedCurrency === 'EUR' ? '€' : '$'}{amount}
            </Typography>
          </View>
          {depositMethod === 'card' && (
            <View style={styles.summaryRow}>
              <Typography variant="body2" color="textSecondary">Fee:</Typography>
              <Typography variant="body2">
                {selectedCurrency === 'NGN' ? '₦' : selectedCurrency === 'EUR' ? '€' : '$'}
                {amount ? (parseFloat(amount) * 0.029).toFixed(2) : '0.00'}
              </Typography>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Typography variant="h6">You'll receive:</Typography>
            <Typography variant="h6" color="primary">
              {selectedCurrency === 'NGN' ? '₦' : selectedCurrency === 'EUR' ? '€' : '$'}
              {amount ? (depositMethod === 'card' 
                ? (parseFloat(amount) * 0.971).toFixed(2)
                : parseFloat(amount).toFixed(2)
              ) : '0.00'}
            </Typography>
          </View>
        </Card>
      )}
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'method': return renderMethodStep();
      case 'currency': return renderCurrencyStep();
      case 'amount': return renderAmountStep();
      case 'details': return renderDetailsStep();
      case 'confirm': return renderConfirmStep();
      default: return renderMethodStep();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        {renderStepContent()}
        
        <View style={styles.footer}>
          <Button
            title={
              step === 'confirm' 
                ? (isLoading ? 'Processing...' : 'Confirm Deposit')
                : 'Continue'
            }
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
    marginBottom: Spacing.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  methodOptions: {
    gap: Spacing.lg,
  },
  methodOption: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    alignItems: 'center',
    position: 'relative',
  },
  selectedMethodOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  methodTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  methodDescription: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  methodBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  methodBadgeText: {
    color: Colors.success,
    fontWeight: '500',
  },
  currencyOptions: {
    gap: Spacing.md,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  selectedCurrencyOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  currencyInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  currencySymbol: {
    color: Colors.primary,
    fontWeight: '700',
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
    minWidth: 200,
  },
  currencyCode: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  quickAmounts: {
    marginBottom: Spacing.xl,
  },
  quickAmountsTitle: {
    marginBottom: Spacing.md,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAmountButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  feeCard: {
    backgroundColor: Colors.gray50,
  },
  feeTitle: {
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  feeReceiveAmount: {
    fontWeight: '600',
  },
  networkOptions: {
    gap: Spacing.md,
  },
  networkOption: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  selectedNetworkOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  detailsCard: {
    marginTop: Spacing.lg,
  },
  detailsTitle: {
    marginBottom: Spacing.lg,
    fontWeight: '500',
  },
  bankDetails: {
    gap: Spacing.md,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  cardForm: {
    gap: Spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  confirmCard: {
    marginTop: Spacing.lg,
  },
  confirmTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  confirmSubtitle: {
    marginBottom: Spacing.lg,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  address: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  copyButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warning + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  warningText: {
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  totalRow: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  continueButton: {
    width: '100%',
  },
});