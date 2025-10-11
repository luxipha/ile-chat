import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FXOffer, FXTrade } from '../types/fx';
import { User } from '../services/authService';

export type FXScreen = 'marketplace' | 'offer_detail' | 'trade_room' | 'create_offer';

interface FXContextType {
  // State
  currentFXScreen: FXScreen;
  selectedOffer: FXOffer | null;
  currentTrade: FXTrade | null;
  currentUser: User | null;
  isLoadingGeneral: boolean;

  // State setters
  setCurrentFXScreen: (screen: FXScreen) => void;
  setSelectedOffer: (offer: FXOffer | null) => void;
  setCurrentTrade: (trade: FXTrade | null) => void;
  setCurrentUser: (user: User | null) => void;
  setIsLoadingGeneral: (loading: boolean) => void;

  // Helper functions
  isMerchant: () => boolean;
}

const FXContext = createContext<FXContextType | undefined>(undefined);

interface FXProviderProps {
  children: ReactNode;
  initialUser?: User | null;
  initialIsLoadingGeneral?: boolean;
  onSetIsLoadingGeneral?: (loading: boolean) => void;
}

export const FXProvider: React.FC<FXProviderProps> = ({
  children,
  initialUser = null,
  initialIsLoadingGeneral = false,
  onSetIsLoadingGeneral
}) => {
  const [currentFXScreen, setCurrentFXScreen] = useState<FXScreen>('marketplace');
  const [selectedOffer, setSelectedOffer] = useState<FXOffer | null>(null);
  const [currentTrade, setCurrentTrade] = useState<FXTrade | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [isLoadingGeneral, setIsLoadingGeneralState] = useState<boolean>(initialIsLoadingGeneral);

  const setIsLoadingGeneral = (loading: boolean) => {
    setIsLoadingGeneralState(loading);
    if (onSetIsLoadingGeneral) {
      onSetIsLoadingGeneral(loading);
    }
  };

  const isMerchant = (): boolean => {
    return currentUser?.role === 'merchant';
  };

  const value: FXContextType = {
    // State
    currentFXScreen,
    selectedOffer,
    currentTrade,
    currentUser,
    isLoadingGeneral,

    // State setters
    setCurrentFXScreen,
    setSelectedOffer,
    setCurrentTrade,
    setCurrentUser,
    setIsLoadingGeneral,

    // Helper functions
    isMerchant,
  };

  return <FXContext.Provider value={value}>{children}</FXContext.Provider>;
};

export const useFXContext = (): FXContextType => {
  const context = useContext(FXContext);
  if (context === undefined) {
    throw new Error('useFXContext must be used within a FXProvider');
  }
  return context;
};