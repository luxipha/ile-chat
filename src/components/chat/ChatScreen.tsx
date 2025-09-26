import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard,
  TouchableOpacity,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MessageBubble, Message } from './MessageBubble';
import { ChatHeader } from './ChatHeader';
import { MessageComposer } from './MessageComposer';
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
import aptosService from '../../services/aptosService';
import profileService from '../../services/profileService';

interface ChatScreenProps {
  chatId: string;
  chatName: string;
  chatAvatar?: string;
  isOnline?: boolean;
  isGroup?: boolean;
  onBack: () => void;
  onInfo?: () => void;
  onNavigateToMoments?: () => void;
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
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [showInChatTransfer, setShowInChatTransfer] = useState(false);
  const [showTransferConfirmation, setShowTransferConfirmation] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ name: string; avatar?: string; id: string; aptosAddress?: string } | null>(null);
  const [showChatActions, setShowChatActions] = useState(false);
  const [showComposerActions, setShowComposerActions] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Convert Firebase ChatMessage to local Message format
  const convertToLocalMessage = (chatMessage: ChatMessage, currentUserId: string): Message => {
    return {
      id: chatMessage._id,
      text: chatMessage.text,
      timestamp: chatMessage.createdAt,
      isOwn: chatMessage.user._id === currentUserId,
      status: 'read', // Default status
      senderName: chatMessage.user.name,
      senderAvatar: chatMessage.user.avatar,
      type: chatMessage.type || 'text',
      paymentData: chatMessage.paymentData ? {
        amount: chatMessage.paymentData.amount,
        currency: chatMessage.paymentData.currency,
        status: chatMessage.paymentData.status || 'pending',
        note: chatMessage.paymentData.note,
        senderName: chatMessage.user.name,
        recipientName: undefined, // Will be resolved from chat context
        transactionId: chatMessage.paymentData.transactionId,
      } : undefined,
    };
  };

  // Load messages when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        console.log('📱 Loading messages for chatId:', chatId);
        setLoading(true);
        const currentUser = await authService.getCachedUser();
        console.log('👤 Loading messages - Current user:', currentUser ? { id: currentUser.id, name: currentUser.name } : 'null');
        
        if (!currentUser) {
          console.log('❌ User not authenticated for loading messages');
          Alert.alert('Error', 'User not authenticated');
          return;
        }

        // Subscribe to real-time messages
        const unsubscribe = chatService.getMessages(chatId, (chatMessages: ChatMessage[]) => {
          const convertedMessages = chatMessages.map(msg => 
            convertToLocalMessage(msg, currentUser.id)
          );
          setMessages(convertedMessages);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading messages:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to load messages. Please try again.');
      }
    };

    const unsubscribe = loadMessages();
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        name: error.name,
        message: error.message,
        code: (error as any).code
      });
      
      Alert.alert('Error', 'Failed to send message. Please try again.');
      
      // Remove failed optimistic message
      setMessages(prev => prev.filter(msg => msg.id.startsWith('temp_')));
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

  const handleAvatarPress = async (message: Message) => {
    if (!message.isOwn && message.senderName) {
      // The senderName should contain the user's Firebase UID for proper lookup
      const userFirebaseId = message.senderName; // This should be Firebase UID
      
      try {
        // Get user profile which should contain the Aptos address
        const profileResult = await profileService.getUserProfile(userFirebaseId);
        
        if (profileResult.success && profileResult.profile) {
          setSelectedUser({
            name: profileResult.profile.name,
            avatar: profileResult.profile.avatar || message.senderAvatar,
            id: userFirebaseId,
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
      
      // Get recipient's Aptos address
      const recipientAddress = selectedUser.aptosAddress || selectedUser.id;
      
      if (!recipientAddress || recipientAddress === 'placeholder_address') {
        throw new Error('Recipient Aptos address not available. Please ensure the recipient has a wallet.');
      }

      // Execute transaction directly with crypto amounts
      if (walletId === 'usdc_aptos' || walletId === 'usdc_crossmint') {
        transactionResult = await aptosService.sendUSDC(recipientAddress, cryptoAmount);
        currency = 'USDC';
      } else if (walletId === 'apt_native') {
        transactionResult = await aptosService.sendAPT(recipientAddress, cryptoAmount);
        currency = 'APT';
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
              avatar: currentUser.user.avatar || null
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
                senderName: currentUser.user.name,
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
    setShowChatOptions(!showChatOptions);
  };

  const handleMuteChat = () => {
    setShowChatOptions(false);
    console.log('Mute chat:', chatName);
  };

  const handleClearChat = () => {
    setShowChatOptions(false);
    console.log('Clear chat:', chatName);
  };

  const handleBlockUser = () => {
    setShowChatOptions(false);
    console.log('Block user:', chatName);
  };

  const handleReportUser = () => {
    setShowChatOptions(false);
    console.log('Report user:', chatName);
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
    if (!isTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <MessageBubble
          message={{
            id: 'typing',
            text: '•••',
            timestamp: new Date(),
            isOwn: false,
            senderName: chatName,
          }}
          showSenderName={false}
        />
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

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
          onSendMessage={handleSendMessage}
          onSendPayment={handleSendPayment}
          onSendAttachment={handleSendAttachment}
          onActionsToggle={(show) => setShowComposerActions(show)}
        />

        {/* Message Composer Actions - Below text input like WeChat */}
        <MessageComposerActions
          visible={showComposerActions}
          onClose={() => setShowComposerActions(false)}
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
              
              const recipientId = participantIds.find(id => id !== currentUser.user.id);
              
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
              Alert.alert('Error', 'Network error. Please try again.');
            }
          }}
          onSendImage={(imageUri) => {
            console.log('📷 Send image:', imageUri);
            // TODO: Implement image message sending
          }}
          onSendDocument={(documentUri) => {
            console.log('📎 Send document:', documentUri);
            // TODO: Implement document message sending
          }}
        />
      </KeyboardAvoidingView>

      {/* Chat Actions Menu */}
      <ChatActionsMenu
        visible={showChatActions}
        onClose={() => setShowChatActions(false)}
        chatId={chatId}
        chatName={chatName}
        isGroup={isGroup}
        onMuteToggle={(isMuted) => console.log('🔇 Chat muted:', isMuted)}
        onClearChat={() => console.log('🗑️ Clear chat requested')}
        onBlockUser={() => console.log('🚫 Block user requested')}
        onReportUser={() => console.log('🚨 Report user requested')}
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