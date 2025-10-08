import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Avatar } from './Avatar';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import aptosService from '../../services/aptosService';
import { useBalance } from '../../hooks/useBalance';

interface ChatUserProfile {
  id: string;
  name: string;
  avatar?: string;
}

interface WalletOption {
  id: string;
  name: string;
  balance: number;
  currency: string;
  icon: string;
  type: 'fiat' | 'crypto' | 'property';
}

interface TransferConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  recipient: ChatUserProfile;
  amount: string;
  note: string;
  onConfirm: (walletId: string) => void;
  onBack: () => void;
}

export const TransferConfirmationModal: React.FC<TransferConfirmationModalProps> = ({
  visible,
  onClose,
  recipient,
  amount,
  note,
  onConfirm,
  onBack,
}) => {
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aptosBalances, setAptosBalances] = useState<Record<string, string>>({});

  // Use real wallet balances
  const { balances: Balances, isLoading: Loading } = useBalance();

  // Fetch Aptos balances
  useEffect(() => {
    const fetchAptosBalances = async () => {
      try {
        // Get wallet first
        const walletResult = await aptosService.getWallet();
        if (walletResult.success && walletResult.address) {
          const balanceResult = await aptosService.getAllBalances(walletResult.address);
          if (balanceResult.success && balanceResult.balances) {
            setAptosBalances(balanceResult.balances);
          }
        }
      } catch (error) {
        console.error('Failed to fetch Aptos balances:', error);
      }
    };

    if (visible) {
      fetchAptosBalances();
    }
  }, [visible]);

  // Real wallet options based on actual balances
  const walletOptions: WalletOption[] = [
    {
      id: 'usdc_aptos',
      name: 'USDC (Aptos)',
      balance: parseFloat(aptosBalances['USDC'] || '0'),
      currency: 'USDC',
      icon: 'monetization-on',
      type: 'crypto',
    },
    {
      id: 'apt_native',
      name: 'APT',
      balance: parseFloat(aptosBalances['APT'] || '0'),
      currency: 'APT',
      icon: 'currency-bitcoin',
      type: 'crypto',
    },
    // Include  USDC if available
    ...(Balances?.usdc ? [{
      id: 'usdc_',
      name: 'USDC ()',
      balance: parseFloat(Balances.usdc.amount || '0'),
      currency: 'USDC',
      icon: 'account-balance-wallet',
      type: 'crypto' as const,
    }] : []),
  ];

  useEffect(() => {
    // Set default wallet (first one with sufficient balance)
    const defaultWallet = walletOptions.find(wallet => 
      wallet.balance >= parseFloat(amount || '0')
    ) || walletOptions[0];
    setSelectedWallet(defaultWallet);
  }, [amount, visible]);

  const handleClose = () => {
    setIsProcessing(false);
    setShowWalletPicker(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (!selectedWallet) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (selectedWallet.balance < parseFloat(amount)) {
      Alert.alert('Insufficient Funds', `Your ${selectedWallet.name} balance is insufficient for this transfer.`);
      return;
    }

    setIsProcessing(true);
    
    try {
      onConfirm(selectedWallet.id);
    } catch (error) {
      Alert.alert('Transfer Failed', 'Unable to process transfer. Please try again.');
      setIsProcessing(false);
    }
  };

  const formatBalance = (balance: number, currency: string) => {
    if (currency === 'USDC') {
      return `${balance.toFixed(2)} ${currency}`;
    }
    if (currency === 'APT') {
      return `${balance.toFixed(4)} ${currency}`;
    }
    if (currency === 'NGN') {
      return `₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    }
    return `${balance.toFixed(4)} ${currency}`;
  };

  const formatAmount = (amount: string, selectedWallet?: WalletOption) => {
    const amountNum = parseFloat(amount);
    
    // Show amounts in crypto directly (no NGN conversion)
    if (selectedWallet?.currency === 'USDC') {
      return `${amountNum.toFixed(2)} USDC`;
    } else if (selectedWallet?.currency === 'APT') {
      return `${amountNum.toFixed(4)} APT`;
    }
    
    // Default format
    return `${amountNum.toFixed(2)}`;
  };

  const hasInsufficientFunds = useMemo(() => {
    if (!selectedWallet || !amount) return false;
    
    const cryptoAmount = parseFloat(amount);
    return selectedWallet.balance < cryptoAmount;
  }, [selectedWallet, amount]);

  const renderWalletOption = (wallet: WalletOption) => (
    <TouchableOpacity
      key={wallet.id}
      style={[
        styles.walletOption,
        selectedWallet?.id === wallet.id && styles.selectedWalletOption
      ]}
      onPress={() => {
        setSelectedWallet(wallet);
        setShowWalletPicker(false);
      }}
    >
      <View style={styles.walletInfo}>
        <MaterialIcons 
          name={wallet.icon as any} 
          size={24} 
          color={ChatTheme.sendBubbleBackground} 
        />
        <View style={styles.walletDetails}>
          <Typography variant="h6" style={styles.walletName}>
            {wallet.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {formatBalance(wallet.balance, wallet.currency)}
          </Typography>
        </View>
      </View>
      {selectedWallet?.id === wallet.id && (
        <MaterialIcons name="check" size={20} color={ChatTheme.sendBubbleBackground} />
      )}
    </TouchableOpacity>
  );

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
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={ChatTheme.textPrimary} />
          </TouchableOpacity>
          <Typography variant="h3" style={styles.title}>Confirm Transfer</Typography>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={ChatTheme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Transfer Summary */}
          <Card style={styles.summaryCard}>
            <View style={styles.recipientRow}>
              <Avatar 
                name={recipient.name} 
                imageUrl={recipient.avatar} 
                size="medium"
                online={false}
              />
              <View style={styles.recipientInfo}>
                <Typography variant="h5" style={styles.recipientName}>
                  {`Transfer to ${recipient.name}`}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {`ID: ${recipient.id.slice(-8)}`}
                </Typography>
              </View>
            </View>

            <View style={styles.amountRow}>
              <Typography variant="h2" style={styles.transferAmount}>
                {formatAmount(amount, selectedWallet)}
              </Typography>
            </View>

            {note && (
              <View style={styles.noteRow}>
                <Typography variant="body2" color="textSecondary" style={styles.noteLabel}>
                  Note
                </Typography>
                <Typography variant="body1" style={styles.noteText}>
                  {note}
                </Typography>
              </View>
            )}
          </Card>

          {/* Payment Method */}
          <View style={styles.paymentSection}>
            <Typography variant="h5" style={styles.sectionTitle}>
              Payment Method
            </Typography>
            
            <Card style={styles.paymentMethodCard}>
              {selectedWallet ? (
                <TouchableOpacity
                  style={styles.selectedPaymentMethod}
                  onPress={() => setShowWalletPicker(true)}
                >
                  <View style={styles.walletInfo}>
                    <MaterialIcons 
                      name={selectedWallet.icon as any} 
                      size={24} 
                      color={ChatTheme.sendBubbleBackground} 
                    />
                    <View style={styles.walletDetails}>
                      <Typography variant="h6" style={styles.walletName}>
                        {selectedWallet.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color={hasInsufficientFunds ? "error" : "textSecondary"}
                      >
                        {`Balance: ${formatBalance(selectedWallet.balance, selectedWallet.currency)}`}
                      </Typography>
                    </View>
                  </View>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color={ChatTheme.textSecondary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.selectPaymentMethod}
                  onPress={() => setShowWalletPicker(true)}
                >
                  <Typography variant="body1" color="textSecondary">
                    Select payment method
                  </Typography>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color={ChatTheme.textSecondary} />
                </TouchableOpacity>
              )}
            </Card>

            {/* Wallet Options */}
            {showWalletPicker && (
              <Card style={styles.walletPickerCard}>
                <Typography variant="h6" style={styles.walletPickerTitle}>
                  Choose Wallet
                </Typography>
                {walletOptions.map(renderWalletOption)}
              </Card>
            )}

            {hasInsufficientFunds && (
              <View style={styles.warningContainer}>
                <MaterialIcons name="warning" size={20} color={ChatTheme.error} />
                <Typography variant="body2" color="error" style={styles.warningText}>
                  Insufficient balance in selected wallet
                </Typography>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={isProcessing ? "Processing..." : "Send Money"}
            onPress={handleConfirm}
            disabled={!selectedWallet || hasInsufficientFunds || isProcessing}
            style={[
              styles.confirmButton,
              hasInsufficientFunds && styles.disabledButton
            ]}
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
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    color: ChatTheme.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: ChatSpacing.lg,
  },
  summaryCard: {
    marginVertical: ChatSpacing.lg,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ChatSpacing.lg,
  },
  recipientInfo: {
    marginLeft: ChatSpacing.md,
    flex: 1,
  },
  recipientName: {
    fontWeight: '600',
    color: ChatTheme.textPrimary,
    marginBottom: ChatSpacing.xs,
  },
  amountRow: {
    alignItems: 'center',
    marginBottom: ChatSpacing.md,
  },
  transferAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: ChatTheme.sendBubbleBackground,
  },
  noteRow: {
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
    paddingTop: ChatSpacing.md,
  },
  noteLabel: {
    marginBottom: ChatSpacing.xs,
  },
  noteText: {
    fontStyle: 'italic',
  },
  paymentSection: {
    marginBottom: ChatSpacing.xl,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: ChatSpacing.md,
    color: ChatTheme.textPrimary,
  },
  paymentMethodCard: {
    marginBottom: ChatSpacing.md,
  },
  selectedPaymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ChatSpacing.sm,
  },
  selectPaymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ChatSpacing.lg,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletDetails: {
    marginLeft: ChatSpacing.md,
  },
  walletName: {
    fontWeight: '600',
    color: ChatTheme.textPrimary,
  },
  walletPickerCard: {
    marginBottom: ChatSpacing.md,
  },
  walletPickerTitle: {
    fontWeight: '600',
    marginBottom: ChatSpacing.md,
    color: ChatTheme.textPrimary,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ChatSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  selectedWalletOption: {
    backgroundColor: ChatTheme.background3,
    borderRadius: 8,
    paddingHorizontal: ChatSpacing.sm,
    borderBottomWidth: 0,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ChatTheme.error}10`,
    padding: ChatSpacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${ChatTheme.error}30`,
  },
  warningText: {
    marginLeft: ChatSpacing.sm,
    flex: 1,
  },
  footer: {
    paddingHorizontal: ChatSpacing.lg,
    paddingVertical: ChatSpacing.lg,
    backgroundColor: ChatTheme.background1,
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
  },
  confirmButton: {
    paddingVertical: ChatSpacing.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
});