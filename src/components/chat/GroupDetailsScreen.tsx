import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from './Avatar';
import { GroupWallet } from '../group/GroupWallet';
import { ContributionFlow } from '../group/ContributionFlow';
import { GroupProposal } from '../group/GroupProposal';
import { GroupWalletCreation } from '../group/GroupWalletCreation';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface GroupDetailsScreenProps {
  onBack: () => void;
  groupId: string;
  groupName: string;
  groupAvatar?: string;
  isAdmin?: boolean;
  isPrivateGroup?: boolean;
  hasWallet?: boolean;
}

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member';
  isOnline?: boolean;
  lastSeen?: string;
}

interface GroupSettings {
  name: string;
  description: string;
  privacy: 'public' | 'private';
  allowMembersToAddOthers: boolean;
  onlyAdminsCanSend: boolean;
  disappearingMessages: boolean;
}

const SAMPLE_MEMBERS: GroupMember[] = [
  {
    id: '1',
    name: 'You',
    role: 'admin',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Sarah Anderson',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    role: 'admin',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Michael Roberts',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    role: 'member',
    isOnline: true,
  },
  {
    id: '4',
    name: 'Emma Thompson',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    role: 'member',
    isOnline: false,
    lastSeen: '2 hours ago',
  },
  {
    id: '5',
    name: 'David Chen',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    role: 'member',
    isOnline: false,
    lastSeen: '1 day ago',
  },
];

