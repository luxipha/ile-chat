import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  Image,
  Dimensions,
  TextInput,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../theme';
import giphyService, { GiphySticker } from '../../services/giphyService';
import { StickerData } from '../../types/sticker';

const { width } = Dimensions.get('window');

interface GiphyStickerGridProps {
  onStickerSelect: (sticker: StickerData) => void;
}

export const GiphyStickerGrid: React.FC<GiphyStickerGridProps> = ({
  onStickerSelect,
}) => {
  const [stickers, setStickers] = useState<GiphySticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Load trending stickers on mount
  useEffect(() => {
    loadTrendingStickers();
  }, []);

  // Search stickers when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        searchStickers(searchQuery);
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      loadTrendingStickers();
    }
  }, [searchQuery]);

  const loadTrendingStickers = async () => {
    try {
      setLoading(true);
      const trendingStickers = await giphyService.getTrendingStickers(20);
      setStickers(trendingStickers);
    } catch (error) {
      console.error('Error loading trending stickers:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchStickers = async (query: string) => {
    try {
      setIsSearching(true);
      const searchResults = await giphyService.searchStickers(query, 20);
      setStickers(searchResults);
    } catch (error) {
      console.error('Error searching stickers:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStickerPress = (giphySticker: GiphySticker) => {
    const formattedSticker = giphyService.formatStickerForMessage(giphySticker);
    const stickerData: StickerData = {
      id: formattedSticker.id,
      name: formattedSticker.title,
      category: 'giphy',
      url: formattedSticker.url,
      previewUrl: formattedSticker.previewUrl,
      width: formattedSticker.width,
      height: formattedSticker.height,
      title: formattedSticker.title,
    };
    onStickerSelect(stickerData);
  };

  const AnimatedStickerItem = ({ sticker, index }: { sticker: GiphySticker; index: number }) => {
    const scaleAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(0);

    useEffect(() => {
      // Staggered animation for each sticker
      const delay = index * 50; // 50ms delay between each sticker
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }, [index]);

    const handlePress = () => {
      // Bounce animation on press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        handleStickerPress(sticker);
      });
    };

    return (
      <Animated.View
        style={[
          styles.stickerItem,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.8}
          style={styles.stickerTouchable}
        >
          <Image
            source={{ uri: sticker.images.fixed_height_small.url }}
            style={styles.stickerImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };


  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stickers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textSecondary}
        />
        {isSearching && (
          <ActivityIndicator size="small" color={Colors.primary} />
        )}
      </View>


      {/* Stickers Grid */}
      <ScrollView
        style={styles.stickersContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading stickers...</Text>
          </View>
        ) : (
          <View style={styles.stickersGrid}>
            {stickers.map((sticker, index) => (
              <AnimatedStickerItem
                key={sticker.id}
                sticker={sticker}
                index={index}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs, // Reduced padding
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16, // Smaller border radius
    paddingHorizontal: Spacing.sm, // Reduced horizontal padding
    paddingVertical: Spacing.xs, // Reduced vertical padding
    marginBottom: Spacing.sm, // Reduced bottom margin
    borderWidth: 1,
    borderColor: Colors.border,
    height: 36, // Fixed height to make it smaller
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 14, // Smaller font
    color: Colors.textPrimary,
  },
  stickersContainer: {
    flex: 1,
  },
  stickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around', // Changed from space-between to space-around for better distribution
  },
  stickerItem: {
    width: (width - 60) / 3, // 3 stickers per row with better spacing
    height: (width - 60) / 3,
    marginBottom: Spacing.xs, // Reduced margin
    marginHorizontal: Spacing.xs / 2, // Add horizontal margin for better spacing
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    elevation: 2, // Android shadow
    shadowColor: Colors.black, // iOS shadow
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stickerTouchable: {
    width: '100%',
    height: '100%',
  },
  stickerImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 16,
  },
});

export default GiphyStickerGrid;