import { 
  Group, 
  NormalGroup, 
  ContributionGroup, 
  InvestmentGroup, 
  SavingsGroup, 
  BusinessGroup, 
  DAOGroup,
  GroupMember,
  GroupWallet,
  Investment 
} from '../types/groupTypes';

// Mock Members
const MOCK_MEMBERS: GroupMember[] = [
  {
    id: 'member_1',
    name: 'You',
    role: 'owner',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    isOnline: true,
    walletAddress: '0x1234...5678',
    contributionTotal: 2500,
    votingPower: 25,
  },
  {
    id: 'member_2',
    name: 'Sarah Anderson',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    role: 'admin',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
    isOnline: true,
    walletAddress: '0x2345...6789',
    contributionTotal: 1800,
    votingPower: 18,
  },
  {
    id: 'member_3',
    name: 'Michael Roberts',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    role: 'treasurer',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
    isOnline: false,
    lastSeen: '2 hours ago',
    walletAddress: '0x3456...7890',
    contributionTotal: 2200,
    votingPower: 22,
  },
  {
    id: 'member_4',
    name: 'Emma Thompson',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    role: 'member',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    isOnline: true,
    walletAddress: '0x4567...8901',
    contributionTotal: 1500,
    votingPower: 15,
  },
  {
    id: 'member_5',
    name: 'David Chen',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    role: 'member',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    isOnline: false,
    lastSeen: '1 day ago',
    walletAddress: '0x5678...9012',
    contributionTotal: 1200,
    votingPower: 12,
  },
  {
    id: 'member_6',
    name: 'Lisa Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    role: 'member',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    isOnline: true,
    walletAddress: '0x6789...0123',
    contributionTotal: 800,
    votingPower: 8,
  },
];

// Mock Wallets
const createMockWallet = (groupId: string, balance: { [token: string]: number }): GroupWallet => ({
  id: `wallet_${groupId}`,
  groupId,
  contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
  chainId: 1,
  signatories: MOCK_MEMBERS.slice(0, 5).map(m => m.walletAddress!),
  threshold: 3,
  balance,
  totalValue: Object.values(balance).reduce((sum, value) => sum + value, 0),
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
  lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2),
  status: 'active',
  transactionCount: 45,
});

// Mock Investments
const MOCK_INVESTMENTS: Investment[] = [
  {
    id: 'invest_1',
    name: 'Downtown Commercial Property',
    type: 'real-estate',
    amount: 5000,
    currentValue: 5250,
    purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    yield: 5.0,
    riskLevel: 'medium',
    status: 'active',
  },
  {
    id: 'invest_2',
    name: 'Tech Stock Portfolio',
    type: 'stocks',
    amount: 2000,
    currentValue: 2180,
    purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
    yield: 9.0,
    riskLevel: 'high',
    status: 'active',
  },
  {
    id: 'invest_3',
    name: 'Ethereum Staking',
    type: 'crypto',
    amount: 1500,
    currentValue: 1650,
    purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    yield: 10.0,
    riskLevel: 'high',
    status: 'active',
  },
];

// 1. Normal Chat Group
export const NORMAL_GROUP: NormalGroup = {
  id: 'group_normal_1',
  name: 'Family Chat',
  description: 'Our family group for staying connected and sharing daily updates',
  avatar: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=100&h=100&fit=crop&crop=face',
  type: 'normal',
  privacy: 'private',
  memberCount: 8,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
  createdBy: 'member_1',
  isActive: true,
  features: {
    messaging: true,
    fileSharing: true,
    voiceCall: true,
    videoCall: false,
  },
  settings: {
    allowMembersToAddOthers: false,
    onlyAdminsCanSend: false,
    disappearingMessages: true,
    messageRetention: 30,
  },
};

// 2. Contribution Group
export const CONTRIBUTION_GROUP: ContributionGroup = {
  id: 'group_contrib_1',
  name: 'Monthly Savings Circle',
  description: 'We save together every month for our collective financial goals',
  avatar: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&h=100&fit=crop',
  type: 'contribution',
  privacy: 'private',
  memberCount: 12,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
  createdBy: 'member_2',
  isActive: true,
  wallet: createMockWallet('group_contrib_1', { USDC: 3600, ETH: 0.5 }),
  features: {
    messaging: true,
    contributions: true,
    goalTracking: true,
    analytics: true,
  },
  contributionSettings: {
    minimumContribution: 50,
    contributionFrequency: 'monthly',
    contributionToken: 'USDC',
    goalAmount: 12000,
    goalDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
    autoContribution: true,
  },
  stats: {
    totalContributed: 3600,
    currentBalance: 3650,
    goalProgress: 30.4,
    averageContribution: 300,
  },
};

