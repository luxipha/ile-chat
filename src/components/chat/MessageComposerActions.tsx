import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { KlipyStickerGrid } from './UnifiedStickerGrid';
import { StickerData } from '../../types/sticker';
import { SimpleCameraScreen } from './SimpleCameraScreen';


interface MessageComposerActionsProps {
  visible: boolean;
  mode: 'actions' | 'stickers'; // Two modes for the panel
  onClose: () => void;
  currentUserId?: string; // For Stipop user ID
  onSendMoney: () => void;
  onSendImage?: (imageUri: string) => void;
  onSendDocument?: (documentUri: string) => void;
  onSendSticker?: (sticker: StickerData) => void;
  onSendAudio?: (audioUri: string, duration: number) => void;
  onSendLocation?: () => void;
  onStartVideoCall?: () => void;
  onStartVoiceCall?: () => void;
}

export const MessageComposerActions: React.FC<MessageComposerActionsProps> = ({
  visible,
  mode,
  onClose,
  onSendMoney,
  onSendImage,
  onSendDocument,
  onSendSticker,
  onSendAudio,
  onSendLocation,
  onStartVideoCall,
  onStartVoiceCall,
  currentUserId = 'default-user',
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [showCamera, setShowCamera] = useState(false);

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
      console.log('📷 Setting showCamera to true...');
      setShowCamera(true);
      console.log('📷 showCamera state updated');
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handlePhotoTaken = (uri: string) => {
    console.log('📸 Photo taken:', uri);
    onSendImage?.(uri);
    setShowCamera(false);
    onClose();
  };

  const handleVideoRecorded = (uri: string) => {
    console.log('🎥 Video recorded:', uri);
    onSendImage?.(uri); // For now, treat video same as image
    setShowCamera(false);
    onClose();
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

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0], // Slide up from 20px below - more subtle
  });

  // Render sticker grid mode with unified component
  const renderStickerGrid = () => (
    <View style={styles.stickerContainer}>
      {/* Klipy Sticker Grid */}
      <KlipyStickerGrid
        currentUserId={currentUserId}
        onStickerSelect={(sticker: StickerData) => {
          console.log('🎭 Unified sticker selected:', sticker);
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

        {/* Voice Call Option - Temporarily disabled */}
        {/* <TouchableOpacity 
          onPress={() => {
            onStartVoiceCall?.();
            onClose();
          }}
          style={styles.actionItem}
        >
          <View style={styles.actionIcon}>
            <MaterialIcons name="call" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Voice Call
          </Typography>
        </TouchableOpacity> */}

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
        <TouchableOpacity 
          onPress={() => {
            onSendLocation?.();
            onClose();
          }}
          style={styles.actionItem}
        >
          <View style={styles.actionIcon}>
            <MaterialIcons name="location-on" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Location
          </Typography>
        </TouchableOpacity>

        {/* Video Call Option - Temporarily disabled */}
        {/* <TouchableOpacity 
          onPress={() => {
            onStartVideoCall?.();
            onClose();
          }}
          style={styles.actionItem}
        >
          <View style={styles.actionIcon}>
            <MaterialIcons name="videocam" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Video Call
          </Typography>
        </TouchableOpacity> */}

        {/* Empty slots for future features */}
        <View style={styles.actionItem} />
        <View style={styles.actionItem} />
      </View>
    </>
  );

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          mode === 'stickers' && styles.stickerModeContainer,
          {
            transform: [{ translateY }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Conditional rendering based on mode */}
        {mode === 'stickers' ? renderStickerGrid() : renderActionButtons()}
      </Animated.View>

      {/* Camera Screen */}
      {console.log('📷 MessageComposerActions render - showCamera:', showCamera)}
      <SimpleCameraScreen
        visible={showCamera}
        onClose={() => {
          console.log('📷 Camera close requested');
          setShowCamera(false);
        }}
        onPhotoTaken={handlePhotoTaken}
        onVideoRecorded={handleVideoRecorded}
      />
    </>
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
    height: 250, // Increased to accommodate tabs
    backgroundColor: Colors.surface,
    margin: 0, // Remove all margins
    padding: 0, // Remove all padding
  },
  tabContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.gray600,
    fontWeight: '500',
    fontSize: 12,
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  stickerModeContainer: {
    paddingTop: 0, // Remove only top padding to eliminate space above categories
    borderTopWidth: 0, // Remove top border for stickers mode
  },
});