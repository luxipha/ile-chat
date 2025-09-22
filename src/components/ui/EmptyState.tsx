import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Button } from './Button';
import { Colors, Spacing } from '../../theme';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: any;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  compact = false,
}) => {
  return (
    <View style={[compact ? styles.compactContainer : styles.container, style]}>
      <MaterialIcons 
        name={icon} 
        size={compact ? 48 : 64} 
        color={Colors.gray300} 
      />
      
      <Typography 
        variant={compact ? "h6" : "h5"} 
        style={[styles.title, compact && styles.compactTitle]}
      >
        {title}
      </Typography>
      
      {description && (
        <Typography 
          variant="body2" 
          color="textSecondary" 
          style={[styles.description, compact && styles.compactDescription]}
        >
          {description}
        </Typography>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <View style={[styles.actions, compact && styles.compactActions]}>
          {actionLabel && onAction && (
            <Button
              title={actionLabel}
              onPress={onAction}
              style={[styles.primaryAction, compact && styles.compactButton]}
              size={compact ? "sm" : "md"}
            />
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="outline"
              style={[styles.secondaryAction, compact && styles.compactButton]}
              size={compact ? "sm" : "md"}
            />
          )}
        </View>
      )}
    </View>
  );
};

// Predefined empty states for common scenarios
export const EmptyContacts: React.FC<{ onAddContact?: () => void; onInviteFriends?: () => void }> = ({ 
  onAddContact, 
  onInviteFriends 
}) => (
  <EmptyState
    icon="people-outline"
    title="No contacts yet"
    description="Start building your network by adding contacts or inviting friends to join ile."
    actionLabel={onAddContact ? "Add Contact" : undefined}
    onAction={onAddContact}
    secondaryActionLabel={onInviteFriends ? "Invite Friends" : undefined}
    onSecondaryAction={onInviteFriends}
  />
);

export const EmptyMoments: React.FC<{ onCreateMoment?: () => void }> = ({ onCreateMoment }) => (
  <EmptyState
    icon="photo-library"
    title="No moments shared yet"
    description="Share your investment journey, property updates, and connect with the community."
    actionLabel={onCreateMoment ? "Create First Moment" : undefined}
    onAction={onCreateMoment}
  />
);

export const EmptyChat: React.FC<{ onStartChat?: () => void }> = ({ onStartChat }) => (
  <EmptyState
    icon="chat-bubble-outline"
    title="No conversations yet"
    description="Start chatting with property agents, investors, or join community groups."
    actionLabel={onStartChat ? "Start Chatting" : undefined}
    onAction={onStartChat}
  />
);

export const EmptyWallet: React.FC<{ onDeposit?: () => void; onLearnMore?: () => void }> = ({ 
  onDeposit, 
  onLearnMore 
}) => (
  <EmptyState
    icon="account-balance-wallet"
    title="Your wallet is empty"
    description="Add funds to start investing in tokenized real estate and grow your portfolio."
    actionLabel={onDeposit ? "Add Funds" : undefined}
    onAction={onDeposit}
    secondaryActionLabel={onLearnMore ? "Learn More" : undefined}
    onSecondaryAction={onLearnMore}
  />
);

export const EmptyProperties: React.FC<{ onBrowse?: () => void; onLearnMore?: () => void }> = ({ 
  onBrowse, 
  onLearnMore 
}) => (
  <EmptyState
    icon="home-work"
    title="No properties in portfolio"
    description="Discover and invest in premium real estate properties through tokenization."
    actionLabel={onBrowse ? "Browse Properties" : undefined}
    onAction={onBrowse}
    secondaryActionLabel={onLearnMore ? "How it Works" : undefined}
    onSecondaryAction={onLearnMore}
  />
);

export const EmptyTransactions: React.FC<{ onMakeTransaction?: () => void }> = ({ onMakeTransaction }) => (
  <EmptyState
    icon="receipt-long"
    title="No transactions yet"
    description="Your transaction history will appear here once you start investing."
    actionLabel={onMakeTransaction ? "Make First Investment" : undefined}
    onAction={onMakeTransaction}
    compact={true}
  />
);

export const EmptyNotifications: React.FC<{ onManageSettings?: () => void }> = ({ onManageSettings }) => (
  <EmptyState
    icon="notifications-none"
    title="No notifications"
    description="You're all caught up! New notifications will appear here."
    secondaryActionLabel={onManageSettings ? "Notification Settings" : undefined}
    onSecondaryAction={onManageSettings}
    compact={true}
  />
);

export const EmptySearch: React.FC<{ searchQuery?: string; onClearSearch?: () => void }> = ({ 
  searchQuery, 
  onClearSearch 
}) => (
  <EmptyState
    icon="search-off"
    title="No results found"
    description={searchQuery ? `No results for "${searchQuery}"` : "Try adjusting your search criteria."}
    actionLabel={onClearSearch ? "Clear Search" : undefined}
    onAction={onClearSearch}
    compact={true}
  />
);

export const EmptyFavorites: React.FC<{ onBrowse?: () => void }> = ({ onBrowse }) => (
  <EmptyState
    icon="favorite-border"
    title="No favorites yet"
    description="Properties and items you favorite will appear here for quick access."
    actionLabel={onBrowse ? "Browse Properties" : undefined}
    onAction={onBrowse}
    compact={true}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    minHeight: 300,
  },
  compactContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    minHeight: 200,
  },
  title: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  compactTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  description: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    lineHeight: 22,
    maxWidth: 280,
  },
  compactDescription: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    lineHeight: 20,
    maxWidth: 240,
  },
  actions: {
    width: '100%',
    maxWidth: 280,
    gap: Spacing.md,
  },
  compactActions: {
    maxWidth: 240,
    gap: Spacing.sm,
  },
  primaryAction: {
    width: '100%',
  },
  secondaryAction: {
    width: '100%',
  },
  compactButton: {
    paddingHorizontal: Spacing.md,
  },
});