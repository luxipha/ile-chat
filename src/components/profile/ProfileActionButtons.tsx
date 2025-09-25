import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Button } from '../ui/Button';
import friendService, { FriendshipStatus } from '../../services/friendService';
import { Colors, Spacing } from '../../theme';

interface ProfileActionButtonsProps {
  userId: string;
  userName: string;
  friendRequestId?: string;
  isFriendRequest?: boolean;
  onMessage: () => void;
  onSendMoney: () => void;
  onFriendRequestResponse?: (action: 'accept' | 'reject') => void;
  onFriendRequestSent?: () => void;
  onFriendDeleted?: () => void;
}

export const ProfileActionButtons: React.FC<ProfileActionButtonsProps> = ({
  userId,
  userName,
  friendRequestId,
  isFriendRequest,
  onMessage,
  onSendMoney,
  onFriendRequestResponse,
  onFriendRequestSent,
}) => {
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadFriendshipStatus();
  }, [userId, friendRequestId, isFriendRequest]);

  const loadFriendshipStatus = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading friendship status for userId:', userId);
      const result = await friendService.getFriendshipStatus(userId);
      console.log('📊 ProfileActionButtons - Friendship status result:', result);
      if (result.success && result.status) {
        console.log('✅ Setting friendship status:', result.status);
        setFriendshipStatus(result.status);
      } else {
        console.log('❌ No valid friendship status received');
        setFriendshipStatus(null);
      }
    } catch (error) {
      console.error('Error loading friendship status:', error);
      setFriendshipStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      setProcessing(true);
      const result = await friendService.sendFriendRequest(
        userId,
        `Hi ${userName}! I'd like to connect with you on ilePay.`
      );
      
      if (result.success) {
        Alert.alert('Success', 'Friend request sent!');
        await loadFriendshipStatus(); // Refresh status
        onFriendRequestSent?.();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setProcessing(false);
    }
  };

  const handleFriendRequestAction = async (action: 'accept' | 'reject') => {
    if (!friendRequestId) {
      Alert.alert('Error', 'Friend request not found');
      return;
    }
    
    try {
      setProcessing(true);
      console.log('🔄 Responding to friend request:', { friendRequestId, action });
      
      const result = await friendService.respondToRequest(friendRequestId, action);
      console.log('📝 Friend request response result:', result);
      
      if (result.success) {
        // Refresh friendship status immediately after successful response
        await loadFriendshipStatus();
        
        Alert.alert(
          'Success', 
          action === 'accept' ? 'Friend request accepted!' : 'Friend request rejected',
          [
            {
              text: 'OK',
              onPress: () => {
                onFriendRequestResponse?.(action);
              }
            }
          ]
        );
      } else {
        // Handle the case where request was already responded to
        if (result.message?.includes('already been responded to')) {
          Alert.alert(
            'Request Already Processed', 
            'This friend request has already been handled.',
            [
              {
                text: 'OK',
                onPress: () => {
                  onFriendRequestResponse?.(action);
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', result.message || 'Failed to process request');
        }
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
      Alert.alert('Error', `Failed to ${action} friend request`);
    } finally {
      setProcessing(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Button
          title="Loading..."
          disabled={true}
          style={styles.fullButton}
        />
      </View>
    );
  }

  // State 1: Viewing a pending friend request (from friend request context)
  if (isFriendRequest && friendRequestId) {
    return (
      <View style={styles.container}>
        <View style={styles.buttonRow}>
          <Button
            title="Accept"
            icon="check"
            onPress={() => handleFriendRequestAction('accept')}
            disabled={processing}
            style={styles.halfButton}
          />
          <Button
            title="Reject"
            icon="close"
            variant="outline"
            onPress={() => handleFriendRequestAction('reject')}
            disabled={processing}
            style={styles.halfButton}
          />
        </View>
      </View>
    );
  }

  // State 2: Already friends - show Message/Send Money
  console.log('🔍 Checking friendship status for button rendering:', {
    friendshipStatus,
    statusValue: friendshipStatus?.status,
    isEqual: friendshipStatus?.status === 'friends',
    statusType: typeof friendshipStatus?.status
  });
  
  if (friendshipStatus?.status === 'friends') {
    return (
      <View style={styles.container}>
        <View style={styles.buttonRow}>
          <Button
            title="Message"
            icon="message"
            onPress={onMessage}
            style={styles.halfButton}
          />
          <Button
            title="Send Money"
            icon="payment"
            variant="outline"
            onPress={onSendMoney}
            style={styles.halfButton}
          />
        </View>
      </View>
    );
  }

  // State 3: Pending request (either sent or received)
  if (friendshipStatus?.status === 'pending') {
    if (friendshipStatus.isSender) {
      // You sent the request
      return (
        <View style={styles.container}>
          <Button
            title="Request Sent"
            icon="schedule"
            disabled={true}
            style={styles.fullButton}
          />
        </View>
      );
    } else {
      // They sent you a request (shouldn't happen here as it would be handled above)
      return (
        <View style={styles.container}>
          <Button
            title="Respond to Request"
            icon="person-add"
            onPress={() => Alert.alert('Info', 'Check your friend requests to respond')}
            style={styles.fullButton}
          />
        </View>
      );
    }
  }

  // State 4: Not friends - show Add Contact
  return (
    <View style={styles.container}>
      <Button
        title={processing ? "Sending..." : "Add Contact"}
        icon="person-add"
        onPress={handleSendFriendRequest}
        disabled={processing}
        style={styles.fullButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  fullButton: {
    width: '100%',
  },
});