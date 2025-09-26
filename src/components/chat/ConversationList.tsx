import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { ChatActionMenu } from './ChatActionMenu';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Typography } from '../ui/Typography';
import { EmptyState, EmptyChat, EmptySearch } from '../ui/EmptyState';

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
  isGroup?: boolean;
  isPinned?: boolean;
  bricksCount?: number;
  trustBadge?: 'verified' | 'premium' | 'agent' | null;
}

interface ConversationListProps {
  conversations: Conversation[];
  onConversationPress: (conversation: Conversation) => void;
  onPin?: (conversationId: string) => void;
  onHide?: (conversationId: string) => void;
  onDelete?: (conversationId: string) => void;
  onCreateGroup?: () => void;
  onAddContact?: () => void;
  userBricksCount?: number;
}

// Helper functions moved outside the main component to prevent re-creation on each render.
const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);
  
  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return minutes < 1 ? 'now' : `${minutes}m`;
  } else if (hours < 24) {
    return `${Math.floor(hours)}h`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }
};

const getTrustBadgeIcon = (badge: string | null) => {
  switch (badge) {
    case 'verified': return 'verified';
    case 'premium': return 'diamond';
    case 'agent': return 'business';
    default: return null;
  }
};

const getTrustBadgeColor = (badge: string | null) => {
  switch (badge) {
    case 'verified': return ChatTheme.success;
    case 'premium': return ChatTheme.accent;
    case 'agent': return ChatTheme.sendBubbleBackground;
    default: return ChatTheme.textSecondary;
  }
};

interface ConversationRowProps {
  item: Conversation;
  onPress: (item: Conversation) => void;
  onPin: (id: string) => void;
  onHide: (id: string) => void;
  onDelete: (id: string) => void;
  isSwiped: boolean;
  onSwipe: (id: string | null) => void;
}

