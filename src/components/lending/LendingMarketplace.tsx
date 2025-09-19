import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { LoanRequest, LoanFilter } from '../../types/lending';

interface LendingMarketplaceProps {
  onLoanSelect: (loan: LoanRequest) => void;
  onCreateRequest: () => void;
}

// Mock loan data
const MOCK_LOANS: LoanRequest[] = [
  {
    id: '1',
    borrower: {
      id: 'user_1',
      name: 'Sarah Johnson',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      trustBadge: 'verified',
      region: 'Lagos, Nigeria',
      joinDate: 'March 2024',
    },
    amount: 5000,
    currency: 'USD',
    term: 12,
    proposedAPR: 8.5,
    type: 'collateralized',
    collateral: {
      id: '1',
      type: 'crypto',
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 2.5,
      currentValue: 8500,
      ltvRatio: 0.7,
      liquidationThreshold: 0.85,
      icon: 'currency-bitcoin',
    },
    status: 'open',
    creditScore: {
      trustPercentage: 92,
      bricksCount: 4500,
      loanHistory: [],
      kycLevel: 'verified',
      defaultRate: 0,
      totalLoansCount: 5,
      avgRepaymentTime: 25,
    },
    purpose: 'Property investment expansion in Lagos mainland',
    requestedAmount: 5000,
    fundedAmount: 0,
    lenders: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    riskLevel: 'low',
    platformFee: 2.5,
  },
  {
    id: '2',
    borrower: {
      id: 'user_2',
      name: 'Michael Chen',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      trustBadge: 'premium',
      region: 'Abuja, Nigeria',
      joinDate: 'January 2024',
    },
    amount: 15000,
    currency: 'USD',
    term: 24,
    proposedAPR: 12.0,
    type: 'uncollateralized',
    status: 'open',
    creditScore: {
      trustPercentage: 85,
      bricksCount: 7200,
      loanHistory: [],
      kycLevel: 'premium',
      defaultRate: 0,
      totalLoansCount: 8,
      avgRepaymentTime: 28,
    },
    purpose: 'Business expansion - property management services',
    requestedAmount: 15000,
    fundedAmount: 3500,
    lenders: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    riskLevel: 'medium',
    platformFee: 3.0,
  },
  {
    id: '3',
    borrower: {
      id: 'user_3',
      name: 'Emma Rodriguez',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
      trustBadge: 'agent',
      region: 'Port Harcourt, Nigeria',
      joinDate: 'February 2024',
    },
    amount: 8500,
    currency: 'USD',
    term: 18,
    proposedAPR: 9.2,
    type: 'collateralized',
    collateral: {
      id: '2',
      type: 'property_token',
      symbol: 'VIC',
      name: 'Victoria Island Property',
      amount: 75,
      currentValue: 15000,
      ltvRatio: 0.6,
      liquidationThreshold: 0.8,
      icon: 'home',
    },
    status: 'open',
    creditScore: {
      trustPercentage: 88,
      bricksCount: 5800,
      loanHistory: [],
      kycLevel: 'verified',
      defaultRate: 0,
      totalLoansCount: 3,
      avgRepaymentTime: 22,
    },
    purpose: 'Real estate portfolio diversification',
    requestedAmount: 8500,
    fundedAmount: 2100,
    lenders: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    riskLevel: 'low',
    platformFee: 2.5,
  },
];

interface LendingMarketplaceProps {
  onLoanSelect: (loan: LoanRequest) => void;
  onCreateRequest: () => void;
  onBack?: () => void;
}

