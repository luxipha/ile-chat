import { Colors } from './index';
import { DimensionValue } from 'react-native';

export const ChatTheme = {
  // Backgrounds
  background1: Colors.white,
  background2: Colors.gray50,
  background3: Colors.gray100,
  background4: Colors.gray200,
  
  // Message bubbles
  sendBubbleBackground: Colors.primary,
  sendBubbleText: Colors.white,
  receiveBubbleBackground: Colors.gray200,
  receiveBubbleText: Colors.gray900,
  
  // Text colors
  textPrimary: Colors.gray900,
  textSecondary: Colors.gray600,
  textTertiary: Colors.gray500,
  textDisabled: Colors.gray400,
  
  // UI elements
  border: Colors.gray200,
  borderActive: Colors.primary,
  accent: Colors.secondary,
  success: Colors.success,
  warning: Colors.warning,
  error: Colors.error,
  
  // Special states
  online: Colors.success,
  typing: Colors.secondary,
  unread: Colors.primary,
};

export const ChatSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const ChatSizes = {
  avatar: {
    small: 32,
    medium: 40,
    large: 48,
  },
  icon: {
    small: 16,
    medium: 20,
    large: 24,
  },
  bubble: {
    minWidth: 90 as DimensionValue,
    maxWidth: '80%' as DimensionValue,
    borderRadius: {
      default: 24,
      tail: 8,
      top: 28,
    },
    padding: {
      horizontal: ChatSpacing.lg,
      vertical: ChatSpacing.md,
    },
  },
};