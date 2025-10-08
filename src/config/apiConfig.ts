import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

function getExpoHost(): string | undefined {
  const possibleHosts = [
    Constants.expoConfig?.hostUri,
    // @ts-ignore - legacy manifest support
    Constants.manifest?.debuggerHost,
    (Constants as any)?.expoGoConfig?.debuggerHost,
  ];

  for (const host of possibleHosts) {
    if (typeof host === 'string' && host.length > 0) {
      return host.split(':')[0];
    }
  }

  return undefined;
}

function getDefaultNativeBaseUrl(): string {
  const expoHost = getExpoHost();

  if (expoHost) {
    return `http://${expoHost}:3000`;
  }

  if (Platform.OS === 'android') {
    // Android emulators map localhost to 10.0.2.2
    return 'http://10.0.2.2:3000';
  }

  // iOS simulator or other native environments can use localhost
  return 'http://localhost:3000';
}

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

export const API_BASE_URL = ((): string => {
  const trimmed = envBaseUrl?.trim();
  if (trimmed) {
    return trimmed;
  }

  if (isWeb) {
    return 'http://localhost:3000';
  }

  // For development, prioritize using the detected Expo host IP
  const expoHost = getExpoHost();
  if (expoHost) {
    const host = expoHost.split(':')[0];
    const looksLikeIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    const looksLikeLanHostname = /\.local$/.test(host);

    if (looksLikeIp || looksLikeLanHostname) {
      console.log('🌐 Using Expo host IP for API:', host);
      return `http://${host}:3000`;
    }
  }

  // Fallback to default native base URL
  const defaultUrl = getDefaultNativeBaseUrl();
  console.log('🌐 Using default native base URL:', defaultUrl);
  return defaultUrl;
})();

if (__DEV__) {
  console.log('🌐 API base URL resolved to:', API_BASE_URL);
}
