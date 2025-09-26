import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Avatar } from './Avatar';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';
import chatService, { GroupDetails, GroupMember } from '../../services/chatService';
import authService from '../../services/authService';
import friendService from '../../services/friendService';

interface AddMembersModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupDetails: GroupDetails | null;
  currentMembers: GroupMember[];
  isAdmin: boolean;
  onMembersAdded?: (addedMembers: Contact[]) => void;
}

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
  email?: string;
}

export const AddMembersModal: React.FC<AddMembersModalProps> = ({
  visible,
  onClose,
  groupId,
  groupDetails,
  currentMembers,
  isAdmin,
  onMembersAdded,
}) => {
  console.log('🔄 [AddMembersModal] Rendering modal with props:', {
    visible,
    groupId,
    groupName: groupDetails?.name,
    currentMemberCount: currentMembers.length,
    isAdmin,
  });

  // State management
  const [selectedMembers, setSelectedMembers] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load available contacts when modal opens
  useEffect(() => {
    if (visible) {
      console.log('🔄 [AddMembersModal] Modal opened - loading available contacts');
      loadAvailableContacts();
    } else {
      // Reset state when modal closes
      console.log('🔄 [AddMembersModal] Modal closed - resetting state');
      handleClose();
    }
  }, [visible]);

  const loadAvailableContacts = async () => {
    try {
      setIsLoadingContacts(true);
      setError(null);
      console.log('🔄 [AddMembersModal] Loading contacts from backend...');

      // Get user session to make authenticated requests
      const userSession = await authService.getSession();
      if (!userSession.success || !userSession.user) {
        throw new Error('User not authenticated');
      }

      // Fetch real friends/contacts from the backend
      console.log('🔄 [AddMembersModal] Fetching friends from backend API...');
      const friendsResponse = await friendService.getFriends();
      
      if (!friendsResponse.success) {
        throw new Error('Failed to load friends list');
      }
      
      // Transform friends data to Contact format
      const realContacts: Contact[] = friendsResponse.friends.map(friend => ({
        id: friend.id,
        name: friend.name,
        email: friend.email,
        avatar: undefined, // Friends service doesn't include avatar yet
        isOnline: undefined, // Will need to implement online status
        lastSeen: undefined,
      }));
      
      console.log('✅ [AddMembersModal] Friends loaded from API:', {
        totalFriends: realContacts.length,
        friends: realContacts.map(f => ({ id: f.id, name: f.name, email: f.email }))
      });

      // Filter out contacts who are already members
      const currentMemberIds = currentMembers.map(member => member.id);
      const filteredContacts = realContacts.filter(
        contact => !currentMemberIds.includes(contact.id)
      );

      console.log('✅ [AddMembersModal] Available contacts loaded:', {
        totalFriends: realContacts.length,
        availableContacts: filteredContacts.length,
        filteredOutExisting: realContacts.length - filteredContacts.length,
      });

      setAvailableContacts(filteredContacts);
    } catch (error) {
      console.error('❌ [AddMembersModal] Error loading contacts:', error);
      setError('Failed to load contacts. Please try again.');
      setAvailableContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleClose = () => {
    console.log('🔄 [AddMembersModal] Closing modal and resetting state');
    setSelectedMembers([]);
    setSearchQuery('');
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      console.log('⚠️ [AddMembersModal] No members selected for addition');
      return;
    }

    console.log('🔄 [AddMembersModal] Adding members to group:', {
      groupId,
      selectedCount: selectedMembers.length,
      members: selectedMembers.map(m => ({ id: m.id, name: m.name })),
    });

    setIsLoading(true);
    setError(null);

    try {
      // Add each member to the group using the chatService
      const results = await Promise.allSettled(
        selectedMembers.map(member => 
          chatService.inviteToGroup(groupId, member.id, member.name, member.email)
        )
      );

      // Check results
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      console.log('📊 [AddMembersModal] Member addition results:', {
        successful: successful.length,
        failed: failed.length,
        total: results.length,
      });

      if (failed.length > 0) {
        console.error('❌ [AddMembersModal] Some invitations failed:', failed);
        // Show partial success message
        const failedCount = failed.length;
        const successCount = successful.length;
        
        if (successCount > 0) {
          Alert.alert(
            'Partial Success',
            `${successCount} member(s) added successfully, but ${failedCount} invitation(s) failed.`
          );
        } else {
          throw new Error('All invitations failed');
        }
      } else {
        console.log('✅ [AddMembersModal] All members added successfully');
        Alert.alert('Success', `${selectedMembers.length} member(s) added to the group!`);
      }

      // Notify parent component
      if (onMembersAdded && successful.length > 0) {
        const addedMembers = selectedMembers.slice(0, successful.length);
        onMembersAdded(addedMembers);
      }

      // Close modal
      handleClose();
    } catch (error) {
      console.error('❌ [AddMembersModal] Error adding members:', error);
      setError('Failed to add members. Please try again.');
      Alert.alert('Error', 'Failed to add members to the group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMemberSelection = (contact: Contact) => {
    console.log('🔄 [AddMembersModal] Toggling member selection:', {
      contactId: contact.id,
      contactName: contact.name,
      currentlySelected: selectedMembers.some(m => m.id === contact.id),
    });

    setSelectedMembers(prev => {
      const isSelected = prev.some(member => member.id === contact.id);
      if (isSelected) {
        return prev.filter(member => member.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  // Filter contacts based on search query
  const filteredContacts = availableContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  console.log('🔄 [AddMembersModal] Current state:', {
    availableContacts: availableContacts.length,
    filteredContacts: filteredContacts.length,
    selectedMembers: selectedMembers.length,
    searchQuery,
    isLoadingContacts,
    isLoading,
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleClose}>
        <MaterialIcons name="close" size={24} color={ChatTheme.textPrimary} />
      </TouchableOpacity>
      <Typography variant="h6" style={styles.headerTitle}>
        Add Members
      </Typography>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderContent = () => {
    if (isLoadingContacts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ChatTheme.sendBubbleBackground} />
          <Typography variant="body2" color="textSecondary" style={styles.loadingText}>
            Loading contacts...
          </Typography>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          <Typography variant="h6" style={styles.errorTitle}>
            Error Loading Contacts
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.errorMessage}>
            {error}
          </Typography>
          <Button
            title="Retry"
            onPress={loadAvailableContacts}
            style={styles.retryButton}
          />
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {/* Group Info */}
        <View style={styles.groupInfoContainer}>
          <Avatar 
            name={groupDetails?.name || 'Group'} 
            imageUrl={groupDetails?.avatar}
            size="medium" 
          />
          <View style={styles.groupInfo}>
            <Typography variant="h6" style={styles.groupName}>
              {groupDetails?.name || 'Unknown Group'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {currentMembers.length} member{currentMembers.length !== 1 ? 's' : ''}
              {isAdmin && ' • You are admin'}
            </Typography>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={ChatTheme.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Selected Members */}
        {selectedMembers.length > 0 && (
          <View style={styles.selectedMembersContainer}>
            <Typography variant="body2" style={styles.selectedMembersTitle}>
              Selected ({selectedMembers.length})
            </Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.selectedMembersList}>
                {selectedMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.selectedMember}
                    onPress={() => toggleMemberSelection(member)}
                  >
                    <Avatar name={member.name} imageUrl={member.avatar} size="small" />
                    <View style={styles.removeMemberButton}>
                      <MaterialIcons name="close" size={12} color={ChatTheme.background1} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Contacts List */}
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => toggleMemberSelection(item)}
            >
              <Avatar 
                name={item.name} 
                imageUrl={item.avatar} 
                online={item.isOnline} 
                size="medium" 
              />
              <View style={styles.contactInfo}>
                <Typography variant="h6">{item.name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {item.isOnline ? 'Online' : item.lastSeen || 'Offline'}
                </Typography>
              </View>
              <View style={styles.contactAction}>
                {selectedMembers.some(member => member.id === item.id) ? (
                  <MaterialIcons 
                    name="check-circle" 
                    size={24} 
                    color={ChatTheme.sendBubbleBackground} 
                  />
                ) : (
                  <View style={styles.uncheckedCircle} />
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContactsContainer}>
              <MaterialIcons name="people-outline" size={48} color={ChatTheme.textSecondary} />
              <Typography variant="h6" style={styles.emptyContactsTitle}>
                {searchQuery ? 'No contacts found' : 'No contacts available'}
              </Typography>
              <Typography variant="body2" color="textSecondary" style={styles.emptyContactsDescription}>
                {searchQuery 
                  ? 'Try a different search term' 
                  : availableContacts.length === 0 
                    ? 'No friends available to add. Add some friends first!' 
                    : 'All your friends are already in this group'
                }
              </Typography>
            </View>
          )}
          style={styles.contactsList}
        />
      </View>
    );
  };

  const canAddMembers = selectedMembers.length > 0 && !isLoading;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        {renderContent()}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={
              isLoading 
                ? `Adding ${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''}...`
                : `Add ${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''}`
            }
            onPress={handleAddMembers}
            disabled={!canAddMembers}
            style={[
              styles.addButton,
              !canAddMembers && styles.disabledButton
            ]}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatTheme.background1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSpacer: {
    width: 24,
  },
  contentContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  errorTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    color: Colors.error,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    minWidth: 100,
  },
  groupInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: ChatTheme.background3,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  groupInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  groupName: {
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChatTheme.background3,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  selectedMembersContainer: {
    marginBottom: Spacing.lg,
  },
  selectedMembersTitle: {
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  selectedMembersList: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  selectedMember: {
    position: 'relative',
    alignItems: 'center',
  },
  removeMemberButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ChatTheme.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  contactInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  contactAction: {
    marginLeft: Spacing.md,
  },
  uncheckedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ChatTheme.border,
  },
  emptyContactsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyContactsTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    color: ChatTheme.textPrimary,
  },
  emptyContactsDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
  },
  addButton: {
    width: '100%',
  },
  disabledButton: {
    opacity: 0.5,
  },
});