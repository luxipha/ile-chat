import { Audio, AVPlaybackSource } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

interface AudioRecordingStatus {
  isRecording: boolean;
  duration: number;
  uri?: string;
}

interface AudioPlaybackStatus {
  isPlaying: boolean;
  isLoaded: boolean;
  duration: number;
  position: number;
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private isInitialized = false;
  private maxRecordingDuration = 120000; // 2 minutes in milliseconds
  private recordingTimer: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permissions not granted');
      }

      // Set audio mode for recording and playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
      throw error;
    }
  }

  async startRecording(): Promise<void> {
    try {
      await this.initialize();

      // Stop any existing recording
      if (this.recording) {
        await this.stopRecording();
      }

      // Create new recording
      const { recording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm;codecs=opus',
            bitsPerSecond: 128000,
          },
        },
        (status) => {
          // Recording status updates
          console.log('Recording status:', status);
        }
      );

      this.recording = recording;
      
      // Set timer to auto-stop recording after 2 minutes
      this.recordingTimer = setTimeout(async () => {
        console.log('⏰ Auto-stopping recording after 2 minutes');
        await this.stopRecording();
      }, this.maxRecordingDuration);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        console.log('No recording to stop');
        return null;
      }

      // Clear the auto-stop timer
      if (this.recordingTimer) {
        clearTimeout(this.recordingTimer);
        this.recordingTimer = null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      // Reset recording instance
      this.recording = null;

      console.log('Recording stopped, URI:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recording = null;
      if (this.recordingTimer) {
        clearTimeout(this.recordingTimer);
        this.recordingTimer = null;
      }
      throw error;
    }
  }

  async pauseRecording(): Promise<void> {
    try {
      if (!this.recording) {
        throw new Error('No recording in progress');
      }

      await this.recording.pauseAsync();
      console.log('Recording paused');
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }

  async resumeRecording(): Promise<void> {
    try {
      if (!this.recording) {
        throw new Error('No recording to resume');
      }

      await this.recording.startAsync();
      console.log('Recording resumed');
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }

  async getRecordingStatus(): Promise<AudioRecordingStatus | null> {
    try {
      if (!this.recording) {
        return null;
      }

      const status = await this.recording.getStatusAsync();
      return {
        isRecording: status.isRecording || false,
        duration: status.durationMillis || 0,
        uri: this.recording.getURI() || undefined,
      };
    } catch (error) {
      console.error('Failed to get recording status:', error);
      return null;
    }
  }

  async playAudio(uri: string): Promise<Audio.Sound> {
    try {
      await this.initialize();

      // Stop any currently playing sound
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Create new sound instance
      const { sound } = await Audio.Sound.createAsync(
        { uri } as AVPlaybackSource,
        {
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        },
        (status) => {
          // Playback status updates
          console.log('Playback status:', status);
        }
      );

      this.sound = sound;
      return sound;
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  async stopPlayback(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
        console.log('Playback stopped');
      }
    } catch (error) {
      console.error('Failed to stop playback:', error);
      throw error;
    }
  }

  async pausePlayback(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
        console.log('Playback paused');
      }
    } catch (error) {
      console.error('Failed to pause playback:', error);
      throw error;
    }
  }

  async resumePlayback(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.playAsync();
        console.log('Playback resumed');
      }
    } catch (error) {
      console.error('Failed to resume playback:', error);
      throw error;
    }
  }

  async getPlaybackStatus(): Promise<AudioPlaybackStatus | null> {
    try {
      if (!this.sound) {
        return null;
      }

      const status = await this.sound.getStatusAsync();
      if (!status.isLoaded) {
        return {
          isPlaying: false,
          isLoaded: false,
          duration: 0,
          position: 0,
        };
      }

      return {
        isPlaying: status.isPlaying || false,
        isLoaded: true,
        duration: status.durationMillis || 0,
        position: status.positionMillis || 0,
      };
    } catch (error) {
      console.error('Failed to get playback status:', error);
      return null;
    }
  }

  async setPlaybackPosition(positionMillis: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setPositionAsync(positionMillis);
      }
    } catch (error) {
      console.error('Failed to set playback position:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setVolumeAsync(volume);
      }
    } catch (error) {
      console.error('Failed to set volume:', error);
      throw error;
    }
  }

  async getAudioDuration(uri: string): Promise<number> {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri } as AVPlaybackSource);
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      
      if (status.isLoaded) {
        return status.durationMillis || 0;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get audio duration:', error);
      return 0;
    }
  }

  async deleteAudioFile(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
        console.log('Audio file deleted:', uri);
      }
    } catch (error) {
      console.error('Failed to delete audio file:', error);
    }
  }

  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    try {
      if (this.recordingTimer) {
        clearTimeout(this.recordingTimer);
        this.recordingTimer = null;
      }

      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }

      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      console.log('Audio service cleaned up');
    } catch (error) {
      console.error('Error during audio service cleanup:', error);
    }
  }
}

// Export singleton instance
export const audioService = new AudioService();
export type { AudioRecordingStatus, AudioPlaybackStatus };