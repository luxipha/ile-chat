import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Share,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import QRCode from 'react-native-qrcode-svg';
import Service from '../../services/Service';
// aptosService removed - using Circle/Hedera instead
import baseService from '../../services/baseService';

interface QRReceiveFlowProps {
  visible: boolean;
  onClose: () => void;
  userHandle: string;
  showAdvanced?: boolean;
}

type WalletAddresses = {
  'aptos-testnet'?: string;
  'base-sepolia'?: string;
  'ethereum'?: string;
};

export const QRReceiveFlow: React.FC<QRReceiveFlowProps> = ({
  visible,
  onClose,
  userHandle,
  showAdvanced = false,
}) => {
  const [showWalletAddress, setShowWalletAddress] = useState(false);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddresses>({});
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    if (showWalletAddress && showAdvanced) {
      loadWalletAddresses();
    }
  }, [showWalletAddress]);

  const loadWalletAddresses = async () => {
    setIsLoadingAddresses(true);
    setLoadingError(null);
    try {
      // Load Aptos wallet
      const aptosWallet = await Service.getWalletFromBackend('aptos-testnet', 'aptos');
      if (aptosWallet?.success && aptosWallet?.data?.wallet?.address) {
        setWalletAddresses(prev => ({
          ...prev,
          'aptos-testnet': aptosWallet.data.wallet.address
        }));
      }

      // Load Base wallet
      const baseWallet = await Service.getBaseWallet();
      if (baseWallet?.success && baseWallet?.data?.wallet?.address) {
        setWalletAddresses(prev => ({
          ...prev,
          'base-sepolia': baseWallet.data.wallet.address
        }));
      }

      // Load test wallet for Ethereum
      const testAddress = Service.getTestWalletAddress();
      if (testAddress) {
        setWalletAddresses(prev => ({
          ...prev,
          'ethereum': testAddress
        }));
      }
    } catch (error) {
      console.error('Error loading wallet addresses:', error);
      setLoadingError('Failed to load wallet addresses. Please try again.');
    } finally {
      setIsLoadingAddresses(false);
    }
  };
  
  const handleCopyHandle = async () => {
    await Clipboard.setString(userHandle);
  };

  const handleShareLink = async () => {
    try {
      const result = await Share.share({
        message: `Send me payments on Ilé: @${userHandle}`,
        url: `https://ile.africa/pay/${userHandle}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Typography variant="h6" style={styles.headerTitle}>
            Receive
          </Typography>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Typography variant="h5" style={styles.title}>
            Scan to pay
          </Typography>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode
              value={`https://ile.africa/pay/${userHandle}`}
              size={200}
              backgroundColor="white"
              color="black"
            />
          </View>

          {/* User Handle */}
          <Typography variant="body1" style={styles.handle}>
            @{userHandle}
          </Typography>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCopyHandle}
            >
              <Typography variant="body2" style={styles.actionButtonText}>
                Copy Handle
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareLink}
            >
              <Typography variant="body2" style={styles.actionButtonText}>
                Share Link
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Advanced Section */}
          {showAdvanced && (
            <View>
              <TouchableOpacity
                style={styles.advancedButton}
                onPress={() => setShowWalletAddress(!showWalletAddress)}
              >
                <Typography variant="body2" style={styles.advancedButtonText}>
                {showWalletAddress ? 'Hide Advanced' : 'Show Advanced'}
              </Typography>
                <MaterialIcons
                  name={showWalletAddress ? 'expand-less' : 'expand-more'}
                  size={24}
                  color={Colors.primary}
                />
              </TouchableOpacity>

              {showWalletAddress && (
                <View style={styles.walletAddressContainer}>
                  {isLoadingAddresses ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color={Colors.primary} />
                      <Typography variant="body2" style={styles.loadingText}>
                        Loading wallet addresses...
                      </Typography>
                    </View>
                  ) : loadingError ? (
                    <View style={styles.errorContainer}>
                      <Typography variant="body2" style={styles.errorText}>
                        {loadingError}
                      </Typography>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadWalletAddresses}
                      >
                        <Typography variant="body2" style={styles.retryText}>
                  Retry
                </Typography>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.addressList}>
                      {Object.entries(walletAddresses).map(([network, address]) => (
                        <View key={network} style={styles.addressItem}>
                          <View style={styles.networkLabel}>
                            <Typography variant="caption" style={styles.networkText}>
                              {network.toUpperCase()}
                            </Typography>
                          </View>
                          <View style={styles.addressContent}>
                            <Typography variant="body2" style={styles.addressText}>
                              {address?.slice(0, 6)}...{address?.slice(-4)}
                            </Typography>
                            <TouchableOpacity
                              onPress={() => {
                                Clipboard.setString(address || '');
                              }}
                              style={styles.copyButton}
                            >
                              <MaterialIcons
                                name="content-copy"
                                size={16}
                                color={Colors.gray600}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl * 2,
  },
  title: {
    marginBottom: Spacing.xl * 2,
    fontWeight: '600',
  },
  qrContainer: {
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.gray900,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  handle: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '10',
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl * 2,
    padding: Spacing.md,
  },
  advancedButtonText: {
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  walletAddressContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.gray600,
  },
  errorContainer: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  retryText: {
    color: Colors.primary,
  },
  addressList: {
    gap: Spacing.sm,
  },
  addressItem: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  networkLabel: {
    marginBottom: Spacing.xs,
  },
  networkText: {
    color: Colors.gray600,
  },
  addressContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressText: {
    color: Colors.gray900,
    flex: 1,
  },
  copyButton: {
    padding: Spacing.xs,
  },
});