// 3. Investment Group
export const INVESTMENT_GROUP: InvestmentGroup = {
  id: 'group_invest_1',
  name: 'Real Estate Investors Club',
  description: 'Pooling resources to invest in fractional real estate opportunities',
  avatar: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=100&h=100&fit=crop',
  type: 'investment',
  privacy: 'private',
  memberCount: 6,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120),
  createdBy: 'member_1',
  isActive: true,
  wallet: createMockWallet('group_invest_1', { USDC: 12500, ETH: 2.5, WBTC: 0.1 }),
  features: {
    messaging: true,
    contributions: true,
    investments: true,
    proposals: true,
    voting: true,
    analytics: true,
    yieldDistribution: true,
  },
  investmentSettings: {
    riskTolerance: 'medium',
    investmentFocus: 'real-estate',
    minimumInvestment: 500,
    votingThreshold: 60,
    proposalRequiredApprovals: 4,
  },
  portfolio: {
    totalValue: 18500,
    investments: MOCK_INVESTMENTS,
    yield24h: 125.50,
    yieldTotal: 1580,
    riskScore: 6.5,
  },
};

// 4. Savings Group
export const SAVINGS_GROUP: SavingsGroup = {
  id: 'group_savings_1',
  name: 'Emergency Fund Squad',
  description: 'Building our emergency funds together with discipline and accountability',
  avatar: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=100&h=100&fit=crop',
  type: 'savings',
  privacy: 'private',
  memberCount: 8,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
  createdBy: 'member_4',
  isActive: true,
  wallet: createMockWallet('group_savings_1', { USDC: 5200 }),
  features: {
    messaging: true,
    contributions: true,
    goalTracking: true,
    savings: true,
    analytics: true,
  },
  savingsSettings: {
    savingsGoal: 24000,
    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    savingsFrequency: 'weekly',
    penaltyForEarlyWithdrawal: 10,
    interestRate: 4.5,
    compoundingFrequency: 'monthly',
  },
  progress: {
    currentAmount: 5200,
    progressPercentage: 21.7,
    projectedCompletion: new Date(Date.now() + 1000 * 60 * 60 * 24 * 320),
    streak: 12,
    totalInterestEarned: 85.50,
  },
};

// 5. Business Group
export const BUSINESS_GROUP: BusinessGroup = {
  id: 'group_business_1',
  name: 'TechStart Collective',
  description: 'Collaborative workspace for our startup venture and shared business expenses',
  avatar: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=100&h=100&fit=crop',
  type: 'business',
  privacy: 'private',
  memberCount: 5,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200),
  createdBy: 'member_3',
  isActive: true,
  wallet: createMockWallet('group_business_1', { USDC: 8500, ETH: 1.2 }),
  features: {
    messaging: true,
    contributions: true,
    expenses: true,
    revenue: true,
    invoicing: true,
    analytics: true,
    taxReporting: true,
  },
  businessSettings: {
    businessType: 'Technology Startup',
    registrationNumber: 'REG123456789',
    taxId: 'TAX987654321',
    defaultCurrency: 'USDC',
    fiscalYearStart: new Date(2024, 0, 1),
    expenseCategories: ['Development', 'Marketing', 'Operations', 'Legal', 'Equipment'],
    revenueStreams: ['SaaS Subscriptions', 'Consulting', 'API Usage'],
  },
  financials: {
    monthlyRevenue: 15500,
    monthlyExpenses: 12200,
    profit: 3300,
    cashFlow: 8500,
    outstandingInvoices: 4200,
  },
};

// 6. DAO Group
export const DAO_GROUP: DAOGroup = {
  id: 'group_dao_1',
  name: 'DeFi Innovation DAO',
  description: 'Decentralized autonomous organization focused on DeFi protocol development and governance',
  avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop',
  type: 'dao',
  privacy: 'public',
  memberCount: 156,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
  createdBy: 'member_1',
  isActive: true,
  wallet: createMockWallet('group_dao_1', { 
    USDC: 125000, 
    ETH: 50, 
    WBTC: 2.5, 
    DAI: 75000,
    DFI: 1000000 // DAO token
  }),
  features: {
    messaging: true,
    governance: true,
    proposals: true,
    voting: true,
    treasury: true,
    tokenManagement: true,
    analytics: true,
  },
  governanceSettings: {
    governanceToken: 'DFI',
    votingPeriod: 7,
    quorum: 15,
    proposalThreshold: 10000,
    executionDelay: 3,
    vetoRights: ['0x1234...dao1', '0x5678...dao2'],
  },
  treasury: {
    totalValue: 485000,
    tokens: {
      USDC: 125000,
      ETH: 175000,
      WBTC: 112500,
      DAI: 75000,
      DFI: 50000,
    },
    lockedValue: 285000,
    liquidValue: 200000,
  },
};

