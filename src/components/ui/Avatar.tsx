import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius } from '../../theme';
import { Typography } from './Typography';
import profileService from '../../services/profileService';
import authService from '../../services/authService';

interface AvatarProps {
  name?: string; // Optional - will auto-load current user's name if not provided
  imageUrl?: string; // Optional - will auto-load current user's avatar if not provided
  userId?: string; // If provided, loads that user's profile. If not, loads current user
  size?: 'small' | 'medium' | 'large' | 'xlarge' | number;
  online?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  // Performance options
  disableAutoLoad?: boolean; // Set to true to disable automatic profile loading
}

// Global state for avatar cache
let globalAvatarCache = new Map<string, { name: string; avatar?: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const APP_START_TIME = Date.now();

// Function to clear avatar cache (call this when profile is updated)
export const clearAvatarCache = (userId?: string) => {
  if (userId) {
    globalAvatarCache.delete(userId);
    globalAvatarCache.delete('current'); // Clear current user cache too
  } else {
    globalAvatarCache.clear(); // Clear all cache
  }
  console.log('🗑️ Avatar cache cleared for:', userId || 'all users');
};

export const Avatar: React.FC<AvatarProps> = ({
  name: providedName,
  imageUrl: providedImageUrl,
  userId,
  size = 'medium',
  online = false,
  style,
  onPress,
  backgroundColor = Colors.gray200,
  textColor = Colors.gray600,
  disableAutoLoad = false,
}) => {
  // State for auto-loaded profile data
  const [profileData, setProfileData] = useState<{ name: string; avatar?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-load profile if userId provided or if no complete data provided and not disabled
  useEffect(() => {
    if (!disableAutoLoad && (userId || (!providedName || !providedImageUrl))) {
      loadProfileData();
    }
  }, [userId, providedName, providedImageUrl, disableAutoLoad]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      const cacheKey = userId || 'current';
      const now = Date.now();
      
      console.log('🔍 Avatar loadProfileData called:', { userId, cacheKey, providedName, providedImageUrl });
      
      // Check cache first (but ignore cache if it's from before app restart)
      const cached = globalAvatarCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < CACHE_DURATION && cached.timestamp > APP_START_TIME) {
        console.log('📦 Avatar using cached data:', { cacheKey, cached });
        setProfileData({ name: cached.name, avatar: cached.avatar });
        setLoading(false);
        return;
      } else if (cached && cached.timestamp <= APP_START_TIME) {
        console.log('🗑️ Avatar cache is stale (from before app restart), refreshing:', { cacheKey });
      }
      
      if (userId) {
        // Load specific user's profile
        console.log('🔍 Avatar loading profile for userId:', userId);
        const result = await profileService.getUserProfile(userId, true); // Force refresh
        console.log('🔍 Avatar profile result:', { success: result.success, profile: result.profile, error: result.error });
        if (result.success && result.profile) {
          const profileData = {
            name: result.profile.name,
            avatar: result.profile.avatar
          };
          console.log('✅ Avatar setting profile data:', profileData);
          setProfileData(profileData);
          globalAvatarCache.set(cacheKey, { ...profileData, timestamp: now });
        } else {
          console.log('❌ Avatar failed to load profile for userId:', userId, 'Error:', result.error);
        }
      } else {
        // Load current user's profile
        const currentUser = await authService.getCachedUser();
        if (currentUser) {
          const result = await profileService.getUserProfile(currentUser.id);
          if (result.success && result.profile) {
            const profileData = {
              name: result.profile.name,
              avatar: result.profile.avatar
            };
            setProfileData(profileData);
            globalAvatarCache.set(cacheKey, { ...profileData, timestamp: now });
          } else {
            // Fallback to cached user data
            const profileData = {
              name: currentUser.name || currentUser.email?.split('@')[0] || 'User',
              avatar: undefined
            };
            setProfileData(profileData);
            globalAvatarCache.set(cacheKey, { ...profileData, timestamp: now });
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile data for avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine final name and imageUrl to use (prefer freshly loaded profile data)
  const finalName = profileData?.name || providedName || 'User';
  const finalImageUrl = profileData?.avatar || providedImageUrl;
  // Handle both preset sizes and custom numeric sizes
  const getAvatarSize = (size: 'small' | 'medium' | 'large' | 'xlarge' | number): number => {
    if (typeof size === 'number') return size;
    
    const presetSizes = {
      small: 32,
      medium: 40,
      large: 48,
      xlarge: 80,
    };
    return presetSizes[size];
  };

  const avatarSize = getAvatarSize(size);
  
  // Generate initials from name
  const getInitials = (name: string): string => {
    if (!name) return '?';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(finalName);

  // Always use rounded square
  const getBorderRadius = (): number => {
    return avatarSize * 0.2; // Rounded square
  };

  const avatarStyle = [
    styles.container,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: getBorderRadius(),
      backgroundColor: backgroundColor,
    },
    style,
  ];

  const AvatarContent = () => (
    <View style={styles.wrapper}>
      <View style={avatarStyle}>
        {finalImageUrl ? (
          <Image 
            source={{ uri: finalImageUrl }} 
            style={[
              styles.image,
              { borderRadius: getBorderRadius() }
            ]}
            onError={(error) => {
              console.warn('Avatar image failed to load:', error);
            }}
          />
        ) : (
          <Text 
            style={[
              styles.initials,
              { 
                fontSize: avatarSize * 0.4,
                color: textColor,
              }
            ]}
          >
            {initials}
          </Text>
        )}
      </View>
      {online && (
        <View 
          style={[
            styles.onlineIndicator,
            {
              width: avatarSize * 0.25,
              height: avatarSize * 0.25,
              borderRadius: avatarSize * 0.125,
              right: -2,
              top: -2,
            }
          ]} 
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <AvatarContent />
      </TouchableOpacity>
    );
  }

  return <AvatarContent />;
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
    textAlign: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
});
