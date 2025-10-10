// P2P FX Marketplace types and interfaces

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  type: 'fiat' | 'crypto';
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'bank' | 'mobile_money' | 'digital_wallet' | 'cash';
  icon: string;
  processingTime: string; // e.g., "5-10 minutes"
  limits: {
    min: number;
    max: number;
  };
  fees?: {
    fixed?: number;
    percentage?: number;
  };
}

export interface FXOffer {
  id: string;
  maker: {
    id: string;
    name: string;
    avatar?: string;
    trustScore: number; // 0-100
    trustBadge?: 'verified' | 'premium' | 'pro' | null;
    completedTrades: number;
    responseTime: string; // e.g., "~10 minutes"
    onlineStatus: 'online' | 'offline' | 'away';
  };
  
  // Trade details
  sellCurrency: Currency;
  buyCurrency: Currency;
  sellAmount: number;
  buyAmount: number;
  exchangeRate: number;
  margin: number; // percentage above/below market rate
  
  // Terms
  paymentMethods: PaymentMethod[];
  paymentWindow: number; // minutes
  minTrade: number;
  maxTrade: number;
  
  // Status
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  availableAmount: number;
  
  // Trade conditions
  terms?: string;
  autoReply?: string;
  kycRequired: boolean;
  
  // Payment method details
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    currency: string;
  };
  alipayDetails?: {
    accountName: string;
    phoneNumber: string;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface FXFilter {
  sellCurrency?: string;
  buyCurrency?: string;
  paymentMethods?: string[];
  minAmount?: number;
  maxAmount?: number;
  sortBy: 'best_rate' | 'fastest' | 'highest_trust' | 'most_trades';
  onlineOnly?: boolean;
}

export interface FXTrade {
  id: string;
  offerId: string;
  
  // Participants
  maker: FXOffer['maker'];
  taker: {
    id: string;
    name: string;
    avatar?: string;
    trustScore: number;
  };
  
  // Trade details
  sellCurrency: Currency;
  buyCurrency: Currency;
  sellAmount: number;
  buyAmount: number;
  exchangeRate: number;
  
  // Payment
  paymentMethod: PaymentMethod;
  escrowAmount: number;
  escrowCurrency: string; // Usually USDC
  escrowTxHash?: string;
  
  // Status and timeline
  status: 'quote_locked' | 'escrow_pending' | 'escrow_locked' | 'payment_pending' | 'payment_sent' | 'payment_confirmed' | 'completed' | 'disputed' | 'cancelled';
  
  // Timestamps
  createdAt: Date;
  quoteLockExpiry: Date;
  paymentWindow: {
    start: Date;
    end: Date;
  };
  completedAt?: Date;
  
  // Chat room
  chatRoomId: string;
  
  // Payment proof
  paymentProofUrl?: string;
  
  // Blockchain
  releaseHash?: string;
  
  // Dispute
  disputeReason?: string;
  disputeResolution?: 'refund_taker' | 'release_to_taker' | 'partial_refund';
}

export interface TradeMessage {
  id: string;
  tradeId: string;
  type: 'system' | 'user' | 'payment_proof' | 'dispute';
  senderId?: string;
  content: string;
  timestamp: Date;
  
  // For system messages
  systemEventType?: 'escrow_locked' | 'payment_window_started' | 'payment_sent' | 'payment_confirmed' | 'trade_completed' | 'dispute_opened';
  
  // For payment proof
  paymentProof?: {
    transactionId?: string;
    receipt?: string; // image URL
    amount: number;
    currency: string;
    method: string;
  };
  
  // For disputes
  disputeData?: {
    reason: string;
    evidence?: string[];
  };
}

export interface FXMarketData {
  rates: {
    [pair: string]: {
      rate: number;
      change24h: number;
      volume24h: number;
      lastUpdated: Date;
    };
  };
  popularPairs: string[];
  totalVolume24h: number;
  activeTrades: number;
  onlineTraders: number;
}

// API Response types
export interface FXOffersResponse {
  success: boolean;
  offers: FXOffer[];
  totalCount: number;
  hasMore: boolean;
  error?: string;
}

export interface CreateTradeResponse {
  success: boolean;
  trade?: FXTrade;
  chatRoomId?: string;
  error?: string;
}

export interface TradeUpdateResponse {
  success: boolean;
  trade?: FXTrade;
  requiresAction?: 'upload_payment_proof' | 'confirm_payment' | 'sign_release';
  error?: string;
}