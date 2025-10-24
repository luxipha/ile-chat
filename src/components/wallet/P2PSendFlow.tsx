import React, { useState, useEffect } from 'react';
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
import Service from '../../services/Service';
// aptosService removed - using Circle/Hedera instead
import baseService from '../../services/baseService';

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
  network?: 'aptos' | 'base' | 'ethereum';
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
}

export const P2PSendFlow: React.FC<P2PSendFlowProps> = ({
  visible,
  onClose,
  onSendComplete,
  initialRecipient,
  currentUser,
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
  const [realBalances, setRealBalances] = useState<{[key: string]: string}>({});
  const [aptBalance, setAptBalance] = useState<number>(0);
  const [baseBalances, setBaseBalances] = useState<{[key: string]: string}>({});

  // Fetch real wallet balances when component mounts or when stepping to amount
  const fetchWalletBalances = async () => {
    setIsLoadingBalances(true);
    try {
      // Aptos service removed - set empty balances
      setRealBalances({});
      setAptBalance(0);

      // Fetch Base balances using the corrected Service method
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
        // Set empty Base balances if error
        setBaseBalances({});
      }
    } catch (error) {
      console.error('❌ Failed to fetch wallet balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Generate tokens list with real balances
  const getTokensWithRealBalances = (): Token[] => {
    // Aptos token balances
    const aptRaw = realBalances['APT'] || '0';
    const usdcRaw = realBalances['USDC'] || '0';
    
    // Convert APT from octas to human readable (1 APT = 100,000,000 octas)
    const aptBalance = parseFloat(aptRaw) / 100_000_000;
    const usdcBalance = parseFloat(usdcRaw);
    
    // Base token balances 
    const baseEthRaw = baseBalances['ETH'] || '0';
    const baseUsdcRaw = baseBalances['USDC'] || '0';
    
    // Parse ETH balance (remove ' ETH' suffix if present and convert from wei if needed)
    const baseEthBalance = baseEthRaw.includes('ETH') ? parseFloat(baseEthRaw.replace(' ETH', '')) : parseFloat(baseEthRaw) / 1e18;
    
    // Parse USDC balance (Service already returns in decimal format, no conversion needed)
    const baseUsdcBalance = parseFloat(baseUsdcRaw);
    
    console.log('💰 Token balances:', { 
      aptRaw, usdcRaw, aptBalance, usdcBalance,
      baseEthRaw, baseUsdcRaw, baseEthBalance, baseUsdcBalance 
    });
    
    const allTokens = [
      {
        id: '1',
        symbol: 'APT',
        name: 'Aptos Token',
        balance: aptBalance,
        icon: 'currency-bitcoin',
        type: 'crypto',
        network: 'aptos'
      },
      {
        id: '2',
        symbol: 'USDC',
        name: 'USD Coin (Aptos)',
        balance: usdcBalance,
        icon: 'attach-money',
        type: 'crypto',
        network: 'aptos'
      },
      {
        id: '3',
        symbol: 'ETH',
        name: 'Ethereum (Base)',
        balance: baseEthBalance,
        icon: 'currency-eth',
        type: 'crypto',
        network: 'base'
      },
      {
        id: '4',
        symbol: 'USDC',
        name: 'USD Coin (Base)',
        balance: baseUsdcBalance,
        icon: 'attach-money',
        type: 'crypto',
        network: 'base'
      },
    ];
    
    // Show all tokens, even with 0 balance, but mark which have balance
    return allTokens.filter(token => token.balance >= 0);
  };

  const tokens = getTokensWithRealBalances();

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


  const handleReset = () => {
    setStep('recipient');
    setSelectedRecipient(initialRecipient || null);
    setSelectedToken(null);
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
    
    setLoading(true);
    setStep('processing');
    
    try {
      let result;
      
      if (!selectedRecipient.address) {
        throw new Error('Recipient address is required for transactions');
      }
      
      // Send using appropriate blockchain based on token network
      if (selectedToken.network === 'aptos') {
        // Aptos service removed
        throw new Error('Aptos transfers temporarily unavailable - support removed');
      } else if (selectedToken.network === 'base') {
        if (selectedToken.symbol === 'ETH') {
          result = await baseService.sendETH(selectedRecipient.address, parseFloat(amount));
        } else if (selectedToken.symbol === 'USDC') {
          result = await baseService.sendUSDC(selectedRecipient.address, parseFloat(amount));
        } else {
          throw new Error(`Unsupported Base token: ${selectedToken.symbol}`);
        }
      } else {
        throw new Error(`Unsupported network: ${selectedToken.network}`);
      }

      if (result.success) {
        setLoading(false);
        onSendComplete(parseFloat(amount), selectedToken, selectedRecipient);
        handleClose();
        Alert.alert(
          'Success', 
          `Sent ${amount} ${selectedToken.symbol} to ${selectedRecipient.name}\nTransaction: ${result.hash}`,
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
      
      // Check if this is an APT funding issue
      if (errorMessage.includes('Insufficient APT') && errorMessage.includes('https://aptos.dev/network/faucet')) {
        Alert.alert(
          'Need APT for Gas Fees', 
          errorMessage,
          [
            { text: 'OK', onPress: () => {} },
            { 
              text: 'Info', 
              onPress: () => {
                Alert.alert(
                  'Aptos Support Removed', 
                  'Aptos transfers are no longer supported. Please use Base USDC or ETH instead.',
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
            <Typography variant="h6">~0.001 APT</Typography>
          </View>
          {aptBalance < 0.001 && (
            <View style={[styles.reviewRow, { backgroundColor: Colors.error + '10', padding: Spacing.sm, borderRadius: BorderRadius.sm }]}>
              <MaterialIcons name="warning" size={20} color={Colors.error} />
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <Typography variant="body2" style={{ color: Colors.error }}>
                  Low APT balance ({aptBalance.toFixed(6)} APT). You may need to fund your account for gas fees.
                </Typography>
              </View>
            </View>
          )}
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