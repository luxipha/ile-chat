import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';

interface ImageMessageProps {
  imageUrl: string;
  isOwn: boolean;
  onPress?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ImageMessage: React.FC<ImageMessageProps> = ({
  imageUrl,
  isOwn,
  onPress,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const handleImagePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowFullScreen(true);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      <TouchableOpacity 
        onPress={handleImagePress}
        style={styles.imageContainer}
        activeOpacity={0.8}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={ChatTheme.borderActive} />
          </View>
        )}
        
        {hasError ? (
          <View style={styles.errorContainer}>
            <MaterialIcons 
              name="broken-image" 
              size={40} 
              color={ChatTheme.textSecondary} 
            />
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            onLoad={handleImageLoad}
            onError={handleImageError}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

      {/* Full-screen modal */}
      <Modal
        visible={showFullScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullScreen(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground}
            onPress={() => setShowFullScreen(false)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFullScreen(false)}
              >
                <MaterialIcons name="close" size={30} color="white" />
              </TouchableOpacity>
              
              <Image
                source={{ uri: imageUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: ChatTheme.background1,
    marginBottom: ChatSpacing.xs,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ChatTheme.background2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ChatTheme.background2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
});