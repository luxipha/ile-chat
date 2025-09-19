import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Button } from './Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  isRecent?: boolean;
}

interface ContactSelectorProps {
  visible: boolean;
  onClose: () => void;
  onContactSelect: (contact: Contact) => void;
  title: string;
  subtitle?: string;
}

export const ContactSelector: React.FC<ContactSelectorProps> = ({
  visible,
  onClose,
  onContactSelect,
  title,
  subtitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const mockContacts: Contact[] = [
    {
      id: '1',
      name: 'Sarah Anderson',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      isRecent: true,
    },
    {
      id: '2',
      name: 'Michael Roberts',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      isRecent: true,
    },
    {
      id: '3',
      name: 'Emma Thompson',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      isRecent: true,
    },
    {
      id: '4',
      name: 'David Chen',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
    {
      id: '5',
      name: 'Lisa Parker',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    },
    {
      id: '6',
      name: 'Tom Wilson',
      avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    },
    {
      id: '7',
      name: 'Alex Rodriguez',
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    },
    {
      id: '8',
      name: 'Nina Kumar',
    },
    {
      id: '9',
      name: 'John Martinez',
    },
  ];

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentContacts = filteredContacts.filter(contact => contact.isRecent);
  const allContacts = filteredContacts.filter(contact => !contact.isRecent);

  const handleContactPress = (contact: Contact) => {
    onContactSelect(contact);
    onClose();
  };

  const renderContact = (contact: Contact) => (
    <TouchableOpacity
      key={contact.id}
      style={styles.contactItem}
      onPress={() => handleContactPress(contact)}
    >
      <View style={styles.contactAvatar}>
        {contact.avatar ? (
          <MaterialIcons name="person" size={24} color={Colors.primary} />
        ) : (
          <Typography variant="h6" style={styles.avatarText}>
            {contact.name.split(' ').map(n => n[0]).join('')}
          </Typography>
        )}
      </View>
      <View style={styles.contactInfo}>
        <Typography variant="h6">{contact.name}</Typography>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={Colors.gray400} />
    </TouchableOpacity>
  );

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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Typography variant="h3">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </View>
          <View style={styles.headerSpacer} />
        </View>

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

        {/* Content */}
        <ScrollView style={styles.content}>
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

          {/* No results */}
          {filteredContacts.length === 0 && (
            <View style={styles.noResults}>
              <MaterialIcons name="search-off" size={48} color={Colors.gray400} />
              <Typography variant="h6" style={styles.noResultsTitle}>No contacts found</Typography>
              <Typography variant="body2" color="textSecondary">
                Try adjusting your search
              </Typography>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title="Share via Link"
            icon="link"
            variant="outline"
            onPress={() => {
              onClose();
              Alert.alert('Share Link', 'Profile link copied to clipboard');
            }}
            style={styles.quickActionButton}
          />
          <Button
            title="More Options"
            icon="more-horiz"
            variant="ghost"
            onPress={() => {
              onClose();
              Alert.alert('More Options', 'QR code, social media, etc.');
            }}
            style={styles.quickActionButton}
          />
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
  closeButton: {
    padding: Spacing.xs,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    margin: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
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
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  noResultsTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  quickActionButton: {
    flex: 1,
  },
});