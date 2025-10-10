export interface User {
  id: string;
  email: string;
  walletAddress?: string;
  createdAt: string;
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