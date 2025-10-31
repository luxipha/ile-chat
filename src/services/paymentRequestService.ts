import { apiClient } from './api';
import { ApiResponse, PaymentRequest } from '../types';

export interface CreatePaymentRequestPayload {
  amount: number;
  currency?: string;
  network?: 'base' | 'hedera' | 'ethereum';
  note?: string;
  recipientId?: string | null;
  expiresInHours?: number;
}

export interface CompletePaymentRequestPayload {
  transactionId?: string;
  metadata?: Record<string, any>;
}

type PaymentRequestResponse = ApiResponse<{ request: PaymentRequest }>;

export const paymentRequestService = {
  async createRequest(payload: CreatePaymentRequestPayload): Promise<PaymentRequestResponse> {
    return apiClient.post<{ request: PaymentRequest }>('/api/payment-requests', payload);
  },

  async getRequest(requestId: string): Promise<PaymentRequestResponse> {
    return apiClient.get<{ request: PaymentRequest }>(`/api/payment-requests/${requestId}`);
  },

  async completeRequest(
    requestId: string,
    payload: CompletePaymentRequestPayload
  ): Promise<PaymentRequestResponse> {
    return apiClient.post<{ request: PaymentRequest }>(`/api/payment-requests/${requestId}/complete`, payload);
  },

  async cancelRequest(requestId: string): Promise<PaymentRequestResponse> {
    return apiClient.post<{ request: PaymentRequest }>(`/api/payment-requests/${requestId}/cancel`);
  },

  async attachMessage(
    requestId: string,
    payload: { conversationId: string; messageId: string }
  ): Promise<PaymentRequestResponse> {
    return apiClient.post<{ request: PaymentRequest }>(`/api/payment-requests/${requestId}/messages`, payload);
  },
};

export default paymentRequestService;
