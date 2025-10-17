import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { QRScannerModal } from '../scanner/QRScannerModal';
import { friendService, Friend } from '../../services/friendService';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  address?: string;
  isRecent?: boolean;
  userId?: string;
  username?: string;
  trustBadge?: boolean;
}

interface RecipientPickerProps {
  onSelectRecipient: (recipient: { id: string; name: string; address?: string }) => void;
  onBack: () => void;
}

export const RecipientPicker: React.FC<RecipientPickerProps> = ({
  onSelectRecipient,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'contacts' | 'qr' | 'address'>('contacts');
  const [address, setAddress] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load contacts when component mounts
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    setError('');

    try {
      // Get friends from the app's friends API
      const friendsResponse = await friendService.getFriends();
      
      if (!friendsResponse.success) {
        throw new Error('Failed to load friends list');
      }
      
      // Convert friends to our Contact interface
      const friendContacts: Contact[] = friendsResponse.friends.map((friend: Friend) => ({
        id: friend.id,
        name: friend.name,
        avatar: undefined, // Friends service doesn't include avatar yet
        address: friend.id, // Using friend ID as address for now
        isRecent: false,
        userId: friend.id,
        username: friend.email, // Using email as username for display
        trustBadge: true, // All friends are trusted
      }));

      setContacts(friendContacts);
      console.log(`✅ Loaded ${friendContacts.length} friends from app`);
    } catch (error: any) {
      console.error('Failed to load friends:', error);
      setError('Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchContacts = async (query: string) => {
    if (!query.trim()) {
      await loadContacts();
      return;
    }

    setLoading(true);
    try {
      const searchResults = await friendService.searchUsers(query);
      if (searchResults.success) {
        const searchedContacts: Contact[] = searchResults.users.map((user: any) => ({
          id: user.id,
          name: user.name || user.username,
          avatar: user.avatar,
          address: user.id,
          isRecent: false,
          userId: user.id,
          username: user.username,
          trustBadge: false, // Search results are not necessarily friends
        }));
        
        setContacts(searchedContacts);
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchContacts(searchQuery);
      } else {
        loadContacts();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleQRCodeScanned = (data: string) => {
    setShowQRScanner(false);
    
    try {
      // Try to parse as JSON first (for QR codes with structured data)
      const parsed = JSON.parse(data);
      if (parsed.address) {
        onSelectRecipient({ id: parsed.address, name: parsed.name || 'Unknown User', address: parsed.address });
      } else {
        onSelectRecipient({ id: data, name: 'Unknown User', address: data });
      }
    } catch {
      // If not JSON, treat as plain address
      onSelectRecipient({ id: data, name: 'Unknown User', address: data });
    }
  };

  const handleAddressSubmit = () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a valid address');
      return;
    }
    onSelectRecipient({ id: address.trim(), name: 'Manual Entry', address: address.trim() });
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.username && contact.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderContactsTab = () => (
    <View style={{ flex: 1, padding: Spacing.md }}>
      <TextInput
        style={{
          backgroundColor: Colors.gray100,
          padding: Spacing.md,
          borderRadius: BorderRadius.md,
          marginBottom: Spacing.md,
        }}
        placeholder="Search contacts..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      {error && (
          <View style={{ 
            backgroundColor: Colors.gray50, 
            padding: Spacing.md, 
            borderRadius: BorderRadius.md, 
            marginBottom: Spacing.md,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons name="warning" size={20} color={Colors.error} style={{ marginRight: Spacing.sm }} />
            <Text style={{ color: Colors.error, flex: 1 }}>{error}</Text>
            <TouchableOpacity 
              onPress={loadContacts}
              style={{ 
                backgroundColor: Colors.error, 
                paddingHorizontal: Spacing.sm, 
                paddingVertical: Spacing.xs,
                borderRadius: BorderRadius.sm 
              }}
            >
              <Text style={{ color: 'white', fontSize: 12 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: Spacing.md, color: Colors.gray600 }}>
            Loading friends...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: Spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: Colors.gray200,
              }}
              onPress={() => onSelectRecipient({ 
                 id: item.id,
                 name: item.name,
                 address: item.address || item.userId || ''
               })}
            >
              <Image
                source={{ uri: item.avatar || 'https://via.placeholder.com/40' }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginRight: Spacing.md,
                }}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '600', fontSize: 16 }}>
                    {item.name}
                  </Text>
                  {item.trustBadge && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={16} 
                      color={Colors.success} 
                      style={{ marginLeft: Spacing.xs }} 
                    />
                  )}
                </View>
                {item.username && (
                  <Text style={{ color: Colors.gray600, fontSize: 14 }}>
                    @{item.username}
                  </Text>
                )}
                {item.isRecent && (
                  <Text style={{ color: Colors.primary, fontSize: 12 }}>
                    Recent
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
                <Ionicons name="people-outline" size={48} color={Colors.gray400} />
                <Text style={{ color: Colors.gray600, marginTop: Spacing.md, textAlign: 'center' }}>
                  {searchQuery 
                    ? 'No users found matching your search' 
                    : 'No friends found'
                  }
                </Text>
                {!searchQuery && (
                  <Text style={{ color: Colors.gray500, marginTop: Spacing.sm, textAlign: 'center' }}>
                    Add friends to send money to them!
                  </Text>
                )}
              </View>
          )}
        />
      )}
    </View>
  );

  const renderQRTab = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
      <Ionicons name="qr-code-outline" size={80} color={Colors.gray400} />
      <Text style={{ fontSize: 18, fontWeight: '600', marginTop: Spacing.lg, marginBottom: Spacing.md }}>
        Scan QR Code
      </Text>
      <Text style={{ 
        textAlign: 'center', 
        color: Colors.gray600, 
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.xl 
      }}>
        Scan a QR code to quickly add a recipient's wallet address
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: Colors.primary,
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.md,
          borderRadius: BorderRadius.md,
          minWidth: 200,
          alignItems: 'center',
        }}
        onPress={() => setShowQRScanner(true)}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Open Scanner</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddressTab = () => (
    <View style={{ padding: Spacing.lg }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: Spacing.lg }}>
        Enter Wallet Address
      </Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: Colors.gray300,
          borderRadius: BorderRadius.md,
          padding: Spacing.lg,
          fontSize: 16,
          marginBottom: Spacing.xl,
          minHeight: 80,
          textAlignVertical: 'top',
        }}
        placeholder="Enter wallet address (0x...)"
        value={address}
        onChangeText={setAddress}
        multiline
      />
      <TouchableOpacity
        style={{
          backgroundColor: address.trim() ? Colors.primary : Colors.gray300,
          paddingVertical: Spacing.md,
          borderRadius: BorderRadius.md,
          alignItems: 'center',
        }}
        disabled={!address.trim()}
        onPress={handleAddressSubmit}
      >
        <Text style={{ 
          color: address.trim() ? 'white' : Colors.gray500, 
          fontWeight: '600' 
        }}>
          Add Recipient
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray200,
      }}>
        <TouchableOpacity onPress={onBack} style={{ padding: Spacing.xs }}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Select Recipient</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Bar */}
      <View style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray200,
      }}>
        {(['contacts', 'qr', 'address'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: Spacing.md,
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: Colors.primary,
            }}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={
                tab === 'contacts' ? 'people' :
                tab === 'qr' ? 'qr-code' : 'create'
              }
              size={16}
              color={activeTab === tab ? Colors.primary : Colors.gray500}
              style={{ marginRight: Spacing.xs }}
            />
            <Text style={{
              fontSize: 12,
              color: activeTab === tab ? Colors.primary : Colors.gray500,
              textTransform: 'capitalize',
            }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'contacts' && renderContactsTab()}
        {activeTab === 'qr' && renderQRTab()}
        {activeTab === 'address' && renderAddressTab()}
      </View>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isVisible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onQRCodeScanned={handleQRCodeScanned}
      />
    </View>
  );
};