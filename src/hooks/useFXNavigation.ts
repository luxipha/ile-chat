import { useFXContext } from '../contexts/FXContext';
import { FXOffer } from '../types/fx';

export const useFXNavigation = () => {
  const {
    currentFXScreen,
    setCurrentFXScreen,
    setSelectedOffer,
    setCurrentTrade,
    isMerchant
  } = useFXContext();

  // Navigation handlers
  const handleOfferSelect = (offer: FXOffer) => {
    setSelectedOffer(offer);
    setCurrentFXScreen('offer_detail');
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

  const navigateToTradeRoom = () => {
    setCurrentFXScreen('trade_room');
  };

  const navigateToOfferDetail = () => {
    setCurrentFXScreen('offer_detail');
  };

  const navigateToMarketplace = () => {
    setCurrentFXScreen('marketplace');
  };

  const navigateToCreateOffer = () => {
    setCurrentFXScreen('create_offer');
  };

  return {
    // Current state
    currentFXScreen,
    
    // Navigation handlers
    handleOfferSelect,
    handleBackToMarketplace,
    handleCreateOffer,
    handleOfferCreated,
    
    // Direct navigation methods
    navigateToTradeRoom,
    navigateToOfferDetail,
    navigateToMarketplace,
    navigateToCreateOffer,
    
    // Helper
    isMerchant
  };
};