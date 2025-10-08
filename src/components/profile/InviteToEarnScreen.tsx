import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  Clipboard,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import referralService from '../../services/referralService';

interface InviteToEarnScreenProps {
  onBack: () => void;
}

export const InviteToEarnScreen: React.FC<InviteToEarnScreenProps> = ({
  onBack,
}) => {
  const [referralCode, setReferralCode] = useState('');
  const [totalEarned, setTotalEarned] = useState(0);
  const [friendsReferred, setFriendsReferred] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const result = await referralService.getUserReferralInfo();
      
      if (result.success && result.data) {
        setReferralCode(result.data.referralCode);
        setTotalEarned(result.data.bricksEarned);
        setFriendsReferred(result.data.friendsReferred);
        setPendingRewards(result.data.pendingRewards);
        setReferralLink(result.data.referralLink);
        setReferrals(result.data.referrals || []);
      } else {
        Alert.alert('Error', result.error || 'Failed to load referral information');
      }
    } catch (error) {
      console.error('Failed to load referral data:', error);
      Alert.alert('Error', 'Failed to load referral information');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReferralData();
    setRefreshing(false);
  };

  const handleShare = async () => {
    try {
      // Record the share action for analytics
      await referralService.recordReferralClick('mobile_share');
      
      const message = referralService.generateShareMessage(referralCode, referralLink);
      
      await Share.share({
        message,
        url: referralLink,
        title: 'Join ilePay and Start Investing in Real Estate',
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share referral. Please try again.');
    }
  };


  const handleCopyLink = async () => {
    if (!referralLink) {
      Alert.alert('Error', 'Referral link not available');
      return;
    }
    
    Clipboard.setString(referralLink);
    Alert.alert('Copied!', 'Referral link copied to clipboard');
    
    // Record the copy action for analytics
    await referralService.recordReferralClick('mobile_copy_link');
  };

  const renderStatsSection = () => (
    <View style={styles.section}>
      <Typography variant="h5" style={styles.sectionTitle}>Your Rewards</Typography>
      
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <MaterialIcons name="grain" size={32} color={Colors.secondary} />
            <Typography variant="h4" style={styles.statNumber}>
              {totalEarned.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Bricks Earned
            </Typography>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <MaterialIcons name="group" size={32} color={Colors.primary} />
            <Typography variant="h4" style={styles.statNumber}>
              {friendsReferred}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Friends Referred
            </Typography>
          </View>
        </Card>
      </View>

      <Card style={styles.pendingCard}>
        <View style={styles.pendingContent}>
          <View style={styles.pendingLeft}>
            <MaterialIcons name="hourglass-empty" size={24} color={Colors.warning} />
            <View style={styles.pendingText}>
              <Typography variant="h6">Pending Rewards</Typography>
              <Typography variant="body2" color="textSecondary">
                Rewards pending friend verification
              </Typography>
            </View>
          </View>
          <Typography variant="h5" style={styles.pendingAmount}>
            {pendingRewards} Bricks
          </Typography>
        </View>
      </Card>
    </View>
  );

  const renderHowItWorksSection = () => (
    <View style={styles.section}>
      <Typography variant="h5" style={styles.sectionTitle}>How It Works</Typography>
      
      <Card style={styles.howItWorksCard}>
        <View style={styles.stepContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Typography variant="h6" style={styles.stepNumberText}>1</Typography>
            </View>
            <View style={styles.stepContent}>
              <Typography variant="h6" style={styles.stepTitle}>Share Your Code</Typography>
              <Typography variant="body2" color="textSecondary">
                Send your referral code to friends via social media, messages, or email
              </Typography>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Typography variant="h6" style={styles.stepNumberText}>2</Typography>
            </View>
            <View style={styles.stepContent}>
              <Typography variant="h6" style={styles.stepTitle}>Friend Signs Up</Typography>
              <Typography variant="body2" color="textSecondary">
                Your friend downloads ilePay and creates an account using your code
              </Typography>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Typography variant="h6" style={styles.stepNumberText}>3</Typography>
            </View>
            <View style={styles.stepContent}>
              <Typography variant="h6" style={styles.stepTitle}>Earn Bricks</Typography>
              <Typography variant="body2" color="textSecondary">
                Get 100 Bricks when they verify their account + 50 more when they make their first investment
              </Typography>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderReferralSection = () => (
    <View style={styles.section}>
      <Typography variant="h5" style={styles.sectionTitle}>Share & Earn</Typography>
      
      <Card style={styles.referralCard}>
        <View style={styles.linkContainer}>
          <Typography variant="body1" color="textSecondary" style={styles.linkLabel}>
            Your Referral Link
          </Typography>
          <View style={styles.linkRow}>
            <Typography variant="body2" style={styles.linkText} numberOfLines={1}>
              {referralLink || 'Loading...'}
            </Typography>
            <TouchableOpacity onPress={handleCopyLink} style={styles.copyButton}>
              <MaterialIcons name="content-copy" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title="Share with Friends"
          icon="share"
          onPress={handleShare}
          style={styles.shareButton}
        />
      </Card>
    </View>
  );

  const renderSocialButtons = () => (
    <View style={styles.section}>
      <Typography variant="h5" style={styles.sectionTitle}>Quick Share</Typography>
      
      <View style={styles.socialGrid}>
        <TouchableOpacity style={styles.socialButton} onPress={handleShare}>
          <MaterialIcons name="message" size={24} color={Colors.primary} />
          <Typography variant="body2" style={styles.socialText}>Messages</Typography>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={handleShare}>
          <MaterialIcons name="email" size={24} color={Colors.primary} />
          <Typography variant="body2" style={styles.socialText}>Email</Typography>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={handleShare}>
          <MaterialIcons name="share" size={24} color={Colors.primary} />
          <Typography variant="body2" style={styles.socialText}>Other</Typography>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Typography variant="h3">Invite to Earn</Typography>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Typography variant="body1" style={styles.loadingText}>
            Loading your referral information...
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">Invite to Earn</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {renderStatsSection()}
        {renderHowItWorksSection()}
        {renderReferralSection()}
        {renderSocialButtons()}
        
        {/* Referral List Section */}
        {referrals.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h5" style={styles.sectionTitle}>Your Referrals</Typography>
            {referrals.map((referral, index) => (
              <Card key={referral.id || index} style={styles.referralItem}>
                <View style={styles.referralInfo}>
                  <View style={styles.referralLeft}>
                    <MaterialIcons name="person" size={24} color={Colors.primary} />
                    <View style={styles.referralDetails}>
                      <Typography variant="h6">{referral.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Joined {new Date(referral.joinedAt).toLocaleDateString()}
                      </Typography>
                    </View>
                  </View>
                  <View style={styles.referralRight}>
                    <Typography variant="body1" style={styles.referralBricks}>
                      +{referral.bricksAwarded} Bricks
                    </Typography>
                    <View style={[styles.statusBadge, styles[`status${referral.status}`]]}>
                      <Typography variant="caption" style={styles.statusText}>
                        {referral.status === 'verified' ? 'Verified' : 'Pending'}
                      </Typography>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
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
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    marginVertical: Spacing.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pendingCard: {
    backgroundColor: Colors.warning + '10',
    borderColor: Colors.warning + '30',
    borderWidth: 1,
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  pendingAmount: {
    color: Colors.warning,
    fontWeight: '600',
  },
  howItWorksCard: {
    padding: Spacing.lg,
  },
  stepContainer: {
    gap: Spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    color: Colors.background,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  referralCard: {
    padding: Spacing.lg,
  },
  codeContainer: {
    marginBottom: Spacing.lg,
  },
  codeLabel: {
    marginBottom: Spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  codeText: {
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  linkContainer: {
    marginBottom: Spacing.lg,
  },
  linkLabel: {
    marginBottom: Spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  linkText: {
    flex: 1,
    marginRight: Spacing.md,
    color: Colors.textSecondary,
  },
  copyButton: {
    padding: Spacing.xs,
  },
  shareButton: {
    width: '100%',
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  socialButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    minWidth: 80,
  },
  socialText: {
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  referralItem: {
    marginBottom: Spacing.md,
  },
  referralInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  referralDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  referralRight: {
    alignItems: 'flex-end',
  },
  referralBricks: {
    fontWeight: '600',
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  statusverified: {
    backgroundColor: Colors.success + '20',
  },
  statuspending: {
    backgroundColor: Colors.warning + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});