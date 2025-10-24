import React, { useState } from 'react';
import { Layout, Text, Button, Card, Avatar } from '../components/compat/UIKittenCompat';
import { ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SendMoneyModal } from '../components/wallet/SendMoneyModal';

export const MainScreen: React.FC = () => {
  const [showSendModal, setShowSendModal] = useState(false);

  const handleSendComplete = (amount: number, token: any) => {
    console.log(`Sent ${amount} ${token.symbol}`);
    // Handle send completion logic here
  };

  return (
    <Layout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Layout style={styles.header}>
          <Avatar
            style={styles.avatar}
            source={{ uri: 'https://via.placeholder.com/40' }}
          />
          <Layout style={styles.headerText}>
            <Text category='h6'>Welcome back!</Text>
            <Text category='s1' appearance='hint'>Your crypto wallet</Text>
          </Layout>
        </Layout>

        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Text category='label' appearance='hint'>Total Balance</Text>
          <Text category='h1'>$0.00</Text>
          <Text category='s1' appearance='hint'>≈ 0.00 ETH</Text>
        </Card>

        {/* Action Buttons */}
        <Layout style={styles.actions}>
          <Button 
            style={styles.actionButton}
            accessoryLeft={() => <MaterialIcons name="add" size={20} color="white" />}
          >
            Deposit
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

        {/* Properties Section */}
        <Layout style={styles.section}>
          <Text category='h6' style={styles.sectionTitle}>Your Properties</Text>
          <Card style={styles.propertyCard}>
            <Text category='s1' appearance='hint'>No properties yet</Text>
            <Text category='c1' appearance='hint'>Start investing in real estate</Text>
          </Card>
        </Layout>

        {/* Recent Activity */}
        <Layout style={styles.section}>
          <Text category='h6' style={styles.sectionTitle}>Recent Activity</Text>
          <Card style={styles.activityCard}>
            <Text category='s1' appearance='hint'>No recent activity</Text>
          </Card>
        </Layout>
      </ScrollView>

      {/* Send Money Modal */}
      <SendMoneyModal
        visible={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSendComplete={handleSendComplete}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerText: {
    backgroundColor: 'transparent',
  },
  balanceCard: {
    marginBottom: 24,
    borderRadius: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    marginBottom: 32,
    backgroundColor: 'transparent',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  propertyCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  activityCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
});