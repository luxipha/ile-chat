/**
 * FX Trading Service
 * Handles all business logic and API interactions for the FX feature
 * Keeps components clean and focused on UI
 */

import { FXOffer, FXTrade, FXFilter, CreateTradeResponse, FXOffersResponse, TradeUpdateResponse, Currency, PaymentMethod } from '../types/fx';
import { apiClient } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

// Debug logging utility for FX operations
class FXDebugger {
  private static instance: FXDebugger;
  private isDebugEnabled = __DEV__; // Enable debug logging in development

  static getInstance(): FXDebugger {
    if (!FXDebugger.instance) {
      FXDebugger.instance = new FXDebugger();
    }
    return FXDebugger.instance;
  }

  log(operation: string, data?: any, error?: any) {
    if (!this.isDebugEnabled) return;
    
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      operation,
      data,
      error,
      stackTrace: error?.stack
    };

    if (error) {
      console.error(`🔥 FX ERROR [${operation}]:`, logData);
    } else {
      console.log(`💰 FX DEBUG [${operation}]:`, logData);
    }

    // Store debug logs for later analysis
    this.storeDebugLog(logData);
  }

  private async storeDebugLog(logData: any) {
    try {
      const logs = await AsyncStorage.getItem('fx_debug_logs');
      const existingLogs = logs ? JSON.parse(logs) : [];
      existingLogs.push(logData);
      
      // Keep only last 100 logs to prevent storage bloat
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      await AsyncStorage.setItem('fx_debug_logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('Failed to store FX debug log:', error);
    }
  }

  async getDebugLogs(): Promise<any[]> {
    try {
      const logs = await AsyncStorage.getItem('fx_debug_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('Failed to get FX debug logs:', error);
      return [];
    }
  }

  async clearDebugLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem('fx_debug_logs');
      this.log('DEBUG_LOGS_CLEARED');
    } catch (error) {
      console.warn('Failed to clear FX debug logs:', error);
    }
  }
}

class FXService {
  private debugger = FXDebugger.getInstance();
  private apiBaseUrl = API_BASE_URL;

