import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ValidationError } from '../ui/ErrorMessage';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { validateEmail, validatePassword } from '../../utils/validation';
import emailAuthService from '../../services/emailAuthService';
import { User } from '../../services/authService';

interface LoginScreenProps {
  onLoginSuccess: (userData: User) => void;
}

type LoginStep = 'email' | 'verification' | 'complete';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const animateStepTransition = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { duration: 150, toValue: 0, useNativeDriver: true }),
      Animated.timing(slideAnim, { duration: 200, toValue: 1, useNativeDriver: true }),
      Animated.timing(fadeAnim, { duration: 150, toValue: 1, useNativeDriver: true }),
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
    
    try {
      const result = await emailAuthService.sendVerificationCode(email.trim().toLowerCase());
      
      if (result.success) {
        animateStepTransition();
        setStep('verification');
        setCountdown(60);
        
        // Focus first code input
        setTimeout(() => {
          codeInputRefs.current[0]?.focus();
        }, 300);
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

    setIsLoading(true);
    try {
      const result = await emailAuthService.verifyCodeAndAuth(codeString);
      
      if (result.success && result.user && result.token) {
        // Both existing and new users go directly to complete step
        setIsNewUser(result.isNewUser || false);
        animateStepTransition();
        setStep('complete');
        
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 2000);
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid verification code.');
        setVerificationCode(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 5 && newCode.every(digit => digit !== '')) {
      handleVerificationSubmit(newCode);
    }
  };

  const handleBackspace = (index: number) => {
    if (verificationCode[index] === '' && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    try {
      const result = await emailAuthService.resendVerificationCode();
      if (result.success) {
        setCountdown(60);
        Alert.alert('Code Sent', result.message || 'A new verification code has been sent to your email.');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend code. Please try again.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToEmail = () => {
    emailAuthService.clearSession();
    animateStepTransition();
    setStep('email');
    setVerificationCode(['', '', '', '', '', '']);
    setEmailError(null);
    setCountdown(0);
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 300);
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

      <Card style={[styles.inputCard, emailError && styles.inputCardError]}>
        <View style={styles.inputSection}>
          <MaterialIcons name="email" size={20} color={emailError ? Colors.error : Colors.primary} />
          <TextInput
            ref={emailInputRef}
            style={[styles.input, emailError && styles.inputError]}
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
        <ValidationError message={emailError} style={styles.validationError} />
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
    <View style={styles.stepContainer}>
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
              ref={(ref) => (codeInputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled
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
        disabled={countdown > 0 || isResending}
      >
        <Typography 
          variant="body2" 
          color={countdown > 0 ? "textSecondary" : "primary"}
          style={styles.resendText}
        >
          {countdown > 0 
            ? `Resend code in ${countdown}s` 
            : isResending 
              ? "Sending..." 
              : "Didn't receive code? Resend"
          }
        </Typography>
      </TouchableOpacity>

      <Button
        title={isLoading ? "Verifying..." : "Verify"}
        onPress={() => handleVerificationSubmit()}
        disabled={verificationCode.some(digit => digit === '') || isLoading}
        style={styles.verifyButton}
      />
    </View>
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
      case 'email': return renderEmailStep();
      case 'verification': return renderVerificationStep();
      case 'complete': return renderCompleteStep();
      default: return renderEmailStep();
    }
  };

  return (
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
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