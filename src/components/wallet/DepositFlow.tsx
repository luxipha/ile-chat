import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Clipboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import QRCode from 'react-native-qrcode-svg';
import crossmintService from '../../services/crossmintService';

interface DepositFlowProps {
  visible: boolean;
  onClose: () => void;
}

type DepositStep = 'method' | 'address';
type CryptoToken = 'BTC' | 'ETH';

const CRYPTO_OPTIONS = [
  { 
    symbol: 'BTC' as CryptoToken, 
    name: 'Bitcoin', 
    icon: 'account-balance-wallet',
    chain: 'bitcoin'
  },
  { 
    symbol: 'ETH' as CryptoToken, 
    name: 'Ethereum', 
    icon: 'account-balance-wallet',
    chain: 'ethereum',
    description: 'ETH & ERC-20 tokens (USDC, USDT, etc.)'
  },
];

export const DepositFlow: React.FC<DepositFlowProps> = ({
  visible,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<DepositStep>('method');
  const [selectedToken, setSelectedToken] = useState<CryptoToken | null>(null);
  const [walletAddresses, setWalletAddresses] = useState<{[key: string]: string}>({});
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  
  const resetFlow = () => {
    setCurrentStep('method');
    setSelectedToken(null);
  };

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  const handleTokenSelect = async (token: CryptoToken) => {
    setSelectedToken(token);
    setCurrentStep('address');
    
    // Load wallet address for the selected token's chain
    const tokenData = CRYPTO_OPTIONS.find(opt => opt.symbol === token);
    if (tokenData && !walletAddresses[tokenData.chain]) {
      setIsLoadingAddress(true);
      try {
        const walletStatus = await crossmintService.getWalletStatus();
        if (walletStatus.success && walletStatus.wallet) {
          const chainData = walletStatus.wallet.chains.find(c => c.chain === tokenData.chain);
          if (chainData) {
            setWalletAddresses(prev => ({
              ...prev,
              [tokenData.chain]: chainData.address
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load wallet address:', error);
      } finally {
        setIsLoadingAddress(false);
      }
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await Clipboard.setString(address);
      Alert.alert('Copied!', 'Address copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address');
    }
  };

  const selectedTokenData = CRYPTO_OPTIONS.find(option => option.symbol === selectedToken);
  const currentAddress = selectedTokenData ? walletAddresses[selectedTokenData.chain] : null;

  const renderMethodSelection = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h5" style={styles.stepTitle}>
        How would you like to deposit?
      </Typography>
      
      <View style={styles.methodOptions}>
        {CRYPTO_OPTIONS.map((crypto) => (
          <TouchableOpacity
            key={crypto.symbol}
            style={styles.methodOption}
            onPress={() => handleTokenSelect(crypto.symbol)}
          >
            <MaterialIcons name={crypto.icon as any} size={32} color={Colors.primary} />
            <Typography variant="h6" style={styles.methodTitle}>
              {crypto.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" style={styles.methodDescription}>
              {crypto.description || crypto.symbol}
            </Typography>
            <View style={styles.methodBadge}>
              <Typography variant="caption" style={styles.methodBadgeText}>
                Instant
              </Typography>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.methodOption, styles.disabledMethod]} disabled>
          <MaterialIcons name="credit-card" size={32} color={Colors.gray400} />
          <Typography variant="h6" style={[styles.methodTitle, { color: Colors.gray400 }]}>
            Credit/Debit Card
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.methodDescription}>
            Coming Soon
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddressDisplay = () => {
    if (!selectedTokenData) return null;

    return (
      <ScrollView style={styles.stepContainer}>
        {isLoadingAddress ? (
          <View style={styles.loadingContainer}>
            <Typography variant="body1" color="textSecondary">
              Loading address...
            </Typography>
          </View>
        ) : currentAddress ? (
          <Card style={styles.confirmCard}>
            <Typography variant="h6" style={styles.confirmTitle}>
              Deposit Address
            </Typography>
            <Typography variant="body2" color="textSecondary" style={styles.confirmSubtitle}>
              Send {selectedTokenData.symbol === 'ETH' ? 'ETH or ERC-20 tokens (USDC, USDT, etc.)' : selectedTokenData.symbol} to this address:
            </Typography>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={currentAddress}
                size={200}
                backgroundColor="white"
                color="black"
              />
            </View>
            
            <View style={styles.addressContainer}>
              <Typography variant="body2" style={styles.address}>
                {currentAddress}
              </Typography>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopyAddress(currentAddress)}
              >
                <MaterialIcons name="content-copy" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.warningContainer}>
              <MaterialIcons name="warning" size={20} color={Colors.warning} />
              <Typography variant="caption" color="warning" style={styles.warningText}>
                {selectedTokenData.symbol === 'ETH' 
                  ? 'Only send ETH or ERC-20 tokens (USDC, USDT, etc.) to this address. Sending other tokens may result in permanent loss.'
                  : `Only send ${selectedTokenData.symbol} to this address. Sending other tokens may result in permanent loss.`
                }
              </Typography>
            </View>
          </Card>
        ) : (
          <View style={styles.loadingContainer}>
            <Typography variant="body1" color="textSecondary">
              No address available for {selectedTokenData.symbol}
            </Typography>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={currentStep === 'method' ? handleClose : () => setCurrentStep('method')}>
            <MaterialIcons 
              name={currentStep === 'method' ? 'close' : 'arrow-back'} 
              size={24} 
              color={Colors.textPrimary} 
            />
          </TouchableOpacity>
          <Typography variant="h6" style={styles.headerTitle}>
            {currentStep === 'method' ? 'Deposit' : `Deposit ${selectedToken}`}
          </Typography>
          <View style={styles.headerSpacer} />
        </View>
        
        {currentStep === 'method' ? renderMethodSelection() : renderAddressDisplay()}
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
  disabledMethod: {
    borderColor: Colors.gray300,
    backgroundColor: Colors.gray100,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  confirmCard: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  confirmTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  confirmSubtitle: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    width: '100%',
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
});