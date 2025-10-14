import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PaymentMessageBubble } from '../chat/PaymentMessageBubble';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { FXTheme } from '../../theme/fxTheme';
import { FXTrade, TradeMessage } from '../../types/fx';
import authService from '../../services/authService';
import chatService, { createTradeRoomId } from '../../services/chatService';
import fxService from '../../services/fxService';

interface TradeRoomProps {
  trade: FXTrade;
  onBack: () => void;
  onUploadPaymentProof: (file: any) => void;
  onConfirmPayment: () => void;
  onSignRelease: () => void;
  onOpenDispute: (reason: string) => void;
  onCompleteRating: (rating: number, review: string) => void;
}

export const TradeRoom: React.FC<TradeRoomProps> = ({
  trade,
  onBack,
  onUploadPaymentProof,
  onConfirmPayment,
  onSignRelease,
  onOpenDispute,
  onCompleteRating,
}) => {
  // REMOVED excessive initialization logging that was causing performance issues
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCurrentUserMerchant, setIsCurrentUserMerchant] = useState(false);
  const [chatExpiresAt, setChatExpiresAt] = useState<Date | undefined>(undefined);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // OPTIMIZED participant resolution
  const merchant = trade.merchant || trade.maker;
  const buyer = trade.buyer || trade.taker;
  
  // Only log once when component first mounts or participant data changes
  useEffect(() => {
    if (merchant?.id && buyer?.id) {
      console.log('✅ [TradeRoom] PARTICIPANTS RESOLVED:', {
        tradeId: trade.id,
        merchantId: merchant.id,
        merchantName: merchant.name,
        buyerId: buyer.id,
        buyerName: buyer.name
      });
    }
  }, [merchant?.id, buyer?.id, trade.id]);
  
  const isUserMerchant = currentUser?.id === merchant?.id;
  const isUserBuyer = currentUser?.id === buyer?.id;
  const otherParty = isUserMerchant ? buyer : merchant;

  // User role detection
  useEffect(() => {
    const detectUserRole = async () => {
      try {
        const user = await authService.getCachedUser();
        console.log('👤 [TradeRoom] Current user:', user ? Object.keys(user) : 'null');
        console.log('👤 [TradeRoom] User role:', user?.role);
        console.log('👤 [TradeRoom] User ID:', user?.id);
        console.log('🎯 [TradeRoom] COMPREHENSIVE Trade context:', {
          tradeId: trade.id,
          merchantId: merchant?.id,
          buyerId: buyer?.id,
          currentUserId: user?.id,
          isUserMerchant: user?.id === merchant?.id,
          isUserBuyer: user?.id === buyer?.id,
          tradeStatus: trade.status,
          
          // Deep participant analysis
          participantAnalysis: {
            merchant: {
              exists: !!merchant,
              id: merchant?.id,
              name: merchant?.name,
              keys: merchant ? Object.keys(merchant) : []
            },
            buyer: {
              exists: !!buyer,
              id: buyer?.id,
              name: buyer?.name,
              keys: buyer ? Object.keys(buyer) : []
            }
          },
          
          // Trade structure analysis
          tradeAnalysis: {
            totalKeys: Object.keys(trade).length,
            hasDirectMerchant: !!trade.merchant,
            hasDirectBuyer: !!trade.buyer,
            hasMaker: !!trade.maker,
            hasTaker: !!trade.taker,
            sellAmount: trade.sellAmount,
            buyAmount: trade.buyAmount
          }
        });
        
        setCurrentUser(user);
        
        // Use trade-specific role detection instead of profile roles
        const isMerchant = user?.id === merchant?.id;
        setIsCurrentUserMerchant(isMerchant);
        console.log('🏪 [TradeRoom] Is current user merchant?', isMerchant);
        
      } catch (error) {
        console.error('❌ [TradeRoom] Error detecting user role:', error);
      }
    };

    detectUserRole();
  }, [trade.id, merchant?.id, buyer?.id]);
  
  // CRITICAL: User role detection results - needed for message debugging
  useEffect(() => {
    if (currentUser?.id) {
      console.log('👤 [TradeRoom] USER ROLE ANALYSIS:', {
        tradeId: trade.id,
        currentUserId: currentUser.id,
        currentUserName: currentUser.name,
        currentUserRole: currentUser.role,
        merchantId: merchant?.id,
        merchantName: merchant?.name,
        buyerId: buyer?.id,
        buyerName: buyer?.name,
        isCurrentUserMerchant,
        isUserMerchant: currentUser.id === merchant?.id,
        isUserBuyer: currentUser.id === buyer?.id,
        canSendMessage: !!(currentUser.id && merchant?.id && buyer?.id)
      });
    }
  }, [currentUser?.id, merchant?.id, buyer?.id, isCurrentUserMerchant]);

  useEffect(() => {
    // Payment window timer - OPTIMIZED to prevent re-renders
    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = trade.paymentWindow.end.getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 30000); // Update every 30 seconds instead of 1 second

    // Firebase chat subscriptions
    const setupChat = async () => {
      const conversationId = trade.chatRoomId || createTradeRoomId(trade.id);
      
      // ENHANCED participant validation with comprehensive debugging
      const merchantId = merchant?.id;
      const buyerId = buyer?.id;
      
      console.log('📝 [TradeRoom] STEP 1 - Initial participant check:', {
        merchantExists: !!merchant,
        buyerExists: !!buyer,
        merchantId,
        buyerId,
        merchantObject: merchant,
        buyerObject: buyer
      });
      
      if (!merchantId || !buyerId) {
        console.error('❌ [TradeRoom] STEP 2 - Invalid participant IDs DETAILED:', { 
          merchantId, 
          buyerId, 
          tradeId: trade.id,
          hasMerchant: !!trade.merchant,
          hasMaker: !!trade.maker,
          hasBuyer: !!trade.buyer,
          hasTaker: !!trade.taker,
          
          // Detailed merchant analysis
          merchantDetails: {
            exists: !!merchant,
            keys: merchant ? Object.keys(merchant) : [],
            idField: merchant?.id,
            name: merchant?.name
          },
          
          // Detailed buyer analysis  
          buyerDetails: {
            exists: !!buyer,
            keys: buyer ? Object.keys(buyer) : [],
            idField: buyer?.id,
            name: buyer?.name
          },
          
          // Trade object analysis
          tradeDetails: {
            keys: Object.keys(trade),
            merchantKeys: trade.merchant ? Object.keys(trade.merchant) : [],
            buyerKeys: trade.buyer ? Object.keys(trade.buyer) : [],
            makerKeys: trade.maker ? Object.keys(trade.maker) : [],
            takerKeys: trade.taker ? Object.keys(trade.taker) : []
          }
        });
        return;
      }
      
      console.log('✅ [TradeRoom] STEP 3 - Valid participant IDs confirmed:', {
        merchantId,
        buyerId,
        tradeId: trade.id
      });
      
      await chatService.ensureConversation(conversationId, [merchantId, buyerId], false);

      const metaUnsub = chatService.subscribeToConversationMeta(conversationId, (meta) => {
        setChatExpiresAt(meta.expiresAt);
      });

      const msgUnsub = chatService.getMessages(conversationId, (chatMsgs) => {
        const mapped: TradeMessage[] = chatMsgs.map(m => {
          const paymentProof = m.paymentData ? {
            amount: m.paymentData.amount,
            currency: m.paymentData.currency,
            // ensure required string type
            method: m.paymentData.method || 'unknown',
            // include optional fields only when defined
            ...(m.paymentData.transactionId ? { transactionId: m.paymentData.transactionId } : {}),
            ...(m.paymentData.receipt ? { receipt: m.paymentData.receipt } : {}),
          } : undefined;

          return {
            id: m._id,
            tradeId: trade.id,
            type: m.type === 'payment' ? 'payment_proof' : (m.type === 'dispute' ? 'dispute' : 'user'),
            senderId: m.user?._id,
            content: m.text || '',
            timestamp: m.createdAt,
            paymentProof,
            disputeData: m.disputeData ? { reason: m.disputeData.reason } : undefined,
          };
        });
        setMessages(mapped);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      return () => {
        metaUnsub();
        msgUnsub();
      };
    };

    let cleanup: (() => void) | undefined;
    setupChat().then((fn) => { cleanup = fn; }).catch((e) => console.error('Chat setup error', e));

    return () => {
      clearInterval(timer);
      if (cleanup) cleanup();
    };
  }, [trade.id, trade.chatRoomId, merchant?.id, buyer?.id]);

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const sendMessage = async () => {
    console.log('💬 [TradeRoom] SEND MESSAGE ATTEMPT - User:', {
      currentUserId: currentUser?.id,
      currentUserName: currentUser?.name,
      isUserMerchant,
      isUserBuyer,
      messageText: messageText.trim(),
      messageLength: messageText.length,
      hasCurrentUser: !!currentUser?.id,
      merchantId: merchant?.id,
      buyerId: buyer?.id
    });
    
    if (!messageText.trim() || !currentUser?.id) {
      console.log('❌ [TradeRoom] SEND MESSAGE FAILED - Missing text or user');
      return;
    }
    const isExpired = chatExpiresAt && new Date() >= chatExpiresAt;
    if (isExpired) {
      Alert.alert('Chat expired', 'This trade chat has expired.');
      return;
    }

    const conversationId = trade.chatRoomId || createTradeRoomId(trade.id);
    
    // ENHANCED message sending validation
    const merchantId = merchant?.id;
    const buyerId = buyer?.id;
    
    console.log('📝 [TradeRoom] STEP 1 - Message send validation:', {
      merchantId,
      buyerId,
      merchantExists: !!merchant,
      buyerExists: !!buyer,
      currentUserId: currentUser?.id,
      tradeId: trade.id
    });
    
    if (!merchantId || !buyerId) {
      console.error('❌ [TradeRoom] STEP 2 - Cannot send message - invalid participant IDs DETAILED:', {
        merchantId,
        buyerId,
        merchantObject: merchant,
        buyerObject: buyer,
        tradeKeys: Object.keys(trade),
        currentUser: currentUser
      });
      Alert.alert('Error', 'Cannot send message at this time');
      return;
    }
    
    console.log('✅ [TradeRoom] STEP 3 - Message validation passed');
    
    await chatService.ensureConversation(conversationId, [merchantId, buyerId], false);
    console.log('📤 [TradeRoom] SEND MESSAGE - Step 4: About to send message with params:', {
      conversationId,
      messageText: messageText.trim(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      recipientId: isUserMerchant ? buyerId : merchantId,
      isUserMerchant,
      step: 'MESSAGE_SEND_EXECUTE'
    });
    
    try {
      await chatService.sendMessage(
        conversationId,
        messageText.trim(),
        { _id: currentUser.id, name: currentUser.name || 'You', avatar: currentUser.avatar },
        isUserMerchant ? buyerId : merchantId,
        'text'
      );
      
      console.log('✅ [TradeRoom] SEND MESSAGE - Step 5: Message sent successfully');
      setMessageText('');
      setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    } catch (sendError) {
      console.error('❌ [TradeRoom] SEND MESSAGE - Step 5: FAILED to send message:', {
        error: sendError,
        errorMessage: sendError instanceof Error ? sendError.message : 'Unknown error',
        conversationId,
        currentUserId: currentUser.id,
        isUserMerchant
      });
      
      Alert.alert(
        'Message Failed',
        `Failed to send message: ${sendError instanceof Error ? sendError.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleUploadPaymentProof = () => {
    // Contextual dialog based on user role
    const title = isUserMerchant ? 'Upload Merchant Payment Proof' : 'Upload Buyer Payment Proof';
    const message = isUserMerchant 
      ? 'Upload proof that you sent the currency to the buyer'
      : 'Upload proof that you sent the currency to the merchant';
    
    Alert.alert(
      title,
      message,
      [
        { text: 'Take Photo', onPress: () => uploadProof('camera') },
        { text: 'Choose from Gallery', onPress: () => uploadProof('gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const uploadProof = async (type: 'camera' | 'gallery') => {
    try {
      console.log('🔧 [TradeRoom] Starting upload proof:', { type, tradeId: trade.id });
      // Request permissions
      if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Photo library permission is required to select images');
          return;
        }
      }

      // Launch image picker or camera
      const result = type === 'camera' 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const imageFile = {
        uri: asset.uri,
        type: 'image/jpeg',
        name: `payment_proof_${trade.id}_${Date.now()}.jpg`,
        size: asset.fileSize,
      };

      // Upload the image file using the FX service
      console.log('🔧 [TradeRoom] Uploading file:', imageFile);
      const uploadResult = await fxService.uploadPaymentProof(trade.id, imageFile);
      console.log('🔧 [TradeRoom] Upload result:', uploadResult);
      
      if (uploadResult.success && uploadResult.fileUrl) {
        const proofData = {
          transactionId: 'TXN_' + Math.random().toString(36).substring(2, 11),
          receipt: uploadResult.fileUrl,
          amount: trade.sellAmount,
          currency: trade.sellCurrency.code,
          method: trade.paymentMethod?.name || 'Unknown',
        };

        // Determine message content based on user role
        let messageContent = '';
        if (isUserMerchant) {
          messageContent = `Merchant payment proof uploaded: ${trade.buyCurrency.symbol}${trade.buyAmount}`;
        } else {
          messageContent = `Buyer payment proof uploaded: ${trade.sellCurrency.symbol}${trade.sellAmount}`;
        }

        // Send message to chat room
        try {
          const conversationId = trade.chatRoomId || createTradeRoomId(trade.id);
          const merchantId = merchant?.id;
          const buyerId = buyer?.id;
          
          console.log('🔧 [TradeRoom] Sending chat message:', {
            conversationId,
            merchantId,
            buyerId,
            currentUserId: currentUser?.id,
            messageContent,
            proofData
          });
          
          if (merchantId && buyerId && currentUser?.id) {
            await chatService.ensureConversation(conversationId, [merchantId, buyerId], false);
            await chatService.sendMessage(
              conversationId,
              messageContent,
              { _id: currentUser.id, name: currentUser.name || 'You', avatar: currentUser.avatar },
              isUserMerchant ? buyerId : merchantId,
              'payment',
              { paymentData: proofData }
            );
            console.log('🔧 [TradeRoom] Chat message sent successfully');
          } else {
            console.warn('🔧 [TradeRoom] Skipping chat message - missing IDs:', {
              merchantId,
              buyerId,
              currentUserId: currentUser?.id
            });
          }
        } catch (chatError: any) {
          console.error('🔧 [TradeRoom] Chat message error:', {
            error: chatError,
            message: chatError?.message,
            stack: chatError?.stack
          });
          // Don't fail the entire upload if chat fails
        }

        try {
          onUploadPaymentProof(proofData);
          console.log('🔧 [TradeRoom] Successfully called onUploadPaymentProof');
        } catch (callbackError) {
          console.error('🔧 [TradeRoom] Error in onUploadPaymentProof callback:', callbackError);
        }

        // Image uploaded successfully and showing in chat
        
        // Success message
        const successMessage = isUserMerchant 
          ? 'Merchant payment proof uploaded successfully!' 
          : 'Buyer payment proof uploaded successfully!';
        
        Alert.alert('Success', successMessage);
      } else {
        console.error('🔧 [TradeRoom] Upload failed:', uploadResult);
        Alert.alert('Upload failed', uploadResult.error || 'Failed to upload payment proof');
      }
    } catch (error: any) {
      console.error('🔧 [TradeRoom] Upload proof error details:', {
        error,
        message: error?.message,
        stack: error?.stack,
        tradeId: trade.id,
        type
      });
      Alert.alert('Error', `Failed to upload payment proof: ${error?.message || 'Unknown error'}. Please try again.`);
    }
  };

  const handleConfirmPayment = () => {
    const otherPartyName = isUserMerchant ? buyer?.name : merchant?.name;
    const currencyAmount = isUserMerchant 
      ? `${trade.buyCurrency.symbol}${trade.buyAmount}`
      : `${trade.sellCurrency.symbol}${trade.sellAmount}`;
    
    Alert.alert(
      'Confirm Payment Received',
      `Have you received ${currencyAmount} from ${otherPartyName}? This action cannot be undone.`,
      [
        { text: 'No, Not Yet', style: 'cancel' },
        { text: 'Yes, Received', onPress: () => {
          onConfirmPayment();
          
          // Different system messages based on trade completion status
          let systemContent = '';
          let systemEventType: any = 'payment_confirmed';
          
          // Check if both parties have confirmed (this would be the final confirmation)
          const bothPartyStatus = trade.status === 'both_payments_sent' || 
                                 (trade.status === 'payment_confirmed' && hasOtherPartyPaymentProof() && hasCurrentUserPaymentProof());
          
          if (bothPartyStatus) {
            systemContent = 'Both parties confirmed payment received! Trade completed successfully.';
            systemEventType = 'trade_completed';
          } else {
            systemContent = `${isUserMerchant ? 'Merchant' : 'Buyer'} confirmed payment received. Waiting for final confirmation.`;
            systemEventType = 'payment_confirmed';
          }
          
          const systemMessage: TradeMessage = {
            id: Date.now().toString(),
            tradeId: trade.id,
            type: 'system',
            content: systemContent,
            timestamp: new Date(),
            systemEventType,
          };
          setMessages(prev => [...prev, systemMessage]);
        }},
      ]
    );
  };

  const handleOpenDispute = async () => {
    if (!disputeReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the dispute');
      return;
    }

    onOpenDispute(disputeReason);
    const conversationId = trade.chatRoomId || createTradeRoomId(trade.id);
    const merchantId = merchant?.id;
    const buyerId = buyer?.id;
    
    if (merchantId && buyerId) {
      await chatService.ensureConversation(conversationId, [merchantId, buyerId], false);
      await chatService.sendMessage(
        conversationId,
        'Dispute opened',
        { _id: currentUser?.id, name: currentUser?.name || 'You', avatar: currentUser?.avatar },
        isUserMerchant ? buyerId : merchantId,
        'dispute',
        { disputeData: { reason: disputeReason, openedBy: currentUser?.id, status: 'open' } }
      );
    }
    setShowDispute(false);
    setDisputeReason('');
  };

  const renderTradeHeader = () => (
    <View style={FXTheme.headers.withBorder}>
      <TouchableOpacity onPress={onBack} style={FXTheme.buttons.icon}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      
      <View style={FXTheme.layouts.column}>
        <Typography variant="h6" style={FXTheme.text.bold}>
          Trade with {otherParty.name}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          ID: {trade.id.substring(0, 8)}...
        </Typography>
      </View>

      <View style={FXTheme.layouts.row}>
        <View style={[{ 
          width: 8,
          height: 8,
          borderRadius: 4,
          marginRight: Spacing.sm,
          backgroundColor: getStatusColor(trade.status) 
        }]} />
        <Typography variant="caption" style={FXTheme.text.bold}>
          {getStatusLabel(trade.status)}
        </Typography>
      </View>
    </View>
  );

  const renderTradeProgress = () => (
    <Card style={FXTheme.cards.base}>
      <View style={FXTheme.layouts.rowBetween}>
        <Typography variant="h6">Trade Progress</Typography>
        {timeRemaining > 0 && trade.status === 'payment_pending' && (
          <View style={FXTheme.layouts.row}>
            <MaterialIcons name="timer" size={16} color={Colors.warning} />
            <Typography variant="caption" color="warning" style={[FXTheme.text.bold, { marginLeft: Spacing.xs }]}>
              {formatTimeRemaining(timeRemaining)} left
            </Typography>
          </View>
        )}
      </View>

      {chatExpiresAt && (
        <View style={[FXTheme.layouts.row, {
          backgroundColor: Colors.gray100,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.xs,
          borderRadius: BorderRadius.lg,
          marginBottom: Spacing.md,
        }]}>
          <MaterialIcons name="hourglass-top" size={16} color={Colors.gray600} />
          <Typography variant="caption" color="textSecondary" style={{ marginLeft: Spacing.xs }}>
            {new Date() >= chatExpiresAt ? 'Chat expired' : `Chat expires ${chatExpiresAt.toLocaleString()}`}
          </Typography>
        </View>
      )}

      <View style={[FXTheme.layouts.center, { marginBottom: Spacing.lg }]}>
        <Typography variant="body2" color="textSecondary">
          P2P Currency Exchange
        </Typography>
        <View style={[FXTheme.layouts.rowBetween, { width: '100%', marginVertical: Spacing.md }]}>
          <View style={[FXTheme.layouts.column, { alignItems: 'center', flex: 1 }]}>
            <Typography variant="caption" color="textSecondary">
              {isUserMerchant ? 'You send' : 'You send'}
            </Typography>
            <Typography variant="h6" color="primary">
              {isUserMerchant 
                ? `${trade.buyCurrency.symbol}${trade.buyAmount.toLocaleString()}`
                : `${trade.sellCurrency.symbol}${trade.sellAmount.toLocaleString()}`}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {isUserMerchant ? trade.buyCurrency.code : trade.sellCurrency.code}
            </Typography>
          </View>
          
          <View style={[FXTheme.layouts.center, { flex: 0.3 }]}>
            <MaterialIcons name="swap-horiz" size={24} color={Colors.primary} />
            <Typography variant="caption" color="textSecondary">Exchange</Typography>
          </View>
          
          <View style={[FXTheme.layouts.column, { alignItems: 'center', flex: 1 }]}>
            <Typography variant="caption" color="textSecondary">
              {isUserMerchant ? 'You receive' : 'You receive'}
            </Typography>
            <Typography variant="h6" color="success">
              {isUserMerchant 
                ? `${trade.sellCurrency.symbol}${trade.sellAmount.toLocaleString()}`
                : `${trade.buyCurrency.symbol}${trade.buyAmount.toLocaleString()}`}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {isUserMerchant ? trade.sellCurrency.code : trade.buyCurrency.code}
            </Typography>
          </View>
        </View>
        
        {/* Status indicators */}
        <View style={[FXTheme.layouts.rowBetween, { width: '100%', marginTop: Spacing.md }]}>
          <View style={[FXTheme.layouts.column, { alignItems: 'center', flex: 1 }]}>
            <MaterialIcons 
              name={hasCurrentUserPaymentProof() ? "check-circle" : "radio-button-unchecked"} 
              size={16} 
              color={hasCurrentUserPaymentProof() ? Colors.success : Colors.gray400} 
            />
            <Typography variant="caption" color={hasCurrentUserPaymentProof() ? "success" : "textSecondary"}>
              Your Payment
            </Typography>
          </View>
          
          <View style={[FXTheme.layouts.column, { alignItems: 'center', flex: 1 }]}>
            <MaterialIcons 
              name={hasOtherPartyPaymentProof() ? "check-circle" : "radio-button-unchecked"} 
              size={16} 
              color={hasOtherPartyPaymentProof() ? Colors.success : Colors.gray400} 
            />
            <Typography variant="caption" color={hasOtherPartyPaymentProof() ? "success" : "textSecondary"}>
              Their Payment
            </Typography>
          </View>
        </View>
      </View>

      {renderActionButtons()}
    </Card>
  );

  const renderActionButtons = () => {
    if (isExpired) {
      return (
        <View style={FXTheme.layouts.center}>
          <Typography variant="body2" color="error" style={FXTheme.text.bold}>
            Trade Expired
          </Typography>
          <Typography variant="caption" color="textSecondary">
            This trade has exceeded its payment deadline
          </Typography>
        </View>
      );
    }

    // P2P Dual-Track System: Both parties send money to each other
    switch (trade.status) {
      case 'accepted':
      case 'quote_locked':
      case 'payment_pending':
        // Both parties can upload payment proof simultaneously
        return (
          <View style={FXTheme.layouts.column}>
            <View style={FXTheme.layouts.rowGap}>
              <Button
                title={isUserBuyer ? "Upload Payment Proof" : "Upload Payment Proof"}
                onPress={handleUploadPaymentProof}
                style={{ flex: 1 }}
              />
              <Button
                title="Open Dispute"
                variant="outline"
                onPress={() => setShowDispute(true)}
                style={{ flex: 1 }}
              />
            </View>
            {/* Show confirmation button if other party has uploaded proof */}
            {hasOtherPartyPaymentProof() && (
              <View style={{ marginTop: Spacing.md }}>
                <Button
                  title="Confirm Payment Received"
                  onPress={handleConfirmPayment}
                  style={{ width: '100%' }}
                  variant="outline"
                />
              </View>
            )}
          </View>
        );

      case 'payment_sent':
        // One party has sent payment, both can still upload proof and confirm
        return (
          <View style={FXTheme.layouts.column}>
            <View style={FXTheme.layouts.rowGap}>
              <Button
                title="Upload Payment Proof"
                onPress={handleUploadPaymentProof}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Payment Received"
                onPress={handleConfirmPayment}
                style={{ flex: 1 }}
              />
            </View>
            <View style={{ marginTop: Spacing.md }}>
              <Button
                title="Open Dispute"
                variant="outline"
                onPress={() => setShowDispute(true)}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        );

      case 'buyer_payment_sent':
        // Buyer has sent payment, merchant needs to send theirs
        if (isUserMerchant) {
          return (
            <View style={FXTheme.layouts.column}>
              <View style={FXTheme.layouts.rowGap}>
                <Button
                  title="Upload Your Payment Proof"
                  onPress={handleUploadPaymentProof}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Confirm Buyer Payment Received"
                  onPress={handleConfirmPayment}
                  style={{ flex: 1 }}
                />
              </View>
              <View style={{ marginTop: Spacing.md }}>
                <Button
                  title="Open Dispute"
                  variant="outline"
                  onPress={() => setShowDispute(true)}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          );
        } else {
          return (
            <View style={FXTheme.layouts.column}>
              <View style={FXTheme.layouts.center}>
                <Typography variant="body2" color="primary" style={FXTheme.text.bold}>
                  Your Payment Sent
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Waiting for merchant to send their payment
                </Typography>
              </View>
              <View style={{ marginTop: Spacing.md }}>
                <Button
                  title="Open Dispute"
                  variant="outline"
                  onPress={() => setShowDispute(true)}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          );
        }

      case 'merchant_payment_sent':
        // Merchant has sent payment, buyer needs to send theirs
        if (isUserBuyer) {
          return (
            <View style={FXTheme.layouts.column}>
              <View style={FXTheme.layouts.rowGap}>
                <Button
                  title="Upload Your Payment Proof"
                  onPress={handleUploadPaymentProof}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Confirm Merchant Payment Received"
                  onPress={handleConfirmPayment}
                  style={{ flex: 1 }}
                />
              </View>
              <View style={{ marginTop: Spacing.md }}>
                <Button
                  title="Open Dispute"
                  variant="outline"
                  onPress={() => setShowDispute(true)}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          );
        } else {
          return (
            <View style={FXTheme.layouts.column}>
              <View style={FXTheme.layouts.center}>
                <Typography variant="body2" color="primary" style={FXTheme.text.bold}>
                  Your Payment Sent
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Waiting for buyer to send their payment
                </Typography>
              </View>
              <View style={{ marginTop: Spacing.md }}>
                <Button
                  title="Open Dispute"
                  variant="outline"
                  onPress={() => setShowDispute(true)}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          );
        }

      case 'both_payments_sent':
        // Both parties have sent payments, both can confirm receipt
        return (
          <View style={FXTheme.layouts.column}>
            <View style={FXTheme.layouts.rowGap}>
              <Button
                title="Confirm Payment Received"
                onPress={handleConfirmPayment}
                style={{ flex: 1 }}
              />
            </View>
            <View style={{ marginTop: Spacing.md }}>
              <Button
                title="Open Dispute"
                variant="outline"
                onPress={() => setShowDispute(true)}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        );

      case 'payment_confirmed':
        // One party confirmed, waiting for other to confirm or trade is completed
        const isTradeFullyCompleted = hasCurrentUserPaymentProof() && hasOtherPartyPaymentProof();
        
        if (isTradeFullyCompleted) {
          // Both parties have uploaded proof and at least one confirmed
          return (
            <View style={FXTheme.layouts.column}>
              <View style={FXTheme.layouts.center}>
                <Typography variant="body2" color="success" style={FXTheme.text.bold}>
                  Trade Nearly Complete!
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {hasCurrentUserPaymentProof() && hasOtherPartyPaymentProof() 
                    ? 'Both payments sent. Confirm if you received payment to complete.'
                    : 'Waiting for final confirmation from trading partner'}
                </Typography>
              </View>
              <View style={{ marginTop: Spacing.md }}>
                <View style={FXTheme.layouts.rowGap}>
                  <Button
                    title="Confirm Payment Received"
                    onPress={handleConfirmPayment}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Open Dispute"
                    variant="outline"
                    onPress={() => setShowDispute(true)}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </View>
          );
        } else {
          // Partial confirmation, still waiting for uploads or confirmations
          return (
            <View style={FXTheme.layouts.column}>
              <View style={FXTheme.layouts.center}>
                <Typography variant="body2" color="success" style={FXTheme.text.bold}>
                  Payment Confirmed
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Waiting for trading partner to upload proof and confirm
                </Typography>
              </View>
              <View style={{ marginTop: Spacing.md }}>
                <View style={FXTheme.layouts.rowGap}>
                  {!hasCurrentUserPaymentProof() && (
                    <Button
                      title="Upload Your Payment Proof"
                      onPress={handleUploadPaymentProof}
                      style={{ flex: 1 }}
                    />
                  )}
                  <Button
                    title="Open Dispute"
                    variant="outline"
                    onPress={() => setShowDispute(true)}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </View>
          );
        }

      case 'completed':
        return (
          <View style={FXTheme.layouts.column}>
            <View style={FXTheme.layouts.center}>
              <Typography variant="body2" color="success" style={FXTheme.text.bold}>
                🎉 Trade Completed Successfully!
              </Typography>
              <Typography variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.xs }}>
                Both parties have exchanged currencies and confirmed receipt
              </Typography>
            </View>
            <View style={{ marginTop: Spacing.lg }}>
              <View style={FXTheme.layouts.rowGap}>
                <Button
                  title="Rate Trading Partner"
                  onPress={() => {
                    // Show rating modal
                    Alert.alert(
                      'Rate Trading Partner',
                      `How was your experience trading with ${otherParty?.name}?`,
                      [
                        { text: 'Skip', style: 'cancel' },
                        { text: 'Rate Now', onPress: () => onCompleteRating(5, 'Great trade!') }
                      ]
                    );
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Back to Marketplace"
                  onPress={onBack}
                  style={{ flex: 1 }}
                  variant="outline"
                />
              </View>
            </View>
          </View>
        );

      case 'disputed':
        return (
          <View style={FXTheme.layouts.center}>
            <Typography variant="body2" color="error" style={FXTheme.text.bold}>
              Trade Disputed
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Waiting for platform resolution
            </Typography>
          </View>
        );

      case 'cancelled':
        return (
          <View style={FXTheme.layouts.center}>
            <Typography variant="body2" color="error" style={FXTheme.text.bold}>
              Trade Cancelled
            </Typography>
            <Typography variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.xs }}>
              {isExpired ? 'Cancelled due to expiration' : 'Trade was cancelled'}
            </Typography>
          </View>
        );

      default:
        return (
          <View style={FXTheme.layouts.center}>
            <Typography variant="body2" color="textSecondary">
              Status: {trade.status}
            </Typography>
          </View>
        );
    }
  };

  
  const hasOtherPartyPaymentProof = () => {
    // Check if the other party (not current user) has uploaded payment proof
    if (isUserBuyer) {
      // If user is buyer, check if merchant has uploaded proof
      return !!(trade as any).merchantPaymentProof;
    } else {
      // If user is merchant, check if buyer has uploaded proof
      return !!(trade as any).buyerPaymentProof;
    }
  };
  
  const hasCurrentUserPaymentProof = () => {
    // Check if current user has uploaded payment proof
    if (isUserBuyer) {
      return !!(trade as any).buyerPaymentProof;
    } else {
      return !!(trade as any).merchantPaymentProof;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quote_locked': return Colors.primary;
      case 'payment_pending': return Colors.warning;
      case 'payment_sent': return Colors.warning;
      case 'buyer_payment_sent': return Colors.warning;
      case 'merchant_payment_sent': return Colors.warning;
      case 'both_payments_sent': return Colors.warning;
      case 'payment_confirmed': return Colors.success;
      case 'completed': return Colors.success;
      case 'disputed': return Colors.error;
      case 'cancelled': return Colors.gray400;
      default: return Colors.gray400;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'quote_locked': return 'Quote Locked';
      case 'payment_pending': return 'Payment Pending';
      case 'payment_sent': return 'Payment Sent';
      case 'buyer_payment_sent': return 'Buyer Payment Sent';
      case 'merchant_payment_sent': return 'Merchant Payment Sent';
      case 'both_payments_sent': return 'Both Payments Sent';
      case 'payment_confirmed': return 'Payment Confirmed';
      case 'completed': return 'Completed';
      case 'disputed': return 'Disputed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const renderMessage = ({ item: message }: { item: TradeMessage }) => {
    const isOwnMessage = message.senderId === currentUser?.id;
    const isSystemMessage = message.type === 'system';

    if (isSystemMessage) {
      return (
        <View style={FXTheme.layouts.center}>
          <View style={[FXTheme.layouts.row, {
            backgroundColor: Colors.gray100,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            borderRadius: BorderRadius.lg,
          }]}>
            <MaterialIcons 
              name={getSystemMessageIcon(message.systemEventType)} 
              size={16} 
              color={Colors.primary} 
            />
            <Typography variant="body2" style={[FXTheme.text.bold, { marginLeft: Spacing.sm, textAlign: 'center' }]}>
              {message.content}
            </Typography>
          </View>
          <Typography variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </View>
      );
    }

    if (message.type === 'payment_proof' && message.paymentProof) {
      return (
        <View style={[FXTheme.layouts.column, isOwnMessage ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          {/* Show the actual image */}
          {message.paymentProof.receipt && (
            <TouchableOpacity onPress={() => {
              setViewingImage(message.paymentProof.receipt!);
            }}>
              <Image 
                source={{ uri: message.paymentProof.receipt }} 
                style={{
                  width: 200,
                  height: 150,
                  borderRadius: 8,
                  marginBottom: 4,
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          
          {/* Small caption with payment details */}
          <View style={{
            backgroundColor: Colors.gray100,
            padding: 8,
            borderRadius: 6,
            maxWidth: 200,
          }}>
            <Typography variant="caption" style={{ fontSize: 10 }}>
              💰 {message.paymentProof.currency} {message.paymentProof.amount?.toLocaleString()}
            </Typography>
            <Typography variant="caption" style={{ fontSize: 10, color: Colors.gray600 }}>
              {message.paymentProof.method} • {message.paymentProof.transactionId}
            </Typography>
          </View>
          
          <Typography variant="caption" color="textSecondary" style={{ marginTop: 4, fontSize: 10 }}>
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </View>
      );
    }

    return (
      <View style={[FXTheme.layouts.column, isOwnMessage ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
        <View style={[{
          backgroundColor: isOwnMessage ? Colors.primary : Colors.gray100,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          borderRadius: BorderRadius.lg,
          maxWidth: '80%',
        }]}>
          <Typography 
            variant="body2" 
            style={[FXTheme.text.bold, { color: isOwnMessage ? Colors.background : Colors.textPrimary }]}
          >
            {message.content}
          </Typography>
        </View>
        <Typography variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
          {message.timestamp.toLocaleTimeString()}
        </Typography>
      </View>
    );
  };

  const getSystemMessageIcon = (eventType?: string) => {
    switch (eventType) {
      case 'payment_window_started': return 'timer';
      case 'payment_sent': return 'send';
      case 'buyer_payment_sent': return 'send';
      case 'merchant_payment_sent': return 'send';
      case 'both_payments_sent': return 'done-all';
      case 'payment_confirmed': return 'check-circle';
      case 'trade_completed': return 'done-all';
      default: return 'info';
    }
  };

  const renderDisputeModal = () => {
    if (!showDispute) return null;

    return (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <View style={{
          backgroundColor: Colors.background,
          borderRadius: BorderRadius.lg,
          padding: Spacing.xl,
          margin: Spacing.lg,
          width: '90%',
        }}>
          <Typography variant="h6" style={[FXTheme.text.bold, { marginBottom: Spacing.md }]}>
            Open Dispute
          </Typography>
          <Typography variant="body2" color="textSecondary" style={[FXTheme.text.bold, { marginBottom: Spacing.lg, lineHeight: 20 }]}>
            Describe the issue you're experiencing with this trade.
          </Typography>
          
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: Colors.gray300,
              borderRadius: BorderRadius.md,
              padding: Spacing.md,
              marginBottom: Spacing.lg,
              textAlignVertical: 'top',
            }}
            value={disputeReason}
            onChangeText={setDisputeReason}
            placeholder="Explain the problem..."
            multiline
            numberOfLines={4}
          />

          <View style={FXTheme.layouts.rowGap}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowDispute(false)}
              style={{ flex: 1 }}
            />
            <Button
              title="Open Dispute"
              onPress={handleOpenDispute}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    );
  };

  const isExpired = trade.timeWindows?.paymentDeadline && new Date() > new Date(trade.timeWindows.paymentDeadline);
  const chatExpired = chatExpiresAt && new Date() >= chatExpiresAt;
  const isCancelled = trade.status === 'cancelled';
  const inputDisabled = isExpired || chatExpired || isCancelled;

  return (
    <KeyboardAvoidingView 
      style={FXTheme.containers.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {renderTradeHeader()}
      {renderTradeProgress()}
      
      {(isExpired || isCancelled) && (
        <View style={{
          backgroundColor: Colors.error + '10',
          borderColor: Colors.error + '30',
          borderWidth: 1,
          margin: Spacing.lg,
          marginTop: 0,
          padding: Spacing.md,
          borderRadius: BorderRadius.md,
        }}>
          <View style={[FXTheme.layouts.row, { alignItems: 'center' }]}>
            <MaterialIcons name={isCancelled ? "cancel" : "error"} size={20} color={Colors.error} />
            <Typography variant="body2" color="error" style={{ marginLeft: Spacing.sm, flex: 1 }}>
              {isCancelled 
                ? 'This trade has been cancelled. You can start a new trade from the marketplace.'
                : `This trade has expired. Payment deadline was ${trade.timeWindows?.paymentDeadline ? new Date(trade.timeWindows.paymentDeadline).toLocaleString() : 'N/A'}`
              }
            </Typography>
          </View>
        </View>
      )}
      
      <View style={{
        flex: 1,
        margin: Spacing.lg,
        marginTop: isExpired ? 0 : Spacing.md,
      }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingVertical: Spacing.md,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        />

        <View style={[{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingTop: Spacing.md,
          borderTopWidth: 1,
          borderTopColor: Colors.gray200,
          backgroundColor: Colors.background,
        }, inputDisabled ? { opacity: 0.6 } : null]}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: inputDisabled ? Colors.gray300 : Colors.gray400,
              borderRadius: BorderRadius.lg,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              marginRight: Spacing.md,
              maxHeight: 100,
              backgroundColor: inputDisabled ? Colors.gray100 : Colors.background,
            }}
            value={messageText}
            onChangeText={setMessageText}
            placeholder={
              isCancelled ? 'Trade cancelled' :
              isExpired ? 'Trade expired' : 
              chatExpired ? 'Chat expired' : 
              'Type a message...'
            }
            editable={!inputDisabled}
            multiline
            onSubmitEditing={() => {
              if (messageText.trim() && !inputDisabled) {
                sendMessage();
              }
            }}
          />
          <TouchableOpacity 
            onPress={() => {
              console.log('💆 [TradeRoom] SEND BUTTON PRESSED:', {
                currentUserId: currentUser?.id,
                currentUserName: currentUser?.name,
                messageText: messageText.trim(),
                messageLength: messageText.length,
                inputDisabled,
                canPress: !(!messageText.trim() || inputDisabled),
                merchantId: merchant?.id,
                buyerId: buyer?.id
              });
              sendMessage();
            }}
            style={[{
              width: 40,
              height: 40,
              borderRadius: BorderRadius.full,
              backgroundColor: messageText.trim() && !inputDisabled ? Colors.primary : Colors.gray300,
              alignItems: 'center',
              justifyContent: 'center',
            }]}
            disabled={!messageText.trim() || inputDisabled}
          >
            <MaterialIcons 
              name="send" 
              size={20} 
              color={messageText.trim() && !inputDisabled ? Colors.background : Colors.gray500} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {renderDisputeModal()}
      
      {/* Full-screen image viewer */}
      <Modal
        visible={!!viewingImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewingImage(null)}
      >
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setViewingImage(null)}
        >
          <TouchableOpacity 
            style={{
              position: 'absolute',
              top: 60,
              right: 20,
              zIndex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 20,
              padding: 8,
            }}
            onPress={() => setViewingImage(null)}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          {viewingImage && (
            <Image 
              source={{ uri: viewingImage }} 
              style={{
                width: '90%',
                height: '70%',
                borderRadius: 8,
              }}
              resizeMode="contain"
            />
          )}
          
          <View style={{
            position: 'absolute',
            bottom: 60,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}>
            <Typography variant="body2" style={{ color: 'white', textAlign: 'center' }}>
              Payment Proof Screenshot
            </Typography>
            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 }}>
              Tap anywhere to close
            </Typography>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};