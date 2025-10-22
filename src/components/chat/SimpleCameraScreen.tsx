import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';

type CameraMode = 'picture' | 'video';
import { Typography } from '../ui/Typography';
import { Colors, Spacing } from '../../theme';
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { Asset } from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { CameraControls } from './CameraControls';
import { PhotoPreview } from './PhotoPreview';
import { VideoPreview } from './VideoPreview';

interface SimpleCameraScreenProps {
  visible: boolean;
  onClose: () => void;
  onPhotoTaken: (uri: string) => void;
  onVideoRecorded?: (uri: string) => void;
}

const SimpleCameraScreenComponent: React.FC<SimpleCameraScreenProps> = ({
  visible,
  onClose,
  onPhotoTaken,
  onVideoRecorded,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [cameraMode, setCameraMode] = useState<CameraMode>('picture');
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<boolean | null>(null);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedVideo, setCapturedVideo] = useState<string | null>(null);
  
  // Use the hook for camera permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      console.log('📷 SimpleCameraScreen becoming visible...');
      getPermissions();
      getRecentAssets();
    }
  }, [visible]);

  const getPermissions = async () => {
    try {
      if (!cameraPermission?.granted) {
        const result = await requestCameraPermission();
        console.log('📷 Camera permission result:', result);
      }
      
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(mediaLibraryPermission.status === 'granted');
    } catch (error) {
      console.error('📷 Error requesting permissions:', error);
    }
  };

  const getRecentAssets = async () => {
    try {
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        sortBy: 'creationTime',
        first: 4,
      });
      setRecentAssets(assets.assets);
    } catch (error) {
      console.error('Error getting recent assets:', error);
    }
  };

  // Convert photo URI to a format that can be uploaded
  const convertPhotoUri = async (uri: string): Promise<string> => {
    try {
      if (uri.startsWith('ph://')) {
        // For iOS Photos library URIs, we need to copy to a file URI
        const asset = await MediaLibrary.getAssetInfoAsync(uri.replace('ph://', '').split('/')[0]);
        if (asset.localUri) {
          return asset.localUri;
        }
      }
      return uri;
    } catch (error) {
      console.error('Error converting photo URI:', error);
      return uri;
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || !cameraPermission?.granted) return;
    
    try {
      console.log('📷 Taking photo...');
      animateButton();
      setIsLoading(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo?.uri) {
        console.log('📷 Photo captured, showing preview:', photo.uri);
        setCapturedPhoto(photo.uri);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('📷 Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      setIsLoading(false);
    }
  };

  const handleToggleRecording = async () => {
    if (!cameraRef.current || !cameraPermission?.granted) return;
    
    try {
      if (isRecording) {
        console.log('📹 Stopping video recording...');
        cameraRef.current.stopRecording();
        setIsRecording(false);
      } else {
        console.log('📹 Starting video recording...');
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          maxDuration: 60, // 60 seconds max
        });
        
        if (video?.uri) {
          console.log('📹 Video recorded, showing preview:', video.uri);
          setCapturedVideo(video.uri);
        }
        setIsRecording(false);
      }
    } catch (error) {
      console.error('📹 Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
      setIsRecording(false);
    }
  };

  const handleCameraAction = () => {
    if (cameraMode === 'picture') {
      handleTakePhoto();
    } else {
      handleToggleRecording();
    }
  };

  const handleSendPhoto = async (uri: string) => {
    try {
      console.log('📷 Sending photo:', uri);
      const convertedUri = await convertPhotoUri(uri);
      console.log('📷 Converted URI:', convertedUri);
      
      // Save to media library if permission granted and it's a new photo
      if (hasMediaLibraryPermission && !uri.startsWith('ph://')) {
        await MediaLibrary.saveToLibraryAsync(convertedUri);
      }
      
      onPhotoTaken(convertedUri);
      setCapturedPhoto(null);
      onClose();
    } catch (error) {
      console.error('📷 Error sending photo:', error);
      Alert.alert('Error', 'Failed to send photo');
    }
  };

  const handleSendVideo = async (uri: string) => {
    try {
      console.log('📹 Sending video:', uri);
      const convertedUri = await convertPhotoUri(uri);
      console.log('📹 Converted video URI:', convertedUri);
      
      // Save to media library if permission granted and it's a new video
      if (hasMediaLibraryPermission && !uri.startsWith('ph://')) {
        await MediaLibrary.saveToLibraryAsync(convertedUri);
      }
      
      onVideoRecorded?.(convertedUri);
      setCapturedVideo(null);
      onClose();
    } catch (error) {
      console.error('📹 Error sending video:', error);
      Alert.alert('Error', 'Failed to send video');
    }
  };

  const handleClosePreview = () => {
    setCapturedPhoto(null);
    setCapturedVideo(null);
  };

  const handleSelectExistingPhoto = async (asset: Asset) => {
    try {
      console.log('📷 Selected existing photo:', asset.uri);
      setCapturedPhoto(asset.uri);
    } catch (error) {
      console.error('Error selecting photo:', error);
    }
  };

  const handleToggleCamera = () => {
    setCameraType(prev => prev === 'front' ? 'back' : 'front');
  };
  
  const handleToggleFlash = () => {
    setFlashMode(prev => prev === 'off' ? 'on' : 'off');
  };

  const handleToggleTorch = () => {
    setTorch(prev => !prev);
  };

  const handleZoomIn = () => {
    if (zoom < 1) {
      setZoom(prev => Math.min(prev + 0.1, 1));
    }
  };

  const handleZoomOut = () => {
    if (zoom > 0) {
      setZoom(prev => Math.max(prev - 0.1, 0));
    }
  };

  if (!visible) return null;

  // Show photo preview if we have a captured photo
  if (capturedPhoto) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <PhotoPreview
          imageUri={capturedPhoto}
          onClose={handleClosePreview}
          onSend={handleSendPhoto}
        />
      </Modal>
    );
  }

  // Show video preview if we have a captured video
  if (capturedVideo) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <VideoPreview
          videoUri={capturedVideo}
          onClose={handleClosePreview}
          onSend={handleSendVideo}
        />
      </Modal>
    );
  }

  if (cameraPermission === null) {
    return null; // Still loading permissions
  }

  if (cameraPermission && !cameraPermission.granted) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <View style={styles.permissionContainer}>
          <Typography variant="h2" style={styles.permissionTitle}>
            Camera Permission Required
          </Typography>
          <Typography variant="body1" style={styles.permissionDescription}>
            Please grant camera permission to take photos and videos.
          </Typography>
          <TouchableOpacity onPress={getPermissions} style={styles.permissionButton}>
            <Typography variant="body1" style={styles.permissionButtonText}>
              Grant Permission
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.permissionCancel}>
            <Typography variant="body1" style={styles.permissionCancelText}>
              Cancel
            </Typography>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={cameraType}
          flash={flashMode}
          mode={cameraMode}
          zoom={zoom}
          enableTorch={torch}
          onCameraReady={() => console.log('📷 Camera ready')}
        >
          <View style={styles.safeArea}>
            <View style={styles.content}>
              
              {/* Top Controls */}
              <CameraControls
                flashMode={flashMode}
                torch={torch}
                zoom={zoom}
                onClose={onClose}
                onToggleFlash={handleToggleFlash}
                onToggleTorch={handleToggleTorch}
                onToggleCamera={handleToggleCamera}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
              />

              {/* Main Action Row */}
              <View style={styles.mainActionRow}>
                {/* Recent Photos */}
                <View style={styles.gallerySection}>
                  <FlatList
                    data={recentAssets}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleSelectExistingPhoto(item)}
                      >
                        <Image
                          source={item.uri}
                          style={styles.recentPhoto}
                        />
                      </TouchableOpacity>
                    )}
                    horizontal
                    contentContainerStyle={styles.recentPhotosContainer}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>

                {/* Capture Button */}
                <Animated.View style={[styles.captureButtonContainer, { transform: [{ scale: scaleAnim }] }]}>
                  <TouchableOpacity
                    style={[
                      styles.captureButton,
                      isRecording && styles.recordingButton,
                      isLoading && styles.loadingButton
                    ]}
                    onPress={handleCameraAction}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <View style={styles.loadingIndicator} />
                    ) : (
                      <View style={[
                        styles.captureInner,
                        cameraMode === 'video' && !isRecording && styles.videoModeInner,
                        isRecording && styles.recordingInner
                      ]} />
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Lens Effects - Horizontal ScrollView like reference */}
                <FlatList
                  data={[0, 1, 2, 3]}
                  renderItem={({ item }) => (
                    <TouchableOpacity key={item} style={styles.effectButton}>
                      <MaterialIcons name="face" size={20} color={Colors.white} />
                    </TouchableOpacity>
                  )}
                  horizontal
                  contentContainerStyle={styles.effectsContainer}
                  showsHorizontalScrollIndicator={false}
                />
              </View>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                <TouchableOpacity onPress={() => {/* Open gallery */}}>
                  <MaterialIcons name="photo-library" size={24} color={Colors.white} />
                </TouchableOpacity>
                
                <View style={styles.modeContainer}>
                  <TouchableOpacity 
                    onPress={() => setCameraMode('picture')}
                    style={styles.modeButton}
                  >
                    <Typography 
                      variant="body1" 
                      style={[
                        styles.modeText,
                        cameraMode === 'picture' && styles.activeModeText
                      ]}
                    >
                      SNAP
                    </Typography>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setCameraMode('video')}
                    style={styles.modeButton}
                  >
                    <Typography 
                      variant="body1" 
                      style={[
                        styles.modeText,
                        cameraMode === 'video' && styles.activeModeText
                      ]}
                    >
                      VIDEO
                    </Typography>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity onPress={() => {/* Search/Discover */}}>
                  <MaterialIcons name="search" size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  safeArea: {
    flex: 1,
    paddingTop: 50,
  },
  content: {
    flex: 1,
    padding: 6,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  permissionTitle: {
    color: Colors.white,
    textAlign: 'center',
  },
  permissionDescription: {
    color: Colors.gray300,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
  },
  permissionButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  permissionCancel: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  permissionCancelText: {
    color: Colors.white,
    opacity: 0.7,
  },
  mainActionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 120,
    paddingHorizontal: Spacing.xl,
  },
  gallerySection: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingRight: 20,
  },
  recentPhotosContainer: {
    gap: 6,
  },
  recentPhoto: {
    height: 40,
    width: 40,
    borderRadius: 5,
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  recordingButton: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  loadingButton: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  captureInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.white,
  },
  videoModeInner: {
    borderRadius: 8,
    width: 60,
    height: 60,
  },
  recordingInner: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  loadingIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: Colors.primary,
    borderTopColor: 'transparent',
  },
  effectsContainer: {
    gap: 8,
  },
  effectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  modeButton: {
    paddingVertical: Spacing.sm,
  },
  modeText: {
    color: Colors.white,
    fontWeight: '100',
    fontSize: 14,
  },
  activeModeText: {
    fontWeight: 'bold',
  },
});

export const SimpleCameraScreen = SimpleCameraScreenComponent;