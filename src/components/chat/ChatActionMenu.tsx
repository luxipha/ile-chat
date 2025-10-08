import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';

interface ChatActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onAddContact: () => void;
  onCreateGroup: () => void;
  anchorPosition?: { x: number; y: number };
}

export const ChatActionMenu: React.FC<ChatActionMenuProps> = ({
  visible,
  onClose,
  onAddContact,
  onCreateGroup,
  anchorPosition = { x: 0, y: 0 },
}) => {
  const handleAddContact = () => {
    onClose();
    onAddContact();
  };

  const handleCreateGroup = () => {
    onClose();
    onCreateGroup();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View 
          style={[
            styles.menu,
            {
              position: 'absolute',
              top: anchorPosition.y + 10, // Position below the trigger button
              right: ChatSpacing.lg, // Align with right side
            }
          ]}
        >
          {/* Add Contact Option */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleAddContact}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemContent}>
              <View style={[styles.iconContainer, { backgroundColor: ChatTheme.success + '20' }]}>
                <MaterialIcons 
                  name="person-add" 
                  size={20} 
                  color={ChatTheme.success} 
                />
              </View>
              <Typography variant="h6" style={styles.menuItemTitle}>
                Add Contact
              </Typography>
            </View>
          </TouchableOpacity>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Create Group Option */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleCreateGroup}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemContent}>
              <View style={[styles.iconContainer, { backgroundColor: ChatTheme.sendBubbleBackground + '20' }]}>
                <MaterialIcons 
                  name="group-add" 
                  size={20} 
                  color={ChatTheme.sendBubbleBackground} 
                />
              </View>
              <Typography variant="h6" style={styles.menuItemTitle}>
                Create Group
              </Typography>
            </View>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    backgroundColor: ChatTheme.background1,
    borderRadius: 12,
    paddingVertical: ChatSpacing.sm,
    minWidth: 200, // Increased from 150 to provide more space
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: ChatTheme.border,
  },
  menuItem: {
    paddingHorizontal: ChatSpacing.md,
    paddingVertical: ChatSpacing.md, // Increased vertical padding
    marginVertical: 2, // Added margin for better spacing
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', // Ensure full width
  },
  iconContainer: {
    width: 40, // Slightly larger icons
    height: 40, // Slightly larger icons
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ChatSpacing.md,
  },
  menuItemTitle: {
    fontWeight: '600',
    color: ChatTheme.textPrimary,
    flex: 1,
    fontSize: 16, // Explicitly set font size
  },
  separator: {
    height: 1,
    backgroundColor: ChatTheme.border,
    marginVertical: ChatSpacing.xs,
    marginHorizontal: ChatSpacing.md,
  },
});