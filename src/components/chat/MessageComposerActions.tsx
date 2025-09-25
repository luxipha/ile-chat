import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface MessageComposerActionsProps {
  visible: boolean;
  onClose: () => void;
  onSendMoney: () => void;
  onSendImage?: (imageUri: string) => void;
  onSendDocument?: (documentUri: string) => void;
}

export const MessageComposerActions: React.FC<MessageComposerActionsProps> = ({
  visible,
  onClose,
  onSendMoney,
  onSendImage,
  onSendDocument,
}) => {

  const handleTakePhoto = async () => {
    try {
      console.log('📷 Camera action requested');
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📸 Photo taken:', result.assets[0].uri);
        onSendImage?.(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSelectImage = async () => {
    try {
      console.log('🖼️ Photo library action requested');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('🖼️ Photo selected:', result.assets[0].uri);
        onSendImage?.(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSelectDocument = async () => {
    try {
      console.log('📎 Document selection requested');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📎 Document selected:', result.assets[0].uri);
        onSendDocument?.(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.error('Error selecting document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const handleSendMoneyPress = () => {
    onClose();
    onSendMoney();
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* First Row */}
      <View style={styles.row}>
        {/* Camera Option */}
        <TouchableOpacity 
          onPress={handleTakePhoto} 
          style={styles.actionItem}
        >
          <View style={styles.actionIcon}>
            <MaterialIcons name="camera-alt" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Camera
          </Typography>
        </TouchableOpacity>

        {/* Photo Library Option */}
        <TouchableOpacity 
          onPress={handleSelectImage} 
          style={styles.actionItem}
        >
          <View style={styles.actionIcon}>
            <MaterialIcons name="photo-library" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Photo
          </Typography>
        </TouchableOpacity>

        {/* Document Option */}
        <TouchableOpacity 
          onPress={handleSelectDocument} 
          style={styles.actionItem}
        >
          <View style={styles.actionIcon}>
            <MaterialIcons name="attach-file" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Document
          </Typography>
        </TouchableOpacity>

        {/* Send Money Option */}
        <TouchableOpacity 
          onPress={handleSendMoneyPress} 
          style={styles.actionItem}
        >
          <View style={[styles.actionIcon, styles.sendMoneyIcon]}>
            <MaterialIcons name="payment" size={24} color={Colors.white} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Send Money
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Second Row - can add more actions here */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionIcon}>
            <MaterialIcons name="location-on" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Location
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionIcon}>
            <MaterialIcons name="card-giftcard" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Gift
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionIcon}>
            <MaterialIcons name="mic" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Voice
          </Typography>
        </TouchableOpacity>

        {/* Empty slot */}
        <View style={styles.actionItem} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface || '#F5F5F5',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200 || '#E0E0E0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sendMoneyIcon: {
    backgroundColor: Colors.secondary, // Gold color for Send Money
  },
  actionText: {
    textAlign: 'center',
    color: Colors.textSecondary || '#666',
    fontSize: 12,
  },
});