import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../chat/Avatar';
import { ChatTheme } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';
import contributionGroupService, { 
  ContributionGroupWallet as WalletData,
  MemberContribution,
  ContributionTransaction
} from '../../services/contributionGroupService';
import multiSigWalletService from '../../services/multiSigWalletService';

interface ContributionGroupWalletProps {
  groupId: string;
  isAdmin: boolean;
  onContribute: () => void;
  onWithdraw: () => void;
  onViewTransactions: () => void;
}

interface WalletBalance {
  totalValue: number;
  tokens: {
    symbol: string;
    name: string;
    balance: number;
    value: number;
    icon: string;
  }[];
}

interface ContributionStats {
  totalContributed: number;
  goalAmount?: number;
  goalProgress: number;
  memberCount: number;
  averageContribution: number;
}

interface RecentTransaction {
  id: string;
  type: 'contribution' | 'withdrawal';
  amount: number;
  token: string;
  member: {
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export const ContributionGroupWallet: React.FC<ContributionGroupWalletProps> = ({
  groupId,
  isAdmin,
  onContribute,
  onWithdraw,
  onViewTransactions,
}) => {
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [contributionStats, setContributionStats] = useState<ContributionStats | null>(null);
  const [memberContributions, setMemberContributions] = useState<MemberContribution[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'members'>('overview');

  useEffect(() => {
    loadWalletData();
  }, [groupId]);

  const loadWalletData = async () => {
    try {
      console.log('🔄 [ContributionGroupWallet] Loading wallet data for group:', {
        groupId,
        isAdmin,
        timestamp: new Date().toISOString(),
      });
      setLoading(true);
      setError(null);

      // Load group wallet data from backend
      const walletResponse = await contributionGroupService.getGroupWallet(groupId);
      
      if (!walletResponse.success || !walletResponse.wallet) {
        throw new Error('Group wallet not found or not yet created');
      }

      const wallet = walletResponse.wallet;
      setWalletData(wallet);

      // Load wallet balance from blockchain
      if (wallet.contractAddress) {
        const balanceResponse = await multiSigWalletService.getWalletBalance(
          wallet.contractAddress,
          wallet.chainId,
          Object.keys(wallet.balance)
        );

        if (balanceResponse.success && balanceResponse.balance) {
          const blockchainBalance = balanceResponse.balance;
          
          const walletBalance: WalletBalance = {
            totalValue: blockchainBalance.totalValue,
            tokens: blockchainBalance.tokens.map(token => ({
              symbol: token.symbol,
              name: token.name,
              balance: parseFloat(token.balance),
              value: token.value,
              icon: token.symbol === 'USDC' ? 'account-balance' : 
                    token.symbol === 'USDT' ? 'account-balance-wallet' :
                    token.symbol === 'ETH' ? 'currency-bitcoin' : 'coin',
            })),
          };
          
          setWalletBalance(walletBalance);
        }
      }

      // Load member contributions
      const contributionsResponse = await contributionGroupService.getMemberContributions(groupId);
      
      if (contributionsResponse.success) {
        setMemberContributions(contributionsResponse.contributions);
        
        // Calculate contribution stats
        const totalContributed = contributionsResponse.contributions.reduce(
          (sum, member) => sum + member.totalContributed, 0
        );
        
        const stats: ContributionStats = {
          totalContributed,
          goalAmount: wallet.goalAmount,
          goalProgress: wallet.goalProgress,
          memberCount: contributionsResponse.contributions.length,
          averageContribution: totalContributed / contributionsResponse.contributions.length || 0,
        };
        
        setContributionStats(stats);
      }

      // Load recent transactions
      const transactionsResponse = await contributionGroupService.getTransactionHistory(
        groupId, 
        5, // Limit to 5 recent transactions
        0
      );
      
      if (transactionsResponse.success) {
        const recentTxs: RecentTransaction[] = transactionsResponse.transactions.map(tx => ({
          id: tx.id,
          type: tx.type === 'contribution' ? 'contribution' : 'withdrawal',
          amount: tx.amount,
          token: tx.token,
          member: {
            name: tx.metadata.userName,
            avatar: tx.metadata.userAvatar,
          },
          timestamp: tx.createdAt,
          status: tx.status === 'confirmed' ? 'completed' : 
                  tx.status === 'pending' ? 'pending' : 'failed',
        }));
        
        setRecentTransactions(recentTxs);
      }

      console.log('✅ [ContributionGroupWallet] Real wallet data loaded successfully:', {
        contractAddress: wallet.contractAddress,
        totalValue: wallet.totalValue,
        memberCount: contributionsResponse.contributions.length,
        walletBalance: walletBalance ? {
          totalValue: walletBalance.totalValue,
          tokenCount: walletBalance.tokens.length,
          tokenBalances: walletBalance.tokens.map(t => `${t.symbol}: ${t.balance}`)
        } : null,
        contributionStats: contributionStats ? {
          totalContributed: contributionStats.totalContributed,
          goalProgress: contributionStats.goalProgress,
          averageContribution: contributionStats.averageContribution,
        } : null,
        recentTransactionsCount: recentTransactions.length,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('❌ [ContributionGroupWallet] Failed to load wallet data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load wallet data';
      setError(errorMessage);
      
      // Show user-friendly error
      if (errorMessage.includes('not found') || errorMessage.includes('not yet created')) {
        Alert.alert(
          'Wallet Not Found', 
          'This group doesn\'t have a wallet yet. Create one to start contributing.',
          [
            { text: 'OK' },
            { text: 'Create Wallet', onPress: () => {/* TODO: Open wallet creation */} }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load wallet data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${Math.floor(hours)}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  const renderWalletOverview = () => (
    <ScrollView style={styles.tabContent}>
      {/* Balance Card */}
      <Card style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Typography variant="h6" color="textSecondary">
            Group Contribution Pool
          </Typography>
          <TouchableOpacity onPress={loadWalletData}>
            <MaterialIcons name="refresh" size={20} color={ChatTheme.textSecondary} />
          </TouchableOpacity>
        </View>
        <Typography variant="h1" style={styles.balanceAmount}>
          {formatCurrency(walletBalance?.totalValue || 0)}
        </Typography>
        
        {/* Goal Progress */}
        {contributionStats?.goalAmount && (
          <View style={styles.goalProgress}>
            <View style={styles.goalProgressBar}>
              <View 
                style={[
                  styles.goalProgressFill, 
                  { width: `${contributionStats.goalProgress}%` }
                ]} 
              />
            </View>
            <View style={styles.goalStats}>
              <Typography variant="caption" color="textSecondary">
                {contributionStats.goalProgress}% of {formatCurrency(contributionStats.goalAmount)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {formatCurrency(contributionStats.goalAmount - contributionStats.totalContributed)} remaining
              </Typography>
            </View>
          </View>
        )}

        <View style={styles.balanceStats}>
          <View style={styles.balanceStat}>
            <Typography variant="caption" color="textSecondary">Contributors</Typography>
            <Typography variant="body2">{contributionStats?.memberCount || 0}</Typography>
          </View>
          <View style={styles.balanceStat}>
            <Typography variant="caption" color="textSecondary">Avg Contribution</Typography>
            <Typography variant="body2">
              {formatCurrency(contributionStats?.averageContribution || 0)}
            </Typography>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Typography variant="h6" style={styles.sectionTitle}>
          Quick Actions
        </Typography>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={onContribute}>
            <MaterialIcons name="add-circle" size={32} color={ChatTheme.sendBubbleBackground} />
            <Typography variant="body2" style={styles.actionText}>Contribute</Typography>
          </TouchableOpacity>
          
          {isAdmin && (
            <TouchableOpacity style={styles.actionButton} onPress={onWithdraw}>
              <MaterialIcons name="account-balance-wallet" size={32} color={Colors.error} />
              <Typography variant="body2" style={styles.actionText}>Withdraw</Typography>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={onViewTransactions}>
            <MaterialIcons name="history" size={32} color={ChatTheme.textSecondary} />
            <Typography variant="body2" style={styles.actionText}>History</Typography>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Recent Activity */}
      <Card style={styles.recentCard}>
        <View style={styles.recentHeader}>
          <Typography variant="h6">Recent Activity</Typography>
          <TouchableOpacity onPress={onViewTransactions}>
            <Typography variant="body2" style={styles.viewAllText}>View All</Typography>
          </TouchableOpacity>
        </View>
        
        {recentTransactions.slice(0, 3).map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <MaterialIcons 
                name={transaction.type === 'contribution' ? 'add-circle' : 'remove-circle'} 
                size={20} 
                color={transaction.type === 'contribution' ? Colors.success : Colors.error} 
              />
            </View>
            <View style={styles.transactionInfo}>
              <Typography variant="h6">
                {transaction.type === 'contribution' ? 'Contribution' : 'Withdrawal'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {transaction.member.name} • {formatTimestamp(transaction.timestamp)}
              </Typography>
            </View>
            <Typography variant="h6" style={{ 
              color: transaction.type === 'contribution' ? Colors.success : Colors.error 
            }}>
              {transaction.type === 'contribution' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </Typography>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  const renderMemberContributions = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.membersCard}>
        <Typography variant="h6" style={styles.sectionTitle}>
          Member Contributions
        </Typography>
        
        {memberContributions.map((member) => (
          <View key={member.id} style={styles.memberItem}>
            <Avatar userId={member.id} name={member.name} size="medium" />
            <View style={styles.memberInfo}>
              <Typography variant="h6">{member.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                {member.lastContribution 
                  ? `Last: ${formatTimestamp(member.lastContribution)}`
                  : 'No contributions yet'
                }
              </Typography>
            </View>
            <View style={styles.memberStats}>
              <Typography variant="h6">{formatCurrency(member.totalContributed)}</Typography>
              <Typography variant="caption" color="textSecondary">
                {member.percentage.toFixed(1)}% of total
              </Typography>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      {[
        { id: 'overview', title: 'Overview', icon: 'dashboard' },
        { id: 'members', title: 'Members', icon: 'group' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab
          ]}
          onPress={() => setActiveTab(tab.id as any)}
        >
          <MaterialIcons
            name={tab.icon as any}
            size={20}
            color={activeTab === tab.id ? ChatTheme.sendBubbleBackground : ChatTheme.textSecondary}
          />
          <Typography
            variant="caption"
            style={[
              styles.tabTitle,
              activeTab === tab.id && styles.activeTabTitle
            ]}
          >
            {tab.title}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ChatTheme.sendBubbleBackground} />
        <Typography variant="body2" color="textSecondary" style={styles.loadingText}>
          Loading wallet data...
        </Typography>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color={Colors.error} />
        <Typography variant="h6" style={styles.errorTitle}>
          Failed to Load Wallet
        </Typography>
        <Typography variant="body2" color="textSecondary" style={styles.errorMessage}>
          {error}
        </Typography>
        <TouchableOpacity style={styles.retryButton} onPress={loadWalletData}>
          <Typography variant="body2" style={styles.retryButtonText}>
            Try Again
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabSelector()}
      {activeTab === 'overview' ? renderWalletOverview() : renderMemberContributions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatTheme.background1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ChatTheme.background1,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: ChatTheme.background1,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: ChatTheme.sendBubbleBackground,
  },
  tabTitle: {
    marginTop: Spacing.xs,
    color: ChatTheme.textSecondary,
  },
  activeTabTitle: {
    color: ChatTheme.sendBubbleBackground,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  balanceCard: {
    marginBottom: Spacing.md,
    padding: Spacing.xl,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    fontWeight: '700',
    marginBottom: Spacing.md,
    color: ChatTheme.sendBubbleBackground,
  },
  goalProgress: {
    marginBottom: Spacing.md,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: ChatTheme.background3,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: ChatTheme.sendBubbleBackground,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceStat: {
    alignItems: 'center',
  },
  actionsCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: ChatTheme.background3,
    minWidth: 80,
  },
  actionText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  recentCard: {
    marginBottom: Spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllText: {
    color: ChatTheme.sendBubbleBackground,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ChatTheme.background3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  membersCard: {
    paddingVertical: Spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  memberInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  memberStats: {
    alignItems: 'flex-end',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: ChatTheme.background1,
  },
  errorTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    color: Colors.error,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: ChatTheme.sendBubbleBackground,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});