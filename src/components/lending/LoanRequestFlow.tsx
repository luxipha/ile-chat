import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Picker,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { LoanRequest, CollateralAsset, CreditScore } from '../../types/lending';

interface LoanRequestFlowProps {
  visible: boolean;
  onClose: () => void;
  onRequestComplete: (loanRequest: Partial<LoanRequest>) => void;
}

interface FormData {
  amount: string;
  currency: string;
  term: number; // months
  purpose: string;
  type: 'collateralized' | 'uncollateralized';
  proposedAPR: number;
}

const CURRENCIES = [
  { symbol: 'USD', name: 'US Dollar' },
  { symbol: 'NGN', name: 'Nigerian Naira' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDC', name: 'USD Coin' },
];

const COLLATERAL_OPTIONS: CollateralAsset[] = [
  {
    id: '1',
    type: 'crypto',
    symbol: 'ETH',
    name: 'Ethereum',
    amount: 2.5,
    currentValue: 4200,
    ltvRatio: 0.7,
    liquidationThreshold: 0.85,
    icon: 'currency-bitcoin',
  },
  {
    id: '2',
    type: 'crypto',
    symbol: 'USDC',
    name: 'USD Coin',
    amount: 10000,
    currentValue: 10000,
    ltvRatio: 0.9,
    liquidationThreshold: 0.95,
    icon: 'attach-money',
  },
  {
    id: '3',
    type: 'property_token',
    symbol: 'VIC',
    name: 'Victoria Island Property',
    amount: 50,
    currentValue: 25000,
    ltvRatio: 0.6,
    liquidationThreshold: 0.8,
    icon: 'home',
  },
];

export const LoanRequestFlow: React.FC<LoanRequestFlowProps> = ({
  visible,
  onClose,
  onRequestComplete,
}) => {
  const [step, setStep] = useState<'type' | 'amount' | 'collateral' | 'review' | 'processing'>('type');
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    currency: 'USD',
    term: 12,
    purpose: '',
    type: 'collateralized',
    proposedAPR: 8.5,
  });
  const [selectedCollateral, setSelectedCollateral] = useState<CollateralAsset | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock credit score - would be fetched from user profile
  const creditScore: CreditScore = {
    trustPercentage: 85,
    bricksCount: 2450,
    loanHistory: [],
    kycLevel: 'verified',
    defaultRate: 0,
    totalLoansCount: 3,
    avgRepaymentTime: 28,
  };

  const handleClose = () => {
    setStep('type');
    setFormData({
      amount: '',
      currency: 'USD',
      term: 12,
      purpose: '',
      type: 'collateralized',
      proposedAPR: 8.5,
    });
    setSelectedCollateral(null);
    setLoading(false);
    onClose();
  };

  const handleNext = () => {
    if (step === 'type') {
      setStep('amount');
    } else if (step === 'amount') {
      if (formData.type === 'collateralized') {
        setStep('collateral');
      } else {
        setStep('review');
      }
    } else if (step === 'collateral') {
      setStep('review');
    } else if (step === 'review') {
      handleSubmitRequest();
    }
  };

  const handleBack = () => {
    if (step === 'amount') {
      setStep('type');
    } else if (step === 'collateral') {
      setStep('amount');
    } else if (step === 'review') {
      if (formData.type === 'collateralized') {
        setStep('collateral');
      } else {
        setStep('amount');
      }
    }
  };

  const handleSubmitRequest = async () => {
    setLoading(true);
    setStep('processing');

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      const loanRequest: Partial<LoanRequest> = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        term: formData.term,
        purpose: formData.purpose,
        type: formData.type,
        proposedAPR: formData.proposedAPR,
        collateral: selectedCollateral || undefined,
        status: 'open',
        creditScore,
        riskLevel: formData.type === 'collateralized' ? 'low' : 'medium',
      };
      
      onRequestComplete(loanRequest);
      handleClose();
      Alert.alert('Success', 'Your loan request has been submitted for review');
    }, 3000);
  };

  const canProceed = () => {
    if (step === 'type') return true;
    if (step === 'amount') {
      return formData.amount && parseFloat(formData.amount) > 0 && formData.purpose.trim();
    }
    if (step === 'collateral') {
      return formData.type === 'uncollateralized' || selectedCollateral;
    }
    return true;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={step === 'type' ? handleClose : handleBack}>
        <MaterialIcons 
          name={step === 'type' ? 'close' : 'arrow-back'} 
          size={24} 
          color={Colors.textPrimary} 
        />
      </TouchableOpacity>
      <Typography variant="h6" style={styles.headerTitle}>
        {step === 'type' && 'Choose Loan Type'}
        {step === 'amount' && 'Loan Details'}
        {step === 'collateral' && 'Select Collateral'}
        {step === 'review' && 'Review Request'}
        {step === 'processing' && 'Processing Request'}
      </Typography>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderTypeSelection = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>What type of loan do you need?</Typography>
      
      <TouchableOpacity
        style={[
          styles.loanTypeCard,
          formData.type === 'collateralized' && styles.selectedCard
        ]}
        onPress={() => setFormData({ ...formData, type: 'collateralized' })}
      >
        <View style={styles.loanTypeHeader}>
          <MaterialIcons name="security" size={24} color={Colors.primary} />
          <Typography variant="h6" style={styles.loanTypeTitle}>Collateralized Loan</Typography>
        </View>
        <Typography variant="body2" color="textSecondary" style={styles.loanTypeDescription}>
          Secure your loan with crypto or property tokens. Lower rates, higher approval chances.
        </Typography>
        <View style={styles.loanTypeBenefits}>
          <Typography variant="caption" color="success">✓ Lower interest rates (5-12%)</Typography>
          <Typography variant="caption" color="success">✓ Higher loan amounts</Typography>
          <Typography variant="caption" color="success">✓ Faster approval</Typography>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.loanTypeCard,
          formData.type === 'uncollateralized' && styles.selectedCard
        ]}
        onPress={() => setFormData({ ...formData, type: 'uncollateralized' })}
      >
        <View style={styles.loanTypeHeader}>
          <MaterialIcons name="person" size={24} color={Colors.primary} />
          <Typography variant="h6" style={styles.loanTypeTitle}>Uncollateralized Loan</Typography>
        </View>
        <Typography variant="body2" color="textSecondary" style={styles.loanTypeDescription}>
          Based on your trust score and history. No collateral required.
        </Typography>
        <View style={styles.loanTypeBenefits}>
          <Typography variant="caption" color="warning">• Higher interest rates (12-25%)</Typography>
          <Typography variant="caption" color="warning">• Trust score dependent</Typography>
          <Typography variant="caption" color="warning">• Stricter approval process</Typography>
        </View>
      </TouchableOpacity>

      <Card style={styles.creditScoreCard}>
        <Typography variant="h6" style={styles.creditScoreTitle}>Your Credit Profile</Typography>
        <View style={styles.creditScoreRow}>
          <Typography variant="body2" color="textSecondary">Trust Score:</Typography>
          <Typography variant="body2" color="success" style={styles.creditScoreValue}>
            {creditScore.trustPercentage}%
          </Typography>
        </View>
        <View style={styles.creditScoreRow}>
          <Typography variant="body2" color="textSecondary">Loan History:</Typography>
          <Typography variant="body2" style={styles.creditScoreValue}>
            {creditScore.totalLoansCount} completed
          </Typography>
        </View>
        <View style={styles.creditScoreRow}>
          <Typography variant="body2" color="textSecondary">KYC Level:</Typography>
          <Typography variant="body2" color="primary" style={styles.creditScoreValue}>
            {creditScore.kycLevel}
          </Typography>
        </View>
      </Card>
    </View>
  );

  const renderAmountStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>Loan Details</Typography>
      
      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>Loan Amount</Typography>
        <View style={styles.amountInputContainer}>
          <TextInput
            style={styles.amountInput}
            value={formData.amount}
            onChangeText={(text) => setFormData({ ...formData, amount: text })}
            placeholder="0"
            keyboardType="numeric"
          />
          <View style={styles.currencySelector}>
            <Picker
              selectedValue={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
              style={styles.picker}
            >
              {CURRENCIES.map((currency) => (
                <Picker.Item key={currency.symbol} label={currency.symbol} value={currency.symbol} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>Loan Term</Typography>
        <View style={styles.termContainer}>
          {[6, 12, 18, 24, 36].map((months) => (
            <TouchableOpacity
              key={months}
              style={[
                styles.termOption,
                formData.term === months && styles.selectedTermOption
              ]}
              onPress={() => setFormData({ ...formData, term: months })}
            >
              <Typography 
                variant="body2" 
                style={[
                  styles.termOptionText,
                  formData.term === months && styles.selectedTermOptionText
                ]}
              >
                {months} months
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>Purpose</Typography>
        <TextInput
          style={styles.textInput}
          value={formData.purpose}
          onChangeText={(text) => setFormData({ ...formData, purpose: text })}
          placeholder="What will you use this loan for?"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>Proposed APR</Typography>
        <View style={styles.aprContainer}>
          <TextInput
            style={styles.aprInput}
            value={formData.proposedAPR.toString()}
            onChangeText={(text) => setFormData({ ...formData, proposedAPR: parseFloat(text) || 0 })}
            keyboardType="numeric"
          />
          <Typography variant="body2" style={styles.aprSuffix}>%</Typography>
        </View>
        <Typography variant="caption" color="textSecondary">
          Market rate for {formData.type} loans: {formData.type === 'collateralized' ? '5-12%' : '12-25%'}
        </Typography>
      </View>
    </ScrollView>
  );

  const renderCollateralStep = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>Select Collateral</Typography>
      <Typography variant="body2" color="textSecondary" style={styles.stepSubtitle}>
        Choose assets to secure your ${formData.amount} {formData.currency} loan
      </Typography>
      
      <ScrollView style={styles.collateralList}>
        {COLLATERAL_OPTIONS.map((asset) => {
          const maxLoanAmount = asset.currentValue * asset.ltvRatio;
          const isEligible = maxLoanAmount >= parseFloat(formData.amount || '0');
          
          return (
            <TouchableOpacity
              key={asset.id}
              style={[
                styles.collateralCard,
                selectedCollateral?.id === asset.id && styles.selectedCard,
                !isEligible && styles.disabledCard
              ]}
              onPress={() => isEligible && setSelectedCollateral(asset)}
              disabled={!isEligible}
            >
              <View style={styles.collateralHeader}>
                <View style={styles.collateralIcon}>
                  <MaterialIcons name={asset.icon as any} size={24} color={Colors.primary} />
                </View>
                <View style={styles.collateralInfo}>
                  <Typography variant="h6">{asset.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {asset.amount} {asset.symbol}
                  </Typography>
                </View>
                <Typography variant="h6" style={styles.collateralValue}>
                  ${asset.currentValue.toLocaleString()}
                </Typography>
              </View>
              
              <View style={styles.collateralDetails}>
                <View style={styles.collateralDetailRow}>
                  <Typography variant="caption" color="textSecondary">Max Loan:</Typography>
                  <Typography 
                    variant="caption" 
                    color={isEligible ? "success" : "error"}
                    style={styles.collateralDetailValue}
                  >
                    ${maxLoanAmount.toLocaleString()}
                  </Typography>
                </View>
                <View style={styles.collateralDetailRow}>
                  <Typography variant="caption" color="textSecondary">LTV Ratio:</Typography>
                  <Typography variant="caption" style={styles.collateralDetailValue}>
                    {(asset.ltvRatio * 100).toFixed(0)}%
                  </Typography>
                </View>
              </View>
              
              {!isEligible && (
                <Typography variant="caption" color="error" style={styles.ineligibleText}>
                  Insufficient collateral value
                </Typography>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderReviewStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>Review Your Request</Typography>
      
      <Card style={styles.reviewCard}>
        <Typography variant="h6" style={styles.reviewSectionTitle}>Loan Details</Typography>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">Amount:</Typography>
          <Typography variant="body1" style={styles.reviewValue}>
            ${parseFloat(formData.amount || '0').toLocaleString()} {formData.currency}
          </Typography>
        </View>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">Term:</Typography>
          <Typography variant="body1" style={styles.reviewValue}>
            {formData.term} months
          </Typography>
        </View>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">Type:</Typography>
          <Typography variant="body1" style={styles.reviewValue}>
            {formData.type === 'collateralized' ? 'Collateralized' : 'Uncollateralized'}
          </Typography>
        </View>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">Proposed APR:</Typography>
          <Typography variant="body1" style={styles.reviewValue}>
            {formData.proposedAPR}%
          </Typography>
        </View>
        <View style={styles.reviewRow}>
          <Typography variant="body2" color="textSecondary">Purpose:</Typography>
          <Typography variant="body2" style={styles.reviewValue}>
            {formData.purpose}
          </Typography>
        </View>
      </Card>

      {selectedCollateral && (
        <Card style={styles.reviewCard}>
          <Typography variant="h6" style={styles.reviewSectionTitle}>Collateral</Typography>
          <View style={styles.reviewRow}>
            <Typography variant="body2" color="textSecondary">Asset:</Typography>
            <Typography variant="body1" style={styles.reviewValue}>
              {selectedCollateral.name}
            </Typography>
          </View>
          <View style={styles.reviewRow}>
            <Typography variant="body2" color="textSecondary">Amount:</Typography>
            <Typography variant="body1" style={styles.reviewValue}>
              {selectedCollateral.amount} {selectedCollateral.symbol}
            </Typography>
          </View>
          <View style={styles.reviewRow}>
            <Typography variant="body2" color="textSecondary">Value:</Typography>
            <Typography variant="body1" style={styles.reviewValue}>
              ${selectedCollateral.currentValue.toLocaleString()}
            </Typography>
          </View>
          <View style={styles.reviewRow}>
            <Typography variant="body2" color="textSecondary">LTV Ratio:</Typography>
            <Typography variant="body1" style={styles.reviewValue}>
              {(selectedCollateral.ltvRatio * 100).toFixed(0)}%
            </Typography>
          </View>
        </Card>
      )}

      <Card style={styles.reviewCard}>
        <Typography variant="h6" style={styles.reviewSectionTitle}>Estimated Monthly Payment</Typography>
        <Typography variant="h4" style={styles.monthlyPayment}>
          ${Math.round(parseFloat(formData.amount || '0') * (1 + formData.proposedAPR / 100) / formData.term).toLocaleString()}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Based on proposed APR of {formData.proposedAPR}%
        </Typography>
      </Card>
    </ScrollView>
  );

  const renderProcessingStep = () => (
    <View style={styles.processingContainer}>
      <MaterialIcons name="hourglass-empty" size={48} color={Colors.primary} />
      <Typography variant="h5" style={styles.processingTitle}>
        Processing Your Request
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.processingText}>
        Your loan request is being reviewed by our system and will be available to lenders shortly.
      </Typography>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        
        {step === 'type' && renderTypeSelection()}
        {step === 'amount' && renderAmountStep()}
        {step === 'collateral' && renderCollateralStep()}
        {step === 'review' && renderReviewStep()}
        {step === 'processing' && renderProcessingStep()}
        
        {step !== 'processing' && (
          <View style={styles.footer}>
            <Button
              title={step === 'review' ? 'Submit Request' : 'Continue'}
              onPress={handleNext}
              disabled={!canProceed()}
              loading={loading}
              style={styles.continueButton}
            />
          </View>
        )}
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
  loanTypeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    marginBottom: Spacing.md,
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  disabledCard: {
    opacity: 0.5,
  },
  loanTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  loanTypeTitle: {
    marginLeft: Spacing.md,
    fontWeight: '600',
  },
  loanTypeDescription: {
    marginBottom: Spacing.md,
  },
  loanTypeBenefits: {
    gap: Spacing.xs,
  },
  creditScoreCard: {
    marginTop: Spacing.lg,
  },
  creditScoreTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  creditScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  creditScoreValue: {
    fontWeight: '500',
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
    overflow: 'hidden',
  },
  amountInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 18,
    fontWeight: '600',
  },
  currencySelector: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
  },
  picker: {
    width: 80,
  },
  termContainer: {
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
    backgroundColor: Colors.primaryLight + '10',
  },
  termOptionText: {
    color: Colors.textSecondary,
  },
  selectedTermOptionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    textAlignVertical: 'top',
  },
  aprContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  aprInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 16,
  },
  aprSuffix: {
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  collateralList: {
    flex: 1,
  },
  collateralCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    marginBottom: Spacing.md,
  },
  collateralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  collateralIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  collateralInfo: {
    flex: 1,
  },
  collateralValue: {
    fontWeight: '600',
  },
  collateralDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: Spacing.md,
  },
  collateralDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  collateralDetailValue: {
    fontWeight: '500',
  },
  ineligibleText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
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
  monthlyPayment: {
    color: Colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  processingTitle: {
    marginVertical: Spacing.lg,
    fontWeight: '600',
  },
  processingText: {
    textAlign: 'center',
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