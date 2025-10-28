import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Typography } from '../ui/Typography';
import { Colors, Spacing } from '../../theme';

interface GameWebViewProps {
  gameUrl: string;
  onScore?: (score: number) => void;
  onGameEnd?: (data: { score: number; level?: number; time?: number }) => void;
  onRewards?: (bricks: number) => void;
}

export const GameWebView: React.FC<GameWebViewProps> = ({
  gameUrl,
  onScore,
  onGameEnd,
  onRewards,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Debug: Log the game URL
  console.log('GameWebView loading URL:', gameUrl);
  
  // Test if URL is accessible
  const isValidUrl = gameUrl && (gameUrl.startsWith('http://') || gameUrl.startsWith('https://'));
  console.log('Is valid URL:', isValidUrl);

  // Add timeout to detect if WebView is stuck loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('WebView taking too long to load, might be an issue');
        setIsLoading(false);
        setHasError(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  const handleMessage = (event: any) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);
      
      switch (type) {
        case 'GAME_SCORE':
          onScore?.(data.score);
          break;
        case 'GAME_COMPLETE':
          onGameEnd?.(data);
          // Award bricks based on score
          const bricksEarned = Math.floor(data.score / 100);
          if (bricksEarned > 0) {
            onRewards?.(bricksEarned);
            Alert.alert(
              'Game Complete!',
              `Well done! You earned ${bricksEarned} Bricks!`,
              [{ text: 'Awesome!', style: 'default' }]
            );
          }
          break;
        case 'GAME_ERROR':
          console.error('Game Error:', data);
          setHasError(true);
          break;
      }
    } catch (error) {
      console.error('Error parsing game message:', error);
    }
  };

  const injectedJavaScript = `
    // Inject Ile branding and reward system
    window.IleGameBridge = {
      awardBricks: (score) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'GAME_COMPLETE',
          data: { score: score, timestamp: Date.now() }
        }));
      },
      updateScore: (score) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'GAME_SCORE',
          data: { score: score }
        }));
      },
      reportError: (error) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'GAME_ERROR',
          data: { error: error }
        }));
      }
    };

    // Customize game colors to match Ile theme
    const ileTheme = {
      primary: '#170F34',
      secondary: '#FDD15F',
      background: '#F8F9FA',
      success: '#34A853',
    };

    // Override game colors if possible
    if (window.gameConfig && typeof window.gameConfig === 'object') {
      window.gameConfig.colors = ileTheme;
    }

    true; // Required by React Native WebView
  `;

  const handleLoadEnd = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView Load End:', nativeEvent);
    setIsLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView Error:', nativeEvent);
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError || !isValidUrl) {
    return (
      <View style={styles.errorContainer}>
        <Typography variant="body1" color="textSecondary" style={styles.errorText}>
          {!isValidUrl ? 'Invalid game URL' : 'Failed to load game. Please check your internet connection.'}
        </Typography>
        <Typography variant="caption" color="textSecondary" style={styles.errorText}>
          URL: {gameUrl}
        </Typography>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setHasError(false);
            setIsLoading(true);
          }}
        >
          <Typography variant="body2" color="primary">
            Retry
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Typography variant="body1" color="textSecondary">
            Loading game...
          </Typography>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: gameUrl }}
        style={styles.webview}
        onMessage={handleMessage}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onLoadStart={() => setIsLoading(true)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        bounces={false}
        scrollEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        injectedJavaScript={injectedJavaScript}
        onShouldStartLoadWithRequest={() => true}
        allowsBackForwardNavigationGestures={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: '100%',
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
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
  },
});