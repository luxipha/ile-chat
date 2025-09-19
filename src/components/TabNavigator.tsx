import React, { useState } from 'react';
import { Layout, Text, Button } from '@ui-kitten/components';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MainScreen } from '../screens/MainScreen';
import { WalletScreen } from '../screens/WalletScreen';

type TabName = 'home' | 'wallet' | 'properties' | 'profile';

interface TabItem {
  name: TabName;
  label: string;
  icon: string;
  component: React.ComponentType;
}

const tabs: TabItem[] = [
  { name: 'home', label: 'Home', icon: 'home', component: MainScreen },
  { name: 'wallet', label: 'Wallet', icon: 'account-balance-wallet', component: WalletScreen },
  { name: 'properties', label: 'Properties', icon: 'business', component: PlaceholderScreen },
  { name: 'profile', label: 'Profile', icon: 'person', component: PlaceholderScreen },
];

function PlaceholderScreen() {
  return (
    <Layout style={styles.placeholder}>
      <Text category='h6'>Coming Soon</Text>
      <Text category='s1' appearance='hint'>This feature is under development</Text>
    </Layout>
  );
}

export const TabNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('home');

  const ActiveComponent = tabs.find(tab => tab.name === activeTab)?.component || MainScreen;

  return (
    <Layout style={styles.container}>
      {/* Content Area */}
      <Layout style={styles.content}>
        <ActiveComponent />
      </Layout>

      {/* Tab Bar */}
      <Layout style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.name)}
          >
            <MaterialIcons 
              name={tab.icon as any} 
              size={24} 
              color={activeTab === tab.name ? '#3366FF' : '#8F9BB3'} 
            />
            <Text 
              style={[
                styles.tabLabel,
                { color: activeTab === tab.name ? '#3366FF' : '#8F9BB3' }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Layout>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E4E9F2',
    paddingVertical: 8,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
});