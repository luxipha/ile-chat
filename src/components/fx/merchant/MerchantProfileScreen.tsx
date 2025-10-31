import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../../ui/Typography';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../../theme';
import { FXTheme } from '../../../theme/fxTheme';
import { FXOffer, FXTrade } from '../../../types/fx';
import fxService from '../../../services/fxService';
import { User, MerchantProfile as MerchantProfileType } from '../../../services/authService';
import profileService from '../../../services/profileService';
import { Avatar } from '../../ui/Avatar';

type MerchantReview = {
  id?: string;
  rating: number;
  comment?: string;
  reviewer?: string;
  createdAt?: string;
};

type MerchantSummary = Partial<User> & {
  id: string;
  trustBadge?: 'verified' | 'premium' | 'pro' | null;
  completedTrades?: number;
  responseTime?: string;
  onlineStatus?: 'online' | 'offline' | 'away';
  merchantProfile?: MerchantProfileType & {
    warnings?: string[];
    reviews?: MerchantReview[];
    trustScore?: number;
    responseTime?: number;
    verificationBadge?: string;
  };
  stats?: MerchantProfileType['stats'];
};

interface MerchantProfileScreenProps {
  merchant: MerchantSummary | null;
  isOwnProfile?: boolean;
  onBack: () => void;
  onViewOffers?: (merchantId: string) => void;
}

const formatTrustScore = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return value > 1 ? Math.round(value) : Math.round(value * 100);
};

