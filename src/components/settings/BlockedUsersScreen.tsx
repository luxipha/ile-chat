import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import chatService from '../../services/chatService';
import authService from '../../services/authService';
import profileService from '../../services/profileService';

interface BlockedUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  blockedAt: Date;
}

interface BlockedUsersScreenProps {
  onBack: () => void;
}

export const BlockedUsersScreen: React.FC<BlockedUsersScreenProps> = ({
  onBack,
}) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCachedUser();
      if (!currentUser) {
        Alert.alert('Error', 'Please log in to view blocked users.');
        return;
      }

      // Get blocked users from Firebase
      const blockedUsersList = await chatService.getBlockedUsers(currentUser.id);
      
      // Get profile information for each blocked user
      const blockedUsersWithProfiles = await Promise.all(
        blockedUsersList.map(async (blockedUser) => {
          try {
            const profileResult = await profileService.getUserProfile(blockedUser.userId);
            return {
              id: blockedUser.userId,
              name: profileResult.success ? profileResult.profile?.name || 'Unknown User' : 'Unknown User',
              email: profileResult.success ? profileResult.profile?.email : undefined,
              avatar: profileResult.success ? profileResult.profile?.avatar : undefined,
              blockedAt: blockedUser.blockedAt,
            };
          } catch (error) {
            console.error('Failed to get profile for blocked user:', blockedUser.userId, error);
            return {
              id: blockedUser.userId,
              name: 'Unknown User',
              blockedAt: blockedUser.blockedAt,
            };
          }
        })
      );

      setBlockedUsers(blockedUsersWithProfiles);
    } catch (error) {
      console.error('Failed to load blocked users:', error);
      Alert.alert('Error', 'Failed to load blocked users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${user.name}? They will be able to contact you again.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unblock',
          style: 'default',
          onPress: async () => {
            try {
              const currentUser = await authService.getCachedUser();
              if (!currentUser) return;

              await chatService.unblockUser(user.id, currentUser.id);
              
              // Remove from local state
              setBlockedUsers(prev => prev.filter(u => u.id !== user.id));
              
              Alert.alert('Success', `${user.name} has been unblocked.`);
            } catch (error) {
              console.error('Failed to unblock user:', error);
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderBlockedUser = (user: BlockedUser) => (
    <View key={user.id} style={styles.userItem}>
      <View style={styles.avatar}>
        <MaterialIcons name="account-circle" size={40} color={Colors.gray400} />
      </View>
      
      <View style={styles.userDetails}>
        <Typography variant="h6" style={styles.userName}>
          {user.name}
        </Typography>
        {user.email && (
          <Typography variant="body2" color="textSecondary">
            {user.email}
          </Typography>
        )}
        <Typography variant="caption" color="textSecondary">
          Blocked on {user.blockedAt.toLocaleDateString()}
        </Typography>
      </View>
      
      <TouchableOpacity 
        style={styles.unblockButton}
        onPress={() => handleUnblockUser(user)}
      >
        <MaterialIcons name="check-circle" size={24} color={Colors.success} />
        <Typography variant="body2" style={styles.unblockText}>
          Unblock
        </Typography>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="block" size={64} color={Colors.gray400} />
      <Typography variant="h6" style={styles.emptyTitle}>
        No Blocked Users
      </Typography>
      <Typography variant="body2" color="textSecondary" style={styles.emptySubtitle}>
        Users you block will appear here. You can unblock them anytime.
      </Typography>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h5" style={styles.title}>
          Blocked Users
        </Typography>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Typography variant="body1" style={styles.loadingText}>
              Loading blocked users...
            </Typography>
          </View>
        ) : blockedUsers.length === 0 ? (
          renderEmptyState()
        ) : (
          blockedUsers.map(renderBlockedUser)
        )}
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
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  avatar: {
    marginRight: Spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    marginBottom: 2,
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.successLight,
  },
  unblockText: {
    marginLeft: Spacing.xs,
    color: Colors.success,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
});