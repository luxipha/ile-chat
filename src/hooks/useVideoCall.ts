import { useState } from 'react';
import webrtcService from '../services/webrtcService';

export const useVideoCall = () => {
  const [isInCall, setIsInCall] = useState(false);
  const [callData, setCallData] = useState<{
    contactName: string;
    contactAvatar?: string;
    isVideo: boolean;
  } | null>(null);

  const startCall = async (contactName: string, contactAvatar: string | undefined, isVideo: boolean) => {
    try {
      const roomId = `call_${Date.now()}`;
      
      setCallData({ contactName, contactAvatar, isVideo });
      setIsInCall(true);
      
      // Connect to WebRTC service
      const serverUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
      webrtcService.connect(serverUrl);
      
      await webrtcService.startCall(roomId, isVideo);
      
      console.log(`📞 ${isVideo ? 'Video' : 'Voice'} call started with ${contactName}`);
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsInCall(false);
      setCallData(null);
    }
  };

  const endCall = () => {
    webrtcService.endCall();
    setIsInCall(false);
    setCallData(null);
    console.log('📞 Call ended');
  };

  return {
    isInCall,
    callData,
    startCall,
    endCall,
  };
};