import { apiClient } from './api';
import authService from './authService';

interface ReferralInfo {
  referralCode: string;
  bricksEarned: number;
  friendsReferred: number;
  pendingRewards: number;
  referralLink: string;
  referrals: Array<{
    id: string;
    name: string;
    joinedAt: string;
    bricksAwarded: number;
    status: 'pending' | 'verified' | 'completed';
  }>;
}

interface ReferralStats {
  totalBricks: number;
  totalReferrals: number;
  pendingBricks: number;
  completedReferrals: number;
}

interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  todayCompleted: boolean;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  bricks: number;
  rank: number;
  avatar?: string;
}

const referralService = {
  /**
   * Get user's referral information including code, stats, and referral list
   */
  getUserReferralInfo: async (): Promise<{ success: boolean; data?: ReferralInfo; error?: string }> => {
    try {
      // Use the same endpoint as the marketplace web app
      const response = await apiClient.get('/api/user/referrals');
      
      if (response.success && response.data) {
        const referralData = response.data;
        
        // Handle different brick formats (number or object)
        const totalBricks = typeof referralData.bricks === 'number' 
          ? referralData.bricks 
          : (referralData.bricks?.total || 0);
        
        // Generate referral link using the same pattern as marketplace
        const baseUrl = __DEV__ ? 'http://localhost:8080' : 'https://app.ile.africa';
        const referralCode = referralData.referralCode || '';
        const referralLink = referralCode ? `${baseUrl}/ref/${referralCode}` : '';
        
        return {
          success: true,
          data: {
            referralCode: referralData.referralCode || '',
            bricksEarned: totalBricks,
            friendsReferred: referralData.referrals?.length || 0,
            pendingRewards: referralData.pendingBricks || 0,
            referralLink: referralLink,
            referrals: referralData.referrals?.map((ref: any) => ({
              id: ref.userId || ref.id,
              name: ref.name || ref.userName || 'Unknown User',
              joinedAt: ref.createdAt || ref.joinedAt || new Date().toISOString(),
              bricksAwarded: ref.bricksAwarded || 100, // Default referral reward
              status: ref.status === 'completed' ? 'verified' : 'pending'
            })) || []
          }
        };
      }

      return {
        success: false,
        error: response.message || 'Failed to get referral information'
      };
    } catch (error) {
      console.error('Failed to get referral info:', error);
      return {
        success: false,
        error: 'Network error while fetching referral information'
      };
    }
  },

  /**
   * Apply a referral code to the current user
   */
  applyReferralCode: async (referralCode: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiClient.post('/rewards/apply-referral', {
        referralCode: referralCode.trim()
      });

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Referral code applied successfully!'
        };
      }

      return {
        success: false,
        error: response.message || 'Failed to apply referral code'
      };
    } catch (error) {
      console.error('Failed to apply referral code:', error);
      return {
        success: false,
        error: 'Network error while applying referral code'
      };
    }
  },

  /**
   * Get user's daily streak information
   */
  getUserStreak: async (): Promise<{ success: boolean; data?: UserStreak; error?: string }> => {
    try {
      // Get current user email for the request
      const userSession = await authService.getSession();
      if (!userSession.success || !userSession.user?.email) {
        return {
          success: false,
          error: 'User not authenticated or email not available'
        };
      }

      const response = await apiClient.get(`/rewards/user-streak?email=${encodeURIComponent(userSession.user.email)}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            currentStreak: response.data.currentStreak || 0,
            longestStreak: response.data.longestStreak || 0,
            lastActivityDate: response.data.lastActivityDate || '',
            todayCompleted: response.data.todayCompleted || false
          }
        };
      }

      return {
        success: false,
        error: response.message || 'Failed to get streak information'
      };
    } catch (error) {
      console.error('Failed to get user streak:', error);
      return {
        success: false,
        error: 'Network error while fetching streak information'
      };
    }
  },

  /**
   * Record daily activity to earn bricks
   */
  recordDailyActivity: async (activityType: string = 'app_open'): Promise<{ success: boolean; bricksEarned?: number; message?: string; error?: string }> => {
    try {
      // Get current user email for the request
      const userSession = await authService.getSession();
      if (!userSession.success || !userSession.user?.email) {
        return {
          success: false,
          error: 'User not authenticated or email not available'
        };
      }

      const response = await apiClient.post('/rewards/daily-activity', {
        email: userSession.user.email,
        activityType,
        timestamp: new Date().toISOString()
      });

      if (response.success) {
        return {
          success: true,
          bricksEarned: response.data?.bricksEarned || 0,
          message: response.message || 'Daily activity recorded!'
        };
      }

      return {
        success: false,
        error: response.message || 'Failed to record daily activity'
      };
    } catch (error) {
      console.error('Failed to record daily activity:', error);
      return {
        success: false,
        error: 'Network error while recording activity'
      };
    }
  },

  /**
   * Get leaderboard of top users by brick count
   */
  getLeaderboard: async (limit: number = 50): Promise<{ success: boolean; data?: LeaderboardEntry[]; error?: string }> => {
    try {
      // Use the mobile-friendly leaderboard endpoint
      const response = await apiClient.get(`/user/leaderboard?limit=${limit}`);
      
      if (response.success && response.data) {
        const leaderboard = response.data.map((entry: any, index: number) => ({
          userId: entry.userId || entry.id,
          name: entry.name || entry.userName || 'Unknown User',
          bricks: entry.bricks || entry.totalBricks || 0,
          rank: index + 1,
          avatar: entry.avatar || entry.profilePicture
        }));

        return {
          success: true,
          data: leaderboard
        };
      }

      return {
        success: false,
        error: response.message || 'Failed to get leaderboard'
      };
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return {
        success: false,
        error: 'Network error while fetching leaderboard'
      };
    }
  },

  /**
   * Get Telegram referral statistics
   */
  getTelegramReferralStats: async (): Promise<{ success: boolean; data?: { clicks: number; joined: number; conversionRate: number }; error?: string }> => {
    try {
      const response = await apiClient.get('/rewards/telegram-referrals');
      
      if (response.success && response.data) {
        const clicks = response.data.totalClicks || 0;
        const joined = response.data.totalJoined || 0;
        const conversionRate = clicks > 0 ? (joined / clicks) * 100 : 0;

        return {
          success: true,
          data: {
            clicks,
            joined,
            conversionRate: Math.round(conversionRate * 100) / 100
          }
        };
      }

      return {
        success: false,
        error: response.message || 'Failed to get Telegram stats'
      };
    } catch (error) {
      console.error('Failed to get Telegram referral stats:', error);
      return {
        success: false,
        error: 'Network error while fetching Telegram stats'
      };
    }
  },

  /**
   * Record a referral link click (for analytics)
   */
  recordReferralClick: async (source: string = 'mobile_app'): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiClient.post('/rewards/telegram-referral-click', {
        source,
        timestamp: new Date().toISOString()
      });

      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to record referral click:', error);
      return {
        success: false,
        error: 'Failed to record click'
      };
    }
  },

  /**
   * Refresh user's brick count from server
   */
  refreshUserBricks: async (): Promise<{ success: boolean; bricks?: number; error?: string }> => {
    try {
      // Get updated user info to refresh brick count
      const userSession = await authService.getSession();
      
      if (userSession.success && userSession.user) {
        return {
          success: true,
          bricks: userSession.user.bricks || 0
        };
      }

      return {
        success: false,
        error: 'Failed to get updated user information'
      };
    } catch (error) {
      console.error('Failed to refresh user bricks:', error);
      return {
        success: false,
        error: 'Network error while refreshing bricks'
      };
    }
  },

  /**
   * Generate shareable referral message
   */
  generateShareMessage: (referralCode: string, referralLink: string): string => {
    const linkText = referralLink || 'https://app.ile.africa';
    return `🏠 Join me on ilePay - the revolutionary real estate investment platform!

💰 Invest in premium properties with as little as $100
🎁 Join using my link: ${linkText}

🧱 We both earn Bricks when you sign up and make your first investment!

#RealEstate #Investment #ilePay`;
  },

  /**
   * Get user achievements and tier status
   */
  getUserAchievements: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await apiClient.get('/user/achievements');
      
      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        error: response.message || 'Failed to get achievements'
      };
    } catch (error) {
      console.error('Failed to get user achievements:', error);
      return {
        success: false,
        error: 'Network error while fetching achievements'
      };
    }
  }
};

export default referralService;