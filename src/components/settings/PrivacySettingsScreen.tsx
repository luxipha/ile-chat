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
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface PrivacySettingsScreenProps {
  onBack: () => void;
}

export const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({
  onBack,
}) => {
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showPropertyPortfolio, setShowPropertyPortfolio] = useState(true);
  const [allowContactByPhone, setAllowContactByPhone] = useState(false);
  const [allowContactByEmail, setAllowContactByEmail] = useState(true);
  const [shareDataForAnalytics, setShareDataForAnalytics] = useState(true);
  const [shareDataForMarketing, setShareDataForMarketing] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleClearData = (dataType: string) => {
    Alert.alert(
      `Clear ${dataType}`,
      `Are you sure you want to clear all ${dataType.toLowerCase()}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', `${dataType} cleared successfully.`);
          }
        }
      ]
    );
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download Data',
      'Your data export will be prepared and sent to your email address within 24 hours.',
      [{ text: 'OK' }]
    );
  };

  const renderToggleItem = (
    icon: string,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <MaterialIcons name={icon as any} size={24} color={Colors.primary} />
      <View style={styles.settingContent}>
        <Typography variant="h6" style={styles.settingTitle}>
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

  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
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
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      </View>
      <MaterialIcons 
        name="chevron-right" 
        size={24} 
        color={Colors.gray400} 
      />
    </TouchableOpacity>
  );

  const renderProfileVisibilitySection = () => (
    <View style={styles.section}>
      <Typography variant="h5" style={styles.sectionTitle}>
        Profile Visibility
      </Typography>
      
      <Card style={styles.visibilityCard}>
        <Typography variant="body2" color="textSecondary" style={styles.visibilityDescription}>
          Choose who can see your profile and information
        </Typography>
        
        <View style={styles.visibilityOptions}>
          {(['public', 'friends', 'private'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.visibilityOption,
                profileVisibility === option && styles.selectedVisibilityOption
              ]}
              onPress={() => setProfileVisibility(option)}
            >
              <View style={styles.visibilityOptionHeader}>
                <MaterialIcons
                  name={
                    option === 'public' ? 'public' :
                    option === 'friends' ? 'group' : 'lock'
                  }
                  size={20}
                  color={profileVisibility === option ? Colors.primary : Colors.gray400}
                />
                <Typography
                  variant="h6"
                  style={[
                    styles.visibilityOptionTitle,
                    profileVisibility === option && styles.selectedVisibilityOptionTitle
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Typography>
                {profileVisibility === option && (
                  <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                )}
              </View>
              <Typography variant="caption" color="textSecondary">
                {option === 'public' ? 'Anyone can see your profile' :
                 option === 'friends' ? 'Only your connections can see your profile' :
                 'Only you can see your profile'}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">Privacy Settings</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProfileVisibilitySection()}

        {/* Activity & Status */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Activity & Status
          </Typography>
          
          {renderToggleItem(
            'visibility',
            'Show Online Status',
            'Let others see when you\'re online',
            showOnlineStatus,
            setShowOnlineStatus
          )}
          
          {renderToggleItem(
            'history',
            'Show Transaction History',
            'Display transaction history on profile',
            showTransactionHistory,
            setShowTransactionHistory
          )}
          
          {renderToggleItem(
            'home',
            'Show Property Portfolio',
            'Display property investments on profile',
            showPropertyPortfolio,
            setShowPropertyPortfolio
          )}
        </View>

        {/* Contact Preferences */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Contact Preferences
          </Typography>
          
          {renderToggleItem(
            'phone',
            'Allow Contact by Phone',
            'Let others contact you via phone number',
            allowContactByPhone,
            setAllowContactByPhone
          )}
          
          {renderToggleItem(
            'email',
            'Allow Contact by Email',
            'Let others contact you via email',
            allowContactByEmail,
            setAllowContactByEmail
          )}
        </View>

        {/* Data & Analytics */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Data & Analytics
          </Typography>
          
          {renderToggleItem(
            'analytics',
            'Share Data for Analytics',
            'Help improve app performance and features',
            shareDataForAnalytics,
            setShareDataForAnalytics
          )}
          
          {renderToggleItem(
            'campaign',
            'Share Data for Marketing',
            'Receive personalized offers and promotions',
            shareDataForMarketing,
            setShareDataForMarketing
          )}
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Security Settings
          </Typography>
          
          {renderToggleItem(
            'security',
            'Two-Factor Authentication',
            'Add extra security to your account',
            twoFactorEnabled,
            setTwoFactorEnabled
          )}
          
          {renderToggleItem(
            'fingerprint',
            'Biometric Authentication',
            'Use fingerprint or face recognition',
            biometricEnabled,
            setBiometricEnabled
          )}
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Data Management
          </Typography>
          
          <Card style={styles.dataCard}>
            {renderMenuItem(
              'download',
              'Download My Data',
              'Export all your personal data',
              handleDownloadData
            )}
            
            {renderMenuItem(
              'delete-sweep',
              'Clear Search History',
              'Remove all search history data',
              () => handleClearData('Search History')
            )}
            
            {renderMenuItem(
              'clear-all',
              'Clear Chat History',
              'Remove all chat conversation data',
              () => handleClearData('Chat History')
            )}
            
            {renderMenuItem(
              'delete-forever',
              'Clear All Activity Data',
              'Permanently remove all activity logs',
              () => handleClearData('Activity Data'),
              true
            )}
          </Card>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Legal
          </Typography>
          
          <Card style={styles.legalCard}>
            {renderMenuItem(
              'policy',
              'Privacy Policy',
              'View our privacy policy',
              () => console.log('Privacy Policy')
            )}
            
            {renderMenuItem(
              'gavel',
              'Terms of Service',
              'View terms and conditions',
              () => console.log('Terms of Service')
            )}
            
            {renderMenuItem(
              'cookie',
              'Cookie Settings',
              'Manage cookie preferences',
              () => console.log('Cookie Settings')
            )}
          </Card>
        </View>
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
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  settingContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  settingTitle: {
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
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
  visibilityCard: {
    padding: Spacing.lg,
  },
  visibilityDescription: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  visibilityOptions: {
    gap: Spacing.md,
  },
  visibilityOption: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  selectedVisibilityOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  visibilityOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  visibilityOptionTitle: {
    marginLeft: Spacing.md,
    flex: 1,
    fontWeight: '500',
  },
  selectedVisibilityOptionTitle: {
    color: Colors.primary,
  },
  dataCard: {
    padding: 0,
  },
  legalCard: {
    padding: 0,
  },
});