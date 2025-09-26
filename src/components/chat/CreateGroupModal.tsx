import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from './Avatar';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (group: GroupData) => Promise<void>;
  contacts?: Contact[];
}

interface GroupData {
  name: string;
  description: string;
  members: Contact[];
  privacy: 'public' | 'private';
  avatar?: string;
  pin?: string; // PIN for private groups
}

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

// Sample contacts for development/fallback - now replaced with real contacts data
const SAMPLE_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Sarah Anderson',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Michael Roberts',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Emma Thompson',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    isOnline: false,
    lastSeen: '2 hours ago',
  },
  {
    id: '4',
    name: 'David Chen',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    isOnline: false,
    lastSeen: '1 day ago',
  },
  {
    id: '5',
    name: 'Lisa Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    isOnline: true,
  },
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
  onGroupCreated,
  contacts = [],
}) => {
  const [step, setStep] = useState<'details' | 'members' | 'review'>('details');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const [groupPin, setGroupPin] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setStep('details');
    setGroupName('');
    setGroupDescription('');
    setPrivacy('private');
    setGroupPin('');
    setSelectedMembers([]);
    setSearchQuery('');
    onClose();
  };

  const handleNext = () => {
    if (step === 'details') setStep('members');
    else if (step === 'members') setStep('review');
    else if (step === 'review') handleCreateGroup();
  };

  const handleBack = () => {
    if (step === 'members') setStep('details');
    else if (step === 'review') setStep('members');
  };

  const canProceed = () => {
    switch (step) {
      case 'details':
        return groupName.trim().length > 0 && (privacy === 'public' || groupPin.length === 4);
      case 'members':
        return selectedMembers.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleCreateGroup = async () => {
    console.log('🔄 Creating group - Starting process...');
    console.log('📋 Group details:', {
      name: groupName.trim(),
      description: groupDescription.trim(),
      memberCount: selectedMembers.length,
      members: selectedMembers.map(m => m.name),
      privacy,
      hasPin: privacy === 'private' && groupPin.length > 0
    });
    
    setIsLoading(true);
    
    try {
      const groupData: GroupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        members: selectedMembers,
        privacy,
        pin: privacy === 'private' ? groupPin : undefined,
      };
      
      console.log('📤 Calling parent onGroupCreated handler...');
      // Call the parent's onGroupCreated handler which will handle Firebase creation
      await onGroupCreated(groupData);
      
      console.log('✅ Group creation successful - closing modal');
      // Close modal - parent will handle navigation and success feedback
      handleClose();
    } catch (error) {
      console.error('❌ Group creation error in modal:', error);
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
      console.log('🏁 Group creation process completed (modal side)');
    }
  };

  const toggleMemberSelection = (contact: Contact) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(member => member.id === contact.id);
      if (isSelected) {
        return prev.filter(member => member.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  // Use real contacts data if available, otherwise empty array to show empty state
  const availableContacts = contacts.length > 0 ? contacts : [];
  const filteredContacts = availableContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={step === 'details' ? handleClose : handleBack}>
        <MaterialIcons 
          name={step === 'details' ? 'close' : 'arrow-back'} 
          size={24} 
          color={ChatTheme.textPrimary} 
        />
      </TouchableOpacity>
      <Typography variant="h6" style={styles.headerTitle}>
        {step === 'details' && 'Group Details'}
        {step === 'members' && 'Add Members'}
        {step === 'review' && 'Review Group'}
      </Typography>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderDetailsStep = () => (
    <ScrollView style={styles.stepContainer}>
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarPicker}>
          <MaterialIcons name="add-a-photo" size={32} color={ChatTheme.textSecondary} />
          <Typography variant="body2" color="textSecondary" style={styles.avatarText}>
            Add Group Photo
          </Typography>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>
          Group Name *
        </Typography>
        <TextInput
          style={styles.textInput}
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Enter group name"
          maxLength={50}
        />
        <Typography variant="caption" color="textSecondary" style={styles.characterCount}>
          {groupName.length}/50
        </Typography>
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>
          Description (Optional)
        </Typography>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={groupDescription}
          onChangeText={setGroupDescription}
          placeholder="What's this group about?"
          multiline
          numberOfLines={3}
          maxLength={200}
          textAlignVertical="top"
        />
        <Typography variant="caption" color="textSecondary" style={styles.characterCount}>
          {groupDescription.length}/200
        </Typography>
      </View>

      <View style={styles.inputGroup}>
        <Typography variant="body1" style={styles.inputLabel}>
          Privacy
        </Typography>
        <View style={styles.privacyOptions}>
          <TouchableOpacity
            style={[
              styles.privacyOption,
              privacy === 'private' && styles.selectedPrivacyOption
            ]}
            onPress={() => setPrivacy('private')}
          >
            <MaterialIcons 
              name="lock" 
              size={20} 
              color={privacy === 'private' ? ChatTheme.sendBubbleBackground : ChatTheme.textSecondary} 
            />
            <View style={styles.privacyOptionContent}>
              <Typography variant="h6" style={styles.privacyOptionTitle}>
                Private
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Only members can see group and messages. Requires PIN to join.
              </Typography>
            </View>
            {privacy === 'private' && (
              <MaterialIcons name="check-circle" size={20} color={ChatTheme.sendBubbleBackground} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.privacyOption,
              privacy === 'public' && styles.selectedPrivacyOption
            ]}
            onPress={() => setPrivacy('public')}
          >
            <MaterialIcons 
              name="public" 
              size={20} 
              color={privacy === 'public' ? ChatTheme.sendBubbleBackground : ChatTheme.textSecondary} 
            />
            <View style={styles.privacyOptionContent}>
              <Typography variant="h6" style={styles.privacyOptionTitle}>
                Public
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Anyone can find and join this group
              </Typography>
            </View>
            {privacy === 'public' && (
              <MaterialIcons name="check-circle" size={20} color={ChatTheme.sendBubbleBackground} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {privacy === 'private' && (
        <View style={styles.inputGroup}>
          <Typography variant="body1" style={styles.inputLabel}>
            Group PIN *
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.pinDescription}>
            Create a 4-digit PIN for members to join this private group
          </Typography>
          <TextInput
            style={styles.pinInput}
            value={groupPin}
            onChangeText={setGroupPin}
            placeholder="••••"
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
            textAlign="center"
          />
        </View>
      )}
    </ScrollView>
  );

  const renderMembersStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={ChatTheme.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => toggleMemberSelection(item)}
          >
            <Avatar name={item.name} imageUrl={item.avatar} online={item.isOnline} size="medium" />
            <View style={styles.contactInfo}>
              <Typography variant="h6">{item.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                {item.isOnline ? 'Online' : item.lastSeen}
              </Typography>
            </View>
            <View style={styles.contactAction}>
              {selectedMembers.some(member => member.id === item.id) ? (
                <MaterialIcons name="check-circle" size={24} color={ChatTheme.sendBubbleBackground} />
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
              No contacts found
            </Typography>
            <Typography variant="body2" color="textSecondary" style={styles.emptyContactsDescription}>
              {contacts.length === 0 ? 'Add some contacts first to create a group' : 'Try a different search term'}
            </Typography>
          </View>
        )}
        style={styles.contactsList}
      />
    </View>
  );

  const renderReviewStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Card style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewAvatar}>
            <MaterialIcons name="group" size={32} color={ChatTheme.sendBubbleBackground} />
          </View>
          <View style={styles.reviewInfo}>
            <Typography variant="h5" style={styles.reviewGroupName}>
              {groupName}
            </Typography>
            {groupDescription.length > 0 && (
              <Typography variant="body2" color="textSecondary" style={styles.reviewDescription}>
                {groupDescription}
              </Typography>
            )}
            <View style={styles.reviewMetadata}>
              <MaterialIcons 
                name={privacy === 'private' ? 'lock' : 'public'} 
                size={16} 
                color={ChatTheme.textSecondary} 
              />
              <Typography variant="caption" color="textSecondary" style={styles.reviewPrivacy}>
                {privacy === 'private' ? 'Private Group' : 'Public Group'}
              </Typography>
              {privacy === 'private' && (
                <>
                  <MaterialIcons name="vpn-key" size={16} color={ChatTheme.textSecondary} />
                  <Typography variant="caption" color="textSecondary">PIN Protected</Typography>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.reviewMembers}>
          <Typography variant="h6" style={styles.reviewMembersTitle}>
            Members ({selectedMembers.length + 1})
          </Typography>
          <View style={styles.membersList}>
            {/* You (admin) */}
            <View style={styles.memberItem}>
              <Avatar name="You" size="small" />
              <Typography variant="body2" style={styles.memberName}>You</Typography>
              <View style={styles.adminBadge}>
                <Typography variant="caption" style={styles.adminBadgeText}>Admin</Typography>
              </View>
            </View>
            {/* Selected members */}
            {selectedMembers.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <Avatar name={member.name} imageUrl={member.avatar} size="small" />
                <Typography variant="body2" style={styles.memberName}>{member.name}</Typography>
              </View>
            ))}
          </View>
        </View>

        {privacy === 'private' && (
          <View style={styles.walletNotice}>
            <MaterialIcons name="account-balance-wallet" size={20} color={Colors.info} />
            <View style={styles.walletNoticeContent}>
              <Typography variant="body2" style={styles.walletNoticeTitle}>
                Wallet Creation Available
              </Typography>
              <Typography variant="caption" color="textSecondary">
                After creating this private group, you can set up a shared wallet for group finances
              </Typography>
            </View>
          </View>
        )}
      </Card>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'details': return renderDetailsStep();
      case 'members': return renderMembersStep();
      case 'review': return renderReviewStep();
      default: return renderDetailsStep();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        {renderStepContent()}
        
        <View style={styles.footer}>
          <Button
            title={
              step === 'review' 
                ? (isLoading ? 'Creating Group...' : 'Create Group')
                : 'Continue'
            }
            onPress={handleNext}
            disabled={!canProceed() || isLoading}
            style={styles.continueButton}
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
  stepContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarPicker: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ChatTheme.background3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ChatTheme.border,
    borderStyle: 'dashed',
  },
  avatarText: {
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: ChatTheme.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    backgroundColor: ChatTheme.background1,
  },
  textArea: {
    height: 80,
  },
  characterCount: {
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  privacyOptions: {
    gap: Spacing.md,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ChatTheme.border,
  },
  selectedPrivacyOption: {
    borderColor: ChatTheme.sendBubbleBackground,
    backgroundColor: ChatTheme.sendBubbleBackground + '10',
  },
  privacyOptionContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  privacyOptionTitle: {
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  pinDescription: {
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: ChatTheme.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
    backgroundColor: ChatTheme.background1,
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
  reviewCard: {
    marginBottom: Spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  reviewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ChatTheme.background3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewGroupName: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  reviewDescription: {
    marginBottom: Spacing.sm,
  },
  reviewMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reviewPrivacy: {
    marginRight: Spacing.md,
  },
  reviewMembers: {
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
    paddingTop: Spacing.lg,
  },
  reviewMembersTitle: {
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  membersList: {
    gap: Spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  adminBadge: {
    backgroundColor: ChatTheme.sendBubbleBackground,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  adminBadgeText: {
    color: ChatTheme.background1,
    fontWeight: '500',
  },
  walletNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    backgroundColor: Colors.info + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.info + '30',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  walletNoticeContent: {
    flex: 1,
  },
  walletNoticeTitle: {
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
  },
  continueButton: {
    width: '100%',
  },
});