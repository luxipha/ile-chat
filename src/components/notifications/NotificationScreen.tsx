import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Avatar } from '../ui/Avatar';
import { EmptyNotifications } from '../ui/EmptyState';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Colors, Spacing, BorderRadius } from '../../theme';

export interface Notification {
  id: string;
  type: 'payment' | 'property' | 'chat' | 'system' | 'achievement' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
  avatar?: string;
  icon?: string;
  color?: string;
}

interface NotificationScreenProps {
  onBack: () => void;
  onNotificationPress: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onManageSettings: () => void;
}

export const NotificationScreen: React.FC<NotificationScreenProps> = ({
  onBack,
  onNotificationPress,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onManageSettings,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock notifications data
  const allNotifications: Notification[] = [
    {
      id: '1',
      type: 'payment',
      title: 'Payment Received',
      message: 'You received $500 from Sarah Anderson for property investment',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: false,
      priority: 'high',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      color: Colors.success,
    },
    {
      id: '2',
      type: 'property',
      title: 'Property Update',
      message: 'Lagos Luxury Apartments Phase 2 is now available for investment',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isRead: false,
      priority: 'medium',
      icon: 'home-work',
      color: Colors.primary,
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: 'You\'ve earned 1000 Bricks for completing your first investment',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      isRead: true,
      priority: 'medium',
      icon: 'emoji-events',
      color: Colors.secondary,
    },
    {
      id: '4',
      type: 'chat',
      title: 'New Message',
      message: 'Michael Roberts: \"Great investment opportunity in Victoria Island\"',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      isRead: true,
      priority: 'medium',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      color: Colors.primary,
    },
    {
      id: '5',
      type: 'system',
      title: 'App Update Available',
      message: 'Version 2.1.0 is now available with new features and improvements',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isRead: true,
      priority: 'low',
      icon: 'system-update',
      color: Colors.warning,
    },
    {
      id: '6',
      type: 'reminder',
      title: 'Investment Reminder',
      message: 'Don\'t forget to review your monthly investment portfolio',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      isRead: true,
      priority: 'low',
      icon: 'schedule',
      color: Colors.primary,
    },
  ];

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return allNotifications.filter(n => !n.isRead);
    }
    return allNotifications;
  }, [filter]);

  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${Math.floor(hours)}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.avatar) {
      return (
        <Avatar
          name={notification.title}
          imageUrl={notification.avatar}
          size="medium"
          shape="rounded"
        />
      );
    }

    const iconName = notification.icon || getDefaultIcon(notification.type);
    const iconColor = notification.color || Colors.gray400;

    return (
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
        <MaterialIcons name={iconName as any} size={24} color={iconColor} />
      </View>
    );
  };

  const getDefaultIcon = (type: string) => {
    switch (type) {
      case 'payment': return 'payment';
      case 'property': return 'home-work';
      case 'chat': return 'chat';
      case 'system': return 'info';
      case 'achievement': return 'emoji-events';
      case 'reminder': return 'schedule';
      default: return 'notifications';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return Colors.error;
      case 'medium': return Colors.warning;
      case 'low': return Colors.gray400;
      default: return Colors.gray400;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => {
        if (!item.isRead) {
          onMarkAsRead(item.id);
        }
        onNotificationPress(item);
      }}
    >
      <View style={styles.notificationContent}>
        {getNotificationIcon(item)}
        
        <View style={styles.textContent}>
          <View style={styles.headerRow}>
            <Typography 
              variant="h6" 
              style={[
                styles.notificationTitle,
                !item.isRead && styles.unreadTitle
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Typography>
            <View style={styles.metaInfo}>
              <Typography variant="caption" color="textSecondary">
                {formatTimestamp(item.timestamp)}
              </Typography>
              {item.priority === 'high' && (
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
              )}
            </View>
          </View>
          
          <Typography 
            variant="body2" 
            color="textSecondary" 
            style={[
              styles.notificationMessage,
              !item.isRead && styles.unreadMessage
            ]}
            numberOfLines={2}
          >
            {item.message}
          </Typography>
        </View>
      </View>
      
      {!item.isRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.gray900} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Typography variant="h3" style={styles.headerTitle}>
          Notifications
        </Typography>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Typography variant="caption" style={styles.unreadBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Typography>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={onManageSettings} style={styles.settingsButton}>
        <MaterialIcons name="settings" size={24} color={Colors.gray900} />
      </TouchableOpacity>
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && styles.activeFilterTab
          ]}
          onPress={() => setFilter('all')}
        >
          <Typography 
            variant="body2" 
            style={[
              styles.filterTabText,
              filter === 'all' && styles.activeFilterTabText
            ]}
          >
            All ({allNotifications.length})
          </Typography>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'unread' && styles.activeFilterTab
          ]}
          onPress={() => setFilter('unread')}
        >
          <Typography 
            variant="body2" 
            style={[
              styles.filterTabText,
              filter === 'unread' && styles.activeFilterTabText
            ]}
          >
            Unread ({unreadCount})
          </Typography>
        </TouchableOpacity>
      </View>
      
      {unreadCount > 0 && (
        <TouchableOpacity onPress={onMarkAllAsRead} style={styles.markAllButton}>
          <Typography variant="caption" color="primary">
            Mark all read
          </Typography>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" message="Loading notifications..." />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilterTabs()}
      
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <EmptyNotifications onManageSettings={onManageSettings} />
        )}
        contentContainerStyle={[
          styles.listContent,
          filteredNotifications.length === 0 && styles.emptyContent
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.xs / 2,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  settingsButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  activeFilterTab: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontWeight: '500',
    color: Colors.gray600,
  },
  activeFilterTabText: {
    color: Colors.gray900,
    fontWeight: '600',
  },
  markAllButton: {
    padding: Spacing.sm,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationItem: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: Colors.primary + '03',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  notificationTitle: {
    flex: 1,
    fontWeight: '500',
    marginRight: Spacing.sm,
  },
  unreadTitle: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  notificationMessage: {
    lineHeight: 20,
  },
  unreadMessage: {
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  unreadIndicator: {
    position: 'absolute',
    right: Spacing.lg,
    top: '50%',
    transform: [{ translateY: -4 }],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});