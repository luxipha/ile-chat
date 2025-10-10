import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { Currency, PaymentMethod, FXOffer } from '../../types/fx';
import { fxService } from '../../services/fxService';
import authService, { BankDetails, AlipayDetails } from '../../services/authService';
import { API_BASE_URL } from '../../config/apiConfig';

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
    name: 'WeChat',
    type: 'digital_wallet', 
    icon: 'payment',
    processingTime: '1-5 minutes',
    limits: { min: 100, max: 30000 },
  },
  {
    id: 'bank',
    name: 'Bank (recommended)',
    type: 'bank',
    icon: 'account-balance',
    processingTime: '5-15 minutes',
    limits: { min: 1000, max: 5000000 },
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
  const [buyAmount, setBuyAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentWindow, setPaymentWindow] = useState('30');
  const [minTrade, setMinTrade] = useState('');
  const [maxTrade, setMaxTrade] = useState('');
  const [terms, setTerms] = useState('');
  const [autoReply, setAutoReply] = useState('');
  const [kycRequired, setKycRequired] = useState(false);
  
  // Payment method details state
  const [paymentMethodDetails, setPaymentMethodDetails] = useState<{
    alipay?: { accountName: string; phoneNumber: string };
    wechat?: {};
    bank?: { bankName: string; accountName: string; accountNumber: string };
  }>({});
  
  // Debug state
  const [debugMode, setDebugMode] = useState(false);
  
  // Loading state
  const [isCreating, setIsCreating] = useState(false);
  
  // Merchant payment method details state
  const [merchantBankDetails, setMerchantBankDetails] = useState<BankDetails | null>(null);
  const [merchantAlipayDetails, setMerchantAlipayDetails] = useState<AlipayDetails | null>(null);

  // Load merchant payment method details on mount
  useEffect(() => {
    const loadMerchantDetails = async () => {
      try {
        console.log('🔍 [CreateFXOffer] Loading merchant details...');
        const user = await authService.getCachedUser();
        console.log('🔍 [CreateFXOffer] Cached user data keys:', user ? Object.keys(user) : 'null');
        console.log('🔍 [CreateFXOffer] Has merchantProfile?', !!user?.merchantProfile);
        if (user?.merchantProfile) {
          console.log('🔍 [CreateFXOffer] MerchantProfile keys:', Object.keys(user.merchantProfile));
        }
        
        let bankDetailsFound = false;
        let alipayDetailsFound = false;

        // Strategy 1: Try to get from user merchant profile
        if (user?.merchantProfile?.bankDetails) {
          console.log('✅ [CreateFXOffer] Found bank details in merchant profile:', {
            bankName: user.merchantProfile.bankDetails.bankName,
            accountHolderName: user.merchantProfile.bankDetails.accountHolderName,
            accountNumber: user.merchantProfile.bankDetails.accountNumber,
            currency: user.merchantProfile.bankDetails.currency
          });
          setMerchantBankDetails(user.merchantProfile.bankDetails);
          bankDetailsFound = true;
        }

        if (user?.merchantProfile?.alipayDetails) {
          console.log('✅ [CreateFXOffer] Found Alipay details in merchant profile:', user.merchantProfile.alipayDetails);
          setMerchantAlipayDetails(user.merchantProfile.alipayDetails);
          alipayDetailsFound = true;
        }

        // Strategy 2: Fallback to previous offers if merchant profile doesn't have the details
        if (!bankDetailsFound) {
          console.log('🔄 [CreateFXOffer] No bank details in merchant profile, trying previous offers...');
          try {
            const offersResponse = await fxService.getOffers();
            console.log('🔍 [CreateFXOffer] Offers response:', offersResponse.success ? `${offersResponse.offers.length} offers found` : 'failed');
            
            if (offersResponse.success && offersResponse.offers.length > 0) {
              console.log('🔍 [CreateFXOffer] First offer sample:', {
                id: offersResponse.offers[0].id,
                paymentMethods: offersResponse.offers[0].paymentMethods?.map(pm => pm.id),
                hasBankDetails: !!(offersResponse.offers[0] as any).bankDetails
              });
              
              // Find the most recent offer with bank payment method (likely to have bank details)
              const offerWithBankDetails = offersResponse.offers.find((offer: any) => 
                offer.paymentMethods?.some((pm: any) => pm.id === 'bank' || pm.id === 'bank_transfer')
              );
              
              console.log('🔍 [CreateFXOffer] Offer with bank details found?', !!offerWithBankDetails);
              
              if (offerWithBankDetails && (offerWithBankDetails as any).bankDetails) {
                console.log('✅ [CreateFXOffer] Found bank details from previous offer:', (offerWithBankDetails as any).bankDetails);
                setMerchantBankDetails({
                  bankName: (offerWithBankDetails as any).bankDetails.bankName,
                  accountHolderName: (offerWithBankDetails as any).bankDetails.accountHolderName,
                  accountNumber: (offerWithBankDetails as any).bankDetails.accountNumber,
                  currency: (offerWithBankDetails as any).bankDetails.currency
                });
                bankDetailsFound = true;
              } else if (offerWithBankDetails) {
                console.log('❌ [CreateFXOffer] Offer has bank payment method but no bankDetails field');
                console.log('🔍 [CreateFXOffer] Offer structure:', Object.keys(offerWithBankDetails));
              }

              // Also check for Alipay details from previous offers
              const offerWithAlipayDetails = offersResponse.offers.find((offer: any) => 
                offer.paymentMethods?.some((pm: any) => pm.id === 'alipay')
              );
              
              if (offerWithAlipayDetails && (offerWithAlipayDetails as any).alipayDetails) {
                console.log('✅ [CreateFXOffer] Found Alipay details from previous offer:', (offerWithAlipayDetails as any).alipayDetails);
                setMerchantAlipayDetails({
                  accountName: (offerWithAlipayDetails as any).alipayDetails.accountName,
                  phoneNumber: (offerWithAlipayDetails as any).alipayDetails.phoneNumber
                });
                alipayDetailsFound = true;
              }
            }
          } catch (error) {
            console.warn('⚠️ [CreateFXOffer] Error fetching previous offers:', error);
          }
        }

        // Strategy 3: Try to fetch fresh user profile from backend
        if (!bankDetailsFound) {
          console.log('🔄 [CreateFXOffer] No bank details found, trying to fetch fresh user profile...');
          try {
            const session = await authService.getSession();
            console.log('🔍 [CreateFXOffer] Fresh session response:', session.success ? 'success' : `failed: ${session.error}`);
            
            if (session.success && session.user) {
              console.log('🔍 [CreateFXOffer] Fresh user data keys:', Object.keys(session.user));
              console.log('🔍 [CreateFXOffer] Fresh user has merchantProfile?', !!session.user.merchantProfile);
              
              if (session.user.merchantProfile?.bankDetails) {
                console.log('✅ [CreateFXOffer] Found bank details in fresh session:', session.user.merchantProfile.bankDetails);
                setMerchantBankDetails(session.user.merchantProfile.bankDetails);
                bankDetailsFound = true;
              }
            }
          } catch (error) {
            console.warn('⚠️ [CreateFXOffer] Error fetching fresh session:', error);
          }
        }

        // Strategy 4: Direct API call to merchant profile endpoint
        if (!bankDetailsFound) {
          console.log('🔄 [CreateFXOffer] Trying direct API call to get merchant bank details...');
          try {
            const token = authService.getToken();
            if (token) {
              const response = await fetch(`${API_BASE_URL}/api/merchant/status`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const merchantData = await response.json();
                console.log('🔍 [CreateFXOffer] Merchant API response keys:', merchantData ? Object.keys(merchantData) : 'null');
                
                if (merchantData.bankDetails) {
                  console.log('✅ [CreateFXOffer] Found bank details from merchant API:', merchantData.bankDetails);
                  setMerchantBankDetails({
                    bankName: merchantData.bankDetails.bankName,
                    accountHolderName: merchantData.bankDetails.accountHolderName,
                    accountNumber: merchantData.bankDetails.accountNumber,
                    currency: merchantData.bankDetails.currency
                  });
                  bankDetailsFound = true;
                }
              } else {
                console.warn('⚠️ [CreateFXOffer] Merchant API call failed:', response.status);
              }
            }
          } catch (error) {
            console.warn('⚠️ [CreateFXOffer] Error calling merchant API:', error);
          }
        }

        if (!bankDetailsFound) {
          console.log('❌ [CreateFXOffer] No bank details found in merchant profile or previous offers');
        }

        if (!alipayDetailsFound) {
          console.log('❌ [CreateFXOffer] No Alipay details found (expected, not stored in backend yet)');
        }
        
      } catch (error) {
        console.error('🔥 [CreateFXOffer] Error loading merchant details:', error);
      }
    };

    if (visible) {
      console.log('🔍 [CreateFXOffer] Modal opened, loading merchant details...');
      loadMerchantDetails();
    }
  }, [visible]);

  // Auto-populate payment method details when payment methods are selected
  useEffect(() => {
    console.log('🔍 [CreateFXOffer] Payment methods changed, auto-populating...');
    console.log('🔍 [CreateFXOffer] Selected payment methods:', selectedPaymentMethods.map(m => m.id));
    console.log('🔍 [CreateFXOffer] Merchant bank details:', merchantBankDetails);
    console.log('🔍 [CreateFXOffer] Merchant Alipay details:', merchantAlipayDetails);

    if (merchantBankDetails || merchantAlipayDetails) {
      const newPaymentMethodDetails: any = { ...paymentMethodDetails };

      // Auto-populate bank details if bank is selected and merchant has bank details
      const hasBankSelected = selectedPaymentMethods.some(m => m.id === 'bank');
      console.log('🔍 [CreateFXOffer] Bank selected:', hasBankSelected);
      
      if (hasBankSelected && merchantBankDetails) {
        console.log('✅ [CreateFXOffer] Auto-populating bank details');
        const bankDetails = {
          bankName: merchantBankDetails.bankName,
          accountName: merchantBankDetails.accountHolderName || (merchantBankDetails as any).accountName,
          accountNumber: merchantBankDetails.accountNumber
        };
        console.log('🔍 [CreateFXOffer] Bank details being set:', bankDetails);
        newPaymentMethodDetails.bank = bankDetails;
      }

      // Auto-populate Alipay details if Alipay is selected and merchant has Alipay details
      const hasAlipaySelected = selectedPaymentMethods.some(m => m.id === 'alipay');
      console.log('🔍 [CreateFXOffer] Alipay selected:', hasAlipaySelected);
      
      if (hasAlipaySelected && merchantAlipayDetails) {
        console.log('✅ [CreateFXOffer] Auto-populating Alipay details');
        newPaymentMethodDetails.alipay = {
          accountName: merchantAlipayDetails.accountName,
          phoneNumber: merchantAlipayDetails.phoneNumber
        };
      }

      console.log('🔍 [CreateFXOffer] Final payment method details:', newPaymentMethodDetails);
      setPaymentMethodDetails(newPaymentMethodDetails);
    }
  }, [selectedPaymentMethods, merchantBankDetails, merchantAlipayDetails]);

  const handleClose = () => {
    setStep('currencies');
    setSellCurrency(null);
    setBuyCurrency(null);
    setSellAmount('');
    setExchangeRate('');
    setSelectedPaymentMethods([]);
    setPaymentMethodDetails({});
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

  const handleCreateOffer = async () => {
    if (!sellCurrency || !buyCurrency) return;
    
    console.log('🚀 [CreateFXOffer] Starting offer creation...');
    console.log('🚀 [CreateFXOffer] Sell currency:', sellCurrency);
    console.log('🚀 [CreateFXOffer] Buy currency:', buyCurrency);
    console.log('🚀 [CreateFXOffer] Payment method details:', paymentMethodDetails);
    
    setIsCreating(true);

    try {
      // Prepare bank details from payment method details
      let bankDetails = null;
      if (selectedPaymentMethods.some(m => m.id === 'bank') && paymentMethodDetails.bank) {
        bankDetails = paymentMethodDetails.bank;
        console.log('✅ [CreateFXOffer] Including bank details in payload:', bankDetails);
      } else {
        console.log('❌ [CreateFXOffer] No bank details to include');
      }

      // Prepare Alipay details from payment method details
      let alipayDetails = null;
      if (selectedPaymentMethods.some(m => m.id === 'alipay') && paymentMethodDetails.alipay) {
        alipayDetails = paymentMethodDetails.alipay;
        console.log('✅ [CreateFXOffer] Including Alipay details in payload:', alipayDetails);
      } else {
        console.log('❌ [CreateFXOffer] No Alipay details to include');
      }

      // Prepare payload for backend API
      const offerPayload = {
        fromCurrency: sellCurrency.code,
        toCurrency: buyCurrency.code,
        exchangeRate: parseFloat(exchangeRate),
        minAmount: parseFloat(minTrade),
        maxAmount: parseFloat(maxTrade),
        availableAmount: parseFloat(sellAmount),
        paymentMethods: selectedPaymentMethods.map(m => m.id),
        bankDetails,
        alipayDetails,
        terms: {
          paymentWindow: parseInt(paymentWindow),
          instructions: terms,
          requiresVerification: kycRequired
        }
      };

      console.log('🚀 [CreateFXOffer] Final payload:', JSON.stringify(offerPayload, null, 2));

      // Call backend API through FX service
      const response = await fxService.createOffer(offerPayload);
      console.log('🚀 [CreateFXOffer] Backend response:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('✅ [CreateFXOffer] Offer created successfully:', response.data);
        
        // Transform backend response to frontend format for callback
        const createdOffer: Partial<FXOffer> = {
          id: response.data.offer._id,
          sellCurrency,
          buyCurrency,
          sellAmount: parseFloat(sellAmount),
          buyAmount: parseFloat(sellAmount) * parseFloat(exchangeRate),
          exchangeRate: parseFloat(exchangeRate),
          paymentMethods: selectedPaymentMethods,
          paymentWindow: parseInt(paymentWindow),
          minTrade: parseFloat(minTrade),
          maxTrade: parseFloat(maxTrade),
          availableAmount: parseFloat(sellAmount),
          terms,
          kycRequired,
          status: 'active',
          createdAt: new Date(response.data.offer.createdAt),
        };

        console.log('✅ [CreateFXOffer] Transformed offer for callback:', JSON.stringify(createdOffer, null, 2));
        onOfferCreated(createdOffer);
        handleClose();
        Alert.alert('Success', 'Your FX offer has been created and is now live!');
      } else {
        console.error('❌ [CreateFXOffer] Failed to create offer:', response.error);
        Alert.alert('Error', response.error || 'Failed to create offer. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error creating FX offer:', error);
      Alert.alert('Error', 'Failed to create offer. Please check your connection and try again.');
    } finally {
      setIsCreating(false);
    }
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
      <TouchableOpacity 
        onPress={() => setDebugMode(!debugMode)}
        style={styles.debugButton}
      >
        <MaterialIcons 
           name="bug-report" 
           size={20} 
           color={debugMode ? Colors.primary : Colors.gray400} 
         />
      </TouchableOpacity>
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
      
      {PAYMENT_METHODS.map((method) => {
        const isSelected = selectedPaymentMethods.some(m => m.id === method.id);
        
        return (
          <View key={method.id}>
            <TouchableOpacity
              style={[
                styles.paymentMethodCard,
                isSelected && styles.selectedPaymentMethod
              ]}
              onPress={() => {
                if (isSelected) {
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
                {isSelected && (
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                )}
              </View>
              <Typography variant="caption" color="textSecondary">
                {method.processingTime} • {method.limits.min} - {method.limits.max} limit
              </Typography>
            </TouchableOpacity>
            
            {/* Sliding input section for selected payment method */}
            {isSelected && (
              <View style={styles.paymentDetailsSection}>
                {method.id === 'alipay' && (
                  <View>
                    <View style={styles.sectionHeader}>
                      <Typography variant="h6" style={styles.detailsSectionTitle}>
                        Alipay Details
                      </Typography>
                      {merchantAlipayDetails && (
                        <View style={styles.autoFilledBadge}>
                          <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                          <Typography variant="caption" style={styles.autoFilledText}>
                            Auto-filled
                          </Typography>
                        </View>
                      )}
                    </View>
                    <View style={styles.inputGroup}>
                      <Typography variant="body2" style={styles.inputLabel}>
                        Account Name
                      </Typography>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your Alipay account name"
                        value={paymentMethodDetails.alipay?.accountName || ''}
                         onChangeText={(text) => 
                           setPaymentMethodDetails(prev => ({
                             ...prev,
                             alipay: { 
                               accountName: text, 
                               phoneNumber: prev.alipay?.phoneNumber || '' 
                             }
                           }))
                         }
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Typography variant="body2" style={styles.inputLabel}>
                        Phone Number
                      </Typography>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your phone number"
                        value={paymentMethodDetails.alipay?.phoneNumber || ''}
                         onChangeText={(text) => 
                           setPaymentMethodDetails(prev => ({
                             ...prev,
                             alipay: { 
                               accountName: prev.alipay?.accountName || '', 
                               phoneNumber: text 
                             }
                           }))
                         }
                         keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                )}
                
                {method.id === 'wechat' && (
                  <View>
                    <Typography variant="h6" style={styles.detailsSectionTitle}>
                      WeChat Selected
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      No additional details required for WeChat payments.
                    </Typography>
                  </View>
                )}
                
                {method.id === 'bank' && (
                  <View>
                    <View style={styles.sectionHeader}>
                      <Typography variant="h6" style={styles.detailsSectionTitle}>
                        Bank Account Details
                      </Typography>
                      {merchantBankDetails && (
                        <View style={styles.autoFilledBadge}>
                          <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                          <Typography variant="caption" style={styles.autoFilledText}>
                            Auto-filled
                          </Typography>
                        </View>
                      )}
                    </View>
                    <View style={styles.inputGroup}>
                      <Typography variant="body2" style={styles.inputLabel}>
                        Bank Name
                      </Typography>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter bank name"
                        value={paymentMethodDetails.bank?.bankName || ''}
                        onChangeText={(text) => 
                          setPaymentMethodDetails(prev => ({
                            ...prev,
                            bank: { 
                              bankName: text,
                              accountName: prev.bank?.accountName || '',
                              accountNumber: prev.bank?.accountNumber || ''
                            }
                          }))
                        }
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Typography variant="body2" style={styles.inputLabel}>
                        Account Name
                      </Typography>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter account holder name"
                        value={paymentMethodDetails.bank?.accountName || ''}
                        onChangeText={(text) => 
                          setPaymentMethodDetails(prev => ({
                            ...prev,
                            bank: { 
                              bankName: prev.bank?.bankName || '',
                              accountName: text,
                              accountNumber: prev.bank?.accountNumber || ''
                            }
                          }))
                        }
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Typography variant="body2" style={styles.inputLabel}>
                        Account Number
                      </Typography>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter account number"
                        value={paymentMethodDetails.bank?.accountNumber || ''}
                        onChangeText={(text) => 
                          setPaymentMethodDetails(prev => ({
                            ...prev,
                            bank: { 
                              bankName: prev.bank?.bankName || '',
                              accountName: prev.bank?.accountName || '',
                              accountNumber: text
                            }
                          }))
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
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

  const renderDebugPanel = () => {
    if (!debugMode) return null;
    
    return (
      <Card style={styles.debugPanel}>
        <Typography variant="h6" style={styles.debugTitle}>Debug Information</Typography>
        <ScrollView style={styles.debugContent} showsVerticalScrollIndicator={false}>
          <Typography variant="body2" style={styles.debugLabel}>Current Step:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{step}</Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>Sell Currency:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{sellCurrency?.code || 'None'}</Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>Buy Currency:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{buyCurrency?.code || 'None'}</Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>Sell Amount:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{sellAmount || 'None'}</Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>Buy Amount:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{buyAmount || 'None'}</Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>Exchange Rate:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{exchangeRate || 'None'}</Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>Selected Payment Method:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{selectedPaymentMethods[0]?.name || 'None'}</Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>Payment Method Details:</Typography>
          <Typography variant="body2" style={styles.debugValue}>
            {JSON.stringify(paymentMethodDetails, null, 2)}
          </Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>Terms:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{terms || 'None'}</Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>Min Trade:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{minTrade || 'None'}</Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>Max Trade:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{maxTrade || 'None'}</Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>KYC Required:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{kycRequired ? 'Yes' : 'No'}</Typography>
          
          <Typography variant="body2" style={styles.debugLabel}>Can Proceed:</Typography>
          <Typography variant="body2" style={styles.debugValue}>{canProceed() ? 'Yes' : 'No'}</Typography>
        </ScrollView>
      </Card>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        
        {renderStepContent()}
        
        {renderDebugPanel()}
        
        <View style={styles.footer}>
          <Button
            title={step === 'review' ? (isCreating ? 'Creating...' : 'Create Offer') : 'Continue'}
            onPress={handleNext}
            disabled={!canProceed() || isCreating}
            style={styles.continueButton}
          />
          {isCreating && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Typography variant="caption" color="textSecondary" style={styles.loadingText}>
                Creating your offer...
              </Typography>
            </View>
          )}
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
  debugButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
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
    color: Colors.gray400,
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
  // Bank details styles
  savedAccountCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
    marginBottom: Spacing.sm,
  },
  savedAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  savedAccountName: {
    marginLeft: Spacing.sm,
    fontWeight: '500',
    flex: 1,
  },
  currencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  paymentDetailsSection: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  detailsSectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  debugPanel: {
    margin: Spacing.lg,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  debugTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  debugContent: {
    maxHeight: 200,
  },
  debugLabel: {
    fontWeight: '600',
    marginTop: Spacing.sm,
    color: Colors.gray600,
  },
  debugValue: {
    marginBottom: Spacing.xs,
    fontFamily: 'monospace',
    color: Colors.gray800,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  loadingText: {
    marginLeft: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  autoFilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  autoFilledText: {
    marginLeft: Spacing.xs,
    color: Colors.success,
    fontWeight: '600',
  },
});