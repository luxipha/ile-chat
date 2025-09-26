// Group Types and Interfaces for ilePay Group System

export type GroupType = 'normal' | 'contribution' | 'investment' | 'savings' | 'business' | 'dao';

export interface BaseGroup {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  type: GroupType;
  privacy: 'public' | 'private';
  memberCount: number;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'treasurer' | 'member' | 'observer';
  joinedAt: Date;
  isOnline?: boolean;
  lastSeen?: string;
  walletAddress?: string;
  contributionTotal?: number;
  votingPower?: number;
}

// Normal Chat Group - Basic messaging
export interface NormalGroup extends BaseGroup {
  type: 'normal';
  features: {
    messaging: true;
    fileSharing: boolean;
    voiceCall: boolean;
    videoCall: boolean;
  };
  settings: {
    allowMembersToAddOthers: boolean;
    onlyAdminsCanSend: boolean;
    disappearingMessages: boolean;
    messageRetention: number; // days
  };
}

// Contribution Group - Regular pool contributions
export interface ContributionGroup extends BaseGroup {
  type: 'contribution';
  wallet?: GroupWallet;
  features: {
    messaging: true;
    contributions: true;
    goalTracking: true;
    analytics: true;
  };
  contributionSettings: {
    minimumContribution: number;
    contributionFrequency: 'weekly' | 'monthly' | 'quarterly';
    contributionToken: string;
    goalAmount?: number;
    goalDeadline?: Date;
    autoContribution: boolean;
  };
  stats: {
    totalContributed: number;
    currentBalance: number;
    goalProgress: number; // percentage
    averageContribution: number;
  };
}

// Investment Group - Property/Asset investments
export interface InvestmentGroup extends BaseGroup {
  type: 'investment';
  wallet: GroupWallet;
  features: {
    messaging: true;
    contributions: true;
    investments: true;
    proposals: true;
    voting: true;
    analytics: true;
    yieldDistribution: true;
  };
  investmentSettings: {
    riskTolerance: 'low' | 'medium' | 'high';
    investmentFocus: 'real-estate' | 'stocks' | 'crypto' | 'mixed';
    minimumInvestment: number;
    votingThreshold: number; // percentage needed to pass proposals
    proposalRequiredApprovals: number;
  };
  portfolio: {
    totalValue: number;
    investments: Investment[];
    yield24h: number;
    yieldTotal: number;
    riskScore: number;
  };
}

// Savings Group - Goal-based saving
export interface SavingsGroup extends BaseGroup {
  type: 'savings';
  wallet?: GroupWallet;
  features: {
    messaging: true;
    contributions: true;
    goalTracking: true;
    savings: true;
    analytics: true;
  };
  savingsSettings: {
    savingsGoal: number;
    targetDate: Date;
    savingsFrequency: 'daily' | 'weekly' | 'monthly';
    penaltyForEarlyWithdrawal: number; // percentage
    interestRate: number; // annual percentage
    compoundingFrequency: 'daily' | 'monthly' | 'quarterly';
  };
  progress: {
    currentAmount: number;
    progressPercentage: number;
    projectedCompletion: Date;
    streak: number; // consecutive contributions
    totalInterestEarned: number;
  };
}

// Business Group - Small business collaboration
export interface BusinessGroup extends BaseGroup {
  type: 'business';
  wallet: GroupWallet;
  features: {
    messaging: true;
    contributions: true;
    expenses: true;
    revenue: true;
    invoicing: true;
    analytics: true;
    taxReporting: true;
  };
  businessSettings: {
    businessType: string;
    registrationNumber?: string;
    taxId?: string;
    defaultCurrency: string;
    fiscalYearStart: Date;
    expenseCategories: string[];
    revenueStreams: string[];
  };
  financials: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    profit: number;
    cashFlow: number;
    outstandingInvoices: number;
  };
}

// DAO Group - Decentralized governance
export interface DAOGroup extends BaseGroup {
  type: 'dao';
  wallet: GroupWallet;
  features: {
    messaging: true;
    governance: true;
    proposals: true;
    voting: true;
    treasury: true;
    tokenManagement: true;
    analytics: true;
  };
  governanceSettings: {
    governanceToken: string;
    votingPeriod: number; // days
    quorum: number; // percentage
    proposalThreshold: number; // tokens needed to create proposal
    executionDelay: number; // days
    vetoRights: string[]; // addresses with veto power
  };
  treasury: {
    totalValue: number;
    tokens: { [symbol: string]: number };
    lockedValue: number;
    liquidValue: number;
  };
}

export type Group = NormalGroup | ContributionGroup | InvestmentGroup | SavingsGroup | BusinessGroup | DAOGroup;

// Group Wallet Interface
export interface GroupWallet {
  id: string;
  groupId: string;
  contractAddress: string;
  chainId: number;
  signatories: string[];
  threshold: number;
  balance: { [token: string]: number };
  totalValue: number;
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'paused' | 'frozen';
  transactionCount: number;
}

// Investment Interface
export interface Investment {
  id: string;
  name: string;
  type: 'real-estate' | 'stocks' | 'crypto' | 'bonds' | 'commodity';
  amount: number;
  currentValue: number;
  purchaseDate: Date;
  yield: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'sold' | 'pending';
}

// Group Creation Configuration
export interface GroupCreationConfig {
  type: GroupType;
  hasWallet: boolean;
  requiresKYC: boolean;
  minimumMembers: number;
  maximumMembers?: number;
  requiredFields: string[];
  optionalFields: string[];
  defaultSettings: any;
  features: string[];
  walletConfig?: {
    supportedTokens: string[];
    minimumThreshold: number;
    maximumThreshold: number;
    defaultThreshold: number;
    multiSigRequired: boolean;
  };
}

