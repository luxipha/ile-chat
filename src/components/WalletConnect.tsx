import React, { useState } from 'react';
import { Layout, Text, Button, Card, Modal, Input } from '@ui-kitten/components';
import { StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, onDisconnect }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [email, setEmail] = useState('');

  const handleConnect = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    try {
      // For now, we'll simulate wallet connection
      // In a real implementation, this would integrate with Crossmint SDK
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      
      await AsyncStorage.setItem('walletAddress', mockAddress);
      await AsyncStorage.setItem('userEmail', email);
      
      setWalletAddress(mockAddress);
      setIsConnected(true);
      setShowConnectModal(false);
      
      onConnect?.(mockAddress);
      
      Alert.alert('Success', 'Wallet connected successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    try {
      await AsyncStorage.removeItem('walletAddress');
      await AsyncStorage.removeItem('userEmail');
      
      setWalletAddress('');
      setIsConnected(false);
      
      onDisconnect?.();
      
      Alert.alert('Success', 'Wallet disconnected');
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect wallet');
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
          Connect your wallet to start investing in real estate
        </Text>
        <Button 
          style={styles.connectButton}
          accessoryLeft={() => <MaterialIcons name="link" size={20} color="white" />}
          onPress={() => setShowConnectModal(true)}
        >
          Connect Wallet
        </Button>
      </Card>

      <Modal
        visible={showConnectModal}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setShowConnectModal(false)}
      >
        <Card disabled={true} style={styles.modal}>
          <Text category='h6' style={styles.modalTitle}>Connect Wallet</Text>
          <Text category='s1' appearance='hint' style={styles.modalDescription}>
            Enter your email to create or connect your wallet
          </Text>
          
          <Input
            placeholder='Enter your email'
            value={email}
            onChangeText={setEmail}
            style={styles.emailInput}
            keyboardType='email-address'
            autoCapitalize='none'
          />
          
          <Layout style={styles.modalActions}>
            <Button 
              size='small' 
              appearance='ghost'
              onPress={() => setShowConnectModal(false)}
            >
              Cancel
            </Button>
            <Button 
              size='small'
              onPress={handleConnect}
              disabled={!email}
            >
              Connect
            </Button>
          </Layout>
        </Card>
      </Modal>
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