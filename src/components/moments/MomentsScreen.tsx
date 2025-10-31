import React from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { ErrorMessage } from '../ui/ErrorMessage';
import { SkeletonLoader as SkeletonCard } from '../ui/SkeletonLoader';
import { MomentItem } from './MomentItem';
import { EmptyMoments } from './EmptyMoments';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

interface MomentsScreenProps {
  moments: any[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  currentUserId?: string;
  showDeleteMenu: string | null;
  onRefresh: () => void;
  onCreateMoment: () => void;
  onLike: (momentId: string) => void;
  onShare: (momentId: string) => void;
  onDeleteMenuToggle: (momentId: string) => void;
  onDelete: (momentId: string) => void;
  onClearError: () => void;
}

export const MomentsScreen: React.FC<MomentsScreenProps> = ({
  moments,
  isLoading,
  isRefreshing,
  error,
  currentUserId,
  showDeleteMenu,
  onRefresh,
  onCreateMoment,
  onLike,
  onShare,
  onDeleteMenuToggle,
  onDelete,
  onClearError,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            progressViewOffset={10}
            progressBackgroundColor={Colors.surface}
            title="Pull to refresh"
            titleColor={Colors.secondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h2">Moments</Typography>
          {!isLoading && !isRefreshing && (
            <Typography variant="caption" color="textSecondary" style={styles.refreshHint}>
              Pull down to refresh
            </Typography>
          )}
        </View>
        
        {/* Content */}
        {error ? (
          <View style={styles.errorContainer}>
            <ErrorMessage
              title="Failed to load moments"
              message={error}
              actionLabel="Retry"
              onAction={() => {
                onClearError();
                onRefresh();
              }}
              onDismiss={onClearError}
            />
            <Typography variant="caption" color="textSecondary" style={styles.pullToRefreshText}>
              Pull down to refresh instead
            </Typography>
          </View>
        ) : isLoading && !isRefreshing ? (
          <View>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : moments.length > 0 ? (
          moments.map((moment) => (
            <MomentItem
              key={moment.id || moment._id}
              moment={moment}
              currentUserId={currentUserId}
              showDeleteMenu={showDeleteMenu}
              onLike={onLike}
              onShare={onShare}
              onDeleteMenuToggle={onDeleteMenuToggle}
              onDelete={onDelete}
            />
          ))
        ) : (
          <EmptyMoments onCreateMoment={onCreateMoment} />
        )}
        
        {/* Bottom padding to ensure last moment is visible above FAB */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        onPress={onCreateMoment}
        style={styles.fabButton}
      >
        <MaterialIcons name="add" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  refreshHint: {
    marginTop: Spacing.xs,
  },
  errorContainer: {
    marginBottom: Spacing.md,
  },
  pullToRefreshText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  bottomPadding: {
    height: 80, // Keep FAB visible
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg, // Using theme shadows
    zIndex: 1000,
  },
});