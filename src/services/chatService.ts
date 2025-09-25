import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Conversation } from '../components/chat/ConversationList';
import { apiClient } from './api';
import profileService from './profileService';

// Firestore collections
const conversationsCollection = collection(db, 'conversations');
const messagesCollection = (conversationId: string) => collection(db, `conversations/${conversationId}/messages`);

// Helper function to create consistent conversation IDs
const createConversationId = (userId1: string, userId2: string): string => {
  // Sort user IDs to ensure consistent conversation ID regardless of order
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
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
    
    const q = query(
      conversationsCollection,
      where('participants', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      console.log('📱 Firestore conversations query result:', {
        docsCount: querySnapshot.docs.length,
        isEmpty: querySnapshot.empty
      });
      
      const conversations: Conversation[] = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          console.log('📋 Conversation data:', { 
            id: doc.id, 
            participants: data.participants,
            lastMessage: data.lastMessage,
            type: data.type 
          });
          
          // For direct chats, get the other participant's ID to generate name
          const participants = data.participants || [];
          const otherParticipantId = participants.find(p => p !== userId);
          
          // Generate a display name using user lookup
          let displayName = 'Chat';
          if (data.type === 'direct' && otherParticipantId) {
            try {
              const profileResult = await profileService.getUserProfile(otherParticipantId);
              displayName = profileResult.success && profileResult.profile ? profileResult.profile.name : `User ${otherParticipantId.slice(-6)}`;
            } catch (error) {
              console.error('Failed to get user profile for chat:', error);
              displayName = `User ${otherParticipantId.slice(-6)}`;
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
            avatar: data.avatar,
            isOnline: false,
          } as Conversation;
        })
      );
      
      // Deduplicate conversations that might exist with different ID orders
      const conversationMap = new Map<string, Conversation>();
      
      conversations.forEach(conv => {
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
   */
  sendMessage: async (conversationId: string, messageText: string, sender: { _id: string; name: string; avatar?: string }, recipientId?: string) => {
    const messageData = {
      text: messageText,
      createdAt: serverTimestamp(),
      user: sender,
    };

    // Add the message to the messages subcollection
    const messagesRef = messagesCollection(conversationId);
    await addDoc(messagesRef, messageData);

    // Update or create the parent conversation document with the last message
    const conversationRef = doc(db, 'conversations', conversationId);
    try {
      await updateDoc(conversationRef, {
        lastMessage: {
          text: messageText,
          createdAt: serverTimestamp(),
          senderId: sender._id,
        },
      });
    } catch (error: any) {
      // If conversation doesn't exist, create it
      if (error.code === 'not-found') {
        console.log('📝 Creating new conversation document:', conversationId);
        
        // Extract participants from conversationId (format: userId1_userId2)
        const participants = conversationId.includes('_') 
          ? conversationId.split('_')
          : [sender._id, recipientId].filter(Boolean);
        
        console.log('👥 Conversation participants:', participants);
        
        await setDoc(conversationRef, {
          participants: participants,
          type: 'direct',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: {
            text: messageText,
            createdAt: serverTimestamp(),
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
    const q = query(messagesCollection(conversationId), orderBy('createdAt', 'asc'), limit(50));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: ChatMessage[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          _id: doc.id,
          text: data.text,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          user: data.user,
        };
      });
      callback(messages);
    });

    return unsubscribe;
  },

  /**
   * Creates a new conversation between users
   * @param participants Array of user IDs to include in the conversation
   * @param isGroup Whether this is a group conversation
   * @param name Optional name for the conversation (required for groups)
   */
  createConversation: async (participants: string[], isGroup: boolean = false, name?: string) => {
    const conversationData = {
      members: participants,
      isGroup,
      name: name || '',
      createdAt: serverTimestamp(),
      lastMessage: {
        text: '',
        createdAt: serverTimestamp(),
        senderId: '',
      },
    };

    const docRef = await addDoc(conversationsCollection, conversationData);
    return docRef.id;
  },

  /**
   * Finds an existing conversation between two users
   * @param userId1 First user ID
   * @param userId2 Second user ID
   * @returns Conversation ID if found, null otherwise
   */
  findDirectConversation: async (userId1: string, userId2: string): Promise<string | null> => {
    const q = query(
      conversationsCollection,
      where('members', 'array-contains', userId1),
      where('isGroup', '==', false)
    );

    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      if (data.members.includes(userId2)) {
        return doc.id;
      }
    }
    
    return null;
  },
};

// Export helper function for creating consistent conversation IDs
export { createConversationId };

export default chatService;