export const MerchantProfileScreen: React.FC<MerchantProfileScreenProps> = ({
  merchant,
  isOwnProfile = false,
  onBack,
  onViewOffers,
}) => {
  const [offers, setOffers] = useState<FXOffer[]>([]);
  const [trades, setTrades] = useState<FXTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileInfo, setProfileInfo] = useState<{ name?: string; avatar?: string; email?: string } | null>(null);

  const merchantId = merchant?.id || (merchant as any)?._id;
  const merchantProfileLookupId =
    merchant?.profileUserId ||
    (merchant as any)?.profileUserId ||
    merchant?.firebaseUid ||
    (merchant as any)?.firebaseUid ||
    merchantId;

  const loadProfileData = useCallback(
    async (isRefresh = false) => {
      if (!merchantId) {
        setOffers([]);
        setTrades([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const offersResponse = await fxService.getOffers();
        const merchantOffers =
          offersResponse?.offers?.filter((offer) => offer.maker?.id === merchantId) ?? [];

        setOffers(merchantOffers);

        if (isOwnProfile) {
          const tradesResponse = await fxService.getUserTrades({ limit: 100, offset: 0 });

          if (tradesResponse?.success) {
            const ownTrades = tradesResponse.trades.filter((trade) => {
              const makerId = trade.maker?.id || trade.merchant?.id;
              return makerId === merchantId;
            });
            setTrades(ownTrades);
          } else {
            setTrades([]);
          }
        } else {
          setTrades([]);
        }
      } catch (error) {
        console.error('Failed to load merchant profile data:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [merchantId, isOwnProfile],
  );

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    const loadProfileInfo = async () => {
      if (!merchantProfileLookupId) {
        setProfileInfo(null);
        return;
      }

      try {
        const result = await profileService.getUserProfile(merchantProfileLookupId, true);
        if (result.success && result.profile) {
          setProfileInfo({
            name: result.profile.name,
            avatar: result.profile.avatar,
            email: result.profile.email,
          });
          return;
        }
      } catch (error) {
        console.warn('⚠️ Failed to load merchant profile info:', error);
      }

      setProfileInfo({
        name: merchant?.name,
        avatar: merchant?.avatar,
        email: merchant?.email,
      });
    };

    loadProfileInfo();
  }, [merchantProfileLookupId, merchant?.name, merchant?.avatar, merchant?.email]);

  const merchantProfile = merchant?.merchantProfile;
  const summaryStats = merchant?.stats || merchantProfile?.stats;

  const {
    totalTrades,
    completedTrades,
    completionRate,
    tradingVolume,
    averageRating,
    responseTimeText,
    trustScoreValue,
  } = useMemo(() => {
    const fallbackCompleted = summaryStats?.completedTrades ?? merchant?.completedTrades ?? 0;
    const ownTrades = trades.length;
    const ownCompleted = trades.filter((trade) => trade.status === 'completed').length;

    const baseTotal =
      summaryStats?.totalTrades ?? (isOwnProfile ? ownTrades : fallbackCompleted);
    const baseCompleted =
      summaryStats?.completedTrades ?? (isOwnProfile ? ownCompleted : fallbackCompleted);

    const derivedCompletion =
      baseTotal > 0
        ? Math.min(100, Math.round((baseCompleted / baseTotal) * 100))
        : fallbackCompleted
        ? Math.min(100, Math.round((fallbackCompleted / (fallbackCompleted + 5)) * 100))
        : 0;

    const offerVolume = offers.reduce((sum, offer) => sum + (offer.sellAmount || 0), 0);

    const volume =
      summaryStats?.tradingVolume ??
      (isOwnProfile
        ? trades.reduce((sum, trade) => sum + (trade.sellAmount || 0), 0)
        : offerVolume);

    const rating = typeof summaryStats?.averageRating === 'number' ? summaryStats.averageRating : 0;

    const trustScore = merchant?.trustScore ?? merchantProfile?.trustScore ?? null;

    const responseTime =
      summaryStats?.responseTime !== undefined
        ? `${summaryStats.responseTime} mins`
        : merchantProfile?.responseTime !== undefined
        ? `${merchantProfile.responseTime} mins`
        : merchant?.responseTime ?? null;

    return {
      totalTrades: baseTotal,
      completedTrades: baseCompleted,
      completionRate: derivedCompletion,
      tradingVolume: volume,
      averageRating: rating,
      responseTimeText: responseTime,
      trustScoreValue: trustScore,
    };
  }, [merchantProfile, summaryStats, trades, merchant, isOwnProfile, offers]);

  const paymentMethods = useMemo(() => {
    const uniqueMethods = new Map<string, string>();
    offers.forEach((offer) => {
      offer.paymentMethods.forEach((method) => {
        if (!uniqueMethods.has(method.id)) {
          uniqueMethods.set(method.id, method.name);
        }
      });
    });
    return Array.from(uniqueMethods.values());
  }, [offers]);

  const servicesOffered = useMemo(() => {
    const combos = new Set<string>();
    offers.forEach((offer) => {
      combos.add(`${offer.sellCurrency.code} → ${offer.buyCurrency.code}`);
    });
    return Array.from(combos);
  }, [offers]);

  const warnings = useMemo(() => merchantProfile?.warnings ?? [], [merchantProfile]);

  const reviews = useMemo<MerchantReview[]>(() => merchantProfile?.reviews ?? [], [merchantProfile]);

  const handleRefresh = async () => {
    await loadProfileData(true);
  };

  const displayName = profileInfo?.name || merchant?.name || 'Merchant';
  const displayEmail =
    profileInfo?.email ||
    merchant?.email ||
    (isOwnProfile ? 'Email not set' : 'Email hidden');

  const renderAvatar = () => (
    <Avatar
      userId={merchantProfileLookupId || merchantId || merchant?.id}
      name={displayName}
      imageUrl={profileInfo?.avatar || merchant?.avatar}
      size={80}
      disableAutoLoad={!!profileInfo?.avatar}
      style={styles.avatarWrapper}
    />
  );

  const renderStatusBadge = () => {
    const status = merchantProfile?.status;
    let backgroundColor = Colors.gray200;
    let textColor = Colors.gray700;
    let label = 'Merchant';

    if (status) {
      switch (status) {
        case 'approved':
          backgroundColor = Colors.success + '20';
          textColor = Colors.success;
          label = 'Verified Merchant';
          break;
        case 'pending':
          backgroundColor = Colors.warning + '20';
          textColor = Colors.warning;
          label = 'Verification Pending';
          break;
        case 'rejected':
        case 'suspended':
          backgroundColor = Colors.error + '20';
          textColor = Colors.error;
          label = status === 'rejected' ? 'Verification Rejected' : 'Account Suspended';
          break;
        default:
          break;
      }
    } else if (merchant?.trustBadge) {
      const trustLabels: Record<'verified' | 'premium' | 'pro', { bg: string; color: string; label: string }> = {
        verified: { bg: Colors.success + '20', color: Colors.success, label: 'Verified Merchant' },
        premium: { bg: Colors.secondary + '20', color: Colors.secondary, label: 'Premium Merchant' },
        pro: { bg: Colors.primary + '20', color: Colors.primary, label: 'Pro Merchant' },
      };
      const config = trustLabels[merchant.trustBadge];
      backgroundColor = config.bg;
      textColor = config.color;
      label = config.label;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Typography variant="caption" style={{ color: textColor, fontWeight: '600' }}>
          {label}
        </Typography>
      </View>
    );
  };

  const renderWarningCard = () => {
    if (!warnings.length) {
      return null;
    }

    return (
      <Card style={[FXTheme.cards.section, styles.warningCard]}>
        <View style={styles.sectionHeader}>
          <View style={FXTheme.layouts.row}>
            <MaterialIcons name="warning" size={20} color={Colors.warning} />
            <Typography variant="h6" style={[FXTheme.text.bold, { marginLeft: Spacing.sm }]}>
              Warnings
            </Typography>
          </View>
        </View>
        {warnings.map((warning, index) => (
          <View key={`${warning}-${index}`} style={styles.warningItem}>
            <Typography variant="body2" style={{ color: Colors.warning }}>
              • {warning}
            </Typography>
          </View>
        ))}
      </Card>
    );
  };

  if (!merchant || !merchantId) {
    return (
      <View style={[FXTheme.containers.screen, styles.loadingContainer]}>
        <Typography variant="body1" color="textSecondary">
          Merchant details unavailable.
        </Typography>
        <Button title="Go Back" onPress={onBack} style={{ marginTop: Spacing.lg }} />
      </View>
    );
  }

  const viewOffersLabel = isOwnProfile ? 'View and Manage Offers' : 'View Active Offers';
  const trustScoreDisplay = formatTrustScore(
    trustScoreValue ?? merchant?.trustScore ?? merchantProfile?.trustScore ?? null
  );

  return (
    <View style={FXTheme.containers.screen}>
      <View style={FXTheme.headers.withBorder}>
        <TouchableOpacity style={FXTheme.buttons.icon} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h6" style={FXTheme.text.bold}>
          Merchant Profile
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
          <Typography variant="body2" color="textSecondary" style={{ marginTop: Spacing.sm }}>
            Loading profile...
          </Typography>
        </View>
      ) : (
        <ScrollView
          style={FXTheme.containers.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />
          }
        >
          <Card style={[FXTheme.cards.section, styles.profileCard]}>
            <View style={styles.profileHeader}>
              {renderAvatar()}
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Typography variant="h4" style={FXTheme.text.bold}>
                    {displayName}
                  </Typography>
                  {renderStatusBadge()}
                </View>
                <Typography variant="body2" color="textSecondary">
                  {displayEmail}
                </Typography>
                {merchant.region && (
                  <View style={[FXTheme.layouts.row, { marginTop: Spacing.xs }]}>
                    <MaterialIcons name="location-pin" size={16} color={Colors.gray500} />
                    <Typography variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                      {merchant.region}
                    </Typography>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.profileMeta}>
              <View style={styles.metaItem}>
                <MaterialIcons name="star" size={20} color={Colors.warning} />
                <View>
                  <Typography variant="caption" color="textSecondary">
                    Rating
                  </Typography>
                  <Typography variant="body1" style={FXTheme.text.bold}>
                    {averageRating.toFixed(1)} / 5
                  </Typography>
                </View>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="verified-user" size={20} color={Colors.primary} />
                <View>
                  <Typography variant="caption" color="textSecondary">
                    Trust Score
                  </Typography>
                  <Typography variant="body1" style={FXTheme.text.bold}>
                    {trustScoreDisplay !== null ? `${trustScoreDisplay}%` : '—'}
                  </Typography>
                </View>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="access-time" size={20} color={Colors.gray500} />
                <View>
                  <Typography variant="caption" color="textSecondary">
                    Response Time
                  </Typography>
                  <Typography variant="body1" style={FXTheme.text.bold}>
                    {responseTimeText ?? '—'}
                  </Typography>
                </View>
              </View>
            </View>
          </Card>

          <Card style={FXTheme.cards.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="h6" style={FXTheme.text.bold}>
                Trading Performance
              </Typography>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Typography variant="caption" color="textSecondary">
                  Total Trades
                </Typography>
                <Typography variant="h3" style={FXTheme.text.bold}>
                  {totalTrades ?? 0}
                </Typography>
              </View>
              <View style={styles.statItem}>
                <Typography variant="caption" color="textSecondary">
                  Completion Rate
                </Typography>
                <Typography variant="h3" style={[FXTheme.text.bold, { color: Colors.success }]}>
                  {completionRate.toFixed(0)}%
                </Typography>
              </View>
              <View style={styles.statItem}>
                <Typography variant="caption" color="textSecondary">
                  Volume Traded
                </Typography>
                <Typography variant="h3" style={FXTheme.text.bold}>
                  {tradingVolume > 0 ? `$${tradingVolume.toLocaleString()}` : '—'}
                </Typography>
              </View>
              <View style={styles.statItem}>
                <Typography variant="caption" color="textSecondary">
                  Active Offers
                </Typography>
                <Typography variant="h3" style={FXTheme.text.bold}>
                  {offers.filter((offer) => offer.status === 'active').length}
                </Typography>
              </View>
            </View>
          </Card>

          <Card style={FXTheme.cards.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="h6" style={FXTheme.text.bold}>
                Payment Channels
              </Typography>
            </View>
            {paymentMethods.length ? (
              paymentMethods.map((method) => (
                <View key={method} style={styles.listRow}>
                  <MaterialIcons name="payment" size={18} color={Colors.primary} />
                  <Typography variant="body2" style={{ marginLeft: Spacing.sm }}>
                    {method}
                  </Typography>
                </View>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No payment channels found. Create an offer to add supported methods.
              </Typography>
            )}
          </Card>

          <Card style={FXTheme.cards.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="h6" style={FXTheme.text.bold}>
                Services Offered
              </Typography>
            </View>
            {servicesOffered.length ? (
              servicesOffered.map((service) => (
                <View key={service} style={styles.listRow}>
                  <MaterialIcons name="swap-horiz" size={18} color={Colors.primary} />
                  <Typography variant="body2" style={{ marginLeft: Spacing.sm }}>
                    {service}
                  </Typography>
                </View>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No live offers yet. Once this merchant lists offers, you'll see supported currency pairs here.
              </Typography>
            )}
          </Card>

          {renderWarningCard()}

          <Card style={FXTheme.cards.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="h6" style={FXTheme.text.bold}>
                Reviews
              </Typography>
            </View>
            {reviews.length ? (
              reviews.slice(0, 3).map((review, index) => (
                <View key={review.id || index.toString()} style={styles.reviewItem}>
                  <View style={FXTheme.layouts.rowBetween}>
                    <Typography variant="body2" style={FXTheme.text.bold}>
                      {review.reviewer || 'Verified Buyer'}
                    </Typography>
                    <View style={FXTheme.layouts.row}>
                      <MaterialIcons name="star" size={16} color={Colors.warning} />
                      <Typography variant="body2" style={{ marginLeft: 4 }}>
                        {review.rating.toFixed(1)}
                      </Typography>
                    </View>
                  </View>
                  {review.comment && (
                    <Typography variant="body2" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                      {review.comment}
                    </Typography>
                  )}
                  {review.createdAt && (
                    <Typography variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Typography>
                  )}
                </View>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No reviews yet. Completed trades with feedback will show up automatically.
              </Typography>
            )}
          </Card>

          {merchantId && onViewOffers && (
            <Button
              title={viewOffersLabel}
              onPress={() => onViewOffers(merchantId)}
              style={styles.manageOffersButton}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    padding: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarWrapper: {
    marginRight: Spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  profileMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray50,
    marginBottom: Spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  warningCard: {
    backgroundColor: Colors.warning + '10',
    borderColor: Colors.warning + '30',
    borderWidth: 1,
  },
  warningItem: {
    paddingVertical: Spacing.xs,
  },
  reviewItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  manageOffersButton: {
    marginBottom: Spacing['3xl'],
    backgroundColor: Colors.primary,
  },
});
