import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface ChatActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
  isGroup?: boolean;
  onMuteToggle?: (isMuted: boolean) => void;
  onClearChat?: () => void;
  onBlockUser?: () => void;
  onReportUser?: () => void;
  isUserBlocked?: boolean;
}

export const ChatActionsMenu: React.FC<ChatActionsMenuProps> = ({
  visible,
  onClose,
  chatId,
  chatName,
  isGroup = false,
  onMuteToggle,
  onClearChat,
  onBlockUser,
  onReportUser,
  isUserBlocked = false,
}) => {
  const [isMuted, setIsMuted] = React.useState(false);

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    onMuteToggle?.(newMutedState);
    onClose();
    
    Alert.alert(
      newMutedState ? 'Chat Muted' : 'Chat Unmuted',
      newMutedState 
        ? `You won't receive notifications from ${chatName}` 
        : `You'll now receive notifications from ${chatName}`
    );
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      `Are you sure you want to clear all messages in this chat? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onClose,
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            onClose();
            onClearChat?.();
            Alert.alert('Chat Cleared', 'All messages have been cleared from this chat.');
          },
        },
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${chatName}? They will no longer be able to contact you.`,
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
            onBlockUser?.();
            Alert.alert('User Blocked', `${chatName} has been blocked.`);
          },
        },
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert(
      'Report User',
      `Report ${chatName} for inappropriate behavior or content?`,
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
            onReportUser?.();
            Alert.alert('User Reported', `Thank you for reporting ${chatName}. We will review this report.`);
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
        {/* Mute/Unmute Option */}
        <TouchableOpacity 
          onPress={handleMuteToggle} 
          style={styles.menuItem}
        >
          <MaterialIcons 
            name={isMuted ? "volume-up" : "volume-off"} 
            size={20} 
            color={Colors.textPrimary} 
          />
          <Typography variant="body1" style={styles.menuText}>
            {isMuted ? 'Unmute Chat' : 'Mute Chat'}
          </Typography>
        </TouchableOpacity>

        {/* Clear Chat Option */}
        <TouchableOpacity 
          onPress={handleClearChat} 
          style={styles.menuItem}
        >
          <MaterialIcons name="clear-all" size={20} color={Colors.textPrimary} />
          <Typography variant="body1" style={styles.menuText}>
            Clear Chat
          </Typography>
        </TouchableOpacity>

        {/* Block/Unblock User Option (only for direct chats) */}
        {!isGroup && (
          <TouchableOpacity 
            onPress={handleBlockUser} 
            style={styles.menuItem}
          >
            <MaterialIcons 
              name={isUserBlocked ? "check-circle" : "block"} 
              size={20} 
              color={isUserBlocked ? Colors.success : Colors.error} 
            />
            <Typography 
              variant="body1" 
              style={[styles.menuText, { color: isUserBlocked ? Colors.success : Colors.error }]}
            >
              {isUserBlocked ? 'Unblock User' : 'Block User'}
            </Typography>
          </TouchableOpacity>
        )}

        {/* Report User Option (only for direct chats) */}
        {!isGroup && (
          <TouchableOpacity 
            onPress={handleReportUser} 
            style={styles.menuItem}
          >
            <MaterialIcons name="report" size={20} color={Colors.error} />
            <Typography variant="body1" style={[styles.menuText, { color: Colors.error }]}>
              Report User
            </Typography>
          </TouchableOpacity>
        )}
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