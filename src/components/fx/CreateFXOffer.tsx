import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Currency, PaymentMethod, FXOffer } from '../../types/fx';

interface CreateFXOfferProps {
  visible: boolean;
  onClose: () => void;
  onOfferCreated: (offer: Partial<FXOffer>) => void;
}

const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', type: 'fiat' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', type: 'fiat' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', type: 'fiat' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', type: 'fiat' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', type: 'fiat' },
  { code: 'USDC', name: 'USD Coin', symbol: 'USDC', flag: '💰', type: 'crypto' },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'alipay',
    name: 'Alipay',
    type: 'digital_wallet',
    icon: 'payment',
    processingTime: '1-5 minutes',
    limits: { min: 100, max: 50000 },
  },
  {
    id: 'wechat',
    name: 'WeChat Pay',
    type: 'digital_wallet', 
    icon: 'payment',
    processingTime: '1-5 minutes',
    limits: { min: 100, max: 30000 },
  },
  {
    id: 'bank_ng',
    name: 'Nigerian Bank',
    type: 'bank',
    icon: 'account-balance',
    processingTime: '5-15 minutes',
    limits: { min: 1000, max: 5000000 },
  },
  {
    id: 'bank_us',
    name: 'US Bank Wire',
    type: 'bank',
    icon: 'account-balance',
    processingTime: '30-60 minutes',
    limits: { min: 500, max: 100000 },
  },
];

