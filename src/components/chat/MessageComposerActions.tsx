import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import GiphyStickerGrid from './GiphyStickerGrid';
import { StickerData } from '../../types/sticker';
import { audioService } from '../../services/audioService';
import { SimpleCameraScreen } from './SimpleCameraScreen';


interface MessageComposerActionsProps {
  visible: boolean;
  mode: 'actions' | 'stickers'; // Two modes for the panel
  onClose: () => void;
  onSendMoney: () => void;
  onSendImage?: (imageUri: string) => void;
  onSendDocument?: (documentUri: string) => void;
  onSendSticker?: (sticker: StickerData) => void;
  onSendAudio?: (audioUri: string, duration: number) => void;
  onSendLocation?: () => void;
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
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

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

  const startRecordingTimer = () => {
    setRecordingDuration(0);
    recordingTimer.current = setInterval(() => {
      setRecordingDuration(prev => {
        const newDuration = prev + 1;
        // Auto-stop at 2 minutes (120 seconds)
        if (newDuration >= 120) {
          handleStopVoiceRecording();
          return 120;
        }
        return newDuration;
      });
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  const handleStartVoiceRecording = async () => {
    try {
      console.log('🎤 Starting voice recording');
      await audioService.startRecording();
      setIsRecording(true);
      startRecordingTimer();
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const handleStopVoiceRecording = async () => {
    try {
      console.log('🛑 Stopping voice recording');
      const audioUri = await audioService.stopRecording();
      setIsRecording(false);
      stopRecordingTimer();

      if (audioUri && recordingDuration > 0) {
        const duration = await audioService.getAudioDuration(audioUri);
        console.log('🎵 Audio recorded:', audioUri, 'Duration:', duration);
        
        // Check if recording is at least 1 second long
        if (recordingDuration >= 1) {
          onSendAudio?.(audioUri, duration);
          onClose();
        } else {
          Alert.alert('Recording Too Short', 'Please record for at least 1 second.');
        }
      } else {
        Alert.alert('Recording Error', 'No audio was recorded or recording was too short.');
      }
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      stopRecordingTimer();
      setRecordingDuration(0);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const handleVoicePress = () => {
    if (isRecording) {
      handleStopVoiceRecording();
    } else {
      handleStartVoiceRecording();
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      stopRecordingTimer();
    };
  }, []);


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

        {/* Voice Call Option */}
        <TouchableOpacity 
          style={styles.actionItem}
        >
          <View style={styles.actionIcon}>
            <MaterialIcons name="call" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Voice Call
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

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionIcon}>
            <MaterialIcons name="videocam" size={24} color={Colors.primary} />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            Video Call
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleVoicePress} 
          style={styles.actionItem}
        >
          <View style={[
            styles.actionIcon, 
            isRecording && styles.recordingIcon
          ]}>
            <MaterialIcons 
              name={isRecording ? "stop" : "mic"} 
              size={24} 
              color={isRecording ? Colors.white : Colors.primary} 
            />
          </View>
          <Typography variant="caption" style={styles.actionText}>
            {isRecording ? `${recordingDuration}s/120s` : 'Voice Note'}
          </Typography>
        </TouchableOpacity>

        {/* Empty slot for now */}
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
  recordingIcon: {
    backgroundColor: Colors.error || '#FF4444', // Red color when recording
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