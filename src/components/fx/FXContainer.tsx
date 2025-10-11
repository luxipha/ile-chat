import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { FXMarketplace } from './FXMarketplace';
import { UserMarketplace } from './user/UserMarketplace';
import { UserOfferDetail } from './user/UserOfferDetail';
import { MerchantDashboard } from './merchant/MerchantDashboard';
import { MerchantOfferDetail } from './merchant/MerchantOfferDetail';
import { UserTradesDashboard } from './user/UserTradesDashboard';
import { PendingTradesScreen } from './merchant/PendingTradesScreen';
import { TradeRoom } from './TradeRoom';
import { CreateFXOffer } from './CreateFXOffer';
import fxService from '../../services/fxService';
import { createTradeConversationId } from '../../services/chatService';
import { FXOffer, FXTrade } from '../../types/fx';
import { User } from '../../services/authService';
import { FXTheme } from '../../theme/fxTheme';

export type FXScreen = 'marketplace' | 'offer_detail' | 'trade_room' | 'create_offer' | 'user_trades' | 'pending_trades';

interface FXContainerProps {
  currentUser: User | null;
  isLoadingGeneral: boolean;
  setIsLoadingGeneral: (loading: boolean) => void;
  onBack?: () => void;
}

export const FXContainer: React.FC<FXContainerProps> = ({
  currentUser,
  isLoadingGeneral,
  setIsLoadingGeneral,
  onBack
}) => {
  // FX State Management
  const [currentFXScreen, setCurrentFXScreen] = useState<FXScreen>('marketplace');
  const [selectedOffer, setSelectedOffer] = useState<FXOffer | null>(null);
  const [currentTrade, setCurrentTrade] = useState<FXTrade | null>(null);

  // Debug logging for user data
  useEffect(() => {
    console.log('🔍 [FXContainer] User data received:', {
      hasCurrentUser: !!currentUser,
      userId: currentUser?.id,
      userName: currentUser?.name,
      userRole: currentUser?.role,
      hasMerchantProfile: !!currentUser?.merchantProfile,
      merchantProfile: currentUser?.merchantProfile ? Object.keys(currentUser.merchantProfile) : null,
      fullUser: currentUser
    });
  }, [currentUser]);

  // Poll for trade status updates if there's a pending trade
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (currentTrade && currentTrade.status === 'pending_acceptance') {
      console.log('🔄 [FXContainer] Starting trade status polling for pending trade:', currentTrade.id);
      
      pollInterval = setInterval(async () => {
        try {
          const response = await fxService.getTradeById(currentTrade.id);
          if (response.success && response.trade) {
            if (response.trade.status !== currentTrade.status) {
              console.log('✅ [FXContainer] Trade status updated:', {
                tradeId: currentTrade.id,
                oldStatus: currentTrade.status,
                newStatus: response.trade.status
              });
              setCurrentTrade(response.trade);
              
              // If trade is now accepted, could show notification
              if (response.trade.status === 'accepted') {
                console.log('🎉 [FXContainer] Trade accepted! User can now access trade room');
              }
            }
          }
        } catch (error) {
          console.warn('Failed to poll trade status:', error);
        }
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        console.log('🛑 [FXContainer] Stopped trade status polling');
      }
    };
  }, [currentTrade]);

  // Helper function to check if user is a merchant
  const isMerchant = () => {
    const hasRole = currentUser?.role === 'merchant';
    const isApprovedMerchant = currentUser?.merchantProfile?.status === 'approved';
    
    // User is merchant ONLY if they have merchant role OR have an approved merchant profile
    // Having a merchantProfile object alone is not enough - it must be approved
    const result = hasRole || isApprovedMerchant;
    
    console.log('🏪 [FXContainer] isMerchant check - DETAILED:', {
      userId: currentUser?.id,
      userName: currentUser?.name,
      role: currentUser?.role,
      roleType: typeof currentUser?.role,
      hasMerchantProfile: !!currentUser?.merchantProfile,
      merchantProfileStatus: currentUser?.merchantProfile?.status,
      isApprovedMerchant,
      merchantProfile: currentUser?.merchantProfile,
      merchantProfileType: typeof currentUser?.merchantProfile,
      allUserKeys: currentUser ? Object.keys(currentUser) : null,
      fullUserData: currentUser,
      result
    });
    return result;
  };

  // Merchant-specific handlers
  const handleEditOffer = (offer: FXOffer) => {
    setSelectedOffer(offer);
    setCurrentFXScreen('create_offer'); // Reuse create offer screen for editing
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      setIsLoadingGeneral(true);
      // TODO: Implement delete offer API call
      console.log('Deleting offer:', offerId);
      // await fxService.deleteOffer(offerId);
      setCurrentFXScreen('marketplace');
      setSelectedOffer(null);
    } catch (error) {
      console.error('Error deleting offer:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleToggleOfferStatus = async (offerId: string, isActive: boolean) => {
    try {
      setIsLoadingGeneral(true);
      // TODO: Implement toggle offer status API call
      console.log('Toggling offer status:', offerId, isActive);
      // await fxService.toggleOfferStatus(offerId, isActive);
      // Refresh the selected offer if it's currently displayed
      if (selectedOffer?.id === offerId) {
        const updatedOffer = { 
          ...selectedOffer, 
          status: (isActive ? 'active' : 'paused') as 'active' | 'paused' | 'completed' | 'cancelled'
        };
        setSelectedOffer(updatedOffer);
      }
    } catch (error) {
      console.error('Error toggling offer status:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };
  const handleStartTrade = async (amount: number) => {
    if (!selectedOffer || !currentUser) return;

    try {
      console.log('🚀 Starting trade with amount:', amount);
      setIsLoadingGeneral(true);

      const currentUserId = currentUser.id || (currentUser as any)?._id;
      const isOfferMaker = selectedOffer.maker.id === currentUserId;

      if (isOfferMaker) {
        // Seller accepting the trade - create active trade and open trade room immediately
        const response = await fxService.createTrade(
          selectedOffer.id,
          amount,
          selectedOffer.paymentMethods[0],
          currentUser?.id || 'current_user'
        );

        if (response.success && response.trade) {
          console.log('✅ Trade accepted by seller:', response.trade);
          setCurrentTrade(response.trade);
          setCurrentFXScreen('trade_room');
        } else {
          console.error('❌ Failed to accept trade:', response.error);
          // Show error to user
        }
      } else {
        // Buyer starting the trade - create pending trade and activate trade room icon
        const response = await fxService.createTrade(
          selectedOffer.id,
          amount,
          selectedOffer.paymentMethods[0],
          currentUser?.id || 'current_user'
        );

        if (response.success && response.trade) {
          console.log('✅ Pending trade created by buyer:', response.trade);
          // Set trade to update button state
          setCurrentTrade(response.trade);
          // Don't navigate to trade room - trade room icon will only show when status is accepted or later
          console.log('🎯 Pending trade created - trade room will activate when seller accepts');
        } else {
          console.error('❌ Failed to create pending trade:', response.error);
          // Show error to user
        }
      }
    } catch (error) {
      console.error('❌ Exception creating trade:', error);
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const handleUploadPaymentProof = async (file: any) => {
    if (!currentTrade) return;

    try {
      console.log('📄 Uploading payment proof...');
      setIsLoadingGeneral(true);

      const response = await fxService.uploadPaymentProof(currentTrade.id, file);
      
      if (response.success) {
        console.log('✅ Payment proof uploaded successfully');
        // Update trade status
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
      console.log('✅ Confirming payment...');
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
      console.log('🔐 Signing release...');
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
        setCurrentFXScreen('marketplace');
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

    console.log('💬 [FXContainer] onContactTrader invoked from FXOfferDetail', {
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
        console.log('🔎 [FXContainer] Looking for existing trade for this offer');
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
              
              console.log('🔍 [FXContainer] Trade check:', {
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
            console.log('✅ [FXContainer] Found existing trade for offer', { 
              tradeId: tradeForOffer.id,
              status: tradeForOffer.status,
              userRole: tradeForOffer.maker.id === currentUserId ? 'merchant' : 'buyer'
            });
          } else {
            console.log('❌ [FXContainer] No existing trade found for offer', { 
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
      console.log('🆕 [FXContainer] Creating mock trade context for offer discussion');
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
      console.log('🎯 [FXContainer] Setting trade context and navigating to TradeRoom', { 
        tradeId: tradeForOffer.id,
        offerId: tradeForOffer.offerId 
      });
      
      setCurrentTrade(tradeForOffer);
      setCurrentFXScreen('trade_room');
    } else {
      console.warn('❌ [FXContainer] No trade context available - cannot navigate to trade room');
    }
  };

  // Navigation handlers
  const handleOfferSelect = async (offer: FXOffer) => {
    setSelectedOffer(offer);
    setCurrentFXScreen('offer_detail');
    
    // Check for existing pending trade for this offer
    if (currentUser) {
      try {
        const currentUserId = currentUser.id || (currentUser as any)?._id;
        const res = await fxService.getUserTrades({ limit: 20, offset: 0 });
        
        if (res.success) {
          const existingTrade = res.trades.find(
            (t) => {
              const isForThisOffer = t.offerId === offer.id;
              const isActiveStatus = t.status !== 'completed' && t.status !== 'cancelled';
              const isUserInvolved = t.maker.id === currentUserId || t.taker.id === currentUserId;
              
              return isForThisOffer && isActiveStatus && isUserInvolved;
            }
          );
          
          if (existingTrade) {
            console.log('✅ [FXContainer] Found existing trade for offer', { 
              tradeId: existingTrade.id,
              status: existingTrade.status,
              userRole: existingTrade.maker.id === currentUserId ? 'merchant' : 'buyer'
            });
            setCurrentTrade(existingTrade);
          } else {
            setCurrentTrade(null);
          }
        }
      } catch (error) {
        console.warn('Failed to check for existing trades:', error);
        setCurrentTrade(null);
      }
    }
  };

  const handleBackToMarketplace = () => {
    setCurrentFXScreen('marketplace');
    setSelectedOffer(null);
    setCurrentTrade(null);
  };

  const handleCreateOffer = () => {
    setCurrentFXScreen('create_offer');
  };

  const handleOfferCreated = (offer: Partial<FXOffer>) => {
    setCurrentFXScreen('marketplace');
  };

  const handleViewUserTrades = () => {
    setCurrentFXScreen('user_trades');
  };

  const handleViewPendingTrades = () => {
    setCurrentFXScreen('pending_trades');
  };

  // FX Screen Navigation Logic
  const renderFXScreen = () => {
    switch (currentFXScreen) {
      case 'marketplace':
        // Show merchant dashboard for merchants, regular marketplace for users
        if (isMerchant()) {
          return (
            <MerchantDashboard
              onOfferSelect={handleOfferSelect}
              onCreateOffer={handleCreateOffer}
              onViewPendingTrades={handleViewPendingTrades}
              onBack={onBack}
              currentUser={currentUser}
            />
          );
        } else {
          return (
            <UserMarketplace
              onOfferSelect={handleOfferSelect}
              onBack={onBack}
            />
          );
        }

      case 'offer_detail':
        if (selectedOffer) {
          console.log('🎯 [FXContainer] Rendering offer detail with offer data:', {
            offerId: selectedOffer.id,
            maker: selectedOffer.maker.name,
            sellCurrency: selectedOffer.sellCurrency,
            buyCurrency: selectedOffer.buyCurrency,
            sellAmount: selectedOffer.sellAmount,
            buyAmount: selectedOffer.buyAmount,
            exchangeRate: selectedOffer.exchangeRate
          });

          // Show merchant offer detail for merchants viewing their own offers
          const isOwnOffer = currentUser?.id === selectedOffer.maker.id;
          if (isMerchant() && isOwnOffer) {
            return (
              <MerchantOfferDetail
                offer={selectedOffer}
                onBack={handleBackToMarketplace}
                onEditOffer={handleEditOffer}
                onDeleteOffer={handleDeleteOffer}
                onToggleOfferStatus={handleToggleOfferStatus}
                currentTrade={currentTrade}
              />
            );
          } else {
            return (
              <UserOfferDetail
                offer={selectedOffer}
                onBack={handleBackToMarketplace}
                onStartTrade={handleStartTrade}
                onContactTrader={handleContactTrader}
                onSaveOffer={() => {}} // TODO: Implement save offer functionality
                onReportOffer={() => {}} // TODO: Implement report offer functionality
                currentTrade={currentTrade}
                isSaved={false} // TODO: Implement saved offer state
              />
            );
          }
        }
        return null;
        
      case 'trade_room':
        if (currentTrade) {
          console.log('🎯 [FXContainer] Rendering TradeRoom with trade data:', {
            tradeId: currentTrade.id,
            status: currentTrade.status,
            sellCurrency: currentTrade.sellCurrency,
            buyCurrency: currentTrade.buyCurrency,
            sellAmount: currentTrade.sellAmount,
            buyAmount: currentTrade.buyAmount
          });

          return (
            <TradeRoom
              trade={currentTrade}
              onBack={handleBackToMarketplace}
              onUploadPaymentProof={handleUploadPaymentProof}
              onConfirmPayment={handleConfirmPayment}
              onSignRelease={handleSignRelease}
              onOpenDispute={handleOpenDispute}
              onCompleteRating={handleCompleteRating}
            />
          );
        }
        return null;

      case 'create_offer':
        return (
          <CreateFXOffer
            visible={true}
            onClose={handleBackToMarketplace}
            onOfferCreated={handleOfferCreated}
          />
        );

      case 'user_trades':
        return (
          <UserTradesDashboard
            onBack={handleBackToMarketplace}
            onTradeSelect={(trade) => {
              setCurrentTrade(trade);
              setCurrentFXScreen('trade_room');
            }}
          />
        );

      case 'pending_trades':
        return (
          <PendingTradesScreen
            onBack={handleBackToMarketplace}
            onTradeSelect={(trade) => {
              setCurrentTrade(trade);
              setCurrentFXScreen('trade_room');
            }}
            currentUser={currentUser}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={FXTheme.containers.screen}>
      {renderFXScreen()}
    </View>
  );
};