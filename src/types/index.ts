export interface User {
  id: string;
  _id?: string; // Adding _id for backward compatibility
  name: string;
  email: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  dateOfBirth?: string;
  region?: string;
  address?: string;
  bio?: string;
  balance?: number;
  bricks?: number;
  referralCode?: string;
  loginStreak?: number;
  onboardingCompleted?: boolean;
  authMethod?: 'email' | 'google' | 'telegram';
  avatar?: string;
  role?: 'user' | 'merchant' | 'admin';
  trustScore?: number;
  merchantProfile?: any; // Will be properly typed if needed
  createdAt?: string;
  walletAddress?: string; // Keep for backward compatibility
  username?: string; // Add username for calls
}

export interface Token {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  contractAddress?: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'send' | 'receive';
  amount: string;
  token: string;
  to?: string;
  from?: string;
  hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  price: number;
  tokensAvailable: number;
  totalTokens: number;
  imageUrl?: string;
  description?: string;
}

export interface WalletState {
  isConnected: boolean;
  address?: string;
  walletId?: string;
  chains?: Array<{
    chain: string;
    address: string;
    isActive: boolean;
    createdAt: string;
  }>;
  balance: {
    [token: string]: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isTimeout?: boolean;
  isNetworkError?: boolean;
}

export * from './news';

export interface PaymentRequestUserProfile {
  id: string;
  name?: string;
  email?: string;
  baseWalletAddress?: string;
  baseNetwork?: string;
  hederaAccountId?: string;
  hederaNetwork?: string;
  wallets?: Array<{
    chain: string;
    address: string;
    walletType?: string;
  }>;
}

export interface PaymentRequest {
  id: string;
  amount: number;
  currency: string;
  network?: 'base' | 'hedera' | 'ethereum';
  note?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  creatorId?: string;
  recipientId?: string | null;
  createdAt?: string;
  expiresAt?: string;
  paidAt?: string;
  transactionId?: string | null;
  deepLink: string;
  qrData: string;
  isCreator?: boolean;
  isRecipient?: boolean;
  creatorProfile?: PaymentRequestUserProfile | null;
  recipientProfile?: PaymentRequestUserProfile | null;
  messages?: Array<{
    conversationId: string;
    messageId: string;
    linkedAt?: string;
  }>;
}
