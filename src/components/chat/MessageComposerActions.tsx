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
import { DoodleCanvas } from './DoodleCanvas';


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
  onStartWatchTogether?: (videoUrl: string, videoTitle: string) => void; // New prop for shared video
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
  onStartWatchTogether, // Destructure new prop
  onSendLocation,
  onStartVideoCall,
  onStartVoiceCall,
  currentUserId = 'default-user',
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [showCamera, setShowCamera] = useState(false);
  const [showDoodle, setShowDoodle] = useState(false);

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
      if (__DEV__) {
        console.log('📷 Camera action requested');
        console.log('📷 Setting showCamera to true...');
      }
      setShowCamera(true);
      if (__DEV__) {
        console.log('📷 showCamera state updated');
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handlePhotoTaken = (uri: string) => {
    if (__DEV__) {
      console.log('📸 Photo taken:', uri);
    }
    onSendImage?.(uri);
    setShowCamera(false);
    onClose();
  };

  const handleVideoRecorded = (uri: string) => {
    if (__DEV__) {
      console.log('🎥 Video recorded:', uri);
    }
    onSendImage?.(uri); // For now, treat video same as image
    setShowCamera(false);
    onClose();
  };

  const handleSelectImage = async () => {
    try {
      if (__DEV__) {
        console.log('🖼️ Photo library action requested');
      }
      
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
        if (__DEV__) {
          console.log('🖼️ Photo selected:', result.assets[0].uri);
        }
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
      if (__DEV__) {
        console.log('📎 Document selection requested');
      }
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (__DEV__) {
          console.log('📎 Document selected:', result.assets[0].uri);
        }
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

  const handleWatchTogetherPress = () => {
    // For now, just close the panel and let the parent handle the modal
    onClose();
    onStartWatchTogether?.('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Rick Astley - Never Gonna Give You Up'); // Example
  };
  if (!visible) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0], // Slide up from 20px below - more subtle
  });

  // Render sticker grid mode with tabs
  const renderStickerGrid = () => (
    <View style={styles.stickerContainer}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Close sticker panel"
        onPress={onClose}
        activeOpacity={0.8}
        style={styles.dragHandleContainer}
      >
        <View style={styles.dragHandle} />
      </TouchableOpacity>
      
      {/* Unified Sticker Grid */}
      <KlipyStickerGrid
        currentUserId={currentUserId}
        onStickerSelect={(sticker: StickerData) => {
          if (__DEV__) {
            console.log('🎭 Sticker selected:', sticker);
          }
          onSendSticker?.(sticker);
          onClose();
        }}
      />
    </View>
  );

  // Render action buttons mode
  const renderActionButtons = () => (
    <>
      <View style={styles.dragHandleContainer}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close actions panel"
          onPress={onClose}
          activeOpacity={0.8}
        >
          <View style={styles.dragHandle} />
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

        {/* Draw/Doodle Option */}
        <TouchableOpacity 
          onPress={() => setShowDoodle(true)} 
          style={styles.actionItem}
        >
          <View style={styles.actionIcon}>
            <MaterialIcons name="brush" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Draw
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

        {/* Watch Together Option (New) */}
        <TouchableOpacity 
          onPress={handleWatchTogetherPress} 
          style={styles.actionItem}
        >
          <View style={styles.actionIcon}>
            <MaterialIcons name="movie" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Watch Together
          </Typography>
        </TouchableOpacity>

        {/* Empty slot for future features */}
        <View style={styles.actionItem} />
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
      {__DEV__ && console.log('📷 MessageComposerActions render - showCamera:', showCamera)}
      <SimpleCameraScreen
        visible={showCamera}
        onClose={() => {
          if (__DEV__) {
            console.log('📷 Camera close requested');
          }
          setShowCamera(false);
        }}
        onPhotoTaken={handlePhotoTaken}
        onVideoRecorded={handleVideoRecorded}
      />
      
      {/* Doodle Canvas */}
      <DoodleCanvas
        visible={showDoodle}
        onClose={() => setShowDoodle(false)}
        onSendImage={(imageUri) => {
          if (__DEV__) {
            console.log('🎨 Doodle image created:', imageUri);
          }
          onSendImage?.(imageUri);
          onClose();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface || '#F5F5F5',
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: Colors.gray300 || '#D4D4D8',
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
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
    height: 250,
    backgroundColor: Colors.surface,
    paddingTop: 0,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 0,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.gray200,
  },
});
