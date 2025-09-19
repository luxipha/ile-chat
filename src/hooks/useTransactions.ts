import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '../types';
import { apiService } from '../services/api';

export const useTransactions = (walletAddress?: string) => {
  const queryClient = useQueryClient();

  const {
    data: transactions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['transactions', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const response = await apiService.getTransactions(walletAddress);
      return response.success ? response.data || [] : [];
    },
    enabled: !!walletAddress,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const sendTransactionMutation = useMutation({
    mutationFn: async ({
      from,
      to,
      amount,
      token,
    }: {
      from: string;
      to: string;
      amount: string;
      token: string;
    }) => {
      const response = await apiService.sendTransaction(from, to, amount, token);
      if (!response.success) {
        throw new Error(response.error || 'Transaction failed');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries({ queryKey: ['transactions', walletAddress] });
    },
  });

  const sendTransaction = async (
    to: string,
    amount: string,
    token: string = 'ETH'
  ) => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }
    
    return sendTransactionMutation.mutateAsync({
      from: walletAddress,
      to,
      amount,
      token,
    });
  };

  const getRecentTransactions = (limit = 5): Transaction[] => {
    return transactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  const getPendingTransactions = (): Transaction[] => {
    return transactions.filter(tx => tx.status === 'pending');
  };

  return {
    transactions,
    isLoading,
    error,
    refetch,
    sendTransaction,
    isSending: sendTransactionMutation.isPending,
    sendError: sendTransactionMutation.error,
    getRecentTransactions,
    getPendingTransactions,
  };
};