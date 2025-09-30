import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Keyboard 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';

interface MessageComposerProps {
  onSendMessage: (text: string) => void;
  onSendPayment?: (amount: number, currency: string) => void;
  onSendAttachment?: (type: 'camera' | 'gallery' | 'document') => void;
  onActionsToggle?: (show: boolean, mode: 'actions' | 'stickers') => void;
  placeholder?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onSendPayment = () => {},
  onSendAttachment = () => {},
  onActionsToggle,
  placeholder = 'Type a message...',
}) => {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setMessage('');
      Keyboard.dismiss();
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
    setShowActions(false); // Hide actions when typing
    onActionsToggle?.(false, 'actions'); // Close action panel
  };

  const handleBlur = () => {
    setIsExpanded(false);
  };

  const handleStickerPress = () => {
    const newShowStickers = !showActions || showActions;
    setShowActions(false); // Always close actions first
    onActionsToggle?.(true, 'stickers'); // Open sticker mode
    
    if (newShowStickers) {
      Keyboard.dismiss(); // Collapse keyboard
    }
  };

  const handleAttachmentPress = () => {
    const newShowActions = !showActions;
    setShowActions(newShowActions);
    onActionsToggle?.(newShowActions, 'actions'); // Toggle actions mode
    
    if (newShowActions) {
      Keyboard.dismiss(); // Collapse keyboard
    }
  };



  return (
    <View style={styles.wrapper}>
      
      <View style={[styles.container, isExpanded && styles.expandedContainer]}>
        <View style={styles.inputContainer}>
        {/* Attachment button */}
        <TouchableOpacity style={styles.attachButton} onPress={handleAttachmentPress}>
          <MaterialIcons 
            name={showActions ? "close" : "add"} 
            size={20} 
            color={showActions ? ChatTheme.primary : ChatTheme.textSecondary} 
          />
        </TouchableOpacity>
        
        {/* Text input */}
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={ChatTheme.textTertiary}
          multiline
          maxLength={1000}
          onFocus={handleFocus}
          onBlur={handleBlur}
          blurOnSubmit={false}
        />
        
        {/* Sticker button - always visible */}
        <TouchableOpacity 
          onPress={handleStickerPress}
          style={styles.stickerButton}
        >
          <MaterialIcons 
            name="sentiment-very-satisfied" 
            size={20} 
            color={ChatTheme.textSecondary} 
          />
        </TouchableOpacity>
        
        {/* Send button - only visible when there's text */}
        {message.trim() ? (
          <TouchableOpacity 
            onPress={handleSend}
            style={styles.sendButton}
          >
            <MaterialIcons 
              name="send" 
              size={20} 
              color={ChatTheme.background1} 
            />
          </TouchableOpacity>
        ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: ChatTheme.background1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: ChatSpacing.lg * 0.9, // Reduce horizontal padding by 10%
    paddingVertical: ChatSpacing.md,
    backgroundColor: ChatTheme.background1,
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
    gap: ChatSpacing.sm,
  },
  expandedContainer: {
    paddingBottom: ChatSpacing.lg,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: ChatTheme.background3,
    borderRadius: 24,
    paddingHorizontal: ChatSpacing.md,
    paddingVertical: ChatSpacing.sm,
    maxHeight: 120,
  },
  attachButton: {
    padding: ChatSpacing.xs,
    marginRight: ChatSpacing.xs,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: ChatTheme.textPrimary,
    maxHeight: 80,
    paddingVertical: ChatSpacing.xs,
    paddingHorizontal: ChatSpacing.xs,
  },
  stickerButton: {
    padding: ChatSpacing.xs,
    marginLeft: ChatSpacing.xs,
  },
  micButton: {
    padding: ChatSpacing.xs,
    marginLeft: ChatSpacing.xs,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ChatTheme.sendBubbleBackground,
    marginLeft: ChatSpacing.xs,
  },
});