// Group Templates
export const GROUP_TEMPLATES: { [key in GroupType]: GroupCreationConfig } = {
  normal: {
    type: 'normal',
    hasWallet: false,
    requiresKYC: false,
    minimumMembers: 2,
    maximumMembers: 500,
    requiredFields: ['name', 'description'],
    optionalFields: ['avatar', 'tags'],
    defaultSettings: {
      allowMembersToAddOthers: true,
      onlyAdminsCanSend: false,
      disappearingMessages: false,
      messageRetention: 365,
    },
    features: ['messaging', 'fileSharing'],
  },
  contribution: {
    type: 'contribution',
    hasWallet: true,
    requiresKYC: false,
    minimumMembers: 2,
    maximumMembers: 50,
    requiredFields: ['name', 'description', 'contributionAmount', 'contributionFrequency'],
    optionalFields: ['goalAmount', 'goalDeadline', 'avatar'],
    defaultSettings: {
      minimumContribution: 10,
      contributionFrequency: 'monthly',
      contributionToken: 'USDC',
      autoContribution: false,
    },
    features: ['messaging', 'contributions', 'goalTracking', 'analytics'],
    walletConfig: {
      supportedTokens: ['USDC', 'APT', 'USDT', 'ETH'],
      minimumThreshold: 2,
      maximumThreshold: 10,
      defaultThreshold: 3,
      multiSigRequired: true,
    },
  },
  investment: {
    type: 'investment',
    hasWallet: true,
    requiresKYC: true,
    minimumMembers: 3,
    maximumMembers: 20,
    requiredFields: ['name', 'description', 'investmentFocus', 'riskTolerance', 'minimumInvestment'],
    optionalFields: ['avatar', 'investmentStrategy'],
    defaultSettings: {
      riskTolerance: 'medium',
      investmentFocus: 'real-estate',
      minimumInvestment: 100,
      votingThreshold: 60,
      proposalRequiredApprovals: 3,
    },
    features: ['messaging', 'contributions', 'investments', 'proposals', 'voting', 'analytics', 'yieldDistribution'],
    walletConfig: {
      supportedTokens: ['USDC', 'APT', 'USDT', 'ETH', 'WBTC'],
      minimumThreshold: 3,
      maximumThreshold: 15,
      defaultThreshold: 5,
      multiSigRequired: true,
    },
  },
  savings: {
    type: 'savings',
    hasWallet: true,
    requiresKYC: false,
    minimumMembers: 2,
    maximumMembers: 30,
    requiredFields: ['name', 'description', 'savingsGoal', 'targetDate', 'savingsFrequency'],
    optionalFields: ['avatar', 'interestRate'],
    defaultSettings: {
      savingsFrequency: 'monthly',
      penaltyForEarlyWithdrawal: 5,
      interestRate: 3,
      compoundingFrequency: 'monthly',
    },
    features: ['messaging', 'contributions', 'goalTracking', 'savings', 'analytics'],
    walletConfig: {
      supportedTokens: ['USDC', 'USDT'],
      minimumThreshold: 2,
      maximumThreshold: 8,
      defaultThreshold: 3,
      multiSigRequired: true,
    },
  },
  business: {
    type: 'business',
    hasWallet: true,
    requiresKYC: true,
    minimumMembers: 2,
    maximumMembers: 15,
    requiredFields: ['name', 'description', 'businessType', 'defaultCurrency'],
    optionalFields: ['registrationNumber', 'taxId', 'avatar'],
    defaultSettings: {
      defaultCurrency: 'USDC',
      fiscalYearStart: new Date(new Date().getFullYear(), 0, 1),
      expenseCategories: ['Operations', 'Marketing', 'Equipment', 'Salaries'],
      revenueStreams: ['Sales', 'Services', 'Licensing'],
    },
    features: ['messaging', 'contributions', 'expenses', 'revenue', 'invoicing', 'analytics', 'taxReporting'],
    walletConfig: {
      supportedTokens: ['USDC', 'APT', 'USDT', 'ETH'],
      minimumThreshold: 2,
      maximumThreshold: 10,
      defaultThreshold: 3,
      multiSigRequired: true,
    },
  },
  dao: {
    type: 'dao',
    hasWallet: true,
    requiresKYC: true,
    minimumMembers: 5,
    maximumMembers: 1000,
    requiredFields: ['name', 'description', 'governanceToken', 'votingPeriod', 'quorum'],
    optionalFields: ['avatar', 'constitution', 'website'],
    defaultSettings: {
      votingPeriod: 7,
      quorum: 10,
      proposalThreshold: 1000,
      executionDelay: 2,
      vetoRights: [],
    },
    features: ['messaging', 'governance', 'proposals', 'voting', 'treasury', 'tokenManagement', 'analytics'],
    walletConfig: {
      supportedTokens: ['USDC', 'APT', 'USDT', 'ETH', 'WBTC', 'DAI'],
      minimumThreshold: 5,
      maximumThreshold: 50,
      defaultThreshold: 7,
      multiSigRequired: true,
    },
  },
};

// Wallet Creation Status
export interface WalletCreationStatus {
  step: 'initializing' | 'deploying' | 'configuring' | 'testing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  txHash?: string;
  contractAddress?: string;
  estimatedTime?: number; // seconds
  error?: string;
}

// Group Creation Flow Steps
export type GroupCreationStep = 
  | 'type-selection'
  | 'basic-info'
  | 'member-setup'
  | 'wallet-config'
  | 'wallet-creation'
  | 'verification'
  | 'completion';

export interface GroupCreationFlow {
  currentStep: GroupCreationStep;
  completedSteps: GroupCreationStep[];
  groupData: Partial<Group>;
  walletCreationStatus?: WalletCreationStatus;
  errors: { [step: string]: string[] };
  canProceed: boolean;
}