import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface SettingsScreenProps {
  onBack: () => void;
  onChangePassword: () => void;
  onInviteToEarn: () => void;
  onSetPin: () => void;
  onWalletSettings: () => void;
  onPrivacySettings: () => void;
  onSendFeedback: () => void;
  onAbout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onChangePassword,
  onInviteToEarn,
  onSetPin,
  onWalletSettings,
  onPrivacySettings,
  onSendFeedback,
  onAbout,
}) => {
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          // Handle logout logic
          console.log('User logged out');
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // Handle account deletion
          console.log('Account deletion requested');
        }},
      ]
    );
  };

  const renderMenuItem = (
    icon: string,
    title: string,
    onPress: () => void,
    subtitle?: string,
    showChevron: boolean = true,
    danger?: boolean
  ) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <MaterialIcons 
        name={icon as any} 
        size={24} 
        color={danger ? Colors.error : Colors.primary} 
      />
      <View style={styles.menuContent}>
        <Typography 
          variant="h6" 
          style={[styles.menuTitle, danger && styles.dangerText]}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </View>
      {showChevron && (
        <MaterialIcons 
          name="chevron-right" 
          size={24} 
          color={Colors.gray400} 
        />
      )}
    </TouchableOpacity>
  );

  const renderToggleItem = (
    icon: string,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.menuItem}>
      <MaterialIcons name={icon as any} size={24} color={Colors.primary} />
      <View style={styles.menuContent}>
        <Typography variant="h6" style={styles.menuTitle}>
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.gray300, true: Colors.primary }}
        thumbColor={value ? Colors.background : Colors.gray500}
      />
    </View>
  );

  const renderAccountSection = () => (
    <View style={styles.section}>
      <Typography variant="h5" style={styles.sectionTitle}>Account</Typography>
      
      {renderMenuItem(
        'lock',
        'Change Password',
        onChangePassword,
        'Update your account password'
      )}

      {renderMenuItem(
        'pin',
        'Set Transaction PIN',
        onSetPin,
        'Set PIN for secure transactions'
      )}
      
      {renderMenuItem(
        'share',
        'Invite to Earn Bricks',
        onInviteToEarn,
        'Refer friends and earn rewards'
      )}
      
      {renderMenuItem(
        'account-balance-wallet',
        'Wallet Settings',
        onWalletSettings,
        'Manage your crypto wallets'
      )}
    </View>
  );

  const renderSecuritySection = () => (
    <View style={styles.section}>
      <Typography variant="h5" style={styles.sectionTitle}>Security & Privacy</Typography>
      
      {renderToggleItem(
        'fingerprint',
        'Biometric Authentication',
        'Use fingerprint or face recognition',
        biometric,
        setBiometric
      )}
      
      {renderToggleItem(
        'security',
        'Two-Factor Authentication',
        'Add an extra layer of security',
        twoFactor,
        setTwoFactor
      )}
      
      {renderMenuItem(
        'privacy-tip',
        'Privacy Settings',
        onPrivacySettings,
        'Control your data and privacy'
      )}
    </View>
  );

  const renderPreferencesSection = () => (
    <View style={styles.section}>
      <Typography variant="h5" style={styles.sectionTitle}>Preferences</Typography>
      
      {renderToggleItem(
        'notifications',
        'Push Notifications',
        'Receive important updates',
        notifications,
        setNotifications
      )}
      
      {renderToggleItem(
        'dark-mode',
        'Dark Mode',
        'Switch to dark theme',
        darkMode,
        setDarkMode
      )}
      
      {renderMenuItem(
        'language',
        'Language',
        () => console.log('Language settings'),
        'English'
      )}
      
      {renderMenuItem(
        'location-on',
        'Region',
        () => console.log('Region settings'),
        'Nigeria'
      )}
    </View>
  );

  const renderSupportSection = () => (
    <View style={styles.section}>
      <Typography variant="h5" style={styles.sectionTitle}>Support</Typography>
      
      {renderMenuItem(
        'help',
        'Help Center',
        () => console.log('Help center'),
        'Get help and support'
      )}
      
      {renderMenuItem(
        'feedback',
        'Send Feedback',
        onSendFeedback,
        'Help us improve ilePay'
      )}
      
      {renderMenuItem(
        'info',
        'About',
        onAbout,
        'App version and info'
      )}
    </View>
  );

  const renderDangerSection = () => (
    <View style={styles.section}>
      <Typography variant="h5" style={styles.sectionTitle}>Account Actions</Typography>
      
      {renderMenuItem(
        'logout',
        'Logout',
        handleLogout,
        'Sign out of your account',
        false,
        true
      )}
      
      {renderMenuItem(
        'delete-forever',
        'Delete Account',
        handleDeleteAccount,
        'Permanently delete your account',
        false,
        true
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">Settings</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderAccountSection()}
        {renderSecuritySection()}
        {renderPreferencesSection()}
        {renderSupportSection()}
        {renderDangerSection()}
      </ScrollView>
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
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  menuContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  menuTitle: {
    fontWeight: '500',
  },
  dangerText: {
    color: Colors.error,
  },
});