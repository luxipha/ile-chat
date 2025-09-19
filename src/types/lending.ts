// Core lending system types and interfaces

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  trustBadge?: 'verified' | 'premium' | 'agent' | null;
  region: string;
  joinDate: string;
}

export interface CollateralAsset {
  id: string;
  type: 'crypto' | 'property_token';
  symbol: string;
  name: string;
  amount: number;
  currentValue: number; // USD value
  ltvRatio: number; // Loan-to-Value ratio (e.g., 0.7 for 70%)
  liquidationThreshold: number; // e.g., 0.85 for 85%
  icon: string;
}

export interface LoanHistoryItem {
  loanId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'defaulted' | 'current';
  completedAt?: Date;
  defaultedAt?: Date;
  repaymentRate: number; // 0-1 (1 = fully repaid on time)
}

export interface CreditScore {
  trustPercentage: number; // 0-100
  bricksCount: number;
  loanHistory: LoanHistoryItem[];
  kycLevel: 'basic' | 'verified' | 'premium';
  defaultRate: number; // 0-1 (0 = never defaulted)
  totalLoansCount: number;
  avgRepaymentTime: number; // days
}

export interface RepaymentSchedule {
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'defaulted';
  paidAt?: Date;
}

export interface LoanRequest {
  id: string;
  borrower: UserProfile;
  amount: number;
  currency: string;
  term: number; // months
  proposedAPR: number; // annual percentage rate
  type: 'collateralized' | 'uncollateralized';
  collateral?: CollateralAsset;
  status: 'draft' | 'open' | 'funded' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  creditScore: CreditScore;
  purpose: string; // description of what the loan is for
  maxLTV?: number; // maximum loan-to-value for collateralized loans
  
  // Funding details
  requestedAmount: number;
  fundedAmount: number;
  lenders: LoanLender[];
  
  // Timing
  createdAt: Date;
  fundedAt?: Date;
  dueDate?: Date;
  
  // Terms
  repaymentSchedule?: RepaymentSchedule[];
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high';
  platformFee: number; // percentage
}

export interface LoanLender {
  lender: UserProfile;
  amountFunded: number;
  fundedAt: Date;
  expectedReturn: number;
  actualReturn?: number;
}

export interface LoanOffer {
  id: string;
  loanRequestId: string;
  lender: UserProfile;
  offeredAmount: number;
  proposedAPR: number;
  message?: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
}

export interface LoanFilter {
  minAmount?: number;
  maxAmount?: number;
  maxAPR?: number;
  minTerm?: number;
  maxTerm?: number;
  loanType?: 'collateralized' | 'uncollateralized' | 'all';
  riskLevel?: 'low' | 'medium' | 'high' | 'all';
  minCreditScore?: number;
  currencies?: string[];
}

export interface LoanStats {
  totalLoaned: number;
  totalBorrowed: number;
  activeLoans: number;
  completedLoans: number;
  averageAPR: number;
  defaultRate: number;
  portfolioReturn: number; // percentage
}

// Chat integration types
export interface LoanChatCard {
  type: 'loan_request' | 'loan_funded' | 'repayment_due' | 'loan_completed' | 'loan_defaulted';
  loanId: string;
  data: {
    amount: number;
    currency: string;
    apr?: number;
    dueDate?: Date;
    borrower?: UserProfile;
    lender?: UserProfile;
  };
}

// API response types
export interface LoanRequestResponse {
  success: boolean;
  loanRequest?: LoanRequest;
  error?: string;
}

export interface LoanListResponse {
  success: boolean;
  loans: LoanRequest[];
  totalCount: number;
  hasMore: boolean;
  error?: string;
}

export interface FundLoanResponse {
  success: boolean;
  transaction?: {
    id: string;
    amount: number;
    txHash?: string;
  };
  error?: string;
}