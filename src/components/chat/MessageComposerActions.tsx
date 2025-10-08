import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import GiphyStickerGrid from './GiphyStickerGrid';
import { StickerData } from '../../types/sticker';


interface MessageComposerActionsProps {
  visible: boolean;
  mode: 'actions' | 'stickers'; // Two modes for the panel
  onClose: () => void;
  onSendMoney: () => void;
  onSendImage?: (imageUri: string) => void;
  onSendDocument?: (documentUri: string) => void;
  onSendSticker?: (sticker: StickerData) => void;
}

export const MessageComposerActions: React.FC<MessageComposerActionsProps> = ({
  visible,
  mode,
  onClose,
  onSendMoney,
  onSendImage,
  onSendDocument,
  onSendSticker,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up animation when showing
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down animation when hiding
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

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


  // Add header with close button for sticker mode
  const renderStickerHeader = () => (
    <View style={styles.header}>
         <TouchableOpacity onPress={onClose} style={styles.closeButton}>
           <MaterialIcons name="close" size={24} color={Colors.gray600} />
         </TouchableOpacity>
       </View>
  );

  if (!visible) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0], // Slide up from 20px below - more subtle
  });

  // Render GIPHY sticker grid mode
  const renderStickerGrid = () => (
    <View style={styles.stickerContainer}>
      {renderStickerHeader()}
      <GiphyStickerGrid
        onStickerSelect={(sticker) => {
          console.log('GIPHY sticker selected:', sticker);
          onSendSticker?.(sticker);
          onClose();
        }}
      />
    </View>
  );

  // Render action buttons mode
  const renderActionButtons = () => (
    <>
      {/* Header with close button */}
       <View style={styles.header}>
         <TouchableOpacity onPress={onClose} style={styles.closeButton}>
           <MaterialIcons name="close" size={24} color={Colors.gray600} />
         </TouchableOpacity>
       </View>
      
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

      {/* Second Row */}
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

        {/* Empty slot for now */}
        <View style={styles.actionItem} />
      </View>
    </>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Conditional rendering based on mode */}
      {mode === 'stickers' ? renderStickerGrid() : renderActionButtons()}
      
    </Animated.View>
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
    color: Colors.gray600,
    fontSize: 12,
  },
  // Sticker styles
  stickerContainer: {
    height: 200, // Further reduced to better match action buttons height
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
});