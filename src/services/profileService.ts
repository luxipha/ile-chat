import AsyncStorage from '@react-native-async-storage/async-storage';
import authService, { User } from './authService';

const API_BASE_URL = 'http://localhost:3000'; // Backend URL

export interface ProfileUpdateData {
  name?: string;
  // Add other profile fields as needed
}

export interface UserProfileData extends User {
  // Extended profile data if needed in the future
}

class ProfileService {
  private cachedProfile: UserProfileData | null = null;

  async getProfile(forceRefresh = false): Promise<{ success: boolean; profile?: UserProfileData; error?: string }> {
    try {
      // Return cached profile if available and not forcing refresh
      if (!forceRefresh && this.cachedProfile) {
        return { success: true, profile: this.cachedProfile };
      }

      // Get fresh profile from backend
      const sessionResult = await authService.getSession();
      
      if (!sessionResult.success || !sessionResult.user) {
        return { success: false, error: sessionResult.error || 'Failed to get profile' };
      }

      this.cachedProfile = sessionResult.user as UserProfileData;
      return { success: true, profile: this.cachedProfile };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async updateProfile(updates: ProfileUpdateData): Promise<{ success: boolean; profile?: UserProfileData; error?: string }> {
    try {
      const result = await authService.updateProfile(updates);
      
      if (result.success && result.user) {
        // Update cached profile
        this.cachedProfile = result.user as UserProfileData;
        return { success: true, profile: this.cachedProfile };
      }

      return { success: false, error: result.error || 'Failed to update profile' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async completeOnboarding(): Promise<{ success: boolean; profile?: UserProfileData; error?: string }> {
    try {
      const result = await authService.completeOnboarding();
      
      if (result.success && result.user) {
        // Update cached profile
        this.cachedProfile = result.user as UserProfileData;
        return { success: true, profile: this.cachedProfile };
      }

      return { success: false, error: result.error || 'Failed to complete onboarding' };
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async refreshBalance(): Promise<{ success: boolean; balance?: number; bricks?: number; error?: string }> {
    try {
      const result = await this.getProfile(true);
      
      if (result.success && result.profile) {
        return {
          success: true,
          balance: result.profile.balance,
          bricks: result.profile.bricks
        };
      }

      return { success: false, error: result.error || 'Failed to refresh balance' };
    } catch (error) {
      console.error('Refresh balance error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Get cached profile without API call
  getCachedProfile(): UserProfileData | null {
    return this.cachedProfile;
  }

  // Clear cached profile (e.g., on logout)
  clearCache(): void {
    this.cachedProfile = null;
  }

  // Utility method to get user's initials for avatar
  getUserInitials(profile?: UserProfileData): string {
    const user = profile || this.cachedProfile;
    if (!user?.name) return '?';
    
    const nameParts = user.name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  // Utility method to format balance
  formatBalance(balance: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance);
  }

  // Utility method to format bricks count
  formatBricks(bricks: number): string {
    if (bricks >= 1000000) {
      return `${(bricks / 1000000).toFixed(1)}M`;
    }
    if (bricks >= 1000) {
      return `${(bricks / 1000).toFixed(1)}K`;
    }
    return bricks.toString();
  }

  // Method to check if user needs to complete profile
  isProfileComplete(profile?: UserProfileData): boolean {
    const user = profile || this.cachedProfile;
    if (!user) return false;
    
    return !!(user.name && user.email && user.onboardingCompleted);
  }

  // Get referral link for sharing
  getReferralLink(profile?: UserProfileData): string {
    const user = profile || this.cachedProfile;
    if (!user?.referralCode) return '';
    
    return `https://ile.properties/signup?ref=${user.referralCode}`;
  }
}

export default new ProfileService();