import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// import QRCode from 'react-native-qrcode-svg';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProfileCard } from '../ui/ProfileCard';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface ProfileScreenProps {
  onBack: () => void;
  onEditProfile: () => void;
}

interface UserProfile {
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  region: string;
  phone: string;
  userId: string;
  profilePicture?: string;
  bricksCount: number;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onEditProfile,
}) => {
  const [showQRCode, setShowQRCode] = useState(false);
  
  // Mock user data - replace with actual user data
  const userProfile: UserProfile = {
    name: 'John Doe',
    gender: 'Male',
    region: 'Lagos, Nigeria',
    phone: '+234 812 345 6789',
    userId: 'ILE_JD_9847',
    bricksCount: 7850,
    profilePicture: undefined, // URL when available
  };

  const handleShareProfile = () => {
    Alert.alert(
      'Share Profile',
      'Choose how you want to share your profile',
      [
        { text: 'Copy User ID', onPress: () => copyToClipboard(userProfile.userId) },
        { text: 'Show QR Code', onPress: () => setShowQRCode(true) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const copyToClipboard = (text: string) => {
    // Implementation would use Clipboard API
    Alert.alert('Copied!', `${text} copied to clipboard`);
  };

  const renderProfilePicture = () => {
    return (
      <View style={styles.avatarContainer}>
        {userProfile.profilePicture ? (
          <Image source={{ uri: userProfile.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Typography variant="h2" style={styles.avatarText}>
              {userProfile.name.split(' ').map(n => n[0]).join('')}
            </Typography>
          </View>
        )}
        <TouchableOpacity style={styles.editAvatarButton} onPress={onEditProfile}>
          <MaterialIcons name="camera-alt" size={16} color={Colors.background} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderProfileInfo = () => (
    <Card style={styles.profileCard}>
      <View style={styles.profileHeader}>
        {renderProfilePicture()}
        <View style={styles.profileActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onEditProfile}>
            <MaterialIcons name="edit" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShareProfile}>
            <MaterialIcons name="share" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.profileDetails}>
        <Typography variant="h4" style={styles.userName}>{userProfile.name}</Typography>
        <Typography variant="body1" color="textSecondary" style={styles.userId}>
          ID: {userProfile.userId}
        </Typography>
        
        <View style={styles.bricksContainer}>
          <MaterialIcons name="grain" size={20} color={Colors.secondary} />
          <Typography variant="h6" style={styles.bricksText}>
            {userProfile.bricksCount.toLocaleString()} Bricks
          </Typography>
        </View>
      </View>
    </Card>
  );

  const renderInfoSection = () => (
    <View style={styles.section}>
      <Typography variant="h5" style={styles.sectionTitle}>Personal Information</Typography>
      
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Typography variant="body2" color="textSecondary">Gender</Typography>
            <Typography variant="body1">{userProfile.gender}</Typography>
          </View>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Typography variant="body2" color="textSecondary">Region</Typography>
            <Typography variant="body1">{userProfile.region}</Typography>
          </View>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <MaterialIcons name="phone" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Typography variant="body2" color="textSecondary">Phone Number</Typography>
            <Typography variant="body1">{userProfile.phone}</Typography>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderQRCodeModal = () => (
    <Modal
      visible={showQRCode}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowQRCode(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.qrModalContent}>
          <View style={styles.qrHeader}>
            <Typography variant="h5">My QR Code</Typography>
            <TouchableOpacity onPress={() => setShowQRCode(false)}>
              <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <MaterialIcons name="qr-code" size={120} color={Colors.primary} />
              <Typography variant="body2" color="textSecondary" style={styles.qrPlaceholderText}>
                QR Code for {userProfile.userId}
              </Typography>
            </View>
          </View>
          
          <Typography variant="body1" color="textSecondary" style={styles.qrText}>
            Scan this code to connect with me on ilePay
          </Typography>
          
          <Button
            title="Share QR Code"
            onPress={() => {
              // Implementation for sharing QR code
              Alert.alert('Share', 'QR Code sharing functionality');
            }}
            style={styles.shareButton}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">Profile</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProfileInfo()}
        {renderInfoSection()}
      </ScrollView>

      {renderQRCodeModal()}
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
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profileActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: Spacing.xs / 2,
    fontWeight: '500',
  },
  profileDetails: {
    alignItems: 'center',
  },
  userName: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  userId: {
    marginBottom: Spacing.md,
    fontSize: 14,
  },
  bricksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  bricksText: {
    marginLeft: Spacing.sm,
    color: Colors.secondary,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalContent: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    margin: Spacing.lg,
    alignItems: 'center',
    minWidth: 300,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  qrContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  qrPlaceholder: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderStyle: 'dashed',
  },
  qrPlaceholderText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  qrText: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  shareButton: {
    width: '100%',
  },
});