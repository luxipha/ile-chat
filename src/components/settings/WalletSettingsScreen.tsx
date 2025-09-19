import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface WalletSettingsScreenProps {
  onBack: () => void;
}

interface WalletData {
  id: string;
  name: string;
  type: 'crypto' | 'fiat';
  address?: string;
  balance: number;
  symbol: string;
  icon: string;
  isEnabled: boolean;
}

export const WalletSettingsScreen: React.FC<WalletSettingsScreenProps> = ({
  onBack,
}) => {
  const [autoConvert, setAutoConvert] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [selectedWalletType, setSelectedWalletType] = useState<'ethereum' | 'bitcoin' | 'usdc'>('ethereum');

  const [wallets, setWallets] = useState<WalletData[]>([
    {
      id: '1',
      name: 'Main Ethereum Wallet',
      type: 'crypto',
      address: '0x742d35Cc652aD9...5dB9',
      balance: 2.45,
      symbol: 'ETH',
      icon: 'currency-eth',
      isEnabled: true,
    },
    {
      id: '2',
      name: 'Bitcoin Wallet',
      type: 'crypto',
      address: 'bc1qxy2kgdygjrsqtzq2n...6dd',
      balance: 0.12,
      symbol: 'BTC',
      icon: 'currency-btc',
      isEnabled: true,
    },
    {
      id: '3',
      name: 'USDC Wallet',
      type: 'crypto',
      address: '0x742d35Cc652aD9...7eA2',
      balance: 1250.00,
      symbol: 'USDC',
      icon: 'attach-money',
      isEnabled: false,
    },
    {
      id: '4',
      name: 'Nigerian Naira',
      type: 'fiat',
      balance: 450000,
      symbol: 'NGN',
      icon: 'account-balance',
      isEnabled: true,
    },
  ]);

  const handleToggleWallet = (walletId: string) => {
    setWallets(prev => prev.map(wallet => 
      wallet.id === walletId 
        ? { ...wallet, isEnabled: !wallet.isEnabled }
        : wallet
    ));
  };

  const handleRemoveWallet = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    Alert.alert(
      'Remove Wallet',
      `Are you sure you want to remove ${wallet?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setWallets(prev => prev.filter(w => w.id !== walletId));
          }
        }
      ]
    );
  };

  const handleAddWallet = () => {
    if (newWalletAddress.trim().length === 0) return;

    const newWallet: WalletData = {
      id: Date.now().toString(),
      name: `${selectedWalletType.charAt(0).toUpperCase() + selectedWalletType.slice(1)} Wallet`,
      type: 'crypto',
      address: newWalletAddress.trim(),
      balance: 0,
      symbol: selectedWalletType === 'ethereum' ? 'ETH' : selectedWalletType === 'bitcoin' ? 'BTC' : 'USDC',
      icon: selectedWalletType === 'ethereum' ? 'currency-eth' : selectedWalletType === 'bitcoin' ? 'currency-btc' : 'attach-money',
      isEnabled: true,
    };

    setWallets(prev => [...prev, newWallet]);
    setNewWalletAddress('');
    setShowAddWallet(false);
    Alert.alert('Success', 'Wallet added successfully!');
  };

  const renderToggleItem = (
    icon: string,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <MaterialIcons name={icon as any} size={24} color={Colors.primary} />
      <View style={styles.settingContent}>
        <Typography variant="h6" style={styles.settingTitle}>
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.gray300, true: Colors.primary }}
        thumbColor={value ? Colors.background : Colors.gray500}
      />
    </View>
  );

  const renderWalletCard = (wallet: WalletData) => (
    <Card key={wallet.id} style={styles.walletCard}>
      <View style={styles.walletHeader}>
        <View style={styles.walletInfo}>
          <MaterialIcons name={wallet.icon as any} size={24} color={Colors.primary} />
          <View style={styles.walletDetails}>
            <Typography variant="h6" style={styles.walletName}>
              {wallet.name}
            </Typography>
            {wallet.address && (
              <Typography variant="caption" color="textSecondary">
                {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 4)}
              </Typography>
            )}
          </View>
        </View>
        
        <View style={styles.walletControls}>
          <Typography variant="h6" color="primary" style={styles.walletBalance}>
            {wallet.symbol === 'NGN' ? '₦' : wallet.symbol === 'USDC' ? '$' : ''}{wallet.balance.toLocaleString()} {wallet.symbol}
          </Typography>
          <View style={styles.walletActions}>
            <Switch
              value={wallet.isEnabled}
              onValueChange={() => handleToggleWallet(wallet.id)}
              trackColor={{ false: Colors.gray300, true: Colors.primary }}
              thumbColor={wallet.isEnabled ? Colors.background : Colors.gray500}
              style={styles.walletSwitch}
            />
            {wallet.type === 'crypto' && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveWallet(wallet.id)}
              >
                <MaterialIcons name="delete" size={20} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Card>
  );

  const renderAddWalletForm = () => (
    <Card style={styles.addWalletCard}>
      <Typography variant="h6" style={styles.addWalletTitle}>
        Add New Wallet
      </Typography>
      
      <View style={styles.walletTypeSelector}>
        <Typography variant="body2" style={styles.inputLabel}>
          Wallet Type
        </Typography>
        <View style={styles.typeOptions}>
          {(['ethereum', 'bitcoin', 'usdc'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeOption,
                selectedWalletType === type && styles.selectedTypeOption
              ]}
              onPress={() => setSelectedWalletType(type)}
            >
              <Typography
                variant="body2"
                style={[
                  styles.typeOptionText,
                  selectedWalletType === type && styles.selectedTypeOptionText
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body2" style={styles.inputLabel}>
          Wallet Address
        </Typography>
        <TextInput
          style={styles.textInput}
          value={newWalletAddress}
          onChangeText={setNewWalletAddress}
          placeholder={`Enter ${selectedWalletType} wallet address`}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.addWalletButtons}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => {
            setShowAddWallet(false);
            setNewWalletAddress('');
          }}
          style={styles.cancelButton}
        />
        <Button
          title="Add Wallet"
          onPress={handleAddWallet}
          disabled={newWalletAddress.trim().length === 0}
          style={styles.addButton}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">Wallet Settings</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Settings */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            General Settings
          </Typography>
          
          {renderToggleItem(
            'swap-horiz',
            'Auto-Convert',
            'Automatically convert small balances',
            autoConvert,
            setAutoConvert
          )}
          
          {renderToggleItem(
            'notifications',
            'Transaction Notifications',
            'Get notified of wallet transactions',
            notifications,
            setNotifications
          )}
          
          {renderToggleItem(
            'visibility',
            'Show Balances',
            'Display wallet balances on home screen',
            showBalances,
            setShowBalances
          )}
        </View>

        {/* Connected Wallets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h5" style={styles.sectionTitle}>
              Connected Wallets
            </Typography>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddWallet(!showAddWallet)}
            >
              <MaterialIcons 
                name={showAddWallet ? 'remove' : 'add'} 
                size={24} 
                color={Colors.primary} 
              />
            </TouchableOpacity>
          </View>

          {showAddWallet && renderAddWalletForm()}

          {wallets.map(renderWalletCard)}
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Security
          </Typography>
          
          <Card style={styles.securityCard}>
            <TouchableOpacity style={styles.securityItem}>
              <MaterialIcons name="backup" size={24} color={Colors.primary} />
              <View style={styles.securityContent}>
                <Typography variant="h6">Backup Wallets</Typography>
                <Typography variant="body2" color="textSecondary">
                  Export wallet backup files
                </Typography>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.securityItem}>
              <MaterialIcons name="import-export" size={24} color={Colors.primary} />
              <View style={styles.securityContent}>
                <Typography variant="h6">Import Wallet</Typography>
                <Typography variant="body2" color="textSecondary">
                  Import from seed phrase or private key
                </Typography>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} />
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </View>
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
  backButton: {
    padding: Spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  settingContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  settingTitle: {
    fontWeight: '500',
  },
  walletCard: {
    marginBottom: Spacing.md,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  walletName: {
    fontWeight: '500',
  },
  walletControls: {
    alignItems: 'flex-end',
  },
  walletBalance: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  walletActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletSwitch: {
    marginRight: Spacing.md,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  addWalletCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.gray50,
  },
  addWalletTitle: {
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  walletTypeSelector: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  selectedTypeOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  typeOptionText: {
    color: Colors.textSecondary,
  },
  selectedTypeOptionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  addWalletButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
  securityCard: {
    padding: 0,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  securityContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});