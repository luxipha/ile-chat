import { getFirestore, getFirebaseFieldValue, getFirebaseAuth, isUsingExpoFirebase } from './firebaseConfig';
import { Conversation } from '../components/chat/ConversationList';
import { apiClient } from './api';
import { API_BASE_URL } from '../config/apiConfig';
import profileService from './profileService';
import { StickerData } from '../types/sticker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = getFirestore();
const FieldValue = getFirebaseFieldValue();
const firebaseAuthInstance = getFirebaseAuth();

console.log(
  '🔥 [Chat Debug] Firebase auth state at chatService init:',
  {
    isUsingExpo: isUsingExpoFirebase(),
    currentUid: firebaseAuthInstance?.currentUser?.uid || null,
    hasCurrentUser: !!firebaseAuthInstance?.currentUser,
  }
);

console.log(
  '🔧 [Chat Debug] Using',
  isUsingExpoFirebase() ? 'Firebase Web compat SDK' : 'React Native Firebase',
  'for chat service'
);

// Firestore collections using React Native Firebase
const conversationsCollection = db.collection('conversations');
const messagesCollection = (conversationId: string) => db.collection(`conversations/${conversationId}/messages`);

const snapshotExists = (snapshot: any): boolean => {
  if (!snapshot) {
    return false;
  }

  if (typeof snapshot.exists === 'function') {
    return snapshotExists(snapshot);
  }

  return !!snapshot.exists;
};

// Helper function to create consistent conversation IDs
const createConversationId = (userId1: string, userId2: string): string => {
  // Sort user IDs to ensure consistent conversation ID regardless of order
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Helper function to create trade-specific conversation IDs
const createTradeConversationId = (userId1: string, userId2: string, tradeId?: string): string => {
  const sortedIds = [userId1, userId2].sort();
  const baseId = `${sortedIds[0]}_${sortedIds[1]}`;
  return tradeId ? `trade_${baseId}_${tradeId}` : `trade_${baseId}`;
};

// Helper function to create trade room conversation IDs
const createTradeRoomId = (tradeId: string): string => {
  return `traderoom_${tradeId}`;
};

// Helper function to check if a conversation ID is trade-related
const isTradeConversation = (conversationId: string): boolean => {
  return conversationId.startsWith('trade_') || conversationId.startsWith('traderoom_');
};

// Helper function to extract trade ID from trade conversation ID
const extractTradeId = (conversationId: string): string | null => {
  if (conversationId.startsWith('traderoom_')) {
    return conversationId.replace('traderoom_', '');
  }
  if (conversationId.startsWith('trade_')) {
    const parts = conversationId.split('_');
    return parts.length >= 4 ? parts[3] : null;
  }
  return null;
};

// This is a simplified representation for messages, matching react-native-gifted-chat
export interface ChatMessage {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  type?: string;
  imageUrl?: string; // Add imageUrl for image messages
  paymentData?: {
    amount: number;
    currency: string;
    status: string;
    note?: string;
    transactionId?: string;
    senderName?: string;
    recipientName?: string;
    receipt?: string;
    method?: string;
  };
  paymentRequest?: {
    requestId: string;
    amount: number;
    currency: string;
    note?: string;
    status: string;
    deepLink: string;
    creatorId?: string;
    expiresAt?: string;
    paidAt?: string;
    network?: string;
  };
  stickerData?: StickerData;
  disputeData?: {
    reason: string;
    status?: string;
    openedBy?: string;
  };
  audioUrl?: string;
  audioDuration?: number;
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
    name?: string;
  };
}

// Interface for group member data
export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member';
  isOnline?: boolean;
  lastSeen?: string;
  email?: string;
  joinedAt?: Date;
}

// Interface for group details
export interface GroupDetails {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  participants: string[];
  admins: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    allowMembersToAddOthers?: boolean;
    onlyAdminsCanSend?: boolean;
    disappearingMessages?: boolean;
    privacy?: 'public' | 'private';
  };
  hasWallet?: boolean;
  walletAddress?: string;
}

