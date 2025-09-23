import React from 'react';
import { Text, Platform } from 'react-native';
import {
  CrossmintProvider,
  CrossmintAuthProvider, 
  CrossmintWalletProvider,
} from '@crossmint/client-sdk-react-native-ui';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables for CrossMint configuration
const CROSSMINT_CLIENT_API_KEY = process.env.EXPO_PUBLIC_CROSSMINT_CLIENT_API_KEY || '';
const CHAIN_ID = process.env.EXPO_PUBLIC_CHAIN_ID || 'base-sepolia'; // Default to base-sepolia like starter app

if (!CROSSMINT_CLIENT_API_KEY) {
  console.warn('⚠️ EXPO_PUBLIC_CROSSMINT_CLIENT_API_KEY not set. CrossMint features will not work.');
}

type CrossmintProvidersProps = {
  children: React.ReactNode;
};

export function CrossmintProviders({ children }: CrossmintProvidersProps) {
  return (
    <CrossmintProvider apiKey={CROSSMINT_CLIENT_API_KEY}>
      <CrossmintAuthProvider
        authModalTitle="IlePay"
        loginMethods={["email", "google"]}
        termsOfServiceText={
          <Text>
            By continuing, you accept the Wallet's Terms of Service, 
            and to receive marketing communications from Crossmint.
          </Text>
        }
      >
        <CrossmintWalletProvider
          showPasskeyHelpers={CHAIN_ID !== "solana"}
          createOnLogin={{
            chain: CHAIN_ID as any,
            signer: { type: "email" },
          }}
        >
          {children}
        </CrossmintWalletProvider>
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}