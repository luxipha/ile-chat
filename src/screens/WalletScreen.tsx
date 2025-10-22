import React, { useState } from 'react';
import { Layout, Text, Button, Card, Input, Modal } from '@ui-kitten/components';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WalletConnect } from '../components/WalletConnect';
import { QRReceiveFlow } from '../components/wallet/QRReceiveFlow';

export const WalletScreen: React.FC = () => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', balance: '0.00', value: '$0.00' },
    { symbol: 'USDC', name: 'USD Coin', balance: '0.00', value: '$0.00' },
  ];

  const handleWalletConnect = (address: string) => {
    setIsWalletConnected(true);
    setWalletAddress(address);
  };

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false);
    setWalletAddress('');
  };

  return (
    <Layout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Wallet Connection */}
        <WalletConnect 
          onConnect={handleWalletConnect}
          onDisconnect={handleWalletDisconnect}
        />

        {/* Tokens List - Only show when wallet is connected */}
        {isWalletConnected && (
          <>
            <Layout style={styles.section}>
              <Text category='h6' style={styles.sectionTitle}>Tokens</Text>
              {tokens.map((token, index) => (
                <View key={index} style={[styles.tokenCard, styles.disabledCard]}>
                  <Layout style={styles.tokenHeader}>
                    <Layout style={styles.tokenInfo}>
                      <Text category='s1'>{token.symbol}</Text>
                      <Text category='c1' appearance='hint'>{token.name}</Text>
                    </Layout>
                    <Layout style={styles.tokenBalance}>
                      <Text category='s1'>{token.balance} {token.symbol}</Text>
                      <Text category='c1' appearance='hint'>{token.value}</Text>
                    </Layout>
                  </Layout>
                </View>
              ))}
            </Layout>

            {/* Properties Section - Disabled */}
            <Layout style={styles.section}>
              <Text category='h6' style={styles.sectionTitle}>Properties</Text>
              <View style={[styles.tokenCard, styles.disabledCard]}>
                <Text style={styles.disabledText}>Properties feature coming soon</Text>
              </View>
            </Layout>

            {/* Lending Section - Disabled */}
            <Layout style={styles.section}>
              <Text category='h6' style={styles.sectionTitle}>Lending</Text>
              <View style={[styles.tokenCard, styles.disabledCard]}>
                <Text style={styles.disabledText}>Lending feature coming soon</Text>
              </View>
            </Layout>

            {/* Quick Actions */}
            <Layout style={styles.actions}>
              <Button 
                style={styles.actionButton}
                accessoryLeft={() => <MaterialIcons name="qr-code" size={20} color="white" />}
                onPress={() => setShowReceiveModal(true)}
              >
                Receive
              </Button>
              <Button 
                style={styles.actionButton}
                appearance='outline'
                accessoryLeft={() => <MaterialIcons name="send" size={20} color="#3366FF" />}
                onPress={() => setShowSendModal(true)}
              >
                Send
              </Button>
            </Layout>
          </>
        )}
      </ScrollView>

      {/* Send Modal */}
      <Modal
        visible={showSendModal}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setShowSendModal(false)}
      >
        <Card disabled={true} style={styles.modal}>
          <Text category='h6' style={styles.modalTitle}>Send Crypto</Text>
          
          <Input
            placeholder='Recipient Address'
            value={recipientAddress}
            onChangeText={setRecipientAddress}
            style={styles.input}
          />
          
          <Input
            placeholder='Amount'
            value={sendAmount}
            onChangeText={setSendAmount}
            style={styles.input}
            keyboardType='numeric'
          />
          
          <Layout style={styles.modalActions}>
            <Button 
              size='small' 
              appearance='ghost'
              onPress={() => setShowSendModal(false)}
            >
              Cancel
            </Button>
            <Button 
              size='small'
              disabled={!sendAmount || !recipientAddress}
            >
              Send
            </Button>
          </Layout>
        </Card>
      </Modal>

      {/* Receive Modal */}
      <QRReceiveFlow
        visible={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        userHandle="abisoye.ile"
        showAdvanced={true}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  tokenCard: {
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
  },
  disabledCard: {
    opacity: 0.7,
    backgroundColor: '#F0F3F6',
    borderColor: '#E4E9F2',
  },
  disabledText: {
    textAlign: 'center',
    color: '#8F9BB3',
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tokenInfo: {
    backgroundColor: 'transparent',
  },
  tokenBalance: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
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
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginTop: 8,
  },
});