const chatService = {
  /**
   * Listens for real-time updates to a user's conversations.
   * @param userId The ID of the current user.
   * @param callback A function to call with the updated list of conversations.
   * @returns An unsubscribe function to stop listening for updates.
   */
  getConversations: (userId: string, callback: (conversations: Conversation[]) => void) => {
    console.log('🔄 Loading conversations for userId:', userId);
    console.log('🔥 [Chat Debug] Auth state before conversations query:', {
      currentUid: firebaseAuthInstance?.currentUser?.uid || null,
      hasCurrentUser: !!firebaseAuthInstance?.currentUser,
      providerData: firebaseAuthInstance?.currentUser?.providerData || [],
    });
    
    const q = conversationsCollection
      .where('participants', 'array-contains', userId);

    const unsubscribe = q.onSnapshot(async (querySnapshot) => {
      console.log('📱 Firestore conversations query result:', {
        docsCount: querySnapshot.docs.length,
        isEmpty: querySnapshot.empty
      });
      
      // Filter out trade room conversations from public chat list
      const filteredDocs = querySnapshot.docs.filter(doc => {
        const conversationId = doc.id;
        const isTradeRoom = conversationId.startsWith('chat_') || 
                           conversationId.startsWith('trade_') || 
                           conversationId.startsWith('traderoom_');
        return !isTradeRoom;
      });
      
      console.log('🔍 Filtered conversations:', {
        total: querySnapshot.docs.length,
        filtered: filteredDocs.length,
        excluded: querySnapshot.docs.length - filteredDocs.length
      });
      
      const conversations: Conversation[] = await Promise.all(
        filteredDocs.map(async (doc) => {
          const data = doc.data();
          console.log('📋 Conversation data:', { 
            id: doc.id, 
            participants: data.participants,
            lastMessage: data.lastMessage,
            type: data.type 
          });
          
          // For direct chats, get the other participant's ID to generate name
          const participants = data.participants || [];
          const otherParticipantId = participants.find((p: string) => p !== userId);
          
          // Generate a display name using user lookup
          let displayName = 'Chat';
          let avatarUrl = data.avatar;
          if (data.type === 'direct' && otherParticipantId) {
            // Validate user ID format before making API call
            const isValidUserId = otherParticipantId.length >= 12 && /^[a-zA-Z0-9]+$/.test(otherParticipantId);
            
            if (isValidUserId) {
              try {
                const profileResult = await profileService.getUserProfile(otherParticipantId);
                console.log('🔍 Profile lookup result for conversation:', {
                  otherParticipantId,
                  success: profileResult.success,
                  hasProfile: !!profileResult.profile,
                  profileName: profileResult.profile?.name,
                  profileAvatar: profileResult.profile?.avatar,
                  conversationId: doc.id
                });
                
                if (profileResult.success && profileResult.profile && profileResult.profile.name) {
                  displayName = profileResult.profile.name;
                } else {
                  // Enhanced fallback logic
                  displayName = `User ${otherParticipantId.slice(-6)}`;
                }

                if (profileResult.success && profileResult.profile?.avatar) {
                  avatarUrl = profileResult.profile.avatar;
                }
              } catch (error) {
                console.error('Failed to get user profile for chat:', {
                  error,
                  otherParticipantId,
                  conversationId: doc.id
                });
                displayName = `User ${otherParticipantId.slice(-6)}`;
              }
            } else {
              console.warn('Invalid user ID format in conversation:', {
                otherParticipantId,
                conversationId: doc.id,
                participants: data.participants
              });
              displayName = `User ${otherParticipantId?.slice(-6) || 'Unknown'}`;
            }
          } else if (data.name) {
            displayName = data.name; // For group chats
          }
          
          return {
            id: doc.id,
            name: displayName,
            lastMessage: data.lastMessage?.text || 'No messages yet',
            timestamp: data.lastMessage?.createdAt?.toDate() || new Date(),
            unreadCount: 0, // This needs to be calculated
            isGroup: data.type === 'group' || false,
            avatar: avatarUrl,
            isOnline: false,
            profileUserId: data.type === 'direct' ? otherParticipantId : undefined,
          } as Conversation;
        })
      );
      
      // Filter out trade conversations from normal chat list
      const normalConversations = conversations.filter(conv => !isTradeConversation(conv.id));
      
      console.log('🔍 Filtered conversations:', {
        total: conversations.length,
        tradeConversations: conversations.length - normalConversations.length,
        normalConversations: normalConversations.length
      });
      
      // Deduplicate conversations that might exist with different ID orders
      const conversationMap = new Map<string, Conversation>();
      
      normalConversations.forEach(conv => {
        // Extract participant IDs from conversation ID
        const participantIds = conv.id.split('_');
        if (participantIds.length === 2) {
          // Create a normalized key using sorted participant IDs
          const normalizedKey = createConversationId(participantIds[0], participantIds[1]);
          
          // Keep the conversation with the most recent message
          const existing = conversationMap.get(normalizedKey);
          if (!existing || conv.timestamp > existing.timestamp) {
            conversationMap.set(normalizedKey, conv);
          }
        } else {
          // For group conversations or other formats, use the original ID
          conversationMap.set(conv.id, conv);
        }
      });
      
      // Convert map back to array and sort
      const deduplicatedConversations = Array.from(conversationMap.values()).sort((a, b) => {
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      
      console.log('✅ Processed conversations:', deduplicatedConversations.length);
      console.log(`📊 Original: ${conversations.length}, Deduplicated: ${deduplicatedConversations.length}`);
      deduplicatedConversations.forEach(conv => {
        console.log(`  - ${conv.name}: "${conv.lastMessage}"`);
      });
      callback(deduplicatedConversations);
    });

    return unsubscribe; // Return the function to detach the listener
  },

  /**
   * Sends a new message to a conversation.
   * @param conversationId The ID of the conversation.
   * @param messageText The text of the message.
   * @param sender The user object of the sender.
   * @param recipientId Optional recipient ID for direct messages.
   * @param messageType Optional message type (text, payment, etc.).
   * @param metadata Optional additional data for special message types.
   */
  sendMessage: async (
    conversationId: string, 
    messageText: string, 
    sender: { _id: string; name: string; avatar?: string }, 
    recipientId?: string,
    messageType: string = 'text',
    metadata?: any
  ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    console.log('💬 ChatService: Sending message...', {
      conversationId,
      messageType,
      senderName: sender.name,
      messagePreview: messageText.slice(0, 50) + '...',
      hasMetadata: !!metadata,
      senderId: sender._id
    });
    
    // Clean sender data to prevent Firebase undefined errors
    const cleanSender = {
      _id: sender._id,
      name: sender.name,
      // Only include avatar if it has a valid value
      ...(sender.avatar ? { avatar: sender.avatar } : {})
    };
    
    const messageData = {
      text: messageText,
      createdAt: FieldValue.serverTimestamp(),
      user: cleanSender,
      type: messageType,
      ...metadata, // Include payment data, etc.
    };

    let messageId: string | undefined;

    try {
      // Add the message to the messages subcollection
      const messagesRef = messagesCollection(conversationId);
      console.log('🔥 ChatService: About to call addDoc with:', {
        conversationId,
        messageData,
        messagesRefPath: `conversations/${conversationId}/messages`
      });
      
      const messageDoc = await messagesRef.add(messageData);
      messageId = messageDoc.id;
      
      console.log('✅ ChatService: Message sent successfully:', {
        messageId,
        conversationId,
        messageType
      });
    } catch (addDocError) {
      console.error('❌ ChatService: FAILED to add message to Firestore:', {
        error: addDocError,
        conversationId,
        senderId: sender._id,
        senderName: sender.name,
        messageText
      });
      throw addDocError; // Re-throw to prevent silent failures
    }

    // Update or create the parent conversation document with the last message
    const conversationRef = db.doc(`conversations/${conversationId}`);
    try {
      console.log('📝 ChatService: Updating conversation document:', conversationId);
      
      await conversationRef.update( {
        lastMessage: {
          text: messageText,
          createdAt: FieldValue.serverTimestamp(),
          senderId: sender._id,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      console.log('✅ ChatService: Conversation updated successfully');
    } catch (error: any) {
      console.log('🔍 ChatService: Conversation update failed, error:', {
        errorCode: error.code,
        errorMessage: error.message,
        conversationId,
        senderId: sender._id
      });
      
      // If conversation doesn't exist, create it
      if (error.code === 'not-found') {
        console.log('📝 ChatService: Creating new conversation document:', conversationId);
        
        // Extract participants from conversationId (format: userId1_userId2)
        const participants = conversationId.includes('_') 
          ? conversationId.split('_')
          : [sender._id, recipientId].filter(Boolean);
        
        console.log('👥 ChatService: Conversation participants:', participants);
        
        try {
          await conversationRef.set( {
            participants: participants,
            type: 'direct',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            lastMessage: {
              text: messageText,
              createdAt: FieldValue.serverTimestamp(),
              senderId: sender._id,
            },
          });
          
          console.log('✅ ChatService: New conversation created successfully');
        } catch (createError) {
          console.error('❌ ChatService: FAILED to create conversation:', {
            error: createError,
            conversationId,
            participants
          });
          throw createError;
        }
      } else {
        console.error('❌ ChatService: Unexpected conversation update error:', error);
        throw error; // Re-throw other errors
      }
    }

    return {
      success: true,
      messageId,
    };
  },

  /**
   * Sends a sticker message to a conversation.
   * @param conversationId The ID of the conversation.
   * @param sticker The sticker data to send.
   * @param sender The user object of the sender.
   * @param recipientId Optional recipient ID for direct messages.
   */
  sendStickerMessage: async (
    conversationId: string,
    sticker: StickerData,
    sender: { _id: string; name: string; avatar?: string },
    recipientId?: string
  ) => {
    console.log('🎭 ChatService: Sending sticker message...', {
      conversationId,
      stickerName: sticker.name,
      stickerEmoji: sticker.emoji,
      senderName: sender.name,
    });

    const messageData = {
      text: sticker.title || sticker.name || '🎭 Sticker', // Use title, name, or fallback text
      createdAt: FieldValue.serverTimestamp(),
      user: sender,
      type: 'sticker',
      stickerData: sticker,
    };

    // Add the message to the messages subcollection
    const messagesRef = messagesCollection(conversationId);
    const messageDoc = await messagesRef.add(messageData);

    console.log('✅ ChatService: Sticker message sent successfully:', {
      messageId: messageDoc.id,
      conversationId,
      stickerName: sticker.name,
    });

    // Update or create the parent conversation document with the last message
    const conversationRef = db.doc(`conversations/${conversationId}`);
    try {
      await conversationRef.update( {
        lastMessage: {
          text: '[sticker]', // Show generic sticker text in conversation list
          createdAt: FieldValue.serverTimestamp(),
          senderId: sender._id,
        },
      });
    } catch (error: any) {
      // If conversation doesn't exist, create it
      if (error.code === 'not-found') {
        console.log('📝 Creating new conversation document for sticker:', conversationId);

        // Extract participants from conversationId (format: userId1_userId2)
        const participants = conversationId.includes('_')
          ? conversationId.split('_')
          : [sender._id, recipientId].filter(Boolean);

        console.log('👥 Conversation participants:', participants);

        await conversationRef.set( {
          participants: participants,
          type: 'direct',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          lastMessage: {
            text: '[sticker]',
            createdAt: FieldValue.serverTimestamp(),
            senderId: sender._id,
          },
        });
      } else {
        throw error; // Re-throw other errors
      }
    }
  },

  /**
   * Listens for real-time messages in a specific conversation.
   * @param conversationId The ID of the conversation.
   * @param callback A function to call with the updated list of messages.
   * @returns An unsubscribe function to stop listening for updates.
   */
  getMessages: (conversationId: string, callback: (messages: ChatMessage[]) => void) => {
    const q = messagesCollection(conversationId)
      .orderBy('createdAt', 'asc')
      .limit(50);

    const unsubscribe = q.onSnapshot((querySnapshot) => {
      const messages: ChatMessage[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          _id: doc.id,
          text: data.text,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          user: data.user,
          type: data.type || 'text', // Include message type
          imageUrl: data.imageUrl, // Include imageUrl for image messages
          paymentData: data.paymentData ? {
            ...data.paymentData,
            // Ensure all required fields are present
            amount: data.paymentData.amount || 0,
            currency: data.paymentData.currency || 'USDC',
            status: data.paymentData.status || 'pending',
            note: data.paymentData.note,
            transactionId: data.paymentData.transactionId,
            senderName: data.paymentData.senderName || data.user.name,
            recipientName: data.paymentData.recipientName,
            receipt: data.paymentData.receipt,
            method: data.paymentData.method,
          } : undefined,
          stickerData: data.stickerData ? {
            id: data.stickerData.id,
            emoji: data.stickerData.emoji,
            name: data.stickerData.name,
            category: data.stickerData.category,
            // GIPHY sticker fields
            url: data.stickerData.url,
            previewUrl: data.stickerData.previewUrl,
            width: data.stickerData.width,
            height: data.stickerData.height,
            title: data.stickerData.title,
          } : undefined,
          paymentRequest: data.paymentRequest ? {
            requestId: data.paymentRequest.requestId,
            amount: data.paymentRequest.amount,
            currency: data.paymentRequest.currency || 'USDC',
            note: data.paymentRequest.note,
            status: data.paymentRequest.status || 'pending',
            deepLink: data.paymentRequest.deepLink,
            creatorId: data.paymentRequest.creatorId,
            expiresAt: data.paymentRequest.expiresAt,
            paidAt: data.paymentRequest.paidAt,
            network: data.paymentRequest.network,
          } : undefined,
          disputeData: data.disputeData ? {
            reason: data.disputeData.reason,
            status: data.disputeData.status,
            openedBy: data.disputeData.openedBy,
          } : undefined,
          audioUrl: data.audioUrl,
          audioDuration: data.audioDuration,
          locationData: data.locationData,
        };
      });
      callback(messages);
    });

    return unsubscribe;
  },

  /**
   * Ensures a conversation exists with participants and appropriate TTL.
   * Trade conversations have shorter expiry times than normal conversations.
   */
  ensureConversation: async (conversationId: string, participants: string[], isGroup: boolean = false) => {
    const conversationRef = db.doc(`conversations/${conversationId}`);
    const snap = await conversationRef.get();
    
    // Determine expiry time based on conversation type
    const isTradeChat = isTradeConversation(conversationId);
    const expiryTime = isTradeChat 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days for trade chats
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for normal chats
    
    if (!snapshotExists(snap)) {
      await conversationRef.set( {
        participants,
        type: isGroup ? 'group' : 'direct',
        isTradeChat,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt: expiryTime,
      });
    } else {
      const data = snap.data();
      if (!data.expiresAt || (isTradeChat && !data.isTradeChat)) {
        await conversationRef.update( {
          expiresAt: expiryTime,
          isTradeChat,
        });
      }
    }
  },

  /**
   * Sends an audio message to a conversation.
   * @param conversationId The ID of the conversation.
   * @param audioUri The URI of the recorded audio file.
   * @param audioDuration The duration of the audio in milliseconds.
   * @param sender The user object of the sender.
   * @param recipientId Optional recipient ID for direct messages.
   */
  sendAudioMessage: async (
    conversationId: string,
    audioUri: string,
    audioDuration: number,
    sender: { _id: string; name: string; avatar?: string },
    recipientId?: string
  ): Promise<{ success: boolean; messageId?: string; audioUrl?: string; error?: string }> => {
    try {
      console.log('🎵 Starting audio upload and message send...', { 
        conversationId, 
        audioUri, 
        audioDuration,
        senderName: sender.name 
      });

      // Create FormData for audio upload
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: `voice_message_${Date.now()}.m4a`,
      } as any);

      // Get auth token for the request
      const getAuthToken = async (): Promise<string | undefined> => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          return token || undefined;
        } catch (error) {
          console.error('Error getting auth token:', error);
          return undefined;
        }
      };

      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available for audio upload');
        return {
          success: false,
          error: 'Authentication required for audio upload',
        };
      }

      // Upload audio to backend
      console.log('📤 Uploading audio to backend...');
      const uploadUrl = `${API_BASE_URL}/api/firebase-auth/upload-audio`;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Audio upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error: errorText
        });
        return {
          success: false,
          error: `Failed to upload audio: ${uploadResponse.status} ${uploadResponse.statusText}`,
        };
      }

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        console.error('❌ Audio upload failed:', uploadData.error);
        return {
          success: false,
          error: uploadData.error || 'Failed to upload audio',
        };
      }

      const audioUrl = uploadData.audioUrl || uploadData.url;
      if (!audioUrl) {
        console.error('❌ No audio URL returned from upload');
        return {
          success: false,
          error: 'No audio URL returned from upload',
        };
      }

      console.log('✅ Audio uploaded successfully:', audioUrl);

      // Send the audio message
      const messageData = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: '', // Empty text for audio messages
        createdAt: FieldValue.serverTimestamp(),
        user: sender,
        type: 'audio',
        audioUrl: audioUrl,
        audioDuration: audioDuration,
        metadata: {
          originalUri: audioUri,
          uploadedAt: new Date().toISOString(),
        }
      };

      const messagesRef = messagesCollection(conversationId);
      const docRef = await messagesRef.add(messageData);
      
      console.log('✅ Audio message sent successfully:', docRef.id);

      // Update conversation's last message
      const conversationRef = conversationsCollection.doc(conversationId);
      await conversationRef.update( {
        lastMessage: {
          text: '🎵 Voice message',
          createdAt: FieldValue.serverTimestamp(),
          senderId: sender._id,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Schedule deletion of audio file from server after 30 days
      const deleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await docRef.update( {
        deleteAt: deleteAt,
      });

      return {
        success: true,
        messageId: docRef.id,
        audioUrl: audioUrl,
      };

    } catch (error) {
      console.error('❌ Failed to send audio message:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send audio message',
      };
    }
  },

  /**
   * Sends a location message to a conversation.
   * @param conversationId The ID of the conversation.
   * @param locationData The location data to send.
   * @param sender The user object of the sender.
   * @param recipientId Optional recipient ID for direct messages.
   */
  sendLocationMessage: async (
    conversationId: string,
    locationData: {
      latitude: number;
      longitude: number;
      address?: string;
      name?: string;
    },
    sender: { _id: string; name: string; avatar?: string },
    recipientId?: string
  ) => {
    console.log('📍 ChatService: Sending location message...', {
      conversationId,
      locationData,
      senderName: sender.name,
    });

    // Clean sender data to prevent Firebase undefined errors
    const cleanSender = {
      _id: sender._id,
      name: sender.name,
      // Only include avatar if it has a valid value
      ...(sender.avatar ? { avatar: sender.avatar } : {})
    };

    const messageData = {
      text: `📍 ${locationData.name || 'Shared Location'}`, // Display text for location
      createdAt: FieldValue.serverTimestamp(),
      user: cleanSender,
      type: 'location',
      locationData: locationData,
    };

    try {
      // Add the message to the messages subcollection
      const messagesRef = messagesCollection(conversationId);
      console.log('🔥 ChatService: About to send location message:', {
        conversationId,
        messageData,
        messagesRefPath: `conversations/${conversationId}/messages`
      });
      
      const messageDoc = await messagesRef.add(messageData);
      
      console.log('✅ ChatService: Location message sent successfully:', {
        messageId: messageDoc.id,
        conversationId,
      });
    } catch (addDocError) {
      console.error('❌ ChatService: FAILED to add location message to Firestore:', {
        error: addDocError,
        conversationId,
        senderId: sender._id,
        senderName: sender.name,
        locationData
      });
      throw addDocError;
    }

    // Update or create the parent conversation document with the last message
    const conversationRef = db.doc(`conversations/${conversationId}`);
    try {
      console.log('📝 ChatService: Updating conversation document:', conversationId);
      
      await conversationRef.update( {
        lastMessage: {
          text: `📍 ${locationData.name || 'Location'}`,
          createdAt: FieldValue.serverTimestamp(),
          senderId: sender._id,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      console.log('✅ ChatService: Conversation updated successfully');
    } catch (error: any) {
      console.log('🔍 ChatService: Conversation update failed, error:', {
        errorCode: error.code,
        errorMessage: error.message,
        conversationId,
        senderId: sender._id
      });
      
      // If conversation doesn't exist, create it
      if (error.code === 'not-found') {
        console.log('📝 ChatService: Creating new conversation document:', conversationId);
        
        // Extract participants from conversationId (format: userId1_userId2)
        const participants = conversationId.includes('_') 
          ? conversationId.split('_')
          : [sender._id, recipientId].filter(Boolean);
        
        console.log('👥 ChatService: Conversation participants:', participants);
        
        try {
          await conversationRef.set( {
            participants: participants,
            type: 'direct',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            lastMessage: {
              text: `📍 ${locationData.name || 'Location'}`,
              createdAt: FieldValue.serverTimestamp(),
              senderId: sender._id,
            },
          });
          
          console.log('✅ ChatService: New conversation created successfully');
        } catch (createError) {
          console.error('❌ ChatService: FAILED to create conversation:', {
            error: createError,
            conversationId,
            participants
          });
          throw createError;
        }
      } else {
        console.error('❌ ChatService: Unexpected conversation update error:', error);
        throw error;
      }
    }
  },

  /**
   * Subscribes to conversation metadata to get participants and expiry.
   */
  subscribeToConversationMeta: (
    conversationId: string,
    callback: (meta: { participants: string[]; expiresAt?: Date }) => void
  ) => {
    const conversationRef = db.doc(`conversations/${conversationId}`);
    const unsubscribe = conversationRef.onSnapshot((snap) => {
      if (!snapshotExists(snap)) {
        callback({ participants: [], expiresAt: undefined });
        return;
      }
      const data = snap.data();
      callback({
        participants: data.participants || [],
        expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined,
      });
    });
    return unsubscribe;
  },

  /**
   * Creates a new conversation between users
   * @param participants Array of user IDs to include in the conversation
   * @param isGroup Whether this is a group conversation
   * @param name Optional name for the conversation (required for groups)
   * @param description Optional description for the conversation
   * @param avatar Optional avatar URL for the conversation
   */
  createConversation: async (participants: string[], isGroup: boolean = false, name?: string, description?: string, avatar?: string) => {
    console.log('🔄 ChatService: Creating conversation...', {
      participantCount: participants.length,
      isGroup,
      name,
      hasDescription: !!description,
      hasAvatar: !!avatar
    });
    
    const conversationData = {
      participants: participants, // Use 'participants' to match query structure
      type: isGroup ? 'group' : 'direct', // Use 'type' to match existing structure
      name: name || '',
      description: description || '',
      avatar: avatar || undefined, // Add avatar field
      createdBy: participants[0], // Store the creator
      admins: isGroup ? [participants[0]] : [], // Creator is initial admin for groups
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      settings: isGroup ? {
        allowMembersToAddOthers: true,
        onlyAdminsCanSend: false,
        disappearingMessages: false,
        privacy: 'private',
      } : undefined,
      lastMessage: {
        text: isGroup ? `${name} group created` : '',
        createdAt: FieldValue.serverTimestamp(),
        senderId: participants[0], // Creator is first participant
      },
    };

    console.log('💾 ChatService: Saving conversation to Firebase...', {
      type: conversationData.type,
      name: conversationData.name,
      participantIds: participants
    });

    const docRef = await conversationsCollection.add(conversationData);
    const conversationId = docRef.id;
    
    console.log('✅ ChatService: Conversation created successfully:', {
      conversationId,
      type: isGroup ? 'group' : 'direct',
      name: name || 'Direct chat'
    });
    
    return conversationId;
  },

  /**
   * Finds an existing conversation between two users
   * @param userId1 First user ID
   * @param userId2 Second user ID
   * @returns Conversation ID if found, null otherwise
   */
  findDirectConversation: async (userId1: string, userId2: string): Promise<string | null> => {
    const q = conversationsCollection
      .where('participants', 'array-contains', userId1)
      .where('type', '==', 'direct');

    const querySnapshot = await q.get();
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      if (data.participants.includes(userId2)) {
        return doc.id;
      }
    }
    
    return null;
  },

  /**
   * Fetches detailed information about a group conversation
   * @param groupId The ID of the group conversation
   * @returns GroupDetails object with full group information
   */
  getGroupDetails: async (groupId: string): Promise<GroupDetails | null> => {
    try {
      console.log('🔄 ChatService: Fetching group details for:', groupId);
      
      const groupRef = db.doc(`conversations/${groupId}`);
      const groupSnapshot = await groupRef.get();
      
      if (!snapshotExists(groupSnapshot)) {
        console.warn('⚠️ Group not found:', groupId);
        return null;
      }
      
      const data = groupSnapshot.data();
      
      // Ensure this is actually a group conversation
      if (data.type !== 'group') {
        console.warn('⚠️ Conversation is not a group:', groupId);
        return null;
      }
      
      const groupDetails: GroupDetails = {
        id: groupSnapshot.id,
        name: data.name || 'Unnamed Group',
        description: data.description || '',
        avatar: data.avatar,
        participants: data.participants || [],
        admins: data.admins || [data.createdBy || data.participants?.[0]], // Default to creator as admin
        createdBy: data.createdBy || data.participants?.[0],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        settings: {
          allowMembersToAddOthers: data.settings?.allowMembersToAddOthers ?? true,
          onlyAdminsCanSend: data.settings?.onlyAdminsCanSend ?? false,
          disappearingMessages: data.settings?.disappearingMessages ?? false,
          privacy: data.settings?.privacy || 'private',
        },
        hasWallet: !!data.walletAddress,
        walletAddress: data.walletAddress,
      };
      
      console.log('✅ Group details fetched:', {
        id: groupDetails.id,
        name: groupDetails.name,
        memberCount: groupDetails.participants.length,
        adminCount: groupDetails.admins.length,
        hasWallet: groupDetails.hasWallet
      });
      
      return groupDetails;
      
    } catch (error) {
      console.error('❌ Failed to fetch group details:', error);
      throw error;
    }
  },

  /**
   * Fetches detailed member information for a group
   * @param groupId The ID of the group conversation
   * @returns Array of GroupMember objects with full profile data
   */
  getGroupMembers: async (groupId: string): Promise<GroupMember[]> => {
    try {
      console.log('🔄 ChatService: Fetching group members for:', groupId);
      
      // First get the group details to get participants and admins
      const groupDetails = await chatService.getGroupDetails(groupId);
      
      if (!groupDetails) {
        throw new Error('Group not found');
      }
      
      console.log('👥 Fetching profiles for participants:', {
        participantIds: groupDetails.participants,
        adminIds: groupDetails.admins
      });
      
      // Fetch profile data for all participants in parallel
      const memberPromises = groupDetails.participants.map(async (userId) => {
        try {
          const profileResult = await profileService.getUserProfile(userId);
          
          const member: GroupMember = {
            id: userId,
            name: profileResult.success && profileResult.profile 
              ? profileResult.profile.name 
              : `User ${userId.slice(-6)}`,
            avatar: profileResult.success && profileResult.profile 
              ? profileResult.profile.avatar 
              : undefined,
            email: undefined, // Email not available in ChatUserProfile
            role: groupDetails.admins.includes(userId) ? 'admin' : 'member',
            isOnline: false, // This could be enhanced with presence data
            lastSeen: 'Recently', // This could be enhanced with real last seen data
            joinedAt: groupDetails.createdAt, // This could be more accurate with join timestamps
          };
          
          return member;
        } catch (profileError) {
          console.warn(`⚠️ Failed to fetch profile for user ${userId}:`, profileError);
          
          // Return basic member info even if profile fetch fails
          const member: GroupMember = {
            id: userId,
            name: `User ${userId.slice(-6)}`,
            role: groupDetails.admins.includes(userId) ? 'admin' : 'member',
            isOnline: false,
            lastSeen: 'Recently',
            joinedAt: groupDetails.createdAt,
          };
          
          return member;
        }
      });
      
      const members = await Promise.all(memberPromises);
      
      // Sort members: admins first, then by name
      members.sort((a, b) => {
        // Admins first
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        
        // Then sort by name
        return a.name.localeCompare(b.name);
      });
      
      console.log('✅ Group members fetched:', {
        totalMembers: members.length,
        adminCount: members.filter(m => m.role === 'admin').length,
        memberCount: members.filter(m => m.role === 'member').length
      });
      
      return members;
      
    } catch (error) {
      console.error('❌ Failed to fetch group members:', error);
      throw error;
    }
  },

  /**
   * Updates group settings
   * @param groupId The ID of the group conversation
   * @param settings The settings to update
   */
  updateGroupSettings: async (groupId: string, settings: {
    name?: string;
    description?: string;
    allowMembersToAddOthers?: boolean;
    onlyAdminsCanSend?: boolean;
    disappearingMessages?: boolean;
    privacy?: 'public' | 'private';
  }) => {
    try {
      console.log('🔄 ChatService: Updating group settings for:', groupId, settings);
      
      const groupRef = db.doc(`conversations/${groupId}`);
      const updateData: any = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      // Update basic info
      if (settings.name !== undefined) {
        updateData.name = settings.name;
      }
      if (settings.description !== undefined) {
        updateData.description = settings.description;
      }
      
      // Update settings object
      const settingsUpdate: any = {};
      if (settings.allowMembersToAddOthers !== undefined) {
        settingsUpdate.allowMembersToAddOthers = settings.allowMembersToAddOthers;
      }
      if (settings.onlyAdminsCanSend !== undefined) {
        settingsUpdate.onlyAdminsCanSend = settings.onlyAdminsCanSend;
      }
      if (settings.disappearingMessages !== undefined) {
        settingsUpdate.disappearingMessages = settings.disappearingMessages;
      }
      if (settings.privacy !== undefined) {
        settingsUpdate.privacy = settings.privacy;
      }
      
      if (Object.keys(settingsUpdate).length > 0) {
        updateData['settings'] = settingsUpdate;
      }
      
      await groupRef.update( updateData);
      
      console.log('✅ Group settings updated successfully');
      
    } catch (error) {
      console.error('❌ Failed to update group settings:', error);
      throw error;
    }
  },

  /**
   * Updates admin roles for group members
   * @param groupId The ID of the group conversation
   * @param userId The user to promote/demote
   * @param makeAdmin True to promote to admin, false to demote to member
   */
  updateMemberRole: async (groupId: string, userId: string, makeAdmin: boolean) => {
    try {
      console.log('🔄 ChatService: Updating member role:', { groupId, userId, makeAdmin });
      
      const groupRef = db.doc(`conversations/${groupId}`);
      const groupSnapshot = await groupRef.get();
      
      if (!snapshotExists(groupSnapshot)) {
        throw new Error('Group not found');
      }
      
      const data = groupSnapshot.data();
      const currentAdmins = data.admins || [];
      
      let newAdmins: string[];
      
      if (makeAdmin) {
        // Add to admins if not already there
        newAdmins = currentAdmins.includes(userId) 
          ? currentAdmins 
          : [...currentAdmins, userId];
      } else {
        // Remove from admins
        newAdmins = currentAdmins.filter((adminId: string) => adminId !== userId);
        
        // Ensure at least one admin remains
        if (newAdmins.length === 0) {
          throw new Error('Cannot remove the last admin from the group');
        }
      }
      
      await groupRef.update( {
        admins: newAdmins,
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      console.log('✅ Member role updated successfully:', {
        userId,
        newRole: makeAdmin ? 'admin' : 'member',
        totalAdmins: newAdmins.length
      });
      
    } catch (error) {
      console.error('❌ Failed to update member role:', error);
      throw error;
    }
  },

  /**
   * Removes a member from the group
   * @param groupId The ID of the group conversation
   * @param userId The user to remove
   */
  removeMemberFromGroup: async (groupId: string, userId: string) => {
    try {
      console.log('🔄 ChatService: Removing member from group:', { groupId, userId });
      
      const groupRef = db.doc(`conversations/${groupId}`);
      const groupSnapshot = await groupRef.get();
      
      if (!snapshotExists(groupSnapshot)) {
        throw new Error('Group not found');
      }
      
      const data = groupSnapshot.data();
      const currentParticipants = data.participants || [];
      const currentAdmins = data.admins || [];
      
      // Remove from participants
      const newParticipants = currentParticipants.filter((participantId: string) => participantId !== userId);
      
      // Remove from admins if they were an admin
      const newAdmins = currentAdmins.filter((adminId: string) => adminId !== userId);
      
      // Ensure at least one admin remains if we removed an admin
      if (currentAdmins.includes(userId) && newAdmins.length === 0 && newParticipants.length > 0) {
        throw new Error('Cannot remove the last admin from the group');
      }
      
      // Ensure at least one participant remains
      if (newParticipants.length === 0) {
        throw new Error('Cannot remove the last member from the group');
      }
      
      await groupRef.update( {
        participants: newParticipants,
        admins: newAdmins,
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      console.log('✅ Member removed from group successfully:', {
        userId,
        remainingParticipants: newParticipants.length,
        remainingAdmins: newAdmins.length
      });
      
    } catch (error) {
      console.error('❌ Failed to remove member from group:', error);
      throw error;
    }
  },

  /**
   * Promotes a member to admin (convenience function)
   * @param groupId The ID of the group conversation
   * @param userId The user to promote
   */
  promoteToAdmin: async (groupId: string, userId: string) => {
    return chatService.updateMemberRole(groupId, userId, true);
  },

  /**
   * Removes admin role from a user (convenience function)
   * @param groupId The ID of the group conversation
   * @param userId The user to demote
   */
  removeAdmin: async (groupId: string, userId: string) => {
    return chatService.updateMemberRole(groupId, userId, false);
  },

  /**
   * Subscribes to real-time updates for group details
   * @param groupId The ID of the group conversation
   * @param callback Function called with updated group details
   * @returns Unsubscribe function to stop listening
   */
  subscribeToGroupDetails: (groupId: string, callback: (groupDetails: GroupDetails | null) => void) => {
    console.log('🔄 ChatService: Setting up real-time listener for group:', groupId);
    
    const groupRef = db.doc(`conversations/${groupId}`);
    
    const unsubscribe = groupRef.onSnapshot(
      (docSnapshot) => {
        try {
          if (!snapshotExists(docSnapshot)) {
            console.warn('⚠️ Group document does not exist:', groupId);
            callback(null);
            return;
          }
          
          const data = docSnapshot.data();
          
          // Ensure this is actually a group conversation
          if (data.type !== 'group') {
            console.warn('⚠️ Document is not a group conversation:', groupId);
            callback(null);
            return;
          }
          
          const groupDetails: GroupDetails = {
            id: docSnapshot.id,
            name: data.name || 'Unnamed Group',
            description: data.description || '',
            avatar: data.avatar,
            participants: data.participants || [],
            admins: data.admins || [data.createdBy || data.participants?.[0]], // Default to creator as admin
            createdBy: data.createdBy || data.participants?.[0],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            settings: {
              allowMembersToAddOthers: data.settings?.allowMembersToAddOthers ?? true,
              onlyAdminsCanSend: data.settings?.onlyAdminsCanSend ?? false,
              disappearingMessages: data.settings?.disappearingMessages ?? false,
              privacy: data.settings?.privacy || 'private',
            },
            hasWallet: !!data.walletAddress,
            walletAddress: data.walletAddress,
          };
          
          console.log('✅ Real-time group details updated:', {
            id: groupDetails.id,
            name: groupDetails.name,
            memberCount: groupDetails.participants.length,
            adminCount: groupDetails.admins.length,
            hasWallet: groupDetails.hasWallet,
            settingsChanged: true
          });
          
          callback(groupDetails);
          
        } catch (error) {
          console.error('❌ Error processing real-time group update:', error);
          callback(null);
        }
      },
      (error) => {
        console.error('❌ Real-time group listener error:', error);
        callback(null);
      }
    );
    
    return unsubscribe;
  },

  /**
   * Subscribes to real-time updates for group members
   * @param groupId The ID of the group conversation
   * @param callback Function called with updated member list
   * @returns Unsubscribe function to stop listening
   */
  subscribeToGroupMembers: (groupId: string, callback: (members: GroupMember[]) => void) => {
    console.log('🔄 ChatService: Setting up real-time listener for group members:', groupId);
    
    const groupRef = db.doc(`conversations/${groupId}`);
    
    const unsubscribe = groupRef.onSnapshot(
      async (docSnapshot) => {
        try {
          if (!snapshotExists(docSnapshot)) {
            console.warn('⚠️ Group document does not exist:', groupId);
            callback([]);
            return;
          }
          
          const data = docSnapshot.data();
          
          if (data.type !== 'group') {
            console.warn('⚠️ Document is not a group conversation:', groupId);
            callback([]);
            return;
          }
          
          const participants = data.participants || [];
          const admins = data.admins || [];
          
          // Fetch profile data for all participants in parallel
          const memberPromises = participants.map(async (userId: string) => {
            try {
              const profileResult = await profileService.getUserProfile(userId);
              
              const member: GroupMember = {
                id: userId,
                name: profileResult.success && profileResult.profile 
                  ? profileResult.profile.name 
                  : `User ${userId.slice(-6)}`,
                avatar: profileResult.success && profileResult.profile 
                  ? profileResult.profile.avatar 
                  : undefined,
                email: undefined, // Email not available in ChatUserProfile
                role: admins.includes(userId) ? 'admin' : 'member',
                isOnline: false, // This could be enhanced with presence data
                lastSeen: 'Recently', // This could be enhanced with real last seen data
                joinedAt: data.createdAt?.toDate() || new Date(),
              };
              
              return member;
            } catch (profileError) {
              console.warn(`⚠️ Failed to fetch profile for user ${userId}:`, profileError);
              
              // Return basic member info even if profile fetch fails
              const member: GroupMember = {
                id: userId,
                name: `User ${userId.slice(-6)}`,
                role: admins.includes(userId) ? 'admin' : 'member',
                isOnline: false,
                lastSeen: 'Recently',
                joinedAt: data.createdAt?.toDate() || new Date(),
              };
              
              return member;
            }
          });
          
          const members = await Promise.all(memberPromises);
          
          // Sort members: admins first, then by name
          members.sort((a, b) => {
            // Admins first
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (b.role === 'admin' && a.role !== 'admin') return 1;
            
            // Then sort by name
            return a.name.localeCompare(b.name);
          });
          
          console.log('✅ Real-time group members updated:', {
            totalMembers: members.length,
            adminCount: members.filter(m => m.role === 'admin').length,
            memberCount: members.filter(m => m.role === 'member').length
          });
          
          callback(members);
          
        } catch (error) {
          console.error('❌ Error processing real-time member update:', error);
          callback([]);
        }
      },
      (error) => {
        console.error('❌ Real-time members listener error:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
  },

  /**
   * Gets shared media from a group conversation
   * @param groupId The ID of the group conversation
   * @param options Query options for pagination and filtering
   * @returns Array of media messages
   */
  getGroupMedia: async (groupId: string, options: {
    limit?: number;
    startAfter?: any;
    mediaType?: 'image' | 'video' | 'document';
  } = {}) => {
    try {
      console.log('🔄 ChatService: Fetching group media for:', groupId, options);
      
      const { limit: queryLimit = 20, startAfter, mediaType } = options;
      
      // Build query for media messages - avoid composite index requirement
      // Instead of using 'in' query with orderBy, we'll fetch all messages and filter client-side
      let mediaQuery = messagesCollection(groupId)
        .orderBy('createdAt', 'desc')
        .limit(queryLimit * 2); // Get more docs to account for filtering
      
      // Add pagination if provided
      if (startAfter) {
        mediaQuery = messagesCollection(groupId)
          .orderBy('createdAt', 'desc')
          .startAfter(startAfter)
          .limit(queryLimit * 2); // Get more docs to account for filtering
      }
      
      const querySnapshot = await mediaQuery.get();
      
      // First filter for media messages (client-side to avoid index requirement)
      let mediaMessages = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.text || '',
            type: data.type,
            createdAt: data.createdAt?.toDate() || new Date(),
            user: data.user,
            // Media-specific data
            imageUrl: data.imageUrl,
            videoUrl: data.videoUrl,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            thumbnail: data.thumbnail,
          };
        })
        .filter(msg => {
          // Filter for media types
          const mediaTypes = ['image', 'video', 'document', 'file'];
          return mediaTypes.includes(msg.type) || 
                 (msg.imageUrl || msg.videoUrl || msg.fileUrl || msg.mimeType);
        })
        .slice(0, queryLimit); // Limit to requested amount after filtering
      
      // Further filter by specific media type if requested
      if (mediaType) {
        mediaMessages = mediaMessages.filter(msg => {
          switch (mediaType) {
            case 'image':
              return msg.type === 'image' || (msg.mimeType && msg.mimeType.startsWith('image/'));
            case 'video':
              return msg.type === 'video' || (msg.mimeType && msg.mimeType.startsWith('video/'));
            case 'document':
              return msg.type === 'document' || msg.type === 'file' || 
                     (msg.mimeType && (
                       msg.mimeType.includes('pdf') || 
                       msg.mimeType.includes('doc') || 
                       msg.mimeType.includes('text')
                     ));
            default:
              return true;
          }
        });
      }
      
      console.log('✅ Group media fetched:', {
        groupId,
        totalItems: mediaMessages.length,
        mediaType: mediaType || 'all',
        types: mediaMessages.reduce((acc, msg) => {
          acc[msg.type] = (acc[msg.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
      
      return {
        media: mediaMessages,
        hasMore: querySnapshot.docs.length >= queryLimit * 2, // Adjust for client-side filtering
        lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      };
      
    } catch (error) {
      console.error('❌ Failed to fetch group media:', error);
      throw error;
    }
  },

  /**
   * Subscribes to real-time updates for group media
   * @param groupId The ID of the group conversation
   * @param callback Function called with updated media list
   * @param options Query options for filtering
   * @returns Unsubscribe function to stop listening
   */
  subscribeToGroupMedia: (groupId: string, callback: (media: any[]) => void, options: {
    limit?: number;
    mediaType?: 'image' | 'video' | 'document';
  } = {}) => {
    console.log('🔄 ChatService: Setting up real-time listener for group media:', groupId);
    
    const { limit: queryLimit = 50, mediaType } = options;
    
    // Use simpler query to avoid composite index requirement
    const mediaQuery = messagesCollection(groupId)
      .orderBy('createdAt', 'desc')
      .limit(queryLimit * 2); // Get more docs to account for client-side filtering
    
    const unsubscribe = mediaQuery.onSnapshot(
      (querySnapshot) => {
        try {
          let mediaMessages = querySnapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                text: data.text || '',
                type: data.type,
                createdAt: data.createdAt?.toDate() || new Date(),
                user: data.user,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                fileSize: data.fileSize,
                mimeType: data.mimeType,
                thumbnail: data.thumbnail,
              };
            })
            .filter(msg => {
              // Filter for media types client-side
              const mediaTypes = ['image', 'video', 'document', 'file'];
              return mediaTypes.includes(msg.type) || 
                     (msg.imageUrl || msg.videoUrl || msg.fileUrl || msg.mimeType);
            })
            .slice(0, queryLimit); // Limit after filtering
          
          // Filter by specific media type if requested
          if (mediaType) {
            mediaMessages = mediaMessages.filter(msg => {
              switch (mediaType) {
                case 'image':
                  return msg.type === 'image' || (msg.mimeType && msg.mimeType.startsWith('image/'));
                case 'video':
                  return msg.type === 'video' || (msg.mimeType && msg.mimeType.startsWith('video/'));
                case 'document':
                  return msg.type === 'document' || msg.type === 'file';
                default:
                  return true;
              }
            });
          }
          
          console.log('✅ Real-time group media updated:', {
            groupId,
            totalItems: mediaMessages.length,
            mediaType: mediaType || 'all'
          });
          
          callback(mediaMessages);
          
        } catch (error) {
          console.error('❌ Error processing real-time media update:', error);
          callback([]);
        }
      },
      (error) => {
        console.error('❌ Real-time media listener error:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
  },

  /**
   * Invites users to join a group
   * @param groupId The ID of the group conversation
   * @param userIds Array of user IDs to invite
   */
  inviteToGroup: async (groupId: string, userIds: string[]) => {
    try {
      console.log('🔄 ChatService: Inviting users to group:', { groupId, userIds });
      
      const groupRef = db.doc(`conversations/${groupId}`);
      const groupSnapshot = await groupRef.get();
      
      if (!snapshotExists(groupSnapshot)) {
        throw new Error('Group not found');
      }
      
      const data = groupSnapshot.data();
      const currentParticipants = data.participants || [];
      
      // Filter out users who are already in the group
      const newUsers = userIds.filter(userId => !currentParticipants.includes(userId));
      
      if (newUsers.length === 0) {
        throw new Error('All selected users are already in the group');
      }
      
      const updatedParticipants = [...currentParticipants, ...newUsers];
      
      await groupRef.update( {
        participants: updatedParticipants,
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      console.log('✅ Users invited to group successfully:', {
        groupId,
        newUsersCount: newUsers.length,
        totalParticipants: updatedParticipants.length
      });
      
      return {
        success: true,
        addedUsers: newUsers,
        totalParticipants: updatedParticipants.length
      };
      
    } catch (error) {
      console.error('❌ Failed to invite users to group:', error);
      throw error;
    }
  },

  /**
   * Clears all messages from a conversation
   * @param conversationId The ID of the conversation to clear
   * @returns Promise that resolves when all messages are cleared
   */
  clearMessages: async (conversationId: string): Promise<void> => {
    try {
      console.log('🗑️ ChatService: Clearing all messages for conversation:', conversationId);
      
      // Get all messages in the conversation
      const messagesRef = messagesCollection(conversationId);
      const snapshot = await messagesRef.get();
      
      if (snapshot.empty) {
        console.log('ℹ️ No messages to clear for conversation:', conversationId);
        return;
      }
      
      console.log(`🗑️ Found ${snapshot.size} messages to delete`);
      
      // Delete all messages in batches (Firestore has a limit of 500 operations per batch)
      const batchSize = 500;
      const batches: any[] = [];
      let currentBatch = db.batch();
      let currentBatchSize = 0;
      
      snapshot.docs.forEach((messageDoc) => {
        currentBatch.delete(messageDoc.ref);
        currentBatchSize++;
        
        if (currentBatchSize === batchSize) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          currentBatchSize = 0;
        }
      });
      
      // Add the remaining batch if it has any operations
      if (currentBatchSize > 0) {
        batches.push(currentBatch);
      }
      
      // Execute all batches
      for (const batch of batches) {
        await batch.commit();
      }
      
      // Update the conversation's last message to indicate it was cleared
      const conversationRef = db.doc(`conversations/${conversationId}`);
      await conversationRef.update( {
        lastMessage: {
          text: 'Messages cleared',
          createdAt: FieldValue.serverTimestamp(),
          senderId: 'system',
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      console.log('✅ ChatService: Successfully cleared all messages from conversation:', conversationId);
      
    } catch (error) {
      console.error('❌ Failed to clear messages:', error);
      throw error;
    }
  },

  /**
   * Deletes a conversation and all its messages
   * @param conversationId The ID of the conversation to delete
   * @returns Promise that resolves when the conversation is deleted
   */
  deleteConversation: async (conversationId: string): Promise<void> => {
    try {
      console.log('🗑️ ChatService: Deleting conversation:', conversationId);
      
      // First, delete all messages in the conversation
      const messagesRef = messagesCollection(conversationId);
      const snapshot = await messagesRef.get();
      
      if (!snapshot.empty) {
        console.log(`🗑️ Deleting ${snapshot.size} messages`);
        
        // Delete messages in batches (Firestore has a limit of 500 operations per batch)
        const batchSize = 500;
        const batches: any[] = [];
        let currentBatch = db.batch();
        let currentBatchSize = 0;
        
        snapshot.docs.forEach((messageDoc) => {
          currentBatch.delete(messageDoc.ref);
          currentBatchSize++;
          
          if (currentBatchSize === batchSize) {
            batches.push(currentBatch);
            currentBatch = db.batch();
            currentBatchSize = 0;
          }
        });
        
        // Add the remaining batch if it has any operations
        if (currentBatchSize > 0) {
          batches.push(currentBatch);
        }
        
        // Execute all batches
        for (const batch of batches) {
          await batch.commit();
        }
      }
      
      // Then delete the conversation document itself
      const conversationRef = db.doc(`conversations/${conversationId}`);
      await conversationRef.delete();
      
      console.log('✅ ChatService: Successfully deleted conversation:', conversationId);
      
    } catch (error) {
      console.error('❌ Failed to delete conversation:', error);
      throw error;
    }
  },

  /**
   * Blocks a user
   * @param userId The ID of the user to block
   * @param currentUserId The ID of the current user doing the blocking
   * @returns Promise that resolves when user is blocked
   */
  blockUser: async (userId: string, currentUserId: string): Promise<void> => {
    try {
      console.log('🚫 ChatService: Blocking user:', userId, 'by:', currentUserId);
      
      // Create or update a blocked users collection for the current user
      const blockedUsersRef = db.collection(`users/${currentUserId}/blockedUsers`);
      const blockDoc = blockedUsersRef.doc(userId);
      
      await blockDoc.set( {
        userId: userId,
        blockedAt: FieldValue.serverTimestamp(),
        blockedBy: currentUserId,
      });
      
      // Also block them in the conversations - prevent new messages
      const conversationId = createConversationId(currentUserId, userId);
      const conversationRef = db.doc(`conversations/${conversationId}`);
      
      // Check if conversation exists
      const conversationDoc = await conversationRef.get();
      if (snapshotExists(conversationDoc)) {
        await conversationRef.update( {
          [`blockedBy.${currentUserId}`]: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      
      console.log('✅ ChatService: Successfully blocked user:', userId);
      
    } catch (error) {
      console.error('❌ Failed to block user:', error);
      throw error;
    }
  },

  /**
   * Reports a user for inappropriate behavior
   * @param userId The ID of the user to report
   * @param currentUserId The ID of the current user making the report
   * @param reason The reason for reporting
   * @param additionalInfo Optional additional information
   * @returns Promise that resolves when report is submitted
   */
  reportUser: async (userId: string, currentUserId: string, reason: string, additionalInfo?: string): Promise<void> => {
    try {
      console.log('🚨 ChatService: Reporting user:', userId, 'by:', currentUserId, 'reason:', reason);
      
      // Create a report in the reports collection
      const reportsRef = db.collection('reports');
      
      await reportsRef.add({
        reportedUserId: userId,
        reporterUserId: currentUserId,
        reason: reason,
        additionalInfo: additionalInfo || '',
        status: 'pending',
        type: 'user_report',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      console.log('✅ ChatService: Successfully reported user:', userId);
      
    } catch (error) {
      console.error('❌ Failed to report user:', error);
      throw error;
    }
  },

  /**
   * Checks if a user is blocked
   * @param userId The ID of the user to check
   * @param currentUserId The ID of the current user
   * @returns Promise that resolves to true if user is blocked
   */
  isUserBlocked: async (userId: string, currentUserId: string): Promise<boolean> => {
    try {
      const blockDoc = db.doc(`users/${currentUserId}/blockedUsers/${userId}`);
      const docSnapshot = await blockDoc.get();
      return snapshotExists(docSnapshot);
    } catch (error) {
      console.error('❌ Failed to check if user is blocked:', error);
      return false;
    }
  },

  /**
   * Unblocks a user
   * @param userId The ID of the user to unblock
   * @param currentUserId The ID of the current user doing the unblocking
   * @returns Promise that resolves when user is unblocked
   */
  unblockUser: async (userId: string, currentUserId: string): Promise<void> => {
    try {
      console.log('✅ ChatService: Unblocking user:', userId, 'by:', currentUserId);
      
      // Remove from blocked users collection
      const blockDoc = db.doc(`users/${currentUserId}/blockedUsers/${userId}`);
      await blockDoc.delete();
      
      // Remove block from conversation
      const conversationId = createConversationId(currentUserId, userId);
      const conversationRef = db.doc(`conversations/${conversationId}`);
      
      const conversationDoc = await conversationRef.get();
      if (snapshotExists(conversationDoc)) {
        await conversationRef.update( {
          [`blockedBy.${currentUserId}`]: null,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      
      console.log('✅ ChatService: Successfully unblocked user:', userId);
      
    } catch (error) {
      console.error('❌ Failed to unblock user:', error);
      throw error;
    }
  },

  /**
   * Gets all blocked users for a current user
   * @param currentUserId The ID of the current user
   * @returns Promise that resolves to array of blocked users
   */
  getBlockedUsers: async (currentUserId: string): Promise<Array<{ userId: string; blockedAt: Date }>> => {
    try {
      console.log('📋 ChatService: Getting blocked users for:', currentUserId);
      
      const blockedUsersRef = db.collection(`users/${currentUserId}/blockedUsers`);
      const snapshot = await blockedUsersRef.get();
      
      const blockedUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: data.userId,
          blockedAt: data.blockedAt?.toDate() || new Date(),
        };
      });
      
      console.log(`✅ Found ${blockedUsers.length} blocked users`);
      return blockedUsers;
      
    } catch (error) {
      console.error('❌ Failed to get blocked users:', error);
      throw error;
    }
  },

  /**
   * Upload an image and send it as a message
   * @param conversationId - The conversation ID
   * @param imageUri - The local image URI
   * @param sender - The sender information
   * @param recipientId - The recipient ID (for direct messages)
   * @returns Promise with upload and message result
   */
  sendImageMessage: async (
    conversationId: string,
    imageUri: string,
    sender: { _id: string; name: string; avatar?: string },
    recipientId?: string
  ): Promise<{ success: boolean; messageId?: string; imageUrl?: string; error?: string }> => {
    try {
      console.log('📷 Starting image upload and message send...', { conversationId, imageUri });

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `chat_image_${Date.now()}.jpg`,
      } as any);

      // Get auth token for the request
      const getAuthToken = async (): Promise<string | undefined> => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          return token || undefined;
        } catch (error) {
          console.error('Error getting auth token:', error);
          return undefined;
        }
      };

      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available for image upload');
        return {
          success: false,
          error: 'Authentication required for image upload',
        };
      }

      // Upload image to backend using direct fetch to handle FormData properly
      console.log('📤 Uploading image to backend...');
      const uploadUrl = `${API_BASE_URL}/api/firebase-auth/upload-image`;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header - let the browser set it with boundary for FormData
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Image upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error: errorText
        });
        return {
          success: false,
          error: `Failed to upload image: ${uploadResponse.status} ${uploadResponse.statusText}`,
        };
      }

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        console.error('❌ Image upload failed:', uploadData.error);
        return {
          success: false,
          error: uploadData.error || 'Failed to upload image',
        };
      }

      const imageUrl = uploadData.imageUrl || uploadData.url;
      if (!imageUrl) {
        console.error('❌ No image URL returned from upload');
        return {
          success: false,
          error: 'No image URL returned from upload',
        };
      }

      console.log('✅ Image uploaded successfully:', imageUrl);

      // Send the image message
      const messageData = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: '', // Empty text for image messages
        createdAt: FieldValue.serverTimestamp(),
        user: sender,
        type: 'image',
        imageUrl: imageUrl,
        metadata: {
          originalUri: imageUri,
          uploadedAt: new Date().toISOString(),
        }
      };

      const messagesRef = messagesCollection(conversationId);
      const docRef = await messagesRef.add(messageData);
      
      console.log('✅ Image message sent successfully:', docRef.id);

      // Update conversation's last message
      const conversationRef = conversationsCollection.doc(conversationId);
      await conversationRef.update( {
        lastMessage: {
          text: '📷 Image',
          createdAt: FieldValue.serverTimestamp(),
          senderId: sender._id,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      // If it's a direct message, ensure both participants have the conversation
      if (recipientId && !conversationId.includes('group_')) {
        const participants = [sender._id, recipientId];
        
        for (const participantId of participants) {
          const userConversationRef = db.doc(`users/${participantId}/conversations/${conversationId}`);
          await userConversationRef.set( {
            conversationId,
            participants,
            lastMessage: {
              text: '📷 Image',
              createdAt: FieldValue.serverTimestamp(),
              senderId: sender._id,
            },
            updatedAt: FieldValue.serverTimestamp(),
            isGroup: false,
          }, { merge: true });
        }
      }

      return {
        success: true,
        messageId: docRef.id,
        imageUrl: imageUrl,
      };

    } catch (error) {
      console.error('❌ Failed to send image message:', error);
      
      // Fallback for development - create a mock image message
      if (__DEV__) {
        console.log('🔧 Development fallback: creating mock image message');
        try {
          const messageData = {
            _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: '',
            createdAt: FieldValue.serverTimestamp(),
            user: sender,
            type: 'image',
            imageUrl: imageUri, // Use local URI as fallback
            metadata: {
              originalUri: imageUri,
              uploadedAt: new Date().toISOString(),
              isMockUpload: true,
            }
          };

          const messagesRef = messagesCollection(conversationId);
          const docRef = await messagesRef.add(messageData);
          
          // Update conversation's last message
          const conversationRef = conversationsCollection.doc(conversationId);
          await conversationRef.update( {
            lastMessage: {
              text: '📷 Image (Dev)',
              createdAt: FieldValue.serverTimestamp(),
              senderId: sender._id,
            },
            updatedAt: FieldValue.serverTimestamp(),
          });

          console.log('✅ Mock image message created:', docRef.id);
          return {
            success: true,
            messageId: docRef.id,
            imageUrl: imageUri,
          };
        } catch (fallbackError) {
          console.error('❌ Even fallback failed:', fallbackError);
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send image message',
      };
    }
  },

  /**
   * Sets typing status for a user in a conversation
   * @param conversationId The ID of the conversation
   * @param userId The ID of the user who is typing
   * @param userName The name of the user who is typing
   * @param isTyping Whether the user is typing or not
   */
  setTypingStatus: async (conversationId: string, userId: string, userName: string, isTyping: boolean) => {
    try {
      console.log('🔥 Setting typing status:', { conversationId, userId, userName, isTyping });
      
      const typingRef = db.doc(`conversations/${conversationId}/typing/${userId}`);
      
      if (isTyping) {
        await typingRef.set( {
          userId,
          userName,
          isTyping: true,
          timestamp: FieldValue.serverTimestamp(),
        });
        console.log('✅ Typing status set to true in Firebase');
      } else {
        await typingRef.delete();
        console.log('✅ Typing status cleared from Firebase');
      }
    } catch (error) {
      console.error('❌ Failed to set typing status:', error);
    }
  },

  /**
   * Listens for typing status updates in a conversation
   * @param conversationId The ID of the conversation
   * @param currentUserId The current user's ID (to exclude from typing indicators)
   * @param callback Function called with array of typing users
   * @returns Unsubscribe function
   */
  subscribeToTypingStatus: (
    conversationId: string, 
    currentUserId: string, 
    callback: (typingUsers: { userId: string; userName: string }[]) => void
  ) => {
    console.log('🎧 Subscribing to typing status:', { conversationId, currentUserId });
    const typingRef = db.collection(`conversations/${conversationId}/typing`);
    
    const unsubscribe = typingRef.onSnapshot((snapshot) => {
      console.log('📡 Typing status snapshot received, docs count:', snapshot.docs.length);
      const typingUsers: { userId: string; userName: string }[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('📄 Typing doc data:', { docId: doc.id, data });
        
        // Only include other users, not the current user
        if (data.userId !== currentUserId && data.isTyping) {
          typingUsers.push({
            userId: data.userId,
            userName: data.userName,
          });
        }
      });
      
      console.log('🎯 Final typing users to callback:', typingUsers);
      callback(typingUsers);
    });
    
    return unsubscribe;
  },

  /**
   * Clears typing status for a user (useful for cleanup)
   * @param conversationId The ID of the conversation
   * @param userId The ID of the user
   */
  clearTypingStatus: async (conversationId: string, userId: string) => {
    try {
      console.log('🧹 Clearing typing status:', { conversationId, userId });
      const typingRef = db.doc(`conversations/${conversationId}/typing/${userId}`);
      await typingRef.delete();
      console.log('✅ Typing status cleared from Firebase');
    } catch (error) {
      console.error('❌ Failed to clear typing status:', error);
    }
  },
};

// Export helper functions for creating consistent conversation IDs
export { 
  createConversationId, 
  createTradeConversationId, 
  createTradeRoomId, 
  isTradeConversation, 
  extractTradeId 
};

export default chatService;
