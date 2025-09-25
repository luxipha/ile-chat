import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import friendService, { FriendRequest } from '../../services/friendService';

interface FriendRequestsScreenProps {
  onBack: () => void;
  onFriendAdded: (conversationId: string) => void;
}

export const FriendRequestsScreen: React.FC<FriendRequestsScreenProps> = ({
  onBack,
  onFriendAdded
}) => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const loadRequests = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const result = await friendService.getPendingRequests();
      
      if (result.success) {
        setRequests(result.requests);
      } else {
        Alert.alert('Error', 'Failed to load friend requests');
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load friend requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests(true);
  };

  const handleRespondToRequest = async (request: FriendRequest, action: 'accept' | 'reject') => {
    try {
      // Add to processing set
      setProcessingRequests(prev => new Set(prev).add(request._id));

      const result = await friendService.respondToRequest(request._id, action);

      if (result.success) {
        // Remove the request from the list
        setRequests(prev => prev.filter(r => r._id !== request._id));

        if (action === 'accept') {
          Alert.alert(
            'Success',
            `You are now friends with ${request.sender.name}!`,
            [
              {
                text: 'Start Chatting',
                onPress: () => {
                  if (result.friendship?.conversationId) {
                    onFriendAdded(result.friendship.conversationId);
                  }
                }
              },
              { text: 'OK', style: 'default' }
            ]
          );
        } else {
          Alert.alert('Success', 'Friend request declined');
        }
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      Alert.alert('Error', 'Failed to respond to request');
    } finally {
      // Remove from processing set
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request._id);
        return newSet;
      });
    }
  };

  const renderRequest = ({ item: request }: { item: FriendRequest }) => {
    const isProcessing = processingRequests.has(request._id);

    return (
      <Card style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {request.sender.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.requestInfo}>
            <Text style={styles.senderName}>{request.sender.name}</Text>
            <Text style={styles.senderEmail}>{request.sender.email}</Text>
            {request.message && (
              <Text style={styles.message}>{request.message}</Text>
            )}
            <Text style={styles.timestamp}>
              {new Date(request.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Accept"
            onPress={() => handleRespondToRequest(request, 'accept')}
            disabled={isProcessing}
            style={[styles.actionButton, styles.acceptButton]}
            textStyle={styles.acceptButtonText}
          />
          <Button
            title="Decline"
            onPress={() => handleRespondToRequest(request, 'reject')}
            disabled={isProcessing}
            variant="outline"
            style={styles.actionButton}
          />
        </View>

        {isProcessing && (
          <View style={styles.processingOverlay}>
            <LoadingSpinner size="small" />
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Friend Requests</Text>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Friend Requests</Text>
      </View>

      {requests.length === 0 ? (
        <EmptyState
          icon="person-add"
          title="No Friend Requests"
          message="You don't have any pending friend requests"
        />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item._id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    padding: Spacing.md,
  },
  requestCard: {
    marginBottom: Spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    ...Typography.h3,
    color: Colors.white,
  },
  requestInfo: {
    flex: 1,
  },
  senderName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  senderEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.body,
    color: Colors.text,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  acceptButton: {
    backgroundColor: Colors.success,
  },
  acceptButtonText: {
    color: Colors.white,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
};