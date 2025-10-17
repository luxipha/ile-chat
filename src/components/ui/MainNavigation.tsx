import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Colors, Spacing } from '../../theme';

export type TabName = 'chat' | 'contact' | 'wallet' | 'moments' | 'me';

interface MainNavigationProps {
  activeTab: TabName;
  onTabSwitch: (tab: TabName) => void;
  isVisible?: boolean;
}

export const MainNavigation: React.FC<MainNavigationProps> = ({
  activeTab,
  onTabSwitch,
  isVisible = true,
}) => {
  const tabs = [
    {
      id: 'chat' as TabName,
      label: 'Chat',
      icon: 'chat',
    },
    {
      id: 'contact' as TabName,
      label: 'Contact',
      icon: 'contacts',
    },
    {
      id: 'wallet' as TabName,
      label: 'Wallet',
      icon: 'account-balance-wallet',
    },
    {
      id: 'moments' as TabName,
      label: 'Moments',
      icon: 'photo-library',
    },
    {
      id: 'me' as TabName,
      label: 'Me',
      icon: 'person',
    },
  ];

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => onTabSwitch(tab.id)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={24}
              color={isActive ? Colors.primary : Colors.gray600}
            />
            <Typography
              variant="caption"
              color={isActive ? 'primary' : 'textSecondary'}
            >
              {tab.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
});