export const CreateFXOffer: React.FC<CreateFXOfferProps> = ({
  visible,
  onClose,
  onOfferCreated,
}) => {
  const [step, setStep] = useState<'currencies' | 'amounts' | 'payment' | 'terms' | 'review'>('currencies');
  const [sellCurrency, setSellCurrency] = useState<Currency | null>(null);
  const [buyCurrency, setBuyCurrency] = useState<Currency | null>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentWindow, setPaymentWindow] = useState('30');
  const [minTrade, setMinTrade] = useState('');
  const [maxTrade, setMaxTrade] = useState('');
  const [terms, setTerms] = useState('');
  const [autoReply, setAutoReply] = useState('');
  const [kycRequired, setKycRequired] = useState(false);

  const handleClose = () => {
    setStep('currencies');
    setSellCurrency(null);
    setBuyCurrency(null);
    setSellAmount('');
    setExchangeRate('');
    setSelectedPaymentMethods([]);
    setPaymentWindow('30');
    setMinTrade('');
    setMaxTrade('');
    setTerms('');
    setAutoReply('');
    setKycRequired(false);
    onClose();
  };

  const canProceed = () => {
    switch (step) {
      case 'currencies':
        return sellCurrency && buyCurrency && sellCurrency.code !== buyCurrency.code;
      case 'amounts':
        return sellAmount && exchangeRate && parseFloat(sellAmount) > 0 && parseFloat(exchangeRate) > 0;
      case 'payment':
        return selectedPaymentMethods.length > 0;
      case 'terms':
        return minTrade && maxTrade && parseFloat(minTrade) <= parseFloat(maxTrade);
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step === 'currencies') setStep('amounts');
    else if (step === 'amounts') setStep('payment');
    else if (step === 'payment') setStep('terms');
    else if (step === 'terms') setStep('review');
    else if (step === 'review') handleCreateOffer();
  };

  const handleBack = () => {
    if (step === 'amounts') setStep('currencies');
    else if (step === 'payment') setStep('amounts');
    else if (step === 'terms') setStep('payment');
    else if (step === 'review') setStep('terms');
  };

  const handleCreateOffer = () => {
    if (!sellCurrency || !buyCurrency) return;

    const offer: Partial<FXOffer> = {
      sellCurrency,
      buyCurrency,
      sellAmount: parseFloat(sellAmount),
      buyAmount: parseFloat(sellAmount) * parseFloat(exchangeRate),
      exchangeRate: parseFloat(exchangeRate),
      margin: 0, // Calculate based on market rate
      paymentMethods: selectedPaymentMethods,
      paymentWindow: parseInt(paymentWindow),
      minTrade: parseFloat(minTrade),
      maxTrade: parseFloat(maxTrade),
      availableAmount: parseFloat(sellAmount),
      terms,
      autoReply,
      kycRequired,
      status: 'active',
    };

    onOfferCreated(offer);
    handleClose();
    Alert.alert('Success', 'Your FX offer has been created and is now live!');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={step === 'currencies' ? handleClose : handleBack}>
        <MaterialIcons 
          name={step === 'currencies' ? 'close' : 'arrow-back'} 
          size={24} 
          color={Colors.textPrimary} 
        />
      </TouchableOpacity>
      <Typography variant="h6" style={styles.headerTitle}>
        {step === 'currencies' && 'Select Currencies'}
        {step === 'amounts' && 'Set Amounts & Rate'}
        {step === 'payment' && 'Payment Methods'}
        {step === 'terms' && 'Trading Terms'}
        {step === 'review' && 'Review Offer'}
      </Typography>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderCurrenciesStep = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>What do you want to trade?</Typography>
      
      <View style={styles.currencySelection}>
        <Typography variant="body1" style={styles.selectionLabel}>I want to sell:</Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyList}>
          {CURRENCIES.map((currency) => (
            <TouchableOpacity
              key={currency.code}
              style={[
                styles.currencyOption,
                sellCurrency?.code === currency.code && styles.selectedCurrency
              ]}
              onPress={() => setSellCurrency(currency)}
            >
              <Typography variant="h4" style={styles.currencyFlag}>
                {currency.flag}
              </Typography>
              <Typography variant="body2" style={styles.currencyCode}>
                {currency.code}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {currency.name}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.exchangeArrow}>
        <MaterialIcons name="swap-vert" size={32} color={Colors.primary} />
      </View>

      <View style={styles.currencySelection}>
        <Typography variant="body1" style={styles.selectionLabel}>In exchange for:</Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyList}>
          {CURRENCIES.filter(c => c.code !== sellCurrency?.code).map((currency) => (
            <TouchableOpacity
              key={currency.code}
              style={[
                styles.currencyOption,
                buyCurrency?.code === currency.code && styles.selectedCurrency
              ]}
              onPress={() => setBuyCurrency(currency)}
            >
              <Typography variant="h4" style={styles.currencyFlag}>
                {currency.flag}
              </Typography>
              <Typography variant="body2" style={styles.currencyCode}>
                {currency.code}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {currency.name}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderAmountsStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>Set your offer details</Typography>
      
      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>
          Amount to sell ({sellCurrency?.code})
        </Typography>
        <View style={styles.amountInputContainer}>
          <Typography variant="body2" style={styles.currencySymbol}>
            {sellCurrency?.symbol}
          </Typography>
          <TextInput
            style={styles.amountInput}
            value={sellAmount}
            onChangeText={setSellAmount}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>
          Exchange Rate (1 {sellCurrency?.code} = ? {buyCurrency?.code})
        </Typography>
        <View style={styles.amountInputContainer}>
          <TextInput
            style={styles.amountInput}
            value={exchangeRate}
            onChangeText={setExchangeRate}
            placeholder="0.00"
            keyboardType="numeric"
          />
          <Typography variant="body2" style={styles.currencySymbol}>
            {buyCurrency?.symbol}
          </Typography>
        </View>
      </View>

      {sellAmount && exchangeRate && (
        <Card style={styles.calculationCard}>
          <Typography variant="h6" style={styles.calculationTitle}>Trade Summary</Typography>
          <View style={styles.calculationRow}>
            <Typography variant="body2" color="textSecondary">You sell:</Typography>
            <Typography variant="h6">
              {sellCurrency?.symbol}{parseFloat(sellAmount).toLocaleString()} {sellCurrency?.code}
            </Typography>
          </View>
          <View style={styles.calculationRow}>
            <Typography variant="body2" color="textSecondary">You receive:</Typography>
            <Typography variant="h6" color="primary">
              {buyCurrency?.symbol}{(parseFloat(sellAmount) * parseFloat(exchangeRate)).toLocaleString()} {buyCurrency?.code}
            </Typography>
          </View>
        </Card>
      )}
    </ScrollView>
  );

  const renderPaymentStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>Payment Methods</Typography>
      <Typography variant="body2" color="textSecondary" style={styles.stepSubtitle}>
        Select payment methods you accept
      </Typography>
      
      {PAYMENT_METHODS.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.paymentMethodCard,
            selectedPaymentMethods.some(m => m.id === method.id) && styles.selectedPaymentMethod
          ]}
          onPress={() => {
            if (selectedPaymentMethods.some(m => m.id === method.id)) {
              setSelectedPaymentMethods(prev => prev.filter(m => m.id !== method.id));
            } else {
              setSelectedPaymentMethods(prev => [...prev, method]);
            }
          }}
        >
          <View style={styles.paymentMethodHeader}>
            <MaterialIcons name={method.icon as any} size={24} color={Colors.primary} />
            <Typography variant="h6" style={styles.paymentMethodName}>
              {method.name}
            </Typography>
            {selectedPaymentMethods.some(m => m.id === method.id) && (
              <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            )}
          </View>
          <Typography variant="caption" color="textSecondary">
            {method.processingTime} • {method.limits.min} - {method.limits.max} limit
          </Typography>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTermsStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>Trading Terms</Typography>
      
      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>Payment Window (minutes)</Typography>
        <View style={styles.termOptions}>
          {['15', '30', '45', '60'].map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.termOption,
                paymentWindow === minutes && styles.selectedTermOption
              ]}
              onPress={() => setPaymentWindow(minutes)}
            >
              <Typography 
                variant="body2" 
                style={[
                  styles.termOptionText,
                  paymentWindow === minutes && styles.selectedTermOptionText
                ]}
              >
                {minutes} min
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>
          Trade Limits ({sellCurrency?.code})
        </Typography>
        <View style={styles.limitInputs}>
          <View style={styles.limitInput}>
            <Typography variant="caption" color="textSecondary">Minimum</Typography>
            <TextInput
              style={styles.textInput}
              value={minTrade}
              onChangeText={setMinTrade}
              placeholder="100"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.limitInput}>
            <Typography variant="caption" color="textSecondary">Maximum</Typography>
            <TextInput
              style={styles.textInput}
              value={maxTrade}
              onChangeText={setMaxTrade}
              placeholder="10000"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>Additional Terms (Optional)</Typography>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={terms}
          onChangeText={setTerms}
          placeholder="Any additional terms or requirements..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>Auto Reply Message (Optional)</Typography>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={autoReply}
          onChangeText={setAutoReply}
          placeholder="Automatic message sent to traders..."
          multiline
          numberOfLines={2}
        />
      </View>

      <TouchableOpacity
        style={styles.kycOption}
        onPress={() => setKycRequired(!kycRequired)}
      >
        <View style={styles.kycCheckbox}>
          {kycRequired && (
            <MaterialIcons name="check" size={16} color={Colors.primary} />
          )}
        </View>
        <Typography variant="body2" style={styles.kycText}>
          Require KYC verification from traders
        </Typography>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderReviewStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>Review Your Offer</Typography>
      
      <Card style={styles.reviewCard}>
        <Typography variant="h6" style={styles.reviewSectionTitle}>Trade Details</Typography>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">Selling:</Typography>
          <Typography variant="body2" style={styles.reviewValue}>
            {sellCurrency?.symbol}{parseFloat(sellAmount || '0').toLocaleString()} {sellCurrency?.code}
          </Typography>
        </View>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">Exchange Rate:</Typography>
          <Typography variant="body2" style={styles.reviewValue}>
            1 {sellCurrency?.code} = {exchangeRate} {buyCurrency?.code}
          </Typography>
        </View>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">Trader Receives:</Typography>
          <Typography variant="body2" color="primary" style={styles.reviewValue}>
            {buyCurrency?.symbol}{(parseFloat(sellAmount || '0') * parseFloat(exchangeRate || '0')).toLocaleString()} {buyCurrency?.code}
          </Typography>
        </View>
      </Card>

      <Card style={styles.reviewCard}>
        <Typography variant="h6" style={styles.reviewSectionTitle}>Payment & Terms</Typography>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">Payment Methods:</Typography>
          <Typography variant="body2" style={styles.reviewValue}>
            {selectedPaymentMethods.map(m => m.name).join(', ')}
          </Typography>
        </View>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">Payment Window:</Typography>
          <Typography variant="body2" style={styles.reviewValue}>
            {paymentWindow} minutes
          </Typography>
        </View>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">Trade Limits:</Typography>
          <Typography variant="body2" style={styles.reviewValue}>
            {sellCurrency?.symbol}{minTrade} - {sellCurrency?.symbol}{maxTrade}
          </Typography>
        </View>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">KYC Required:</Typography>
          <Typography variant="body2" style={styles.reviewValue}>
            {kycRequired ? 'Yes' : 'No'}
          </Typography>
        </View>
      </Card>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'currencies': return renderCurrenciesStep();
      case 'amounts': return renderAmountsStep();
      case 'payment': return renderPaymentStep();
      case 'terms': return renderTermsStep();
      case 'review': return renderReviewStep();
      default: return renderCurrenciesStep();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        
        {renderStepContent()}
        
        <View style={styles.footer}>
          <Button
            title={step === 'review' ? 'Create Offer' : 'Continue'}
            onPress={handleNext}
            disabled={!canProceed()}
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
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  stepSubtitle: {
    marginBottom: Spacing.lg,
  },
  currencySelection: {
    marginBottom: Spacing.xl,
  },
  selectionLabel: {
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  currencyList: {
    flexDirection: 'row',
  },
  currencyOption: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    marginRight: Spacing.md,
    minWidth: 100,
  },
  selectedCurrency: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  currencyFlag: {
    marginBottom: Spacing.sm,
  },
  currencyCode: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  exchangeArrow: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    marginRight: Spacing.sm,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 18,
    fontWeight: '600',
  },
  calculationCard: {
    marginTop: Spacing.md,
  },
  calculationTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  paymentMethodCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    marginBottom: Spacing.md,
  },
  selectedPaymentMethod: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentMethodName: {
    marginLeft: Spacing.md,
    flex: 1,
    fontWeight: '600',
  },
  termOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  termOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  selectedTermOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  termOptionText: {
    color: Colors.textSecondary,
  },
  selectedTermOptionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  limitInputs: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  limitInput: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  kycOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  kycCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  kycText: {
    flex: 1,
  },
  reviewCard: {
    marginBottom: Spacing.lg,
  },
  reviewSectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  reviewValue: {
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
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