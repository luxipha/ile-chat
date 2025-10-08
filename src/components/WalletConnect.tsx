import React, { useState, useEffect } from 'react';
import { Layout, Text, Button, Card, Modal, Input } from '@ui-kitten/components';
import { StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Service from '../services/Service';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, onDisconnect }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const connected = await Service.isWalletConnected();
      if (connected) {
        const data = await Service.getLocalWalletData();
        if (data) {
          setIsConnected(true);
          setWalletData(data);
          // Get primary chain address for display
          const primaryChain = data.chains?.find((c: any) => c.isActive) || data.chains?.[0];
          if (primaryChain) {
            setWalletAddress(primaryChain.address);
            onConnect?.(primaryChain.address);
          }
        }
      }
    } catch (error) {
      console.error('Check wallet connection error:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      // Connect via  service (backend handles the actual  integration)
      const result = await Service.connectWallet();
      
      if (result.success && result.wallet) {
        setIsConnected(true);
        setWalletData(result.wallet);
        setShowConnectModal(false);
        setEmail('');
        
        // Get primary chain address for display
        const primaryChain = result.wallet.chains?.find((c: any) => c.isActive) || result.wallet.chains?.[0];
        if (primaryChain) {
          setWalletAddress(primaryChain.address);
          onConnect?.(primaryChain.address);
        }
        
        Alert.alert('Success', 'Wallet connected successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to connect wallet');
      }
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const result = await Service.disconnectWallet();
      
      if (result.success) {
        setWalletAddress('');
        setIsConnected(false);
        setWalletData(null);
        
        onDisconnect?.();
        
        Alert.alert('Success', 'Wallet disconnected');
      } else {
        Alert.alert('Error', result.error || 'Failed to disconnect wallet');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('Error', 'Failed to disconnect wallet');
    }
  };

  const formatAddress = (address: string) => {
    return Service.formatAddress(address);
  };

  if (isConnected) {
    return (
      <Card style={styles.connectedCard}>
        <Layout style={styles.connectedHeader}>
          <MaterialIcons name="account-balance-wallet" size={24} color="#00E096" />
          <Text category='s1' style={styles.connectedText}>Wallet Connected</Text>
        </Layout>
        <Text category='c1' appearance='hint' style={styles.addressText}>
          {formatAddress(walletAddress)}
        </Text>
        <Button 
          size='small' 
          appearance='ghost' 
          status='danger'
          onPress={handleDisconnect}
          style={styles.disconnectButton}
        >
          Disconnect
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card style={styles.connectCard}>
        <MaterialIcons name="account-balance-wallet" size={48} color="#8F9BB3" />
        <Text category='h6' style={styles.connectTitle}>Connect Your Wallet</Text>
        <Text category='s1' appearance='hint' style={styles.connectDescription}>
          Connect your  wallet to start investing in real estate
        </Text>
        <Button 
          style={styles.connectButton}
          accessoryLeft={() => <MaterialIcons name="link" size={20} color="white" />}
          onPress={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </Card>

    </>
  );
};

const styles = StyleSheet.create({
  connectCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
  },
  connectTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  connectDescription: {
    textAlign: 'center',
    marginBottom: 24,
  },
  connectButton: {
    borderRadius: 12,
  },
  connectedCard: {
    borderRadius: 16,
    borderColor: '#00E096',
    borderWidth: 1,
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  connectedText: {
    marginLeft: 8,
    color: '#00E096',
  },
  addressText: {
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  disconnectButton: {
    alignSelf: 'flex-start',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    margin: 20,
    borderRadius: 16,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    textAlign: 'center',
    marginBottom: 20,
  },
  emailInput: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
});