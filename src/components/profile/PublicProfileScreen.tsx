import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ContactSelector } from '../ui/ContactSelector';
import { ProfileCard } from '../ui/ProfileCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ProfileActionButtons } from './ProfileActionButtons';
import { ProfileActionsMenu } from './ProfileActionsMenu';
import { Colors, Spacing, BorderRadius } from '../../theme';
import friendService, { FriendshipStatus } from '../../services/friendService';
import { communityService, CommunityPost } from '../../services/communityService';

interface PublicProfileScreenProps {
  onBack: () => void;
  onMessage: () => void;
  onSendMoney: () => void;
  onViewMoments: () => void;
  onShareProfile: () => void;
  userName: string;
  userAvatar?: string;
  userId: string;
  onNavigateToMoments?: () => void;
  onFriendRequestSent?: () => void;
  friendRequestId?: string;
  isFriendRequest?: boolean;
  onFriendRequestResponse?: (action: 'accept' | 'reject') => void;
}

interface PublicUserProfile {
  name: string;
  role: string;
  region: string;
  joinDate: string;
  bricksCount: number;
  profilePicture?: string;
  trustBadge?: 'verified' | 'premium' | 'agent' | null;
  trustLevel: number; // 1-5 stars
  momentThumbnails: Array<{
    id: string;
    image: string;
    type: 'investment' | 'connection' | 'achievement';
  }>;
}

