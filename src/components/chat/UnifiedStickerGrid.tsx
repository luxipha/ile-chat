/**
 * KlipyStickerGrid Component
 * Displays Klipy stickers with category tabs
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
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import klipyService, { KlipyGif, KlipySticker, KlipyClip, KlipyStickerCategory, KlipyClipCategory } from '../../services/klipyService';
import { StickerData } from '../../types/sticker';

const { width: screenWidth } = Dimensions.get('window');
const GRID_COLUMNS = 4;
const STICKER_SIZE = (screenWidth - (Spacing.lg * 2) - (Spacing.md * (GRID_COLUMNS - 1))) / GRID_COLUMNS;

interface KlipyStickerGridProps {
  currentUserId?: string;
  onStickerSelect: (sticker: StickerData) => void;
}

// Content types
type ContentType = 'gifs' | 'stickers' | 'clips' | 'recent' | 'pinned';


// Klipy categories with content types  
const KLIPY_CATEGORIES = [
  { id: 'recent', name: 'Recent', klipyQuery: 'recent', type: 'recent' },
  { id: 'pinned', name: 'Pinned', klipyQuery: 'pinned', type: 'pinned' },
  { id: 'popular', name: 'Popular', klipyQuery: 'trending', type: 'gifs' },
  { id: 'animation', name: 'Animation/Cartoon', klipyQuery: 'cartoon', type: 'gifs' },
  { id: 'animals', name: 'Animals', klipyQuery: 'animals', type: 'gifs' },
  { id: 'celebrity', name: 'Celebrity', klipyQuery: 'celebrity', type: 'gifs' },
  { id: 'food', name: 'Food/Drink', klipyQuery: 'food', type: 'gifs' },
  { id: 'reactions', name: 'Reactions', klipyQuery: 'reactions', type: 'gifs' },
  { id: 'stickers', name: 'Stickers', klipyQuery: 'stickers', type: 'stickers' },
  { id: 'clips', name: 'Clips', klipyQuery: 'clips', type: 'clips' },
];

const CATEGORY_ICONS: Record<string, { name: string; family?: 'material-community' }> = {
  recent: { name: 'history' },
  pinned: { name: 'push-pin' },
  popular: { name: 'whatshot' },
  animation: { name: 'movie-filter' },
  animals: { name: 'pets' },
  celebrity: { name: 'emoji-events' },
  food: { name: 'restaurant' },
  reactions: { name: 'emoji-emotions' },
  stickers: { name: 'sticker-emoji', family: 'material-community' },
  clips: { name: 'movie-creation' },
};

// Cache for storing results
const stickerCache = new Map<string, { data: StickerData[], timestamp: number }>();
const CACHE_DURATION = 90000; // 90 seconds

export const KlipyStickerGrid: React.FC<KlipyStickerGridProps> = ({
  currentUserId = 'default-user',
  onStickerSelect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('popular');
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentStickers, setRecentStickers] = useState<StickerData[]>([]);
  const [pinnedStickers, setPinnedStickers] = useState<StickerData[]>([]);

  useEffect(() => {
    loadStickersForCategory(selectedCategory);
  }, [selectedCategory]);

  // Check cache before making API calls
  const getCachedStickers = (key: string): StickerData[] | null => {
    const cached = stickerCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  };

  // Save to cache
  const setCachedStickers = (key: string, data: StickerData[]) => {
    stickerCache.set(key, { data, timestamp: Date.now() });
  };

  // Add to recent stickers (max 50)
  const addToRecent = (sticker: StickerData) => {
    setRecentStickers(prev => {
      const filtered = prev.filter(s => s.id !== sticker.id);
      return [sticker, ...filtered].slice(0, 50);
    });
  };

  // Toggle pinned stickers
  const togglePinned = (sticker: StickerData) => {
    setPinnedStickers(prev => {
      const exists = prev.find(s => s.id === sticker.id);
      if (exists) {
        return prev.filter(s => s.id !== sticker.id);
      } else {
        return [sticker, ...prev];
      }
    });
  };

  const loadStickersForCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const category = KLIPY_CATEGORIES.find(cat => cat.id === categoryId);
      if (!category) return;

      // Handle special categories
      if (category.type === 'recent') {
        setStickers(recentStickers);
        setLoading(false);
        return;
      }

      if (category.type === 'pinned') {
        setStickers(pinnedStickers);
        setLoading(false);
        return;
      }


      // Check cache for regular categories
      const cacheKey = `${category.type}_${category.klipyQuery}`;
      const cached = getCachedStickers(cacheKey);
      if (cached) {
        setStickers(cached);
        setLoading(false);
        return;
      }

      // Load content based on type
      let contentStickers: StickerData[] = [];
      
      switch (category.type) {
        case 'gifs':
          contentStickers = await loadKlipyGifs(category.klipyQuery);
          break;
        case 'stickers':
          contentStickers = await loadKlipyStickers(category.klipyQuery);
          break;
        case 'clips':
          contentStickers = await loadKlipyClips(category.klipyQuery);
          break;
      }
      
      // Cache results
      setCachedStickers(cacheKey, contentStickers);
      setStickers(contentStickers);
    } catch (err) {
      console.error('🎭 [KlipyStickerGrid] Error loading stickers:', err);
      setError('Failed to load stickers');
    } finally {
      setLoading(false);
    }
  };

  const loadKlipyGifs = async (query: string): Promise<StickerData[]> => {
    try {
      // Set customer ID for tracking
      klipyService.setCustomerId(currentUserId);
      
      let klipyGifs: KlipyGif[] = [];
      
      if (query === 'trending') {
        klipyGifs = await klipyService.getTrendingGifs(1, 50);
      } else {
        klipyGifs = await klipyService.searchGifs(query, 1, 50);
      }

      const mappedStickers = klipyGifs.map((gif, index) => {
        // Generate unique ID using gif.id or fallback to index with timestamp
        const uniqueId = gif.id || `gif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
        const stickerData = {
          id: `klipy_gif_${uniqueId}`,
          url: gif.file.md.gif.url || gif.file.sm.gif.url || gif.file.xs.gif.url,
          preview_gif: gif.file.xs.gif.url || gif.file.sm.gif.url,
          title: gif.title || `Klipy GIF ${uniqueId}`,
          width: Math.min(gif.file.md.gif.width || gif.file.sm.gif.width || STICKER_SIZE, STICKER_SIZE),
          height: Math.min(gif.file.md.gif.height || gif.file.sm.gif.height || STICKER_SIZE, STICKER_SIZE),
          type: 'gif' as const,
          tags: gif.tags || [],
          source: 'klipy' as const,
        };
        return stickerData;
      });

      return mappedStickers;
    } catch (error) {
      console.error('🎭 [KlipyStickerGrid] Klipy GIF error:', error);
      return [];
    }
  };

  const loadKlipyStickers = async (query: string): Promise<StickerData[]> => {
    try {
      // Set customer ID for tracking
      klipyService.setCustomerId(currentUserId);
      
      const klipyStickers: KlipySticker[] = await klipyService.getStickers(query, 1, 50);


      const mappedStickers = klipyStickers.map((sticker, index) => {
        // Generate unique ID using sticker.id or fallback to index with timestamp
        const uniqueId = sticker.id || `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
        const stickerData = {
          id: `klipy_sticker_${uniqueId}`,
          url: sticker.file.md.gif.url || sticker.file.sm.gif.url || sticker.file.xs.gif.url,
          preview_gif: sticker.file.xs.gif.url || sticker.file.sm.gif.url,
          title: sticker.title || `Klipy Sticker ${uniqueId}`,
          width: Math.min(sticker.file.md.gif.width || sticker.file.sm.gif.width || STICKER_SIZE, STICKER_SIZE),
          height: Math.min(sticker.file.md.gif.height || sticker.file.sm.gif.height || STICKER_SIZE, STICKER_SIZE),
          type: 'gif' as const,
          tags: sticker.tags || [],
          source: 'klipy' as const,
        };
        return stickerData;
      });

      return mappedStickers;
    } catch (error) {
      console.error('🎭 [KlipyStickerGrid] Klipy Sticker error:', error);
      return [];
    }
  };

  const loadKlipyClips = async (query: string): Promise<StickerData[]> => {
    try {
      // Set customer ID for tracking
      klipyService.setCustomerId(currentUserId);
      
      const klipyClips: KlipyClip[] = await klipyService.getClips(query, 1, 50);


      const mappedStickers = klipyClips.map((clip, index) => {
        // Generate unique ID using clip.id or fallback to index with timestamp
        const uniqueId = clip.id || `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
        const stickerData = {
          id: `klipy_clip_${uniqueId}`,
          url: clip.file.gif || clip.file.webp || clip.file.mp4,
          preview_gif: clip.file.gif || clip.file.webp,
          title: clip.title || `Klipy Clip ${uniqueId}`,
          width: Math.min(clip.file_meta?.gif?.width || clip.file_meta?.webp?.width || STICKER_SIZE, STICKER_SIZE),
          height: Math.min(clip.file_meta?.gif?.height || clip.file_meta?.webp?.height || STICKER_SIZE, STICKER_SIZE),
          type: 'gif' as const,
          tags: clip.tags || [],
          source: 'klipy' as const,
        };
        return stickerData;
      });

      return mappedStickers;
    } catch (error) {
      console.error('🎭 [KlipyStickerGrid] Klipy Clip error:', error);
      return [];
    }
  };

  const renderCategoryItem = ({ item }: { item: typeof KLIPY_CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      {(() => {
        const iconConfig = CATEGORY_ICONS[item.id] || { name: 'apps' };
        const IconComponent = iconConfig.family === 'material-community' ? MaterialCommunityIcons : MaterialIcons;
        return (
          <IconComponent
            name={iconConfig.name as any}
            size={16}
            color={selectedCategory === item.id ? Colors.white : Colors.gray500}
            style={styles.categoryIcon}
          />
        );
      })()}
      <Typography
        variant="caption"
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText,
        ]}
      >
        {item.name}
      </Typography>
    </TouchableOpacity>
  );


  const renderStickerItem = ({ item }: { item: StickerData }) => {
    const isPinned = pinnedStickers.some(s => s.id === item.id);
    
    return (
      <TouchableOpacity
        style={styles.stickerItem}
        onPress={() => {
          addToRecent(item);
          onStickerSelect(item);
        }}
        onLongPress={() => togglePinned(item)}
      >
        <Image
          source={{ uri: item.preview_gif || item.url }}
          style={styles.stickerImage}
          resizeMode="cover"
        />
        {item.type === 'gif' && (
          <View style={styles.gifBadge}>
            <Typography variant="caption" style={styles.gifText}>
              GIF
            </Typography>
          </View>
        )}
        {isPinned && (
          <View style={styles.pinnedBadge}>
            <Typography variant="caption" style={styles.pinnedText}>
              📌
            </Typography>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Typography variant="body2" style={styles.loadingText}>
          Loading stickers...
        </Typography>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Typography variant="body2" style={styles.errorText}>
          {error}
        </Typography>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadStickersForCategory(selectedCategory)}
        >
          <Typography variant="body2" style={styles.retryText}>
            Retry
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={KLIPY_CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContentContainer}
        />
      </View>


      {/* Stickers Grid */}
      {stickers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography variant="body2" style={styles.emptyText}>
            {selectedCategory === 'recent' 
              ? 'No recent stickers yet'
              : selectedCategory === 'pinned'
                ? 'No pinned stickers yet. Long press any sticker to pin it!'
                : 'No stickers found for this category'
            }
          </Typography>
        </View>
      ) : (
        <FlatList
          data={stickers}
          renderItem={renderStickerItem}
          keyExtractor={(item) => item.id}
          numColumns={GRID_COLUMNS}
          contentContainerStyle={styles.gridContentContainer}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    margin: 0, // Remove any margin
    paddingTop: 0, // Remove any top padding
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  categoriesContainer: {
    paddingTop: 0, // Remove top padding to eliminate space above categories
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  categoriesContentContainer: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginHorizontal: 0,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    minWidth: 0,
  },
  selectedCategoryItem: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    marginRight: Spacing.xs,
  },
  categoryText: {
    color: Colors.gray600,
    fontWeight: '500',
    fontSize: 12,
  },
  selectedCategoryText: {
    color: Colors.white,
    fontWeight: '600',
  },
  gridContentContainer: {
    padding: Spacing.sm,
  },
  gridRow: {
    justifyContent: 'space-around',
  },
  stickerItem: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.gray50,
    position: 'relative',
  },
  stickerImage: {
    width: '100%',
    height: '100%',
  },
  gifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  gifText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    color: Colors.gray500,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '600',
  },
  loadingText: {
    color: Colors.gray500,
    marginTop: Spacing.sm,
  },
  // Pin badge
  pinnedBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: Colors.warning,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  pinnedText: {
    fontSize: 8,
  },
});

export default KlipyStickerGrid;
