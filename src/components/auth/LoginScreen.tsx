import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Alert,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ValidationError } from '../ui/ErrorMessage';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { validateEmail } from '../../utils/validation';
import emailAuthService from '../../services/emailAuthService';
import { User } from '../../services/authService';

interface LoginScreenProps {
  onLoginSuccess: (userData: User) => void;
  onClose?: () => void;
  visible?: boolean;
  initialEmail?: string;
  initialStep?: LoginStep;
}

type LoginStep = 'email' | 'verification' | 'complete';

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLoginSuccess, 
  onClose,
  visible = true,
  initialEmail,
  initialStep = 'email',
}) => {
  const [step, setStep] = useState<LoginStep>(initialStep);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  
  const emailInputRef = useRef<TextInput>(null);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle modal slide-in animation
  useEffect(() => {
    if (visible) {
      modalSlideAnim.setValue(0);
      Animated.timing(modalSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (initialEmail) {
      const normalized = initialEmail.trim().toLowerCase();
      setEmail(normalized);
      setEmailError(null);
      
      // If we start at verification step with an email, send verification code
      if (initialStep === 'verification') {
        sendVerificationCodeInBackground(normalized);
      }
    }

    // Set the initial step properly
    if (step !== initialStep) {
      if (initialStep === 'verification') {
        animateStepTransition();
      }
      setStep(initialStep);
    }
    
    // Only start countdown and focus for verification step
    if (initialStep === 'verification') {
      setCountdown(60);
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 300);
    }
  }, [visible, initialEmail, initialStep]);

  // Send verification code in background without blocking UI
  const sendVerificationCodeInBackground = async (email: string) => {
    try {
      console.log('📧 Sending verification code in background for:', email);
      const result = await emailAuthService.sendVerificationCode(email);
      
      if (!result.success) {
        console.warn('⚠️ Background verification code failed:', result.error);
        // Optionally show a subtle notification, but don't block the UI
        setEmailError(result.error || 'Failed to send verification code');
      } else {
        console.log('✅ Verification code sent successfully in background');
      }
    } catch (error) {
      console.error('❌ Background verification code error:', error);
      setEmailError('Network error. Please try again.');
    }
  };


  const animateStepTransition = () => {
    // Smoother animation with better timing
    Animated.sequence([
      Animated.timing(fadeAnim, { 
        duration: 200, 
        toValue: 0, 
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      Animated.timing(slideAnim, { 
        duration: 250, 
        toValue: 1, 
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease)
      }),
      Animated.timing(fadeAnim, { 
        duration: 200, 
        toValue: 1, 
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      }),
    ]).start(() => {
      slideAnim.setValue(0);
    });
  };

  // Step 1: Send verification code to email
  const handleEmailSubmit = async () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'Please enter a valid email address');
      return;
    }
    
    setEmailError(null);
    setIsLoading(true);
    
    // Start transition immediately to improve perceived performance
    animateStepTransition();
    setStep('verification');
    
    try {
      // Focus first code input immediately
      codeInputRefs.current[0]?.focus();
      
      // Send verification code in parallel with animation
      const result = await emailAuthService.sendVerificationCode(email.trim().toLowerCase());
      
      if (result.success) {
        setCountdown(60);
      } else {
        setEmailError(result.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Send verification error:', error);
      setEmailError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code and authenticate (frictionless)
  const handleVerificationSubmit = async (code?: string[]) => {
    const codeToVerify = code || verificationCode;
    const codeString = codeToVerify.join('');
    
    if (codeString.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    // Dismiss keyboard to improve user experience
    Keyboard.dismiss();
    setIsLoading(true);
    
    try {
      const result = await emailAuthService.verifyCodeAndAuth(codeString);
      
      if (result.success && result.user && result.token) {
        // Both existing and new users go directly to complete step
        setIsNewUser(result.isNewUser || false);
        animateStepTransition();
        setStep('complete');
        
        // Reduce the delay for a smoother experience
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 1000);
      } else {
        // More specific error message
        const errorMessage = result.error || 'Invalid verification code. Please check your email and try again.';
        Alert.alert('Verification Failed', errorMessage);
        
        // Clear code and refocus first input for better UX
        setVerificationCode(['', '', '', '', '', '']);
        setTimeout(() => {
          codeInputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Verification error:', error);
      // Keep console logging for debugging, but remove user-facing alert
      // Don't clear the code on network errors so user can retry
    } finally {
      setIsLoading(false);
    }
  };


  const handleCodeChange = (value: string, index: number) => {
    // Only accept digits
    if (value && !/^\d+$/.test(value)) {
      return;
    }
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 5 && newCode.every(digit => digit !== '')) {
      // Add a small delay to allow UI to update before submission
      setTimeout(() => {
        handleVerificationSubmit(newCode);
      }, 300);
    }
  };

  const handleBackspace = (index: number) => {
    if (verificationCode[index] === '' && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    try {
      const result = await emailAuthService.resendVerificationCode();
      if (result.success) {
        setCountdown(60);
        // Keep success flow without alert - code will be sent silently
      } else {
        console.error('Failed to resend code:', result.error);
        // Keep error logging for debugging, but remove user-facing alert
      }
    } catch (error) {
      console.error('Resend error:', error);
      // Keep console logging for debugging, but remove user-facing alert
    }
  };

  const handleBackToEmail = () => {
    emailAuthService.clearSession();
    
    // Animate slide down first, then change step
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start(() => {
      // After animation completes, change step
      setStep('email');
      setVerificationCode(['', '', '', '', '', '']);
      setEmailError(null);
      setCountdown(0);
      
      // Then slide back up with the email step
      modalSlideAnim.setValue(0);
      Animated.timing(modalSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease)
      }).start(() => {
        emailInputRef.current?.focus();
      });
    });
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement Google OAuth integration
      Alert.alert('Coming Soon', 'Google sign-in will be available in the next update.');
    } catch (error) {
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError && text.trim()) {
      setEmailError(null);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError && text.trim()) {
      setPasswordError(null);
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (nameError && text.trim()) {
      setNameError(null);
    }
  };

  const renderEmailStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeSection}>
        <Typography variant="h2" style={styles.welcomeTitle}>
          Welcome to Ile
        </Typography>
        <Typography variant="body1" color="textSecondary" style={styles.welcomeSubtitle}>
          Enter your email to get started
        </Typography>
      </View>

      <Card style={[styles.inputCard, emailError ? styles.inputCardError : undefined]}>
        <View style={styles.inputSection}>
          <MaterialIcons name="email" size={20} color={emailError ? Colors.error : Colors.primary} />
          <TextInput
            ref={emailInputRef}
            style={[styles.input, emailError ? styles.inputError : undefined]}
            placeholder="Enter your email address"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleEmailSubmit}
          />
        </View>
      </Card>
      
      {emailError && (
        <ValidationError message={emailError} />
      )}

      <Button
        title={isLoading ? "Sending Code..." : "Continue"}
        onPress={handleEmailSubmit}
        disabled={!email || isLoading}
        style={styles.continueButton}
      />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Typography variant="caption" color="textSecondary" style={styles.dividerText}>
          or
        </Typography>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignIn}
        disabled={isLoading}
      >
        <MaterialIcons name="account-circle" size={20} color={Colors.gray700} />
        <Typography variant="h6" style={styles.googleButtonText}>
          Continue with Google
        </Typography>
      </TouchableOpacity>
    </View>
  );

  const renderVerificationStep = () => (
    <ScrollView 
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.scrollContent, styles.verificationContent]}
    >
      <TouchableOpacity style={styles.backButton} onPress={handleBackToEmail}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.gray700} />
      </TouchableOpacity>

      <View style={styles.verificationSection}>
        <MaterialIcons name="mark-email-read" size={48} color={Colors.primary} />
        <Typography variant="h3" style={styles.verificationTitle}>
          Check your email
        </Typography>
        <Typography variant="body1" color="textSecondary" style={styles.verificationSubtitle}>
          We sent a verification code to
        </Typography>
        <Typography variant="body1" style={styles.emailText}>
          {email}
        </Typography>
      </View>

      <Card style={styles.codeCard}>
        <Typography variant="h6" style={styles.codeTitle}>
          Enter verification code
        </Typography>
        <View style={styles.codeInputContainer}>
          {verificationCode.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref: TextInput | null) => {
                if (ref) codeInputRefs.current[index] = ref;
              }}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value.slice(-1), index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') {
                  handleBackspace(index);
                }
              }}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>
      </Card>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResendCode}
        disabled={countdown > 0}
      >
        <Typography 
          variant="body2" 
          color={countdown > 0 ? "textSecondary" : "primary"}
          style={styles.resendText}
        >
          {countdown > 0 
            ? `Resend code in ${countdown}s` 
            : "Didn't receive code? Resend"
          }
        </Typography>
      </TouchableOpacity>

      <Button
        title={isLoading ? "Verifying..." : "Verify Code"}
        onPress={() => handleVerificationSubmit()}
        disabled={verificationCode.some(digit => !digit) || isLoading}
        style={styles.verifyButton}
        loading={isLoading}
      />
    </ScrollView>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successSection}>
        <View style={styles.successIcon}>
          <MaterialIcons name="check-circle" size={64} color={Colors.success} />
        </View>
        <Typography variant="h2" style={styles.successTitle}>
          {isNewUser ? 'Welcome to Ile!' : 'Welcome back!'}
        </Typography>
        <Typography variant="body1" color="textSecondary" style={styles.successSubtitle}>
          {isNewUser 
            ? 'Your account has been created successfully!'
            : 'You have been signed in successfully!'
          }
        </Typography>
        <Typography variant="body2" color="textSecondary" style={styles.successSubtitle}>
          Taking you to your dashboard...
        </Typography>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'verification': return renderVerificationStep();
      case 'complete': return renderCompleteStep();
      default: return renderVerificationStep();
    }
  };

  const { height } = Dimensions.get('window');

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.modalContainer,
          {
            transform: [{
              translateY: modalSlideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [height, 0],
              })
            }]
          }
        ]}
      >
        {/* Close button */}
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color={Colors.gray700} />
          </TouchableOpacity>
        )}

        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    })
                  }]
                }
              ]}
            >
              {renderCurrentStep()}
            </Animated.View>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    marginTop: 60, // Leave space at top
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  verificationContent: {
    paddingTop: 0, // Remove top padding completely
    paddingBottom: 200, // Add bottom padding to push content up
    justifyContent: 'flex-start',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    alignItems: 'center',
  },
  
  // Email Step
  welcomeSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  welcomeTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  inputCard: {
    width: '100%',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  passwordToggle: {
    padding: Spacing.xs,
  },
  continueButton: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  googleButtonText: {
    marginLeft: Spacing.sm,
    color: Colors.gray700,
  },

  // Verification Step
  backButton: {
    alignSelf: 'flex-start',
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  verificationSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  verificationTitle: {
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    color: Colors.gray700,
  },
  verificationSubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emailText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  codeCard: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  codeTitle: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontWeight: '600',
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: Colors.gray700,
    backgroundColor: Colors.surface,
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  resendButton: {
    marginBottom: Spacing.xl,
  },
  resendText: {
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
  },

  // Complete Step
  successSection: {
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  successSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Error states
  inputCardError: {
    borderColor: Colors.error,
    borderWidth: 1,
  },
  inputError: {
    color: Colors.error,
  },
  validationError: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
});
