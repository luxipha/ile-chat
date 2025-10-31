# IlePay Platform Monorepo

IlePay is a multi-product fintech and real estate investment platform that blends tokenised property investment, peer-to-peer payments, foreign exchange trading, and community features in a single experience. This monorepo hosts the mobile super-app, public and internal web frontends, backend services, smart contracts, and operational tooling used by the Ile team.

## Project Vision

Blockchain should feel invisible, safe, and intuitive for everyday users. IlePay was founded on the belief that powerful decentralised infrastructure can deliver real utility only when it is simple and accessible. The mobile app eliminates protocol jargon and wallet complexity—users send funds or assets without ever worrying about addresses or chains. Ilé Chat extends that principle inside the broader property-tokenisation ecosystem: once complete, users will be able to send tokenised property shares with the same ease as sending USDC in chat.  
  
> **Submission note:** This document packages the Ilé Chat build for accelerator submission. All code lives in the monorepo; the trimmed Ilé Chat repo is for presentation only.

Our roadmap is geared toward onboarding the next wave of Web2 users into compliant, real-world blockchain experiences. Every application in this repository—from investor tooling to legal operations—supports that objective.

## Table of Contents

1. [Project Vision](#project-vision)
2. [Repository Layout](#repository-layout)
3. [Ecosystem Overview & Ilé Chat](#ecosystem-overview--ilé-chat)
4. [Ilé Chat Architecture](#ilé-chat-architecture)
5. [Core Capabilities](#core-capabilities)
6. [Technology Stack](#technology-stack)
7. [Prerequisites](#prerequisites)
8. [Getting Started](#getting-started)
9. [Environment Variables](#environment-variables)
10. [Running the Applications](#running-the-applications)
11. [Testing and Quality](#testing-and-quality)
12. [Build and Deployment](#build-and-deployment)
13. [Troubleshooting](#troubleshooting)
14. [Reference Materials](#reference-materials)

## Repository Layout

| Path | Summary |
| --- | --- |
| `ilePayMobile/` | Expo-managed React Native super-app with chat, wallet, FX, property investment, and social features. |
| `backend/` | Node.js (Express + MongoDB) API servicing auth, wallet, FX marketplace, community, and notification flows. Includes Telegram bot integration. |
| `admin/` | Vite + React TypeScript dashboard for internal operations, portfolio management, and analytics. |
| `marketplace/` | Vite + React web app used for public-facing token offerings, investment analytics, and onboarding flows. |
| `ile-legal/` | Vite + React portal for legal operations, contract workflows, and compliance automation (Supabase + Circle payments). |
| `ileVault/` | Document management frontend for secure property submissions and verification. |
| `website/` | Marketing site (React) for public product information. |
| `frontendnext/` | Legacy Next.js web prototype retained for reference. |
| `miniapp/` | Lightweight companion experience (WeChat-style mini app infrastructure). |
| `ile_send/` | Communication tooling (Supabase + Vite) for broadcast messaging and user engagement. |
| `telegramReferralBot/` | .NET 8 bot that powers referral campaigns and group engagement on Telegram. |
| `sbt-contracts/` | Smart contracts (Solidity and Move) for token issuance and blockchain integrations. |
| `node_modules/`, `package-lock.json`, etc. | Convenience dependencies for the monorepo root. Most development happens within individual subdirectories. |

### External Companion Repository

| Repository | Summary |
| --- | --- |
| [`ile-chat`](https://github.com/luxipha/ile-chat) | Production-ready Expo build derived from `ilePayMobile/`. We keep it slim for accelerator submissions and app-store distribution while staying in sync with this monorepo. Local mirror: `/Users/abisoye/Projects/Ile-MVP/Ile-chat`. |

> Development happens in `Ile-MVP` first. When features are ready for release, sync the `ilePayMobile/` changes into `/Users/abisoye/Projects/Ile-MVP/Ile-chat`, then push to `https://github.com/luxipha/ile-chat.git`.

## Ecosystem Overview & Ilé Chat

- **IlePay Mobile Super-App (`ilePayMobile/`)** – full-stack experience that blends chat, tokenised property investing, wallets, FX trading, and community gamification.
- **Ilé Chat (external repo)** – curated build focused on chat, P2P value transfer, and FX merchants. It is how we demonstrate the experience in accelerator programmes without exposing the entire monorepo.
- **Supporting Surfaces** – back-office portals, legal flows, vault, marketing site, Telegram automations, smart contracts, and operational tooling. Together they provide compliance, liquidity, and governance for the user-facing apps.

Messaging investors or partners? Emphasise that Ilé Chat is the entry point into this larger ecosystem: a user who onboards through chat instantly gains access to the same wallets, FX liquidity, and compliance rails that power the property marketplace. No silos—just different skins over the same infrastructure.

## Ilé Chat Architecture

- **Client Layer**: Expo-managed React Native (SDK 54) with TypeScript, React Navigation, React Query, and a shared design system (`Typography`, `Card`, `Avatar`, `FXTheme`). Modules for chat, FX, wallet, profile, and notifications are identical to the super-app.
- **Identity & Sessions**: Firebase Auth for sign-in, with session bridging to the backend’s JWT-based APIs. Tokens live in SecureStore/AsyncStorage and refresh seamlessly during background pushes.
- **Messaging Stack**: Firebase Firestore for real-time conversations (DMs, groups), presence, and typing indicators. Media flows through Cloudinary; Socket.IO augments events for FX trades and group wallets.
- **Financial Services**: REST calls to `backend/` for wallet balances, blockchain transactions, FX offer books, and escrow lifecycle. React Query caches these responses, while `profileService` ensures avatars and names resolve consistently via `/api/users/profile/:firebaseUid`.
- **Feature Modules**:
  - **Wallets**: P2P send/receive, QR code flows, Hedera/Base/Aptos addresses surfaced via profile lookups.
  - **FX**: Marketplace, offer detail, trade rooms, and merchant dashboards share business logic with the super-app.
  - **Community Hooks**: Friend requests, contacts, and onboarding components are toggled via remote config but remain compiled in the Ilé Chat build.
- **Distribution Pipeline**: The external `ile-chat` repo contains EAS profiles, build artefacts, and release metadata. To ship: pull latest changes here, copy/sync into the mirror, run `eas build`, and push to `origin` (GitHub).

## Core Capabilities

- **Property Investment**: Tokenised real-estate listings, due diligence tooling, and investor dashboards backed by Aptos, Hedera, Skale, Base, and Ethereum integrations.
- **Digital Wallet**: Multi-chain wallet management, peer-to-peer transfers, USDC on/off ramp integrations, and brick reward mechanics.
- **Foreign Exchange Marketplace**: Order book style FX trading layer with merchant offers, escrow, and settlement logic.
- **Social & Community**: Real-time chat, group messaging, posts, referrals, streaks, notifications, and gamified engagement.
- **Operations Tooling**: Admin dashboards, legal processing portals, vault document workflows, Telegram bots, and marketing surfaces.

More detail on architecture, models, and recent changes is available in `ilePayMobile/CLAUDE.md`.

## Technology Stack

- **Mobile**: React Native (Expo SDK 54), TypeScript, React Query, Firebase Auth/Firestore, Expo Camera, native modules (Snapchat Camera Kit, Firebase, Reanimated).
- **Backend**: Node.js 20+, Express, MongoDB (Mongoose), Socket.IO, Cloudinary, Firebase Admin, JWT, Telegraf, cron workers, blockchain SDKs.
- **Web**: Vite + React (admin, marketplace, legal, vault), Tailwind, Radix UI, TanStack Query, Supabase, Stripe/Circle SDKs, Leaflet.
- **Infrastructure**: Docker, Render, Netlify, Expo Application Services (EAS), GitHub Actions, Telegram, Supabase, IPFS.
- **Smart Contracts**: Solidity, Move, Hashgraph SDK, associated deployment scripts.

## Prerequisites

Install the following before working on the repository:

- Node.js 20 LTS (use [nvm](https://github.com/nvm-sh/nvm) to switch versions).
- npm 10+ (yarn or pnpm are optional; the repo ships with package-lock files).
- Git and Git LFS (for large assets stored in Vault and mobile assets).
- Expo CLI (`npm install -g expo-cli`) for the mobile app.
- Android Studio + Android SDK 34+ for Android builds.
- Xcode 16+ with iOS 18 SDKs, Ruby 3.2+, and CocoaPods (`sudo gem install cocoapods`) for iOS builds.
- Docker (optional) if you plan to run containerised deployments or local MongoDB.
- Supabase CLI (optional) for `ile_send` and legal tooling scripts.

## Getting Started

```bash
git clone https://github.com/<org>/Ile-MVP.git
cd Ile-MVP

# Install dependencies for the projects you need. Examples:
cd backend && npm install
cd ../ilePayMobile && npm install
cd ../admin && npm install
```

> Each subproject maintains its own lockfile. Install dependencies within the respective directory to avoid mismatched package managers.

## Environment Variables

The platform relies on multiple environment files. Never commit secrets to version control.

### Backend (`backend/.env`)

| Key | Purpose |
| --- | --- |
| `MONGODB_URI` | Connection string for MongoDB cluster. |
| `JWT_SECRET` | Symmetric key for signing API tokens. |
| `FRONTEND_URL` | Allowed origin for CORS and email templates. |
| `NODE_ENV` | Runtime mode (`development`, `production`). |
| `CLOUDINARY_*` | Credentials for media uploads. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth credentials for Google sign-in. |
| `FIREBASE_*` | Admin SDK credentials for push notifications and messaging. |
| `APTOS_API_KEY`, `HEDERA_OPERATOR_ID`, `ETH_RPC_URL`, etc. | Blockchain provider credentials (check `config/` and `services/blockchain/`). |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_URL` | Telegram bot integration. |
| `SMTP_*` | Outbound email configuration when nodemailer is enabled. |

Sample values and additional keys are documented inline in `backend/config` files and deployment scripts.

### Mobile App (`ilePayMobile/.env`)

| Key | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Base URL for REST traffic (defaults to `https://api.ile.africa`). |
| `API_BASE_URL` | Optional override for legacy modules (falls back to `EXPO_PUBLIC_API_BASE_URL`). |
| `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase config for auth, Firestore chat, and notifications. |
| `EXPO_PUBLIC_CHAIN_ID` | Active blockchain network identifier (`base`, `aptos`, etc.). |
| `SNAPCHAT_APP_ID`, `SNAPCHAT_API_TOKEN`, `SNAPCHAT_LENS_GROUP_ID` | Snapchat Camera Kit credentials referenced by the local Expo config plugin. |

Environment overrides for EAS builds are declared in `ilePayMobile/eas.json`.

### Web Frontends

- `admin/.env` – API host, auth settings, and analytics keys.
- `marketplace/.env.local` – API host, map keys, wallet providers.
- `ile-legal/.env` – Supabase, Circle, Stripe, blockchain network settings.
- `ileVault/.env` – API and storage credentials for document ingestion.
- `ile_send/.env` – Supabase service role key, Netlify configuration, and mail provider secrets.
- `telegramReferralBot/ModernBot/.env.*` – MongoDB and Telegram credentials for the bot service.

Consult the existing `.env` files in each directory (do not commit real values) and replicate them as `.env.local` or `.env.development` as needed.

## Running the Applications

### Backend API

```bash
cd backend
npm install
cp .env.example .env        # create and edit if example is available
npm run dev                 # start Express on http://localhost:3000

# Useful scripts
npm run init-db             # seed database
npm run create-indexes      # apply MongoDB indexes
npm run bot                 # launch Telegram referral bot
```

The server exposes routes under `/api/*`. Express middlewares enforce JWT, Firebase, and session-level permissions. Real-time messaging relies on Socket.IO and Firebase.

### Mobile Super-App (Expo)

```bash
cd ilePayMobile
npm install

# Configure native modules once
npx expo prebuild --clean
cd ios && LANG=en_US.UTF-8 pod install && cd ..

# Start Metro and select a target
npm run android             # requires Android emulator or device
npm run ios                 # requires Xcode simulator or device
npm start                   # launches Expo CLI interactive shell
```

Notes:
- The repository includes a custom config plugin at `plugins/withSnapchatCameraKit.js` to inject Snapchat Camera Kit credentials during `expo prebuild`.
- After `prebuild`, always run `pod install` inside `ios/` before opening Xcode.
- When targeting iOS, ensure the simulator OS you select is installed (`xcrun simctl list` to verify).

### Admin Dashboard

```bash
cd admin
npm install
npm run dev
```

The admin UI consumes the same REST APIs as the mobile app. Update the `.env` file to point at your local backend.

### Marketplace, Legal, Vault, Marketing Sites

Each Vite-based frontend follows the same pattern:

```bash
cd marketplace    # or ile-legal, ileVault, website, ile_send
npm install
npm run dev
```

Refer to the respective README or `package.json` for build, lint, and preview commands.

### Telegram Referral Bot (.NET)

```bash
cd telegramReferralBot/ModernBot
dotnet restore
dotnet build
dotnet run
```

Populate `.env.local` with Telegram credentials and MongoDB connection details before running the bot.

## Testing and Quality

| Area | Commands |
| --- | --- |
| Backend | `npm test`, `npm run test:watch`, `npm run test:coverage` |
| Mobile | `npm test`, `npm run lint` (Jest + ESLint). Metro must be stopped for Jest snapshot updates. |
| Web apps | `npm run lint`, `npm run test:<suite>` where defined (see `package.json`). |
| Smart contracts | Review scripts in `sbt-contracts/scripts` and `backend/skale-contracts`. Tests use Hardhat/Foundry depending on chain. |

For end-to-end testing, leverage the scripts inside `backend/scripts/` (for example `test_referral_query.js`, `create-test-users.js`) and Supabase fixtures in `ile_send/scripts/`.

## Build and Deployment

- **Backend**: Dockerfile provided in `backend/` for container builds. CI/CD via GitHub Actions (`.github/workflows/backend-deploy.yml`) pushes to Render. Verify environment secrets before deployment.
- **Mobile**: Use Expo Application Services. Update `app.json` and `eas.json`, run `npx expo prebuild` followed by `eas build -p ios|android`. Over-the-air updates can be published with `eas update`.
- **Web Frontends**: Vite build outputs static assets (`npm run build`). Deploy to Netlify, Vercel, or Render as configured in each project.
- **Telegram Bot**: Containerise with the provided `Dockerfile` or deploy to Azure Web Apps / AWS ECS. Ensure the bot’s webhook URL and TLS certificates are managed.
- **Smart Contracts**: Deployment scripts live in `sbt-contracts/` and `backend/move/`. Coordinate with blockchain leads before migrating contract code.

## Troubleshooting

- **Expo Camera & Snapchat**: The mobile camera falls back to Expo Camera when Snapchat tokens are absent. Ensure `EXPO_PUBLIC_API_BASE_URL` is reachable and `plugins/withSnapchatCameraKit.js` has valid credentials before running `expo prebuild`.
- **`pod install` Errors**: Use `LANG=en_US.UTF-8 pod install` to avoid encoding issues. If `hermes-engine` fails to fetch, confirm network access to `central.sonatype.com` and rerun.
- **`xcodebuild` Error 70**: Start or create the desired simulator (`open -a Simulator`) or pass `--device "<Simulator Name>"` to `expo run:ios`. The default cached device ID may no longer exist.
- **Backend Timeouts**: Blockchain calls default to 30 seconds. Monitor logs (pino) under `backend/backend.log` and consider increasing timeouts for long-running operations.
- **MongoDB Index Conflicts**: Friendship and community collections use compound unique indexes. If seed data fails, run `npm run create-indexes` before inserting fixtures.
- **Image Uploads**: All clients must send `multipart/form-data` to `/api/firebase-auth/upload-image`. Ensure mobile URIs are converted to Expo `FileSystem.uploadAsync` or `FormData` objects.

## Reference Materials

- `ilePayMobile/CLAUDE.md` – Deep dive into architecture, services, models, and recent fixes.
- `LIVEKIT_SETUP.md` – LiveKit signalling and media server configuration.
- `FIREBASE_SETUP_GUIDE.md` – Firebase project bootstrap steps.
- `ile_send/README.md`, `ileVault/README.md`, and other nested docs – Project-specific instructions.
- `backend/scripts/` – Operational scripts for maintenance, testing, and migrations.
- [Hedera Developer Certification](https://certs.hashgraphdev.com/f8d1f317-f44d-43b2-b367-a63301ce4fcc.pdf) – Proof of Hashgraph proficiency for the Ile engineering lead.
- [Ile Pitch Deck](https://docs.google.com/presentation/d/16mu70TppHdsxJK9pLsqPy1i1inq9bwTz/edit?usp=sharing&ouid=103494674998898337604&rtpof=true&sd=true) – Investor-facing overview of the ecosystem and go-to-market motion.

## License

This repository contains proprietary source code owned by the Ile team. Contact the maintainers for access, redistribution, or licensing queries.