// Additional Groups for variety
export const STUDY_GROUP: NormalGroup = {
  id: 'group_normal_2',
  name: 'Med School Study Group',
  description: 'Supporting each other through medical school with study sessions and notes sharing',
  avatar: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=100&h=100&fit=crop',
  type: 'normal',
  privacy: 'private',
  memberCount: 15,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200),
  createdBy: 'member_2',
  isActive: true,
  features: {
    messaging: true,
    fileSharing: true,
    voiceCall: false,
    videoCall: true,
  },
  settings: {
    allowMembersToAddOthers: true,
    onlyAdminsCanSend: false,
    disappearingMessages: false,
    messageRetention: 730,
  },
};

export const VACATION_SAVINGS: ContributionGroup = {
  id: 'group_contrib_2',
  name: 'Bali Trip 2025',
  description: 'Saving together for our dream vacation to Bali next year!',
  avatar: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=100&h=100&fit=crop',
  type: 'contribution',
  privacy: 'private',
  memberCount: 6,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  createdBy: 'member_5',
  isActive: true,
  wallet: createMockWallet('group_contrib_2', { USDC: 1800 }),
  features: {
    messaging: true,
    contributions: true,
    goalTracking: true,
    analytics: true,
  },
  contributionSettings: {
    minimumContribution: 100,
    contributionFrequency: 'monthly',
    contributionToken: 'USDC',
    goalAmount: 9000,
    goalDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 300),
    autoContribution: false,
  },
  stats: {
    totalContributed: 1800,
    currentBalance: 1800,
    goalProgress: 20.0,
    averageContribution: 300,
  },
};

export const CRYPTO_TRADERS: InvestmentGroup = {
  id: 'group_invest_2',
  name: 'Crypto Alpha Hunters',
  description: 'High-risk crypto trading group focused on DeFi yields and altcoin gems',
  avatar: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=100&h=100&fit=crop',
  type: 'investment',
  privacy: 'private',
  memberCount: 8,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 75),
  createdBy: 'member_6',
  isActive: true,
  wallet: createMockWallet('group_invest_2', { 
    USDC: 25000, 
    ETH: 8, 
    WBTC: 0.8,
    MATIC: 15000,
    LINK: 500
  }),
  features: {
    messaging: true,
    contributions: true,
    investments: true,
    proposals: true,
    voting: true,
    analytics: true,
    yieldDistribution: true,
  },
  investmentSettings: {
    riskTolerance: 'high',
    investmentFocus: 'crypto',
    minimumInvestment: 1000,
    votingThreshold: 75,
    proposalRequiredApprovals: 5,
  },
  portfolio: {
    totalValue: 85000,
    investments: [
      {
        id: 'crypto_1',
        name: 'DeFi Yield Farming Pool',
        type: 'crypto',
        amount: 15000,
        currentValue: 18500,
        purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        yield: 23.3,
        riskLevel: 'high',
        status: 'active',
      },
      {
        id: 'crypto_2',
        name: 'Layer 2 Tokens Portfolio',
        type: 'crypto',
        amount: 12000,
        currentValue: 14200,
        purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
        yield: 18.3,
        riskLevel: 'high',
        status: 'active',
      },
    ],
    yield24h: 285.75,
    yieldTotal: 4200,
    riskScore: 9.2,
  },
};

// Collection of all mock groups
export const MOCK_GROUPS: Group[] = [
  NORMAL_GROUP,
  STUDY_GROUP,
  CONTRIBUTION_GROUP,
  VACATION_SAVINGS,
  INVESTMENT_GROUP,
  CRYPTO_TRADERS,
  SAVINGS_GROUP,
  BUSINESS_GROUP,
  DAO_GROUP,
];

// Helper function to get groups by type
export const getGroupsByType = (type: Group['type']): Group[] => {
  return MOCK_GROUPS.filter(group => group.type === type);
};

// Helper function to get group by ID
export const getGroupById = (id: string): Group | undefined => {
  return MOCK_GROUPS.find(group => group.id === id);
};

// Helper function to get groups that have wallets
export const getGroupsWithWallets = (): Group[] => {
  return MOCK_GROUPS.filter(group => 'wallet' in group && group.wallet);
};

// Mock Members for each group
export const getGroupMembers = (groupId: string): GroupMember[] => {
  // Return different subsets based on group type and size
  const group = getGroupById(groupId);
  if (!group) return [];
  
  const memberCount = Math.min(group.memberCount, MOCK_MEMBERS.length);
  return MOCK_MEMBERS.slice(0, memberCount);
};

export default MOCK_GROUPS;