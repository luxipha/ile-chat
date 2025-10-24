import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, Dimensions, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Avatar } from '../ui/Avatar';
import webrtcService from '../../services/webrtcService';

interface VideoCallScreenProps {
  contactName: string;
  contactAvatar?: string;
  isVideo: boolean;
  onEndCall: () => void;
}

const { width, height } = Dimensions.get('window');

export const VideoCallScreen: React.FC<VideoCallScreenProps> = ({
  contactName,
  contactAvatar,
  isVideo,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!isVideo);
  const [isSpeaker, setIsSpeaker] = useState(isVideo);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);

  useEffect(() => {
    // Dismiss keyboard when call screen opens
    Keyboard.dismiss();
    
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Set up stream listeners
    webrtcService.setOnRemoteStream((stream) => {
      setRemoteStream(stream);
    });

    // Get local stream
    const localStreamData = webrtcService.getLocalStream();
    if (localStreamData) {
      setLocalStream(localStreamData);
    }

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    webrtcService.endCall();
    onEndCall();
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      
      {/* Video Area */}
      <View style={styles.videoContainer}>
        {isVideo && !isVideoOff && remoteStream && !remoteStream.mock ? (
          <>
            {/* For development builds with real streams */}
            <View style={styles.remoteVideo}>
              <Typography variant="body1" style={styles.videoPlaceholder}>
                📹 Video stream active
              </Typography>
            </View>
            
            {/* Local Video (Picture-in-Picture) */}
            {localStream && !localStream.mock && (
              <View style={styles.localVideo}>
                <Typography variant="caption" style={styles.localVideoText}>
                  You
                </Typography>
              </View>
            )}
          </>
        ) : isVideo && !isVideoOff ? (
          <>
            {/* Mock video view for Expo Go */}
            <View style={styles.remoteVideo}>
              <View style={styles.mockVideoContainer}>
                <MaterialIcons name="videocam" size={64} color="#666" />
                <Typography variant="h3" style={styles.mockVideoText}>
                  {contactName}
                </Typography>
                <Typography variant="body2" style={styles.mockVideoSubtext}>
                  Video call active
                </Typography>
                <Typography variant="caption" style={styles.mockVideoNote}>
                  Real video requires development build
                </Typography>
              </View>
            </View>
            
            {/* Mock Local Video */}
            <View style={styles.localVideo}>
              <View style={styles.mockLocalVideo}>
                <MaterialIcons name="account-circle" size={32} color="#fff" />
                <Typography variant="caption" style={styles.localVideoText}>
                  You
                </Typography>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.audioView}>
            <Avatar
              src={contactAvatar}
              name={contactName}
              size={120}
              style={styles.avatar}
            />
            <Typography variant="h2" style={styles.contactName}>
              {contactName}
            </Typography>
            <Typography variant="body1" style={styles.callStatus}>
              {formatDuration(callDuration)}
            </Typography>
          </View>
        )}
      </View>

      {/* Call Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isSpeaker && styles.activeButton]}
          onPress={() => setIsSpeaker(!isSpeaker)}
        >
          <MaterialIcons 
            name={isSpeaker ? "volume-up" : "hearing"} 
            size={24} 
            color={isSpeaker ? "#000" : "#fff"} 
          />
        </TouchableOpacity>

        {isVideo && (
          <TouchableOpacity
            style={[styles.controlButton, isVideoOff && styles.activeButton]}
            onPress={() => setIsVideoOff(!isVideoOff)}
          >
            <MaterialIcons 
              name={isVideoOff ? "videocam-off" : "videocam"} 
              size={24} 
              color={isVideoOff ? "#000" : "#fff"} 
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.activeButton]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <MaterialIcons 
            name={isMuted ? "mic-off" : "mic"} 
            size={24} 
            color={isMuted ? "#000" : "#fff"} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.endButton} onPress={handleEndCall}>
          <MaterialIcons name="call-end" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 9999,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideo: {
    width: width,
    height: height,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    color: '#666',
    fontSize: 16,
  },
  mockVideoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockVideoText: {
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  mockVideoSubtext: {
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  mockVideoNote: {
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  audioView: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  avatar: {
    marginBottom: 20,
  },
  contactName: {
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  callStatus: {
    color: '#ccc',
    textAlign: 'center',
  },
  localVideo: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 100,
    height: 140,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
  },
  localVideoView: {
    width: '100%',
    height: '100%',
  },
  mockLocalVideo: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#fff',
  },
  endButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
});