export const PublicProfileScreen: React.FC<PublicProfileScreenProps> = ({
  onBack,
  onMessage,
  onSendMoney,
  onViewMoments,
  onShareProfile,
  userName,
  userAvatar,
  userId,
  onNavigateToMoments,
  onFriendRequestSent,
  friendRequestId,
  isFriendRequest,
  onFriendRequestResponse,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showShareContacts, setShowShareContacts] = useState(false);
  const [userMoments, setUserMoments] = useState<CommunityPost[]>([]);
  const [loadingMoments, setLoadingMoments] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  // Mock user data - in real app, fetch based on userId
  const userProfile: PublicUserProfile = {
    name: userName,
    role: 'Property Investor',
    region: 'Lagos, Nigeria',
    joinDate: 'Recently', // Fallback for when no actual date is available
    bricksCount: 2450,
    profilePicture: userAvatar,
    trustBadge: 'verified',
    trustLevel: 4, // 4 out of 5 stars
    momentThumbnails: [
      {
        id: '1',
        image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
        type: 'investment',
      },
      {
        id: '2',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
        type: 'achievement',
      },
      {
        id: '3',
        image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400',
        type: 'connection',
      },
      {
        id: '4',
        image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400',
        type: 'investment',
      },
      {
        id: '5',
        image: 'https://images.unsplash.com/photo-1565402170291-8491f14678db?w=400',
        type: 'achievement',
      },
    ],
  };

  // Load user moments when component mounts
  useEffect(() => {
    loadUserMoments();
  }, [userId]);

  const loadUserMoments = async () => {
    try {
      setLoadingMoments(true);
      console.log('🔄 Loading moments for userId:', userId);
      const result = await communityService.getUserPosts(userId, 1, 6); // Load 6 recent posts
      console.log('📊 Moments load result:', { 
        success: result.success, 
        postsCount: result.data?.posts?.length || 0,
        error: result.error 
      });
      
      if (result.success && result.data) {
        setUserMoments(result.data.posts);
      } else {
        console.warn('⚠️ Failed to load user moments:', result.error);
        setUserMoments([]); // Set empty array to show "No moments"
      }
    } catch (error) {
      console.error('❌ Error loading user moments:', error);
      setUserMoments([]); // Set empty array on error
    } finally {
      setLoadingMoments(false);
    }
  };



  const renderProfileCard = () => (
    <ProfileCard
      name={userProfile.name}
      role={userProfile.role}
      region={userProfile.region}
      joinDate={userProfile.joinDate}
      bricksCount={userProfile.bricksCount}
      profilePicture={userProfile.profilePicture}
      trustBadge={userProfile.trustBadge}
      trustLevel={userProfile.trustLevel}
      showShareIcon={true}
      onSharePress={() => setShowShareContacts(true)}
    />
  );

  const renderMomentsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Typography variant="h5" style={styles.sectionTitle}>Moments</Typography>
        {userMoments.length > 4 && (
          <TouchableOpacity onPress={onNavigateToMoments || onViewMoments}>
            <Typography variant="body2" color="primary" style={styles.viewAllText}>
              View All
            </Typography>
          </TouchableOpacity>
        )}
      </View>
      
      {loadingMoments ? (
        <View style={styles.loadingMoments}>
          <LoadingSpinner size="small" />
        </View>
      ) : userMoments.length > 0 ? (
        <TouchableOpacity onPress={onViewMoments}>
          <View style={styles.momentsThumbnails}>
            {userMoments.slice(0, 4).map((moment, index) => (
              <View key={moment.id || moment._id} style={styles.thumbnailWrapper}>
                {moment.image ? (
                  <Image source={{ uri: moment.image }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.thumbnail, styles.textThumbnail]}>
                    <Typography variant="caption" style={styles.textThumbnailContent}>
                      {moment.content.substring(0, 30)}...
                    </Typography>
                  </View>
                )}
                <View style={styles.thumbnailOverlay}>
                  <MaterialIcons 
                    name={moment.image ? 'photo' : 'chat'} 
                    size={12} 
                    color="white" 
                  />
                </View>
                {index === 3 && userMoments.length > 4 && (
                  <View style={styles.moreOverlay}>
                    <Typography variant="body2" style={styles.moreText}>
                      +{userMoments.length - 4}
                    </Typography>
                  </View>
                )}
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyMoments}>
          <MaterialIcons name="photo-library" size={48} color={Colors.gray400} />
          <Typography variant="body1" color="textSecondary" style={styles.emptyText}>
            No moments to show
          </Typography>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">Profile</Typography>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => setShowActions(!showActions)}
        >
          <MaterialIcons name="more-vert" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Profile Actions Menu */}
      <ProfileActionsMenu
        visible={showActions}
        onClose={() => setShowActions(false)}
        userId={userId}
        userName={userName}
        onFriendDeleted={() => {
          setShowActions(false);
          setRefreshKey(prev => prev + 1); // Force ProfileActionButtons to refresh
          // No parent callbacks - just silent local refresh
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProfileCard()}
        {renderMomentsSection()}
        
        {/* Action Buttons */}
        <ProfileActionButtons
          key={refreshKey}
          userId={userId}
          userName={userName}
          friendRequestId={friendRequestId}
          isFriendRequest={isFriendRequest}
          onMessage={onMessage}
          onSendMoney={onSendMoney}
          onFriendRequestResponse={onFriendRequestResponse}
          onFriendRequestSent={onFriendRequestSent}
        />
      </ScrollView>

      {/* Contact Selector for Sharing */}
      <ContactSelector
        visible={showShareContacts}
        onClose={() => setShowShareContacts(false)}
        onContactSelect={(contact) => {
          console.log('Share profile with:', contact.name);
          Alert.alert('Profile Shared', `Profile shared with ${contact.name}`);
        }}
        title="Share Profile"
        subtitle="Choose who to share this profile with"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: Spacing.sm,
  },
  moreButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustBadgeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs / 2,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  trustBadgeText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  avatarText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  userName: {
    fontWeight: '600',
  },
  trustBadge: {
    marginLeft: Spacing.sm,
  },
  shareIconInline: {
    marginLeft: 'auto',
    padding: Spacing.xs,
  },
  userRole: {
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  location: {
    marginLeft: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: Spacing.xs,
    fontSize: 12,
  },
  trustLevelContainer: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  trustLabel: {
    marginBottom: Spacing.xs,
  },
  trustPercentage: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  loadingMoments: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  textThumbnail: {
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xs,
  },
  textThumbnailContent: {
    textAlign: 'center',
    color: Colors.text,
    fontSize: 10,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  viewAllText: {
    fontWeight: '500',
  },
  momentsThumbnails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 70,
    height: 70,
    marginRight: Spacing.sm,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs / 2,
  },
  moreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyMoments: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});