import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Typography } from '../ui/Typography';

interface ChatHeaderProps {
  name: string;
  avatar?: string;
  isOnline?: boolean;
  isTyping?: boolean;
  isGroup?: boolean;
  onBack: () => void;
  onOptions?: () => void;
  onGroupInfo?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  avatar,
  isOnline = false,
  isTyping = false,
  isGroup = false,
  onBack,
  onOptions,
  onGroupInfo,
}) => {
  const getSubtitle = () => {
    if (isGroup) {
      if (isTyping) return 'typing...';
      return 'tap for group info';
    }
    if (isTyping) return 'typing...';
    if (isOnline) return 'online';
    return 'last seen recently';
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={ChatTheme.textPrimary} />
        </TouchableOpacity>
        
        <Avatar 
          name={name}
          imageUrl={avatar}
          online={isOnline}
          size="small"
        />
        
        <TouchableOpacity 
          style={styles.titleContainer}
          onPress={isGroup ? onGroupInfo : undefined}
          disabled={!isGroup}
        >
          <Typography variant="h6" numberOfLines={1}>
            {name}
          </Typography>
          <Text style={[
            styles.subtitle,
            isTyping && styles.typingText
          ]}>
            {getSubtitle()}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.rightSection}>
        {isGroup && onGroupInfo && (
          <TouchableOpacity onPress={onGroupInfo} style={styles.actionButton}>
            <MaterialIcons name="info" size={24} color={ChatTheme.textSecondary} />
          </TouchableOpacity>
        )}
        {onOptions && (
          <TouchableOpacity onPress={onOptions} style={styles.actionButton}>
            <MaterialIcons name="more-vert" size={24} color={ChatTheme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ChatSpacing.lg,
    paddingVertical: ChatSpacing.sm,
    backgroundColor: ChatTheme.background1,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: ChatSpacing.md,
    padding: ChatSpacing.xs,
  },
  titleContainer: {
    marginLeft: ChatSpacing.md,
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    color: ChatTheme.textSecondary,
    marginTop: 2,
  },
  typingText: {
    color: ChatTheme.accent,
    fontStyle: 'italic',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: ChatSpacing.sm,
    marginLeft: ChatSpacing.xs,
    borderRadius: 20,
  },
});