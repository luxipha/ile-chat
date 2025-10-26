# Ile-MVP Project Documentation

## Project Overview

**Ile-MVP** is a comprehensive real estate investment and fintech platform built as a React Native mobile application with a Node.js backend. The project focuses on property tokenization, peer-to-peer financial services, and social features.

### Main Features:
- **Property Investment**: Tokenized real estate investments using blockchain technology
- **Wallet Services**: Multi-chain cryptocurrency wallet with P2P transfers
- **FX Trading**: Foreign exchange marketplace with merchant and user trading
- **Social Features**: Chat, community posts, friend requests, group messaging
- **Gamification**: Brick rewards system, referral programs, daily streaks
- **Admin Panel**: Property management, user administration, analytics

### Tech Stack:
- **Frontend**: React Native (Expo), TypeScript
- **Backend**: Node.js, Express.js, MongoDB
- **Blockchain**: Multi-chain support (Aptos, Hedera, Skale, Base, Ethereum)
- **Authentication**: Firebase Auth, Custom JWT, Email auth
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Firebase Firestore for chat
- **File Storage**: Cloudinary for images
- **Push Notifications**: Firebase Cloud Messaging

## Architecture

### Multi-App Structure:
The project consists of several interconnected applications:
- **ilePayMobile**: Main React Native mobile app
- **backend**: Express.js API server
- **admin**: React admin dashboard
- **ile-legal**: Supabase-based legal document management
- **ileVault**: Property investment dashboard

### Backend Architecture:
- **Service Layer Pattern**: Business logic in separate services
- **Chain Factory Pattern**: Abstracted blockchain interactions
- **Model-View-Controller**: Express routes, Mongoose models, service controllers
- **Module Aliases**: Path resolution with @models, @services, @routes

### Key File Structure:
```
src/
├── components/          # UI components
│   ├── ui/             # Reusable UI elements
│   ├── chat/           # Chat-specific components
│   ├── fx/             # FX trading components
│   └── wallet/         # Wallet components
├── services/           # API and business logic
├── types/              # TypeScript interfaces
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── theme/              # Design system constants
└── utils/              # Utility functions
```

## Development Setup

### Environment Configuration:
```bash
# Backend (.env)
MONGODB_URI=mongodb+srv://...
APTOS_API_KEY=...
FRONTEND_URL=http://localhost:8082
NODE_ENV=development

# Mobile App
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Important Scripts:
```bash
# Backend
npm run dev          # Start development server
npm run bot          # Start Telegram bot
npm test            # Run Jest tests

