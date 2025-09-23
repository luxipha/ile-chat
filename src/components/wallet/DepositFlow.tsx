import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Colors, Spacing, BorderRadius } from '../../theme';
import QRCode from 'react-native-qrcode-svg';
import crossmintService from '../../services/crossmintService';

interface DepositFlowProps {
  visible: boolean;
  onClose: () => void;
}

type DepositStep = 'method' | 'network' | 'address';
type CryptoNetwork = 'USDC_ETHEREUM' | 'USDC_APTOS';

const USDC_NETWORKS = [
  { 
    id: 'USDC_APTOS' as CryptoNetwork,
    name: 'Aptos Testnet', 
    token: 'USDC',
    icon: 'account-balance-wallet',
    chain: 'aptos-testnet',
    description: 'USDC on Aptos testnet',
    type: 'aptos' as const
  },
  { 
    id: 'USDC_ETHEREUM' as CryptoNetwork,
    name: 'Ethereum Sepolia', 
    token: 'USDC',
    icon: 'account-balance-wallet',
    chain: 'ethereum',
    description: 'USDC on Ethereum Sepolia testnet',
    type: 'crossmint' as const
  },
];

export const DepositFlow: React.FC<DepositFlowProps> = ({
  visible,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<DepositStep>('method');
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoNetwork | null>(null);
  const [walletAddresses, setWalletAddresses] = useState<{[key: string]: string}>({});
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  
  const resetFlow = () => {
    setCurrentStep('method');
    setSelectedNetwork(null);
  };

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  const handleUSDCSelect = () => {
    setCurrentStep('network');
  };

  const handleNetworkSelect = async (networkId: CryptoNetwork) => {
    setSelectedNetwork(networkId);
    setCurrentStep('address');
    
    // Load existing wallet address for the selected network (NO CREATION)
    const networkData = USDC_NETWORKS.find(net => net.id === networkId);
    if (networkData) {
      setIsLoadingAddress(true);
      try {
        if (networkData.type === 'crossmint') {
          // Check if CrossMint wallet exists
          const walletStatus = await crossmintService.getWalletStatus();
          
          if (walletStatus.success && walletStatus.wallet) {
            // For CrossMint, use the main wallet address for Ethereum
            const walletAddress = walletStatus.wallet.walletId || 
                                walletStatus.wallet.chains?.[0]?.address ||
                                'No address available';
            
            console.log(`✅ Using existing CrossMint wallet address: ${walletAddress}`);
            setWalletAddresses(prev => ({
              ...prev,
              [networkData.chain]: walletAddress
            }));
          } else {
            throw new Error('No CrossMint wallet found. Please create a wallet first.');
          }
        } else if (networkData.type === 'aptos') {
          // Check if Aptos wallet exists in backend database
          let backendWallet;
          try {
            backendWallet = await crossmintService.getWalletFromBackend(networkData.chain, 'aptos');
          } catch (error) {
            console.log('⚠️ Error checking backend wallet:', error);
            backendWallet = { success: false };
          }
          
          if (backendWallet && backendWallet.success && backendWallet.wallet) {
            // Wallet exists in database, use it
            console.log('✅ Using existing Aptos wallet from database:', backendWallet.wallet.address);
            setWalletAddresses(prev => ({
              ...prev,
              [networkData.chain]: backendWallet.wallet.address
            }));
            
            // Also update AsyncStorage to match database
            try {
              if (backendWallet.wallet) {
                await AsyncStorage.setItem('aptosWalletAddress', backendWallet.wallet.address);
                if (backendWallet.wallet.privateKey) {
                  await AsyncStorage.setItem('aptosWalletPrivateKey', backendWallet.wallet.privateKey);
                }
                console.log('✅ Updated AsyncStorage with database wallet');
              }
            } catch (storageError) {
              console.warn('⚠️ Failed to update AsyncStorage:', storageError);
            }
          } else {
            throw new Error('No Aptos wallet found. Please create a wallet first.');
          }
        }
      } catch (error: any) {
        console.error('❌ Failed to load wallet address:', error);
        Alert.alert(
          'Wallet Not Found', 
          `No ${networkData.name} wallet found. Please create a wallet first from the main screen.`
        );
      } finally {
        setIsLoadingAddress(false);
      }
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await Clipboard.setString(address);
      Alert.alert(
        '✅ Address Copied!', 
        `${selectedNetworkData?.name || 'Wallet'} address copied to clipboard.\n\nAddress: ${address.slice(0, 12)}...${address.slice(-12)}`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      Alert.alert('❌ Copy Failed', 'Unable to copy address to clipboard. Please try again.');
    }
  };

  const selectedNetworkData = USDC_NETWORKS.find(network => network.id === selectedNetwork);
  const currentAddress = selectedNetworkData ? walletAddresses[selectedNetworkData.chain] : null;

  const renderMethodSelection = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Typography variant="h5" style={styles.stepTitle}>
        Deposit USDC
      </Typography>
      <Typography variant="body2" color="textSecondary" style={styles.stepSubtitle}>
        Choose how you'd like to deposit USDC into your wallet
      </Typography>
      
      <View style={styles.methodOptions}>
        <TouchableOpacity
          style={styles.methodOption}
          onPress={handleUSDCSelect}
        >
          <MaterialIcons name="account-balance-wallet" size={32} color={Colors.primary} />
          <Typography variant="h6" style={styles.methodTitle}>
            USDC Transfer
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.methodDescription}>
            Transfer USDC from supported testnets
          </Typography>
          <View style={styles.methodBadge}>
            <Typography variant="caption" style={styles.methodBadgeText}>
              Instant
            </Typography>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.methodOption, styles.disabledMethod]} disabled>
          <MaterialIcons name="credit-card" size={32} color={Colors.gray400} />
          <Typography variant="h6" style={[styles.methodTitle, { color: Colors.gray400 }]}>
            Buy with Card
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.methodDescription}>
            Coming Soon
          </Typography>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderNetworkSelection = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Typography variant="h5" style={styles.stepTitle}>
        Select Network
      </Typography>
      <Typography variant="body2" color="textSecondary" style={styles.stepSubtitle}>
        Choose which testnet to receive USDC from
      </Typography>
      
      <View style={styles.methodOptions}>
        {USDC_NETWORKS.map((network) => (
          <TouchableOpacity
            key={network.id}
            style={styles.methodOption}
            onPress={() => handleNetworkSelect(network.id)}
          >
            <MaterialIcons name={network.icon as any} size={32} color={Colors.primary} />
            <Typography variant="h6" style={styles.methodTitle}>
              {network.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" style={styles.methodDescription}>
              {network.description}
            </Typography>
            <View style={styles.methodBadge}>
              <Typography variant="caption" style={styles.methodBadgeText}>
                {network.type === 'aptos' ? 'Aptos' : 'CrossMint'}
              </Typography>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderAddressDisplay = () => {
    if (!selectedNetworkData) return null;

    return (
      <ScrollView style={styles.stepContainer}>
        {isLoadingAddress ? (
          <View style={styles.loadingContainer}>
            <Typography variant="h6" style={styles.loadingTitle}>
              Setting up your {selectedNetworkData.name} wallet...
            </Typography>
            <Typography variant="body2" color="textSecondary" style={styles.loadingSubtext}>
              {selectedNetworkData.type === 'aptos' 
                ? 'Loading your existing Aptos wallet from database...' 
                : 'Loading your existing CrossMint wallet...'
              }
            </Typography>
          </View>
        ) : currentAddress ? (
          <Card style={styles.confirmCard}>
            <Typography variant="h6" style={styles.confirmTitle}>
              {selectedNetworkData.name} Deposit Address
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
              <View style={styles.addressTextContainer}>
                <Typography variant="caption" color="textSecondary" style={styles.addressLabel}>
                  Wallet Address
                </Typography>
                <Typography variant="body2" style={styles.address}>
                  {currentAddress.slice(0, 8)}...{currentAddress.slice(-8)}
                </Typography>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopyAddress(currentAddress)}
              >
                <MaterialIcons name="content-copy" size={20} color={Colors.primary} />
                <Typography variant="caption" style={styles.copyButtonText}>
                  Copy
                </Typography>
              </TouchableOpacity>
            </View>
            
            <View style={styles.networkBadge}>
              <Typography variant="caption" style={styles.networkBadgeText}>
                Network: {selectedNetworkData.name}
              </Typography>
              <Typography variant="caption" style={styles.networkBadgeText}>
                Wallet: {selectedNetworkData.type === 'aptos' ? 'Aptos' : 'CrossMint'}
              </Typography>
            </View>
            
            <View style={styles.warningContainer}>
              <MaterialIcons name="warning" size={20} color={Colors.warning} />
              <Typography variant="caption" color="warning" style={styles.warningText}>
                Only send USDC on {selectedNetworkData.name} to this address. 
                {selectedNetworkData.type === 'aptos' 
                  ? ' This is an Aptos testnet address.' 
                  : ' This is a CrossMint-managed address for EVM testnets.'
                } Sending other tokens or using wrong network may result in permanent loss.
              </Typography>
            </View>
          </Card>
        ) : (
          <View style={styles.loadingContainer}>
            <Typography variant="body1" color="textSecondary">
              No address available for {selectedNetworkData.name}
            </Typography>
          </View>
        )}
      </ScrollView>
    );
  };

  const getHeaderTitle = () => {
    switch (currentStep) {
      case 'method': return 'Deposit';
      case 'network': return 'Select Network';
      case 'address': return `Deposit USDC`;
      default: return 'Deposit';
    }
  };

  const handleBackPress = () => {
    switch (currentStep) {
      case 'method':
        handleClose();
        break;
      case 'network':
        setCurrentStep('method');
        break;
      case 'address':
        setCurrentStep('network');
        break;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress}>
            <MaterialIcons 
              name={currentStep === 'method' ? 'close' : 'arrow-back'} 
              size={24} 
              color={Colors.gray900} 
            />
          </TouchableOpacity>
          <Typography variant="h6" style={styles.headerTitle}>
            {getHeaderTitle()}
          </Typography>
          <View style={styles.headerSpacer} />
        </View>
        
        {currentStep === 'method' && renderMethodSelection()}
        {currentStep === 'network' && renderNetworkSelection()}
        {currentStep === 'address' && renderAddressDisplay()}
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
    textAlign: 'center',
  },
  stepSubtitle: {
    marginBottom: Spacing.xl,
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
    paddingHorizontal: Spacing.lg,
  },
  loadingTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  loadingSubtext: {
    textAlign: 'center',
    lineHeight: 20,
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
    justifyContent: 'space-between',
    backgroundColor: Colors.gray50,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    width: '100%',
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  address: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray900,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.md,
  },
  copyButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.xs,
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
  networkBadge: {
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  networkBadgeText: {
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
});