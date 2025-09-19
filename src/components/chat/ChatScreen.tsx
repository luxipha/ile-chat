import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { MessageBubble, Message } from './MessageBubble';
import { ChatHeader } from './ChatHeader';
import { MessageComposer } from './MessageComposer';
import { PublicProfileScreen } from '../profile/PublicProfileScreen';
import { SendMoneyModal } from '../wallet/SendMoneyModal';
import { GroupDetailsScreen } from './GroupDetailsScreen';
import { ChatTheme } from '../../theme/chatTheme';
import { Typography } from '../ui/Typography';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! I wanted to discuss the property investment opportunity we talked about.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isOwn: false,
      status: 'read',
      senderName: chatName,
      senderAvatar: chatAvatar,
      type: 'text',
    },
    {
      id: '2', 
      text: 'Sure! I\'m interested in learning more about the fractional ownership model.',
      timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
      isOwn: true,
      status: 'read',
      type: 'text',
    },
    {
      id: '3',
      text: 'Great! The property is located in a prime area with high growth potential. You can buy tokens representing ownership shares.',
      timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
      isOwn: false,
      status: 'read',
      senderName: chatName,
      senderAvatar: chatAvatar,
      type: 'text',
    },
    {
      id: '4',
      text: 'What\'s the minimum investment amount?',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      isOwn: true,
      status: 'read',
      type: 'text',
    },
    {
      id: '5',
      text: 'You can start with as little as $100. Each token represents a fraction of the property value.',
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      isOwn: false,
      status: 'read',
      senderName: chatName,
      senderAvatar: chatAvatar,
      type: 'text',
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ name: string; avatar?: string; id: string } | null>(null);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

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

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isOwn: true,
      status: 'sending',
      type: 'text',
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      );
    }, 1000);

    // Simulate typing indicator and response
    setTimeout(() => {
      setIsTyping(true);
    }, 2000);

    setTimeout(() => {
      setIsTyping(false);
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'That sounds like a great plan! Let me know if you need any help with the process.',
        timestamp: new Date(),
        isOwn: false,
        status: 'read',
        senderName: chatName,
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 4000);
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

  const handleAvatarPress = (message: Message) => {
    if (!message.isOwn && message.senderName) {
      setSelectedUser({
        name: message.senderName,
        avatar: message.senderAvatar,
        id: `user_${message.senderName.toLowerCase().replace(' ', '_')}`,
      });
      setShowPublicProfile(true);
    }
  };

  const handleSendMoneyFromProfile = () => {
    setShowPublicProfile(false);
    setShowSendMoney(true);
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
    <SafeAreaView style={styles.container}>
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
          onOptions={handleChatOptions}
          onGroupInfo={handleGroupInfo}
        />
        
        <View style={styles.messagesContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesListContent}
          />
          {renderTypingIndicator()}
        </View>
        
        <MessageComposer 
          onSendMessage={handleSendMessage}
          onSendPayment={handleSendPayment}
          onSendAttachment={handleSendAttachment}
        />
      </KeyboardAvoidingView>

      {/* Chat Options Menu */}
      {showChatOptions && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity onPress={handleMuteChat} style={styles.optionItem}>
            <MaterialIcons name="volume-off" size={20} color={ChatTheme.textSecondary} />
            <Typography variant="body1" style={styles.optionText}>Mute notifications</Typography>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearChat} style={styles.optionItem}>
            <MaterialIcons name="delete-sweep" size={20} color={ChatTheme.textSecondary} />
            <Typography variant="body1" style={styles.optionText}>Clear chat</Typography>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBlockUser} style={styles.optionItem}>
            <MaterialIcons name="block" size={20} color={ChatTheme.error} />
            <Typography variant="body1" style={[styles.optionText, { color: ChatTheme.error }]}>Block user</Typography>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReportUser} style={styles.optionItem}>
            <MaterialIcons name="report" size={20} color={ChatTheme.error} />
            <Typography variant="body1" style={[styles.optionText, { color: ChatTheme.error }]}>Report user</Typography>
          </TouchableOpacity>
        </View>
      )}

      {/* Send Money Modal */}
      <SendMoneyModal
        visible={showSendMoney}
        onClose={() => setShowSendMoney(false)}
        recipientName={selectedUser?.name || chatName}
        onSendComplete={handleSendComplete}
      />
    </SafeAreaView>
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
});