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
  getDoc,
  startAfter,
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
  type?: string;
  paymentData?: {
    amount: number;
    currency: string;
    status: string;
    note?: string;
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
  ) => {
    console.log('💬 ChatService: Sending message...', {
      conversationId,
      messageType,
      senderName: sender.name,
      messagePreview: messageText.slice(0, 50) + '...',
      hasMetadata: !!metadata
    });
    
    const messageData = {
      text: messageText,
      createdAt: serverTimestamp(),
      user: sender,
      type: messageType,
      ...metadata, // Include payment data, etc.
    };

    // Add the message to the messages subcollection
    const messagesRef = messagesCollection(conversationId);
    const messageDoc = await addDoc(messagesRef, messageData);
    
    console.log('✅ ChatService: Message sent successfully:', {
      messageId: messageDoc.id,
      conversationId,
      messageType
    });

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
          type: data.type || 'text', // Include message type
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
          } : undefined,
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
  createConversation: async (participants: string[], isGroup: boolean = false, name?: string, description?: string) => {
    console.log('🔄 ChatService: Creating conversation...', {
      participantCount: participants.length,
      isGroup,
      name,
      hasDescription: !!description
    });
    
    const conversationData = {
      participants: participants, // Use 'participants' to match query structure
      type: isGroup ? 'group' : 'direct', // Use 'type' to match existing structure
      name: name || '',
      description: description || '',
      createdBy: participants[0], // Store the creator
      admins: isGroup ? [participants[0]] : [], // Creator is initial admin for groups
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      settings: isGroup ? {
        allowMembersToAddOthers: true,
        onlyAdminsCanSend: false,
        disappearingMessages: false,
        privacy: 'private',
      } : undefined,
      lastMessage: {
        text: isGroup ? `${name} group created` : '',
        createdAt: serverTimestamp(),
        senderId: participants[0], // Creator is first participant
      },
    };

    console.log('💾 ChatService: Saving conversation to Firebase...', {
      type: conversationData.type,
      name: conversationData.name,
      participantIds: participants
    });

    const docRef = await addDoc(conversationsCollection, conversationData);
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
    const q = query(
      conversationsCollection,
      where('participants', 'array-contains', userId1),
      where('type', '==', 'direct')
    );

    const querySnapshot = await getDocs(q);
    
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
      
      const groupRef = doc(db, 'conversations', groupId);
      const groupSnapshot = await getDoc(groupRef);
      
      if (!groupSnapshot.exists()) {
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
      
      const groupRef = doc(db, 'conversations', groupId);
      const updateData: any = {
        updatedAt: serverTimestamp(),
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
      
      await updateDoc(groupRef, updateData);
      
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
      
      const groupRef = doc(db, 'conversations', groupId);
      const groupSnapshot = await getDoc(groupRef);
      
      if (!groupSnapshot.exists()) {
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
      
      await updateDoc(groupRef, {
        admins: newAdmins,
        updatedAt: serverTimestamp(),
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
      
      const groupRef = doc(db, 'conversations', groupId);
      const groupSnapshot = await getDoc(groupRef);
      
      if (!groupSnapshot.exists()) {
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
      
      await updateDoc(groupRef, {
        participants: newParticipants,
        admins: newAdmins,
        updatedAt: serverTimestamp(),
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
    
    const groupRef = doc(db, 'conversations', groupId);
    
    const unsubscribe = onSnapshot(
      groupRef,
      (docSnapshot) => {
        try {
          if (!docSnapshot.exists()) {
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
    
    const groupRef = doc(db, 'conversations', groupId);
    
    const unsubscribe = onSnapshot(
      groupRef,
      async (docSnapshot) => {
        try {
          if (!docSnapshot.exists()) {
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
      let mediaQuery = query(
        messagesCollection(groupId),
        orderBy('createdAt', 'desc'),
        limit(queryLimit * 2) // Get more docs to account for filtering
      );
      
      // Add pagination if provided
      if (startAfter) {
        mediaQuery = query(
          messagesCollection(groupId),
          orderBy('createdAt', 'desc'),
          startAfter(startAfter),
          limit(queryLimit * 2) // Get more docs to account for filtering
        );
      }
      
      const querySnapshot = await getDocs(mediaQuery);
      
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
    const mediaQuery = query(
      messagesCollection(groupId),
      orderBy('createdAt', 'desc'),
      limit(queryLimit * 2) // Get more docs to account for client-side filtering
    );
    
    const unsubscribe = onSnapshot(
      mediaQuery,
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
      
      const groupRef = doc(db, 'conversations', groupId);
      const groupSnapshot = await getDoc(groupRef);
      
      if (!groupSnapshot.exists()) {
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
      
      await updateDoc(groupRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp(),
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
};

// Export helper function for creating consistent conversation IDs
export { createConversationId };

export default chatService;