import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  paymentNotifications: boolean;
  propertyUpdates: boolean;
  chatMessages: boolean;
  systemNotifications: boolean;
  achievementNotifications: boolean;
  reminderNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  quietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface NotificationSettingsScreenProps {
  onBack: () => void;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  onBack,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    paymentNotifications: true,
    propertyUpdates: true,
    chatMessages: true,
    systemNotifications: true,
    achievementNotifications: true,
    reminderNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    quietHours: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  const [isSaving, setIsSaving] = useState(false);

  const updateSetting = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Settings Saved',
        'Your notification preferences have been updated successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    if (enabled) {
      Alert.alert(
        'Enable Quiet Hours?',
        'You won\'t receive notifications during your quiet hours period.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable', 
            onPress: () => updateSetting('quietHours', true)
          }
        ]
      );
    } else {
      updateSetting('quietHours', false);
    }
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    description: string,
    settingKey: keyof NotificationSettings,
    color: string = Colors.primary,
    disabled: boolean = false
  ) => (
    <View style={[styles.settingItem, disabled && styles.disabledSetting]}>
      <View style={styles.settingIcon}>
        <MaterialIcons 
          name={icon as any} 
          size={24} 
          color={disabled ? Colors.gray400 : color} 
        />
      </View>
      <View style={styles.settingContent}>
        <Typography 
          variant="h6" 
          style={[
            styles.settingTitle,
            disabled && styles.disabledText
          ]}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color="textSecondary" 
          style={[styles.settingDescription, disabled && styles.disabledText]}
        >
          {description}
        </Typography>
      </View>
      <Switch
        value={settings[settingKey] as boolean}
        onValueChange={(value) => updateSetting(settingKey, value)}
        disabled={disabled}
        trackColor={{ 
          false: Colors.gray300, 
          true: Colors.primary + '30' 
        }}
        thumbColor={
          (settings[settingKey] as boolean) && !disabled 
            ? Colors.primary 
            : Colors.gray400
        }
      />
    </View>
  );

  const renderTimeSettingItem = (
    title: string,
    time: string,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.timeSettingItem} onPress={onPress}>
      <Typography variant="h6" style={styles.timeSettingTitle}>
        {title}
      </Typography>
      <View style={styles.timeValue}>
        <Typography variant="body1" style={styles.timeText}>
          {time}
        </Typography>
        <MaterialIcons name="chevron-right" size={20} color={Colors.gray400} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>
          Notification Settings
        </Typography>
        <TouchableOpacity 
          onPress={handleSaveSettings} 
          style={styles.saveButton}
          disabled={isSaving}
        >
          <Typography 
            variant="body2" 
            color={isSaving ? "textSecondary" : "primary"}
            style={styles.saveButtonText}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Settings */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            General
          </Typography>
          <Card style={styles.settingsCard}>
            {renderSettingItem(
              'notifications',
              'Push Notifications',
              'Receive notifications on your device',
              'pushNotifications'
            )}
            {renderSettingItem(
              'email',
              'Email Notifications',
              'Receive notifications via email',
              'emailNotifications'
            )}
            {renderSettingItem(
              'sms',
              'SMS Notifications',
              'Receive important alerts via SMS',
              'smsNotifications'
            )}
          </Card>
        </View>

        {/* Activity Settings */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Activity Notifications
          </Typography>
          <Card style={styles.settingsCard}>
            {renderSettingItem(
              'payment',
              'Payment Notifications',
              'Get notified about payment transactions',
              'paymentNotifications',
              Colors.success,
              !settings.pushNotifications
            )}
            {renderSettingItem(
              'home-work',
              'Property Updates',
              'New properties and investment opportunities',
              'propertyUpdates',
              Colors.primary,
              !settings.pushNotifications
            )}
            {renderSettingItem(
              'chat',
              'Chat Messages',
              'New messages and group activity',
              'chatMessages',
              Colors.primary,
              !settings.pushNotifications
            )}
            {renderSettingItem(
              'info',
              'System Notifications',
              'App updates and important announcements',
              'systemNotifications',
              Colors.warning,
              !settings.pushNotifications
            )}
            {renderSettingItem(
              'emoji-events',
              'Achievement Notifications',
              'Celebrate your milestones and achievements',
              'achievementNotifications',
              Colors.secondary,
              !settings.pushNotifications
            )}
            {renderSettingItem(
              'schedule',
              'Reminder Notifications',
              'Portfolio reviews and investment reminders',
              'reminderNotifications',
              Colors.primary,
              !settings.pushNotifications
            )}
          </Card>
        </View>

        {/* Email Preferences */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Email Preferences
          </Typography>
          <Card style={styles.settingsCard}>
            {renderSettingItem(
              'campaign',
              'Marketing Emails',
              'Product updates and promotional content',
              'marketingEmails',
              Colors.primary,
              !settings.emailNotifications
            )}
            {renderSettingItem(
              'summarize',
              'Weekly Digest',
              'Summary of your investments and activity',
              'weeklyDigest',
              Colors.primary,
              !settings.emailNotifications
            )}
          </Card>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Quiet Hours
          </Typography>
          <Card style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <MaterialIcons 
                  name="bedtime" 
                  size={24} 
                  color={settings.quietHours ? Colors.primary : Colors.gray400} 
                />
              </View>
              <View style={styles.settingContent}>
                <Typography variant="h6" style={styles.settingTitle}>
                  Enable Quiet Hours
                </Typography>
                <Typography variant="body2" color="textSecondary" style={styles.settingDescription}>
                  Pause non-urgent notifications during these hours
                </Typography>
              </View>
              <Switch
                value={settings.quietHours}
                onValueChange={handleQuietHoursToggle}
                trackColor={{ 
                  false: Colors.gray300, 
                  true: Colors.primary + '30' 
                }}
                thumbColor={settings.quietHours ? Colors.primary : Colors.gray400}
              />
            </View>
            
            {settings.quietHours && (
              <View style={styles.timeSettings}>
                {renderTimeSettingItem(
                  'Start Time',
                  settings.quietHoursStart,
                  () => Alert.alert('Time Picker', 'Time picker would open here')
                )}
                {renderTimeSettingItem(
                  'End Time',
                  settings.quietHoursEnd,
                  () => Alert.alert('Time Picker', 'Time picker would open here')
                )}
              </View>
            )}
          </Card>
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Advanced
          </Typography>
          <Card style={styles.settingsCard}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <MaterialIcons name="history" size={24} color={Colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Typography variant="h6" style={styles.actionTitle}>
                  Notification History
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  View all notifications from the past 30 days
                </Typography>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => Alert.alert(
                'Clear All Notifications',
                'This will permanently delete all notifications. This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear All', style: 'destructive' }
                ]
              )}
            >
              <View style={styles.actionIcon}>
                <MaterialIcons name="clear-all" size={24} color={Colors.error} />
              </View>
              <View style={styles.actionContent}>
                <Typography variant="h6" style={[styles.actionTitle, { color: Colors.error }]}>
                  Clear All Notifications
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Remove all notifications from your device
                </Typography>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Typography variant="caption" color="textSecondary" style={styles.footerText}>
            Changes will take effect immediately. Some system notifications cannot be disabled for security reasons.
          </Typography>
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
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
  },
  saveButtonText: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  settingsCard: {
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  disabledSetting: {
    opacity: 0.5,
  },
  settingIcon: {
    marginRight: Spacing.md,
    width: 32,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    lineHeight: 18,
  },
  disabledText: {
    color: Colors.gray400,
  },
  timeSettings: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  timeSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timeSettingTitle: {
    fontWeight: '500',
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeText: {
    fontWeight: '500',
    color: Colors.primary,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionIcon: {
    marginRight: Spacing.md,
    width: 32,
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  footer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  footerText: {
    textAlign: 'center',
    lineHeight: 18,
  },
});