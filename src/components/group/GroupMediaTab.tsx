import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { ChatTheme } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';
import chatService from '../../services/chatService';

interface GroupMediaTabProps {
  groupId: string;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  imageUrl?: string;
  videoUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnail?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const mediaItemWidth = (screenWidth - Spacing.lg * 2 - Spacing.sm * 2) / 3;

export const GroupMediaTab: React.FC<GroupMediaTabProps> = ({ groupId }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [mediaHasMore, setMediaHasMore] = useState(false);
  const [mediaLastVisible, setMediaLastVisible] = useState<any>(null);

  console.log('🔄 [GroupMediaTab] Rendering with:', {
    groupId,
    mediaItemsCount: mediaItems.length,
    mediaFilter,
    mediaLoading,
  });

  useEffect(() => {
    if (groupId) {
      loadGroupMedia(true);
    }
  }, [groupId, mediaFilter]);

  const loadGroupMedia = async (isInitial = false) => {
    if (!groupId) return;

    try {
      console.log('🔄 [GroupMediaTab] Loading group media:', {
        groupId,
        mediaFilter,
        isInitial,
        currentMediaCount: mediaItems.length
      });

      setMediaLoading(true);
      
      const result = await chatService.getGroupMedia(groupId, {
        limit: 20,
        startAfter: isInitial ? null : mediaLastVisible,
        mediaType: mediaFilter === 'all' ? undefined : mediaFilter,
      });

      console.log('✅ [GroupMediaTab] Media loaded:', {
        newItemsCount: result.media.length,
        hasMore: result.hasMore,
        totalItemsAfterLoad: isInitial ? result.media.length : mediaItems.length + result.media.length
      });

      if (isInitial) {
        setMediaItems(result.media);
      } else {
        setMediaItems(prev => [...prev, ...result.media]);
      }
      
      setMediaHasMore(result.hasMore);
      setMediaLastVisible(result.lastVisible);

    } catch (error) {
      console.error('❌ [GroupMediaTab] Failed to load media:', error);
      // Don't show error alert for media loading - just log it
    } finally {
      setMediaLoading(false);
    }
  };

  const handleMediaFilterChange = (filter: 'all' | 'image' | 'video' | 'document') => {
    console.log('🔄 [GroupMediaTab] Changing media filter:', { from: mediaFilter, to: filter });
    setMediaFilter(filter);
    setMediaItems([]);
    setMediaLastVisible(null);
    setMediaHasMore(false);
  };

  const loadMoreMedia = () => {
    if (!mediaLoading && mediaHasMore) {
      console.log('🔄 [GroupMediaTab] Loading more media...');
      loadGroupMedia(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getMediaTypeIcon = (type: string, mimeType?: string) => {
    if (type === 'image' || (mimeType && mimeType.startsWith('image/'))) {
      return 'image';
    } else if (type === 'video' || (mimeType && mimeType.startsWith('video/'))) {
      return 'play-circle-filled';
    } else {
      return 'insert-drive-file';
    }
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => {
    const isImage = item.type === 'image' || (item.mimeType && item.mimeType.startsWith('image/'));
    const isVideo = item.type === 'video' || (item.mimeType && item.mimeType.startsWith('video/'));
    const isDocument = !isImage && !isVideo;

    return (
      <TouchableOpacity style={styles.mediaItem}>
        <View style={styles.mediaPreview}>
          {isImage && item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.mediaImage} />
          ) : isVideo ? (
            <View style={styles.videoPreview}>
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.mediaImage} />
              ) : (
                <MaterialIcons name="play-circle-filled" size={32} color={ChatTheme.sendBubbleBackground} />
              )}
              <View style={styles.videoOverlay}>
                <MaterialIcons name="play-arrow" size={16} color="white" />
              </View>
            </View>
          ) : (
            <View style={styles.documentPreview}>
              <MaterialIcons 
                name={getMediaTypeIcon(item.type, item.mimeType) as any} 
                size={32} 
                color={ChatTheme.textSecondary} 
              />
              {item.fileName && (
                <Typography variant="caption" style={styles.documentName} numberOfLines={2}>
                  {item.fileName}
                </Typography>
              )}
            </View>
          )}
        </View>

        <View style={styles.mediaInfo}>
          <Typography variant="caption" color="textSecondary" numberOfLines={1}>
            {item.user.name}
          </Typography>
          {item.fileSize && (
            <Typography variant="caption" color="textSecondary">
              {formatFileSize(item.fileSize)}
            </Typography>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {[
        { id: 'all', title: 'All', icon: 'grid-view' },
        { id: 'image', title: 'Photos', icon: 'image' },
        { id: 'video', title: 'Videos', icon: 'videocam' },
        { id: 'document', title: 'Files', icon: 'folder' },
      ].map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterTab,
            mediaFilter === filter.id && styles.activeFilterTab
          ]}
          onPress={() => handleMediaFilterChange(filter.id as any)}
        >
          <MaterialIcons
            name={filter.icon as any}
            size={20}
            color={mediaFilter === filter.id ? ChatTheme.sendBubbleBackground : ChatTheme.textSecondary}
          />
          <Typography
            variant="caption"
            style={[
              styles.filterTabTitle,
              mediaFilter === filter.id && styles.activeFilterTabTitle
            ]}
          >
            {filter.title}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons 
        name={mediaFilter === 'all' ? 'photo-library' : 
              mediaFilter === 'image' ? 'image' :
              mediaFilter === 'video' ? 'videocam' : 'folder'} 
        size={64} 
        color={ChatTheme.textSecondary} 
      />
      <Typography variant="h6" style={styles.emptyTitle}>
        No {mediaFilter === 'all' ? 'media' : mediaFilter === 'document' ? 'files' : `${mediaFilter}s`} yet
      </Typography>
      <Typography variant="body2" color="textSecondary" style={styles.emptyDescription}>
        {mediaFilter === 'all' 
          ? 'Share photos, videos, and files in this group to see them here'
          : `Share ${mediaFilter === 'document' ? 'files' : `${mediaFilter}s`} in this group to see them here`
        }
      </Typography>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderFilterTabs()}
      
      {mediaLoading && mediaItems.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ChatTheme.sendBubbleBackground} />
          <Typography variant="body2" color="textSecondary" style={styles.loadingText}>
            Loading {mediaFilter === 'all' ? 'media' : `${mediaFilter}s`}...
          </Typography>
        </View>
      ) : mediaItems.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={mediaItems}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.mediaGrid}
          onEndReached={loadMoreMedia}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => 
            mediaLoading ? (
              <View style={styles.mediaLoadingFooter}>
                <ActivityIndicator size="small" color={ChatTheme.sendBubbleBackground} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatTheme.background1,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: ChatTheme.background1,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
    paddingHorizontal: Spacing.lg,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: ChatTheme.sendBubbleBackground,
  },
  filterTabTitle: {
    marginTop: Spacing.xs,
    color: ChatTheme.textSecondary,
  },
  activeFilterTabTitle: {
    color: ChatTheme.sendBubbleBackground,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    color: ChatTheme.textPrimary,
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
  mediaGrid: {
    padding: Spacing.lg,
  },
  mediaItem: {
    margin: 2,
    maxWidth: '31.33%', // Roughly 1/3 for 3 columns with margins
    aspectRatio: 1,
  },
  mediaPreview: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: ChatTheme.background3,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPreview: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ChatTheme.background3,
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  documentPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ChatTheme.background2,
    padding: Spacing.sm,
  },
  documentName: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontSize: 10,
  },
  mediaInfo: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: 2,
  },
  mediaLoadingFooter: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});