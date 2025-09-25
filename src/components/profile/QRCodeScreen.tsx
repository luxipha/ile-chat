import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Dimensions,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import friendService from '../../services/friendService';

interface QRCodeScreenProps {
  onBack: () => void;
  userName?: string;
  userId?: string;
}

const { width } = Dimensions.get('window');
const qrCodeSize = Math.min(width - 80, 300);

export const QRCodeScreen: React.FC<QRCodeScreenProps> = ({
  onBack,
  userName = 'John Doe',
  userId = 'user123',
}) => {
  const [qrType, setQrType] = useState<'profile' | 'payment'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  // Generate real QR code data based on type
  const getQRData = () => {
    console.log('🔍 QR Code data generation:', { userId, userName, qrType });
    
    // Validate that we have proper data
    if (!userId || !userName || userId === '' || userName === 'User') {
      console.error('❌ Missing or invalid userId/userName for QR code generation:', { userId, userName });
      // Return a basic test QR for debugging
      return `ilepay://profile/test-user-123:TestUser`;
    }
    
    switch (qrType) {
      case 'profile':
        return `ilepay://profile/${userId}:${userName}`;
      case 'payment':
        return `ilepay://pay/${userId}:${userName}`;
      default:
        return `ilepay://profile/${userId}:${userName}`;
    }
  };

  const qrCodeData = getQRData();
  
  // Log the final QR data for debugging
  console.log('📱 Generated QR code data:', qrCodeData);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  };

  const handleSaveQR = async () => {
    setIsLoading(true);
    try {
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission needed', 'Please allow access to save the QR code to your gallery.');
        return;
      }

      // Capture the QR code as image
      const uri = await viewShotRef.current?.capture();
      if (!uri) {
        throw new Error('Failed to capture QR code');
      }

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('ilePay', asset, false);
      
      Alert.alert('Success', 'QR code saved to your photo gallery!');
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'Failed to save QR code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareQR = async () => {
    try {
      // Capture QR code as image first
      const uri = await viewShotRef.current?.capture();
      
      const shareOptions = {
        title: `My ilePay ${qrType === 'contact' ? 'Contact' : qrType === 'payment' ? 'Payment' : 'Profile'} QR Code`,
        message: `Connect with ${userName} on ilePay! ${qrType === 'contact' ? 'Scan this QR code to add as contact' : qrType === 'payment' ? 'Scan to send payment' : 'Scan to view profile'}: ${qrCodeData}`,
        url: uri, // Share the actual QR code image
      };
      
      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert('Error', 'Failed to share QR code. Please try again.');
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(qrCodeData);
      Alert.alert('Copied!', `${qrType === 'contact' ? 'Contact' : qrType === 'payment' ? 'Payment' : 'Profile'} link copied to clipboard.`);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard.');
    }
  };

  const renderQRTypeSelector = () => (
    <View style={styles.typeSelector}>
      <Typography variant="h6" style={styles.typeSelectorTitle}>
        QR Code Type
      </Typography>
      
      <View style={styles.typeOptions}>
        {[
          { id: 'profile', title: 'Profile', icon: 'person', description: 'Share your profile' },
          { id: 'payment', title: 'Payment', icon: 'payment', description: 'Receive payments' },
        ].map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeOption,
              qrType === type.id && styles.selectedTypeOption
            ]}
            onPress={() => setQrType(type.id as any)}
          >
            <MaterialIcons
              name={type.icon as any}
              size={20}
              color={qrType === type.id ? Colors.primary : Colors.gray400}
            />
            <View style={styles.typeOptionContent}>
              <Typography
                variant="body2"
                style={[
                  styles.typeOptionTitle,
                  qrType === type.id && styles.selectedTypeOptionTitle
                ]}
              >
                {type.title}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {type.description}
              </Typography>
            </View>
            {qrType === type.id && (
              <MaterialIcons name="check-circle" size={16} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderQRCode = () => (
    <Card style={styles.qrCodeCard}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
        <View style={styles.qrCodeContainer}>
          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={qrCodeData}
              size={qrCodeSize - 40}
              color={Colors.text}
              backgroundColor={Colors.background}
              logoSize={30}
              logoBackgroundColor={Colors.background}
              logoMargin={2}
              logoBorderRadius={15}
            />
          </View>
          
          <Typography variant="h6" style={styles.qrCodeTitle}>
            {userName}
          </Typography>
          <Typography variant="caption" color="textSecondary" style={styles.qrCodeSubtitle}>
            {qrType === 'profile' ? 'Scan to view profile' :
             qrType === 'payment' ? 'Scan to send payment' :
             'Scan to add as contact'}
          </Typography>
          
          {/* Debug info - remove in production */}
          {__DEV__ && (
            <Typography variant="caption" style={styles.debugInfo}>
              Debug: {qrCodeData}
            </Typography>
          )}
        </View>
      </ViewShot>
    </Card>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <View style={styles.actionButtons}>
        <Button
          title={isLoading ? 'Saving...' : 'Save QR Code'}
          icon="save"
          onPress={handleSaveQR}
          disabled={isLoading}
          style={styles.actionButton}
          variant="outline"
        />
        
        <Button
          title="Share QR Code"
          icon="share"
          onPress={handleShareQR}
          style={styles.actionButton}
        />
      </View>
      
      <TouchableOpacity style={styles.copyLinkButton} onPress={handleCopyLink}>
        <MaterialIcons name="link" size={20} color={Colors.primary} />
        <Typography variant="body2" color="primary" style={styles.copyLinkText}>
          Copy Profile Link
        </Typography>
      </TouchableOpacity>
    </View>
  );

  const renderQRInfo = () => (
    <Card style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <MaterialIcons name="info" size={20} color={Colors.primary} />
        <Typography variant="h6" style={styles.infoTitle}>
          How it works
        </Typography>
      </View>
      
      <View style={styles.infoSteps}>
        <View style={styles.infoStep}>
          <View style={styles.stepNumber}>
            <Typography variant="caption" style={styles.stepNumberText}>1</Typography>
          </View>
          <Typography variant="body2" style={styles.stepText}>
            Others can scan your QR code with their ilePay app
          </Typography>
        </View>
        
        <View style={styles.infoStep}>
          <View style={styles.stepNumber}>
            <Typography variant="caption" style={styles.stepNumberText}>2</Typography>
          </View>
          <Typography variant="body2" style={styles.stepText}>
            They'll be able to {qrType === 'profile' ? 'view your profile' : 
                              qrType === 'payment' ? 'send you money' : 'add you to contacts'}
          </Typography>
        </View>
        
        <View style={styles.infoStep}>
          <View style={styles.stepNumber}>
            <Typography variant="caption" style={styles.stepNumberText}>3</Typography>
          </View>
          <Typography variant="body2" style={styles.stepText}>
            {qrType === 'profile' ? 'Connect instantly without sharing personal information' : 'Receive payments securely through QR code'}
          </Typography>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">My QR Code</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning for missing user data */}
        {(!userId || !userName || userId === '' || userName === 'User') && (
          <Card style={styles.warningCard}>
            <View style={styles.warningContainer}>
              <MaterialIcons name="warning" size={20} color={Colors.warning} />
              <Typography variant="body2" style={styles.warningText}>
                User data not loaded properly. Please try logging out and back in.
              </Typography>
            </View>
          </Card>
        )}
        
        {renderQRTypeSelector()}
        {renderQRCode()}
        {renderActions()}
        {renderQRInfo()}
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
  typeSelector: {
    marginBottom: Spacing.xl,
  },
  typeSelectorTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  typeOptions: {
    gap: Spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  selectedTypeOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  typeOptionContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  typeOptionTitle: {
    fontWeight: '500',
  },
  selectedTypeOptionTitle: {
    color: Colors.primary,
  },
  qrCodeCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  qrCodeContainer: {
    alignItems: 'center',
  },
  qrCodeWrapper: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  qrCodeSubtitle: {
    textAlign: 'center',
  },
  debugInfo: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontSize: 10,
    color: Colors.gray500,
    backgroundColor: Colors.gray100,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  warningCard: {
    backgroundColor: Colors.warning + '20',
    borderColor: Colors.warning,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    marginLeft: Spacing.sm,
    color: Colors.warning,
    flex: 1,
  },
  actionsContainer: {
    marginBottom: Spacing.xl,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  copyLinkText: {
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: Colors.gray50,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  infoSteps: {
    gap: Spacing.md,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    color: Colors.background,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    lineHeight: 20,
  },
});