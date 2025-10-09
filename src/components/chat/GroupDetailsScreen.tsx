import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { GroupWallet } from '../group/GroupWallet';
import { ContributionFlow } from '../group/ContributionFlow';
import { GroupProposal } from '../group/GroupProposal';
import { GroupWalletCreation } from '../group/GroupWalletCreation';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { AddMembersModal } from './AddMembersModal';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';
import chatService, { GroupDetails, GroupMember } from '../../services/chatService';
import authService from '../../services/authService';

interface GroupDetailsScreenProps {
  onBack: () => void;
  groupId: string;
  groupName?: string; // Made optional since we'll fetch from Firebase
  groupAvatar?: string;
  isAdmin?: boolean; // Will be determined from Firebase data
  isPrivateGroup?: boolean; // Will be determined from Firebase data
  hasWallet?: boolean; // Will be determined from Firebase data
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
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'wallet' | 'media'>('members');
  const [showContributionFlow, setShowContributionFlow] = useState(false);
  const [showGroupProposal, setShowGroupProposal] = useState(false);
  const [showWalletCreation, setShowWalletCreation] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Enhanced Error & Loading States
  const [retryCount, setRetryCount] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [operationLoading, setOperationLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [networkError, setNetworkError] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // Media Tab State
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [mediaHasMore, setMediaHasMore] = useState(false);
  const [mediaLastVisible, setMediaLastVisible] = useState<any>(null);

  // Derived state
  const isAdmin = groupDetails && currentUserId ? groupDetails.admins.includes(currentUserId) : propIsAdmin || false;
  const isPrivateGroup = groupDetails?.settings?.privacy === 'private' || propIsPrivateGroup !== false;
  const groupHasWallet = groupDetails?.hasWallet || propHasWallet || false;

  // Enhanced error handling utilities
  const handleError = (error: any, operation: string, showAlert: boolean = true) => {
    console.error(`❌ [GroupDetailsScreen] ${operation} failed:`, error);
    
    const errorMessage = error?.message || `Failed to ${operation.toLowerCase()}`;
    const isNetworkError = errorMessage.includes('network') || errorMessage.includes('offline');
    
    setNetworkError(isNetworkError);
    setError(errorMessage);
    setLastErrorTime(Date.now());
    
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
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      switch (operation) {
        case 'Load Group Data':
          await setupRealtimeListeners();
          break;
        case 'Load Media':
          await loadGroupMedia(true);
          break;
        default:
          console.warn('⚠️ Unknown operation to retry:', operation);
      }
    } catch (error) {
      handleError(error, `Retry ${operation}`, false);
    } finally {
      setIsRetrying(false);
    }
  };
  
