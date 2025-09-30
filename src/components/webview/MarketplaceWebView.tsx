import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { Typography } from '../ui/Typography';
import { Colors, Spacing } from '../../theme';

interface MarketplaceWebViewProps {
  onBack: () => void;
  initialUrl?: string;
  userToken?: string;
  userId?: string;
}

// Try multiple URLs for marketplace (using correct port 8080)
const MARKETPLACE_URLS = [
  'http://192.168.31.102:8080', // Your actual network IP (matches API)
  'http://localhost:8080',
  'http://127.0.0.1:8080', 
  'http://10.0.2.2:8080', // Android emulator
  'http://192.168.1.102:8080', // Alternative network range
];

const { height: screenHeight } = Dimensions.get('window');

export const MarketplaceWebView: React.FC<MarketplaceWebViewProps> = ({
  onBack,
  initialUrl,
  userToken,
  userId,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(initialUrl || MARKETPLACE_URLS[0]);
  const [canGoBack, setCanGoBack] = useState(false);
  const [urlIndex, setUrlIndex] = useState(0);
  
  // Animation for slide up effect
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    // Slide up animation when component mounts
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);


  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'navigation':
          if (data.action === 'back') {
            onBack();
          }
          break;
        case 'error':
          Alert.alert('Error', data.message);
          break;
        default:
          console.log('WebView message:', data);
      }
    } catch (error) {
      console.log('Raw WebView message:', event.nativeEvent.data);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    setCurrentUrl(navState.url);
    setCanGoBack(navState.canGoBack);
  };

  const handleLoadEnd = () => {
    console.log('✅ WebView successfully loaded:', currentUrl);
    setLoading(false);
  };

  const handleLoadStart = () => {
    console.log('🔄 WebView starting to load:', currentUrl);
    setLoading(true);
  };

  const handleError = (event: any) => {
    console.log('WebView error:', event.nativeEvent);
    console.log('Failed URL:', currentUrl);
    console.log('Current URL index:', urlIndex);
    setLoading(false);
    
    // Try next URL if available
    if (urlIndex < MARKETPLACE_URLS.length - 1) {
      const nextIndex = urlIndex + 1;
      console.log(`Trying next URL (${nextIndex + 1}/${MARKETPLACE_URLS.length}):`, MARKETPLACE_URLS[nextIndex]);
      setUrlIndex(nextIndex);
      setCurrentUrl(MARKETPLACE_URLS[nextIndex]);
      setLoading(true);
      return;
    }
    
    // If all URLs failed, show error
    Alert.alert(
      'Connection Error',
      `Unable to load marketplace. Tried ${MARKETPLACE_URLS.length} URLs.\n\nLast attempted: ${currentUrl}\n\nPlease ensure:\n1. Marketplace server is running\n2. You're on the same network\n3. Port 8080 is accessible`,
      [
        { text: 'Retry All', onPress: () => {
          console.log('Retrying all URLs from beginning');
          setUrlIndex(0);
          setCurrentUrl(MARKETPLACE_URLS[0]);
          setLoading(true);
          webViewRef.current?.reload();
        }},
        { text: 'Go Back', onPress: handleBackPress },
        { text: 'Debug Info', onPress: () => {
          Alert.alert('Debug Info', `URLs tried:\n${MARKETPLACE_URLS.join('\n')}\n\nCurrent network: Check your WiFi/network settings`);
        }}
      ]
    );
  };

  const handleBackPress = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      // Slide down animation before closing
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        onBack();
      });
    }
  };

  return (
    <Animated.View 
      style={[
        styles.animatedContainer,
        {
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h6" style={styles.title}>
          Marketplace
        </Typography>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => webViewRef.current?.reload()} 
            style={styles.actionButton}
          >
            <MaterialIcons name="refresh" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webView}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Typography variant="body2" color="textSecondary" style={styles.loadingText}>
                Loading Marketplace...
              </Typography>
            </View>
          )}
          // Security and performance settings
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // Allow navigation within the marketplace domain
          onShouldStartLoadWithRequest={(request) => {
            // Allow navigation within marketplace or to external payment providers
            console.log('WebView navigation request:', request.url);
            return request.url.includes('localhost') || 
                   request.url.includes('127.0.0.1') ||
                   request.url.includes('192.168') ||
                   request.url.includes('10.0.2.2') ||
                   request.url.includes('paystack.co') ||
                   request.url.includes('ile.africa') || // Production domain
                   request.url.startsWith('http://') ||
                   request.url.startsWith('https://');
          }}
          // Additional WebView settings for better connectivity
          mixedContentMode="compatibility"
          allowsFullscreenVideo={true}
          bounces={false}
        />
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Typography variant="body2" color="textSecondary" style={styles.loadingText}>
            Loading Marketplace...
          </Typography>
        </View>
      )}
    </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  title: {
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
});