import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../theme';

const { width } = Dimensions.get('window');

interface StickerData {
  id: string;
  emoji: string;
  name: string;
  category: string;
}

interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onStickerSelect: (sticker: StickerData) => void;
}

const STICKER_CATEGORIES = [
  {
    id: 'emotions',
    name: 'Emotions',
    icon: 'mood' as const,
    stickers: [
      { id: '1', emoji: '😀', name: 'Grinning Face', category: 'emotions' },
      { id: '2', emoji: '😃', name: 'Grinning Face with Big Eyes', category: 'emotions' },
      { id: '3', emoji: '😄', name: 'Grinning Face with Smiling Eyes', category: 'emotions' },
      { id: '4', emoji: '😁', name: 'Beaming Face with Smiling Eyes', category: 'emotions' },
      { id: '5', emoji: '😆', name: 'Grinning Squinting Face', category: 'emotions' },
      { id: '6', emoji: '😅', name: 'Grinning Face with Sweat', category: 'emotions' },
      { id: '7', emoji: '🤣', name: 'Rolling on the Floor Laughing', category: 'emotions' },
      { id: '8', emoji: '😂', name: 'Face with Tears of Joy', category: 'emotions' },
      { id: '9', emoji: '🙂', name: 'Slightly Smiling Face', category: 'emotions' },
      { id: '10', emoji: '🙃', name: 'Upside-Down Face', category: 'emotions' },
      { id: '11', emoji: '😉', name: 'Winking Face', category: 'emotions' },
      { id: '12', emoji: '😊', name: 'Smiling Face with Smiling Eyes', category: 'emotions' },
      { id: '13', emoji: '😇', name: 'Smiling Face with Halo', category: 'emotions' },
      { id: '14', emoji: '🥰', name: 'Smiling Face with Hearts', category: 'emotions' },
      { id: '15', emoji: '😍', name: 'Smiling Face with Heart-Eyes', category: 'emotions' },
      { id: '16', emoji: '🤩', name: 'Star-Struck', category: 'emotions' },
      { id: '17', emoji: '😘', name: 'Face Blowing a Kiss', category: 'emotions' },
      { id: '18', emoji: '😗', name: 'Kissing Face', category: 'emotions' },
      { id: '19', emoji: '😚', name: 'Kissing Face with Closed Eyes', category: 'emotions' },
      { id: '20', emoji: '😙', name: 'Kissing Face with Smiling Eyes', category: 'emotions' },
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: 'pan-tool' as const,
    stickers: [
      { id: '21', emoji: '👍', name: 'Thumbs Up', category: 'gestures' },
      { id: '22', emoji: '👎', name: 'Thumbs Down', category: 'gestures' },
      { id: '23', emoji: '👏', name: 'Clapping Hands', category: 'gestures' },
      { id: '24', emoji: '🙌', name: 'Raising Hands', category: 'gestures' },
      { id: '25', emoji: '👐', name: 'Open Hands', category: 'gestures' },
      { id: '26', emoji: '🤝', name: 'Handshake', category: 'gestures' },
      { id: '27', emoji: '🙏', name: 'Folded Hands', category: 'gestures' },
      { id: '28', emoji: '✌️', name: 'Victory Hand', category: 'gestures' },
      { id: '29', emoji: '🤞', name: 'Crossed Fingers', category: 'gestures' },
      { id: '30', emoji: '🤟', name: 'Love-You Gesture', category: 'gestures' },
      { id: '31', emoji: '🤘', name: 'Sign of the Horns', category: 'gestures' },
      { id: '32', emoji: '🤙', name: 'Call Me Hand', category: 'gestures' },
      { id: '33', emoji: '👌', name: 'OK Hand', category: 'gestures' },
      { id: '34', emoji: '🤏', name: 'Pinching Hand', category: 'gestures' },
      { id: '35', emoji: '👈', name: 'Backhand Index Pointing Left', category: 'gestures' },
      { id: '36', emoji: '👉', name: 'Backhand Index Pointing Right', category: 'gestures' },
      { id: '37', emoji: '👆', name: 'Backhand Index Pointing Up', category: 'gestures' },
      { id: '38', emoji: '👇', name: 'Backhand Index Pointing Down', category: 'gestures' },
      { id: '39', emoji: '☝️', name: 'Index Pointing Up', category: 'gestures' },
      { id: '40', emoji: '✋', name: 'Raised Hand', category: 'gestures' },
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: 'favorite' as const,
    stickers: [
      { id: '41', emoji: '❤️', name: 'Red Heart', category: 'hearts' },
      { id: '42', emoji: '🧡', name: 'Orange Heart', category: 'hearts' },
      { id: '43', emoji: '💛', name: 'Yellow Heart', category: 'hearts' },
      { id: '44', emoji: '💚', name: 'Green Heart', category: 'hearts' },
      { id: '45', emoji: '💙', name: 'Blue Heart', category: 'hearts' },
      { id: '46', emoji: '💜', name: 'Purple Heart', category: 'hearts' },
      { id: '47', emoji: '🖤', name: 'Black Heart', category: 'hearts' },
      { id: '48', emoji: '🤍', name: 'White Heart', category: 'hearts' },
      { id: '49', emoji: '🤎', name: 'Brown Heart', category: 'hearts' },
      { id: '50', emoji: '💔', name: 'Broken Heart', category: 'hearts' },
      { id: '51', emoji: '❣️', name: 'Heart Exclamation', category: 'hearts' },
      { id: '52', emoji: '💕', name: 'Two Hearts', category: 'hearts' },
      { id: '53', emoji: '💞', name: 'Revolving Hearts', category: 'hearts' },
      { id: '54', emoji: '💓', name: 'Beating Heart', category: 'hearts' },
      { id: '55', emoji: '💗', name: 'Growing Heart', category: 'hearts' },
      { id: '56', emoji: '💖', name: 'Sparkling Heart', category: 'hearts' },
      { id: '57', emoji: '💘', name: 'Heart with Arrow', category: 'hearts' },
      { id: '58', emoji: '💝', name: 'Heart with Ribbon', category: 'hearts' },
      { id: '59', emoji: '💟', name: 'Heart Decoration', category: 'hearts' },
      { id: '60', emoji: '♥️', name: 'Heart Suit', category: 'hearts' },
    ]
  },
  {
    id: 'celebration',
    name: 'Celebration',
    icon: 'celebration' as const,
    stickers: [
      { id: '61', emoji: '🎉', name: 'Party Popper', category: 'celebration' },
      { id: '62', emoji: '🎊', name: 'Confetti Ball', category: 'celebration' },
      { id: '63', emoji: '🥳', name: 'Partying Face', category: 'celebration' },
      { id: '64', emoji: '🎈', name: 'Balloon', category: 'celebration' },
      { id: '65', emoji: '🎁', name: 'Wrapped Gift', category: 'celebration' },
      { id: '66', emoji: '🎂', name: 'Birthday Cake', category: 'celebration' },
      { id: '67', emoji: '🍰', name: 'Shortcake', category: 'celebration' },
      { id: '68', emoji: '🧁', name: 'Cupcake', category: 'celebration' },
      { id: '69', emoji: '🥂', name: 'Clinking Glasses', category: 'celebration' },
      { id: '70', emoji: '🍾', name: 'Bottle with Popping Cork', category: 'celebration' },
      { id: '71', emoji: '🎆', name: 'Fireworks', category: 'celebration' },
      { id: '72', emoji: '🎇', name: 'Sparkler', category: 'celebration' },
      { id: '73', emoji: '✨', name: 'Sparkles', category: 'celebration' },
      { id: '74', emoji: '🌟', name: 'Glowing Star', category: 'celebration' },
      { id: '75', emoji: '⭐', name: 'Star', category: 'celebration' },
      { id: '76', emoji: '🎭', name: 'Performing Arts', category: 'celebration' },
      { id: '77', emoji: '🎪', name: 'Circus Tent', category: 'celebration' },
      { id: '78', emoji: '🎨', name: 'Artist Palette', category: 'celebration' },
      { id: '79', emoji: '🎼', name: 'Musical Score', category: 'celebration' },
      { id: '80', emoji: '🎵', name: 'Musical Note', category: 'celebration' },
    ]
  },
];

export const StickerPicker: React.FC<StickerPickerProps> = ({
  visible,
  onClose,
  onStickerSelect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('emotions');

  const currentStickers = STICKER_CATEGORIES.find(
    cat => cat.id === selectedCategory
  )?.stickers || [];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose a Sticker</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
            contentContainerStyle={styles.categoryTabsContent}
          >
            {STICKER_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryTab,
                  selectedCategory === category.id && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialIcons
                  name={category.icon}
                  size={20}
                  color={
                    selectedCategory === category.id
                      ? Colors.primary
                      : Colors.gray600
                  }
                />
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === category.id && styles.categoryTabTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sticker Grid */}
          <ScrollView style={styles.stickerGrid}>
            <View style={styles.stickerContainer}>
              {currentStickers.map((sticker) => (
                <TouchableOpacity
                  key={sticker.id}
                  style={styles.stickerItem}
                  onPress={() => {
                    onStickerSelect(sticker);
                    onClose();
                  }}
                >
                  <Text style={styles.stickerEmoji}>{sticker.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  categoryTabs: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryTabsContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  categoryTabActive: {
    backgroundColor: Colors.primaryLight,
  },
  categoryTabText: {
    marginLeft: Spacing.xs,
    fontSize: 14,
    color: Colors.gray600,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: Colors.primary,
  },
  stickerGrid: {
    flex: 1,
    padding: Spacing.md,
  },
  stickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stickerItem: {
    width: (width - 40) / 6, // 6 stickers per row with padding
    height: (width - 40) / 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  stickerEmoji: {
    fontSize: 32,
  },
});

export default StickerPicker;