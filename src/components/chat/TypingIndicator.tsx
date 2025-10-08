import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Avatar } from './Avatar';

interface TypingIndicatorProps {
  typingUsers: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      const duration = 600;
      const delay = 200;

      const animateSequence = Animated.sequence([
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(dot1Opacity, {
          toValue: 0.3,
          duration: duration,
          useNativeDriver: true,
        }),
      ]);

      const animateSequence2 = Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 0.3,
          duration: duration,
          useNativeDriver: true,
        }),
      ]);

      const animateSequence3 = Animated.sequence([
        Animated.delay(delay * 2),
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 0.3,
          duration: duration,
          useNativeDriver: true,
        }),
      ]);

      Animated.loop(
        Animated.parallel([animateSequence, animateSequence2, animateSequence3])
      ).start();
    };

    animateDots();
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    } else {
      return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.messageRow}>
        {/* Show avatar of first typing user */}
        <View style={styles.avatarContainer}>
          <Avatar
            name={typingUsers[0].name}
            imageUrl={typingUsers[0].avatar}
            size="small"
          />
        </View>
        
        <View style={styles.messageContent}>
          <View style={styles.bubble}>
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>{getTypingText()}</Text>
              <View style={styles.dotsContainer}>
                <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
                <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
                <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: ChatSpacing.xs / 2,
    paddingHorizontal: ChatSpacing.xs,
    alignItems: 'flex-start',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '100%',
  },
  avatarContainer: {
    marginRight: ChatSpacing.xs,
    marginBottom: ChatSpacing.xs / 2,
  },
  messageContent: {
    flex: 1,
    maxWidth: '92%',
    alignItems: 'flex-start',
  },
  bubble: {
    minWidth: 90,
    maxWidth: '80%',
    paddingHorizontal: ChatSpacing.md,
    paddingVertical: ChatSpacing.md,
    borderRadius: 12,
    backgroundColor: ChatTheme.receiveBubbleBackground,
    borderBottomLeftRadius: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typingText: {
    fontSize: 14,
    color: ChatTheme.receiveBubbleText,
    fontStyle: 'italic',
    marginRight: ChatSpacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ChatTheme.receiveBubbleText,
  },
});