const ConversationRow: React.FC<ConversationRowProps> = ({
  item,
  onPress,
  onPin,
  onHide,
  onDelete,
  isSwiped,
  onSwipe,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get('window');
  const swipeThreshold = width * 0.25;
  const swipeActionsWidth = 240; // 3 actions * 80px

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isSwiped ? -swipeActionsWidth : 0,
      useNativeDriver: true,
    }).start();
  }, [isSwiped, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate for horizontal swipes
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Restrict swipe to left direction
        const newX = Math.min(0, gestureState.dx);
        if (newX > -swipeActionsWidth - 20) { // Add a small buffer
          translateX.setValue(newX);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -swipeThreshold) {
          onSwipe(item.id);
        } else {
          onSwipe(null);
        }
      },
    })
  ).current;

  const handlePress = () => {
    if (isSwiped) {
      onSwipe(null); // Close swipe actions if the row is pressed while swiped
    } else {
      onPress(item);
    }
  };

  const renderSwipeActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity style={[styles.swipeAction, styles.pinAction]} onPress={() => onPin(item.id)}>
        <MaterialIcons name={item.isPinned ? "push-pin" : "push-pin"} size={20} color="white" />
        <Text style={styles.swipeActionText}>{item.isPinned ? 'Unpin' : 'Pin'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.swipeAction, styles.hideAction]} onPress={() => onHide(item.id)}>
        <MaterialIcons name="visibility-off" size={20} color="white" />
        <Text style={styles.swipeActionText}>Hide</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.swipeAction, styles.deleteAction]} onPress={() => onDelete(item.id)}>
        <MaterialIcons name="delete" size={20} color="white" />
        <Text style={styles.swipeActionText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.conversationWrapper}>
      {renderSwipeActions()}
      <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX }] }}>
        <TouchableOpacity
          style={[styles.conversationItem, item.isPinned && styles.pinnedConversation]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          {item.isPinned && <View style={styles.pinIndicator}><MaterialIcons name="push-pin" size={12} color={ChatTheme.accent} /></View>}
          <Avatar name={item.name} imageUrl={item.avatar} online={item.isOnline} size="medium" />
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <View style={styles.nameContainer}>
                <Typography variant="h6" style={[styles.name, item.unreadCount > 0 && styles.unreadName]} numberOfLines={1}>{item.name}</Typography>
                {item.trustBadge && <MaterialIcons name={getTrustBadgeIcon(item.trustBadge) as any} size={16} color={getTrustBadgeColor(item.trustBadge)} style={styles.trustBadge} />}
              </View>
              <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
            </View>
            <View style={styles.messageRow}>
              <Typography variant="body2" color="textSecondary" style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>{item.lastMessage}</Typography>
              {item.unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text></View>}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onConversationPress,
  onPin = () => {},
  onHide = () => {},
  onDelete = () => {},
  onCreateGroup = () => {},
  onAddContact = () => {},
  userBricksCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuAnchorPosition, setMenuAnchorPosition] = useState({ x: 0, y: 0 });

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations.filter(conv =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Sort: pinned first, then by timestamp
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [conversations, searchQuery]);

  const renderConversation = ({ item }: { item: Conversation }) => {
    return (
      <ConversationRow
        item={item}
        onPress={onConversationPress}
        onPin={(id) => { onPin(id); setSwipedItemId(null); }}
        onHide={(id) => { onHide(id); setSwipedItemId(null); }}
        onDelete={(id) => { onDelete(id); setSwipedItemId(null); }}
        isSwiped={swipedItemId === item.id}
        onSwipe={setSwipedItemId}
      />
    );
  };

  const handleActionMenuPress = (event: any) => {
    // Get the position of the button to position the menu
    const { pageY } = event.nativeEvent;
    setMenuAnchorPosition({ x: 0, y: pageY });
    setShowActionMenu(true);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Typography variant="h2" style={styles.headerTitle}>Messages</Typography>
        <View style={styles.headerActions}>
          {userBricksCount > 0 && (
            <View style={styles.headerBricksContainer}>
              <MaterialIcons name="grain" size={16} color={ChatTheme.accent} />
              <Text style={styles.headerBricksText}>{userBricksCount}</Text>
            </View>
          )}
          <TouchableOpacity 
            onPress={handleActionMenuPress} 
            style={styles.createGroupButton}
          >
            <MaterialIcons name="add" size={24} color={ChatTheme.sendBubbleBackground} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={ChatTheme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={ChatTheme.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={20} color={ChatTheme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        stickyHeaderIndices={[]}
        onScrollBeginDrag={() => setSwipedItemId(null)}
        ListEmptyComponent={() => (
          searchQuery ? (
            <EmptySearch
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
            />
          ) : (
            <EmptyChat
              onStartChat={() => setShowActionMenu(true)}
            />
          )
        )}
      />
      
      {/* Chat Action Menu */}
      <ChatActionMenu
        visible={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        onAddContact={() => {
          setShowActionMenu(false);
          onAddContact();
        }}
        onCreateGroup={() => {
          setShowActionMenu(false);
          onCreateGroup();
        }}
        anchorPosition={menuAnchorPosition}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatTheme.background1,
  },
  header: {
    backgroundColor: ChatTheme.background1,
    paddingHorizontal: ChatSpacing.lg,
    paddingTop: ChatSpacing.lg,
    paddingBottom: ChatSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ChatSpacing.md,
  },
  headerTitle: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ChatSpacing.sm,
  },
  createGroupButton: {
    padding: ChatSpacing.sm,
    borderRadius: 20,
    backgroundColor: ChatTheme.background3,
  },
  headerBricksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChatTheme.background3,
    paddingHorizontal: ChatSpacing.sm,
    paddingVertical: ChatSpacing.xs,
    borderRadius: 16,
  },
  headerBricksText: {
    fontSize: 14,
    color: ChatTheme.accent,
    fontWeight: '600',
    marginLeft: ChatSpacing.xs / 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChatTheme.background3,
    borderRadius: 20,
    paddingHorizontal: ChatSpacing.md,
    paddingVertical: ChatSpacing.sm,
  },
  searchIcon: {
    marginRight: ChatSpacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: ChatTheme.textPrimary,
    paddingVertical: 0,
  },
  conversationWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  conversationAnimated: {
    flexDirection: 'row',
    paddingHorizontal: ChatSpacing.lg,
    paddingVertical: ChatSpacing.md,
    backgroundColor: ChatTheme.background1,
    position: 'relative',
  },
  pinnedConversation: {
    backgroundColor: ChatTheme.background2,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: ChatSpacing.lg,
    paddingVertical: ChatSpacing.md,
    backgroundColor: ChatTheme.background1,
    alignItems: 'center',
  },
  pinIndicator: {
    position: 'absolute',
    top: ChatSpacing.sm,
    right: ChatSpacing.sm,
    zIndex: 1,
  },
  swipeActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 0,
  },
  swipeAction: {
    width: 80,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ChatSpacing.sm,
  },
  pinAction: {
    backgroundColor: ChatTheme.accent,
  },
  hideAction: {
    backgroundColor: ChatTheme.textSecondary,
  },
  deleteAction: {
    backgroundColor: ChatTheme.error,
  },
  swipeActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginTop: ChatSpacing.xs / 2,
  },
  contentContainer: {
    flex: 1,
    marginLeft: ChatSpacing.md,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ChatSpacing.xs / 2,
  },
  name: {
    fontWeight: '600',
    marginRight: ChatSpacing.xs,
  },
  unreadName: {
    fontWeight: '700',
    color: ChatTheme.textPrimary,
  },
  trustBadge: {
    marginLeft: ChatSpacing.xs / 2,
  },
  timestamp: {
    fontSize: 12,
    color: ChatTheme.textSecondary,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: ChatSpacing.sm,
  },
  bricksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChatTheme.background3,
    paddingHorizontal: ChatSpacing.xs,
    paddingVertical: ChatSpacing.xs / 2,
    borderRadius: 8,
  },
  bricksText: {
    fontSize: 10,
    color: ChatTheme.accent,
    fontWeight: '600',
    marginLeft: ChatSpacing.xs / 2,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    marginRight: ChatSpacing.sm,
  },
  unreadMessage: {
    fontWeight: '500',
    color: ChatTheme.textPrimary,
  },
  badge: {
    backgroundColor: ChatTheme.unread,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ChatSpacing.xs / 2,
  },
  badgeText: {
    color: ChatTheme.background1,
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: ChatTheme.border,
    marginLeft: ChatSpacing.lg + 40 + ChatSpacing.md, // 40 is medium avatar size
  },
});