# Mobile App
npm start           # Start Expo dev server
npm run android     # Android development
npm run ios         # iOS development
npm run web         # Web development
```

## Key Services and APIs

### Backend Services:
- **Authentication**: `/api/auth/*` - Multiple auth methods (email, Firebase, JWT)
- **User Management**: `/api/users/*` - User profiles, settings, friends
- **Property Investment**: `/api/properties/*` - Tokenized real estate
- **FX Trading**: `/api/fx/*` - Currency exchange marketplace
- **Wallet Operations**: `/api/wallet/*` - Multi-chain blockchain operations
- **Social Features**: `/api/community/*` - Posts, comments, friendships
- **Chat System**: Firebase Firestore integration
- **Notifications**: `/api/notifications/*` - Push notifications

### Frontend Services:
- **authService.ts**: Authentication and user management
- **walletService.ts**: Blockchain wallet operations
- **communityService.ts**: Social features and posts
- **chatService.ts**: Real-time messaging
- **fxService.ts**: Foreign exchange trading
- **propertyService.ts**: Property investment
- **api.ts**: Core HTTP client with retry logic

## Common Issues and Solutions

### Known Issues:
1. **API Timeout**: 30-second timeout for slow blockchain operations
2. **Image Upload**: Use FormData for all image uploads (chat and moments)
3. **Friendship System**: Uses compound unique index on user1/user2 fields
4. **TypeScript Errors**: Use `(response.data as any)` for API response access
5. **CORS Issues**: Multiple allowed origins configured

### Recently Fixed Issues:
- **Moments Image Upload**: Fixed to use same endpoint as chat (`/api/firebase-auth/upload-image`)
- **Community Privacy**: Added friendship-based post filtering
- **Friendship Creation**: Fixed duplicate key errors with proper schema
- **Photo Selection**: Fixed document availability check for web environments

### Debugging Patterns:
- **Comprehensive Logging**: Request/response logging with performance metrics
- **Error Boundaries**: React error boundaries for graceful failure handling
- **Network Retry**: Automatic retry logic with exponential backoff
- **Test Scripts**: Extensive test scripts in `backend/scripts/`

## Code Patterns and Conventions

### Naming Conventions:
- **Components**: PascalCase (e.g., `FXMarketplace.tsx`)
- **Services**: camelCase (e.g., `authService.ts`)
- **Types**: PascalCase interfaces (e.g., `User`, `Transaction`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

### State Management:
- **React Context**: Global state for notifications, FX trading
- **AsyncStorage**: Local persistence for user preferences
- **Firebase**: Real-time state for chat and notifications

### Error Handling:
- **Service Layer**: Consistent error response format with success/error fields
- **UI Components**: Error boundaries and fallback states
- **Network**: Retry logic with timeout handling
- **Validation**: Frontend and backend validation with clear error messages

## Database Models

### Key Models:
- **User**: User profiles, authentication, wallet addresses
- **Property**: Tokenized real estate investments
- **Transaction**: Financial transactions and blockchain operations
- **FXOffer/FXTrade**: Foreign exchange marketplace
- **CommunityPost**: Social media posts with images
- **Friendship**: User relationships with privacy controls
- **FriendRequest**: Friend request system
- **Notification**: Push notification management

### Blockchain Integration:
- **Multi-chain Support**: Aptos, Hedera, Skale, Base, Ethereum
- **Chain Factory**: Abstracted blockchain operations
- **Wallet Creation**: Automated wallet generation per user
- **Token Management**: ERC-20 and native token support

## Security Considerations

### Authentication:
- **JWT Tokens**: Backend authentication with expiration
- **Firebase Auth**: Google and email authentication
- **PIN Security**: App-level PIN protection
- **Session Management**: Automatic token refresh

### Privacy:
- **Friend-based Visibility**: Posts only visible to friends
- **Profile Privacy**: Controlled access to user information
- **Data Encryption**: Sensitive data encryption at rest
- **API Rate Limiting**: Protection against abuse

## Deployment

### Backend Deployment:
- **Platform**: Render.com
- **Docker**: Containerized deployment
- **Environment**: Production environment variables
- **CI/CD**: GitHub Actions automated deployment

### Mobile App:
- **Platform**: Expo Application Services (EAS)
- **Builds**: Automated build generation
- **Updates**: Over-the-air updates via Expo

### Excluded from Production:
- `tests/` - Unit and integration tests
- `scripts/` - Database scripts and utilities
- `coverage/` - Test coverage reports
- `move/` - Aptos Move contracts (deployed separately)
- `skale-contracts/` - Smart contracts (deployed separately)

## Recent Changes and Fixes

### Image Upload System:
- **Unified Approach**: Both chat and moments use `/api/firebase-auth/upload-image`
- **FormData Support**: Proper FormData handling for mobile file URIs
- **Error Handling**: Improved error detection and logging

### Community System:
- **Privacy Controls**: Friendship-based post visibility
- **Index Optimization**: Fixed duplicate key errors in friendships
- **Performance**: Background cache updates for faster loading

### Type Safety:
- **API Responses**: Added proper type assertions for response handling
- **Error Resolution**: Fixed TypeScript errors throughout codebase

## Testing and Quality Assurance

### Test Scripts:
- **Backend**: Jest tests for API endpoints
- **Integration**: Full system testing scripts
- **Blockchain**: Smart contract testing and deployment verification
- **Performance**: Load testing for critical paths

### Code Quality:
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Error Tracking**: Comprehensive error logging and monitoring

## Future Development Notes

### Planned Features:
- **Enhanced Security**: Biometric authentication
- **Extended Trading**: More currency pairs and payment methods
- **Advanced Analytics**: User behavior tracking and insights
- **Mobile Optimization**: Performance improvements and caching

### Technical Debt:
- **Type Safety**: Continue improving TypeScript coverage
- **Performance**: Optimize image loading and caching
- **Testing**: Expand test coverage for critical business logic
- **Documentation**: API documentation with OpenAPI/Swagger

---

*Last Updated: October 2024*
*Project Status: Active Development*