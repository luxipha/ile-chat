import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Avatar } from '../ui/Avatar';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

interface MomentItemProps {
  moment: {
    id: string;
    _id?: string;
    authorId: string;
    authorName?: string;
    userName?: string;
    avatar?: string;
    userAvatar?: string;
    content: string;
    image?: string;
    time?: string;
    postTime?: string;
    likes?: number;
    shares?: number;
    isLikedByUser?: boolean;
    isLiked?: boolean;
  };
  currentUserId?: string;
  showDeleteMenu?: string | null;
  onLike: (momentId: string) => void;
  onShare: (momentId: string) => void;
  onDeleteMenuToggle: (momentId: string) => void;
  onDelete: (momentId: string) => void;
}

export const MomentItem: React.FC<MomentItemProps> = ({
  moment,
  currentUserId,
  showDeleteMenu,
  onLike,
  onShare,
  onDeleteMenuToggle,
  onDelete,
}) => {
  const isOwn = moment.authorId === currentUserId;
  const userName = moment.authorName || moment.userName || 'Unknown User';
  const userAvatar = moment.avatar || moment.userAvatar;
  const postTime = moment.time || moment.postTime || 'Unknown time';
  const momentId = moment.id || moment._id;

  if (!momentId) {
    console.error('MomentItem: moment missing id', {
      moment,
      hasId: !!moment.id,
      has_id: !!moment._id,
      momentKeys: Object.keys(moment)
    });
    return null;
  }

  return (
    <View style={styles.momentItem}>
      {/* User header */}
      <View style={styles.momentUserHeader}>
        <View style={styles.momentUserInfo}>
          <Avatar
            name={userName}
            userId={moment.authorId}
            size="medium"
          />
          <View style={styles.momentUserDetails}>
            <Typography variant="h6" style={styles.momentUserName}>
              {userName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {postTime}
            </Typography>
          </View>
        </View>
        {isOwn && (
          <View style={styles.momentDeleteContainer}>
            <TouchableOpacity 
              onPress={() => onDeleteMenuToggle(momentId)} 
              style={styles.momentDeleteButton}
            >
              <MaterialIcons name="more-vert" size={20} color={Colors.gray600} />
            </TouchableOpacity>
            {showDeleteMenu === momentId && (
              <View style={styles.deleteDropdown}>
                <TouchableOpacity 
                  onPress={() => onDelete(momentId)} 
                  style={styles.deleteOption}
                >
                  <MaterialIcons name="delete" size={16} color={Colors.error} />
                  <Typography 
                    variant="body2" 
                    style={[styles.deleteOptionText, { color: Colors.error }]}
                  >
                    Delete
                  </Typography>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Post content */}
      <Typography variant="body1" style={styles.momentPostContent}>
        {moment.content}
      </Typography>

      {/* Post image */}
      {moment.image && (
        <Image source={{ uri: moment.image }} style={styles.momentPostImage} />
      )}

      {/* Actions */}
      <View style={styles.momentActions}>
        <TouchableOpacity 
          onPress={() => onLike(momentId)}
          style={styles.momentActionButton}
        >
          <MaterialIcons 
            name={moment.isLikedByUser || moment.isLiked ? 'favorite' : 'favorite-border'} 
            size={20} 
            color={moment.isLikedByUser || moment.isLiked ? Colors.error : Colors.gray600} 
          />
          <Typography variant="body2" style={styles.momentActionText}>
            {moment.likes || 0}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => onShare(momentId)}
          style={styles.momentActionButton}
        >
          <MaterialIcons name="share" size={20} color={Colors.gray600} />
          <Typography variant="body2" style={styles.momentActionText}>
            {moment.shares ? `${moment.shares}` : 'Share'}
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  momentItem: {
    backgroundColor: Colors.background,
    marginBottom: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray200,
  },
  momentUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  momentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  momentUserDetails: {
    gap: Spacing.xs / 2, // Using theme token instead of hardcoded 2
  },
  momentUserName: {
    fontWeight: '600',
  },
  momentDeleteContainer: {
    position: 'relative',
  },
  momentDeleteButton: {
    padding: Spacing.xs,
  },
  deleteDropdown: {
    position: 'absolute',
    top: 28,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    minWidth: 100,
    ...Shadows.base, // Using theme shadows instead of hardcoded
    zIndex: 1000,
  },
  deleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  deleteOptionText: {
    marginLeft: Spacing.xs,
  },
  momentPostContent: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  momentPostImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  momentActions: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  momentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xl,
  },
  momentActionText: {
    marginLeft: Spacing.xs,
    color: Colors.gray600,
  },
});