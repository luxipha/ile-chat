import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface SetPinScreenProps {
  onBack: () => void;
  onPinSet: (pin: string) => void;
  isChanging?: boolean; // true if changing existing PIN
}

export const SetPinScreen: React.FC<SetPinScreenProps> = ({
  onBack,
  onPinSet,
  isChanging = false,
}) => {
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>(!isChanging ? 'new' : 'current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleCurrentPinNext = () => {
    if (currentPin.length !== 4) {
      Alert.alert('Error', 'Please enter your current 4-digit PIN');
      return;
    }
    
    // In real app, verify current PIN
    setStep('new');
  };

  const handleNewPinNext = () => {
    if (newPin.length !== 4) {
      Alert.alert('Error', 'Please enter a 4-digit PIN');
      return;
    }
    
    setStep('confirm');
  };

  const handleConfirmPin = () => {
    if (confirmPin.length !== 4) {
      Alert.alert('Error', 'Please confirm your 4-digit PIN');
      return;
    }
    
    if (newPin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match. Please try again.');
      setConfirmPin('');
      return;
    }
    
    onPinSet(newPin);
    Alert.alert(
      'Success', 
      isChanging ? 'PIN changed successfully' : 'PIN set successfully'
    );
  };

  const renderCurrentPinStep = () => (
    <View style={styles.stepContainer}>
      <MaterialIcons name="lock" size={80} color={Colors.primary} style={styles.icon} />
      
      <Typography variant="h3" style={styles.title}>
        Enter Current PIN
      </Typography>
      
      <Typography variant="body1" color="textSecondary" style={styles.description}>
        Please enter your current 4-digit PIN to continue
      </Typography>
      
      <View style={styles.pinInput}>
        <TextInput
          style={styles.pinTextInput}
          value={currentPin}
          onChangeText={setCurrentPin}
          placeholder="••••"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          autoFocus
        />
      </View>
      
      <Button
        title="Continue"
        onPress={handleCurrentPinNext}
        style={styles.button}
        disabled={currentPin.length !== 4}
      />
    </View>
  );

  const renderNewPinStep = () => (
    <View style={styles.stepContainer}>
      <MaterialIcons name="security" size={80} color={Colors.primary} style={styles.icon} />
      
      <Typography variant="h3" style={styles.title}>
        {isChanging ? 'Set New PIN' : 'Set Your PIN'}
      </Typography>
      
      <Typography variant="body1" color="textSecondary" style={styles.description}>
        Create a 4-digit PIN to secure your transactions
      </Typography>
      
      <View style={styles.pinInput}>
        <TextInput
          style={styles.pinTextInput}
          value={newPin}
          onChangeText={setNewPin}
          placeholder="••••"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          autoFocus
        />
      </View>
      
      <View style={styles.pinTips}>
        <Typography variant="body2" color="textSecondary" style={styles.tipText}>
          • Use a PIN that's easy for you to remember
        </Typography>
        <Typography variant="body2" color="textSecondary" style={styles.tipText}>
          • Avoid using consecutive or repeated numbers
        </Typography>
        <Typography variant="body2" color="textSecondary" style={styles.tipText}>
          • Don't share your PIN with anyone
        </Typography>
      </View>
      
      <Button
        title="Continue"
        onPress={handleNewPinNext}
        style={styles.button}
        disabled={newPin.length !== 4}
      />
    </View>
  );

  const renderConfirmPinStep = () => (
    <View style={styles.stepContainer}>
      <MaterialIcons name="check-circle" size={80} color={Colors.success} style={styles.icon} />
      
      <Typography variant="h3" style={styles.title}>
        Confirm Your PIN
      </Typography>
      
      <Typography variant="body1" color="textSecondary" style={styles.description}>
        Please enter your PIN again to confirm
      </Typography>
      
      <View style={styles.pinInput}>
        <TextInput
          style={styles.pinTextInput}
          value={confirmPin}
          onChangeText={setConfirmPin}
          placeholder="••••"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          autoFocus
        />
      </View>
      
      <View style={styles.buttonRow}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => setStep('new')}
          style={styles.buttonHalf}
        />
        <Button
          title="Set PIN"
          onPress={handleConfirmPin}
          style={styles.buttonHalf}
          disabled={confirmPin.length !== 4}
        />
      </View>
    </View>
  );

  const renderContent = () => {
    switch (step) {
      case 'current': return renderCurrentPinStep();
      case 'new': return renderNewPinStep();
      case 'confirm': return renderConfirmPinStep();
      default: return renderNewPinStep();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">
          {isChanging ? 'Change PIN' : 'Set PIN'}
        </Typography>
        <View style={styles.headerSpacer} />
      </View>

      {renderContent()}
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
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  icon: {
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  pinInput: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  pinTextInput: {
    fontSize: 48,
    fontWeight: '600',
    letterSpacing: 20,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    width: 200,
  },
  pinTips: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  tipText: {
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    maxWidth: 300,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    maxWidth: 300,
  },
  buttonHalf: {
    flex: 1,
  },
});