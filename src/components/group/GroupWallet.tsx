import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../chat/Avatar';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface GroupWalletProps {
  groupId: string;
  isAdmin: boolean;
  onContribute: () => void;
  onPropose: () => void;
  onWithdraw: () => void;
}

interface Token {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  icon: string;
  change24h: number;
}

interface GroupTransaction {
  id: string;
  type: 'contribution' | 'withdrawal' | 'investment' | 'yield';
  amount: number;
  token: string;
  member: {
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  description: string;
}

interface MemberContribution {
  id: string;
  name: string;
  avatar?: string;
  totalContributed: number;
  percentage: number;
  lastContribution: Date;
  status: 'active' | 'inactive';
}

const SAMPLE_TOKENS: Token[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 12450.00,
    value: 12450.00,
    icon: 'account-balance',
    change24h: 0.1,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: 2.5,
    value: 5250.00,
    icon: 'currency-bitcoin',
    change24h: 2.4,
  },
  {
    symbol: 'PROP1',
    name: 'Downtown Property Token',
    balance: 100,
    value: 8500.00,
    icon: 'home',
    change24h: 1.8,
  },
];

const SAMPLE_TRANSACTIONS: GroupTransaction[] = [
  {
    id: '1',
    type: 'contribution',
    amount: 500,
    token: 'USDC',
    member: { name: 'Sarah Anderson', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'completed',
    description: 'Monthly contribution',
  },
  {
    id: '2',
    type: 'investment',
    amount: 2000,
    token: 'USDC',
    member: { name: 'You' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'pending',
    description: 'Property investment proposal',
  },
  {
    id: '3',
    type: 'yield',
    amount: 125.50,
    token: 'USDC',
    member: { name: 'DeFi Protocol' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'completed',
    description: 'Staking rewards',
  },
];

const SAMPLE_MEMBERS: MemberContribution[] = [
  {
    id: '1',
    name: 'You',
    totalContributed: 5500,
    percentage: 35.2,
    lastContribution: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    status: 'active',
  },
  {
    id: '2',
    name: 'Sarah Anderson',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    totalContributed: 4200,
    percentage: 26.9,
    lastContribution: new Date(Date.now() - 1000 * 60 * 30),
    status: 'active',
  },
  {
    id: '3',
    name: 'Michael Roberts',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    totalContributed: 3800,
    percentage: 24.3,
    lastContribution: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    status: 'active',
  },
  {
    id: '4',
    name: 'Emma Thompson',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    totalContributed: 2100,
    percentage: 13.6,
    lastContribution: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    status: 'inactive',
  },
];

export const GroupWallet: React.FC<GroupWalletProps> = ({
  groupId,
  isAdmin,
  onContribute,
  onPropose,
  onWithdraw,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'transactions' | 'members'>('overview');

  const totalValue = SAMPLE_TOKENS.reduce((sum, token) => sum + token.value, 0);
  const totalMembers = SAMPLE_MEMBERS.length;
  const totalContributions = SAMPLE_MEMBERS.reduce((sum, member) => sum + member.totalContributed, 0);

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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'contribution': return 'add-circle';
      case 'withdrawal': return 'remove-circle';
      case 'investment': return 'trending-up';
      case 'yield': return 'star';
      default: return 'swap-horiz';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'contribution': return Colors.success;
      case 'withdrawal': return Colors.error;
      case 'investment': return ChatTheme.sendBubbleBackground;
      case 'yield': return Colors.warning;
      default: return ChatTheme.textSecondary;
    }
  };

  const renderWalletOverview = () => (
    <ScrollView style={styles.sectionContent}>
      {/* Total Balance Card */}
      <Card style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Typography variant="h6" color="textSecondary">
            Total Group Balance
          </Typography>
          <TouchableOpacity>
            <MaterialIcons name="refresh" size={20} color={ChatTheme.textSecondary} />
          </TouchableOpacity>
        </View>
        <Typography variant="h1" style={styles.balanceAmount}>
          {formatCurrency(totalValue)}
        </Typography>
        <View style={styles.balanceStats}>
          <View style={styles.balanceStat}>
            <Typography variant="caption" color="textSecondary">24h Change</Typography>
            <Typography variant="body2" style={{ color: Colors.success }}>
              +$234.50 (+2.1%)
            </Typography>
          </View>
          <View style={styles.balanceStat}>
            <Typography variant="caption" color="textSecondary">Members</Typography>
            <Typography variant="body2">{totalMembers}</Typography>
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
            <TouchableOpacity style={styles.actionButton} onPress={onPropose}>
              <MaterialIcons name="lightbulb" size={32} color={Colors.warning} />
              <Typography variant="body2" style={styles.actionText}>Propose</Typography>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={onWithdraw}>
            <MaterialIcons name="account-balance-wallet" size={32} color={Colors.error} />
            <Typography variant="body2" style={styles.actionText}>Withdraw</Typography>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="analytics" size={32} color={ChatTheme.textSecondary} />
            <Typography variant="body2" style={styles.actionText}>Analytics</Typography>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Token Holdings */}
      <Card style={styles.tokensCard}>
        <Typography variant="h6" style={styles.sectionTitle}>
          Token Holdings
        </Typography>
        {SAMPLE_TOKENS.map((token) => (
          <View key={token.symbol} style={styles.tokenItem}>
            <View style={styles.tokenIcon}>
              <MaterialIcons name={token.icon as any} size={24} color={ChatTheme.sendBubbleBackground} />
            </View>
            <View style={styles.tokenInfo}>
              <Typography variant="h6">{token.symbol}</Typography>
              <Typography variant="caption" color="textSecondary">{token.name}</Typography>
            </View>
            <View style={styles.tokenBalance}>
              <Typography variant="h6">{formatCurrency(token.value)}</Typography>
              <Typography 
                variant="caption" 
                style={{ color: token.change24h >= 0 ? Colors.success : Colors.error }}
              >
                {token.change24h >= 0 ? '+' : ''}{token.change24h}%
              </Typography>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  const renderTransactionItem = ({ item }: { item: GroupTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <MaterialIcons 
          name={getTransactionIcon(item.type) as any} 
          size={20} 
          color={getTransactionColor(item.type)} 
        />
      </View>
      <View style={styles.transactionInfo}>
        <Typography variant="h6">{item.description}</Typography>
        <Typography variant="caption" color="textSecondary">
          {item.member.name} • {formatTimestamp(item.timestamp)}
        </Typography>
      </View>
      <View style={styles.transactionAmount}>
        <Typography variant="h6" style={{ 
          color: item.type === 'contribution' || item.type === 'yield' ? Colors.success : Colors.error 
        }}>
          {item.type === 'contribution' || item.type === 'yield' ? '+' : '-'}
          {formatCurrency(item.amount)}
        </Typography>
        <View style={[styles.statusBadge, { 
          backgroundColor: item.status === 'completed' ? Colors.success : 
                          item.status === 'pending' ? Colors.warning : Colors.error 
        }]}>
          <Typography variant="caption" style={styles.statusText}>
            {item.status}
          </Typography>
        </View>
      </View>
    </View>
  );

  const renderTransactions = () => (
    <View style={styles.sectionContent}>
      <FlatList
        data={SAMPLE_TRANSACTIONS}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );

  const renderMemberItem = ({ item }: { item: MemberContribution }) => (
    <View style={styles.memberItem}>
      <Avatar name={item.name} imageUrl={item.avatar} size="medium" />
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Typography variant="h6">{item.name}</Typography>
          <View style={[styles.memberStatus, { 
            backgroundColor: item.status === 'active' ? Colors.success : Colors.warning 
          }]}>
            <Typography variant="caption" style={styles.statusText}>
              {item.status}
            </Typography>
          </View>
        </View>
        <Typography variant="caption" color="textSecondary">
          Last contribution: {formatTimestamp(item.lastContribution)}
        </Typography>
      </View>
      <View style={styles.memberStats}>
        <Typography variant="h6">{formatCurrency(item.totalContributed)}</Typography>
        <Typography variant="caption" color="textSecondary">
          {item.percentage}% of total
        </Typography>
      </View>
    </View>
  );

  const renderMembers = () => (
    <View style={styles.sectionContent}>
      <Card style={styles.membersCard}>
        <View style={styles.membersHeader}>
          <Typography variant="h6">Member Contributions</Typography>
          <Typography variant="body2" color="textSecondary">
            Total: {formatCurrency(totalContributions)}
          </Typography>
        </View>
        
        <FlatList
          data={SAMPLE_MEMBERS}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </Card>
    </View>
  );

  const renderSectionSelector = () => (
    <View style={styles.sectionSelector}>
      {[
        { id: 'overview', title: 'Overview', icon: 'dashboard' },
        { id: 'transactions', title: 'Activity', icon: 'history' },
        { id: 'members', title: 'Members', icon: 'group' },
      ].map((section) => (
        <TouchableOpacity
          key={section.id}
          style={[
            styles.sectionTab,
            activeSection === section.id && styles.activeSectionTab
          ]}
          onPress={() => setActiveSection(section.id as any)}
        >
          <MaterialIcons
            name={section.icon as any}
            size={20}
            color={activeSection === section.id ? ChatTheme.sendBubbleBackground : ChatTheme.textSecondary}
          />
          <Typography
            variant="caption"
            style={[
              styles.sectionTabTitle,
              activeSection === section.id && styles.activeSectionTabTitle
            ]}
          >
            {section.title}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderWalletOverview();
      case 'transactions': return renderTransactions();
      case 'members': return renderMembers();
      default: return renderWalletOverview();
    }
  };

  return (
    <View style={styles.container}>
      {renderSectionSelector()}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatTheme.background1,
  },
  sectionSelector: {
    flexDirection: 'row',
    backgroundColor: ChatTheme.background1,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
    paddingHorizontal: Spacing.lg,
  },
  sectionTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeSectionTab: {
    borderBottomColor: ChatTheme.sendBubbleBackground,
  },
  sectionTabTitle: {
    marginTop: Spacing.xs,
    color: ChatTheme.textSecondary,
  },
  activeSectionTabTitle: {
    color: ChatTheme.sendBubbleBackground,
    fontWeight: '500',
  },
  sectionContent: {
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
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: ChatTheme.background3,
    minWidth: 70,
  },
  actionText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  tokensCard: {
    marginBottom: Spacing.md,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ChatTheme.background3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
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
  transactionAmount: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  statusText: {
    color: 'white',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  separator: {
    height: 1,
    backgroundColor: ChatTheme.border,
    marginLeft: 56,
  },
  membersCard: {
    paddingVertical: Spacing.md,
  },
  membersHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
    marginBottom: Spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  memberInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  memberStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  memberStats: {
    alignItems: 'flex-end',
  },
});