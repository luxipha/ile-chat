import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { ChatTheme } from '../../theme/chatTheme';
import { Typography } from '../ui/Typography';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'small' | 'medium' | 'large';
  online?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 'medium',
  online = false,
  style,
}) => {
  const avatarSizes = {
    small: 32,
    medium: 40,
    large: 48,
  };
  const avatarSize = avatarSizes[size];
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const avatarStyle = [
    styles.container,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize * 0.2, // Square with rounded corners
    },
    style,
  ];

  return (
    <View style={styles.wrapper}>
      <View style={avatarStyle}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <Text 
            style={[
              styles.initials,
              { fontSize: avatarSize * 0.4 }
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
              borderRadius: avatarSize * 0.125, // Keep online indicator circular
              right: -2,
              top: -2,
            }
          ]} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    backgroundColor: ChatTheme.background3,
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
    color: ChatTheme.textSecondary,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: ChatTheme.online,
    borderWidth: 2,
    borderColor: ChatTheme.background1,
  },
});