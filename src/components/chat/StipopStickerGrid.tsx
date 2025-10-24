/**
 * StipopStickerGrid Component
 * Displays Stipop animated Lottie stickers in a grid layout
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import stipopService, { StipopSticker, StipopStickerPack, StipopCategory } from '../../services/stipopService';
import { StickerData } from '../../types/sticker';

const { width: screenWidth } = Dimensions.get('window');
const GRID_COLUMNS = 4;
const STICKER_SIZE = (screenWidth - (Spacing.lg * 2) - (Spacing.md * (GRID_COLUMNS - 1))) / GRID_COLUMNS;

interface StipopStickerGridProps {
  onStickerSelect: (sticker: StickerData) => void;
  currentUserId?: string;
}

export const StipopStickerGrid: React.FC<StipopStickerGridProps> = ({
  onStickerSelect,
  currentUserId = 'default-user',
}) => {
  const [stickers, setStickers] = useState<StipopSticker[]>([]);
  const [stickerPacks, setStickerPacks] = useState<StipopStickerPack[]>([]);
  const [categories, setCategories] = useState<StipopCategory[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    initializeStipop();
    return () => {
      // Cleanup when component unmounts
      stipopService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      loadStickerPacks();
      loadCategories();
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      loadStickers(selectedPackId, selectedCategory);
    }
  }, [selectedPackId, selectedCategory, isConnected]);

  const initializeStipop = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎭 [StipopStickerGrid] Initializing Stipop for user:', currentUserId);
      
      const connected = await stipopService.connect(currentUserId);
      if (connected) {
        setIsConnected(true);
        console.log('🎭 [StipopStickerGrid] Successfully connected to Stipop');
      } else {
        throw new Error('Failed to connect to Stipop');
      }
    } catch (err) {
      console.error('🎭 [StipopStickerGrid] Initialization failed:', err);
      setError('Failed to initialize Stipop');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      console.log('🎭 [StipopStickerGrid] Loading categories...');
      const categoriesData = await stipopService.getCategories();
      
      // Create a popular category and combine with API categories
      const allCategories = [
        { category: 'Popular' },
        ...categoriesData.slice(0, 8) // Limit to top 8 categories for UI
      ];
      
      setCategories(allCategories);
      console.log('🎭 [StipopStickerGrid] Loaded categories:', allCategories.length);
    } catch (err) {
      console.error('🎭 [StipopStickerGrid] Failed to load categories:', err);
      // Set default categories if API fails
      setCategories([
        { category: 'Popular' },
        { category: 'Animals' },
        { category: 'Emotions' },
        { category: 'Food' }
      ]);
    }
  };

  const loadStickerPacks = async () => {
    try {
      console.log('🎭 [StipopStickerGrid] Loading sticker packs...');
      const packs = await stipopService.getStickerPacks();
      setStickerPacks(packs);
      
      // Auto-select first pack if available
      if (packs.length > 0 && !selectedPackId) {
        setSelectedPackId(packs[0].packageId);
      }
      
      console.log('🎭 [StipopStickerGrid] Loaded packs:', packs.length);
    } catch (err) {
      console.error('🎭 [StipopStickerGrid] Failed to load sticker packs:', err);
      setError('Failed to load sticker packs');
    }
  };

  const loadStickers = async (packageId: string | null = null, category: string = 'popular') => {
    try {
      setLoading(true);
      console.log('🎭 [StipopStickerGrid] Loading stickers for package:', packageId, 'category:', category);
      
      const loadedStickers = await stipopService.getStickers(packageId || undefined, category.toLowerCase());
      setStickers(loadedStickers);
      
      console.log('🎭 [StipopStickerGrid] Loaded stickers:', loadedStickers.length);
    } catch (err) {
      console.error('🎭 [StipopStickerGrid] Failed to load stickers:', err);
      setError('Failed to load stickers');
    } finally {
      setLoading(false);
    }
  };

  const handleStickerPress = (stipopSticker: StipopSticker) => {
    try {
      console.log('🎭 [StipopStickerGrid] Sticker selected:', stipopSticker.stickerId);
      
      // Convert Stipop sticker to our StickerData format
      const stickerData: StickerData = {
        id: stipopSticker.stickerId,
        url: stipopSticker.stickerImg, // Use sticker image URL
        preview_gif: stipopSticker.stickerImg,
        title: `Stipop Sticker ${stipopSticker.stickerId}`,
        width: STICKER_SIZE,
        height: STICKER_SIZE,
        type: stipopSticker.isAnimated ? 'gif' : 'image',
        tags: stipopSticker.tags,
        artist: stipopSticker.artistName,
        source: 'stipop'
      };

      onStickerSelect(stickerData);
    } catch (err) {
      console.error('🎭 [StipopStickerGrid] Error selecting sticker:', err);
      Alert.alert('Error', 'Failed to select sticker');
    }
  };

  const handleCategorySelect = async (category: string) => {
    try {
      console.log('🎭 [StipopStickerGrid] Category selected:', category);
      setSelectedCategory(category);
      setSelectedPackId(null); // Clear pack selection when changing category
    } catch (err) {
      console.error('🎭 [StipopStickerGrid] Category selection failed:', err);
      Alert.alert('Error', 'Failed to select category');
    }
  };

  const handlePackSelect = async (pack: StipopStickerPack) => {
    try {
      console.log('🎭 [StipopStickerGrid] Pack selected:', pack.packageId);
      
      // Download pack if not already downloaded
      if (pack.isDownload === 'N') {
        setLoading(true);
        const downloaded = await stipopService.downloadStickerPack(pack.packageId);
        if (!downloaded) {
          Alert.alert('Download Failed', 'Failed to download sticker pack');
          return;
        }
      }
      
      setSelectedPackId(pack.packageId);
    } catch (err) {
      console.error('🎭 [StipopStickerGrid] Pack selection failed:', err);
      Alert.alert('Error', 'Failed to select sticker pack');
    } finally {
      setLoading(false);
    }
  };

  const renderStickerItem = ({ item }: { item: StipopSticker }) => (
    <TouchableOpacity
      style={styles.stickerItem}
      onPress={() => handleStickerPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.stickerImg }}
        style={styles.stickerImage}
        resizeMode="contain"
      />
      {item.isAnimated && (
        <View style={styles.animatedBadge}>
          <Typography variant="caption" style={styles.animatedText}>
            ✨
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPackItem = ({ item }: { item: StipopStickerPack }) => (
    <TouchableOpacity
      style={[
        styles.packItem,
        selectedPackId === item.packageId && styles.selectedPackItem
      ]}
      onPress={() => handlePackSelect(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.packageImg }}
        style={styles.packImage}
        resizeMode="contain"
      />
      <Typography variant="caption" style={styles.packName} numberOfLines={1}>
        {item.packageName}
      </Typography>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Typography variant="body2" style={styles.errorText}>
          {error}
        </Typography>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={initializeStipop}
        >
          <Typography variant="body2" style={styles.retryText}>
            Retry
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && stickers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Typography variant="body2" style={styles.loadingText}>
          Loading Stipop stickers...
        </Typography>
      </View>
    );
  }

  const renderCategoryItem = ({ item }: { item: StipopCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory.toLowerCase() === item.category.toLowerCase() && styles.selectedCategoryItem
      ]}
      onPress={() => handleCategorySelect(item.category)}
      activeOpacity={0.7}
    >
      <Typography 
        variant="caption" 
        style={[
          styles.categoryText,
          selectedCategory.toLowerCase() === item.category.toLowerCase() && styles.selectedCategoryText
        ]}
        numberOfLines={1}
      >
        {item.category}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Categories Header */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.category}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContentContainer}
          />
        </View>
      )}

      {/* Sticker Packs Header - Show only if a specific category is selected */}
      {stickerPacks.length > 0 && selectedCategory.toLowerCase() !== 'popular' && (
        <View style={styles.packsContainer}>
          <FlatList
            data={stickerPacks}
            renderItem={renderPackItem}
            keyExtractor={(item) => item.packageId}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.packsContentContainer}
          />
        </View>
      )}

      {/* Stickers Grid */}
      <FlatList
        data={stickers}
        renderItem={renderStickerItem}
        keyExtractor={(item) => item.stickerId}
        numColumns={GRID_COLUMNS}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContentContainer}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Typography variant="body2" style={styles.emptyText}>
              {isConnected ? 'No stickers available' : 'Connecting to Stipop...'}
            </Typography>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.gray600,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: Colors.background,
    fontWeight: '600',
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray50,
  },
  categoriesContentContainer: {
    paddingHorizontal: Spacing.md,
  },
  categoryItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
    minWidth: 50,
    alignItems: 'center',
  },
  selectedCategoryItem: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.gray700,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: Colors.white,
    fontWeight: '600',
  },
  packsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    paddingVertical: Spacing.sm,
  },
  packsContentContainer: {
    paddingHorizontal: Spacing.md,
  },
  packItem: {
    alignItems: 'center',
    marginRight: Spacing.md,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 60,
  },
  selectedPackItem: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  packImage: {
    width: 40,
    height: 40,
    marginBottom: Spacing.xs,
  },
  packName: {
    fontSize: 10,
    color: Colors.gray700,
    textAlign: 'center',
  },
  gridContentContainer: {
    padding: Spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  stickerItem: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  stickerImage: {
    width: STICKER_SIZE - 8,
    height: STICKER_SIZE - 8,
  },
  animatedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedText: {
    fontSize: 8,
    color: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    color: Colors.gray600,
    textAlign: 'center',
  },
});

export default StipopStickerGrid;