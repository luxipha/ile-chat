import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Avatar } from '../chat/Avatar';
import { ChatTheme } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { GroupMember } from '../../services/chatService';

interface GroupMembersTabProps {
  groupId: string;
  members: GroupMember[];
  currentUserId: string | null;
  isAdmin: boolean;
  onAddMembers: () => void;
  onPromoteToAdmin: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
  allowMembersToAddOthers?: boolean;
}

export const GroupMembersTab: React.FC<GroupMembersTabProps> = ({
  groupId,
  members,
  currentUserId,
  isAdmin,
  onAddMembers,
  onPromoteToAdmin,
  onRemoveMember,
  allowMembersToAddOthers = false,
}) => {
  const [showMemberActions, setShowMemberActions] = useState<string | null>(null);

  console.log('🔄 [GroupMembersTab] Rendering with:', {
    groupId,
    memberCount: members.length,
    currentUserId,
    isAdmin,
    allowMembersToAddOthers,
  });

  const canAddMembers = isAdmin || allowMembersToAddOthers;

  const handleMemberActionPress = (memberId: string) => {
    console.log('🔄 [GroupMembersTab] Member action pressed:', {
      memberId,
      currentShowMemberActions: showMemberActions,
    });

    if (showMemberActions === memberId) {
      setShowMemberActions(null);
    } else {
      setShowMemberActions(memberId);
    }
  };

  const handlePromoteToAdmin = (memberId: string) => {
    console.log('🔄 [GroupMembersTab] Promote to admin:', { memberId });
    setShowMemberActions(null);
    onPromoteToAdmin(memberId);
  };

  const handleRemoveMember = (memberId: string) => {
    console.log('🔄 [GroupMembersTab] Remove member:', { memberId });
    setShowMemberActions(null);
    onRemoveMember(memberId);
  };

  const renderMemberItem = ({ item: member }: { item: GroupMember }) => {
    const isCurrentUser = member.id === currentUserId;
    const showActions = showMemberActions === member.id;

    return (
      <View style={styles.memberContainer}>
        <View style={styles.memberItem}>
          <Avatar 
            name={member.name} 
            imageUrl={member.avatar} 
            online={member.isOnline} 
            size="medium" 
          />
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Typography variant="h6">
                {member.name}{isCurrentUser && ' (You)'}
              </Typography>
              {member.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Typography variant="caption" style={styles.adminBadgeText}>
                    Admin
                  </Typography>
                </View>
              )}
            </View>
            <Typography variant="caption" color="textSecondary">
              {member.isOnline ? 'Online' : member.lastSeen || 'Offline'}
            </Typography>
          </View>
          
          {/* Member Actions - Only show for admins and not for current user */}
          {isAdmin && !isCurrentUser && (
            <TouchableOpacity
              style={styles.memberActionButton}
              onPress={() => handleMemberActionPress(member.id)}
            >
              <MaterialIcons 
                name="more-vert" 
                size={20} 
                color={ChatTheme.textSecondary} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Menu */}
        {showActions && isAdmin && !isCurrentUser && (
          <View style={styles.actionMenu}>
            {member.role !== 'admin' && (
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => handlePromoteToAdmin(member.id)}
              >
                <MaterialIcons name="star" size={18} color={Colors.warning} />
                <Typography variant="body2" style={styles.actionMenuText}>
                  Promote to Admin
                </Typography>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionMenuItem, styles.removeAction]}
              onPress={() => handleRemoveMember(member.id)}
            >
              <MaterialIcons name="remove-circle" size={18} color={Colors.error} />
              <Typography variant="body2" style={[styles.actionMenuText, styles.removeActionText]}>
                Remove from Group
              </Typography>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Add Members Card */}
        <Card style={styles.actionCard}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => {
              console.log('🔄 [GroupMembersTab] Add Members button pressed:', {
                groupId,
                isAdmin,
                canAddMembers
              });
              
              if (!canAddMembers) {
                console.warn('⚠️ [GroupMembersTab] User not allowed to add members');
                Alert.alert(
                  'Permission Denied',
                  'Only admins can add members to this group.',
                  [{ text: 'OK' }]
                );
                return;
              }
              
              console.log('✅ [GroupMembersTab] Opening Add Members modal');
              onAddMembers();
            }}
          >
            <MaterialIcons name="person-add" size={24} color={ChatTheme.sendBubbleBackground} />
            <Typography variant="h6" style={styles.actionText}>
              Add Members
            </Typography>
            <MaterialIcons name="chevron-right" size={20} color={ChatTheme.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Members List */}
        <Card style={styles.membersCard}>
          <View style={styles.membersHeader}>
            <Typography variant="h6">
              Members ({members.length})
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {members.filter(m => m.role === 'admin').length} admin{members.filter(m => m.role === 'admin').length !== 1 ? 's' : ''}
            </Typography>
          </View>

          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatTheme.background1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  actionCard: {
    marginBottom: Spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  actionText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontWeight: '500',
  },
  membersCard: {
    marginBottom: Spacing.md,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  memberContainer: {
    backgroundColor: ChatTheme.background1,
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
    marginBottom: Spacing.xs / 2,
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
    fontSize: 10,
  },
  memberActionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  actionMenu: {
    backgroundColor: ChatTheme.background2,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  removeAction: {
    borderBottomWidth: 0,
  },
  actionMenuText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  removeActionText: {
    color: Colors.error,
  },
  separator: {
    height: 1,
    backgroundColor: ChatTheme.border,
    marginLeft: Spacing.lg + 40 + Spacing.md, // Avatar width + margin
  },
});