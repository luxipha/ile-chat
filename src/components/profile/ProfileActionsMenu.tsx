import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import friendService from '../../services/friendService';

interface ProfileActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onFriendDeleted?: () => void;
}

export const ProfileActionsMenu: React.FC<ProfileActionsMenuProps> = ({
  visible,
  onClose,
  userId,
  userName,
  onFriendDeleted,
}) => {
  const [isFriend, setIsFriend] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (visible) {
      checkFriendshipStatus();
    }
  }, [visible, userId]);

  const checkFriendshipStatus = async () => {
    try {
      setLoading(true);
      console.log('🔍 Checking friendship status for userId:', userId);
      const result = await friendService.getFriendshipStatus(userId);
      console.log('📊 Friendship status result:', result);
      const isCurrentlyFriend = result.success && result.status?.status === 'friends';
      console.log('👫 Are they friends?', isCurrentlyFriend);
      setIsFriend(isCurrentlyFriend);
    } catch (error) {
      console.error('Error checking friendship status:', error);
      setIsFriend(false);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteFriend = async () => {
    try {
      onClose(); // Close menu first
      
      console.log('🗑️ Silently deleting friend:', { userId, userName });
      
      const result = await friendService.deleteFriend(userId);
      console.log('🔍 Delete result:', result);
      
      if (result.success) {
        // Silent delete - no modal, just update state and refresh
        setIsFriend(false);
        onFriendDeleted?.();
      } else {
        // Only show error if something went wrong
        Alert.alert('Error', result.message || 'Failed to delete friend');
      }
      
    } catch (error) {
      console.error('Error deleting friend:', error);
      Alert.alert('Error', 'Failed to delete friend. Please try again.');
    }
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName}? They will no longer be able to contact you.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onClose,
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            onClose();
            // TODO: Implement block user functionality
            console.log('🚫 Blocking user:', { userId, userName });
            Alert.alert('User Blocked', `${userName} has been blocked.`);
          },
        },
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert(
      'Report User',
      `Report ${userName} for inappropriate behavior or content?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onClose,
        },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            onClose();
            // TODO: Implement report user functionality
            console.log('🚨 Reporting user:', { userId, userName });
            Alert.alert('User Reported', `Thank you for reporting ${userName}. We will review this report.`);
          },
        },
      ]
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      
      {/* Menu */}
      <View style={styles.menu}>
        {/* Delete Friend Option (only show for friends) */}
        {console.log('🔍 ProfileActionsMenu render check:', { isFriend, loading, visible })}
        {isFriend && (
          <TouchableOpacity 
            onPress={handleDeleteFriend} 
            style={styles.menuItem}
          >
            <MaterialIcons name="person-remove" size={20} color={Colors.error} />
            <Typography variant="body1" style={[styles.menuText, { color: Colors.error }]}>
              Delete Friend
            </Typography>
          </TouchableOpacity>
        )}

        {/* Block User Option */}
        <TouchableOpacity 
          onPress={handleBlockUser} 
          style={styles.menuItem}
        >
          <MaterialIcons name="block" size={20} color={Colors.error} />
          <Typography variant="body1" style={[styles.menuText, { color: Colors.error }]}>
            Block User
          </Typography>
        </TouchableOpacity>

        {/* Report User Option */}
        <TouchableOpacity 
          onPress={handleReportUser} 
          style={styles.menuItem}
        >
          <MaterialIcons name="report" size={20} color={Colors.error} />
          <Typography variant="body1" style={[styles.menuText, { color: Colors.error }]}>
            Report User
          </Typography>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    minWidth: 160,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  menuText: {
    marginLeft: Spacing.sm,
  },
});