export const LendingMarketplace: React.FC<LendingMarketplaceProps> = ({
  onLoanSelect,
  onCreateRequest,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'collateralized' | 'uncollateralized'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'amount' | 'apr'>('newest');

  const filteredLoans = useMemo(() => {
    let loans = MOCK_LOANS.filter(loan => {
      const matchesSearch = loan.borrower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           loan.purpose.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || loan.type === activeFilter;
      return matchesSearch && matchesFilter;
    });

    // Sort loans
    loans.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'amount':
          return b.amount - a.amount;
        case 'apr':
          return a.proposedAPR - b.proposedAPR;
        default:
          return 0;
      }
    });

    return loans;
  }, [searchQuery, activeFilter, sortBy]);

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <MaterialIcons name="search" size={20} color={Colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search loans..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.activeFilterChip]}
          onPress={() => setActiveFilter('all')}
        >
          <Typography 
            variant="caption" 
            style={[styles.filterChipText, activeFilter === 'all' && styles.activeFilterChipText]}
          >
            All Loans
          </Typography>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'collateralized' && styles.activeFilterChip]}
          onPress={() => setActiveFilter('collateralized')}
        >
          <Typography 
            variant="caption" 
            style={[styles.filterChipText, activeFilter === 'collateralized' && styles.activeFilterChipText]}
          >
            Secured
          </Typography>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'uncollateralized' && styles.activeFilterChip]}
          onPress={() => setActiveFilter('uncollateralized')}
        >
          <Typography 
            variant="caption" 
            style={[styles.filterChipText, activeFilter === 'uncollateralized' && styles.activeFilterChipText]}
          >
            Unsecured
          </Typography>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.sortContainer}>
        <Typography variant="caption" color="textSecondary">Sort by:</Typography>
        <TouchableOpacity
          style={styles.sortOption}
          onPress={() => setSortBy(sortBy === 'newest' ? 'amount' : sortBy === 'amount' ? 'apr' : 'newest')}
        >
          <Typography variant="caption" color="primary" style={styles.sortText}>
            {sortBy === 'newest' ? 'Newest' : sortBy === 'amount' ? 'Amount' : 'Interest Rate'}
          </Typography>
          <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTrustBadge = (badge: string | null) => {
    if (!badge) return null;
    
    const badgeConfig = {
      verified: { icon: 'verified', color: Colors.success },
      premium: { icon: 'star', color: Colors.secondary },
      agent: { icon: 'business', color: Colors.primary },
    };
    
    const config = badgeConfig[badge as keyof typeof badgeConfig];
    if (!config) return null;
    
    return (
      <View style={[styles.trustBadge, { backgroundColor: config.color + '20' }]}>
        <MaterialIcons name={config.icon as any} size={12} color={config.color} />
      </View>
    );
  };

  const renderLoanCard = ({ item: loan }: { item: LoanRequest }) => {
    const fundingProgress = loan.fundedAmount / loan.requestedAmount;
    const monthlyPayment = Math.round(loan.amount * (1 + loan.proposedAPR / 100) / loan.term);
    const timeAgo = Math.round((Date.now() - loan.createdAt.getTime()) / (1000 * 60 * 60));
    
    return (
      <TouchableOpacity onPress={() => onLoanSelect(loan)}>
        <Card style={styles.loanCard}>
          {/* Header with borrower info */}
          <View style={styles.loanHeader}>
            <View style={styles.borrowerInfo}>
              <View style={styles.borrowerAvatarContainer}>
                {loan.borrower.avatar ? (
                  <Image source={{ uri: loan.borrower.avatar }} style={styles.borrowerAvatar} />
                ) : (
                  <View style={styles.borrowerAvatar}>
                    <Typography variant="caption" style={styles.borrowerAvatarText}>
                      {loan.borrower.name.split(' ').map(n => n[0]).join('')}
                    </Typography>
                  </View>
                )}
                {renderTrustBadge(loan.borrower.trustBadge)}
              </View>
              
              <View style={styles.borrowerDetails}>
                <View style={styles.borrowerNameRow}>
                  <Typography variant="h6" style={styles.borrowerName}>
                    {loan.borrower.name}
                  </Typography>
                  <View style={[styles.riskBadge, styles[`${loan.riskLevel}Risk`]]}>
                    <Typography variant="caption" style={styles.riskText}>
                      {loan.riskLevel.toUpperCase()}
                    </Typography>
                  </View>
                </View>
                <Typography variant="caption" color="textSecondary">
                  {loan.borrower.region} • {timeAgo}h ago
                </Typography>
              </View>
            </View>
            
            <View style={styles.loanTypeIndicator}>
              <MaterialIcons 
                name={loan.type === 'collateralized' ? 'security' : 'person'} 
                size={16} 
                color={loan.type === 'collateralized' ? Colors.success : Colors.warning} 
              />
            </View>
          </View>

          {/* Loan amount and terms */}
          <View style={styles.loanAmount}>
            <Typography variant="h4" style={styles.amountText}>
              ${loan.amount.toLocaleString()} {loan.currency}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {loan.term} months • {loan.proposedAPR}% APR
            </Typography>
          </View>

          {/* Purpose */}
          <Typography variant="body2" style={styles.loanPurpose} numberOfLines={2}>
            {loan.purpose}
          </Typography>

          {/* Collateral info for secured loans */}
          {loan.collateral && (
            <View style={styles.collateralInfo}>
              <MaterialIcons name="security" size={16} color={Colors.success} />
              <Typography variant="caption" color="textSecondary" style={styles.collateralText}>
                Secured by {loan.collateral.amount} {loan.collateral.symbol} 
                (${loan.collateral.currentValue.toLocaleString()})
              </Typography>
            </View>
          )}

          {/* Funding progress */}
          <View style={styles.fundingSection}>
            <View style={styles.fundingHeader}>
              <Typography variant="caption" color="textSecondary">
                Funding Progress
              </Typography>
              <Typography variant="caption" style={styles.fundingAmount}>
                ${loan.fundedAmount.toLocaleString()} / ${loan.requestedAmount.toLocaleString()}
              </Typography>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${Math.min(fundingProgress * 100, 100)}%` }]} 
              />
            </View>
            <Typography variant="caption" color="textSecondary">
              {Math.round(fundingProgress * 100)}% funded
            </Typography>
          </View>

          {/* Credit score and stats */}
          <View style={styles.creditSection}>
            <View style={styles.creditItem}>
              <Typography variant="caption" color="textSecondary">Trust Score</Typography>
              <Typography variant="caption" color="success" style={styles.creditValue}>
                {loan.creditScore.trustPercentage}%
              </Typography>
            </View>
            <View style={styles.creditItem}>
              <Typography variant="caption" color="textSecondary">Loans</Typography>
              <Typography variant="caption" style={styles.creditValue}>
                {loan.creditScore.totalLoansCount}
              </Typography>
            </View>
            <View style={styles.creditItem}>
              <Typography variant="caption" color="textSecondary">Avg Repay</Typography>
              <Typography variant="caption" style={styles.creditValue}>
                {loan.creditScore.avgRepaymentTime}d
              </Typography>
            </View>
            <View style={styles.creditItem}>
              <Typography variant="caption" color="textSecondary">Monthly</Typography>
              <Typography variant="caption" color="primary" style={styles.creditValue}>
                ~${monthlyPayment}
              </Typography>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="search-off" size={48} color={Colors.gray400} />
      <Typography variant="h6" style={styles.emptyTitle}>
        No loans found
      </Typography>
      <Typography variant="body2" color="textSecondary" style={styles.emptyText}>
        Try adjusting your search or filters
      </Typography>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Typography variant="h3">Lending Market</Typography>
          <Typography variant="body2" color="textSecondary">
            {filteredLoans.length} loans available
          </Typography>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={onCreateRequest}>
          <MaterialIcons name="add" size={24} color={Colors.background} />
        </TouchableOpacity>
      </View>

      {renderSearchAndFilters()}

      {/* Stats Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Typography variant="caption" color="textSecondary">Total Available</Typography>
          <Typography variant="h6" color="primary">$128,500</Typography>
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption" color="textSecondary">Avg APR</Typography>
          <Typography variant="h6" color="secondary">9.8%</Typography>
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption" color="textSecondary">Funded Today</Typography>
          <Typography variant="h6" color="success">$45,200</Typography>
        </Card>
      </ScrollView>

      {/* Loans List */}
      {filteredLoans.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredLoans}
          keyExtractor={(item) => item.id}
          renderItem={renderLoanCard}
          contentContainerStyle={styles.loansList}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.sm,
  },
  filtersContainer: {
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    marginRight: Spacing.sm,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textSecondary,
  },
  activeFilterChipText: {
    color: Colors.background,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    marginRight: Spacing.xs,
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginRight: Spacing.md,
    minWidth: 100,
    alignItems: 'center',
  },
  loansList: {
    paddingHorizontal: Spacing.lg,
  },
  loanCard: {
    marginBottom: Spacing.md,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  borrowerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  borrowerAvatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  borrowerAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowerAvatarText: {
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  trustBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  borrowerDetails: {
    flex: 1,
  },
  borrowerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  borrowerName: {
    fontWeight: '600',
  },
  riskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  lowRisk: {
    backgroundColor: Colors.success + '20',
  },
  mediumRisk: {
    backgroundColor: Colors.warning + '20',
  },
  highRisk: {
    backgroundColor: Colors.error + '20',
  },
  riskText: {
    fontWeight: '600',
    fontSize: 10,
  },
  loanTypeIndicator: {
    padding: Spacing.sm,
  },
  loanAmount: {
    marginBottom: Spacing.md,
  },
  amountText: {
    fontWeight: '700',
    color: Colors.primary,
  },
  loanPurpose: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  collateralInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.success + '10',
    borderRadius: BorderRadius.sm,
  },
  collateralText: {
    marginLeft: Spacing.sm,
  },
  fundingSection: {
    marginBottom: Spacing.md,
  },
  fundingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  fundingAmount: {
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  creditSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  creditItem: {
    alignItems: 'center',
  },
  creditValue: {
    fontWeight: '600',
    marginTop: Spacing.xs / 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginVertical: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
  },
});