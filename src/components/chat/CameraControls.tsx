import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FlashMode, CameraType } from 'expo-camera';
import { Colors, Spacing } from '../../theme';

interface CameraControlsProps {
  flashMode: FlashMode;
  torch: boolean;
  zoom: number;
  onClose: () => void;
  onToggleFlash: () => void;
  onToggleTorch: () => void;
  onToggleCamera: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  flashMode,
  torch,
  zoom,
  onClose,
  onToggleFlash,
  onToggleTorch,
  onToggleCamera,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <View style={styles.topControls}>
      <TouchableOpacity onPress={onClose} style={styles.controlButton}>
        <MaterialIcons name="close" size={28} color={Colors.white} />
      </TouchableOpacity>
      <View style={styles.topRightControls}>
        <TouchableOpacity onPress={onToggleTorch} style={styles.controlButton}>
          <MaterialIcons 
            name={torch ? 'flash-on' : 'flash-off'} 
            size={24} 
            color={Colors.white} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleCamera} style={styles.controlButton}>
          <MaterialIcons name="flip-camera-android" size={24} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleFlash} style={styles.controlButton}>
          <MaterialIcons 
            name={flashMode === 'on' ? 'flash-on' : 'flash-off'} 
            size={24} 
            color={Colors.white} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onZoomIn} style={styles.controlButton}>
          <MaterialIcons name="zoom-in" size={24} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onZoomOut} style={styles.controlButton}>
          <MaterialIcons name="zoom-out" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: Spacing.sm,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});