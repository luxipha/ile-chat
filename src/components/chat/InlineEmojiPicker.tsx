import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../theme';

const { width } = Dimensions.get('window');

interface EmojiData {
  id: string;
  emoji: string;
  name: string;
}

interface InlineEmojiPickerProps {
  visible: boolean;
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

// Popular emojis for quick access
const POPULAR_EMOJIS: EmojiData[] = [
  { id: '1', emoji: '😀', name: 'Grinning Face' },
  { id: '2', emoji: '😃', name: 'Grinning Face with Big Eyes' },
  { id: '3', emoji: '😄', name: 'Grinning Face with Smiling Eyes' },
  { id: '4', emoji: '😁', name: 'Beaming Face with Smiling Eyes' },
  { id: '5', emoji: '😆', name: 'Grinning Squinting Face' },
  { id: '6', emoji: '😅', name: 'Grinning Face with Sweat' },
  { id: '7', emoji: '🤣', name: 'Rolling on the Floor Laughing' },
  { id: '8', emoji: '😂', name: 'Face with Tears of Joy' },
  { id: '9', emoji: '🙂', name: 'Slightly Smiling Face' },
  { id: '10', emoji: '🙃', name: 'Upside-Down Face' },
  { id: '11', emoji: '😉', name: 'Winking Face' },
  { id: '12', emoji: '😊', name: 'Smiling Face with Smiling Eyes' },
  { id: '13', emoji: '😇', name: 'Smiling Face with Halo' },
  { id: '14', emoji: '🥰', name: 'Smiling Face with Hearts' },
  { id: '15', emoji: '😍', name: 'Smiling Face with Heart-Eyes' },
  { id: '16', emoji: '🤩', name: 'Star-Struck' },
  { id: '17', emoji: '😘', name: 'Face Blowing a Kiss' },
  { id: '18', emoji: '😗', name: 'Kissing Face' },
  { id: '19', emoji: '😚', name: 'Kissing Face with Closed Eyes' },
  { id: '20', emoji: '😙', name: 'Kissing Face with Smiling Eyes' },
  { id: '21', emoji: '👍', name: 'Thumbs Up' },
  { id: '22', emoji: '👎', name: 'Thumbs Down' },
  { id: '23', emoji: '👏', name: 'Clapping Hands' },
  { id: '24', emoji: '🙌', name: 'Raising Hands' },
  { id: '25', emoji: '👐', name: 'Open Hands' },
  { id: '26', emoji: '🤝', name: 'Handshake' },
  { id: '27', emoji: '🙏', name: 'Folded Hands' },
  { id: '28', emoji: '✌️', name: 'Victory Hand' },
  { id: '29', emoji: '🤞', name: 'Crossed Fingers' },
  { id: '30', emoji: '🤟', name: 'Love-You Gesture' },
  { id: '31', emoji: '❤️', name: 'Red Heart' },
  { id: '32', emoji: '🧡', name: 'Orange Heart' },
  { id: '33', emoji: '💛', name: 'Yellow Heart' },
  { id: '34', emoji: '💚', name: 'Green Heart' },
  { id: '35', emoji: '💙', name: 'Blue Heart' },
  { id: '36', emoji: '💜', name: 'Purple Heart' },
  { id: '37', emoji: '🖤', name: 'Black Heart' },
  { id: '38', emoji: '🤍', name: 'White Heart' },
  { id: '39', emoji: '💔', name: 'Broken Heart' },
  { id: '40', emoji: '💕', name: 'Two Hearts' },
  { id: '41', emoji: '🎉', name: 'Party Popper' },
  { id: '42', emoji: '🎊', name: 'Confetti Ball' },
  { id: '43', emoji: '🥳', name: 'Partying Face' },
  { id: '44', emoji: '🎈', name: 'Balloon' },
  { id: '45', emoji: '🎁', name: 'Wrapped Gift' },
  { id: '46', emoji: '🔥', name: 'Fire' },
  { id: '47', emoji: '⭐', name: 'Star' },
  { id: '48', emoji: '✨', name: 'Sparkles' },
];

export const InlineEmojiPicker: React.FC<InlineEmojiPickerProps> = ({
  visible,
  onEmojiSelect,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header with close button */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Emojis</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Emoji Grid */}
      <ScrollView 
        style={styles.emojiGrid}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.emojiContainer}>
          {POPULAR_EMOJIS.map((emojiData) => (
            <TouchableOpacity
              key={emojiData.id}
              style={styles.emojiItem}
              onPress={() => onEmojiSelect(emojiData.emoji)}
              activeOpacity={0.6}
            >
              <Text style={styles.emojiText}>{emojiData.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    maxHeight: 200, // Limit height so input stays visible
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  emojiGrid: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  emojiItem: {
    width: (width - 32) / 8, // 8 emojis per row
    height: (width - 32) / 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    borderRadius: 8,
  },
  emojiText: {
    fontSize: 24,
  },
});

export default InlineEmojiPicker;