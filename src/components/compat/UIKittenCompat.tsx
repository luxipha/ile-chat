/**
 * Compatibility layer for UI Kitten components
 * Simple React Native replacements for UI Kitten components to fix React 18 compatibility
 */

import React from 'react';
import { 
  View, 
  Text as RNText, 
  TouchableOpacity, 
  TextInput, 
  Modal as RNModal,
  StyleSheet,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../theme';

// Layout component (replacement for UI Kitten Layout)
export const Layout: React.FC<{ 
  children: React.ReactNode; 
  style?: ViewStyle;
}> = ({ children, style }) => (
  <View style={[styles.layout, style]}>
    {children}
  </View>
);

// Text component (replacement for UI Kitten Text)
export const Text: React.FC<{ 
  children: React.ReactNode; 
  category?: string;
  appearance?: string;
  style?: TextStyle;
}> = ({ children, category, appearance, style }) => (
  <RNText style={[
    styles.text,
    category === 'h6' && styles.heading,
    category === 's1' && styles.subtitle,
    category === 'c1' && styles.caption,
    appearance === 'hint' && styles.hint,
    style
  ]}>
    {children}
  </RNText>
);

// Button component (replacement for UI Kitten Button)
export const Button: React.FC<{ 
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  appearance?: string;
  size?: string;
  disabled?: boolean;
  accessoryLeft?: () => React.ReactNode;
}> = ({ children, onPress, style, appearance, size, disabled, accessoryLeft }) => (
  <TouchableOpacity 
    style={[
      styles.button,
      appearance === 'outline' && styles.buttonOutline,
      appearance === 'ghost' && styles.buttonGhost,
      size === 'small' && styles.buttonSmall,
      disabled && styles.buttonDisabled,
      style
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    {accessoryLeft && accessoryLeft()}
    <RNText style={[
      styles.buttonText,
      appearance === 'outline' && styles.buttonTextOutline,
      appearance === 'ghost' && styles.buttonTextGhost,
      disabled && styles.buttonTextDisabled
    ]}>
      {children}
    </RNText>
  </TouchableOpacity>
);

// Card component (replacement for UI Kitten Card)
export const Card: React.FC<{ 
  children: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}> = ({ children, style, disabled }) => (
  <View style={[
    styles.card,
    disabled && styles.cardDisabled,
    style
  ]}>
    {children}
  </View>
);

// Input component (replacement for UI Kitten Input)
export const Input: React.FC<{ 
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  style?: ViewStyle;
  keyboardType?: any;
}> = ({ placeholder, value, onChangeText, style, keyboardType }) => (
  <TextInput
    style={[styles.input, style]}
    placeholder={placeholder}
    value={value}
    onChangeText={onChangeText}
    keyboardType={keyboardType}
    placeholderTextColor={Colors.gray400}
  />
);

// Modal component (replacement for UI Kitten Modal)
export const Modal: React.FC<{ 
  visible: boolean;
  onBackdropPress?: () => void;
  backdropStyle?: ViewStyle;
  children: React.ReactNode;
}> = ({ visible, onBackdropPress, backdropStyle, children }) => (
  <RNModal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onBackdropPress}
  >
    <TouchableOpacity 
      style={[styles.modalBackdrop, backdropStyle]}
      activeOpacity={1}
      onPress={onBackdropPress}
    >
      <TouchableOpacity activeOpacity={1} onPress={() => {}}>
        {children}
      </TouchableOpacity>
    </TouchableOpacity>
  </RNModal>
);

// Avatar component (simple replacement)
export const Avatar: React.FC<{ 
  source?: any;
  style?: ViewStyle;
  size?: string;
}> = ({ source, style, size }) => (
  <View style={[
    styles.avatar,
    size === 'large' && styles.avatarLarge,
    style
  ]}>
    <RNText style={styles.avatarText}>?</RNText>
  </View>
);

const styles = StyleSheet.create({
  layout: {
    backgroundColor: 'transparent',
  },
  text: {
    color: Colors.gray900,
    fontSize: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    color: Colors.gray600,
  },
  hint: {
    color: Colors.gray500,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonSmall: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray300,
  },
  buttonText: {
    color: Colors.background,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  buttonTextOutline: {
    color: Colors.primary,
  },
  buttonTextGhost: {
    color: Colors.primary,
  },
  buttonTextDisabled: {
    color: Colors.gray500,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: Colors.gray900,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: Colors.gray900,
    backgroundColor: Colors.background,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    color: Colors.gray600,
    fontWeight: '600',
  },
});