  const setOperationLoadingState = (operation: string, loading: boolean) => {
    setOperationLoading(prev => ({
      ...prev,
      [operation]: loading
    }));
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
        setPermissionError(null);
        console.log('🔄 Setting up real-time listeners for group:', groupId);

        // Get current user ID
        const userSession = await authService.getSession();
        if (userSession.success && userSession.user) {
          setCurrentUserId(userSession.user.id);
        }

        // Set up real-time listener for group details with enhanced error handling
        unsubscribeGroupDetails = chatService.subscribeToGroupDetails(groupId, (groupDetails) => {
          console.log('🔄 [GroupDetailsScreen] Real-time group details update received');
          
          try {
            if (groupDetails) {
              console.log('✅ [GroupDetailsScreen] Group details updated:', {
                groupId: groupDetails.id,
                name: groupDetails.name,
              memberCount: groupDetails.participants.length,
              adminCount: groupDetails.admins.length,
              currentUserId,
              isCurrentUserAdmin: currentUserId ? groupDetails.admins.includes(currentUserId) : false,
              settings: {
                allowMembersToAddOthers: groupDetails.settings?.allowMembersToAddOthers,
                onlyAdminsCanSend: groupDetails.settings?.onlyAdminsCanSend,
                disappearingMessages: groupDetails.settings?.disappearingMessages,
                privacy: groupDetails.settings?.privacy
              }
            });
              setGroupDetails(groupDetails);
              setError(null); // Clear any previous errors
              setNetworkError(false);
            } else {
              console.warn('⚠️ [GroupDetailsScreen] Group details is null, group not found');
              setPermissionError('Group not found or access denied');
            }
          } catch (detailsError) {
            console.error('❌ [GroupDetailsScreen] Error processing group details:', detailsError);
            handleError(detailsError, 'Process Group Details', false);
          }
          setLoading(false);
        });

        // Set up real-time listener for group members with enhanced error handling
        unsubscribeMembers = chatService.subscribeToGroupMembers(groupId, (members) => {
          console.log('🔄 [GroupDetailsScreen] Real-time group members update received');
          
          try {
            console.log('✅ [GroupDetailsScreen] Members updated:', {
              totalMembers: members.length,
              adminCount: members.filter(m => m.role === 'admin').length,
              memberCount: members.filter(m => m.role === 'member').length,
              currentUserId,
              members: members.map(m => ({ id: m.id, name: m.name, role: m.role }))
            });
            setMembers(members);
            setError(null); // Clear any previous errors
          } catch (membersError) {
            console.error('❌ [GroupDetailsScreen] Error processing group members:', membersError);
            handleError(membersError, 'Process Group Members', false);
          }
        });

        // Load initial media when active tab is media or load all initially
        loadGroupMedia(true);

      } catch (err) {
        console.error('❌ Failed to set up group listeners:', err);
        setError(err instanceof Error ? err.message : 'Failed to load group data');
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

  // Load group media function with enhanced error handling
  const loadGroupMedia = async (isInitial = false) => {
    if (!groupId) return;

    const operationName = 'Load Media';
    setOperationLoadingState(operationName, true);

    try {
      console.log('🔄 [GroupDetailsScreen] Loading group media:', {
        groupId,
        mediaFilter,
        isInitial,
        currentMediaCount: mediaItems.length,
        networkError,
        retryCount
      });

      setMediaLoading(true);
      
      const result = await chatService.getGroupMedia(groupId, {
        limit: 20,
        startAfter: isInitial ? null : mediaLastVisible,
        mediaType: mediaFilter === 'all' ? undefined : mediaFilter,
      });

      console.log('✅ [GroupDetailsScreen] Media loaded:', {
        newItemsCount: result.media.length,
        hasMore: result.hasMore,
        totalItemsAfterLoad: isInitial ? result.media.length : mediaItems.length + result.media.length
      });

      if (isInitial) {
        setMediaItems(result.media);
      } else {
        setMediaItems(prev => [...prev, ...result.media]);
      }
      
      setMediaHasMore(result.hasMore);
      setMediaLastVisible(result.lastVisible);
      
      // Clear any previous errors on successful load
      if (operationLoading[operationName]) {
        setError(null);
        setNetworkError(false);
      }

    } catch (error) {
      console.error('❌ [GroupDetailsScreen] Failed to load media:', error);
      handleError(error, operationName, false); // Don't show alert for media loading
    } finally {
      setMediaLoading(false);
      setOperationLoadingState(operationName, false);
    }
  };

  // Handle media filter change
  const handleMediaFilterChange = (filter: 'all' | 'image' | 'video' | 'document') => {
    console.log('🔄 [GroupDetailsScreen] Changing media filter:', { from: mediaFilter, to: filter });
    setMediaFilter(filter);
    setMediaItems([]);
    setMediaLastVisible(null);
    setMediaHasMore(false);
    
    // Load with new filter
    setTimeout(() => loadGroupMedia(true), 100);
  };

  const handlePromoteToAdmin = async (memberId: string) => {
    console.log('🔄 [GroupDetailsScreen] handlePromoteToAdmin called:', { 
      groupId, 
      memberId, 
      currentUserId, 
      isAdmin,
      totalMembers: members.length
    });
    
    const operationName = `Promote Member ${memberId}`;
    setOperationLoadingState(operationName, true);
    
    const member = members.find(m => m.id === memberId);
    if (!member) {
      console.warn('⚠️ [GroupDetailsScreen] Member not found:', memberId);
      return;
    }

    console.log('✅ [GroupDetailsScreen] Found member to promote:', {
      id: member.id,
      name: member.name,
      currentRole: member.role
    });

    Alert.alert(
      'Promote to Admin',
      `Are you sure you want to make ${member.name} an admin?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            console.log('👤 [GroupDetailsScreen] Admin promotion cancelled');
            setOperationLoadingState(operationName, false);
          }
        },
        {
          text: 'Promote',
          onPress: async () => {
            try {
              console.log('🚀 [GroupDetailsScreen] Starting admin promotion:', { 
                groupId, 
                memberId, 
                memberName: member.name,
                currentRole: member.role
              });
              
              // Update Firebase - real-time listener will handle UI updates
              await chatService.updateMemberRole(groupId, memberId, true);
              
              console.log('✅ [GroupDetailsScreen] Member promoted to admin successfully');
              Alert.alert('Success', `${member.name} has been promoted to admin.`);
              
            } catch (error) {
              console.error('❌ [GroupDetailsScreen] Failed to promote member:', error);
              handleError(error, operationName);
            } finally {
              setOperationLoadingState(operationName, false);
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

    const operationName = `Remove Member ${memberId}`;
    console.log('🔄 [GroupDetailsScreen] handleRemoveMember called:', { 
      groupId, 
      memberId, 
      memberName: member.name,
      totalMembers: members.length
    });

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the group?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('👤 [GroupDetailsScreen] Member removal cancelled')
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setOperationLoadingState(operationName, true);
            try {
              console.log('🚀 [GroupDetailsScreen] Starting member removal:', { 
                groupId, 
                memberId, 
                memberName: member.name
              });
              console.log('🔄 Removing member from group:', { groupId, memberId, memberName: member.name });
              
              // Update Firebase - real-time listener will handle UI updates
              await chatService.removeMemberFromGroup(groupId, memberId);

              console.log('✅ Member removed from group successfully');
              Alert.alert('Success', `${member.name} has been removed from the group.`);
              
            } catch (error) {
              console.error('❌ Failed to remove member:', error);
              handleError(error, operationName);
            } finally {
              setOperationLoadingState(operationName, false);
            }
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

  const handleSaveSettings = async () => {
    if (!groupDetails) return;

    try {
      console.log('🔄 Saving group settings:', groupDetails);
      setIsEditing(false);

      // Update Firebase
      await chatService.updateGroupSettings(groupId, {
        name: groupDetails.name,
        description: groupDetails.description,
        allowMembersToAddOthers: groupDetails.settings?.allowMembersToAddOthers,
        onlyAdminsCanSend: groupDetails.settings?.onlyAdminsCanSend,
        disappearingMessages: groupDetails.settings?.disappearingMessages,
        privacy: groupDetails.settings?.privacy,
      });

      console.log('✅ Group settings updated successfully');
      Alert.alert('Success', 'Group settings updated successfully!');
      
    } catch (error) {
      console.error('❌ Failed to update group settings:', error);
      Alert.alert('Error', 'Failed to update group settings. Please try again.');
    }
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
    // Update local state
    if (groupDetails) {
      setGroupDetails({
        ...groupDetails,
        hasWallet: true,
        walletAddress: walletConfig.walletAddress,
      });
    }
    
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
      {/* Debug info for member actions */}
      {console.log('🔍 [GroupDetailsScreen] Member action visibility check:', {
        memberId: item.id,
        memberName: item.name,
        memberRole: item.role,
        currentUserId,
        isAdmin,
        shouldShowActions: isAdmin && item.id !== currentUserId
      })}
      
      {isAdmin && item.id !== currentUserId && (
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={styles.memberActionButton}
            onPress={() => {
              console.log('🔄 [GroupDetailsScreen] Member action button pressed:', {
                memberId: item.id,
                memberName: item.name,
                memberRole: item.role,
                action: item.role === 'member' ? 'promote' : 'admin_options'
              });
              
              if (item.role === 'member') {
                console.log('🚀 [GroupDetailsScreen] Calling handlePromoteToAdmin for member:', item.name);
                handlePromoteToAdmin(item.id);
              } else {
                console.log('🚀 [GroupDetailsScreen] Showing admin options for:', item.name);
                // Show admin options
                Alert.alert(
                  'Admin Options',
                  `Choose an action for ${item.name}`,
                  [
                    { 
                      text: 'Cancel', 
                      style: 'cancel',
                      onPress: () => console.log('👤 [GroupDetailsScreen] Admin options cancelled for:', item.name)
                    },
                    { 
                      text: 'Remove Admin', 
                      onPress: async () => {
                        try {
                          console.log('🚀 [GroupDetailsScreen] Removing admin role from:', {
                            memberId: item.id,
                            memberName: item.name
                          });
                          
                          // Update Firebase - real-time listener will handle UI updates
                          await chatService.updateMemberRole(groupId, item.id, false);

                          console.log('✅ [GroupDetailsScreen] Admin role removed successfully');
                          Alert.alert('Success', `${item.name} has been removed as admin.`);
                        } catch (error) {
                          console.error('❌ [GroupDetailsScreen] Failed to remove admin:', error);
                          const errorMessage = error instanceof Error ? error.message : 'Failed to remove admin';
                          Alert.alert('Error', errorMessage);
                        }
                      }
                    },
                    { 
                      text: 'Remove from Group', 
                      style: 'destructive', 
                      onPress: () => {
                        console.log('🚀 [GroupDetailsScreen] Calling handleRemoveMember for:', item.name);
                        handleRemoveMember(item.id);
                      }
                    },
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
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => {
            console.log('🔄 [GroupDetailsScreen] Add Members button pressed:', {
              groupId,
              isAdmin,
              canAddMembers: isAdmin || groupDetails?.settings?.allowMembersToAddOthers
            });
            
            if (!isAdmin && !groupDetails?.settings?.allowMembersToAddOthers) {
              console.warn('⚠️ [GroupDetailsScreen] User not allowed to add members');
              Alert.alert(
                'Permission Denied',
                'Only admins can add members to this group.',
                [{ text: 'OK' }]
              );
              return;
            }
            
            console.log('✅ [GroupDetailsScreen] Opening Add Members modal');
            setShowAddMembers(true);
          }}
        >
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
              value={groupDetails?.name || ''}
              onChangeText={(text) => {
                if (groupDetails) {
                  setGroupDetails({ ...groupDetails, name: text });
                }
              }}
            />
          ) : (
            <Typography variant="body1">{groupDetails?.name || 'Unknown'}</Typography>
          )}
        </View>

        <View style={styles.settingItem}>
          <Typography variant="body2" style={styles.settingLabel}>
            Description
          </Typography>
          {isEditing ? (
            <TextInput
              style={[styles.settingInput, styles.textArea]}
              value={groupDetails?.description || ''}
              onChangeText={(text) => {
                if (groupDetails) {
                  setGroupDetails({ ...groupDetails, description: text });
                }
              }}
              multiline
              numberOfLines={3}
            />
          ) : (
            <Typography variant="body1">{groupDetails?.description || 'No description'}</Typography>
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
                groupDetails?.settings?.allowMembersToAddOthers && styles.toggleActive
              ]}
              onPress={() => {
                if (groupDetails) {
                  setGroupDetails({
                    ...groupDetails,
                    settings: {
                      ...groupDetails.settings,
                      allowMembersToAddOthers: !groupDetails.settings?.allowMembersToAddOthers
                    }
                  });
                }
              }}
            >
              <View style={[
                styles.toggleThumb,
                groupDetails?.settings?.allowMembersToAddOthers && styles.toggleThumbActive
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
                groupDetails?.settings?.onlyAdminsCanSend && styles.toggleActive
              ]}
              onPress={() => {
                if (groupDetails) {
                  setGroupDetails({
                    ...groupDetails,
                    settings: {
                      ...groupDetails.settings,
                      onlyAdminsCanSend: !groupDetails.settings?.onlyAdminsCanSend
                    }
                  });
                }
              }}
            >
              <View style={[
                styles.toggleThumb,
                groupDetails?.settings?.onlyAdminsCanSend && styles.toggleThumbActive
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
                groupDetails?.settings?.disappearingMessages && styles.toggleActive
              ]}
              onPress={() => {
                if (groupDetails) {
                  setGroupDetails({
                    ...groupDetails,
                    settings: {
                      ...groupDetails.settings,
                      disappearingMessages: !groupDetails.settings?.disappearingMessages
                    }
                  });
                }
              }}
            >
              <View style={[
                styles.toggleThumb,
                groupDetails?.settings?.disappearingMessages && styles.toggleThumbActive
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

  const renderMediaItem = ({ item, index }: { item: any; index: number }) => {
    const isImage = item.type === 'image' || (item.mimeType && item.mimeType.startsWith('image/'));
    const isVideo = item.type === 'video' || (item.mimeType && item.mimeType.startsWith('video/'));
    const isDocument = item.type === 'document' || item.type === 'file';

    return (
      <TouchableOpacity 
        style={styles.mediaItem}
        onPress={() => {
          console.log('🔄 [GroupDetailsScreen] Media item pressed:', {
            id: item.id,
            type: item.type,
            fileName: item.fileName
          });
          // TODO: Open media viewer modal
          Alert.alert('Media Viewer', `Preview for ${item.fileName || item.type} coming soon!`);
        }}
      >
        <View style={styles.mediaPreview}>
          {isImage ? (
            <Image 
              source={{ uri: item.imageUrl || item.thumbnail }} 
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ) : isVideo ? (
            <View style={styles.videoPreview}>
              {item.thumbnail ? (
                <Image 
                  source={{ uri: item.thumbnail }} 
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              ) : (
                <MaterialIcons name="play-circle-filled" size={40} color={ChatTheme.sendBubbleBackground} />
              )}
              <View style={styles.videoOverlay}>
                <MaterialIcons name="play-arrow" size={24} color={Colors.white} />
              </View>
            </View>
          ) : (
            <View style={styles.documentPreview}>
              <MaterialIcons 
                name={item.mimeType?.includes('pdf') ? 'picture-as-pdf' : 'description'} 
                size={32} 
                color={ChatTheme.sendBubbleBackground} 
              />
              <Typography variant="caption" style={styles.documentName} numberOfLines={2}>
                {item.fileName || 'Document'}
              </Typography>
            </View>
          )}
        </View>
        
        <View style={styles.mediaInfo}>
          <Typography variant="caption" color="textSecondary" numberOfLines={1}>
            {item.user.name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {item.createdAt.toLocaleDateString()}
          </Typography>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMediaTab = () => (
    <View style={styles.tabContent}>
      {/* Media Filter Buttons */}
      <View style={styles.mediaFilters}>
        {[
          { key: 'all', label: 'All', icon: 'folder' },
          { key: 'image', label: 'Photos', icon: 'photo' },
          { key: 'video', label: 'Videos', icon: 'videocam' },
          { key: 'document', label: 'Files', icon: 'description' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              mediaFilter === filter.key && styles.activeFilterButton
            ]}
            onPress={() => handleMediaFilterChange(filter.key as any)}
          >
            <MaterialIcons 
              name={filter.icon as any} 
              size={16} 
              color={mediaFilter === filter.key ? Colors.white : ChatTheme.textSecondary} 
            />
            <Typography 
              variant="caption" 
              style={[
                styles.filterButtonText,
                mediaFilter === filter.key && styles.activeFilterButtonText
              ]}
            >
              {filter.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {/* Media Grid */}
      {mediaLoading && mediaItems.length === 0 ? (
        <View style={styles.mediaLoadingContainer}>
          <ActivityIndicator size="large" color={ChatTheme.sendBubbleBackground} />
          <Typography variant="body2" color="textSecondary" style={{ marginTop: Spacing.md }}>
            Loading media...
          </Typography>
        </View>
      ) : mediaItems.length === 0 ? (
        <Card style={styles.mediaCard}>
          <View style={styles.emptyState}>
            <MaterialIcons name="photo-library" size={48} color={ChatTheme.textSecondary} />
            <Typography variant="h6" style={styles.emptyTitle}>
              No {mediaFilter === 'all' ? 'Media' : 
                  mediaFilter === 'image' ? 'Photos' : 
                  mediaFilter === 'video' ? 'Videos' : 'Files'} Shared
            </Typography>
            <Typography variant="body2" color="textSecondary" style={styles.emptyText}>
              {mediaFilter === 'all' 
                ? 'Photos, videos, and documents shared in this group will appear here'
                : mediaFilter === 'image'
                ? 'Photos shared in this group will appear here'
                : mediaFilter === 'video' 
                ? 'Videos shared in this group will appear here'
                : 'Files and documents shared in this group will appear here'
              }
            </Typography>
          </View>
        </Card>
      ) : (
        <FlatList
          data={mediaItems}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.mediaGrid}
          onEndReached={() => {
            if (mediaHasMore && !mediaLoading) {
              console.log('🔄 [GroupDetailsScreen] Loading more media (infinite scroll)');
              loadGroupMedia(false);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            mediaLoading && mediaItems.length > 0 ? (
              <View style={styles.mediaLoadingFooter}>
                <ActivityIndicator size="small" color={ChatTheme.sendBubbleBackground} />
              </View>
            ) : null
          }
        />
      )}
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

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={ChatTheme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Typography variant="h3">{propGroupName || 'Loading...'}</Typography>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <LoadingSpinner message="Loading group details..." />
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={ChatTheme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Typography variant="h3">Error</Typography>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.errorContainer}>
          <ErrorMessage
            title="Failed to Load Group"
            message={error}
            actionLabel="Try Again"
            onAction={() => {
              setError(null);
              setLoading(true);
              // Trigger reload by re-running the effect
              if (groupId) {
                const loadGroupData = async () => {
                  try {
                    const userSession = await authService.getSession();
                    if (userSession.success && userSession.user) {
                      setCurrentUserId(userSession.user.id);
                    }

                    const [groupDetailsResult, membersResult] = await Promise.all([
                      chatService.getGroupDetails(groupId),
                      chatService.getGroupMembers(groupId),
                    ]);

                    if (groupDetailsResult) {
                      setGroupDetails(groupDetailsResult);
                    }
                    setMembers(membersResult);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to load group data');
                  } finally {
                    setLoading(false);
                  }
                };
                loadGroupData();
              }
            }}
            onDismiss={() => onBack()}
          />
        </View>
      </View>
    );
  }

  // Enhanced error & loading UI components
  const renderNetworkErrorBanner = () => {
    if (!networkError && !permissionError) return null;
    
    return (
      <View style={styles.errorBanner}>
        <MaterialIcons 
          name={networkError ? "wifi-off" : "error-outline"} 
          size={20} 
          color={Colors.error} 
        />
        <View style={styles.errorBannerContent}>
          <Typography variant="body2" style={styles.errorBannerText}>
            {networkError ? 'Connection lost. Check your internet.' : permissionError}
          </Typography>
          <TouchableOpacity 
            onPress={() => retryOperation('Load Group Data')}
            disabled={isRetrying}
          >
            <Typography variant="body2" style={styles.retryButtonText}>
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  const renderOperationLoadingOverlay = () => {
    const activeOperations = Object.entries(operationLoading)
      .filter(([_, loading]) => loading)
      .map(([operation, _]) => operation);
      
    if (activeOperations.length === 0) return null;
    
    return (
      <View style={styles.operationOverlay}>
        <View style={styles.operationCard}>
          <ActivityIndicator size="small" color={ChatTheme.sendBubbleBackground} />
          <Typography variant="body2" style={styles.operationText}>
            {activeOperations[0]}...
          </Typography>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Network Error Banner */}
      {renderNetworkErrorBanner()}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={ChatTheme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Typography variant="h3">{groupDetails?.name || propGroupName || 'Group'}</Typography>
          <Typography variant="body2" color="textSecondary">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Typography>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Group Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.groupAvatar}>
          {groupDetails?.avatar ? (
            <Avatar
              name={groupDetails.name}
              imageUrl={groupDetails.avatar}
              size="large"
            />
          ) : (
            <MaterialIcons name="group" size={48} color={ChatTheme.sendBubbleBackground} />
          )}
        </View>
      </View>

      {renderTabBar()}
      {renderTabContent()}

      {/* Contribution Flow Modal */}
      <ContributionFlow
        visible={showContributionFlow}
        onClose={() => setShowContributionFlow(false)}
        groupId={groupId}
        groupName={groupDetails?.name || 'Group'}
        onContributionComplete={handleContributionComplete}
      />

      {/* Group Proposal Modal */}
      <GroupProposal
        visible={showGroupProposal}
        onClose={() => setShowGroupProposal(false)}
        groupId={groupId}
        groupName={groupDetails?.name || 'Group'}
        onProposalCreated={handleProposalCreated}
      />

      {/* Wallet Creation Modal */}
      <GroupWalletCreation
        visible={showWalletCreation}
        onClose={() => setShowWalletCreation(false)}
        groupType="contribution"
        groupName={groupDetails?.name || 'Group'}
        memberAddresses={members.map(m => `0x${m.id}`)}
        onWalletCreated={handleWalletCreated}
      />

      {/* Add Members Modal */}
      <AddMembersModal
        visible={showAddMembers}
        onClose={() => {
          console.log('🔄 [GroupDetailsScreen] Closing Add Members modal');
          setShowAddMembers(false);
        }}
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
      
      {/* Operation Loading Overlay */}
      {renderOperationLoadingOverlay()}
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
  
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  
  // Media Tab Styles
  mediaFilters: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: ChatTheme.background2,
    gap: Spacing.xs,
  },
  activeFilterButton: {
    backgroundColor: ChatTheme.sendBubbleBackground,
  },
  filterButtonText: {
    color: ChatTheme.textSecondary,
    fontSize: 12,
  },
  activeFilterButtonText: {
    color: Colors.white,
    fontWeight: '500',
  },
  mediaLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  mediaGrid: {
    paddingBottom: Spacing.lg,
  },
  mediaItem: {
    flex: 1,
    margin: 2,
    maxWidth: '31.33%', // Roughly 1/3 for 3 columns with margins
    aspectRatio: 1,
  },
  mediaPreview: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: ChatTheme.background3,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPreview: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ChatTheme.background3,
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  documentPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ChatTheme.background2,
    padding: Spacing.sm,
  },
  documentName: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontSize: 10,
  },
  mediaInfo: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: 2,
  },
  mediaLoadingFooter: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  // Enhanced Error & Loading UI Styles
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
  operationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  operationCard: {
    backgroundColor: ChatTheme.background1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minWidth: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  operationText: {
    fontWeight: '500',
    color: ChatTheme.textPrimary,
  },
});