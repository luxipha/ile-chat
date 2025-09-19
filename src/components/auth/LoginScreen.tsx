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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface LoginScreenProps {
  onLoginSuccess: (userData: UserData) => void;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  isNewUser: boolean;
}

type LoginStep = 'email' | 'verification' | 'complete';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const emailInputRef = useRef<TextInput>(null);
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call to send verification code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      animateStepTransition();
      setStep('verification');
      setCountdown(60);
      
      // Focus first code input
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 300);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
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

  const handleVerificationSubmit = async (code?: string[]) => {
    const codeToVerify = code || verificationCode;
    const codeString = codeToVerify.join('');
    
    if (codeString.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call to verify code and login/register
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response - determine if user exists or is new
      const isNewUser = Math.random() > 0.7; // 30% chance of new user
      
      const userData: UserData = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: isNewUser ? '' : email.split('@')[0], // Use email prefix for existing users
        isNewUser,
      };

      animateStepTransition();
      setStep('complete');
      
      // Auto-complete after showing success
      setTimeout(() => {
        onLoginSuccess(userData);
      }, 2000);
      
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
      // Clear the code inputs
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(60);
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Simulate Google sign-in
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const userData: UserData = {
        id: Math.random().toString(36).substr(2, 9),
        email: 'user@gmail.com', // Would come from Google
        name: 'John Doe', // Would come from Google
        isNewUser: false,
      };

      onLoginSuccess(userData);
    } catch (error) {
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    animateStepTransition();
    setStep('email');
    setVerificationCode(['', '', '', '', '', '']);
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 300);
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

      <Card style={styles.inputCard}>
        <View style={styles.inputSection}>
          <MaterialIcons name="email" size={20} color={Colors.primary} />
          <TextInput
            ref={emailInputRef}
            style={styles.emailInput}
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleEmailSubmit}
          />
        </View>
      </Card>

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
        <MaterialIcons name="account-circle" size={20} color={Colors.textPrimary} />
        <Typography variant="h6" style={styles.googleButtonText}>
          Continue with Google
        </Typography>
      </TouchableOpacity>
    </View>
  );

  const renderVerificationStep = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackToEmail}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
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
          Welcome!
        </Typography>
        <Typography variant="body1" color="textSecondary" style={styles.successSubtitle}>
          Your account is ready. Taking you to your dashboard...
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
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
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
  emailInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
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
});