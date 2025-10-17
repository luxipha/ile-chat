import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface AboutScreenProps {
  onBack: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({
  onBack,
}) => {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);

  const appVersion = '1.2.3';
  const buildNumber = '2024.1.15';
  const releaseDate = 'January 15, 2024';

  const handleLogoTap = () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    
    if (newCount >= 7 && !showEasterEgg) {
      setShowEasterEgg(true);
      Alert.alert(
        '🎉 Easter Egg Found!',
        'Congratulations! You found the secret developer menu. You\'re now a certified ilePay explorer!',
        [{ text: 'Awesome!' }]
      );
    }
  };

  const handleOpenLink = async (url: string, fallbackAlert?: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', fallbackAlert || 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const renderInfoItem = (
    icon: string,
    title: string,
    value: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={styles.infoItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <MaterialIcons name={icon as any} size={24} color={Colors.primary} />
      <View style={styles.infoContent}>
        <Typography variant="body1" style={styles.infoTitle}>
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {value}
        </Typography>
      </View>
      {onPress && (
        <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} />
      )}
    </TouchableOpacity>
  );

  const renderLinkItem = (
    icon: string,
    title: string,
    subtitle: string,
    url: string
  ) => (
    <TouchableOpacity 
      style={styles.linkItem} 
      onPress={() => handleOpenLink(url)}
    >
      <MaterialIcons name={icon as any} size={24} color={Colors.primary} />
      <View style={styles.linkContent}>
        <Typography variant="h6" style={styles.linkTitle}>
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      </View>
      <MaterialIcons name="open-in-new" size={20} color={Colors.gray400} />
    </TouchableOpacity>
  );

  const renderFeatureItem = (icon: string, title: string, description: string) => (
    <View style={styles.featureItem}>
      <MaterialIcons name={icon as any} size={20} color={Colors.primary} />
      <View style={styles.featureContent}>
        <Typography variant="body2" style={styles.featureTitle}>
          {title}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {description}
        </Typography>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">About</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo & Info */}
        <Card style={styles.appInfoCard}>
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={handleLogoTap}
            activeOpacity={0.7}
          >
            <View style={styles.appLogo}>
              <MaterialIcons name="account-balance" size={48} color={Colors.primary} />
            </View>
            <Typography variant="h4" style={styles.appName}>
              ilePay
            </Typography>
            <Typography variant="body2" color="textSecondary" style={styles.appTagline}>
              Democratizing Real Estate Investment
            </Typography>
          </TouchableOpacity>

          {showEasterEgg && (
            <View style={styles.easterEgg}>
              <Typography variant="caption" color="primary" style={styles.easterEggText}>
                🎉 Developer Mode Unlocked! 🎉
              </Typography>
            </View>
          )}
        </Card>

        {/* Version Information */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Version Information
          </Typography>
          
          <Card style={styles.versionCard}>
            {renderInfoItem('info', 'App Version', appVersion)}
            {renderInfoItem('build', 'Build Number', buildNumber)}
            {renderInfoItem('today', 'Release Date', releaseDate)}
            {renderInfoItem('system-update', 'Last Updated', 'January 15, 2024')}
          </Card>
        </View>

        {/* What's New */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            What's New in v{appVersion}
          </Typography>
          
          <Card style={styles.featuresCard}>
            {renderFeatureItem(
              'new-releases',
              'Enhanced FX Trading',
              'Improved foreign exchange marketplace with better rates'
            )}
            {renderFeatureItem(
              'security',
              'Advanced Security',
              'Added biometric authentication and 2FA support'
            )}
            {renderFeatureItem(
              'speed',
              'Performance Improvements',
              'Faster loading times and smoother animations'
            )}
            {renderFeatureItem(
              'palette',
              'UI Enhancements',
              'Refreshed design with better accessibility'
            )}
            {renderFeatureItem(
              'bug-report',
              'Bug Fixes',
              'Resolved issues with notifications and wallet sync'
            )}
          </Card>
        </View>

        {/* Company Information */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Company
          </Typography>
          
          <Card style={styles.companyCard}>
            <Typography variant="body1" style={styles.companyDescription}>
              ilePay is revolutionizing real estate investment by making it accessible to everyone through fractional ownership and blockchain technology.
            </Typography>
            
            <View style={styles.companyStats}>
              <View style={styles.statItem}>
                <Typography variant="h6" color="primary">10K+</Typography>
                <Typography variant="caption" color="textSecondary">Active Users</Typography>
              </View>
              <View style={styles.statItem}>
                <Typography variant="h6" color="primary">$50M+</Typography>
                <Typography variant="caption" color="textSecondary">Assets Managed</Typography>
              </View>
              <View style={styles.statItem}>
                <Typography variant="h6" color="primary">500+</Typography>
                <Typography variant="caption" color="textSecondary">Properties</Typography>
              </View>
            </View>
          </Card>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Links & Resources
          </Typography>
          
          <Card style={styles.linksCard}>
            {renderLinkItem(
              'language',
              'Website',
              'Visit our official website',
              'https://www.ile.africa'
            )}
            {renderLinkItem(
              'policy',
              'Privacy Policy',
              'Read our privacy policy',
              'https://ile.africa/privacy'
            )}
            {renderLinkItem(
              'gavel',
              'Terms of Service',
              'View terms and conditions',
              'https://ile.africa/terms'
            )}
            {renderLinkItem(
              'help',
              'Help Center',
              'Get help and support',
              'https://help.ilepay.com'
            )}
            {renderLinkItem(
              'code',
              'Open Source',
              'View our open source projects',
              'https://github.com/ilepay'
            )}
          </Card>
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Follow Us
          </Typography>
          
          <Card style={styles.socialCard}>
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleOpenLink('https://x.com/IlePlatform')}
              >
                <MaterialIcons name="alternate-email" size={24} color={Colors.primary} />
                <Typography variant="body2" style={styles.socialText}>Twitter</Typography>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleOpenLink('https://www.linkedin.com/company/ileplatform')}
              >
                <MaterialIcons name="work" size={24} color={Colors.primary} />
                <Typography variant="body2" style={styles.socialText}>LinkedIn</Typography>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleOpenLink('https://t.me/ileplatformchat')}
              >
                <MaterialIcons name="chat" size={24} color={Colors.primary} />
                <Typography variant="body2" style={styles.socialText}>Telegram</Typography>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Legal */}
        <View style={styles.legalSection}>
          <Typography variant="caption" color="textSecondary" style={styles.legalText}>
            © 2025 Ilé. All rights reserved.
          </Typography>
          <Typography variant="caption" color="textSecondary" style={styles.legalText}>
            Made with ❤️ in Nigeria
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
    marginBottom: Spacing.md,
  },
  appInfoCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  appTagline: {
    textAlign: 'center',
  },
  easterEgg: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
  },
  easterEggText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  versionCard: {
    padding: 0,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTitle: {
    fontWeight: '500',
  },
  featuresCard: {
    padding: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  featureContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  featureTitle: {
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  companyCard: {
    padding: Spacing.lg,
  },
  companyDescription: {
    lineHeight: 22,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  companyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  linksCard: {
    padding: 0,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  linkContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  linkTitle: {
    fontWeight: '500',
  },
  socialCard: {
    padding: Spacing.lg,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  socialButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  socialText: {
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  legalSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  legalText: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
});