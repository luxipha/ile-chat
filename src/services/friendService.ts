import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL from environment variables with fallbacks
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const API_BASE_URL = process.env.API_BASE_URL || (isWeb
  ? 'http://localhost:3000'  // Web browser
  : 'http://192.168.31.102:3000'); // Mobile device

export interface FriendRequest {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  recipient: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  conversationId: string;
  friendshipId: string;
}

export interface FriendshipStatus {
  status: 'none' | 'pending' | 'friends';
  conversationId?: string;
  requestId?: string;
  isSender?: boolean;
  canRespond?: boolean;
}

class FriendService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  /**
   * Send a friend request to another user
   */
  async sendFriendRequest(recipientId: string, message?: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.makeRequest('/api/friends/request', {
        method: 'POST',
        body: JSON.stringify({
          recipientId,
          message
        }),
      });

      return result;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send friend request'
      };
    }
  }

  /**
   * Get pending friend requests (received)
   */
  async getPendingRequests(): Promise<{ success: boolean; requests: FriendRequest[] }> {
    try {
      const result = await this.makeRequest('/api/friends/requests/pending');
      return result;
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return {
        success: false,
        requests: []
      };
    }
  }

  /**
   * Respond to a friend request (accept/reject)
   */
  async respondToRequest(requestId: string, action: 'accept' | 'reject'): Promise<{ success: boolean; message: string; friendship?: any }> {
    try {
      const result = await this.makeRequest(`/api/friends/requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });

      return result;
    } catch (error) {
      console.error('Error responding to friend request:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to respond to request'
      };
    }
  }

  /**
   * Get friends list
   */
  async getFriends(): Promise<{ success: boolean; friends: Friend[] }> {
    try {
      const result = await this.makeRequest('/api/friends/list');
      return result;
    } catch (error) {
      console.error('Error fetching friends:', error);
      return {
        success: false,
        friends: []
      };
    }
  }

  /**
   * Get sent friend requests (requests I sent to others)
   */
  async getSentRequests(): Promise<{ success: boolean; requests: FriendRequest[] }> {
    try {
      const result = await this.makeRequest('/api/friends/requests/sent');
      return result;
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      return {
        success: false,
        requests: []
      };
    }
  }

  /**
   * Check friendship status with another user
   */
  async getFriendshipStatus(userId: string): Promise<{ success: boolean; status?: FriendshipStatus }> {
    try {
      const result = await this.makeRequest(`/api/friends/status/${userId}`);
      return result;
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Generate QR code data for adding contact
   */
  generateContactQRData(userId: string, userName: string): string {
    return `contact:${userId}:${userName}`;
  }

  /**
   * Parse QR code data to extract user info
   */
  parseContactQRData(qrData: string): { userId: string; userName: string } | null {
    if (!qrData.startsWith('contact:')) {
      return null;
    }

    const parts = qrData.replace('contact:', '').split(':');
    if (parts.length >= 2) {
      return {
        userId: parts[0],
        userName: parts[1]
      };
    }

    return null;
  }

  /**
   * Search for users by phone number, email, or username
   */
  async searchUsers(query: string): Promise<{ success: boolean; users: Array<{ id: string; name: string; email?: string; phone?: string; username?: string; avatar?: string }> }> {
    try {
      const result = await this.makeRequest('/api/users/search', {
        method: 'POST',
        body: JSON.stringify({
          query: query.trim()
        }),
      });

      return result;
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        users: []
      };
    }
  }
}

export const friendService = new FriendService();
export default friendService;