  private async getAuthToken(): Promise<string | undefined> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token || undefined;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return undefined;
    }
  }
  
  /**
   * Create a new FX offer
   * @param offerData - The offer data to create
   * @returns Promise with the response
   */
  async createOffer(offerData: any): Promise<any> {
    const startTime = Date.now();
    this.debugger.log('CREATE_OFFER_START', { offerData });
    
    try {
      const response = await apiClient.post('/api/fx/offers', offerData);
      
      const responseTime = Date.now() - startTime;
      this.debugger.log('CREATE_OFFER_SUCCESS', { 
        response: response.data, 
        responseTime 
      });
      
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.debugger.log('CREATE_OFFER_ERROR', { error, responseTime }, error);
      throw error;
    }
  }

  /**
   * Sign a release for a trade
   * @param tradeId - ID of the trade to sign release for
   * @returns Promise with the response
   */
  async signRelease(tradeId: string): Promise<any> {
    this.debugger.log('SIGN_RELEASE_START', { tradeId });
    try {
      const response = await apiClient.post(`/fx/trades/${tradeId}/release`);
      this.debugger.log('SIGN_RELEASE_SUCCESS', { tradeId, response: response.data });
      return response.data;
    } catch (error) {
      this.debugger.log('SIGN_RELEASE_ERROR', { tradeId }, error);
      throw error;
    }
  }

  /**
   * Get available FX offers from the marketplace
   * @param filters - Filter criteria for offers
   * @returns Promise with offers data
   */
  async getOffers(filters?: FXFilter): Promise<FXOffersResponse> {
    const startTime = Date.now();
    this.debugger.log('GET_OFFERS_START', { filters });
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters) {
        if (filters.sellCurrency) queryParams.append('sellCurrency', filters.sellCurrency);
        if (filters.buyCurrency) queryParams.append('buyCurrency', filters.buyCurrency);
        if (filters.minAmount) queryParams.append('minAmount', filters.minAmount.toString());
        if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount.toString());
        if (filters.onlineOnly) queryParams.append('onlineOnly', 'true');
        if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
        if (filters.paymentMethods?.length) {
          queryParams.append('paymentMethods', filters.paymentMethods.join(','));
        }
      }

      this.debugger.log('GET_OFFERS_QUERY_PARAMS', { queryParams: queryParams.toString() });

      // Make API call to backend
      const endpoint = `/api/fx/offers?${queryParams.toString()}`;
      const response = await apiClient.get(endpoint);
      
      const responseTime = Date.now() - startTime;
      
      // CRITICAL DEBUG: Log the exact response structure
      console.log('🚨 FX GET_OFFERS RAW RESPONSE:', {
        endpoint,
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : null,
        success: response?.success,
        data: response?.data,
        dataType: typeof response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : null,
        error: response?.error,
        fullResponse: response
      });
      
      this.debugger.log('GET_OFFERS_API_RESPONSE', { 
        response, 
        responseTime,
        endpoint,
        success: response.success 
      });

      if (!response.success) {
        this.debugger.log('GET_OFFERS_API_ERROR', { 
          error: response.error,
          data: response.data 
        });
        
        return {
          success: false,
          offers: [],
          totalCount: 0,
          hasMore: false,
          error: response.error || 'Failed to fetch offers',
        };
      }

      // Transform backend response to frontend format
      // The API client spreads response fields, so offers might be directly on response
      const responseData = response.data || response;
      
      // Ensure we have valid offers data before transformation
      if (!responseData || (!responseData.offers && !Array.isArray(responseData))) {
        this.debugger.log('GET_OFFERS_INVALID_RESPONSE', {
          responseData,
          hasOffers: !!responseData?.offers,
          isArray: Array.isArray(responseData),
          responseKeys: responseData ? Object.keys(responseData) : null
        });
        return {
          success: false,
          offers: [],
          totalCount: 0,
          hasMore: false,
          error: 'Invalid response format from server',
        };
      }
      
      const transformedOffers = this.transformOffersFromBackend(responseData.offers || responseData);
      
      const result = {
        success: true,
        offers: transformedOffers,
        totalCount: responseData.totalCount || transformedOffers.length,
        hasMore: responseData.hasMore || false,
      };

      this.debugger.log('GET_OFFERS_SUCCESS', { 
        offersCount: result.offers.length,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        responseTime
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.debugger.log('GET_OFFERS_ERROR', { error, responseTime }, error);
      
      // Fallback to mock data in development for testing
      if (__DEV__) {
        this.debugger.log('GET_OFFERS_FALLBACK_TO_MOCK', { reason: 'API error in development' });
        const mockOffers = this.generateMockOffers();
        let filteredOffers = mockOffers;
        if (filters) {
          filteredOffers = this.applyFilters(mockOffers, filters);
        }
        return {
          success: true,
          offers: filteredOffers,
          totalCount: filteredOffers.length,
          hasMore: false
        };
      }
      
      return {
        success: false,
        offers: [],
        totalCount: 0,
        hasMore: false,
        error: error instanceof Error ? error.message : 'Failed to fetch offers',
      };
    }
  }

  /**
   * Create a new trade from an offer
   * @param offerId - The offer ID to trade
   * @param amount - The amount to trade
   * @param paymentMethod - Selected payment method
   * @returns Promise with trade data
   */
  async createTrade(
    offerId: string, 
    amount: number, 
    paymentMethod: PaymentMethod,
    currentUserId?: string
  ): Promise<CreateTradeResponse> {
    const startTime = Date.now();
    this.debugger.log('CREATE_TRADE_START', { 
      offerId, 
      amount, 
      paymentMethod: paymentMethod.id, 
      currentUserId 
    });
    
    try {
      // Validate input parameters
      if (!offerId || !amount || !paymentMethod) {
        const error = 'Missing required parameters for trade creation';
        this.debugger.log('CREATE_TRADE_VALIDATION_ERROR', { error });
        return {
          success: false,
          error,
        };
      }

      // Get current user for debugging
      let currentUserDebug = null;
      try {
        const userData = await AsyncStorage.getItem('userData');
        currentUserDebug = userData ? JSON.parse(userData) : null;
      } catch (e) {
        console.warn('Failed to get user for debugging:', e);
      }

      // Prepare trade creation payload
      const tradePayload = {
        offerId,
        amount,
        paymentMethodId: paymentMethod.id,
        // Additional metadata can be added here
      };

      this.debugger.log('CREATE_TRADE_PAYLOAD', { 
        tradePayload,
        userContext: {
          userId: currentUserDebug?.id || currentUserDebug?._id,
          userRole: currentUserDebug?.role,
          isMerchant: currentUserDebug?.role === 'merchant' || !!currentUserDebug?.merchantProfile,
          providedUserId: currentUserId
        }
      });

      // Make API call to create trade
      const endpoint = `/api/fx/offers/${offerId}/trade`;
      const response = await apiClient.post(endpoint, tradePayload);
      
      const responseTime = Date.now() - startTime;
      this.debugger.log('CREATE_TRADE_API_RESPONSE', { 
        response, 
        responseTime,
        endpoint,
        success: response.success,
        responseKeys: Object.keys(response || {}),
        dataKeys: Object.keys(response.data || {}),
        rawResponse: response
      });

      if (!response.success) {
        this.debugger.log('CREATE_TRADE_API_ERROR', { 
          error: response.error,
          data: response.data,
          fullResponse: response,
          httpStatus: 'unknown',
          endpoint,
          payload: tradePayload,
          userContext: {
            userId: currentUserDebug?.id || currentUserDebug?._id,
            userRole: currentUserDebug?.role,
            isMerchant: currentUserDebug?.role === 'merchant' || !!currentUserDebug?.merchantProfile
          }
        });
        
        return {
          success: false,
          error: response.error || 'Failed to create trade',
        };
      }

      // Transform backend response to frontend format
      // API service wraps response in { success: true, data: backendResponse }
      // Backend response is { success: true, message: "...", trade: {...} }
      const backendResponse = response.data as any;
      const tradeData = (backendResponse as any).trade || backendResponse;
      
      // Debug: Log the raw response to understand the structure
      console.log('🔍 [FXService] Raw API response:', JSON.stringify(response, null, 2));
      console.log('🔍 [FXService] Backend response:', JSON.stringify(backendResponse, null, 2));
      console.log('🔍 [FXService] Trade data to transform:', JSON.stringify(tradeData, null, 2));
      
      this.debugger.log('CREATE_TRADE_EXTRACT_DATA', { 
        apiResponseKeys: Object.keys(response || {}),
        backendResponseKeys: Object.keys((backendResponse as any) || {}),
        hasTradeProperty: !!(backendResponse as any).trade,
        tradeDataKeys: Object.keys(tradeData || {}),
        tradeDataSample: {
          _id: tradeData?._id,
          fromAmount: tradeData?.fromAmount,
          toAmount: tradeData?.toAmount,
          fromCurrency: tradeData?.fromCurrency,
          toCurrency: tradeData?.toCurrency,
          status: tradeData?.status,
          offerId: tradeData?.offerId,
          offer: tradeData?.offer,
          offerRef: tradeData?.offerRef
        }
      });
      
      // Additional debug for offerId issue
      console.log('🔍 [FXService] Backend trade data for offerId debug:', {
        hasOfferId: 'offerId' in (tradeData || {}),
        offerIdValue: tradeData?.offerId,
        hasOffer: 'offer' in (tradeData || {}),
        offerValue: tradeData?.offer,
        hasOfferRef: 'offerRef' in (tradeData || {}),
        offerRefValue: tradeData?.offerRef,
        allKeys: Object.keys(tradeData || {})
      });
      const transformedTrade = this.transformTradeFromBackend(tradeData);
      
      const result = {
        success: true,
        trade: transformedTrade,
        chatRoomId: transformedTrade.chatRoomId,
      };

      this.debugger.log('CREATE_TRADE_SUCCESS', { 
        tradeId: result.trade.id,
        status: result.trade.status,
        chatRoomId: result.chatRoomId,
        responseTime
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.debugger.log('CREATE_TRADE_ERROR', { error, responseTime }, error);
      
      // Fallback to mock trade creation in development
      if (__DEV__) {
        this.debugger.log('CREATE_TRADE_FALLBACK_TO_MOCK', { reason: 'API error in development' });
        return this.createMockTrade(offerId, amount, paymentMethod, currentUserId);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create trade',
      };
    }
  }

  /**
   * Update trade status
   * @param tradeId - The trade ID
   * @param status - New trade status
   * @param additionalData - Any additional data for the update
   * @returns Promise with updated trade data
   */
  async updateTradeStatus(
    tradeId: string, 
    status: FXTrade['status'],
    additionalData?: any
  ): Promise<TradeUpdateResponse> {
    const startTime = Date.now();
    this.debugger.log('UPDATE_TRADE_STATUS_START', { 
      tradeId, 
      status, 
      additionalData 
    });
    
    try {
      // Determine the correct endpoint based on status
      const statusToEndpointMap: Record<string, string> = {
        'accepted': 'accept',
        'payment_sent': 'payment-sent',
        'buyer_payment_sent': 'payment-sent',
        'merchant_payment_sent': 'payment-sent', 
        'payment_confirmed': 'confirm-payment',
        'completed': 'complete',
        'cancelled': 'cancel',
        'disputed': 'dispute'
      };

      const action = statusToEndpointMap[status];
      if (!action) {
        const error = `Unsupported status update: ${status}`;
        this.debugger.log('UPDATE_TRADE_STATUS_VALIDATION_ERROR', { error });
        return {
          success: false,
          error,
        };
      }

      const endpoint = `/api/fx/trades/${tradeId}/${action}`;
      const payload = additionalData || {};

      this.debugger.log('UPDATE_TRADE_STATUS_API_CALL', { endpoint, payload });

      const response = await apiClient.post(endpoint, payload);
      
      const responseTime = Date.now() - startTime;
      this.debugger.log('UPDATE_TRADE_STATUS_API_RESPONSE', { 
        response, 
        responseTime,
        endpoint,
        success: response.success 
      });

      if (!response.success) {
        this.debugger.log('UPDATE_TRADE_STATUS_API_ERROR', { 
          error: response.error,
          data: response.data 
        });
        
        return {
          success: false,
          error: response.error || 'Failed to update trade status',
        };
      }

      const result = {
        success: true,
        requiresAction: this.getRequiredActionForStatus(status),
        updatedTrade: response.data,
      };

      this.debugger.log('UPDATE_TRADE_STATUS_SUCCESS', { 
        tradeId,
        newStatus: status,
        requiresAction: result.requiresAction,
        responseTime
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.debugger.log('UPDATE_TRADE_STATUS_ERROR', { error, responseTime }, error);
      
      // Fallback in development
      if (__DEV__) {
        this.debugger.log('UPDATE_TRADE_STATUS_FALLBACK_TO_MOCK', { reason: 'API error in development' });
        return {
          success: true,
          requiresAction: this.getRequiredActionForStatus(status),
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update trade status',
      };
    }
  }

  /**
   * Upload payment proof for a trade
   * @param tradeId - The trade ID
   * @param file - The payment proof file
   * @param userRole - Whether user is 'buyer' or 'merchant' (auto-detected if not provided)
   * @returns Promise with upload result
   */
  async uploadPaymentProof(tradeId: string, file: any, userRole?: 'buyer' | 'merchant'): Promise<{ success: boolean; fileUrl?: string; error?: string; tradeStatus?: string }> {
    const startTime = Date.now();
    this.debugger.log('UPLOAD_PAYMENT_PROOF_START', { tradeId, file: file?.uri, userRole });
    
    try {
      if (!file) {
        return { success: false, error: 'No file provided' };
      }

      // Get current user to determine role if not provided
      let currentUser = null;
      try {
        const userData = await AsyncStorage.getItem('userData');
        currentUser = userData ? JSON.parse(userData) : null;
      } catch (e) {
        console.warn('Failed to get user data:', e);
      }

      // Determine user role if not provided
      if (!userRole && currentUser) {
        // Get trade details to determine user role
        const tradeResponse = await this.getTradeById(tradeId);
        if (tradeResponse.success && tradeResponse.trade) {
          const trade = tradeResponse.trade;
          const currentUserId = currentUser.id || currentUser._id;
          const merchant = trade.merchant || trade.maker;
          const buyer = trade.buyer || trade.taker;
          
          if (merchant?.id === currentUserId) {
            userRole = 'merchant';
          } else if (buyer?.id === currentUserId) {
            userRole = 'buyer';
          }
        }
      }

      if (!userRole) {
        return { success: false, error: 'Could not determine user role for upload' };
      }

      this.debugger.log('UPLOAD_PAYMENT_PROOF_USER_ROLE', { tradeId, userRole, currentUserId: currentUser?.id });

      // Prepare file for upload
      const formData = new FormData();
      const fileToUpload = {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || `payment_proof_${userRole}_${tradeId}_${Date.now()}.jpg`,
      };
      
      formData.append('paymentProof', fileToUpload as any);

      // Optional: Add transaction ID and notes
      if (file.transactionId) {
        formData.append('transactionId', file.transactionId);
      }
      if (file.notes) {
        formData.append('notes', file.notes);
      }

      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      // Use the correct backend endpoint based on user role
      const endpoint = userRole === 'buyer' 
        ? `/api/fx/trades/${tradeId}/payment-proof`
        : `/api/fx/trades/${tradeId}/merchant-payment-proof`;

      this.debugger.log('UPLOAD_PAYMENT_PROOF_ENDPOINT', { endpoint, userRole });

      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await response.json();
      
      const responseTime = Date.now() - startTime;
      this.debugger.log('UPLOAD_PAYMENT_PROOF_RESPONSE', { 
        tradeId,
        userRole,
        responseTime,
        success: responseData.success,
        status: responseData.data?.trade?.status,
        fileUrl: responseData.data?.fileUrl
      });

      if (!response.ok || !responseData.success) {
        return {
          success: false,
          error: responseData.error || responseData.message || 'Failed to upload payment proof'
        };
      }

      return {
        success: true,
        fileUrl: responseData.data?.fileUrl || responseData.screenshotUrl || responseData.imageUrl || file.uri,
        tradeStatus: responseData.data?.trade?.status
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.debugger.log('UPLOAD_PAYMENT_PROOF_ERROR', { error, responseTime }, error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }


  /**
   * Confirm payment received (buyer action) - completes the trade
   * Buyer protection model: buyer's satisfaction completes the transaction
   * @param tradeId - The trade ID
   * @returns Promise with confirmation result
   */
  async confirmPayment(tradeId: string): Promise<{ success: boolean; error?: string }> {
    const startTime = Date.now();
    this.debugger.log('CONFIRM_PAYMENT_START', { tradeId });
    
    try {
      // Use the proper confirm-payment endpoint
      const endpoint = `/api/fx/trades/${tradeId}/confirm-payment`;
      const response = await apiClient.post(endpoint, {});
      
      const responseTime = Date.now() - startTime;
      this.debugger.log('CONFIRM_PAYMENT_RESULT', { 
        tradeId,
        success: response.success,
        responseTime,
        note: 'Using correct confirm-payment endpoint'
      });
      
      return {
        success: response.success,
        error: response.error,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.debugger.log('CONFIRM_PAYMENT_ERROR', { error, responseTime }, error);
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to confirm payment'
      };
    }
  }

  /**
   * Complete trade (automatic when payment confirmed)
   * @param tradeId - The trade ID
   * @returns Promise with completion result
   */
  async completeTrade(tradeId: string): Promise<{ success: boolean; error?: string }> {
    const startTime = Date.now();
    this.debugger.log('COMPLETE_TRADE_START', { tradeId });
    
    try {
      const response = await this.updateTradeStatus(tradeId, 'completed');
      
      const responseTime = Date.now() - startTime;
      this.debugger.log('COMPLETE_TRADE_RESULT', { 
        tradeId,
        success: response.success,
        responseTime
      });
      
      return {
        success: response.success,
        error: response.error,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.debugger.log('COMPLETE_TRADE_ERROR', { error, responseTime }, error);
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to complete trade'
      };
    }
  }

  /**
   * Open a dispute for a trade
   * @param tradeId - The trade ID
   * @param reason - Dispute reason
   * @returns Promise with dispute result
   */
  async openDispute(tradeId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const startTime = Date.now();
    this.debugger.log('OPEN_DISPUTE_START', { tradeId, reason });
    
    try {
      const response = await this.updateTradeStatus(tradeId, 'disputed', { reason });
      
      const responseTime = Date.now() - startTime;
      this.debugger.log('OPEN_DISPUTE_RESULT', { 
        tradeId,
        reason,
        success: response.success,
        responseTime
      });
      
      return {
        success: response.success,
        error: response.error,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.debugger.log('OPEN_DISPUTE_ERROR', { error, responseTime }, error);
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to open dispute'
      };
    }
  }

  /**
   * Submit rating and review for completed trade
   * @param tradeId - The trade ID
   * @param rating - Rating (1-5)
   * @param review - Written review
   * @returns Promise with rating result
   */
  async submitRating(
    tradeId: string, 
    rating: number, 
    review?: string
  ): Promise<{ success: boolean; error?: string }> {
    const startTime = Date.now();
    this.debugger.log('SUBMIT_RATING_START', { tradeId, rating, review });
    
    try {
      if (rating < 1 || rating > 5) {
        const error = 'Rating must be between 1 and 5';
        this.debugger.log('SUBMIT_RATING_VALIDATION_ERROR', { error });
        return { success: false, error };
      }

      const endpoint = `/api/fx/trades/${tradeId}/rating`;
      const payload = { rating, comment: review };

      this.debugger.log('SUBMIT_RATING_API_CALL', { endpoint, payload });

      const response = await apiClient.post(endpoint, payload);
      
      const responseTime = Date.now() - startTime;
      this.debugger.log('SUBMIT_RATING_API_RESPONSE', { 
        response, 
        responseTime,
        endpoint,
        success: response.success 
      });

      if (!response.success) {
        this.debugger.log('SUBMIT_RATING_API_ERROR', { 
          error: response.error,
          data: response.data 
        });
        
        return {
          success: false,
          error: response.error || 'Failed to submit rating',
        };
      }

      this.debugger.log('SUBMIT_RATING_SUCCESS', { 
        tradeId,
        rating,
        responseTime
      });
      
      return { success: true };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.debugger.log('SUBMIT_RATING_ERROR', { error, responseTime }, error);
      
      // Fallback in development
      if (__DEV__) {
        this.debugger.log('SUBMIT_RATING_FALLBACK_TO_MOCK', { reason: 'API error in development' });
        return { success: true };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit rating'
      };
    }
  }

  /**
   * Get available currencies
   * @returns Array of supported currencies
   */
  getCurrencies(): Currency[] {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', type: 'fiat' },
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', type: 'fiat' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', type: 'fiat' },
      { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', type: 'fiat' },
      { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', type: 'fiat' },
      { code: 'USDC', name: 'USD Coin', symbol: 'USDC', flag: '💰', type: 'crypto' },
    ];
  }

  /**
   * Get available payment methods
   * @returns Array of supported payment methods
   */
  getPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'alipay',
        name: 'Alipay',
        type: 'digital_wallet',
        icon: 'payment',
        processingTime: '1-5 minutes',
        limits: { min: 100, max: 50000 },
      },
      {
        id: 'wechat',
        name: 'WeChat Pay',
        type: 'digital_wallet', 
        icon: 'payment',
        processingTime: '1-5 minutes',
        limits: { min: 100, max: 50000 },
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        type: 'bank',
        icon: 'account-balance',
        processingTime: '10-30 minutes',
        limits: { min: 1000, max: 100000 },
      },
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        type: 'mobile_money',
        icon: 'phone_android',
        processingTime: '1-10 minutes',
        limits: { min: 50, max: 10000 },
      },
    ];
  }


  /**
   * Get user's trade history
   * @param filters - Optional filters for trades
   * @returns Promise with trades data
   */
  async getUserTrades(filters?: { status?: string; limit?: number; offset?: number }): Promise<{ success: boolean; trades: FXTrade[]; error?: string }> {
    const startTime = Date.now();
    this.debugger.log('GET_USER_TRADES_START', { filters });
    
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.limit) queryParams.append('limit', filters.limit.toString());
        if (filters.offset) queryParams.append('offset', filters.offset.toString());
      }

      const endpoint = `/api/fx/trades?${queryParams.toString()}`;
      const response = await apiClient.get(endpoint);
      
      // 🚨 CRITICAL: Log raw backend response before transformation
      console.log('🚨 RAW BACKEND API RESPONSE (getUserTrades):', {
        endpoint,
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : null,
        responseSuccess: response.success,
        responseData: response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : null,
        error: response?.error,
        tradesArray: Array.isArray(response.data) ? response.data : response.data?.trades,
        firstTrade: Array.isArray(response.data) ? response.data[0] : response.data?.trades?.[0],
        firstTradeKeys: (Array.isArray(response.data) ? response.data[0] : response.data?.trades?.[0]) ? Object.keys(Array.isArray(response.data) ? response.data[0] : response.data?.trades?.[0]) : null,
        fullResponse: response
      });
      
      const responseTime = Date.now() - startTime;
      this.debugger.log('GET_USER_TRADES_API_RESPONSE', { 
        response, 
        responseTime,
        endpoint,
        success: response.success 
      });

      if (!response.success) {
        this.debugger.log('GET_USER_TRADES_API_ERROR', { 
          error: response.error,
          data: response.data 
        });
        
        return {
          success: false,
          trades: [],
          error: response.error || 'Failed to fetch trades',
        };
      }

      // The API client spreads response fields, so trades might be directly on response
      const responseData = response.data || response;
      const transformedTrades = (responseData.trades || responseData).map((trade: any) => 
        this.transformTradeFromBackend(trade)
      );

      // Check for expired trades and auto-cancel them (skip completed/cancelled trades)
      const checkedTrades = await Promise.all(
        transformedTrades.map(async (trade: FXTrade) => {
          // Skip expiration check for trades that cannot expire
          const nonExpirableStatuses = ['completed', 'cancelled', 'disputed'];
          if (nonExpirableStatuses.includes(trade.status)) {
            return trade;
          }
          
          const expirationCheck = await this.checkAndCancelExpiredTrade(trade);
          return expirationCheck.trade || trade;
        })
      );

      this.debugger.log('GET_USER_TRADES_SUCCESS', { 
        tradesCount: checkedTrades.length,
        originalTradesCount: transformedTrades.length,
        responseTime
      });

      return {
        success: true,
        trades: checkedTrades,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.debugger.log('GET_USER_TRADES_ERROR', { error, responseTime }, error);
      
      return {
        success: false,
        trades: [],
        error: error instanceof Error ? error.message : 'Failed to fetch trades',
      };
    }
  }

  /**
   * Check if trade is expired and auto-cancel if needed
   * @param trade - The trade to check
   * @returns Promise with updated trade or cancellation result
   */
  async checkAndCancelExpiredTrade(trade: FXTrade): Promise<{ success: boolean; trade?: FXTrade; cancelled?: boolean; error?: string }> {
    this.debugger.log('CHECK_EXPIRED_TRADE_START', { 
      tradeId: trade.id, 
      status: trade.status,
      paymentDeadline: trade.timeWindows?.paymentDeadline
    });

    // Check if trade is in a state that can expire
    const expirableStatuses = ['pending_acceptance', 'accepted', 'quote_locked', 'escrow_locked', 'payment_pending'];
    if (!expirableStatuses.includes(trade.status)) {
      return { success: true, trade };
    }

    // Check if trade has expired
    const now = new Date();
    let isExpired = false;
    let deadlineType = '';

    // For pending_acceptance trades, check acceptance deadline
    if (trade.status === 'pending_acceptance' && trade.timeWindows?.acceptanceDeadline) {
      isExpired = now > trade.timeWindows.acceptanceDeadline;
      deadlineType = 'acceptance';
    }
    // For accepted/payment_pending trades, check payment deadline
    else if (trade.timeWindows?.paymentDeadline) {
      isExpired = now > trade.timeWindows.paymentDeadline;
      deadlineType = 'payment';
    }

    if (isExpired) {
      this.debugger.log('TRADE_EXPIRED_AUTO_CANCEL', { 
        tradeId: trade.id,
        deadlineType,
        deadline: deadlineType === 'acceptance' ? trade.timeWindows?.acceptanceDeadline : trade.timeWindows?.paymentDeadline
      });

      try {
        // Auto-cancel the expired trade
        const cancelResponse = await this.updateTradeStatus(trade.id, 'cancelled', {
          reason: `Trade expired - ${deadlineType} deadline passed`,
          autoCancel: true
        });

        if (cancelResponse.success) {
          const cancelledTrade = { ...trade, status: 'cancelled' as const };
          return { 
            success: true, 
            trade: cancelledTrade,
            cancelled: true 
          };
        } else {
          return {
            success: false,
            error: `Failed to auto-cancel expired trade: ${cancelResponse.error}`
          };
        }
      } catch (error) {
        this.debugger.log('AUTO_CANCEL_ERROR', { error }, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to auto-cancel expired trade'
        };
      }
    }

    return { success: true, trade };
  }

  /**
   * Get trade details by ID
   * @param tradeId - The trade ID
   * @returns Promise with trade data
   */
  async getTradeById(tradeId: string): Promise<{ success: boolean; trade?: FXTrade; error?: string }> {
    const startTime = Date.now();
    this.debugger.log('GET_TRADE_BY_ID_START', { tradeId });
    
    try {
      const endpoint = `/api/fx/trades/${tradeId}`;
      const response = await apiClient.get(endpoint);
      
      // 🚨 CRITICAL: Log raw backend response before transformation
      console.log('🚨 RAW BACKEND API RESPONSE (getTradeById):', {
        endpoint,
        responseSuccess: response.success,
        responseData: response.data,
        responseDataType: typeof response.data,
        responseDataKeys: response.data ? Object.keys(response.data) : null,
        fullResponse: response
      });
      
      const responseTime = Date.now() - startTime;
      this.debugger.log('GET_TRADE_BY_ID_API_RESPONSE', { 
        response, 
        responseTime,
        endpoint,
        success: response.success 
      });

      if (!response.success) {
        this.debugger.log('GET_TRADE_BY_ID_API_ERROR', { 
          error: response.error,
          data: response.data 
        });
        
        return {
          success: false,
          error: response.error || 'Failed to fetch trade',
        };
      }

      // Extract the actual trade object from the API response
      const responseData = response.data as any;
      const tradeData = responseData?.trade || responseData;
      
      console.log('🔍 Extracting trade data:', {
        hasResponseData: !!responseData,
        hasTradeField: !!responseData?.trade,
        extractedData: tradeData,
        extractedDataKeys: tradeData ? Object.keys(tradeData) : null
      });
      
      const transformedTrade = this.transformTradeFromBackend(tradeData);

      // Check if trade is expired and auto-cancel if needed
      const expirationCheck = await this.checkAndCancelExpiredTrade(transformedTrade);
      if (!expirationCheck.success) {
        return {
          success: false,
          error: expirationCheck.error
        };
      }

      const finalTrade = expirationCheck.trade || transformedTrade;

      this.debugger.log('GET_TRADE_BY_ID_SUCCESS', { 
        tradeId: finalTrade.id,
        status: finalTrade.status,
        cancelled: expirationCheck.cancelled,
        responseTime
      });

      return {
        success: true,
        trade: finalTrade,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.debugger.log('GET_TRADE_BY_ID_ERROR', { error, responseTime }, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch trade',
      };
    }
  }

  // Private helper methods

  /**
   * Transform offers from backend format to frontend format
   */
  private transformOffersFromBackend(backendOffers: any[]): FXOffer[] {
    this.debugger.log('TRANSFORM_OFFERS_FROM_BACKEND', { 
      count: backendOffers?.length || 0,
      sampleOffer: backendOffers?.[0] 
    });

    if (!Array.isArray(backendOffers)) {
      this.debugger.log('TRANSFORM_OFFERS_INVALID_DATA', { backendOffers });
      return [];
    }

    return backendOffers.map(offer => {
      // Backend uses 'merchant' field, but frontend expects 'maker'
      const merchantData = offer.merchant || offer.maker;
      
      // Enhanced merchant data handling for ObjectId vs populated object
      let merchantInfo = {
        id: '',
        profileUserId: undefined as string | undefined,
        firebaseUid: undefined as string | undefined,
        name: 'Unknown Merchant',
        avatar: undefined as string | undefined,
        trustScore: 85,
        completedTrades: 0,
        responseTime: '~5 minutes',
        email: undefined as string | undefined,
        stats: undefined as {
          totalTrades?: number;
          completedTrades?: number;
          tradingVolume?: number;
          averageRating?: number;
          responseTime?: number;
        } | undefined,
      };
      
      if (merchantData) {
        if (typeof merchantData === 'string') {
          // If merchant is just an ObjectId string
          merchantInfo.id = merchantData;
          merchantInfo.name = 'Merchant'; // Fallback name for ObjectId-only data
        } else if (typeof merchantData === 'object') {
          // If merchant is a populated object
          merchantInfo.id = merchantData._id || merchantData.id;
          merchantInfo.name = merchantData.name || merchantData.userName || 'Merchant';
          merchantInfo.avatar = merchantData.avatar || merchantData.profilePicture || undefined;
          merchantInfo.trustScore = merchantData.merchantProfile?.stats?.averageRating || merchantData.trustScore || 85;
          merchantInfo.completedTrades = merchantData.merchantProfile?.stats?.completedTrades || merchantData.completedTrades || 0;
          merchantInfo.responseTime = merchantData.merchantProfile?.stats?.responseTime ? `~${merchantData.merchantProfile.stats.responseTime} min` : '~5 minutes';
          merchantInfo.email = merchantData.email || merchantData.contactEmail;
          merchantInfo.stats = merchantData.merchantProfile?.stats;

          const profileCandidates = [
            merchantData.profileUserId,
            merchantData.profile_user_id,
            merchantData.firebaseUid,
            merchantData.firebaseUID,
            merchantData.firebase_uid,
            merchantData.authUid,
            merchantData.authUID,
            merchantData.uid,
            merchantData.userId,
            merchantData.userFirebaseUid,
            merchantData.userAuthUid,
            merchantData.user?.firebaseUid,
            merchantData.user?.authUid,
            merchantData.user?.uid,
            merchantData.firebase?.uid,
            merchantData.firebase?.userId,
            merchantData.owner?.firebaseUid,
            merchantData.owner?.authUid,
            merchantData.merchantProfile?.firebaseUid,
          ].filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0);

          if (profileCandidates.length) {
            merchantInfo.profileUserId = profileCandidates[0];
          }

          const firebaseUid =
            profileCandidates.find((candidate) => candidate.length >= 10) ||
            merchantData.firebaseUid ||
            merchantData.firebaseUID ||
            merchantData.firebase_uid ||
            merchantData.firebase?.uid;

          if (firebaseUid) {
            merchantInfo.firebaseUid = firebaseUid;
          }
        }
      }
      if (!merchantInfo.profileUserId) {
        const offerLevelCandidates = [
          offer.merchantFirebaseUid,
          offer.makerFirebaseUid,
          offer.merchantUid,
          offer.makerUid,
          offer.merchantProfile?.firebaseUid,
        ].filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0);
        if (offerLevelCandidates.length) {
          merchantInfo.profileUserId = offerLevelCandidates[0];
        }
      }
      if (!merchantInfo.firebaseUid && merchantInfo.profileUserId) {
        merchantInfo.firebaseUid = merchantInfo.profileUserId;
      }
      
      if (!merchantInfo.id && merchantInfo.profileUserId) {
        merchantInfo.id = merchantInfo.profileUserId;
      }
      if (!merchantInfo.profileUserId && merchantInfo.id) {
        merchantInfo.profileUserId = merchantInfo.id;
      }
      if (!merchantInfo.firebaseUid && merchantInfo.profileUserId) {
        merchantInfo.firebaseUid = merchantInfo.profileUserId;
      }
      
      return {
        id: offer._id || offer.id,
        maker: {
          id: merchantInfo.id,
          profileUserId: merchantInfo.profileUserId,
          firebaseUid: merchantInfo.firebaseUid,
          name: merchantInfo.name,
          email: merchantInfo.email,
          avatar: merchantInfo.avatar,
          trustScore: merchantInfo.trustScore,
          trustBadge: this.getTrustBadge(merchantInfo.trustScore),
          completedTrades: merchantInfo.completedTrades,
          responseTime: merchantInfo.responseTime,
          onlineStatus: 'online', // For now, assume all merchants are online
          stats: merchantInfo.stats,
        },
        sellCurrency: this.transformCurrency(offer.fromCurrency || offer.sellCurrency),
        buyCurrency: this.transformCurrency(offer.toCurrency || offer.buyCurrency),
        sellAmount: offer.maxAmount || offer.sellAmount || 0, // Use maxAmount as total sellAmount
        buyAmount: offer.maxAmount && offer.exchangeRate ? 
          Math.round(offer.maxAmount * offer.exchangeRate) : 
          (offer.buyAmount || 0),
        exchangeRate: offer.exchangeRate || 0,
        margin: offer.margin || 0,
        paymentMethods: this.transformPaymentMethods(offer.paymentMethods || []),
        paymentWindow: offer.terms?.paymentWindow || offer.paymentWindow || 30,
        minTrade: offer.minAmount || offer.minTrade || 0,
        maxTrade: offer.maxAmount || offer.maxTrade || 0,
        status: offer.status || 'active',
        availableAmount: offer.availableAmount || offer.maxAmount || 0, // availableAmount is what's left
        terms: offer.terms?.instructions || '',
        autoReply: offer.autoReply || offer.terms?.autoReply || undefined,
        kycRequired: offer.terms?.requiresVerification || offer.kycRequired || false,
        bankDetails: offer.bankDetails || undefined, // Preserve bankDetails from backend
        alipayDetails: offer.alipayDetails || undefined, // Preserve alipayDetails from backend
        createdAt: new Date(offer.createdAt),
        updatedAt: new Date(offer.updatedAt),
      };
    });
  }

  /**
   * Transform trade from backend format to frontend format
   */
  private transformTradeFromBackend(backendTrade: any): FXTrade {
    // 🚨 CRITICAL: Raw backend data inspection
    console.log('🔍 RAW BACKEND TRADE DATA (FULL STRUCTURE):', JSON.stringify(backendTrade, null, 2));
    
    console.log('🔍 PARTICIPANT FIELD ANALYSIS:', {
      // Check all possible participant field variations
      merchant: backendTrade.merchant,
      merchantType: typeof backendTrade.merchant,
      merchantKeys: backendTrade.merchant ? Object.keys(backendTrade.merchant) : null,
      merchantId: backendTrade.merchantId,
      merchant_id: backendTrade.merchant_id,
      
      buyer: backendTrade.buyer,
      buyerType: typeof backendTrade.buyer,
      buyerKeys: backendTrade.buyer ? Object.keys(backendTrade.buyer) : null,
      buyerId: backendTrade.buyerId,
      buyer_id: backendTrade.buyer_id,
      
      // Alternative field names
      seller: backendTrade.seller,
      owner: backendTrade.owner,
      maker: backendTrade.maker,
      taker: backendTrade.taker,
      
      allBackendKeys: Object.keys(backendTrade || {})
    });
    
    this.debugger.log('TRANSFORM_TRADE_FROM_BACKEND', { 
      tradeId: backendTrade._id || backendTrade.id,
      status: backendTrade.status,
      fromAmount: backendTrade.fromAmount,
      toAmount: backendTrade.toAmount,
      sellAmount: backendTrade.sellAmount,
      buyAmount: backendTrade.buyAmount,
      fromCurrency: backendTrade.fromCurrency,
      toCurrency: backendTrade.toCurrency,
      offerId: backendTrade.offerId,
      offer: backendTrade.offer,
      offerRef: backendTrade.offerRef,
      merchant: backendTrade.merchant,
      buyer: backendTrade.buyer,
      backendKeys: Object.keys(backendTrade || {})
    });

    // Safeguard required fields to prevent UI crashes when backend omits them
    const safeId = (backendTrade && (backendTrade._id || backendTrade.id)) 
      || ('trade_' + Math.random().toString(36).substring(2, 11));
    const safeCreatedAt = backendTrade?.createdAt ? new Date(backendTrade.createdAt) : new Date();
    const safeChatRoomId = backendTrade?.chatRoomId || `chat_${safeId}`;
    const safeEscrowAmount = typeof backendTrade?.escrowAmount === 'number' ? backendTrade.escrowAmount : 0;
    const safeEscrowCurrency = backendTrade?.escrowCurrency 
      || backendTrade?.sellCurrency?.code 
      || backendTrade?.fromCurrency 
      || 'USD';

    // Enhanced offerId handling - backend returns offer as ObjectId string
    const safeOfferId = backendTrade.offerId 
      || backendTrade.offer?._id 
      || backendTrade.offer?.id 
      || backendTrade.offer  // Direct offer field (ObjectId string)
      || backendTrade.offerRef;

    console.log('🔍 [FXService] Transform offerId debug:', {
      originalOfferId: backendTrade.offerId,
      offerObjectId: backendTrade.offer?._id,
      offerObjectIdAlt: backendTrade.offer?.id,
      offerDirectField: backendTrade.offer,
      offerRef: backendTrade.offerRef,
      finalOfferId: safeOfferId
    });

    // ENHANCED PARTICIPANT DATA HANDLING
    // Backend populates merchant/buyer with MongoDB objects or returns ObjectId strings
    let merchantData = backendTrade.merchant || backendTrade.maker;
    let buyerData = backendTrade.buyer || backendTrade.taker;
    
    console.log('🔍 [FXService] RAW participant data debug:', {
      tradeId: safeId,
      merchantDataType: typeof merchantData,
      merchantDataKeys: merchantData ? Object.keys(merchantData) : null,
      merchantRaw: merchantData,
      buyerDataType: typeof buyerData,
      buyerDataKeys: buyerData ? Object.keys(buyerData) : null,
      buyerRaw: buyerData,
      backendKeys: Object.keys(backendTrade || {})
    });
    
    // ENHANCED ID extraction with comprehensive field checking
    const extractUserId = (userData: any, fallbackName: string, debugContext: string) => {
      console.log(`🔍 [${debugContext}] EXTRACTING USER ID:`, {
        userData,
        userDataType: typeof userData,
        userDataKeys: userData ? Object.keys(userData) : null,
        hasId: userData?.id,
        has_id: userData?._id,
        hasToString: userData?.toString
      });
      
      if (!userData) {
        console.log(`❌ [${debugContext}] No userData provided`);
        return null;
      }
      
      // If it's a string (ObjectId), create minimal object
      if (typeof userData === 'string') {
        console.log(`✅ [${debugContext}] String ObjectId found:`, userData);
        return {
          id: userData,
          _id: userData,
          name: fallbackName,
          trustScore: 0
        };
      }
      
      // If it's a populated MongoDB object, extract the ID properly
      if (typeof userData === 'object') {
        // Try multiple ID extraction methods
        const extractedId = userData._id?.toString() || userData._id || userData.id?.toString() || userData.id;
        
        console.log(`🔍 [${debugContext}] Object ID extraction:`, {
          _id: userData._id,
          _idType: typeof userData._id,
          _idToString: userData._id?.toString(),
          id: userData.id,
          idType: typeof userData.id,
          idToString: userData.id?.toString(),
          finalExtractedId: extractedId
        });
        
        if (!extractedId) {
          console.error(`❌ [${debugContext}] Could not extract ID from object:`, userData);
          return null;
        }
        
        return {
          id: extractedId,
          _id: extractedId,
          name: userData.name || userData.userName || fallbackName,
          avatar: userData.avatar,
          trustScore: userData.trustScore || 0,
          // Preserve original object for debugging
          _original: userData
        };
      }
      
      console.error(`❌ [${debugContext}] Unexpected userData type:`, typeof userData, userData);
      return null;
    };
    
    // Transform participant data using enhanced extraction with context
    merchantData = extractUserId(merchantData, 'Merchant', 'MERCHANT');
    buyerData = extractUserId(buyerData, 'Buyer', 'BUYER');
    
    console.log('🔍 [FXService] PROCESSED participant debug:', {
      tradeId: safeId,
      merchantProcessed: merchantData ? {
        id: merchantData.id,
        _id: merchantData._id,
        name: merchantData.name,
        hasId: !!merchantData.id,
        has_Id: !!merchantData._id
      } : null,
      buyerProcessed: buyerData ? {
        id: buyerData.id,
        _id: buyerData._id,
        name: buyerData.name,
        hasId: !!buyerData.id,
        has_Id: !!buyerData._id
      } : null
    });
    
    // Validation: Ensure we have valid participant IDs
    if (!merchantData?.id && !merchantData?._id) {
      console.error('❌ [FXService] CRITICAL: merchantData missing ID:', {
        tradeId: safeId,
        merchantData,
        originalMerchant: backendTrade.merchant
      });
    }
    
    if (!buyerData?.id && !buyerData?._id) {
      console.error('❌ [FXService] CRITICAL: buyerData missing ID:', {
        tradeId: safeId,
        buyerData,
        originalBuyer: backendTrade.buyer
      });
    }

    return {
      id: safeId,
      offerId: safeOfferId,
      // ENHANCED participant objects with robust ID handling
      maker: {
        id: merchantData?.id || merchantData?._id,
        name: merchantData?.name || 'Merchant',
        avatar: merchantData?.avatar || '/api/placeholder/40/40',
        trustScore: merchantData?.trustScore || 0,
        trustBadge: this.getTrustBadge(merchantData?.trustScore || 0),
        completedTrades: merchantData?.completedTrades || 0,
        responseTime: merchantData?.responseTime || '~5 minutes',
        onlineStatus: merchantData?.isOnline ? 'online' : 'offline',
      },
      taker: {
        id: buyerData?.id || buyerData?._id,
        name: buyerData?.name || 'Buyer',
        trustScore: buyerData?.trustScore || 0,
      },
      // Direct merchant/buyer references - CRITICAL for TradeRoom
      merchant: {
        id: merchantData?.id || merchantData?._id,
        name: merchantData?.name || 'Merchant',
        avatar: merchantData?.avatar || '/api/placeholder/40/40',
        trustScore: merchantData?.trustScore || 0,
        trustBadge: this.getTrustBadge(merchantData?.trustScore || 0),
        completedTrades: merchantData?.completedTrades || 0,
        responseTime: merchantData?.responseTime || '~5 minutes',
        onlineStatus: merchantData?.isOnline ? 'online' : 'offline'
      },
      buyer: {
        id: buyerData?.id || buyerData?._id,
        name: buyerData?.name || 'Buyer',
        trustScore: buyerData?.trustScore || 0,
        avatar: buyerData?.avatar || '/api/placeholder/40/40'
      },
      sellCurrency: this.transformCurrency(backendTrade.fromCurrency || backendTrade.sellCurrency),
      buyCurrency: this.transformCurrency(backendTrade.toCurrency || backendTrade.buyCurrency),
      sellAmount: backendTrade.fromAmount || backendTrade.sellAmount || 0,
      buyAmount: backendTrade.toAmount || backendTrade.buyAmount || 0,
      exchangeRate: backendTrade.exchangeRate || 0,
      paymentMethod: this.transformPaymentMethod(backendTrade.paymentMethod || backendTrade.paymentDetails),
      escrowAmount: safeEscrowAmount,
      escrowCurrency: safeEscrowCurrency,
      status: backendTrade.status || 'pending',
      createdAt: safeCreatedAt,
      quoteLockExpiry: new Date(backendTrade.quoteLockExpiry || Date.now() + 10 * 60 * 1000),
      paymentWindow: {
        start: backendTrade?.paymentWindow?.start || backendTrade?.timeWindows?.acceptedAt ? 
          new Date(backendTrade.paymentWindow?.start || backendTrade.timeWindows.acceptedAt) : safeCreatedAt,
        end: backendTrade?.paymentWindow?.end || backendTrade?.timeWindows?.paymentDeadline ? 
          new Date(backendTrade.paymentWindow?.end || backendTrade.timeWindows.paymentDeadline) : 
          new Date(Date.now() + 30 * 60 * 1000),
      },
      timeWindows: backendTrade?.timeWindows ? {
        acceptanceDeadline: backendTrade.timeWindows.acceptanceDeadline ? new Date(backendTrade.timeWindows.acceptanceDeadline) : undefined,
        acceptedAt: backendTrade.timeWindows.acceptedAt ? new Date(backendTrade.timeWindows.acceptedAt) : undefined,
        paymentDeadline: backendTrade.timeWindows.paymentDeadline ? new Date(backendTrade.timeWindows.paymentDeadline) : undefined,
      } : undefined,
      chatRoomId: safeChatRoomId,
      paymentProofUrl: backendTrade.paymentProofUrl as any, // Type assertion for payment proof URL
      disputeReason: backendTrade.disputeReason,
    };
  }

  /**
   * Transform currency from backend format
   */
  private transformCurrency(currency: any): Currency {
    if (typeof currency === 'string') {
      const currencyData = this.getCurrencies().find(c => c.code === currency);
      return currencyData || { code: currency, name: currency, symbol: currency, flag: '🏴', type: 'fiat' };
    }
    return currency || { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', type: 'fiat' };
  }

  /**
   * Transform payment method from backend format
   */
  private transformPaymentMethod(paymentMethod: any): PaymentMethod {
    if (typeof paymentMethod === 'string') {
      const methodData = this.getPaymentMethods().find(m => m.id === paymentMethod);
      return methodData || { 
        id: paymentMethod, 
        name: paymentMethod, 
        type: 'digital_wallet' as const, // Using a valid type from PaymentMethod
        icon: 'payment',
        processingTime: '5-30 minutes',
        limits: { min: 0, max: 100000 }
      };
    }
    return paymentMethod;
  }

  /**
   * Transform payment methods array from backend format
   */
  private transformPaymentMethods(paymentMethods: any[]): PaymentMethod[] {
    return paymentMethods.map(method => this.transformPaymentMethod(method));
  }

  /**
   * Get trust badge based on trust score
   */
  private getTrustBadge(trustScore: number): 'verified' | 'premium' | 'pro' | undefined {
    if (trustScore >= 95) return 'pro';
    if (trustScore >= 85) return 'premium';
    if (trustScore >= 70) return 'verified';
    return undefined;
  }

  /**
   * Create mock trade for development fallback
   */
  private async createMockTrade(
    offerId: string, 
    amount: number, 
    paymentMethod: PaymentMethod,
    currentUserId?: string
  ): Promise<CreateTradeResponse> {
    // Find the offer
    const offersResponse = await this.getOffers();
    const offer = offersResponse.offers.find(o => o.id === offerId);
    
    if (!offer) {
      return {
        success: false,
        error: 'Offer not found',
      };
    }

    // Validate trade amount
    if (amount < offer.minTrade || amount > offer.maxTrade) {
      return {
        success: false,
        error: `Trade amount must be between ${offer.minTrade} and ${offer.maxTrade}`,
      };
    }

    // Create mock trade object
    const trade: FXTrade = {
      id: 'trade_' + Math.random().toString(36).substring(2, 11),
      offerId: offer.id,
      maker: offer.maker,
      taker: {
        id: currentUserId || 'current_user',
        name: 'You',
        trustScore: 85,
      },
      sellCurrency: offer.sellCurrency,
      buyCurrency: offer.buyCurrency,
      sellAmount: amount,
      buyAmount: Math.round(amount * offer.exchangeRate),
      exchangeRate: offer.exchangeRate,
      paymentMethod: paymentMethod,
      escrowAmount: amount * 0.1, // Adding 10% escrow amount
      escrowCurrency: offer.sellCurrency.code, // Using sell currency code for escrow
      status: 'pending_acceptance' as const, // Correct status for buyer-initiated trades
      createdAt: new Date(),
      quoteLockExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      paymentWindow: {
        start: new Date(),
        end: new Date(Date.now() + offer.paymentWindow * 60 * 1000),
      },
      chatRoomId: 'chat_' + Math.random().toString(36).substring(2, 11),
    };

    this.debugger.log('MOCK_TRADE_CREATED', { trade });

    return {
      success: true,
      trade,
      chatRoomId: trade.chatRoomId,
    };
  }

  private generateMockOffers(): FXOffer[] {
    // Generate mock offers for demonstration
    // In a real app, this data would come from an API
    return [
      {
        id: 'offer_1',
        maker: {
          id: 'maker_1',
          name: 'Alice Chen',
          avatar: '/api/placeholder/40/40',
          trustScore: 98,
          trustBadge: 'verified',
          completedTrades: 1247,
          responseTime: '~2 minutes',
          onlineStatus: 'online',
        },
        sellCurrency: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', type: 'fiat' },
        buyCurrency: { code: 'USDC', name: 'USD Coin', symbol: 'USDC', flag: '💰', type: 'crypto' },
        sellAmount: 10000,
        buyAmount: 1380,
        exchangeRate: 0.138,
        margin: -2.5,
        paymentMethods: this.getPaymentMethods().slice(0, 2),
        paymentWindow: 30,
        minTrade: 100,
        maxTrade: 10000,
        status: 'active',
        availableAmount: 10000,
        terms: 'Fast payment required. No new accounts.',
        kycRequired: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '68e8ebc02eeaf86a4cf6b6ad',
        maker: {
          id: 'merchant_1',
          name: 'Merchant',
          avatar: '/api/placeholder/40/40',
          trustScore: 85,
          trustBadge: undefined,
          completedTrades: 0,
          responseTime: '~5 minutes',
          onlineStatus: 'offline',
        },
        sellCurrency: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', type: 'fiat' },
        buyCurrency: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', type: 'fiat' },
        sellAmount: 500,
        buyAmount: 60000,
        exchangeRate: 120,
        margin: 0,
        paymentMethods: this.getPaymentMethods().slice(0, 1),
        paymentWindow: 30,
        minTrade: 500,
        maxTrade: 1000,
        status: 'active',
        availableAmount: 500,
        terms: 'Quick payment required.',
        kycRequired: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more mock offers as needed
    ];
  }

  private applyFilters(offers: FXOffer[], filters: FXFilter): FXOffer[] {
    return offers.filter(offer => {
      if (filters.sellCurrency && offer.sellCurrency.code !== filters.sellCurrency) {
        return false;
      }
      if (filters.buyCurrency && offer.buyCurrency.code !== filters.buyCurrency) {
        return false;
      }
      if (filters.minAmount && offer.minTrade < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount && offer.maxTrade > filters.maxAmount) {
        return false;
      }
      if (filters.onlineOnly && offer.maker.onlineStatus !== 'online') {
        return false;
      }
      return true;
    });
  }

  private getRequiredActionForStatus(status: FXTrade['status']): TradeUpdateResponse['requiresAction'] {
    switch (status) {
      case 'payment_pending':
        return 'upload_payment_proof';
      case 'payment_sent':
        return 'confirm_payment';
      case 'payment_confirmed':
        return 'sign_release';
      default:
        return undefined;
    }
  }
}

// Export singleton instance
export const fxService = new FXService();

// Export debug utilities for development
export const fxDebugger = FXDebugger.getInstance();

// Debug utility functions for development and testing
export const FXDebugUtils = {
  async getDebugLogs() {
    return await fxDebugger.getDebugLogs();
  },
  
  async clearDebugLogs() {
    return await fxDebugger.clearDebugLogs();
  },
  
  async exportDebugLogs() {
    const logs = await fxDebugger.getDebugLogs();
    const exportData = {
      timestamp: new Date().toISOString(),
      deviceInfo: {
        platform: 'react-native',
        isDev: __DEV__,
      },
      logs: logs,
      summary: {
        totalLogs: logs.length,
        errorCount: logs.filter(log => log.error).length,
        operations: [...new Set(logs.map(log => log.operation))],
        timeRange: logs.length > 0 ? {
          start: logs[0]?.timestamp,
          end: logs[logs.length - 1]?.timestamp
        } : null
      }
    };
    
    console.log('FX Debug Export:', JSON.stringify(exportData, null, 2));
    return exportData;
  },
  
  logPerformanceMetrics() {
    fxDebugger.log('PERFORMANCE_METRICS_REQUEST');
    // Could add performance timing analysis here
  }
};

export default fxService;
