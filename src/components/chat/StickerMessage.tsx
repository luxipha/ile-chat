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

export const StickerMessage: React.FC<StickerMessageProps> = ({
  sticker,
  isCurrentUser,
  onPress,
  onLongPress,
}) => {
  const scaleAnim = new Animated.Value(0);

  React.useEffect(() => {
    // Animation effect when sticker appears
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, []);

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
          // GIPHY animated sticker
          <Image
            source={{ uri: sticker.url }}
            style={styles.stickerImage}
            resizeMode="contain"
          />
        ) : (
          // Fallback for emoji stickers
          <Text style={styles.stickerEmoji}>{sticker.emoji || '🎭'}</Text>
        )}
      </TouchableOpacity>
      
      {/* Accessibility label */}
      <Text style={styles.stickerName} accessibilityLabel={sticker.name || sticker.title}>
        {/* Keep this empty for visual cleanliness */}
      </Text>
    </Animated.View>
  );
};

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
});

export default StickerMessage;