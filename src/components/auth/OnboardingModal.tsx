import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  View,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  onSignup: (email?: string) => void;
  onLogin: () => void;
  onAppleSignup?: () => void;
  onGoogleSignup?: () => void;
}

const USP_PHRASES = [
  'Chat with friends',
  'Send money',
  'Receive money',
  'Invest together',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onClose,
  onSignup,
  onLogin,
  onAppleSignup,
  onGoogleSignup,
}) => {
  const [currentText, setCurrentText] = useState('');
  const [showButtons, setShowButtons] = useState(false);
  const [email, setEmail] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const { height } = useWindowDimensions();

  const insets = useSafeAreaInsets();

  const layoutSpacing = useMemo(() => {
    const isIOS = Platform.OS === 'ios';
    const safeBottom = insets.bottom;

    if (isKeyboardVisible) {
      const top = isIOS ? Math.max(height * 0.08, 20) : Math.max(height * 0.06, 16);
      const bottom = 0;
      const ctaPadding = 0;
      const keyboardOffset = isIOS ? -safeBottom : 0;
      return { top, bottom, ctaPadding, keyboardOffset };
    }

    const top = isIOS ? Math.max(height * 0.22, 64) : Math.max(height * 0.16, 48);
    const bottom = safeBottom + Math.max(height * 0.04, 20);
    const ctaPadding = safeBottom + Math.max(height * 0.05, 32);
    const keyboardOffset = 0;
    return { top, bottom, ctaPadding, keyboardOffset };
  }, [height, insets.bottom, isKeyboardVisible]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const phraseIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isDeletingRef = useRef(false);

  const clearTypingTimeouts = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const startTypingLoop = useCallback(() => {
    const phrase = USP_PHRASES[phraseIndexRef.current] || '';

    if (!isDeletingRef.current) {
      if (charIndexRef.current <= phrase.length) {
        setCurrentText(phrase.substring(0, charIndexRef.current));
        charIndexRef.current += 1;
        typingTimeoutRef.current = setTimeout(startTypingLoop, 80);
      } else {
        typingTimeoutRef.current = setTimeout(() => {
          isDeletingRef.current = true;
          startTypingLoop();
        }, 1500);
      }
    } else {
      if (charIndexRef.current >= 0) {
        setCurrentText(phrase.substring(0, charIndexRef.current));
        charIndexRef.current -= 1;
        typingTimeoutRef.current = setTimeout(startTypingLoop, 40);
      } else {
        isDeletingRef.current = false;
        phraseIndexRef.current = (phraseIndexRef.current + 1) % USP_PHRASES.length;
        charIndexRef.current = 0;
        typingTimeoutRef.current = setTimeout(startTypingLoop, 300);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTypingTimeouts();
      if (buttonDelayTimeoutRef.current) {
        clearTimeout(buttonDelayTimeoutRef.current);
        buttonDelayTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    clearTypingTimeouts();
    if (buttonDelayTimeoutRef.current) {
      clearTimeout(buttonDelayTimeoutRef.current);
      buttonDelayTimeoutRef.current = null;
    }

    if (visible) {
      setCurrentText('');
      setShowButtons(false);

      phraseIndexRef.current = 0;
      charIndexRef.current = 0;
      isDeletingRef.current = false;

      fadeAnim.setValue(0);
      buttonFadeAnim.setValue(0);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();

      buttonDelayTimeoutRef.current = setTimeout(() => {
        setShowButtons(true);
        Animated.timing(buttonFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }).start();
      }, 3000);

      typingTimeoutRef.current = setTimeout(() => {
        startTypingLoop();
      }, 1000);
    } else {
      setShowButtons(false);
      setCurrentText('');
    }

    return () => {
      clearTypingTimeouts();
      if (buttonDelayTimeoutRef.current) {
        clearTimeout(buttonDelayTimeoutRef.current);
        buttonDelayTimeoutRef.current = null;
      }
    };
  }, [visible, fadeAnim, buttonFadeAnim, startTypingLoop]);

  const handleAppleSignup = () => {
    if (onAppleSignup) {
      onAppleSignup();
    } else {
      onSignup();
    }
  };

  const handleGoogleSignup = () => {
    if (onGoogleSignup) {
      onGoogleSignup();
    } else {
      console.log('Google signup coming soon');
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={layoutSpacing.keyboardOffset}
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={24} color={Colors.background} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              paddingTop: layoutSpacing.top,
              paddingBottom: layoutSpacing.bottom,
            },
          ]}
        >
          <View style={styles.heroSection}>
            <View style={styles.typingContainer}>
              <Typography variant="h4" style={styles.typingText}>
                {currentText}
                <Typography variant="h4" style={styles.cursor}>_</Typography>
              </Typography>
            </View>
          </View>

          {showButtons && (
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  opacity: buttonFadeAnim,
                  paddingBottom: layoutSpacing.ctaPadding,
                },
              ]}
            >
              <View style={styles.emailInputContainer}>
                <TextInput
                  style={styles.emailInput}
                  placeholder="Enter your email address"
                  placeholderTextColor={Colors.primary + '80'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !email.trim() && styles.disabledButton,
                ]}
                onPress={() => {
                  if (email.trim()) {
                    onSignup(email.trim());
                  }
                }}
                disabled={!email.trim()}
              >
                <Typography variant="h6" style={styles.continueButtonText}>
                  Continue
                </Typography>
              </TouchableOpacity>

              <Typography variant="body2" style={styles.continueText}>
                or
              </Typography>

              <Button
                title="Login with Google"
                variant="outline"
                onPress={handleGoogleSignup}
                style={StyleSheet.flatten([styles.secondaryButton, styles.disabledButton])}
                disabled
              />
            </Animated.View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: Spacing.lg,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  heroSection: {
    alignItems: 'center',
    width: '100%',
  },
  typingContainer: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingText: {
    color: Colors.background,
    fontWeight: '400',
    fontSize: 24,
    textAlign: 'center',
    minWidth: 250,
    height: 40,
  },
  cursor: {
    color: Colors.background,
    opacity: 0.7,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: 'auto',
  },
  emailInputContainer: {
    width: '100%',
  },
  emailInput: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: Colors.primary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  continueButton: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    borderColor: Colors.background,
  },
  disabledButton: {
    opacity: 0.5,
  },
  continueText: {
    color: Colors.background,
    textAlign: 'center',
    opacity: 0.8,
  },
});
