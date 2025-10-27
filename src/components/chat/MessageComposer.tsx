import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Keyboard 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import chatService from '../../services/chatService';

interface MessageComposerProps {
  onSendMessage: (text: string) => void;
  onSendPayment?: (amount: number, currency: string) => void;
  onSendAttachment?: (type: 'camera' | 'gallery' | 'document') => void;
  onActionsToggle?: (show: boolean, mode: 'actions' | 'stickers') => void;
  onStartVoiceRecording?: () => void;
  onStopVoiceRecording?: () => void;
  placeholder?: string;
  showActions?: boolean; // Add prop to track parent's action panel state
  chatId?: string; // Add chatId for typing status
  currentUser?: any; // Add current user for typing status
  isRecording?: boolean; // Add prop to track recording state
}

export interface MessageComposerRef {
  refocusInput: () => void;
}

export const MessageComposer = forwardRef<MessageComposerRef, MessageComposerProps>(({
  onSendMessage,
  onSendPayment,
  onSendAttachment,
  onActionsToggle,
  onStartVoiceRecording,
  onStopVoiceRecording,
  placeholder = 'Type a message...',
  showActions = false, // Default to false
  chatId,
  currentUser,
  isRecording = false,
}, ref) => {
  const insets = useSafeAreaInsets();
  const textInputRef = useRef<TextInput>(null);
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  // Remove local showActions state - use prop instead
  const [shouldRefocus, setShouldRefocus] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  // Expose refocus method to parent
  useImperativeHandle(ref, () => ({
    refocusInput: () => {
      setShouldRefocus(true);
      requestAnimationFrame(() => {
        textInputRef.current?.focus();
        setShouldRefocus(false);
      });
    },
  }));

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      // Clear typing status when sending message
      if (chatId && currentUser) {
        chatService.clearTypingStatus(chatId, currentUser.id);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
      
      onSendMessage(trimmedMessage);
      setMessage('');
      Keyboard.dismiss();
    }
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    
    // Handle typing status
    if (chatId && currentUser) {
      console.log('🔤 Text changed:', { text: text.length, chatId, userId: currentUser.id, userName: currentUser.name });
      
      // Set typing status when user starts typing
      if (text.trim().length > 0) {
        console.log('✍️ Setting typing status to true');
        chatService.setTypingStatus(chatId, currentUser.id, currentUser.name, true);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to clear typing status after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          console.log('⏰ Clearing typing status after timeout');
          chatService.clearTypingStatus(chatId, currentUser.id);
          typingTimeoutRef.current = null;
        }, 3000);
      } else {
        // Clear typing status when text is empty
        console.log('🚫 Clearing typing status (empty text)');
        chatService.clearTypingStatus(chatId, currentUser.id);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
    // Hide actions when typing - notify parent to close
    if (showActions) {
      onActionsToggle?.(false, 'actions'); // Close action panel
    }
  };

  const handleBlur = () => {
    if (!shouldRefocus) {
      setIsExpanded(false);
    }
  };

  const handleStickerPress = () => {
    // Always close actions first, then open sticker mode
    onActionsToggle?.(true, 'stickers'); // Open sticker mode
    
    Keyboard.dismiss(); // Collapse keyboard
  };

  const handleAttachmentPress = () => {
    const newShowActions = !showActions;
    onActionsToggle?.(newShowActions, 'actions'); // Toggle actions mode
    
    if (newShowActions) {
      // Opening actions panel - dismiss keyboard and blur input
      textInputRef.current?.blur();
      Keyboard.dismiss();
    } else {
      // Closing actions panel - refocus the text input to bring back keyboard
      setShouldRefocus(true);
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        textInputRef.current?.focus();
        setShouldRefocus(false);
      });
    }
  };

  const handleVoicePress = () => {
    if (isRecording) {
      onStopVoiceRecording?.();
    } else {
      onStartVoiceRecording?.();
    }
  };



  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 4) }]}>
      
      <View style={[styles.container, isExpanded && styles.expandedContainer]}>
        <View style={styles.inputContainer}>
        {/* Voice button - in the + position */}
        <TouchableOpacity style={[styles.voiceButton, isRecording && styles.recordingButton]} onPress={handleVoicePress}>
          <MaterialIcons 
            name={isRecording ? "stop" : "mic"} 
            size={20} 
            color={isRecording ? ChatTheme.background1 : ChatTheme.textSecondary} 
          />
        </TouchableOpacity>
        
        {/* Text input */}
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={message}
          onChangeText={handleTextChange}
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

        {/* Attachment button - moved beside emoji - hidden when stickers are shown */}
        {!showActions && (
          <TouchableOpacity style={styles.attachButton} onPress={handleAttachmentPress}>
            <MaterialIcons 
              name="add" 
              size={20} 
              color={ChatTheme.textSecondary} 
            />
          </TouchableOpacity>
        )}
        
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
});

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: ChatTheme.background1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: ChatSpacing.lg * 0.9, // Reduce horizontal padding by 10%
    paddingVertical: ChatSpacing.sm,
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
  voiceButton: {
    padding: ChatSpacing.xs,
    marginRight: ChatSpacing.xs,
  },
  recordingButton: {
    backgroundColor: ChatTheme.sendBubbleBackground,
    borderRadius: 16,
  },
  attachButton: {
    padding: ChatSpacing.xs,
    marginLeft: ChatSpacing.xs,
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
