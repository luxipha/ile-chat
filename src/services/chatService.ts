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
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Conversation } from '../components/chat/ConversationList';

// Firestore collections
const conversationsCollection = collection(db, 'conversations');
const messagesCollection = (conversationId: string) => collection(db, `conversations/${conversationId}/messages`);

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
    const q = query(
      conversationsCollection,
      where('members', 'array-contains', userId),
      orderBy('lastMessage.createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const conversations: Conversation[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // TODO: You will need to map this data to your `Conversation` interface more robustly.
        // This may involve fetching the other user's profile to get their name and avatar.
        return {
          id: doc.id,
          name: data.name || 'Chat',
          lastMessage: data.lastMessage?.text || '',
          timestamp: data.lastMessage?.createdAt?.toDate() || new Date(),
          unreadCount: 0, // This needs to be calculated
          isGroup: data.isGroup || false,
          // ... other fields from your Conversation type
        } as Conversation;
      });
      callback(conversations);
    });

    return unsubscribe; // Return the function to detach the listener
  },

  /**
   * Sends a new message to a conversation.
   * @param conversationId The ID of the conversation.
   * @param messageText The text of the message.
   * @param sender The user object of the sender.
   */
  sendMessage: async (conversationId: string, messageText: string, sender: { _id: string; name: string; avatar?: string }) => {
    const messageData = {
      text: messageText,
      createdAt: serverTimestamp(),
      user: sender,
    };

    // Add the message to the messages subcollection
    const messagesRef = messagesCollection(conversationId);
    await addDoc(messagesRef, messageData);

    // Update the parent conversation document with the last message
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: {
        text: messageText,
        createdAt: serverTimestamp(),
        senderId: sender._id,
      },
    });
  },

  /**
   * Listens for real-time messages in a specific conversation.
   * @param conversationId The ID of the conversation.
   * @param callback A function to call with the updated list of messages.
   * @returns An unsubscribe function to stop listening for updates.
   */
  getMessages: (conversationId: string, callback: (messages: ChatMessage[]) => void) => {
    const q = query(messagesCollection(conversationId), orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: ChatMessage[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          _id: doc.id,
          text: data.text,
          createdAt: data.createdAt.toDate(),
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

export default chatService;