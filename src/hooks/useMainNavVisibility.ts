import { useMemo } from 'react';

export interface NavigationState {
  selectedChat: any;
  currentMeScreen: string;
  showContactProfile: boolean;
  selectedLoan: any;
  currentWalletScreen: string;
  currentContactScreen: string;
}

export const useMainNavVisibility = (state: NavigationState): boolean => {
  return useMemo(() => {
    const {
      selectedChat,
      currentMeScreen,
      showContactProfile,
      selectedLoan,
      currentWalletScreen,
      currentContactScreen
    } = state;

    // MainNav is visible when user is on main screens (not in detail views)
    const isOnMainScreens = 
      currentMeScreen === 'main' &&
      currentWalletScreen === 'main' &&
      currentContactScreen === 'main';

    // MainNav is hidden when viewing details
    const isViewingDetails = 
      !!selectedChat ||
      showContactProfile ||
      !!selectedLoan;

    const isVisible = isOnMainScreens && !isViewingDetails;

    return isVisible;
  }, [
    state.selectedChat,
    state.currentMeScreen,
    state.showContactProfile,
    state.selectedLoan,
    state.currentWalletScreen,
    state.currentContactScreen
  ]);
};

// Helper function to reset navigation state to main screens
export const getDefaultNavigationState = () => ({
  currentMeScreen: 'main',
  currentWalletScreen: 'main',
  currentContactScreen: 'main',
  selectedChat: null,
  showContactProfile: false,
  selectedLoan: null
});