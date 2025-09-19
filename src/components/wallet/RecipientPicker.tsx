import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  address?: string;
  isRecent?: boolean;
}

interface RecipientPickerProps {
  onSelectRecipient: (recipient: Contact) => void;
  onBack: () => void;
}

export const RecipientPicker: React.FC<RecipientPickerProps> = ({
  onSelectRecipient,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'contacts' | 'qr' | 'address'>('contacts');
  const [address, setAddress] = useState('');

  const mockContacts: Contact[] = [
    {
      id: '1',
      name: 'Sarah Anderson',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      address: '0x1234...5678',
      isRecent: true,
    },
    {
      id: '2',
      name: 'Michael Roberts',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      address: '0x2345...6789',
      isRecent: true,
    },
    {
      id: '3',
      name: 'Emma Thompson',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      address: '0x3456...7890',
    },
    {
      id: '4',
      name: 'David Chen',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      address: '0x4567...8901',
    },
  ];

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentContacts = filteredContacts.filter(contact => contact.isRecent);
  const allContacts = filteredContacts.filter(contact => !contact.isRecent);

  const renderContact = (contact: Contact) => (
    <TouchableOpacity
      key={contact.id}
      style={styles.contactItem}
      onPress={() => onSelectRecipient(contact)}
    >
      <View style={styles.contactAvatar}>
        {contact.avatar ? (
          <MaterialIcons name="person" size={24} color={Colors.primary} />
        ) : (
          <Typography variant="h6">
            {contact.name.split(' ').map(n => n[0]).join('')}
          </Typography>
        )}
      </View>
      <View style={styles.contactInfo}>
        <Typography variant="h6">{contact.name}</Typography>
        <Typography variant="body2" color="textSecondary">
          {contact.address}
        </Typography>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={Colors.gray400} />
    </TouchableOpacity>
  );

  const renderContactsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={Colors.gray500} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search contacts..."
          placeholderTextColor={Colors.gray500}
        />
      </View>

      {/* Recent */}
      {recentContacts.length > 0 && (
        <View style={styles.section}>
          <Typography variant="h6" style={styles.sectionTitle}>Recent</Typography>
          {recentContacts.map(renderContact)}
        </View>
      )}

      {/* All Contacts */}
      {allContacts.length > 0 && (
        <View style={styles.section}>
          <Typography variant="h6" style={styles.sectionTitle}>All Contacts</Typography>
          {allContacts.map(renderContact)}
        </View>
      )}
    </ScrollView>
  );

  const renderQRTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.qrContainer}>
        <MaterialIcons name="qr-code-scanner" size={80} color={Colors.gray400} />
        <Typography variant="h5" style={styles.qrTitle}>Scan QR Code</Typography>
        <Typography variant="body1" color="textSecondary" style={styles.qrDescription}>
          Point your camera at a QR code to add recipient
        </Typography>
        <Button
          title="Open Camera"
          icon="camera-alt"
          onPress={() => Alert.alert('Info', 'QR Scanner would open here')}
          style={styles.qrButton}
        />
      </View>
    </View>
  );

  const renderAddressTab = () => {
    const handleAddAddress = () => {
      if (!address.trim()) {
        Alert.alert('Error', 'Please enter a wallet address');
        return;
      }
      
      const newContact: Contact = {
        id: Date.now().toString(),
        name: `Address ${address.slice(0, 6)}...${address.slice(-4)}`,
        address: address.trim(),
      };
      
      onSelectRecipient(newContact);
    };

    return (
      <View style={styles.tabContent}>
        <View style={styles.addressContainer}>
          <Typography variant="h6" style={styles.addressTitle}>
            Enter Wallet Address
          </Typography>
          <TextInput
            style={styles.addressInput}
            value={address}
            onChangeText={setAddress}
            placeholder="0x... or address"
            placeholderTextColor={Colors.gray500}
            multiline
          />
          <Button
            title="Add Recipient"
            onPress={handleAddAddress}
            style={styles.addressButton}
          />
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'contacts': return renderContactsTab();
      case 'qr': return renderQRTab();
      case 'address': return renderAddressTab();
      default: return renderContactsTab();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">Select Recipient</Typography>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contacts' && styles.activeTab]}
          onPress={() => setActiveTab('contacts')}
        >
          <MaterialIcons 
            name="contacts" 
            size={20} 
            color={activeTab === 'contacts' ? Colors.primary : Colors.gray500} 
          />
          <Typography 
            variant="body2" 
            color={activeTab === 'contacts' ? 'primary' : 'textSecondary'}
            style={styles.tabText}
          >
            Contacts
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'qr' && styles.activeTab]}
          onPress={() => setActiveTab('qr')}
        >
          <MaterialIcons 
            name="qr-code" 
            size={20} 
            color={activeTab === 'qr' ? Colors.primary : Colors.gray500} 
          />
          <Typography 
            variant="body2" 
            color={activeTab === 'qr' ? 'primary' : 'textSecondary'}
            style={styles.tabText}
          >
            QR Code
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'address' && styles.activeTab]}
          onPress={() => setActiveTab('address')}
        >
          <MaterialIcons 
            name="alternate-email" 
            size={20} 
            color={activeTab === 'address' ? Colors.primary : Colors.gray500} 
          />
          <Typography 
            variant="body2" 
            color={activeTab === 'address' ? 'primary' : 'textSecondary'}
            style={styles.tabText}
          >
            Address
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
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
    padding: Spacing.xs,
  },
  headerSpacer: {
    width: 24,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
  },
  tabContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  qrContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  qrTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  qrDescription: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  qrButton: {
    minWidth: 200,
  },
  addressContainer: {
    paddingVertical: Spacing.xl,
  },
  addressTitle: {
    marginBottom: Spacing.lg,
    fontWeight: '600',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addressButton: {
    width: '100%',
  },
});