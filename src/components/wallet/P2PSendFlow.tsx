import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { RecipientPicker } from './RecipientPicker';
import Service from '../../services/Service';
import baseService from '../../services/baseService';
import { HederaBalanceService } from './HederaBalanceService';
import { apiService } from '../../services/api';
import paymentRequestService from '../../services/paymentRequestService';
import { PaymentRequest } from '../../types';

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
  network?: 'base' | 'ethereum' | 'hedera';
}


interface P2PSendFlowProps {
  visible: boolean;
  onClose: () => void;
  onSendComplete: (amount: number, token: Token, recipient: Contact) => void;
  initialRecipient?: Contact;
  currentUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  requestContext?: PaymentRequest | null;
  onPaymentRequestCompleted?: (request: PaymentRequest) => void;
}

export const P2PSendFlow: React.FC<P2PSendFlowProps> = ({
  visible,
  onClose,
  onSendComplete,
  initialRecipient,
  currentUser,
  requestContext,
  onPaymentRequestCompleted,
}) => {
  const [step, setStep] = useState<'recipient' | 'amount' | 'review' | 'processing'>('recipient');
  const [selectedRecipient, setSelectedRecipient] = useState<Contact | null>(initialRecipient || null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [lockTimer, setLockTimer] = useState(300); // 5 minutes
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [baseBalances, setBaseBalances] = useState<{[key: string]: string}>({});
  const [hederaBalances, setHederaBalances] = useState<{[key: string]: string}>({});
  const [requestError, setRequestError] = useState<string | null>(null);

  const isPaymentRequestFlow = useMemo(() => !!requestContext, [requestContext]);

  // Fetch real wallet balances when component mounts or when stepping to amount
  const fetchWalletBalances = async () => {
    setIsLoadingBalances(true);
    try {
      // Fetch Base balances
      try {
        const baseBalanceResult = await Service.getCurrentUserBaseBalance();
        if (baseBalanceResult.success) {
          console.log('💰 Real Base wallet balances:', baseBalanceResult);
          setBaseBalances({
            ETH: baseBalanceResult.balance || '0.000000 ETH',
            ETH_FORMATTED: baseBalanceResult.balance || '0.000000 ETH',
            USDC: baseBalanceResult.usdcBalance || '0',
            USDC_FORMATTED: `${baseBalanceResult.usdcBalance || '0'} USDC`
          });
        } else {
          console.warn('⚠️ Base balance fetch failed:', baseBalanceResult.error);
          setBaseBalances({});
        }
      } catch (baseError) {
        console.warn('⚠️ Failed to fetch Base balances:', baseError);
        setBaseBalances({});
      }

      // Fetch Hedera balances
      try {
        const hederaBalanceResult = await HederaBalanceService.getCurrentUserBalance();
        if (hederaBalanceResult.success) {
          console.log('💰 Real Hedera wallet balances:', hederaBalanceResult);
          setHederaBalances({
            HBAR: hederaBalanceResult.hbarBalance || '0',
            HBAR_FORMATTED: HederaBalanceService.formatBalance(hederaBalanceResult.hbarBalance || '0', 'HBAR'),
            USDC: hederaBalanceResult.usdcBalance || '0',
            USDC_FORMATTED: HederaBalanceService.formatBalance(hederaBalanceResult.usdcBalance || '0', 'USDC')
          });
        } else {
          console.warn('⚠️ Hedera balance fetch failed:', hederaBalanceResult.error);
          setHederaBalances({});
        }
      } catch (hederaError) {
        console.warn('⚠️ Failed to fetch Hedera balances:', hederaError);
        setHederaBalances({});
      }
    } catch (error) {
      console.error('❌ Failed to fetch wallet balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Generate tokens list with real balances
  const getTokensWithRealBalances = (): Token[] => {
    // Base token balances 
    const baseEthRaw = baseBalances['ETH'] || '0';
    const baseUsdcRaw = baseBalances['USDC'] || '0';
    
    // Parse ETH balance (remove ' ETH' suffix if present and convert from wei if needed)
    const baseEthBalance = baseEthRaw.includes('ETH') ? parseFloat(baseEthRaw.replace(' ETH', '')) : parseFloat(baseEthRaw) / 1e18;
    
    // Parse USDC balance (Service already returns in decimal format, no conversion needed)
    const baseUsdcBalance = parseFloat(baseUsdcRaw);

    // Hedera token balances
    const hederaHbarRaw = hederaBalances['HBAR'] || '0';
    const hederaUsdcRaw = hederaBalances['USDC'] || '0';
    
    // Parse Hedera balances (already in human-readable format)
    const hederaHbarBalance = HederaBalanceService.parseBalance(hederaHbarRaw);
    const hederaUsdcBalance = HederaBalanceService.parseBalance(hederaUsdcRaw);
    
    console.log('💰 Token balances:', { 
      baseEthRaw, baseUsdcRaw, baseEthBalance, baseUsdcBalance,
      hederaHbarRaw, hederaUsdcRaw, hederaHbarBalance, hederaUsdcBalance 
    });
    
    const allTokens = [
      {
        id: '1',
        symbol: 'ETH',
        name: 'Ethereum (Base)',
        balance: baseEthBalance,
        icon: 'currency-eth',
        type: 'crypto' as const,
        network: 'base' as const
      },
      {
        id: '2',
        symbol: 'USDC',
        name: 'USD Coin (Base)',
        balance: baseUsdcBalance,
        icon: 'attach-money',
        type: 'crypto' as const,
        network: 'base' as const
      },
      {
        id: '3',
        symbol: 'HBAR',
        name: 'Hedera Token',
        balance: hederaHbarBalance,
        icon: 'account-balance-wallet',
        type: 'crypto' as const,
        network: 'hedera' as const
      },
      {
        id: '4',
        symbol: 'USDC',
        name: 'USD Coin (Hedera)',
        balance: hederaUsdcBalance,
        icon: 'attach-money',
        type: 'crypto' as const,
        network: 'hedera' as const
      },
    ];
    
    // Show all tokens, even with 0 balance, but mark which have balance
    return allTokens.filter(token => token.balance >= 0);
  };

  const tokens = useMemo(() => getTokensWithRealBalances(), [baseBalances, hederaBalances]);

  const resolveRequestRecipient = (request: PaymentRequest): Contact | null => {
    const profile = request.creatorProfile;
    if (!profile || !profile.id) {
      return null;
    }

    const targetNetwork = request.network || 'base';
    let address: string | undefined;

    if (targetNetwork === 'hedera') {
      address = profile.hederaAccountId || profile.wallets?.find((wallet) => wallet.chain?.toLowerCase().includes('hedera'))?.address;
    } else if (targetNetwork === 'ethereum') {
      address = profile.wallets?.find((wallet) => wallet.chain?.toLowerCase().includes('ethereum'))?.address || profile.baseWalletAddress;
    } else {
      address = profile.baseWalletAddress || profile.wallets?.find((wallet) => wallet.chain?.toLowerCase().includes('base'))?.address;
    }

    if (!address) {
      return null;
    }

    return {
      id: profile.id,
      name: profile.name || profile.email || 'ilePay user',
      address,
      avatar: undefined,
    };
  };

  const getTokenNetworkForRequest = (request: PaymentRequest): Token['network'] | undefined => {
    const targetNetwork = request.network || 'base';
    if (targetNetwork === 'hedera') {
      return 'hedera';
    }
    return 'base';
  };

  // Fetch balances when modal opens
  useEffect(() => {
    if (visible) {
      fetchWalletBalances();
    }
  }, [visible]);

  // Fetch balances when stepping to amount page
  useEffect(() => {
    if (step === 'amount') {
      fetchWalletBalances();
    }
  }, [step]);

  // Separate effect for request context setup (runs only when context changes)
  useEffect(() => {
    if (!visible || !requestContext) {
      return;
    }

    let nextError: string | null = null;

    const resolvedRecipient = resolveRequestRecipient(requestContext);
    if (resolvedRecipient) {
      setSelectedRecipient(resolvedRecipient);
    } else {
      nextError = 'The sender has not configured a wallet address for this network yet.';
      setSelectedRecipient(null);
    }

    setAmount(requestContext.amount.toFixed(2));
    setMemo(requestContext.note || '');
    setRequestError(nextError);
    setStep('review');
  }, [visible, requestContext]);

  // Separate effect for token matching (runs when tokens are loaded for payment requests)
  useEffect(() => {
    if (!visible || !requestContext || tokens.length === 0) {
      return;
    }

    const tokenNetwork = getTokenNetworkForRequest(requestContext);
    if (tokenNetwork) {
      const matchedToken = tokens.find(
        (token) => token.symbol === requestContext.currency && token.network === tokenNetwork
      );

      if (matchedToken) {
        setSelectedToken(matchedToken);
        setRequestError(null);
      } else {
        setRequestError(`No ${requestContext.currency} balance available on the ${tokenNetwork} network.`);
        setSelectedToken(null);
      }
    }
  }, [visible, requestContext, tokens.length]); // Only depend on tokens.length, not the full tokens array

  // Effect for initial setup when no request context
  useEffect(() => {
    if (!visible || requestContext) {
      return;
    }

    setRequestError(null);
    setSelectedToken(null);
    setAmount('');
    setMemo('');

    if (initialRecipient) {
      setSelectedRecipient(initialRecipient);
      setStep('amount');
    } else {
      setSelectedRecipient(null);
      setStep('recipient');
    }
  }, [visible, requestContext, initialRecipient]);


  const handleReset = () => {
    setStep('recipient');
    setSelectedRecipient(initialRecipient || null);
    setSelectedToken(null);
    setAmount('');
    setMemo('');
    setLoading(false);
    setRequestError(null);
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
    if (isPaymentRequestFlow) {
      setStep('review');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (!selectedToken) {
      Alert.alert('Error', 'Please select a token');
      return;
    }
    
    if (selectedToken.balance === 0) {
      Alert.alert('Error', `You have no ${selectedToken.symbol} balance. Please fund your wallet first.`);
      return;
    }
    
    if (parseFloat(amount) > selectedToken.balance) {
      Alert.alert('Error', `Insufficient balance. You have ${selectedToken.balance.toFixed(4)} ${selectedToken.symbol}`);
      return;
    }
    
    setStep('review');
  };


  const handleSend = async () => {
    if (!selectedRecipient || !selectedToken) return;
    if (!selectedRecipient.address) {
      Alert.alert('Error', 'Recipient wallet address is missing. Please try again later.');
      return;
    }

    if (requestError) {
      Alert.alert('Cannot Send', requestError);
      return;
    }

    console.log('🔗 [P2PSendFlow] DEBUG - handleSend called with:', {
      selectedRecipient: selectedRecipient ? {
        name: selectedRecipient.name,
        address: selectedRecipient.address
      } : 'null',
      selectedToken: selectedToken ? {
        symbol: selectedToken.symbol,
        network: selectedToken.network,
        balance: selectedToken.balance
      } : 'null',
      amount
    });
    
    setLoading(true);
    setStep('processing');
    
    try {
      let result;

      console.log('🔗 [P2PSendFlow] DEBUG - About to check network type:', selectedToken.network);
      
      // Send using appropriate blockchain based on token network
      if (selectedToken.network === 'base') {
        if (selectedToken.symbol === 'ETH') {
          result = await baseService.sendETH(selectedRecipient.address, parseFloat(amount));
        } else if (selectedToken.symbol === 'USDC') {
          result = await baseService.sendUSDC(selectedRecipient.address, parseFloat(amount));
        } else {
          throw new Error(`Unsupported Base token: ${selectedToken.symbol}`);
        }
      } else if (selectedToken.network === 'hedera') {
        if (selectedToken.symbol === 'USDC') {
          // Get recipient's actual Hedera account ID
          console.log('🔗 [P2PSendFlow] DEBUG - Resolving recipient Hedera account for:', selectedRecipient.id);
          
          const token = await AsyncStorage.getItem('authToken');
          if (!token) {
            throw new Error('No auth token available for Hedera transfer');
          }
          
          // Fetch recipient's profile to get their Hedera account
          const profileResponse = await apiService.get(`/api/user/profile/${selectedRecipient.id}`, token);
          
          if (!profileResponse.success || !profileResponse.profile?.hederaAccountId) {
            throw new Error(`Recipient ${selectedRecipient.name} does not have a Hedera account set up`);
          }
          
          const recipientHederaAccount = profileResponse.profile.hederaAccountId;
          console.log('🔗 [P2PSendFlow] DEBUG - Found recipient Hedera account:', recipientHederaAccount);
          
          // Call backend Hedera USDC transfer API
          console.log('🔗 [P2PSendFlow] DEBUG - Making Hedera USDC transfer request:', {
            toAddress: recipientHederaAccount,
            amount: parseFloat(amount),
            memo: memo || `Payment to ${selectedRecipient.name}`
          });
          
          const transferResult = await apiService.post('/api/hedera/transfer-usdc', {
            toAddress: recipientHederaAccount,
            amount: parseFloat(amount),
            memo: memo || `Payment to ${selectedRecipient.name}`
          }, token);
          
          console.log('🔗 [P2PSendFlow] DEBUG - Transfer result:', transferResult);

          if (transferResult.success) {
            result = {
              success: true,
              hash: (transferResult.data as any)?.transactionId || 'unknown',
              transactionId: (transferResult.data as any)?.transactionId || 'unknown'
            };
          } else {
            throw new Error(transferResult.error || 'Hedera USDC transfer failed');
          }
        } else if (selectedToken.symbol === 'HBAR') {
          // HBAR transfers not implemented yet
          throw new Error('HBAR transfers not yet supported');
        } else {
          throw new Error(`Unsupported Hedera token: ${selectedToken.symbol}`);
        }
      } else {
        throw new Error(`Unsupported network: ${selectedToken.network}`);
      }

      if (result.success) {
        setLoading(false);
        if (requestContext) {
          try {
            const completionTxId = result.hash || result.transactionHash || result.transactionId;
            const completionResponse = await paymentRequestService.completeRequest(requestContext.id, {
              transactionId: completionTxId,
              metadata: memo ? { memo } : undefined,
            });

            if (completionResponse.success && completionResponse.data?.request) {
              onPaymentRequestCompleted?.(completionResponse.data.request);
            }
          } catch (completionError) {
            console.error('Failed to mark payment request as completed:', completionError);
          }
        }
        onSendComplete(parseFloat(amount), selectedToken, selectedRecipient);
        handleClose();
        Alert.alert(
          'Success', 
          `Sent ${amount} ${selectedToken.symbol} to ${selectedRecipient.name}\nTransaction: ${result.hash || result.transactionHash || result.transactionId}\n${requestContext ? 'Payment request marked as paid.' : ''}`.trim(),
          [{ text: 'OK', onPress: () => {} }]
        );
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Send transaction error:', error);
      setLoading(false);
      setStep('review'); // Go back to review step
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send payment. Please try again.';
      
      // Check if this is a network-specific issue
      if (errorMessage.includes('Insufficient') && errorMessage.includes('gas')) {
        Alert.alert(
          'Insufficient Gas Fees', 
          errorMessage,
          [
            { text: 'OK', onPress: () => {} },
            { 
              text: 'Info', 
              onPress: () => {
                Alert.alert(
                  'Gas Fees Required', 
                  'You need sufficient network tokens (ETH for Base, HBAR for Hedera) to pay for transaction fees.',
                  [{ text: 'Got it!', onPress: () => {} }]
                );
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Transaction Failed', 
          errorMessage,
          [{ text: 'OK', onPress: () => {} }]
        );
      }
    }
  };

  // Helper function to map token to blockchain
  const getChainForToken = (tokenSymbol: string): string => {
    switch (tokenSymbol.toUpperCase()) {
      case 'BTC':
        return 'bitcoin';
      case 'ETH':
      case 'USDC':
      case 'USDT':
        return 'ethereum';
      case 'SOL':
        return 'solana';
      default:
        return 'ethereum'; // Default to ethereum
    }
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
          {isPaymentRequestFlow && requestContext ? (
            <Typography variant="body2" color="textSecondary" style={styles.infoText}>
              Required: {requestContext.currency} on the {getTokenNetworkForRequest(requestContext)} network.
            </Typography>
          ) : null}
          {isLoadingBalances ? (
            <View style={styles.loadingContainer}>
              <Typography variant="body2" color="textSecondary">Loading balances...</Typography>
            </View>
          ) : tokens.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Typography variant="body2" color="textSecondary">No tokens with balance found</Typography>
                <Typography variant="body2" color="textSecondary">Please fund your wallet first</Typography>
              </View>
            ) : (
              tokens.map((token) => (
                <TouchableOpacity
                  key={token.id}
                  style={[
                    styles.tokenItem,
                    selectedToken?.id === token.id && styles.selectedTokenItem
                  ]}
                  onPress={() => {
                    if (!isPaymentRequestFlow) {
                      setSelectedToken(token);
                    }
                  }}
                  disabled={isPaymentRequestFlow}
                >
                  <View style={styles.tokenInfo}>
                    <MaterialIcons name={token.icon as any} size={24} color={Colors.primary} />
                    <View style={styles.tokenDetails}>
                      <Typography variant="h6">{token.symbol}</Typography>
                      <Typography variant="body2" color="textSecondary">{token.name}</Typography>
                    </View>
                  </View>
                  <View style={styles.tokenBalance}>
                    <Typography variant="h6">{token.balance.toFixed(4)} {token.symbol}</Typography>
                    {token.balance === 0 && (
                      <Typography variant="body2" color="textSecondary">(No balance)</Typography>
                    )}
                    {selectedToken?.id === token.id && (
                      <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
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
              editable={!isPaymentRequestFlow}
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
          {/* Debug info */}
          {__DEV__ && (
            <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
              Debug: amount="{amount}" selectedToken={selectedToken ? selectedToken.symbol : 'null'}
            </Typography>
          )}
        </View>
      </View>
    );
  };


  const renderReviewStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('amount')} style={styles.backButton}>
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
            <Typography variant="h6">{currentUser?.name || 'Your Account'}</Typography>
          </View>
          <View style={styles.reviewRow}>
            <Typography variant="body1" color="textSecondary">Network Fee:</Typography>
            <Typography variant="h6">
              {selectedToken?.network === 'base' ? '~0.001 ETH' : 
               selectedToken?.network === 'hedera' ? '~0.001 HBAR' : 
               '~0.001 ETH'}
            </Typography>
          </View>
          {/* Network-specific balance warnings */}
          {selectedToken?.network === 'base' && baseBalances.ETH && parseFloat(baseBalances.ETH.replace(' ETH', '')) < 0.001 && (
            <View style={[styles.reviewRow, { backgroundColor: Colors.error + '10', padding: Spacing.sm, borderRadius: BorderRadius.sm }]}>
              <MaterialIcons name="warning" size={20} color={Colors.error} />
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <Typography variant="body2" style={{ color: Colors.error }}>
                  Low ETH balance ({baseBalances.ETH}). You may need ETH for gas fees.
                </Typography>
              </View>
            </View>
          )}
          {selectedToken?.network === 'hedera' && hederaBalances.HBAR && parseFloat(hederaBalances.HBAR) < 0.001 && (
            <View style={[styles.reviewRow, { backgroundColor: Colors.error + '10', padding: Spacing.sm, borderRadius: BorderRadius.sm }]}>
              <MaterialIcons name="warning" size={20} color={Colors.error} />
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <Typography variant="body2" style={{ color: Colors.error }}>
                  Low HBAR balance ({hederaBalances.HBAR_FORMATTED}). You may need HBAR for gas fees.
                </Typography>
              </View>
            </View>
          )}
        </Card>

        {requestError ? (
          <View style={styles.warningBox}>
            <MaterialIcons name="warning" size={20} color={Colors.error} />
            <Typography variant="body2" style={styles.warningText}>
              {requestError}
            </Typography>
          </View>
        ) : null}

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
          disabled={!!requestError}
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  warningText: {
    color: Colors.error,
    flex: 1,
  },
  infoText: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
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
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
  },
  emptyContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
  },
});
