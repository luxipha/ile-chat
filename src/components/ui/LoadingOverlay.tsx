import React from 'react';
import { View, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Typography } from './Typography';
import { Colors, Spacing } from '../../theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = false,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={[styles.overlay, transparent && styles.transparentOverlay]}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Typography variant="body1" style={styles.message}>
            {message}
          </Typography>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transparentOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.xl,
    alignItems: 'center',
    minWidth: 120,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  message: {
    marginTop: Spacing.md,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});