import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface ProfileCardProps {
  userId?: string; // If provided, shows that user's profile. If not, shows current user
  name?: string; // If provided, overrides the name from profile
  role: string;
  region: string;
  joinDate?: string; // Made optional to handle cases where date is not available
  createdAt?: string; // Alternative field for user creation date
  bricksCount: number;
  profilePicture?: string; // DEPRECATED: Use UserAvatar instead
  trustBadge?: 'verified' | 'premium' | 'agent' | null;
  trustLevel: number; // 1-5 for percentage calculation
  showShareIcon?: boolean;
  showEditIcon?: boolean;
  showQRIcon?: boolean;
  onSharePress?: () => void;
  onEditPress?: () => void;
  onQRPress?: () => void;
  style?: ViewStyle;
}

// Helper function to format date for display
const formatJoinDate = (dateString?: string): string => {
  if (!dateString) return 'Recently';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  } catch (error) {
    return 'Recently';
  }
};

export const ProfileCard: React.FC<ProfileCardProps> = ({
  userId,
  name,
  role,
  region,
  joinDate,
  createdAt,
  bricksCount,
  profilePicture, // DEPRECATED
  trustBadge,
  trustLevel,
  showShareIcon = false,
  showEditIcon = false,
  showQRIcon = false,
  onSharePress,
  onEditPress,
  onQRPress,
  style,
}) => {
  // Use createdAt if joinDate is not provided
  const displayDate = joinDate || createdAt;
  const formattedJoinDate = formatJoinDate(displayDate);
  const getTrustBadgeIcon = (badge: string | null) => {
    switch (badge) {
      case 'verified': return 'verified';
      case 'premium': return 'diamond';
      case 'agent': return 'business';
      default: return null;
    }
  };

  const getTrustBadgeColor = (badge: string | null) => {
    switch (badge) {
      case 'verified': return Colors.success;
      case 'premium': return Colors.secondary;
      case 'agent': return Colors.primary;
      default: return Colors.gray400;
    }
  };

  return (
    <Card style={[styles.profileCard, style]}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Avatar
              userId={userId}
              name={name}
              imageUrl={profilePicture}
              size="large"
              disableAutoLoad={!!profilePicture && !!userId}
            />
            <View style={styles.trustBadgeOverlay}>
              <Typography variant="caption" style={styles.trustBadgeText}>
                {Math.round((trustLevel / 5) * 100)}%
              </Typography>
            </View>
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Typography variant="h4" style={styles.userName}>
              {name}
            </Typography>
            {trustBadge && (
              <MaterialIcons 
                name={getTrustBadgeIcon(trustBadge) as any}
                size={20}
                color={getTrustBadgeColor(trustBadge)}
                style={styles.trustBadge}
              />
            )}
            {showShareIcon && onSharePress && (
              <TouchableOpacity onPress={onSharePress} style={styles.actionIcon}>
                <MaterialIcons name="share" size={20} color={Colors.primary} />
              </TouchableOpacity>
            )}
            {showEditIcon && onEditPress && (
              <TouchableOpacity onPress={onEditPress} style={styles.actionIcon}>
                <MaterialIcons name="edit" size={20} color={Colors.primary} />
              </TouchableOpacity>
            )}
            {showQRIcon && onQRPress && (
              <TouchableOpacity onPress={onQRPress} style={styles.actionIcon}>
                <MaterialIcons name="qr-code" size={20} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          
          <Typography variant="body1" color="textSecondary" style={styles.userRole}>
            {role}
          </Typography>
          
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={16} color={Colors.gray400} />
            <Typography variant="body2" color="textSecondary" style={styles.location}>
              {region}
            </Typography>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="grain" size={16} color={Colors.secondary} />
              <Typography variant="body2" style={styles.statText}>
                {bricksCount.toLocaleString()} Bricks
              </Typography>
            </View>
            
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={16} color={Colors.gray400} />
              <Typography variant="body2" color="textSecondary" style={styles.statText}>
                Joined {formattedJoinDate}
              </Typography>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
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
    color: Colors.gray600,
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
  actionIcon: {
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
});
