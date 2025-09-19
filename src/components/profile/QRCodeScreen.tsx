import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

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
  const [qrType, setQrType] = useState<'profile' | 'payment' | 'contact'>('profile');
  const [isLoading, setIsLoading] = useState(false);

  // Mock QR code data
  const getQRData = () => {
    switch (qrType) {
      case 'profile':
        return `ilepay://profile/${userId}`;
      case 'payment':
        return `ilepay://pay/${userId}`;
      case 'contact':
        return `ilepay://contact/${userId}`;
      default:
        return `ilepay://profile/${userId}`;
    }
  };

  const qrCodeData = getQRData();

  const handleSaveQR = async () => {
    setIsLoading(true);
    try {
      // Simulate QR code generation and save
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Success', 'QR code has been saved to your photo gallery.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save QR code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareQR = async () => {
    try {
      const shareOptions = {
        title: 'My ilePay QR Code',
        message: `Connect with me on ilePay! Scan this QR code or use my profile: ${qrCodeData}`,
        url: qrCodeData, // In a real app, this would be an image URL
      };
      
      await Share.share(shareOptions);
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code. Please try again.');
    }
  };

  const handleCopyLink = () => {
    // In a real app, you would copy to clipboard
    Alert.alert('Copied', 'Profile link has been copied to clipboard.');
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
          { id: 'contact', title: 'Contact', icon: 'contacts', description: 'Add to contacts' },
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
      <View style={styles.qrCodeContainer}>
        <View style={styles.qrCodePlaceholder}>
          {/* In a real app, this would be an actual QR code component */}
          <View style={styles.qrCodeGrid}>
            {Array.from({ length: 25 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.qrCodePixel,
                  Math.random() > 0.5 && styles.qrCodePixelFilled
                ]}
              />
            ))}
          </View>
          
          {/* Center logo */}
          <View style={styles.qrCodeCenterLogo}>
            <MaterialIcons name="account-balance" size={24} color={Colors.primary} />
          </View>
        </View>
        
        <Typography variant="h6" style={styles.qrCodeTitle}>
          {userName}
        </Typography>
        <Typography variant="caption" color="textSecondary" style={styles.qrCodeSubtitle}>
          {qrType === 'profile' ? 'Scan to view profile' :
           qrType === 'payment' ? 'Scan to send payment' :
           'Scan to add contact'}
        </Typography>
      </View>
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
            Connect instantly without sharing personal information
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
  qrCodePlaceholder: {
    width: qrCodeSize,
    height: qrCodeSize,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  qrCodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: qrCodeSize - 40,
    height: qrCodeSize - 40,
  },
  qrCodePixel: {
    width: (qrCodeSize - 40) / 25,
    height: (qrCodeSize - 40) / 25,
    backgroundColor: Colors.background,
    margin: 0.5,
  },
  qrCodePixelFilled: {
    backgroundColor: Colors.textPrimary,
  },
  qrCodeCenterLogo: {
    position: 'absolute',
    width: 48,
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  qrCodeTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  qrCodeSubtitle: {
    textAlign: 'center',
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