import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { Avatar } from '../ui/Avatar';
import { ChatActionMenu } from './ChatActionMenu';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Colors } from '../../theme';
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
  participantIds?: string[];
}

interface ConversationListProps {
  conversations: Conversation[];
  onConversationPress: (conversation: Conversation) => void;
  onPin?: (conversationId: string) => void;
  onHide?: (conversationId: string) => void;
  onDelete?: (conversationId: string) => void;
  onCreateGroup?: () => void;
  onAddContact?: () => void;
  onAvatarPress?: (conversation: Conversation) => void;
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
  onAvatarPress?: (item: Conversation) => void;
  isSwiped: boolean;
  onSwipe: (id: string | null) => void;
}

const ConversationRow: React.FC<ConversationRowProps> = ({
  item,
  onPress,
  onPin,
  onHide,
  onDelete,
  onAvatarPress,
  isSwiped,
  onSwipe,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  
  useEffect(() => {
    if (!isSwiped && swipeableRef.current) {
      swipeableRef.current.close();
    }
  }, [isSwiped]);

  const handlePress = () => {
    if (isSwiped) {
      onSwipe(null); // Close swipe actions if the row is pressed while swiped
    } else {
      onPress(item);
    }
  };

  const renderRightActions = () => {
    return (
      <View style={styles.swipeActions}>
        {/* TODO: Implement pin feature later
        <TouchableOpacity 
          style={[styles.swipeAction, styles.pinAction]} 
          onPress={() => {
            onPin(item.id);
            swipeableRef.current?.close();
          }}
        >
          <MaterialIcons name={item.isPinned ? "push-pin" : "push-pin"} size={20} color="white" />
          <Text style={styles.swipeActionText}>{item.isPinned ? 'Unpin' : 'Pin'}</Text>
        </TouchableOpacity>
        */}
        {/* TODO: Implement hide feature later
        <TouchableOpacity 
          style={[styles.swipeAction, styles.hideAction]} 
          onPress={() => {
            onHide(item.id);
            swipeableRef.current?.close();
          }}
        >
          <MaterialIcons name="visibility-off" size={20} color="white" />
          <Text style={styles.swipeActionText}>Hide</Text>
        </TouchableOpacity>
        */}
        <TouchableOpacity 
          style={[styles.swipeAction, styles.deleteAction]} 
          onPress={() => {
            onDelete(item.id);
            swipeableRef.current?.close();
          }}
        >
          <MaterialIcons name="delete" size={20} color="white" />
          <Text style={styles.swipeActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      overshootFriction={8}
      onSwipeableOpen={() => onSwipe(item.id)}
      onSwipeableClose={() => onSwipe(null)}
    >
      <TouchableOpacity
        style={[styles.conversationItem, item.isPinned && styles.pinnedConversation]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {item.isPinned && <View style={styles.pinIndicator}><MaterialIcons name="push-pin" size={12} color={ChatTheme.accent} /></View>}
        <Avatar 
          userId={item.id}
          name={item.name} 
          online={item.isOnline} 
          size="medium" 
          
          onPress={onAvatarPress ? () => onAvatarPress(item) : undefined}
        />
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
    </Swipeable>
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
  onAvatarPress,
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
        onAvatarPress={onAvatarPress}
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
            <MaterialIcons name="add" size={24} color={Colors.primary} />
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
    <GestureHandlerRootView style={styles.container}>
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
    </GestureHandlerRootView>
  );
};

// Define the styles type to include all our custom properties
interface ConversationListStyles {
  container: ViewStyle;
  header: ViewStyle;
  headerTop: ViewStyle;
  headerTitle: ViewStyle;
  headerActions: ViewStyle;
  createGroupButton: ViewStyle;
  headerBricksContainer: ViewStyle;
  headerBricksText: TextStyle;
  searchContainer: ViewStyle;
  searchIcon: ViewStyle;
  searchInput: TextStyle;
  conversationWrapper: ViewStyle;
  conversationAnimated: ViewStyle;
  pinnedConversation: ViewStyle;
  conversationItem: ViewStyle;
  pinIndicator: ViewStyle;
  swipeActions: ViewStyle;
  swipeAction: ViewStyle;
  pinAction: ViewStyle;
  hideAction: ViewStyle;
  deleteAction: ViewStyle;
  swipeActionText: TextStyle;
  contentContainer: ViewStyle;
  headerRow: ViewStyle;
  name: TextStyle;
  unreadName: TextStyle;
  trustBadge: ViewStyle;
  timestamp: TextStyle;
  nameContainer: ViewStyle;
  bricksContainer: ViewStyle;
  bricksText: TextStyle;
  messageRow: ViewStyle;
  lastMessage: TextStyle;
  unreadMessage: TextStyle;
  badge: ViewStyle;
  badgeText: TextStyle;
  separator: ViewStyle;
}

const styles = StyleSheet.create<ConversationListStyles>({
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
    backgroundColor: ChatTheme.accent,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    marginLeft: 4, // Half of ChatSpacing.xs
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
    flexDirection: 'row',
    width: 80, // 1 action * 80px (pin and hide actions commented out)
    alignItems: 'stretch',
  },
  swipeAction: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 4, // Half of ChatSpacing.xs
  },
  contentContainer: {
    flex: 1,
    marginLeft: ChatSpacing.md,
    justifyContent: 'center',
    width: '80%', // Ensure content has a fixed width
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ChatSpacing.xs / 2,
    width: '100%', // Ensure full width
  },
  name: {
    fontWeight: '600',
    marginRight: ChatSpacing.xs,
    flexShrink: 1, // Allow text to shrink
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
    flexShrink: 0, // Prevent timestamp from shrinking
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: ChatSpacing.sm,
    flexShrink: 1, // Allow container to shrink
    overflow: 'hidden', // Hide overflow
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
    width: '100%', // Ensure full width
  },
  lastMessage: {
    flex: 1,
    marginRight: ChatSpacing.sm,
    flexShrink: 1, // Allow text to shrink
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