import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { EmptyState } from '../ui/EmptyState';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import newsService from '../../services/newsService';
import { NewsArticle } from '../../types';
import NewsArticleReader from './NewsArticleReader';

interface NewsHubScreenProps {
  onBack: () => void;
}

const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (Number.isNaN(diffMinutes)) {
    return '';
  }
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getSourceInitials = (source?: string) => {
  if (!source) return 'IL';
  const words = source.split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return source.substring(0, 2).toUpperCase();
  const initials = words
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  return initials || source.substring(0, 2).toUpperCase();
};

const NewsHubScreen: React.FC<NewsHubScreenProps> = ({ onBack }) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const todayLabel = useMemo(() => {
    const now = new Date();
    try {
      return now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return now.toDateString();
    }
  }, []);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['news'],
    queryFn: ({ pageParam = 0 }) => newsService.getArticles(20, pageParam), // 20 articles per page
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return (lastPage.offset || 0) + 20;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
  });

  const articles = useMemo<NewsArticle[]>(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.articles);
  }, [data]);

  const isRefreshing = isFetching && !isLoading;

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleOpenArticle = (article: NewsArticle) => {
    if (!article.url) {
      Alert.alert('No link available', 'This article does not have a readable link yet.');
      return;
    }
    setSelectedArticle(article);
  };

  const renderHeroImage = (article: NewsArticle) => {
    if (article.imageUrl) {
      return (
        <Image
          source={{ uri: article.imageUrl }}
          style={styles.heroImage}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={styles.heroImageFallback}>
        <Typography variant="h3" style={styles.heroFallbackText}>
          {getSourceInitials(article.source)}
        </Typography>
      </View>
    );
  };

  const renderThumbnail = (article: NewsArticle) => {
    if (article.imageUrl) {
      return (
        <Image
          source={{ uri: article.imageUrl }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={styles.thumbnailFallback}>
        <Typography variant="body2" style={styles.thumbnailFallbackText}>
          {getSourceInitials(article.source)}
        </Typography>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.gray700} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Typography variant="h3" style={styles.centerTitle}>News Hub</Typography>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => refetch()}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
          
          if (isCloseToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {isLoading ? (
          <LoadingSpinner message="Loading latest headlines..." style={styles.loading} />
        ) : isError ? (
          <ErrorMessage
            title="Unable to load news"
            message={
              error instanceof Error
                ? error.message
                : 'Please try refreshing to get the latest stories.'
            }
            actionLabel="Retry"
            onAction={() => refetch()}
            style={styles.errorMessage}
          />
        ) : articles.length === 0 ? (
          <EmptyState
            icon="library-books"
            title="No articles yet"
            description="Once sources publish new stories, they will appear here for quick reading."
            actionLabel="Refresh"
            onAction={() => refetch()}
            style={styles.emptyState}
          />
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Typography variant="h4" style={styles.sectionTitle}>
                Top Stories
              </Typography>
              <Typography variant="caption" color="textSecondary" style={styles.dateText}>
                {todayLabel}
              </Typography>
            </View>

            {articles.length > 0 && (
              <Card style={styles.heroCard}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleOpenArticle(articles[0])}
                  style={styles.heroTouchable}
                >
                  {renderHeroImage(articles[0])}
                  <View style={styles.heroContent}>
                    <Typography variant="caption" color="textSecondary">
                      {articles[0].source} • {formatRelativeTime(articles[0].publishedAt)}
                    </Typography>
                    <Typography variant="h5" style={styles.heroTitle}>
                      {articles[0].title}
                    </Typography>
                    {articles[0].summary && (
                      <Typography variant="body2" color="textSecondary" style={styles.heroSummary}>
                        {articles[0].summary}
                      </Typography>
                    )}
                  </View>
                </TouchableOpacity>
              </Card>
            )}

            <View style={styles.articleList}>
              {articles.slice(1).map((article, index) => (
                <TouchableOpacity
                  key={`${article.id}-${index}`} // Ensure unique keys by adding index
                  style={styles.articleListItem}
                  activeOpacity={0.8}
                  onPress={() => handleOpenArticle(article)}
                >
                  <View style={styles.articleListText}>
                    <Typography variant="caption" color="textSecondary">
                      {article.source}
                    </Typography>
                    <Typography variant="body1" style={styles.articleListTitle}>
                      {article.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatRelativeTime(article.publishedAt)}
                    </Typography>
                  </View>
                  {renderThumbnail(article)}
                </TouchableOpacity>
              ))}
            </View>

            {/* Loading indicator for infinite scroll */}
            {isFetchingNextPage && (
              <View style={styles.loadMoreContainer}>
                <LoadingSpinner message="Loading more articles..." />
              </View>
            )}

            {/* End of articles indicator */}
            {!hasNextPage && articles.length > 0 && (
              <View style={styles.endOfArticlesContainer}>
                <Typography variant="body2" color="textSecondary" style={styles.endOfArticlesText}>
                  You've reached the end of available articles
                </Typography>
                <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
                  <Typography variant="body2" color="primary" weight="semibold">
                    Refresh for new articles
                  </Typography>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <NewsArticleReader
        visible={!!selectedArticle}
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        fullScreen={false}
      />
    </View>
  );
};

export default NewsHubScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  loading: {
    marginTop: Spacing['4xl'],
  },
  errorMessage: {
    marginTop: Spacing.lg,
  },
  emptyState: {
    marginTop: Spacing['4xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateText: {
    marginBottom: 0,
  },
  sectionTitle: {
    marginTop: 0,
  },
  heroCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  heroTouchable: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  heroImageFallback: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallbackText: {
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 2,
  },
  heroContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  heroTitle: {
    fontWeight: '600',
  },
  heroSummary: {
    lineHeight: 20,
  },
  articleList: {
    borderTopWidth: 1,
    borderColor: Colors.gray200,
  },
  articleListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.gray100,
    gap: Spacing.lg,
  },
  articleListText: {
    flex: 1,
  },
  articleListTitle: {
    marginVertical: Spacing.xs,
    fontWeight: '600',
  },
  thumbnailImage: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
  },
  thumbnailFallback: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailFallbackText: {
    color: Colors.white,
    fontWeight: '600',
  },
  loadMoreContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endOfArticlesContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  endOfArticlesText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  refreshButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
  },
});
