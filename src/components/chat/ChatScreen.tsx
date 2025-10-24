import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard,
  TouchableOpacity,
  Alert,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { MessageBubble, Message } from './MessageBubble';
import { ChatHeader } from './ChatHeader';
import { MessageComposer, MessageComposerRef } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { PublicProfileScreen } from '../profile/PublicProfileScreen';
import { SendMoneyModal } from '../wallet/SendMoneyModal';
import { InChatTransferModal } from './InChatTransferModal';
import { TransferConfirmationModal } from './TransferConfirmationModal';
import { GroupDetailsScreen } from './GroupDetailsScreen';
import { ChatActionsMenu } from './ChatActionsMenu';
import { MessageComposerActions } from './MessageComposerActions';
import { ChatTheme } from '../../theme/chatTheme';
import { Typography } from '../ui/Typography';
import chatService, { ChatMessage } from '../../services/chatService';
import authService from '../../services/authService';
// aptosService removed - using Circle/Hedera instead
import baseService from '../../services/baseService';
import profileService from '../../services/profileService';
import { audioService } from '../../services/audioService';
import { locationService, LocationData } from '../../services/locationService';
import { LocationShareModal } from './LocationShareModal';
import { StickerData } from '../../types/sticker';

interface ChatScreenProps {
  chatId: string;
  chatName: string;
  chatAvatar?: string;
  isOnline?: boolean;
  isGroup?: boolean;
  onBack: () => void;
  onInfo?: () => void;
  onNavigateToMoments?: () => void;
  // onStartVideoCall?: () => void;
  // onStartVoiceCall?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  chatId,
  chatName,
  chatAvatar,
  isOnline = false,
  isGroup = false,
  onBack,
  onInfo,
  onNavigateToMoments,
  // onStartVideoCall,
  // onStartVoiceCall,
}) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get('window');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [showInChatTransfer, setShowInChatTransfer] = useState(false);
  const [showTransferConfirmation, setShowTransferConfirmation] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ name: string; avatar?: string; id: string; aptosAddress?: string; baseAddress?: string } | null>(null);
  const [showChatActions, setShowChatActions] = useState(false);
  const [showComposerActions, setShowComposerActions] = useState(false);
  const [actionPanelMode, setActionPanelMode] = useState<'actions' | 'stickers'>('actions');
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showLocationShare, setShowLocationShare] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const messageComposerRef = useRef<MessageComposerRef>(null);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Convert Firebase ChatMessage to local Message format
  const convertToLocalMessage = async (chatMessage: ChatMessage, currentUserId: string): Promise<Message> => {
    // Extract display name from the message
    let displayName = chatMessage.user.name || '';
    
    console.log('🔍 convertToLocalMessage called:', {
      messageId: chatMessage._id,
      userId: chatMessage.user._id,
      originalName: chatMessage.user.name,
      displayName: displayName,
      nameLength: displayName.length,
      nameStartsWithUser: displayName.startsWith('User '),
      shouldLookupProfile: !displayName || displayName.trim() === '' || displayName.startsWith('User ') || displayName.length < 2
    });
    
    // Only do profile lookup if name is completely missing or is a generic "User" name
    if (!displayName || displayName.trim() === '' || displayName.startsWith('User ') || displayName.length < 2) {
      try {
        console.log('🔍 Looking up user profile for:', chatMessage.user._id);
        const profileResult = await profileService.getUserProfile(chatMessage.user._id);
        console.log('📋 Profile lookup result:', {
          success: profileResult.success,
          hasProfile: !!profileResult.profile,
          profileName: profileResult.profile?.name,
          error: profileResult.error
        });
        
        if (profileResult.success && profileResult.profile?.name && profileResult.profile.name.trim() !== '') {
          displayName = profileResult.profile.name;
          console.log('✅ Resolved display name:', displayName);
        } else {
          // Better fallback: try to extract email username or use "Anonymous User"
          const userId = chatMessage.user._id;
          if (userId.includes('@')) {
            // If it's an email, use the part before @
            displayName = userId.split('@')[0];
          } else {
            // Use "Anonymous User" instead of cryptic user ID
            displayName = 'Anonymous User';
          }
          console.log('⚠️ Using improved fallback display name:', displayName);
        }
      } catch (error) {
        console.warn('Failed to lookup user profile:', error);
        // Better fallback for errors too
        const userId = chatMessage.user._id;
        if (userId.includes('@')) {
          displayName = userId.split('@')[0];
        } else {
          displayName = 'Anonymous User';
        }
      }
    }

    return {
      id: chatMessage._id,
      text: chatMessage.text,
      timestamp: chatMessage.createdAt,
      isOwn: chatMessage.user._id === currentUserId,
      status: 'read', // Default status
      senderName: chatMessage.user._id, // Use Firebase UID for API calls
      senderDisplayName: displayName, // Resolved display name for UI
      senderAvatar: chatMessage.user.avatar,
      type: (chatMessage.type || 'text') as 'text' | 'payment' | 'attachment' | 'loan_request' | 'loan_funded' | 'loan_offer' | 'loan_repayment' | 'sticker' | 'image' | 'audio' | 'location',
      imageUrl: chatMessage.imageUrl, // Add imageUrl for image messages
      audioUrl: chatMessage.audioUrl, // Add audioUrl for audio messages
      audioDuration: chatMessage.audioDuration, // Add audioDuration for audio messages
      locationData: chatMessage.locationData, // Add locationData for location messages
      paymentData: chatMessage.paymentData ? {
        amount: chatMessage.paymentData.amount,
        currency: chatMessage.paymentData.currency,
        status: chatMessage.paymentData.status as 'pending' | 'completed' | 'failed',
        note: chatMessage.paymentData.note,
      } : undefined,
      stickerData: chatMessage.stickerData,
    };
  };

  // Load messages when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        console.log('📱 Loading messages for chatId:', chatId);
        setLoading(true);
        const user = await authService.getCachedUser();
        console.log('👤 Loading messages - Current user:', user ? { id: user.id, name: user.name } : 'null');
        
        if (!user) {
          console.log('❌ User not authenticated for loading messages');
          Alert.alert('Error', 'User not authenticated');
          return () => {};
        }

        setCurrentUser(user);

        // Subscribe to real-time messages
        const unsubscribe = chatService.getMessages(chatId, async (chatMessages: ChatMessage[]) => {
          const convertedMessages = await Promise.all(
            chatMessages.map(msg => convertToLocalMessage(msg, user.id))
          );
          
          setMessages(convertedMessages);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading messages:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to load messages. Please try again.');
        return () => {};
      }
    };

    let unsubscribe: (() => void) | undefined;
    
    loadMessages().then((unsub) => {
      unsubscribe = unsub;
    });
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [chatId]);

  // Subscribe to typing status
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔔 Setting up typing status subscription for:', { chatId, userId: currentUser.id });

    const unsubscribe = chatService.subscribeToTypingStatus(
      chatId, 
      currentUser.id, 
      (typingUsers: { userId: string; userName: string }[]) => {
        console.log('📨 Received typing status update:', typingUsers);
        
        // Convert to the format expected by TypingIndicator
        const formattedTypingUsers = typingUsers.map(user => ({
          id: user.userId,
          name: user.userName,
        }));
        
        console.log('👥 Processed typing users:', formattedTypingUsers);
        setTypingUsers(formattedTypingUsers);
      }
    );

    return () => {
      console.log('🔕 Cleaning up typing status subscription');
      unsubscribe();
    };
  }, [chatId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if user is blocked (only when actions menu is opened)
  const checkBlockStatus = async () => {
    if (isGroup) return; // Don't check for groups
    
    try {
      const currentUser = await authService.getCachedUser();
      if (!currentUser) return;
      
      const participantIds = chatId.includes('_') ? chatId.split('_') : [chatId];
      const otherUserId = participantIds.find(id => id !== currentUser.id);
      
      if (otherUserId) {
        const blocked = await chatService.isUserBlocked(otherUserId, currentUser.id);
        setIsUserBlocked(blocked);
      }
    } catch (error) {
      console.error('Failed to check block status:', error);
    }
  };

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => scrollToBottom(), 100);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  const handleSendMessage = async (text: string) => {
    try {
      console.log('💬 Sending message:', { text, chatId });
      const currentUser = await authService.getCachedUser();
      console.log('👤 Current user:', currentUser ? { id: currentUser.id, name: currentUser.name } : 'null');
      
      if (!currentUser) {
        console.log('❌ No current user found');
        Alert.alert('Error', 'Please sign in to send messages');
        return;
      }

      // Check if user is blocked before sending message
      if (!isGroup) {
        const participantIds = chatId.includes('_') ? chatId.split('_') : [chatId];
        const otherUserId = participantIds.find(id => id !== currentUser.id);
        
        if (otherUserId) {
          const blocked = await chatService.isUserBlocked(otherUserId, currentUser.id);
          if (blocked) {
            Alert.alert(
              'Unable to Send Message',
              'You have blocked this user. To send messages, you can unblock them in Settings > Blocked Users.'
            );
            return;
          }

          // Check if current user is blocked by the other user
          const blockedByOther = await chatService.isUserBlocked(currentUser.id, otherUserId);
          if (blockedByOther) {
            Alert.alert(
              'Message Not Delivered',
              'Your message could not be delivered. This user may have blocked you or changed their privacy settings.'
            );
            return;
          }
        }
      }

      // Create optimistic message for immediate UI feedback
      const optimisticMessage: Message = {
        id: `temp_${Date.now()}`,
        text,
        timestamp: new Date(),
        isOwn: true,
        status: 'sending',
        type: 'text',
      };

      setMessages(prev => [...prev, optimisticMessage]);

      // Send message via Firebase
      const sender = {
        _id: currentUser.id,
        name: currentUser.name || 'User',
        avatar: (currentUser as any).profilePicture || (currentUser as any).avatar || null, // Handle undefined avatar properly
      };

      // Extract recipient ID from chatId if possible
      const recipientId = chatId.includes('_') 
        ? chatId.split('_').find(id => id !== currentUser.id)
        : undefined;
      
      console.log('📤 Sending message with sender:', sender, 'to recipient:', recipientId);
      await chatService.sendMessage(chatId, text, sender, recipientId);
      console.log('✅ Message sent successfully');

      // Remove optimistic message (real message will come through the listener)
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));

    } catch (error) {
      console.error('❌ Error sending message:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        code: (error as any).code
      });
      
      Alert.alert('Error', 'Failed to send message. Please try again.');
      
      // Remove failed optimistic message
      setMessages(prev => prev.filter(msg => msg.id.startsWith('temp_')));
    }
  };

  const handleStickerSelect = async (sticker: StickerData) => {
    try {
      console.log('🎭 Sending sticker from text input:', sticker);
      
      // Get current user for sender info
      const currentUser = await authService.getCachedUser();
      if (!currentUser) {
        Alert.alert('Error', 'Please log in to send stickers.');
        return;
      }

      // Check if user is blocked before sending sticker
      if (!isGroup) {
        const participantIds = chatId.includes('_') ? chatId.split('_') : [chatId];
        const otherUserId = participantIds.find(id => id !== currentUser.id);
        
        if (otherUserId) {
          const blocked = await chatService.isUserBlocked(otherUserId, currentUser.id);
          if (blocked) {
            Alert.alert(
              'Unable to Send Sticker',
              'You have blocked this user. To send messages, you can unblock them in Settings > Blocked Users.'
            );
            return;
          }

          const blockedByOther = await chatService.isUserBlocked(currentUser.id, otherUserId);
          if (blockedByOther) {
            Alert.alert(
              'Sticker Not Delivered',
              'Your sticker could not be delivered. This user may have blocked you or changed their privacy settings.'
            );
            return;
          }
        }
      }

      const sender = {
        _id: currentUser.id,
        name: currentUser.name || 'User',
        // Only include avatar if it exists, otherwise omit the field entirely
        ...(currentUser.avatar && { avatar: currentUser.avatar }),
      };

      // Send the sticker message
      await chatService.sendStickerMessage(chatId, sticker, sender);
      
      console.log('✅ Sticker sent successfully from text input');
    } catch (error) {
      console.error('Failed to send sticker from text input:', error);
      Alert.alert('Error', 'Failed to send sticker. Please try again.');
    }
  };

  const handleSendPayment = (amount: number, currency: string) => {
    const paymentMessage: Message = {
      id: Date.now().toString(),
      text: `Payment sent: $${amount} ${currency}`,
      timestamp: new Date(),
      isOwn: true,
      status: 'sending',
      type: 'payment',
      paymentData: {
        amount,
        currency,
        status: 'pending',
      },
    };

    setMessages(prev => [...prev, paymentMessage]);

    // Simulate payment processing
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === paymentMessage.id 
            ? { 
                ...msg, 
                status: 'delivered',
                paymentData: { ...msg.paymentData!, status: 'completed' }
              }
            : msg
        )
      );
    }, 2000);
  };

  const handleSendAttachment = (type: 'camera' | 'gallery' | 'document') => {
    const attachmentMessage: Message = {
      id: Date.now().toString(),
      text: `${type} attachment`,
      timestamp: new Date(),
      isOwn: true,
      status: 'sending',
      type: 'attachment',
      attachmentData: {
        type,
        filename: `${type}_${Date.now()}.${type === 'document' ? 'pdf' : 'jpg'}`,
      },
    };

    setMessages(prev => [...prev, attachmentMessage]);

    // Simulate attachment upload
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === attachmentMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
    }, 1500);
  };

  const handleHeaderAvatarPress = async () => {
    if (isGroup) {
      // For group chats, show group info instead
      handleGroupInfo();
      return;
    }
    
    try {
      // Extract the other user's ID from the chatId
      // chatId format: "userId1_userId2"
      const currentUser = await authService.getSession();
      if (!currentUser.success || !currentUser.user?.id) {
        Alert.alert('Error', 'Unable to get current user information');
        return;
      }
      
      const participantIds = chatId.includes('_') ? chatId.split('_') : [chatId];
      const otherUserId = participantIds.find(id => id !== currentUser.user!.id);
      
      if (!otherUserId) {
        console.error('Unable to identify other user from chatId:', chatId);
        Alert.alert('Error', 'Unable to identify user');
        return;
      }
      
      console.log('👤 Getting profile for user ID:', otherUserId);
      
      // Get user profile using the correct Firebase UID
      const profileResult = await profileService.getUserProfile(otherUserId);
      
      if (profileResult.success && profileResult.profile) {
        setSelectedUser({
          name: profileResult.profile.name,
          avatar: profileResult.profile.avatar || chatAvatar,
          id: otherUserId,
          aptosAddress: profileResult.profile.aptosAddress,
        });
        setShowPublicProfile(true);
      } else {
        Alert.alert('Error', 'Unable to get user information');
      }
    } catch (error) {
      console.error('Failed to get user profile:', error);
      Alert.alert('Error', 'Unable to get user information');
    }
  };

  const handleStartVoiceRecording = async () => {
    try {
      console.log('🎤 Starting voice recording from composer');
      await audioService.startRecording();
      setIsVoiceRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
      Alert.alert('Error', 'Failed to start voice recording. Please check microphone permissions.');
    }
  };

  const handleStopVoiceRecording = async () => {
    try {
      console.log('🛑 Stopping voice recording from composer');
      const audioUri = await audioService.stopRecording();
      setIsVoiceRecording(false);

      if (audioUri) {
        const duration = await audioService.getAudioDuration(audioUri);
        console.log('🎵 Audio recorded from composer:', audioUri, 'Duration:', duration);
        
        // Send the audio message immediately
        const currentUser = await authService.getSession();
        if (!currentUser.success || !currentUser.user) {
          Alert.alert('Error', 'Please log in to send voice messages.');
          return;
        }

        const user = currentUser.user;
        const sender = {
          _id: user.id,
          name: user.name,
          // Only include avatar if it exists, otherwise omit the field entirely
          ...(user.avatar && { avatar: user.avatar }),
        };

        // Extract recipient ID from chatId if possible
        const recipientId = chatId.includes('_') 
          ? chatId.split('_').find(id => id !== user.id)
          : undefined;

        console.log('📤 Sending audio message from composer...', { chatId, audioUri, duration, sender, recipientId });
        
        // Send the audio message
        const result = await chatService.sendAudioMessage(chatId, audioUri, duration, sender, recipientId);
        
        if (result.success) {
          console.log('✅ Audio message sent successfully from composer:', result.messageId);
        } else {
          console.error('❌ Failed to send audio message from composer:', result.error);
          Alert.alert('Error', result.error || 'Failed to send voice message. Please try again.');
        }
      } else {
        Alert.alert('Recording Error', 'No audio was recorded or recording was too short.');
      }
    } catch (error) {
      console.error('Error stopping voice recording:', error);
      setIsVoiceRecording(false);
      Alert.alert('Error', 'Failed to stop voice recording');
    }
  };

  const handleLocationShare = async (location: LocationData) => {
    try {
      console.log('📍 Sharing location:', location);
      
      // Get current user for sender info
      const currentUser = await authService.getSession();
      if (!currentUser.success || !currentUser.user) {
        Alert.alert('Error', 'Please log in to share location.');
        return;
      }

      const user = currentUser.user;
      const sender = {
        _id: user.id,
        name: user.name,
        // Only include avatar if it exists, otherwise omit the field entirely
        ...(user.avatar && { avatar: user.avatar }),
      };

      // Extract recipient ID from chatId if possible
      const recipientId = chatId.includes('_') 
        ? chatId.split('_').find(id => id !== user.id)
        : undefined;

      console.log('📤 Sending location message...', { chatId, location, sender, recipientId });
      
      // Send the location message
      await chatService.sendLocationMessage(chatId, location, sender, recipientId);
      
      console.log('✅ Location message sent successfully');
      setShowLocationShare(false);
      
    } catch (error) {
      console.error('❌ Error sending location message:', error);
      Alert.alert('Error', 'Failed to share location. Please try again.');
    }
  };

  const handleAvatarPress = async (message: Message) => {
    if (!message.isOwn && message.senderName) {
      // The senderName should contain the user's Firebase UID for proper lookup
      const userFirebaseId = message.senderName; // This should be Firebase UID
      
      try {
        // Get user profile which should contain the Aptos address
        const profileResult = await profileService.getUserProfile(userFirebaseId);
        
        if (profileResult.success && profileResult.profile) {
          console.log('👤 Profile data received:', {
            id: userFirebaseId,
            name: profileResult.profile.name,
            aptosAddress: profileResult.profile.aptosAddress,
            baseAddress: profileResult.profile.baseAddress,
            allKeys: Object.keys(profileResult.profile)
          });
          
          setSelectedUser({
            name: profileResult.profile.name,
            avatar: profileResult.profile.avatar || message.senderAvatar,
            id: userFirebaseId,
            aptosAddress: profileResult.profile.aptosAddress,
            baseAddress: profileResult.profile.baseAddress,
          });
          setShowPublicProfile(true);
        } else {
          Alert.alert('Error', 'Unable to get user information');
        }
      } catch (error) {
        console.error('Failed to get user profile:', error);
        Alert.alert('Error', 'Unable to get user information');
      }
    }
  };

  const handleSendMoneyFromProfile = () => {
    setShowPublicProfile(false);
    setShowInChatTransfer(true);
  };

  const handleInChatTransferContinue = (amount: string, note: string) => {
    setTransferAmount(amount);
    setTransferNote(note);
    setShowInChatTransfer(false);
    setShowTransferConfirmation(true);
  };

  const handleTransferConfirm = async (walletId: string) => {
    if (!selectedUser) return;

    setIsProcessing(true);

    try {
      const cryptoAmount = parseFloat(transferAmount);
      let transactionResult;
      let currency = 'USDC';
      
      // Get recipient address based on wallet type
      let recipientAddress;
      
      if (walletId === 'usdc_base') {
        // For Base transfers, use Base address only
        recipientAddress = selectedUser.baseAddress;
        
        console.log('🔍 Base transfer attempt:', {
          selectedUserId: selectedUser.id,
          selectedUserName: selectedUser.name,
          baseAddress: selectedUser.baseAddress,
          aptosAddress: selectedUser.aptosAddress,
          walletId: walletId
        });
        
        // If baseAddress is not available, try to fetch fresh profile data
        if (!recipientAddress || recipientAddress === 'placeholder_address') {
          console.log('🔄 Base address not available, fetching fresh profile data...');
          
          try {
            const freshProfile = await profileService.getUserProfile(selectedUser.id, true); // Force refresh
            if (freshProfile.success && freshProfile.profile?.baseAddress) {
              recipientAddress = freshProfile.profile.baseAddress;
              console.log('✅ Found Base address in fresh profile:', recipientAddress);
              
              // Update selectedUser with fresh data
              setSelectedUser(prev => prev ? {
                ...prev,
                baseAddress: freshProfile.profile?.baseAddress,
                aptosAddress: freshProfile.profile?.aptosAddress || prev.aptosAddress
              } : null);
            }
          } catch (profileError) {
            console.error('❌ Failed to fetch fresh profile:', profileError);
          }
        }
        
        if (!recipientAddress || recipientAddress === 'placeholder_address') {
          throw new Error('Recipient Base address not available. Please ensure the recipient has a Base wallet set up.');
        }
      } else {
        // For Aptos transfers, use Aptos address
        recipientAddress = selectedUser.aptosAddress || selectedUser.id;
        if (!recipientAddress || recipientAddress === 'placeholder_address') {
          throw new Error('Recipient Aptos address not available. Please ensure the recipient has a wallet.');
        }
      }

      // Execute transaction directly with crypto amounts
      if (walletId === 'usdc_aptos' || walletId === 'usdc_' || walletId === 'apt_native') {
        // Aptos service removed
        throw new Error('Aptos transfers temporarily unavailable - support removed');
      } else if (walletId === 'usdc_base') {
        // Base USDC transfer support
        transactionResult = await baseService.sendUSDC(recipientAddress, cryptoAmount);
        currency = 'USDC (Base)';
        
        console.log('🔍 Base transaction result:', {
          success: transactionResult.success,
          hash: transactionResult.hash,
          transactionHash: transactionResult.transactionHash,
          allKeys: Object.keys(transactionResult)
        });
      } else {
        throw new Error('Unsupported wallet type');
      }

      if (!transactionResult.success) {
        throw new Error(transactionResult.error || 'Transaction failed');
      }

      // Don't add local message - let Firebase real-time listener handle it

      // Save payment message to Firebase so it persists and recipient sees it
      try {
        const currentUser = await authService.getSession();
        if (currentUser.success && currentUser.user) {
          console.log('💾 Saving payment message to Firebase');
          
          // Send payment message that both sender and recipient will see
          await chatService.sendMessage(
            chatId,
            `Sent ${cryptoAmount.toFixed(currency === 'APT' ? 4 : 2)} ${currency}`,
            {
              _id: currentUser.user.id,
              name: currentUser.user.name || 'You',
              avatar: currentUser.user.avatar || undefined
            },
            selectedUser.id,
            'payment',
            {
              paymentData: {
                amount: cryptoAmount,
                currency: currency,
                status: 'completed',
                note: transferNote,
                transactionId: transactionResult.hash,
                senderName: chatName,
                recipientName: selectedUser.name,
              }
            }
          );

          console.log('✅ Payment message saved to Firebase');
        }
      } catch (firebaseError) {
        console.error('❌ Failed to save payment to Firebase:', firebaseError);
        // Don't fail the whole transaction for Firebase errors
      }

      // Reset transfer state
      setTransferAmount('');
      setTransferNote('');
      setShowTransferConfirmation(false);
      setSelectedUser(null);

      Alert.alert(
        'Payment Sent Successfully!', 
        `${cryptoAmount.toFixed(currency === 'APT' ? 4 : 2)} ${currency} sent to ${selectedUser.name}\n\nTransaction ID: ${transactionResult.hash?.slice(-8)}`
      );

      console.log('✅ Payment completed:', {
        recipient: selectedUser,
        amount: cryptoAmount,
        currency: currency,
        hash: transactionResult.hash,
        note: transferNote,
        walletId
      });

    } catch (error) {
      console.error('❌ Payment failed:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('insufficient')) {
        Alert.alert(
          'Insufficient Balance', 
          'You don\'t have enough balance to complete this transaction. Please add funds to your wallet.'
        );
      } else if (errorMessage.includes('gas') || errorMessage.includes('fee')) {
        Alert.alert(
          'Insufficient Gas', 
          'You need APT for transaction fees. Please ensure you have some APT in your wallet.'
        );
      } else {
        Alert.alert('Payment Failed', `Transaction failed: ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransferBack = () => {
    setShowTransferConfirmation(false);
    setShowInChatTransfer(true);
  };

  const handleCloseAllTransferModals = () => {
    setShowInChatTransfer(false);
    setShowTransferConfirmation(false);
    setTransferAmount('');
    setTransferNote('');
  };

  const handleMessageFromProfile = () => {
    setShowPublicProfile(false);
    // Already in chat, just close profile
  };

  const handleSendComplete = (amount: number, token: any) => {
    // Add money transfer message to chat
    const transferMessage: Message = {
      id: Date.now().toString(),
      text: `Sent ${amount} ${token.symbol}`,
      timestamp: new Date(),
      isOwn: true,
      status: 'delivered',
      type: 'payment',
      paymentData: {
        amount,
        currency: token.symbol,
        status: 'completed',
      },
    };

    setMessages(prev => [...prev, transferMessage]);
  };

  const handleViewMoments = () => {
    setShowPublicProfile(false);
    // Navigate to moments screen
    console.log('View moments for', selectedUser?.name);
  };

  const handleShareProfile = () => {
    setShowPublicProfile(false);
    // Share profile functionality
    console.log('Share profile for', selectedUser?.name);
  };

  const handleChatOptions = () => {
    if (!showChatOptions) {
      checkBlockStatus(); // Only check when opening the menu
    }
    setShowChatOptions(!showChatOptions);
  };

  const handleMuteChat = (isMuted: boolean) => {
    console.log('🔇 Chat muted:', isMuted, 'for:', chatName);
    // TODO: Implement actual mute functionality
  };

  const handleClearChat = async () => {
    setShowChatOptions(false);
    
    try {
      console.log('🗑️ Clearing chat:', chatName, 'ID:', chatId);
      
      // Show loading state
      setLoading(true);
      
      // Clear all messages from Firebase
      await chatService.clearMessages(chatId);
      
      console.log('✅ Chat cleared successfully');
      
    } catch (error) {
      console.error('❌ Failed to clear chat:', error);
      Alert.alert(
        'Error', 
        'Failed to clear chat messages. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    try {
      console.log('🚫 Block user:', chatName, 'chatId:', chatId);
      
      // Get current user
      const currentUser = await authService.getCachedUser();
      if (!currentUser) {
        Alert.alert('Error', 'Please log in to block users.');
        return;
      }
      
      // Extract the other user's ID from the chat ID
      const participantIds = chatId.includes('_') ? chatId.split('_') : [chatId];
      const otherUserId = participantIds.find(id => id !== currentUser.id);
      
      if (!otherUserId) {
        Alert.alert('Error', 'Unable to identify user to block.');
        return;
      }
      
      if (isUserBlocked) {
        // Unblock the user
        await chatService.unblockUser(otherUserId, currentUser.id);
        setIsUserBlocked(false);
        
        Alert.alert(
          'User Unblocked',
          `${chatName} has been unblocked. You can now receive messages from them.`
        );
      } else {
        // Block the user
        await chatService.blockUser(otherUserId, currentUser.id);
        setIsUserBlocked(true);
        
        Alert.alert(
          'User Blocked',
          `${chatName} has been blocked. They will no longer be able to send you messages.`
        );
      }
      
    } catch (error) {
      console.error('❌ Failed to block user:', error);
      Alert.alert('Error', 'Failed to block user. Please try again.');
    }
  };

  const handleReportUser = async () => {
    try {
      console.log('🚨 Report user:', chatName, 'chatId:', chatId);
      
      // Get current user
      const currentUser = await authService.getCachedUser();
      if (!currentUser) {
        Alert.alert('Error', 'Please log in to report users.');
        return;
      }
      
      // Extract the other user's ID from the chat ID
      const participantIds = chatId.includes('_') ? chatId.split('_') : [chatId];
      const otherUserId = participantIds.find(id => id !== currentUser.id);
      
      if (!otherUserId) {
        Alert.alert('Error', 'Unable to identify user to report.');
        return;
      }
      
      // Show reason selection dialog
      Alert.alert(
        'Report User',
        `Why are you reporting ${chatName}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Spam',
            onPress: () => submitReport(otherUserId, currentUser.id, 'spam'),
          },
          {
            text: 'Harassment',
            onPress: () => submitReport(otherUserId, currentUser.id, 'harassment'),
          },
          {
            text: 'Inappropriate Content',
            onPress: () => submitReport(otherUserId, currentUser.id, 'inappropriate_content'),
          },
          {
            text: 'Other',
            onPress: () => submitReport(otherUserId, currentUser.id, 'other'),
          },
        ],
        { cancelable: true }
      );
      
    } catch (error) {
      console.error('❌ Failed to report user:', error);
      Alert.alert('Error', 'Failed to report user. Please try again.');
    }
  };

  const submitReport = async (userId: string, currentUserId: string, reason: string) => {
    try {
      await chatService.reportUser(userId, currentUserId, reason);
      
      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it and take appropriate action.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Failed to submit report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleGroupInfo = () => {
    if (isGroup) {
      setShowGroupDetails(true);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showSenderName = !item.isOwn && (!prevMessage || prevMessage.isOwn);
    
    return (
      <MessageBubble
        message={item}
        showSenderName={showSenderName}
        showAvatar={true}
        onAvatarPress={handleAvatarPress}
      />
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    return (
      <View style={styles.typingContainer}>
        <TypingIndicator typingUsers={typingUsers} />
      </View>
    );
  };

  if (showGroupDetails && isGroup) {
    return (
      <GroupDetailsScreen
        onBack={() => setShowGroupDetails(false)}
        groupId={chatId}
        groupName={chatName}
        groupAvatar={chatAvatar}
        isAdmin={true}
        isPrivateGroup={true}
        hasWallet={false}
      />
    );
  }

  if (showPublicProfile && selectedUser) {
    return (
      <PublicProfileScreen
        onBack={() => setShowPublicProfile(false)}
        onMessage={handleMessageFromProfile}
        onSendMoney={handleSendMoneyFromProfile}
        onViewMoments={handleViewMoments}
        onShareProfile={handleShareProfile}
        onNavigateToMoments={() => {
          setShowPublicProfile(false);
          onNavigateToMoments?.();
        }}
        userName={selectedUser.name}
        userAvatar={selectedUser.avatar}
        userId={selectedUser.id}
      />
    );
  }

  // Calculate responsive keyboard offset based on device and safe area
  const getKeyboardOffset = () => {
    const baseOffset = Platform.OS === 'ios' ? 0 : 0;
    const safeAreaOffset = insets.bottom;
    
    // For devices with home indicator (iPhone X and newer), we need less offset
    // For devices without home indicator, we need more offset
    if (Platform.OS === 'ios') {
      return safeAreaOffset > 20 ? baseOffset : baseOffset + 20;
    } else {
      // Android: adjust based on screen height and safe area
      return baseOffset + Math.max(0, 20 - safeAreaOffset);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={getKeyboardOffset()}
      >
        <ChatHeader
          name={chatName}
          avatar={chatAvatar}
          isOnline={isOnline}
          isTyping={isTyping}
          isGroup={isGroup}
          onBack={onBack}
          onOptions={() => setShowChatActions(true)}
          onGroupInfo={handleGroupInfo}
          onAvatarPress={handleHeaderAvatarPress}
        />
        
        <View style={styles.messagesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Typography variant="body2" color="textSecondary">Loading messages...</Typography>
            </View>
          ) : (
            <>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={scrollToBottom}
                style={styles.messagesList}
                contentContainerStyle={[
                  styles.messagesListContent,
                  messages.length === 0 && styles.emptyMessages
                ]}
                ListEmptyComponent={
                  !loading ? (
                    <View style={styles.emptyMessagesContainer}>
                      <MaterialIcons name="message" size={48} color={ChatTheme.textSecondary} />
                      <Typography variant="h6" style={styles.emptyTitle}>
                        Start a conversation
                      </Typography>
                      <Typography variant="body2" color="textSecondary" style={styles.emptyDescription}>
                        Send a message to begin chatting with {chatName}
                      </Typography>
                    </View>
                  ) : null
                }
              />
              {renderTypingIndicator()}
            </>
          )}
        </View>
        
        <MessageComposer 
          ref={messageComposerRef}
          onSendMessage={handleSendMessage}
          onSendPayment={handleSendPayment}
          onSendAttachment={handleSendAttachment}
          onStartVoiceRecording={handleStartVoiceRecording}
          onStopVoiceRecording={handleStopVoiceRecording}
          showActions={showComposerActions} // Pass the action panel state
          onActionsToggle={(show, mode) => {
            console.log('🎛️ Actions toggle:', { show, mode, current: { showComposerActions, actionPanelMode } });
            setShowComposerActions(show);
            setActionPanelMode(mode);
          }}
          chatId={chatId}
          currentUser={currentUser}
          isRecording={isVoiceRecording}
        />

        {/* Message Composer Actions - Below text input like WeChat */}
        <MessageComposerActions
          visible={showComposerActions}
          mode={actionPanelMode}
          currentUserId={currentUser?.id}
          onClose={() => {
            setShowComposerActions(false);
            // Refocus the input when action panel closes
            setTimeout(() => {
              messageComposerRef.current?.refocusInput();
            }, 100);
          }}
          onSendMoney={async () => {
            setShowComposerActions(false);
            
            try {
              // Get current user to determine the other participant
              const currentUser = await authService.getSession();
              if (!currentUser.success || !currentUser.user) {
                Alert.alert('Error', 'Please log in to send money.');
                return;
              }

              // Extract recipient user ID from conversation ID
              // chatId format: "userId1_userId2"
              console.log('💬 Chat ID:', chatId);
              console.log('💬 Current user ID:', currentUser.user.id);
              
              const participantIds = chatId.includes('_') ? chatId.split('_') : [chatId];
              console.log('💬 Participant IDs:', participantIds);
              
              const recipientId = participantIds.find(id => id !== currentUser.user?.id);
              
              if (!recipientId) {
                console.error('💬 Unable to identify recipient from:', { chatId, currentUserId: currentUser.user.id, participantIds });
                Alert.alert('Error', 'Unable to identify recipient.');
                return;
              }

              console.log('💬 Getting profile for recipient:', recipientId);
              
              // Get the recipient's profile including their Aptos address
              const profileResult = await profileService.getUserProfile(recipientId);
              
              if (profileResult.success && profileResult.profile) {
                setSelectedUser({
                  name: profileResult.profile.name,
                  avatar: profileResult.profile.avatar,
                  id: recipientId,
                  aptosAddress: profileResult.profile.aptosAddress,
                });
                setShowInChatTransfer(true);
              } else {
                Alert.alert('Error', 'Unable to get recipient wallet address. Please make sure the recipient has an active wallet.');
              }
            } catch (error) {
              console.error('Failed to get recipient profile:', error);
              // Keep console logging for debugging, but remove user-facing alert
            }
          }}
          onSendImage={async (imageUri) => {
            console.log('📷 Send image:', imageUri);
            
            try {
              // Get current user for sender info
              const currentUser = await authService.getSession();
              if (!currentUser.success || !currentUser.user) {
                Alert.alert('Error', 'Please log in to send images.');
                return;
              }

              const user = currentUser.user; // Extract user for type safety
              const sender = {
                _id: user.id,
                name: user.name,
                // Only include avatar if it exists, otherwise omit the field entirely
                ...(user.avatar && { avatar: user.avatar }),
              };

              // Extract recipient ID from chatId if possible
              const recipientId = chatId.includes('_') 
                ? chatId.split('_').find(id => id !== user.id)
                : undefined;

              console.log('📤 Sending image message...', { chatId, imageUri, sender, recipientId });
              
              // Send the image message
              const result = await chatService.sendImageMessage(chatId, imageUri, sender, recipientId);
              
              if (result.success) {
                console.log('✅ Image message sent successfully:', result.messageId);
                // Close the action panel
                setShowComposerActions(false);
              } else {
                console.error('❌ Failed to send image message:', result.error);
                Alert.alert('Error', result.error || 'Failed to send image. Please try again.');
              }
              
            } catch (error) {
              console.error('❌ Error sending image message:', error);
              Alert.alert('Error', 'Failed to send image. Please try again.');
            }
          }}
          onSendDocument={(documentUri) => {
            console.log('📎 Send document:', documentUri);
            // TODO: Implement document message sending
          }}
          onSendSticker={async (sticker) => {
            console.log('🎭 Send sticker:', sticker);
            console.log('🎭 Sticker details:', {
              id: sticker.id,
              name: sticker.name,
              url: sticker.url,
              title: sticker.title,
              hasUrl: !!sticker.url,
              fullSticker: JSON.stringify(sticker, null, 2)
            });
            
            try {
              // Get current user for sender info
              const currentUser = await authService.getSession();
              if (!currentUser.success || !currentUser.user) {
                Alert.alert('Error', 'Please log in to send stickers.');
                return;
              }

              const sender = {
                _id: currentUser.user.id,
                name: currentUser.user.name,
                // Only include avatar if it exists, otherwise omit the field entirely
                ...(currentUser.user.avatar && { avatar: currentUser.user.avatar }),
              };

              // Send the sticker message
              await chatService.sendStickerMessage(chatId, sticker, sender);
              
              console.log('✅ Sticker sent successfully');
            } catch (error) {
              console.error('Failed to send sticker:', error);
              Alert.alert('Error', 'Failed to send sticker. Please try again.');
            }
          }}
          onSendAudio={async (audioUri, duration) => {
            console.log('🎵 Send audio:', audioUri, 'Duration:', duration);
            
            try {
              // Get current user for sender info
              const currentUser = await authService.getSession();
              if (!currentUser.success || !currentUser.user) {
                Alert.alert('Error', 'Please log in to send voice messages.');
                return;
              }

              const user = currentUser.user;
              const sender = {
                _id: user.id,
                name: user.name,
                // Only include avatar if it exists, otherwise omit the field entirely
                ...(user.avatar && { avatar: user.avatar }),
              };

              // Extract recipient ID from chatId if possible
              const recipientId = chatId.includes('_') 
                ? chatId.split('_').find(id => id !== user.id)
                : undefined;

              console.log('📤 Sending audio message...', { chatId, audioUri, duration, sender, recipientId });
              
              // Send the audio message
              const result = await chatService.sendAudioMessage(chatId, audioUri, duration, sender, recipientId);
              
              if (result.success) {
                console.log('✅ Audio message sent successfully:', result.messageId);
                // Close the action panel
                setShowComposerActions(false);
              } else {
                console.error('❌ Failed to send audio message:', result.error);
                Alert.alert('Error', result.error || 'Failed to send voice message. Please try again.');
              }
              
            } catch (error) {
              console.error('❌ Error sending audio message:', error);
              Alert.alert('Error', 'Failed to send voice message. Please try again.');
            }
          }}
          onSendLocation={() => {
            console.log('📍 Location button pressed');
            setShowLocationShare(true);
          }}
          // onStartVideoCall={() => {
          //   console.log('📹 Video call button pressed');
          //   onStartVideoCall?.();
          // }}
          // onStartVoiceCall={() => {
          //   console.log('📞 Voice call button pressed');
          //   onStartVoiceCall?.();
          // }}
        />
      </KeyboardAvoidingView>

      {/* Chat Actions Menu */}
      <ChatActionsMenu
        visible={showChatActions}
        onClose={() => setShowChatActions(false)}
        chatId={chatId}
        chatName={chatName}
        isGroup={isGroup}
        isUserBlocked={isUserBlocked}
        onMuteToggle={handleMuteChat}
        onClearChat={handleClearChat}
        onBlockUser={handleBlockUser}
        onReportUser={handleReportUser}
      />

      {/* Send Money Modal */}
      <SendMoneyModal
        visible={showSendMoney}
        onClose={() => setShowSendMoney(false)}
        recipientName={selectedUser?.name || chatName}
        onSendComplete={handleSendComplete}
      />

      {/* New In-Chat Transfer Modals */}
      {selectedUser && (
        <>
          <InChatTransferModal
            visible={showInChatTransfer}
            onClose={handleCloseAllTransferModals}
            recipient={selectedUser}
            onContinue={handleInChatTransferContinue}
          />

          <TransferConfirmationModal
            visible={showTransferConfirmation}
            onClose={handleCloseAllTransferModals}
            recipient={selectedUser}
            amount={transferAmount}
            note={transferNote}
            onConfirm={handleTransferConfirm}
            onBack={handleTransferBack}
          />
        </>
      )}

      {/* Location Share Modal */}
      <LocationShareModal
        visible={showLocationShare}
        onClose={() => setShowLocationShare(false)}
        onShareLocation={handleLocationShare}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatTheme.background2,
  },
  messagesContainer: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  typingContainer: {
    opacity: 0.7,
  },
  optionsMenu: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: ChatTheme.background1,
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionText: {
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyMessages: {
    flexGrow: 1,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
});