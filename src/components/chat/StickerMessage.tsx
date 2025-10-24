import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { StickerData } from '../../types/sticker';
import { Colors, Spacing } from '../../theme';


interface StickerMessageProps {
  sticker: StickerData;
  isCurrentUser: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const StickerMessage: React.FC<StickerMessageProps> = React.memo(({
  sticker,
  isCurrentUser,
  onPress,
  onLongPress,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  

  React.useEffect(() => {
    // Animation effect when sticker appears
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, []); // Empty dependency array to run only once

  const handlePress = () => {
    // Small bounce animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress?.();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.stickerContainer}
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
      >
        {sticker.url ? (
          // GIPHY or Stipop image sticker
          <Image
            source={{ uri: sticker.url }}
            style={styles.stickerImage}
            resizeMode="contain"
            onError={(error) => {
              console.log('🎭 Error loading sticker:', sticker.id, 'from', sticker.source);
            }}
          />
        ) : sticker.preview_gif ? (
          // Fallback to preview GIF for GIPHY stickers
          <Image
            source={{ uri: sticker.preview_gif }}
            style={styles.stickerImage}
            resizeMode="contain"
            onError={(error) => {
              console.log('🎭 Error loading preview sticker:', sticker.id);
            }}
          />
        ) : (
          // Fallback for emoji stickers or when URL is missing
          <View style={styles.fallbackContainer}>
            <Text style={styles.stickerEmoji}>{sticker.emoji || '🎭'}</Text>
            <Text style={styles.fallbackText}>{sticker.name || sticker.title || 'Sticker'}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Source indicator for development */}
      {sticker.source && __DEV__ && (
        <Text style={styles.sourceIndicator}>
          {sticker.source === 'stipop' ? '✨' : sticker.source === 'giphy' ? '🎬' : '😊'}
        </Text>
      )}
      
      {/* Accessibility label */}
      <Text style={styles.stickerName} accessibilityLabel={sticker.name || sticker.title}>
        {/* Keep this empty for visual cleanliness */}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
    maxWidth: '80%',
  },
  currentUserContainer: {
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  otherUserContainer: {
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  stickerContainer: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: Spacing.xs,
    width: 120, // Fixed width for consistency
    height: 120, // Fixed height for consistency
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  stickerEmoji: {
    fontSize: 64, // Large size for stickers
    textAlign: 'center',
  },
  stickerName: {
    fontSize: 0, // Hidden but available for accessibility
    height: 0,
    opacity: 0,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  fallbackText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  sourceIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    width: 16,
    height: 16,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default StickerMessage;