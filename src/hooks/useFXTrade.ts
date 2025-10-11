import { useFXContext } from '../contexts/FXContext';
import { useFXNavigation } from './useFXNavigation';
import { FXOffer, FXTrade } from '../types/fx';
import fxService from '../services/fxService';
import { createTradeConversationId } from '../services/chatService';

export const useFXTrade = () => {
  const {
    currentUser,
    selectedOffer,
    currentTrade,
    setCurrentTrade,
    setIsLoadingGeneral,
    isLoadingGeneral
  } = useFXContext();

  const { navigateToTradeRoom, navigateToMarketplace } = useFXNavigation();

  // Merchant-specific handlers
  const handleEditOffer = (offer: FXOffer) => {
    console.log('✏️ Edit offer:', offer.id);
    // Implementation would go here
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      console.log('🗑️ Deleting offer:', offerId);
      setIsLoadingGeneral(true);
      
      // Note: deleteOffer method may not exist in fxService - placeholder implementation
      console.log('⚠️ Delete offer functionality not implemented in service');
      navigateToMarketplace();
    } catch (error) {
      console.error('❌ Exception deleting offer:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleToggleOfferStatus = async (offerId: string, isActive: boolean) => {
    try {
      console.log('🔄 Toggling offer status:', { offerId, isActive });
      setIsLoadingGeneral(true);
      
      // Note: toggleOfferStatus method may not exist in fxService - placeholder implementation
      console.log('⚠️ Toggle offer status functionality not implemented in service');
    } catch (error) {
      console.error('❌ Exception toggling offer status:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  // Trade initiation and management
  const handleStartTrade = async (offer: FXOffer, amount: number) => {
    if (!currentUser) return;

    try {
      console.log('🚀 Starting trade...', { offerId: offer.id, amount });
      setIsLoadingGeneral(true);

      const response = await fxService.createTrade(
        offer.id,
        amount,
        offer.paymentMethods[0],
        currentUser.id
      );

      if (response.success && response.trade) {
        console.log('✅ Trade created successfully');
        setCurrentTrade(response.trade);
        navigateToTradeRoom();
      } else {
        console.error('❌ Failed to create trade:', response.error);
      }
    } catch (error) {
      console.error('❌ Exception creating trade:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleAcceptTrade = async () => {
    if (!currentTrade) return;

    try {
      console.log('✅ Accepting trade...');
      setIsLoadingGeneral(true);

      // Note: acceptTrade method may not exist in fxService - placeholder implementation
      console.log('⚠️ Accept trade functionality not implemented in service');
      await updateTradeStatus('accepted');
    } catch (error) {
      console.error('❌ Exception accepting trade:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleUploadPaymentProof = async (proofData: any) => {
    if (!currentTrade) return;

    try {
      console.log('📤 Uploading payment proof...');
      setIsLoadingGeneral(true);

      const response = await fxService.uploadPaymentProof(currentTrade.id, proofData);
      
      if (response.success) {
        console.log('✅ Payment proof uploaded successfully');
        await updateTradeStatus('payment_sent');
      } else {
        console.error('❌ Failed to upload payment proof:', response.error);
      }
    } catch (error) {
      console.error('❌ Exception uploading payment proof:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentTrade) return;

    try {
      console.log('💰 Confirming payment...');
      setIsLoadingGeneral(true);

      const response = await fxService.confirmPayment(currentTrade.id);
      
      if (response.success) {
        console.log('✅ Payment confirmed successfully');
        await updateTradeStatus('payment_confirmed');
      } else {
        console.error('❌ Failed to confirm payment:', response.error);
      }
    } catch (error) {
      console.error('❌ Exception confirming payment:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleSignRelease = async () => {
    if (!currentTrade) return;

    try {
      console.log('🔓 Signing release...');
      setIsLoadingGeneral(true);

      const response = await fxService.signRelease(currentTrade.id);
      
      if (response.success) {
        console.log('✅ Release signed successfully');
        await updateTradeStatus('completed');
      } else {
        console.error('❌ Failed to sign release:', response.error);
      }
    } catch (error) {
      console.error('❌ Exception signing release:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleOpenDispute = async (reason: string) => {
    if (!currentTrade) return;

    try {
      console.log('⚠️ Opening dispute...');
      setIsLoadingGeneral(true);

      const response = await fxService.openDispute(currentTrade.id, reason);
      
      if (response.success) {
        console.log('✅ Dispute opened successfully');
        await updateTradeStatus('disputed');
      } else {
        console.error('❌ Failed to open dispute:', response.error);
      }
    } catch (error) {
      console.error('❌ Exception opening dispute:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleCompleteRating = async (rating: number, review?: string) => {
    if (!currentTrade) return;

    try {
      console.log('⭐ Submitting rating...');
      
      const response = await fxService.submitRating(currentTrade.id, rating, review);
      
      if (response.success) {
        console.log('✅ Rating submitted successfully');
        // Navigate back to marketplace
        setCurrentTrade(null);
        navigateToMarketplace();
      } else {
        console.error('❌ Failed to submit rating:', response.error);
      }
    } catch (error) {
      console.error('❌ Exception submitting rating:', error);
    }
  };

  const updateTradeStatus = async (status: FXTrade['status']) => {
    if (!currentTrade) return;

    try {
      const response = await fxService.updateTradeStatus(currentTrade.id, status);
      
      if (response.success) {
        // Update local trade state
        setCurrentTrade({
          ...currentTrade,
          status: status,
        });
      }
    } catch (error) {
      console.error('❌ Failed to update trade status:', error);
    }
  };

  // Trade Context Creation Logic
  const handleContactTrader = async () => {
    if (!selectedOffer || !currentUser) return;

    console.log('💬 [useFXTrade] onContactTrader invoked from FXOfferDetail', {
      selectedOfferId: selectedOffer.id,
      makerId: selectedOffer.maker.id,
      makerName: selectedOffer.maker.name,
      currentTradeId: currentTrade?.id,
      currentTradeOfferId: currentTrade?.offerId,
      currentUserId: currentUser?.id || (currentUser as any)?._id,
      currentUserRole: currentUser?.role,
    });
    
    const currentUserId = currentUser?.id || (currentUser as any)?._id;
    const makerId = selectedOffer.maker.id;
    const makerName = selectedOffer.maker.name;
    
    // First, try to find an existing trade for this offer
    let tradeForOffer = currentTrade;
    if (!tradeForOffer || tradeForOffer.offerId !== selectedOffer.id) {
      try {
        console.log('🔎 [useFXTrade] Looking for existing trade for this offer');
        const res = await fxService.getUserTrades({ limit: 20, offset: 0 });
        if (res.success) {
          // Look for trades where:
          // 1. The trade is for this specific offer
          // 2. The trade is not completed or cancelled
          // 3. The current user is either the merchant (maker) or buyer (taker)
          tradeForOffer = res.trades.find(
            (t) => {
              const isForThisOffer = t.offerId === selectedOffer.id;
              const isActiveStatus = t.status !== 'completed' && t.status !== 'cancelled';
              const isUserInvolved = t.maker.id === currentUserId || t.taker.id === currentUserId;
              
              console.log('🔍 [useFXTrade] Trade check:', {
                tradeId: t.id,
                offerId: t.offerId,
                selectedOfferId: selectedOffer.id,
                status: t.status,
                makerId: t.maker.id,
                takerId: t.taker.id,
                currentUserId,
                isForThisOffer,
                isActiveStatus,
                isUserInvolved
              });
              
              return isForThisOffer && isActiveStatus && isUserInvolved;
            }
          ) || null;
          if (tradeForOffer) {
            console.log('✅ [useFXTrade] Found existing trade for offer', { 
              tradeId: tradeForOffer.id,
              status: tradeForOffer.status,
              userRole: tradeForOffer.maker.id === currentUserId ? 'merchant' : 'buyer'
            });
          } else {
            console.log('❌ [useFXTrade] No existing trade found for offer', { 
              offerId: selectedOffer.id,
              totalTrades: res.trades.length 
            });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch trades:', e);
      }
    }
    
    // If no existing trade, create a mock trade context for discussion
    if (!tradeForOffer && currentUser) {
      console.log('🆕 [useFXTrade] Creating mock trade context for offer discussion');
      tradeForOffer = {
        id: `mock_${selectedOffer.id}_${Date.now()}`,
        offerId: selectedOffer.id,
        maker: selectedOffer.maker,
        taker: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          trustScore: currentUser.trustScore || 0 // Use user's trust score or default to 0
        },
        sellCurrency: selectedOffer.sellCurrency,
        buyCurrency: selectedOffer.buyCurrency,
        sellAmount: selectedOffer.sellAmount,
        buyAmount: selectedOffer.buyAmount,
        exchangeRate: selectedOffer.exchangeRate,
        paymentMethod: selectedOffer.paymentMethods[0], // Use first payment method
        escrowAmount: 0,
        escrowCurrency: 'USDC',
        status: 'pending',
        createdAt: new Date(),
        quoteLockExpiry: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        paymentWindow: {
          start: new Date(),
          end: new Date(Date.now() + selectedOffer.paymentWindow * 60 * 1000)
        },
        chatRoomId: createTradeConversationId(selectedOffer.id, currentUser.id),
        offer: selectedOffer
      } as FXTrade;
    }
    
    // Set the trade context and navigate to trade room
    if (tradeForOffer) {
      console.log('🎯 [useFXTrade] Setting trade context and navigating to TradeRoom', { 
        tradeId: tradeForOffer.id,
        offerId: tradeForOffer.offerId 
      });
      
      setCurrentTrade(tradeForOffer);
      navigateToTradeRoom();
    } else {
      console.warn('❌ [useFXTrade] No trade context available - cannot navigate to trade room');
    }
  };

  return {
    // State
    currentTrade,
    isLoadingGeneral,

    // Merchant handlers
    handleEditOffer,
    handleDeleteOffer,
    handleToggleOfferStatus,

    // Trade handlers
    handleStartTrade,
    handleAcceptTrade,
    handleUploadPaymentProof,
    handleConfirmPayment,
    handleSignRelease,
    handleOpenDispute,
    handleCompleteRating,
    handleContactTrader,

    // Utility
    updateTradeStatus,
  };
};