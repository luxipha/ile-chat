import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { LocationData, locationService } from '../../services/locationService';

interface LocationMessageProps {
  location: LocationData;
  isCurrentUser: boolean;
  timestamp?: Date;
}

export const LocationMessage: React.FC<LocationMessageProps> = ({
  location,
  isCurrentUser,
  timestamp,
}) => {
  const webViewRef = useRef<WebView>(null);

  const handleOpenInMaps = async () => {
    const mapUrl = locationService.generateMapUrl(location);
    
    try {
      const canOpen = await Linking.canOpenURL(mapUrl);
      if (canOpen) {
        await Linking.openURL(mapUrl);
      } else {
        Alert.alert(
          'Unable to Open Maps',
          'Could not open the location in maps app.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert(
        'Unable to Open Maps',
        'Could not open the location in maps app.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleGetDirections = async () => {
    const { latitude, longitude } = location;
    
    try {
      // Use OpenStreetMap-based directions
      const directionsUrl = `https://www.openstreetmap.org/directions?to=${latitude},${longitude}`;
      const canOpen = await Linking.canOpenURL(directionsUrl);
      
      if (canOpen) {
        await Linking.openURL(directionsUrl);
      } else {
        Alert.alert(
          'Unable to Open Directions',
          'Could not open directions in maps app.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert(
        'Unable to Open Directions',
        'Could not open directions in maps app.',
        [{ text: 'OK' }]
      );
    }
  };

  // HTML content for the mini interactive map
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Location Preview</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body, html { 
                margin: 0; 
                padding: 0; 
                height: 100%; 
                overflow: hidden;
            }
            #map { 
                height: 100vh; 
                width: 100vw; 
                cursor: pointer;
            }
            .tap-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                pointer-events: none;
            }
            .tap-hint {
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 8px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                gap: 4px;
            }
        </style>
    </head>
    <body>
        <div class="tap-overlay">
            <div class="tap-hint">
                📍 Tap to open
            </div>
        </div>
        <div id="map"></div>
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            let map;
            let marker;
            
            // Initialize map
            map = L.map('map', {
                zoomControl: false,
                attributionControl: false,
                dragging: false,
                touchZoom: false,
                doubleClickZoom: false,
                scrollWheelZoom: false,
                boxZoom: false,
                keyboard: false
            }).setView([${location.latitude}, ${location.longitude}], 15);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);
            
            // Add location marker
            marker = L.circleMarker([${location.latitude}, ${location.longitude}], {
                radius: 8,
                fillColor: '${isCurrentUser ? Colors.white : Colors.primary}',
                color: '${isCurrentUser ? Colors.primary : Colors.white}',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(map);
            
            // Handle map clicks - open in external app
            map.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'OPEN_EXTERNAL'
                }));
            });
        </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'OPEN_EXTERNAL') {
        handleOpenInMaps();
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
      {/* Interactive Map Preview */}
      <TouchableOpacity style={styles.mapPreview} onPress={handleOpenInMaps}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
        />
      </TouchableOpacity>

      {/* Location Info */}
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <MaterialIcons 
            name="location-on" 
            size={16} 
            color={isCurrentUser ? Colors.white : Colors.primary} 
          />
          <Typography 
            variant="caption" 
            style={[
              styles.locationLabel,
              { color: isCurrentUser ? Colors.white : Colors.textSecondary }
            ]}
          >
            {location.name || 'Shared Location'}
          </Typography>
        </View>
        
        <Typography 
          variant="body2" 
          style={[
            styles.locationAddress,
            { color: isCurrentUser ? Colors.white : Colors.textPrimary }
          ]}
          numberOfLines={2}
        >
          {location.address}
        </Typography>

        {/* Coordinates */}
        <Typography 
          variant="caption" 
          style={[
            styles.coordinates,
            { color: isCurrentUser ? 'rgba(255,255,255,0.8)' : Colors.textSecondary }
          ]}
        >
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Typography>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleOpenInMaps}>
          <MaterialIcons 
            name="map" 
            size={16} 
            color={isCurrentUser ? Colors.white : Colors.primary} 
          />
          <Typography 
            variant="caption" 
            style={[
              styles.actionText,
              { color: isCurrentUser ? Colors.white : Colors.primary }
            ]}
          >
            View
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleGetDirections}>
          <MaterialIcons 
            name="directions" 
            size={16} 
            color={isCurrentUser ? Colors.white : Colors.primary} 
          />
          <Typography 
            variant="caption" 
            style={[
              styles.actionText,
              { color: isCurrentUser ? Colors.white : Colors.primary }
            ]}
          >
            Directions
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Timestamp */}
      {timestamp && (
        <Typography 
          variant="caption" 
          style={[
            styles.timestamp,
            { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : Colors.textSecondary }
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
    maxWidth: 280,
    minWidth: 200,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
  },
  currentUserContainer: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  otherUserContainer: {
    backgroundColor: Colors.surface,
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  mapPreview: {
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  locationInfo: {
    marginBottom: Spacing.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  locationLabel: {
    fontWeight: '600',
    fontSize: 12,
  },
  locationAddress: {
    fontWeight: '500',
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  coordinates: {
    fontSize: 11,
    opacity: 0.8,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    marginBottom: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  actionText: {
    fontWeight: '600',
    fontSize: 12,
  },
  timestamp: {
    alignSelf: 'flex-end',
    fontSize: 10,
    marginTop: Spacing.xs,
  },
});