export const GroupDetailsScreen: React.FC<GroupDetailsScreenProps> = ({
  onBack,
  groupId,
  groupName,
  groupAvatar,
  isAdmin = true,
  isPrivateGroup = true,
  hasWallet = false,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'wallet' | 'media'>('members');
  const [showContributionFlow, setShowContributionFlow] = useState(false);
  const [showGroupProposal, setShowGroupProposal] = useState(false);
  const [showWalletCreation, setShowWalletCreation] = useState(false);
  const [groupHasWallet, setGroupHasWallet] = useState(hasWallet);
  const [members, setMembers] = useState<GroupMember[]>(SAMPLE_MEMBERS);
  const [groupSettings, setGroupSettings] = useState<GroupSettings>({
    name: groupName,
    description: 'Discuss real estate investments and market trends',
    privacy: 'private',
    allowMembersToAddOthers: true,
    onlyAdminsCanSend: false,
    disappearingMessages: false,
  });
  const [isEditing, setIsEditing] = useState(false);

  const handlePromoteToAdmin = (memberId: string) => {
    Alert.alert(
      'Promote to Admin',
      'Are you sure you want to make this member an admin?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: () => {
            setMembers(prev => prev.map(member =>
              member.id === memberId ? { ...member, role: 'admin' } : member
            ));
          }
        }
      ]
    );
  };

  const handleRemoveMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member?.name} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setMembers(prev => prev.filter(m => m.id !== memberId));
          }
        }
      ]
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            onBack();
            // Handle leave group logic
          }
        }
      ]
    );
  };

  const handleSaveSettings = () => {
    setIsEditing(false);
    Alert.alert('Success', 'Group settings updated successfully!');
  };

  const handleContributionComplete = (contributionData: any) => {
    Alert.alert('Success', `Contribution of ${contributionData.amount} ${contributionData.token.symbol} completed!`);
    setShowContributionFlow(false);
  };

  const handleProposalCreated = (proposalData: any) => {
    Alert.alert('Success', `Proposal "${proposalData.title}" has been created!`);
    setShowGroupProposal(false);
  };

  const handleWalletCreated = (walletConfig: any) => {
    setGroupHasWallet(true);
    setShowWalletCreation(false);
    Alert.alert('Success', 'Group wallet has been created successfully! You can now accept contributions and manage group finances.');
  };

  const renderTabBar = () => {
    const tabs = [
      { id: 'members', title: 'Members', icon: 'group' },
      { id: 'settings', title: 'Settings', icon: 'settings' },
      ...(isPrivateGroup ? [{ id: 'wallet', title: 'Wallet', icon: 'account-balance-wallet' }] : []),
      { id: 'media', title: 'Media', icon: 'photo-library' },
    ];

    return (
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabItem,
              activeTab === tab.id && styles.activeTabItem
            ]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? ChatTheme.sendBubbleBackground : ChatTheme.textSecondary}
            />
            <Typography
              variant="caption"
              style={StyleSheet.flatten([
                styles.tabTitle,
                activeTab === tab.id && styles.activeTabTitle
              ])}
            >
              {tab.title}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMemberItem = ({ item }: { item: GroupMember }) => (
    <View style={styles.memberItem}>
      <Avatar
        name={item.name}
        imageUrl={item.avatar}
        online={item.isOnline}
        size="medium"
      />
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Typography variant="h6">{item.name}</Typography>
          {item.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Typography variant="caption" style={styles.adminBadgeText}>
                Admin
              </Typography>
            </View>
          )}
        </View>
        <Typography variant="caption" color="textSecondary">
          {item.isOnline ? 'Online' : item.lastSeen || 'Last seen recently'}
        </Typography>
      </View>
      {isAdmin && item.id !== '1' && (
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={styles.memberActionButton}
            onPress={() => {
              if (item.role === 'member') {
                handlePromoteToAdmin(item.id);
              } else {
                // Show admin options
                Alert.alert(
                  'Admin Options',
                  'Choose an action',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove Admin', onPress: () => {
                      setMembers(prev => prev.map(member =>
                        member.id === item.id ? { ...member, role: 'member' } : member
                      ));
                    }},
                    { text: 'Remove from Group', style: 'destructive', onPress: () => handleRemoveMember(item.id) },
                  ]
                );
              }
            }}
          >
            <MaterialIcons name="more-vert" size={20} color={ChatTheme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderMembersTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.actionCard}>
        <TouchableOpacity style={styles.actionItem}>
          <MaterialIcons name="person-add" size={24} color={ChatTheme.sendBubbleBackground} />
          <Typography variant="h6" style={styles.actionText}>
            Add Members
          </Typography>
          <MaterialIcons name="chevron-right" size={20} color={ChatTheme.textSecondary} />
        </TouchableOpacity>
      </Card>

      <Card style={styles.membersCard}>
        <View style={styles.membersHeader}>
          <Typography variant="h6">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Typography>
        </View>
        
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMemberItem}
          scrollEnabled={false}
        />
      </Card>
    </View>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.settingsCard}>
        <View style={styles.settingsHeader}>
          <Typography variant="h6">Group Information</Typography>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editButton}
            >
              <MaterialIcons
                name={isEditing ? 'check' : 'edit'}
                size={20}
                color={ChatTheme.sendBubbleBackground}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.settingItem}>
          <Typography variant="body2" style={styles.settingLabel}>
            Group Name
          </Typography>
          {isEditing ? (
            <TextInput
              style={styles.settingInput}
              value={groupSettings.name}
              onChangeText={(text) => setGroupSettings(prev => ({ ...prev, name: text }))}
            />
          ) : (
            <Typography variant="body1">{groupSettings.name}</Typography>
          )}
        </View>

        <View style={styles.settingItem}>
          <Typography variant="body2" style={styles.settingLabel}>
            Description
          </Typography>
          {isEditing ? (
            <TextInput
              style={[styles.settingInput, styles.textArea]}
              value={groupSettings.description}
              onChangeText={(text) => setGroupSettings(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />
          ) : (
            <Typography variant="body1">{groupSettings.description}</Typography>
          )}
        </View>

        {isEditing && (
          <Button
            title="Save Changes"
            onPress={handleSaveSettings}
            style={styles.saveButton}
          />
        )}
      </Card>

      {isAdmin && (
        <Card style={styles.settingsCard}>
          <Typography variant="h6" style={styles.settingsCardTitle}>
            Privacy & Permissions
          </Typography>

          <View style={styles.toggleSetting}>
            <View style={styles.toggleInfo}>
              <Typography variant="body1">Allow members to add others</Typography>
              <Typography variant="caption" color="textSecondary">
                Let group members invite new people
              </Typography>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                groupSettings.allowMembersToAddOthers && styles.toggleActive
              ]}
              onPress={() => setGroupSettings(prev => ({
                ...prev,
                allowMembersToAddOthers: !prev.allowMembersToAddOthers
              }))}
            >
              <View style={[
                styles.toggleThumb,
                groupSettings.allowMembersToAddOthers && styles.toggleThumbActive
              ]} />
            </TouchableOpacity>
          </View>

          <View style={styles.toggleSetting}>
            <View style={styles.toggleInfo}>
              <Typography variant="body1">Only admins can send messages</Typography>
              <Typography variant="caption" color="textSecondary">
                Restrict messaging to group administrators
              </Typography>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                groupSettings.onlyAdminsCanSend && styles.toggleActive
              ]}
              onPress={() => setGroupSettings(prev => ({
                ...prev,
                onlyAdminsCanSend: !prev.onlyAdminsCanSend
              }))}
            >
              <View style={[
                styles.toggleThumb,
                groupSettings.onlyAdminsCanSend && styles.toggleThumbActive
              ]} />
            </TouchableOpacity>
          </View>

          <View style={styles.toggleSetting}>
            <View style={styles.toggleInfo}>
              <Typography variant="body1">Disappearing messages</Typography>
              <Typography variant="caption" color="textSecondary">
                Messages automatically delete after 24 hours
              </Typography>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                groupSettings.disappearingMessages && styles.toggleActive
              ]}
              onPress={() => setGroupSettings(prev => ({
                ...prev,
                disappearingMessages: !prev.disappearingMessages
              }))}
            >
              <View style={[
                styles.toggleThumb,
                groupSettings.disappearingMessages && styles.toggleThumbActive
              ]} />
            </TouchableOpacity>
          </View>
        </Card>
      )}

      <Card style={styles.dangerCard}>
        <TouchableOpacity style={styles.dangerAction} onPress={handleLeaveGroup}>
          <MaterialIcons name="exit-to-app" size={24} color={Colors.error} />
          <Typography variant="h6" style={styles.dangerText}>
            Leave Group
          </Typography>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );

  const renderWalletTab = () => {
    if (!groupHasWallet) {
      return (
        <View style={styles.tabContent}>
          <Card style={styles.noWalletCard}>
            <View style={styles.noWalletIcon}>
              <MaterialIcons name="account-balance-wallet" size={48} color={ChatTheme.textSecondary} />
            </View>
            <Typography variant="h6" style={styles.noWalletTitle}>
              No Group Wallet
            </Typography>
            <Typography variant="body2" color="textSecondary" style={styles.noWalletDescription}>
              Create a shared wallet to manage group finances, accept contributions, and make collective investments.
            </Typography>
            
            {isAdmin ? (
              <Button
                title="Create Group Wallet"
                onPress={() => setShowWalletCreation(true)}
                style={styles.createWalletButton}
              />
            ) : (
              <Typography variant="caption" color="textSecondary" style={styles.adminOnlyText}>
                Only group admins can create a wallet
              </Typography>
            )}
          </Card>
          
          <Card style={styles.walletBenefitsCard}>
            <Typography variant="h6" style={styles.benefitsTitle}>
              Wallet Benefits
            </Typography>
            <View style={styles.benefitsList}>
              {[
                'Accept member contributions',
                'Multi-signature security',
                'Transparent transaction history',
                'Collective investment decisions',
                'Automated yield distribution',
                'Real-time balance tracking'
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                  <Typography variant="body2" style={styles.benefitText}>
                    {benefit}
                  </Typography>
                </View>
              ))}
            </View>
          </Card>
        </View>
      );
    }

    return (
      <GroupWallet
        groupId={groupId}
        isAdmin={isAdmin}
        onContribute={() => setShowContributionFlow(true)}
        onPropose={() => setShowGroupProposal(true)}
        onWithdraw={() => Alert.alert('Withdraw', 'Withdrawal functionality coming soon!')}
      />
    );
  };

  const renderMediaTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.mediaCard}>
        <View style={styles.emptyState}>
          <MaterialIcons name="photo-library" size={48} color={ChatTheme.textSecondary} />
          <Typography variant="h6" style={styles.emptyTitle}>
            No Media Shared
          </Typography>
          <Typography variant="body2" color="textSecondary" style={styles.emptyText}>
            Photos, videos, and documents shared in this group will appear here
          </Typography>
        </View>
      </Card>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'members': return renderMembersTab();
      case 'settings': return renderSettingsTab();
      case 'wallet': return renderWalletTab();
      case 'media': return renderMediaTab();
      default: return renderMembersTab();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={ChatTheme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Typography variant="h3">{groupSettings.name}</Typography>
          <Typography variant="body2" color="textSecondary">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Typography>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Group Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.groupAvatar}>
          <MaterialIcons name="group" size={48} color={ChatTheme.sendBubbleBackground} />
        </View>
      </View>

      {renderTabBar()}
      {renderTabContent()}

      {/* Contribution Flow Modal */}
      <ContributionFlow
        visible={showContributionFlow}
        onClose={() => setShowContributionFlow(false)}
        groupId={groupId}
        groupName={groupSettings.name}
        onContributionComplete={handleContributionComplete}
      />

      {/* Group Proposal Modal */}
      <GroupProposal
        visible={showGroupProposal}
        onClose={() => setShowGroupProposal(false)}
        groupId={groupId}
        groupName={groupSettings.name}
        onProposalCreated={handleProposalCreated}
      />

      {/* Wallet Creation Modal */}
      <GroupWalletCreation
        visible={showWalletCreation}
        onClose={() => setShowWalletCreation(false)}
        groupType="contribution"
        groupName={groupSettings.name}
        memberAddresses={members.map(m => `0x${m.id}`)}
        onWalletCreated={handleWalletCreated}
      />
    </View>
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
  backButton: {
    padding: Spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ChatTheme.background3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: ChatTheme.background1,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: ChatTheme.sendBubbleBackground,
  },
  tabTitle: {
    marginTop: Spacing.xs,
    color: ChatTheme.textSecondary,
  },
  activeTabTitle: {
    color: ChatTheme.sendBubbleBackground,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  actionCard: {
    marginBottom: Spacing.md,
    paddingVertical: 0,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  actionText: {
    marginLeft: Spacing.md,
    flex: 1,
    color: ChatTheme.sendBubbleBackground,
  },
  membersCard: {
    paddingVertical: Spacing.md,
  },
  membersHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
    marginBottom: Spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  memberInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  adminBadge: {
    backgroundColor: ChatTheme.sendBubbleBackground,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  adminBadgeText: {
    color: ChatTheme.background1,
    fontWeight: '500',
  },
  memberActions: {
    marginLeft: Spacing.md,
  },
  memberActionButton: {
    padding: Spacing.sm,
  },
  settingsCard: {
    marginBottom: Spacing.md,
  },
  settingsCardTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  editButton: {
    padding: Spacing.sm,
  },
  settingItem: {
    marginBottom: Spacing.md,
  },
  settingLabel: {
    fontWeight: '500',
    marginBottom: Spacing.sm,
    color: ChatTheme.textSecondary,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: ChatTheme.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  toggleSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: ChatTheme.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: ChatTheme.sendBubbleBackground,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ChatTheme.background1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  dangerCard: {
    backgroundColor: Colors.error + '10',
    borderColor: Colors.error + '30',
    borderWidth: 1,
  },
  dangerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  dangerText: {
    marginLeft: Spacing.md,
    color: Colors.error,
  },
  mediaCard: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    color: ChatTheme.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  noWalletCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  noWalletIcon: {
    marginBottom: Spacing.lg,
  },
  noWalletTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  noWalletDescription: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  createWalletButton: {
    alignSelf: 'center',
  },
  adminOnlyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  walletBenefitsCard: {
    marginBottom: Spacing.md,
  },
  benefitsTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  benefitsList: {
    paddingVertical: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    flex: 1,
    marginLeft: 8,
  },
});