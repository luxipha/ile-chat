// Group Chat Debug Helper
// This file contains helper functions to debug the group chat functionality

import { DEBUG_CONFIG } from './debugConfig';

export interface GroupChatDebugInfo {
  timestamp: Date;
  userId: string;
  action: string;
  success: boolean;
  data?: any;
  error?: any;
}

class GroupChatDebugHelper {
  private logs: GroupChatDebugInfo[] = [];

  log(userId: string, action: string, success: boolean, data?: any, error?: any) {
    const logEntry: GroupChatDebugInfo = {
      timestamp: new Date(),
      userId,
      action,
      success,
      data,
      error
    };
    
    this.logs.push(logEntry);
    
    // Only keep last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    if (__DEV__) {
      const emoji = success ? '✅' : '❌';
      const message = `${emoji} [${userId}] ${action}`;
      
      if (error) {
        console.error(message, { data, error });
      } else {
        console.log(message, data);
      }
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count = 20): GroupChatDebugInfo[] {
    return this.logs.slice(-count);
  }

  // Get logs for specific user
  getUserLogs(userId: string): GroupChatDebugInfo[] {
    return this.logs.filter(log => log.userId === userId);
  }

  // Get failed operations
  getFailedOperations(): GroupChatDebugInfo[] {
    return this.logs.filter(log => !log.success);
  }

  // Print debug summary
  printDebugSummary() {
    if (!__DEV__) return;
    
    console.log('\n=== GROUP CHAT DEBUG SUMMARY ===');
    console.log(`Total operations: ${this.logs.length}`);
    console.log(`Successful: ${this.logs.filter(l => l.success).length}`);
    console.log(`Failed: ${this.logs.filter(l => !l.success).length}`);
    
    const recentFailed = this.getFailedOperations().slice(-5);
    if (recentFailed.length > 0) {
      console.log('\nRecent failures:');
      recentFailed.forEach(log => {
        console.log(`- ${log.action} at ${log.timestamp.toLocaleTimeString()}: ${log.error?.message || 'Unknown error'}`);
      });
    }
    
    console.log('=====================================\n');
  }

  // Validate group creation flow
  validateGroupCreationFlow(groupData: any): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!groupData.name || groupData.name.trim().length === 0) {
      issues.push('Group name is required');
    }
    
    if (!groupData.members || groupData.members.length === 0) {
      issues.push('At least one member must be selected');
    }
    
    if (groupData.privacy === 'private' && (!groupData.pin || groupData.pin.length !== 4)) {
      issues.push('Private groups require a 4-digit PIN');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Test group creation end-to-end
  async testGroupCreationFlow(mockData: {
    groupName: string;
    members: any[];
    currentUser: any;
    chatService: any;
  }): Promise<{ success: boolean; error?: string; groupId?: string }> {
    try {
      console.log('🧪 Testing group creation flow...');
      
      // Validate input
      const validation = this.validateGroupCreationFlow({
        name: mockData.groupName,
        members: mockData.members,
        privacy: 'private',
        pin: '1234'
      });
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.issues.join(', ')}`);
      }
      
      // Test Firebase connection
      console.log('🔥 Testing Firebase connection...');
      
      // Test group creation
      const participantIds = [mockData.currentUser.id, ...mockData.members.map(m => m.id)];
      const groupId = await mockData.chatService.createConversation(
        participantIds,
        true,
        mockData.groupName,
        'Test group description'
      );
      
      this.log(mockData.currentUser.id, 'TEST_GROUP_CREATION', true, { groupId });
      
      return { success: true, groupId };
      
    } catch (error) {
      this.log(mockData.currentUser.id, 'TEST_GROUP_CREATION', false, mockData, error);
      return { success: false, error: error.message };
    }
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
    if (__DEV__) {
      console.log('🧹 Group chat debug logs cleared');
    }
  }
}

// Export singleton instance
export const groupChatDebug = new GroupChatDebugHelper();

// Export convenience functions
export const debugGroupAction = (userId: string, action: string, success: boolean, data?: any, error?: any) => {
  groupChatDebug.log(userId, action, success, data, error);
};

export const printGroupChatDebugSummary = () => {
  groupChatDebug.printDebugSummary();
};

export const validateGroupData = (groupData: any) => {
  return groupChatDebug.validateGroupCreationFlow(groupData);
};