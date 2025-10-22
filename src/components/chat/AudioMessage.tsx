import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { audioService } from '../../services/audioService';

interface AudioMessageProps {
  audioUrl: string;
  audioDuration: number;
  isCurrentUser: boolean;
  timestamp?: Date;
}

export const AudioMessage: React.FC<AudioMessageProps> = ({
  audioUrl,
  audioDuration,
  isCurrentUser,
  timestamp,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(audioDuration);
  const [isLoading, setIsLoading] = useState(false);
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    if (positionUpdateInterval.current) {
      clearInterval(positionUpdateInterval.current);
      positionUpdateInterval.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.error('Error unloading sound:', error);
      }
      soundRef.current = null;
    }
    setIsPlaying(false);
    setIsLoaded(false);
    setCurrentPosition(0);
  };

  const startPositionUpdates = () => {
    if (positionUpdateInterval.current) {
      clearInterval(positionUpdateInterval.current);
    }

    positionUpdateInterval.current = setInterval(async () => {
      try {
        if (soundRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            setCurrentPosition(status.positionMillis || 0);
            setDuration(status.durationMillis || audioDuration);

            // Auto-stop when playback ends
            if (status.positionMillis >= (status.durationMillis || audioDuration)) {
              handleStop();
            }
          }
        }
      } catch (error) {
        console.error('Error updating position:', error);
        handleStop();
      }
    }, 100);
  };

  const stopPositionUpdates = () => {
    if (positionUpdateInterval.current) {
      clearInterval(positionUpdateInterval.current);
      positionUpdateInterval.current = null;
    }
  };

  const handlePlay = async () => {
    try {
      setIsLoading(true);

      if (!isLoaded) {
        console.log('🎵 Loading audio:', audioUrl);
        const sound = await audioService.playAudio(audioUrl);
        soundRef.current = sound;
        setIsLoaded(true);
        setIsPlaying(true);
        startPositionUpdates();
      } else if (soundRef.current) {
        console.log('▶️ Resuming audio playback');
        await soundRef.current.playAsync();
        setIsPlaying(true);
        startPositionUpdates();
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      Alert.alert('Error', 'Failed to play voice message');
      setIsPlaying(false);
      setIsLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        stopPositionUpdates();
      }
    } catch (error) {
      console.error('Failed to pause audio:', error);
    }
  };

  const handleStop = async () => {
    try {
      stopPositionUpdates();
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.setPositionAsync(0);
      }
      setIsPlaying(false);
      setCurrentPosition(0);
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  };

  const handleSeek = async (position: number) => {
    try {
      if (soundRef.current && isLoaded) {
        await soundRef.current.setPositionAsync(position);
        setCurrentPosition(position);
      }
    } catch (error) {
      console.error('Failed to seek audio:', error);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (duration === 0) return 0;
    return Math.min(currentPosition / duration, 1);
  };

  const handleProgressPress = (event: any) => {
    if (!isLoaded || duration === 0) return;

    const { locationX } = event.nativeEvent;
    const progressBarWidth = 150; // Approximate width of progress bar
    const progress = Math.max(0, Math.min(1, locationX / progressBarWidth));
    const newPosition = progress * duration;
    
    handleSeek(newPosition);
  };

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
      {/* Play/Pause Button */}
      <TouchableOpacity
        style={[
          styles.playButton,
          isCurrentUser ? styles.currentUserButton : styles.otherUserButton
        ]}
        onPress={isPlaying ? handlePause : handlePlay}
        disabled={isLoading}
      >
        <MaterialIcons
          name={isLoading ? 'hourglass-empty' : isPlaying ? 'pause' : 'play-arrow'}
          size={24}
          color={isCurrentUser ? Colors.white : Colors.primary}
        />
      </TouchableOpacity>

      {/* Audio Progress and Info */}
      <View style={styles.audioInfo}>
        {/* Progress Bar */}
        <TouchableOpacity
          style={styles.progressContainer}
          onPress={handleProgressPress}
          activeOpacity={0.7}
        >
          <View style={[
            styles.progressBar,
            isCurrentUser ? styles.currentUserProgressBar : styles.otherUserProgressBar
          ]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${getProgress() * 100}%`,
                  backgroundColor: isCurrentUser ? Colors.white : Colors.primary,
                }
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Time Display */}
        <View style={styles.timeContainer}>
          <Typography
            variant="caption"
            style={[
              styles.timeText,
              { color: isCurrentUser ? Colors.white : Colors.gray600 }
            ]}
          >
            {isPlaying || currentPosition > 0
              ? `${formatTime(currentPosition)} / ${formatTime(duration)}`
              : formatTime(duration)
            }
          </Typography>
        </View>
      </View>

      {/* Timestamp (if provided) */}
      {timestamp && (
        <Typography
          variant="caption"
          style={[
            styles.timestamp,
            { color: isCurrentUser ? Colors.white : Colors.gray500 }
          ]}
        >
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.xs,
    maxWidth: 280,
    minWidth: 200,
  },
  currentUserContainer: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  otherUserContainer: {
    backgroundColor: Colors.gray100,
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  otherUserButton: {
    backgroundColor: Colors.white,
  },
  audioInfo: {
    flex: 1,
    minWidth: 0,
  },
  progressContainer: {
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  currentUserProgressBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  otherUserProgressBar: {
    backgroundColor: Colors.gray300,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 2,
  },
  timeContainer: {
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 11,
    opacity: 0.8,
  },
  timestamp: {
    fontSize: 10,
    marginLeft: Spacing.sm,
    alignSelf: 'flex-end',
    opacity: 0.7,
  },
});