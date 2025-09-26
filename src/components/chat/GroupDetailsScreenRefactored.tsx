import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { AddMembersModal } from './AddMembersModal';
import { ContributionFlow } from '../group/ContributionFlow';
import { ContributionGroupWallet } from '../group/ContributionGroupWallet';
import { GroupMembersTab } from '../group/GroupMembersTab';
import { GroupMediaTab } from '../group/GroupMediaTab';
import { ChatTheme } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';
import chatService, { GroupDetails, GroupMember } from '../../services/chatService';
import authService from '../../services/authService';

interface GroupDetailsScreenProps {
  onBack: () => void;
  groupId: string;
  groupName?: string;
  groupAvatar?: string;
  isAdmin?: boolean;
  isPrivateGroup?: boolean;
  hasWallet?: boolean;
}

export const GroupDetailsScreen: React.FC<GroupDetailsScreenProps> = ({
  onBack,
  groupId,
  groupName: propGroupName,
  groupAvatar: propGroupAvatar,
  isAdmin: propIsAdmin,
  isPrivateGroup: propIsPrivateGroup,
  hasWallet: propHasWallet,
}) => {
  // UI State
  const [activeTab, setActiveTab] = useState<'members' | 'wallet' | 'media'>('members');
  const [showContributionFlow, setShowContributionFlow] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);

  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Enhanced Error & Loading States
  const [retryCount, setRetryCount] = useState(0);
  const [networkError, setNetworkError] = useState(false);

  // Derived state
  const isAdmin = groupDetails && currentUserId ? groupDetails.admins.includes(currentUserId) : propIsAdmin || false;
  const isPrivateGroup = groupDetails?.settings?.privacy === 'private' || propIsPrivateGroup !== false;
  const groupHasWallet = groupDetails?.hasWallet || propHasWallet || false;

  console.log('🔄 [GroupDetailsScreen] Rendering with:', {
    groupId,
    activeTab,
    isAdmin,
    hasWallet: groupHasWallet,
    memberCount: members.length,
  });

  // Enhanced error handling utilities
  const handleError = (error: any, operation: string, showAlert: boolean = true) => {
    console.error(`❌ [GroupDetailsScreen] ${operation} failed:`, error);
    
    const errorMessage = error?.message || `Failed to ${operation.toLowerCase()}`;
    const isNetworkError = errorMessage.includes('network') || errorMessage.includes('offline');
    
    setNetworkError(isNetworkError);
    setError(errorMessage);
    
    if (showAlert && !isNetworkError) {
      Alert.alert(
        'Error',
        errorMessage,
        [
          { text: 'Retry', onPress: () => retryOperation(operation) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };
  
  const retryOperation = async (operation: string) => {
    console.log('🔄 [GroupDetailsScreen] Retrying operation:', operation);
    setRetryCount(prev => prev + 1);
    
    try {
      switch (operation) {
        case 'Load Group Data':
          await setupRealtimeListeners();
          break;
        default:
          console.warn('⚠️ Unknown operation to retry:', operation);
      }
    } catch (error) {
      handleError(error, `Retry ${operation}`, false);
    }
  };

  // Set up real-time listeners for group data
  useEffect(() => {
    if (!groupId) return;

    let unsubscribeGroupDetails: (() => void) | null = null;
    let unsubscribeMembers: (() => void) | null = null;

    const setupRealtimeListeners = async () => {
      try {
        setLoading(true);
        setError(null);
        setNetworkError(false);
        console.log('🔄 Setting up real-time listeners for group:', groupId);

        // Get current user ID
        const userSession = await authService.getSession();
        if (userSession.success && userSession.user) {
          setCurrentUserId(userSession.user.id);
        }

        // Set up real-time listener for group details
        unsubscribeGroupDetails = chatService.subscribeToGroupDetails(groupId, (groupDetails) => {
          console.log('🔄 [GroupDetailsScreen] Real-time group details update received');
          
          try {
            if (groupDetails) {
              console.log('✅ [GroupDetailsScreen] Group details updated:', {
                groupId: groupDetails.id,
                name: groupDetails.name,
                memberCount: groupDetails.participants.length,
                adminCount: groupDetails.admins.length,
              });
              setGroupDetails(groupDetails);
              setError(null);
              setNetworkError(false);
            } else {
              console.warn('⚠️ [GroupDetailsScreen] Group details is null, group not found');
              setError('Group not found or access denied');
            }
          } catch (detailsError) {
            console.error('❌ [GroupDetailsScreen] Error processing group details:', detailsError);
            handleError(detailsError, 'Process Group Details', false);
          }
          setLoading(false);
        });

        // Set up real-time listener for group members
        unsubscribeMembers = chatService.subscribeToGroupMembers(groupId, (members) => {
          console.log('🔄 [GroupDetailsScreen] Real-time group members update received');
          
          try {
            console.log('✅ [GroupDetailsScreen] Members updated:', {
              totalMembers: members.length,
              adminCount: members.filter(m => m.role === 'admin').length,
              memberCount: members.filter(m => m.role === 'member').length,
            });
            setMembers(members);
            setError(null);
          } catch (membersError) {
            console.error('❌ [GroupDetailsScreen] Error processing group members:', membersError);
            handleError(membersError, 'Process Group Members', false);
          }
        });

      } catch (error) {
        console.error('❌ [GroupDetailsScreen] Error setting up real-time listeners:', error);
        handleError(error, 'Load Group Data');
        setLoading(false);
      }
    };

    setupRealtimeListeners();

    // Cleanup listeners on unmount
    return () => {
      console.log('🧹 Cleaning up group listeners');
      if (unsubscribeGroupDetails) {
        unsubscribeGroupDetails();
      }
      if (unsubscribeMembers) {
        unsubscribeMembers();
      }
    };
  }, [groupId]);

  const handlePromoteToAdmin = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) {
      console.warn('⚠️ [GroupDetailsScreen] Member not found:', memberId);
      return;
    }

    Alert.alert(
      'Promote to Admin',
      `Are you sure you want to make ${member.name} an admin?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
        },
        {
          text: 'Promote',
          onPress: async () => {
            try {
              console.log('🚀 [GroupDetailsScreen] Starting admin promotion:', { 
                groupId, 
                memberId, 
                memberName: member.name,
              });
              
              await chatService.updateMemberRole(groupId, memberId, true);
              
              console.log('✅ [GroupDetailsScreen] Member promoted to admin successfully');
              Alert.alert('Success', `${member.name} has been promoted to admin.`);
              
            } catch (error) {
              console.error('❌ [GroupDetailsScreen] Failed to promote member:', error);
              handleError(error, 'Promote Member');
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) {
      console.warn('⚠️ [GroupDetailsScreen] Member not found for removal:', memberId);
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the group?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚀 [GroupDetailsScreen] Starting member removal:', { 
                groupId, 
                memberId, 
                memberName: member.name
              });
              
              await chatService.removeMemberFromGroup(groupId, memberId);

              console.log('✅ Member removed from group successfully');
              Alert.alert('Success', `${member.name} has been removed from the group.`);
              
            } catch (error) {
              console.error('❌ Failed to remove member:', error);
              handleError(error, 'Remove Member');
            }
          }
        }
      ]
    );
  };

  const handleContributionComplete = (contribution: any) => {
    console.log('✅ [GroupDetailsScreen] Contribution completed:', contribution);
    Alert.alert('Success', 'Your contribution has been processed!');
    setShowContributionFlow(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={ChatTheme.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Typography variant="h3">{groupDetails?.name || propGroupName || 'Group'}</Typography>
        <Typography variant="body2" color="textSecondary">
          {members.length} {members.length === 1 ? 'member' : 'members'}
          {groupHasWallet && ' • Contribution Group'}
        </Typography>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderTabBar = () => {
    const tabs = [
      { id: 'members', title: 'Members', icon: 'group' },
      ...(groupHasWallet ? [{ id: 'wallet', title: 'Wallet', icon: 'account-balance-wallet' }] : []),
      { id: 'media', title: 'Media', icon: 'photo-library' },
    ];

    return (
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
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
              style={[
                styles.tabTitle,
                activeTab === tab.id && styles.activeTabTitle
              ]}
            >
              {tab.title}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'members':
        return (
          <GroupMembersTab
            groupId={groupId}
            members={members}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onAddMembers={() => setShowAddMembers(true)}
            onPromoteToAdmin={handlePromoteToAdmin}
            onRemoveMember={handleRemoveMember}
            allowMembersToAddOthers={groupDetails?.settings?.allowMembersToAddOthers}
          />
        );
      case 'wallet':
        return groupHasWallet ? (
          <ContributionGroupWallet
            groupId={groupId}
            isAdmin={isAdmin}
            onContribute={() => setShowContributionFlow(true)}
            onWithdraw={() => Alert.alert('Coming Soon', 'Withdrawal functionality will be available soon.')}
            onViewTransactions={() => Alert.alert('Coming Soon', 'Transaction history will be available soon.')}
          />
        ) : null;
      case 'media':
        return <GroupMediaTab groupId={groupId} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Typography variant="body2" color="textSecondary" style={styles.loadingText}>
            Loading group details...
          </Typography>
        </View>
      </View>
    );
  }

  if (error && !networkError) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ErrorMessage
          message={error}
          onRetry={() => retryOperation('Load Group Data')}
          retryText="Try Again"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Network Error Banner */}
      {networkError && (
        <View style={styles.errorBanner}>
          <MaterialIcons name="wifi-off" size={20} color={Colors.error} />
          <View style={styles.errorBannerContent}>
            <Typography variant="body2" style={styles.errorBannerText}>
              Connection lost. Check your internet.
            </Typography>
            <TouchableOpacity onPress={() => retryOperation('Load Group Data')}>
              <Typography variant="body2" style={styles.retryButtonText}>
                Retry
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {renderHeader()}
      {renderTabBar()}
      {renderTabContent()}

      {/* Add Members Modal */}
      <AddMembersModal
        visible={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        groupId={groupId}
        groupDetails={groupDetails}
        currentMembers={members}
        isAdmin={isAdmin}
        onMembersAdded={(addedMembers) => {
          console.log('✅ [GroupDetailsScreen] Members added successfully:', {
            count: addedMembers.length,
            members: addedMembers.map(m => ({ id: m.id, name: m.name })),
          });
          Alert.alert('Success', `${addedMembers.length} member(s) added to the group!`);
        }}
      />

      {/* Contribution Flow Modal */}
      <ContributionFlow
        visible={showContributionFlow}
        onClose={() => setShowContributionFlow(false)}
        groupId={groupId}
        groupName={groupDetails?.name || 'Group'}
        onContributionComplete={handleContributionComplete}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    borderBottomWidth: 1,
    borderBottomColor: Colors.error + '30',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  errorBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBannerText: {
    flex: 1,
    color: Colors.error,
    fontWeight: '500',
  },
  retryButtonText: {
    color: ChatTheme.sendBubbleBackground,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: ChatTheme.background1,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
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
});