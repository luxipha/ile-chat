import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { Typography } from '../ui/Typography';
import { Colors, Spacing } from '../../theme';

interface QRScannerProps {
  onBack: () => void;
  onQRCodeScanned: (data: string) => void;
  title?: string;
  description?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onBack,
  onQRCodeScanned,
  title = 'Scan QR Code',
  description = 'Point your camera at a QR code',
}) => {
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setCameraPermission(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (scanned) return;
    
    setScanned(true);
    Vibration.vibrate(); // Provide haptic feedback
    
    // Add a longer delay to prevent multiple scans
    setTimeout(() => {
      onQRCodeScanned(data);
    }, 300);
  };

  const resetScanner = () => {
    setScanned(false);
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  if (cameraPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialIcons name="camera" size={64} color={Colors.gray400} />
          <Typography variant="h6" style={styles.permissionText}>
            Requesting camera permission...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  if (cameraPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Typography variant="h6" style={styles.headerTitle}>
            {title}
          </Typography>
          <View style={styles.headerAction} />
        </View>
        
        <View style={styles.permissionContainer}>
          <MaterialIcons name="camera-alt" size={64} color={Colors.gray400} />
          <Typography variant="h6" style={styles.permissionText}>
            Camera permission required
          </Typography>
          <Typography variant="body2" style={styles.permissionDescription}>
            Please enable camera access in your device settings to scan QR codes
          </Typography>
          <TouchableOpacity 
            onPress={requestCameraPermission}
            style={styles.permissionButton}
          >
            <Typography variant="body1" style={styles.permissionButtonText}>
              Grant Permission
            </Typography>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Typography variant="h6" style={styles.headerTitle}>
          {title}
        </Typography>
        <TouchableOpacity onPress={toggleFlash} style={styles.flashButton}>
          <MaterialIcons 
            name={flashOn ? "flash-on" : "flash-off"} 
            size={24} 
            color={Colors.white} 
          />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.scannerOverlay}>
            {/* Scanner Frame */}
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Scanning Animation */}
              {!scanned && <View style={styles.scanLine} />}
            </View>
            
            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Typography variant="body1" style={styles.instructions}>
                {description}
              </Typography>
              <Typography variant="body2" style={styles.subInstructions}>
                Position the QR code within the frame
              </Typography>
            </View>
          </View>
        </CameraView>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {scanned && (
          <TouchableOpacity onPress={resetScanner} style={styles.rescanButton}>
            <MaterialIcons name="refresh" size={24} color={Colors.white} />
            <Typography variant="body1" style={styles.rescanButtonText}>
              Scan Again
            </Typography>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');
const scannerSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    color: Colors.white,
    fontWeight: '600',
  },
  flashButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
  },
  headerAction: {
    width: 24,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockCamera: {
    flex: 1,
    width: '100%',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  scannerFrame: {
    width: scannerSize,
    height: scannerSize,
    position: 'relative',
    marginBottom: Spacing.xl,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  instructions: {
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subInstructions: {
    color: Colors.gray300,
    textAlign: 'center',
  },
  bottomControls: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 25,
  },
  rescanButtonText: {
    color: Colors.white,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  permissionText: {
    color: Colors.white,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  permissionDescription: {
    color: Colors.gray300,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});