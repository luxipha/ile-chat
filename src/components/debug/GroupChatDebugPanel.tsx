import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { 
  groupChatDebug, 
  printGroupChatDebugSummary,
  GroupChatDebugInfo 
} from '../../utils/groupChatDebugHelper';

interface GroupChatDebugPanelProps {
  visible: boolean;
  onClose: () => void;
  currentUser?: any;
}

export const GroupChatDebugPanel: React.FC<GroupChatDebugPanelProps> = ({
  visible,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'stats' | 'test'>('logs');
  const [logs, setLogs] = useState<GroupChatDebugInfo[]>([]);

  const refreshLogs = () => {
    setLogs(groupChatDebug.getRecentLogs(50));
  };

  const clearLogs = () => {
    groupChatDebug.clearLogs();
    setLogs([]);
    Alert.alert('Debug Logs Cleared', 'All debug logs have been cleared.');
  };

  const printSummary = () => {
    printGroupChatDebugSummary();
    Alert.alert('Debug Summary', 'Check console for detailed debug summary.');
  };

  const runTest = async () => {
    if (!currentUser) {
      Alert.alert('No User', 'Please login to run tests.');
      return;
    }

    // Mock data for testing
    const mockGroup = {
      name: 'Debug Test Group',
      members: [
        { id: 'test1', name: 'Test User 1' },
        { id: 'test2', name: 'Test User 2' },
      ]
    };

    Alert.alert('Test Started', 'Running group creation test...');
    
    // This would need to be connected to actual services in real implementation
    console.log('🧪 Would run group creation test with:', mockGroup);
  };

  const renderLogs = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.logsHeader}>
        <Typography variant="h6">Recent Logs ({logs.length})</Typography>
        <View style={styles.logsActions}>
          <TouchableOpacity onPress={refreshLogs} style={styles.actionButton}>
            <MaterialIcons name="refresh" size={20} color={ChatTheme.sendBubbleBackground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearLogs} style={styles.actionButton}>
            <MaterialIcons name="clear-all" size={20} color={ChatTheme.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      {logs.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Typography variant="body2" color="textSecondary">
            No debug logs available. Perform some group operations to see logs here.
          </Typography>
        </Card>
      ) : (
        logs.map((log, index) => (
          <Card key={index} style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={styles.logStatus}>
                <MaterialIcons 
                  name={log.success ? 'check-circle' : 'error'} 
                  size={16} 
                  color={log.success ? ChatTheme.success : ChatTheme.error}
                />
                <Typography variant="body2" style={styles.logAction}>
                  {log.action}
                </Typography>
              </View>
              <Typography variant="caption" color="textSecondary">
                {log.timestamp.toLocaleTimeString()}
              </Typography>
            </View>
            
            <Typography variant="caption" color="textSecondary" style={styles.logUserId}>
              User: {log.userId}
            </Typography>
            
            {log.data && (
              <View style={styles.logData}>
                <Typography variant="caption" color="textSecondary">
                  Data: {JSON.stringify(log.data, null, 2)}
                </Typography>
              </View>
            )}
            
            {log.error && (
              <View style={styles.logError}>
                <Typography variant="caption" style={styles.errorText}>
                  Error: {log.error.message || JSON.stringify(log.error)}
                </Typography>
              </View>
            )}
          </Card>
        ))
      )}
    </ScrollView>
  );

  const renderStats = () => {
    const failedLogs = logs.filter(log => !log.success);
    const successfulLogs = logs.filter(log => log.success);
    
    return (
      <ScrollView style={styles.tabContent}>
        <Card style={styles.statsCard}>
          <Typography variant="h6" style={styles.statsTitle}>Debug Statistics</Typography>
          
          <View style={styles.statRow}>
            <Typography variant="body2">Total Operations:</Typography>
            <Typography variant="body2" style={styles.statValue}>{logs.length}</Typography>
          </View>
          
          <View style={styles.statRow}>
            <Typography variant="body2">Successful:</Typography>
            <Typography variant="body2" style={[styles.statValue, { color: ChatTheme.success }]}>
              {successfulLogs.length}
            </Typography>
          </View>
          
          <View style={styles.statRow}>
            <Typography variant="body2">Failed:</Typography>
            <Typography variant="body2" style={[styles.statValue, { color: ChatTheme.error }]}>
              {failedLogs.length}
            </Typography>
          </View>
          
          <View style={styles.statRow}>
            <Typography variant="body2">Success Rate:</Typography>
            <Typography variant="body2" style={styles.statValue}>
              {logs.length > 0 ? Math.round((successfulLogs.length / logs.length) * 100) : 0}%
            </Typography>
          </View>
        </Card>
        
        <Button
          title="Print Console Summary"
          onPress={printSummary}
          style={styles.summaryButton}
        />
      </ScrollView>
    );
  };

  const renderTest = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.testCard}>
        <Typography variant="h6" style={styles.testTitle}>Group Chat Tests</Typography>
        
        <Typography variant="body2" color="textSecondary" style={styles.testDescription}>
          Run automated tests to verify group chat functionality.
        </Typography>
        
        <Button
          title="Run Group Creation Test"
          onPress={runTest}
          style={styles.testButton}
        />
        
        <Button
          title="Test Firebase Connection"
          onPress={() => Alert.alert('Test', 'Firebase connection test would run here')}
          variant="outline"
          style={styles.testButton}
        />
        
        <Button
          title="Validate Current State"
          onPress={() => {
            refreshLogs();
            Alert.alert('State Validated', 'Current state has been refreshed');
          }}
          variant="outline"
          style={styles.testButton}
        />
      </Card>
    </ScrollView>
  );

  React.useEffect(() => {
    if (visible) {
      refreshLogs();
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h5" style={styles.title}>
            Group Chat Debug Panel
          </Typography>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={ChatTheme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {[
            { key: 'logs', label: 'Logs', icon: 'list' },
            { key: 'stats', label: 'Stats', icon: 'bar-chart' },
            { key: 'test', label: 'Test', icon: 'bug-report' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <MaterialIcons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.key ? ChatTheme.sendBubbleBackground : ChatTheme.textSecondary} 
              />
              <Typography 
                variant="body2" 
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.activeTabLabel
                ]}
              >
                {tab.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'test' && renderTest()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatTheme.background1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ChatSpacing.lg,
    paddingVertical: ChatSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  title: {
    fontWeight: '600',
    color: ChatTheme.textPrimary,
  },
  closeButton: {
    padding: ChatSpacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ChatSpacing.md,
    paddingHorizontal: ChatSpacing.sm,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: ChatTheme.sendBubbleBackground,
  },
  tabLabel: {
    marginLeft: ChatSpacing.xs,
    color: ChatTheme.textSecondary,
  },
  activeTabLabel: {
    color: ChatTheme.sendBubbleBackground,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: ChatSpacing.lg,
  },
  logsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ChatSpacing.md,
  },
  logsActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: ChatSpacing.sm,
    padding: ChatSpacing.xs,
  },
  emptyCard: {
    padding: ChatSpacing.lg,
    alignItems: 'center',
  },
  logCard: {
    marginBottom: ChatSpacing.sm,
    padding: ChatSpacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ChatSpacing.xs,
  },
  logStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logAction: {
    marginLeft: ChatSpacing.xs,
    fontWeight: '600',
  },
  logUserId: {
    marginBottom: ChatSpacing.xs,
  },
  logData: {
    backgroundColor: ChatTheme.background3,
    padding: ChatSpacing.sm,
    borderRadius: 4,
    marginTop: ChatSpacing.xs,
  },
  logError: {
    backgroundColor: ChatTheme.error + '10',
    padding: ChatSpacing.sm,
    borderRadius: 4,
    marginTop: ChatSpacing.xs,
  },
  errorText: {
    color: ChatTheme.error,
  },
  statsCard: {
    padding: ChatSpacing.lg,
    marginBottom: ChatSpacing.md,
  },
  statsTitle: {
    marginBottom: ChatSpacing.md,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ChatSpacing.sm,
  },
  statValue: {
    fontWeight: '600',
  },
  summaryButton: {
    marginTop: ChatSpacing.md,
  },
  testCard: {
    padding: ChatSpacing.lg,
  },
  testTitle: {
    marginBottom: ChatSpacing.sm,
    fontWeight: '600',
  },
  testDescription: {
    marginBottom: ChatSpacing.lg,
    lineHeight: 20,
  },
  testButton: {
    marginBottom: ChatSpacing.md,
  },
});