# ilePay Mobile

A React Native mobile application for crypto wallet management and real estate property investment.

## Features

- 🔗 Wallet connection and management
- 💰 Token balance viewing and transactions
- 🏠 Real estate property investment platform
- 📱 Mobile-first design with UI Kitten components
- 🔒 Secure local storage for wallet data

## Tech Stack

- **React Native** 0.81.4 with Expo
- **UI Kitten** for component library
- **TypeScript** for type safety
- **React Query** for data fetching and caching
- **AsyncStorage** for local data persistence
- **Expo Vector Icons** for iconography

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── TabNavigator.tsx # Bottom tab navigation
│   └── WalletConnect.tsx # Wallet connection component
├── screens/             # Screen components
│   ├── MainScreen.tsx   # Dashboard/home screen
│   └── WalletScreen.tsx # Wallet management screen
├── hooks/               # Custom React hooks
│   ├── useWallet.ts     # Wallet state management
│   └── useTransactions.ts # Transaction management
├── services/            # API and external services
│   └── api.ts           # API service layer
├── types/               # TypeScript type definitions
│   └── index.ts         # Common types and interfaces
└── utils/               # Utility functions
    └── formatters.ts    # Data formatting utilities
```

## Getting Started

### Prerequisites

- Node.js 18+ (current version has some Metro warnings due to version 20.17.0)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator for testing

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on device/simulator:
```bash
# iOS
npm run ios

# Android  
npm run android

# Web (for testing)
npm run web
```

## Features Overview

### Wallet Management
- Connect/disconnect wallet functionality
- View wallet address and balances
- Send and receive cryptocurrencies
- Transaction history

### Property Investment
- Browse available real estate properties
- View property details and tokenization info
- Invest in fractional property ownership
- Track property portfolio

### Mobile-First Design
- Bottom tab navigation for easy mobile use
- Card-based UI with Eva Design System
- Responsive layout for various screen sizes
- Native mobile interactions and gestures

## API Integration

The app is designed to integrate with a backend API for:
- User authentication
- Wallet operations
- Property data
- Transaction processing

Update the `API_BASE_URL` in `src/services/api.ts` to point to your backend service.

## Future Enhancements

- [ ] Implement full Crossmint SDK integration
- [ ] Add biometric authentication
- [ ] Implement push notifications
- [ ] Add dark mode support
- [ ] Integrate real blockchain networks
- [ ] Add property search and filtering
- [ ] Implement KYC/AML compliance
- [ ] Add portfolio analytics and charts

## Development Notes

### Dependency Conflicts
Currently using React 18.2.0 for compatibility with Crossmint SDK. Some peer dependency warnings are expected due to React Native 0.81.4 expecting React 19.

### Crossmint Integration
Basic wallet connection is implemented with simulation. Full Crossmint SDK integration pending resolution of dependency conflicts.

### State Management
Using React Query for server state and local React state for UI state. Consider adding Redux or Zustand for complex global state needs.

## Contributing

1. Follow the existing code structure and conventions
2. Use TypeScript for all new code
3. Follow UI Kitten component patterns
4. Add proper error handling and loading states
5. Test on both iOS and Android platforms