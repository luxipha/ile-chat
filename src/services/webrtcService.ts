import io from 'socket.io-client';
import { Platform } from 'react-native';

class WebRTCService {
  private socket: any = null;
  private localStream: any = null;
  private remoteStream: any = null;
  private peerConnection: any = null;
  private onRemoteStream?: (stream: any) => void;
  private onCallEnd?: () => void;
  private currentRoomId?: string;
  private isExpoGo: boolean;

  constructor() {
    // Check if we're in Expo Go (which doesn't support native WebRTC)
    // Web browsers DO support WebRTC natively, so only mock in Expo Go mobile
    this.isExpoGo = Platform.OS !== 'web' && !global.nativeModules?.RTCPeerConnection;
  }

  connect(serverUrl: string) {
    if (this.socket?.connected) {
      return; // Already connected
    }
    
    this.socket = io(serverUrl);
    this.setupSocketListeners();
    
    this.socket.on('connect', () => {
      console.log('📞 Socket connected to server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('📞 Socket disconnected from server');
    });
  }

  private setupSocketListeners() {
    this.socket.on('call-offer', this.handleOffer.bind(this));
    this.socket.on('call-answer', this.handleAnswer.bind(this));
    this.socket.on('ice-candidate', this.handleIceCandidate.bind(this));
    this.socket.on('call-ended', () => this.onCallEnd?.());
    this.socket.on('user-joined', (data: any) => {
      console.log('👤 User joined room:', data.roomId, data.userId);
    });
    this.socket.on('user-left', (data: any) => {
      console.log('👤 User left room:', data.roomId, data.userId);
    });
  }

  private createPeerConnection() {
    if (this.isExpoGo) {
      console.log('📞 Using Expo Go - WebRTC features limited');
      // Create a mock peer connection for Expo Go mobile
      this.peerConnection = {
        addStream: () => console.log('📞 Mock: addStream'),
        createOffer: () => Promise.resolve({ type: 'offer', sdp: 'mock-offer' }),
        createAnswer: () => Promise.resolve({ type: 'answer', sdp: 'mock-answer' }),
        setLocalDescription: () => Promise.resolve(),
        setRemoteDescription: () => Promise.resolve(),
        addIceCandidate: () => Promise.resolve(),
        close: () => console.log('📞 Mock: close'),
      };
      return;
    }

    // For web browsers or development builds with WebRTC support
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };
      
      // Use native WebRTC APIs available in browsers and development builds
      const RTCPeerConnectionClass = Platform.OS === 'web' 
        ? window.RTCPeerConnection 
        : (global as any).RTCPeerConnection;
        
      this.peerConnection = new RTCPeerConnectionClass(configuration);
      
      this.peerConnection.onicecandidate = (event: any) => {
        if (event.candidate && this.socket && this.currentRoomId) {
          this.socket.emit('ice-candidate', {
            roomId: this.currentRoomId,
            candidate: event.candidate,
          });
        }
      };
      
      this.peerConnection.ontrack = (event: any) => {
        console.log('📞 Remote stream received:', event.streams[0]);
        this.remoteStream = event.streams[0];
        this.onRemoteStream?.(event.streams[0]);
      };
      
      console.log('📞 Real WebRTC peer connection created');
    } catch (error) {
      console.warn('📞 WebRTC not available, using mock implementation:', error);
      this.peerConnection = {
        addStream: () => console.log('📞 Mock: addStream'),
        createOffer: () => Promise.resolve({ type: 'offer', sdp: 'mock-offer' }),
        createAnswer: () => Promise.resolve({ type: 'answer', sdp: 'mock-answer' }),
        setLocalDescription: () => Promise.resolve(),
        setRemoteDescription: () => Promise.resolve(),
        addIceCandidate: () => Promise.resolve(),
        close: () => console.log('📞 Mock: close'),
      };
    }
  }

  async startCall(roomId: string, isVideo: boolean) {
    try {
      this.currentRoomId = roomId;
      console.log('📞 Starting call:', { roomId, isVideo });
      
      // Join the room first
      this.socket.emit('join-room', { roomId });
      
      if (this.isExpoGo) {
        // Mock implementation for Expo Go
        console.log('📞 Mock call started in Expo Go');
        this.localStream = { mock: true, isVideo };
        this.createPeerConnection();
        
        setTimeout(() => {
          console.log('✅ Mock call connected');
        }, 1000);
        return;
      }

      // Get user media for web browsers or development builds
      try {
        const constraints = {
          audio: true,
          video: isVideo,
        };
        
        const getUserMedia = Platform.OS === 'web' 
          ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
          : (navigator as any).mediaDevices.getUserMedia.bind((navigator as any).mediaDevices);
        
        this.localStream = await getUserMedia(constraints);
        this.createPeerConnection();
        
        if (this.peerConnection && this.localStream) {
          // Add tracks to peer connection (modern WebRTC API)
          this.localStream.getTracks().forEach((track: any) => {
            this.peerConnection.addTrack(track, this.localStream);
          });
          
          // Create offer
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          
          // Send offer to remote peer
          this.socket.emit('call-offer', {
            roomId,
            offer: offer,
          });
          
          console.log('✅ Real call offer sent with media stream');
        }
      } catch (mediaError) {
        console.error('📞 getUserMedia failed:', mediaError);
        this.localStream = { mock: true, isVideo };
        this.createPeerConnection();
      }
    } catch (error) {
      console.error('❌ Failed to start call:', error);
    }
  }

  async answerCall(roomId: string, isVideo: boolean) {
    try {
      this.currentRoomId = roomId;
      console.log('📞 Answering call:', roomId);
      
      if (this.isExpoGo) {
        // Mock implementation for Expo Go
        console.log('📞 Mock call answered in Expo Go');
        this.localStream = { mock: true, isVideo };
        this.createPeerConnection();
        return;
      }

      // Get user media for development builds
      try {
        const constraints = {
          audio: true,
          video: isVideo,
        };
        
        this.localStream = await (navigator as any).mediaDevices.getUserMedia(constraints);
        this.createPeerConnection();
        
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addStream(this.localStream);
        }
      } catch (mediaError) {
        console.warn('📞 getUserMedia not available, using mock stream');
        this.localStream = { mock: true, isVideo };
        this.createPeerConnection();
      }
    } catch (error) {
      console.error('❌ Failed to answer call:', error);
    }
  }

  endCall() {
    console.log('📞 Ending call');
    
    if (this.currentRoomId) {
      this.socket?.emit('end-call', { roomId: this.currentRoomId });
      this.socket?.emit('leave-room', { roomId: this.currentRoomId });
    }
    
    this.cleanup();
  }

  setOnRemoteStream(callback: (stream: any) => void) {
    this.onRemoteStream = callback;
  }

  setOnCallEnd(callback: () => void) {
    this.onCallEnd = callback;
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  private async handleOffer(data: { roomId: string; offer: any }) {
    try {
      console.log('📞 Received call offer for room:', data.roomId);
      
      if (!this.peerConnection) {
        this.createPeerConnection();
      }
      
      if (this.peerConnection) {
        if (this.isExpoGo) {
          // Mock handling for Expo Go
          console.log('📞 Mock: Processing offer in Expo Go');
        } else {
          await this.peerConnection.setRemoteDescription(new (global as any).RTCSessionDescription(data.offer));
        }
        
        // Create answer
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        // Send answer back
        this.socket.emit('call-answer', {
          roomId: data.roomId,
          answer: answer,
        });
        
        console.log('✅ Call answer sent');
      }
    } catch (error) {
      console.error('❌ Failed to handle offer:', error);
    }
  }

  private async handleAnswer(data: { roomId: string; answer: any }) {
    try {
      console.log('📞 Received call answer for room:', data.roomId);
      
      if (this.peerConnection) {
        if (this.isExpoGo) {
          // Mock handling for Expo Go
          console.log('📞 Mock: Processing answer in Expo Go');
        } else {
          await this.peerConnection.setRemoteDescription(new (global as any).RTCSessionDescription(data.answer));
        }
        console.log('✅ Call answer processed');
      }
    } catch (error) {
      console.error('❌ Failed to handle answer:', error);
    }
  }

  private async handleIceCandidate(data: { roomId: string; candidate: any }) {
    try {
      console.log('🧊 Received ICE candidate for room:', data.roomId);
      
      if (this.peerConnection) {
        if (this.isExpoGo) {
          // Mock handling for Expo Go
          console.log('🧊 Mock: Processing ICE candidate in Expo Go');
        } else {
          await this.peerConnection.addIceCandidate(new (global as any).RTCIceCandidate(data.candidate));
        }
        console.log('✅ ICE candidate added');
      }
    } catch (error) {
      console.error('❌ Failed to handle ICE candidate:', error);
    }
  }

  private cleanup() {
    if (this.localStream && !this.localStream.mock) {
      try {
        this.localStream.getTracks?.().forEach((track: any) => track.stop());
      } catch (error) {
        console.log('📞 Stream cleanup not available in this environment');
      }
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.remoteStream = null;
    this.currentRoomId = undefined;
  }
}

export default new WebRTCService();