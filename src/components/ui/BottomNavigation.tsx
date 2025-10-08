import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';

export type TabType = 'chat' | 'contact' | 'wallet' | 'moment' | 'me';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const tabs = [
    {
      id: 'chat' as TabType,
      label: 'Chat',
      icon: 'chat',
    },
    {
      id: 'contact' as TabType,
      label: 'Contact',
      icon: 'contacts',
    },
    {
      id: 'wallet' as TabType,
      label: 'Wallet',
      icon: 'account-balance-wallet',
    },
    {
      id: 'moment' as TabType,
      label: 'Moment',
      icon: 'photo-camera',
    },
    {
      id: 'me' as TabType,
      label: 'Me',
      icon: 'person',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={24}
              color={isActive ? Colors.primary : Colors.gray500}
            />
            <Typography
              variant="caption"
              style={[
                styles.tabLabel,
                { color: isActive ? Colors.primary : Colors.gray500 }
              ]}
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
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.background, // Matching app background (#F8F9FA)
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  tabLabel: {
    marginTop: Spacing.xs,
    fontSize: 12,
    fontWeight: '500',
  },
});