import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Typography } from '../ui/Typography';
import { Colors, Spacing } from '../../theme';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

interface VideoPreviewProps {
  videoUri: string;
  onClose: () => void;
  onSend: (uri: string) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUri,
  onClose,
  onSend,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.muted = false;
    player.play();
  });

  const handleSave = async () => {
    try {
      await MediaLibrary.saveToLibraryAsync(videoUri);
      Alert.alert('✅ Video saved!');
    } catch (error) {
      console.error('Error saving video:', error);
      Alert.alert('Error', 'Failed to save video');
    }
  };

  const handleShare = async () => {
    try {
      await Sharing.shareAsync(videoUri);
    } catch (error) {
      console.error('Error sharing video:', error);
      Alert.alert('Error', 'Failed to share video');
    }
  };

  const handleSend = () => {
    console.log('📤 Sending video:', videoUri);
    onSend(videoUri);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={styles.container}>
      {/* Right side action buttons */}
      <View style={styles.rightActions}>
        <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
          <MaterialIcons name="download" size={24} color={Colors.white} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onClose} style={styles.actionButton}>
          <MaterialIcons name="edit" size={24} color={Colors.white} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
          <MaterialIcons name="share" size={24} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayPause} style={styles.actionButton}>
          <MaterialIcons 
            name={isPlaying ? 'pause' : 'play-arrow'} 
            size={24} 
            color={Colors.white} 
          />
        </TouchableOpacity>
      </View>

      {/* Left side close button */}
      <View style={styles.leftActions}>
        <TouchableOpacity onPress={onClose} style={styles.actionButton}>
          <MaterialIcons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Bottom send button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <MaterialIcons name="send" size={24} color={Colors.white} />
          <Typography variant="body1" style={styles.sendText}>
            Send
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Video */}
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        nativeControls={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  rightActions: {
    position: 'absolute',
    right: Spacing.lg,
    top: 100,
    zIndex: 1,
    gap: Spacing.lg,
  },
  leftActions: {
    position: 'absolute',
    left: Spacing.lg,
    top: 80,
    zIndex: 1,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sendText: {
    color: Colors.white,
    fontWeight: '600',
  },
});