import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface ChangePasswordScreenProps {
  onBack: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  onBack,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(newPassword);

  const canSubmit = () => {
    return (
      currentPassword.length > 0 &&
      passwordValidation.isValid &&
      newPassword === confirmPassword &&
      newPassword !== currentPassword
    );
  };

  const handleChangePassword = async () => {
    if (!canSubmit()) return;

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success',
        'Your password has been changed successfully.',
        [
          {
            text: 'OK',
            onPress: () => onBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    showPassword: boolean,
    toggleShowPassword: () => void,
    placeholder: string
  ) => (
    <View style={styles.inputGroup}>
      <Typography variant="body1" style={styles.inputLabel}>
        {label}
      </Typography>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={toggleShowPassword}
        >
          <MaterialIcons
            name={showPassword ? 'visibility' : 'visibility-off'}
            size={24}
            color={Colors.gray400}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPasswordRequirements = () => (
    <View style={styles.requirementsContainer}>
      <Typography variant="body2" style={styles.requirementsTitle}>
        Password Requirements:
      </Typography>
      
      <View style={styles.requirement}>
        <MaterialIcons
          name={passwordValidation.minLength ? 'check-circle' : 'radio-button-unchecked'}
          size={16}
          color={passwordValidation.minLength ? Colors.success : Colors.gray400}
        />
        <Typography
          variant="caption"
          style={[
            styles.requirementText,
            passwordValidation.minLength && styles.requirementMet
          ]}
        >
          At least 8 characters
        </Typography>
      </View>

      <View style={styles.requirement}>
        <MaterialIcons
          name={passwordValidation.hasUpperCase ? 'check-circle' : 'radio-button-unchecked'}
          size={16}
          color={passwordValidation.hasUpperCase ? Colors.success : Colors.gray400}
        />
        <Typography
          variant="caption"
          style={[
            styles.requirementText,
            passwordValidation.hasUpperCase && styles.requirementMet
          ]}
        >
          One uppercase letter
        </Typography>
      </View>

      <View style={styles.requirement}>
        <MaterialIcons
          name={passwordValidation.hasLowerCase ? 'check-circle' : 'radio-button-unchecked'}
          size={16}
          color={passwordValidation.hasLowerCase ? Colors.success : Colors.gray400}
        />
        <Typography
          variant="caption"
          style={[
            styles.requirementText,
            passwordValidation.hasLowerCase && styles.requirementMet
          ]}
        >
          One lowercase letter
        </Typography>
      </View>

      <View style={styles.requirement}>
        <MaterialIcons
          name={passwordValidation.hasNumbers ? 'check-circle' : 'radio-button-unchecked'}
          size={16}
          color={passwordValidation.hasNumbers ? Colors.success : Colors.gray400}
        />
        <Typography
          variant="caption"
          style={[
            styles.requirementText,
            passwordValidation.hasNumbers && styles.requirementMet
          ]}
        >
          One number
        </Typography>
      </View>

      <View style={styles.requirement}>
        <MaterialIcons
          name={passwordValidation.hasSpecialChar ? 'check-circle' : 'radio-button-unchecked'}
          size={16}
          color={passwordValidation.hasSpecialChar ? Colors.success : Colors.gray400}
        />
        <Typography
          variant="caption"
          style={[
            styles.requirementText,
            passwordValidation.hasSpecialChar && styles.requirementMet
          ]}
        >
          One special character
        </Typography>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">Change Password</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Typography variant="body2" color="textSecondary" style={styles.description}>
          Create a strong password to keep your account secure.
        </Typography>

        {renderPasswordInput(
          'Current Password',
          currentPassword,
          setCurrentPassword,
          showCurrentPassword,
          () => setShowCurrentPassword(!showCurrentPassword),
          'Enter your current password'
        )}

        {renderPasswordInput(
          'New Password',
          newPassword,
          setNewPassword,
          showNewPassword,
          () => setShowNewPassword(!showNewPassword),
          'Enter your new password'
        )}

        {newPassword.length > 0 && renderPasswordRequirements()}

        {renderPasswordInput(
          'Confirm New Password',
          confirmPassword,
          setConfirmPassword,
          showConfirmPassword,
          () => setShowConfirmPassword(!showConfirmPassword),
          'Confirm your new password'
        )}

        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={16} color={Colors.error} />
            <Typography variant="caption" color="error" style={styles.errorText}>
              Passwords do not match
            </Typography>
          </View>
        )}

        {newPassword.length > 0 && newPassword === currentPassword && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={16} color={Colors.error} />
            <Typography variant="caption" color="error" style={styles.errorText}>
              New password must be different from current password
            </Typography>
          </View>
        )}

        <Button
          title={isLoading ? 'Changing Password...' : 'Change Password'}
          onPress={handleChangePassword}
          disabled={!canSubmit() || isLoading}
          style={styles.changeButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  description: {
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  eyeButton: {
    padding: Spacing.sm,
  },
  requirementsContainer: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  requirementsTitle: {
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  requirementText: {
    marginLeft: Spacing.sm,
    color: Colors.textSecondary,
  },
  requirementMet: {
    color: Colors.success,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  errorText: {
    marginLeft: Spacing.sm,
  },
  changeButton: {
    marginTop: Spacing.xl,
  },
});