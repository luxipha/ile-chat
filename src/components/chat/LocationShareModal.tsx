import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { locationService, LocationData } from '../../services/locationService';

const { width, height } = Dimensions.get('window');

interface LocationShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShareLocation: (location: LocationData) => void;
}

export const LocationShareModal: React.FC<LocationShareModalProps> = ({
  visible,
  onClose,
  onShareLocation,
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setSelectedLocation(location);
        
        // Update map with current location when loaded
        if (mapLoaded && webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'SET_LOCATION',
            data: location
          }));
        }
        
        console.log('📍 Got real location:', location);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Unable to get current location. Please check location permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const location = await locationService.geocode(searchQuery);
      if (location) {
        setSelectedLocation(location);
        
        // Update map with searched location
        if (mapLoaded && webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'SET_SELECTED_LOCATION',
            data: location
          }));
        }
        
        console.log('🔍 Found location:', location);
      } else {
        Alert.alert('Location Not Found', 'Could not find the specified location. Please try again.');
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      Alert.alert('Search Error', 'An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'MAP_LOADED':
          setMapLoaded(true);
          // Set initial location if available
          if (currentLocation) {
            webViewRef.current?.postMessage(JSON.stringify({
              type: 'SET_LOCATION',
              data: currentLocation
            }));
          }
          break;
          
        case 'LOCATION_SELECTED':
          const { latitude, longitude } = message.data;
          setLoading(true);
          
          try {
            const address = await locationService.reverseGeocode(latitude, longitude);
            const newLocation: LocationData = {
              latitude,
              longitude,
              address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              name: 'Selected Location',
            };
            setSelectedLocation(newLocation);
            console.log('📍 Selected location:', newLocation);
          } catch (error) {
            console.error('Error getting address:', error);
          } finally {
            setLoading(false);
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleShareCurrentLocation = () => {
    if (currentLocation) {
      console.log('📤 Sharing current location:', currentLocation);
      onShareLocation(currentLocation);
      onClose();
    } else {
      Alert.alert('Location Error', 'Current location not available. Please try again.');
    }
  };

  const handleShareSelectedLocation = () => {
    if (selectedLocation) {
      console.log('📤 Sharing selected location:', selectedLocation);
      onShareLocation(selectedLocation);
      onClose();
    } else {
      Alert.alert('No Location Selected', 'Please select a location on the map or use your current location.');
    }
  };

  // HTML content for the interactive map
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Location Picker</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body, html { margin: 0; padding: 0; height: 100%; }
            #map { height: 100vh; width: 100vw; }
            .custom-marker {
                background-color: ${Colors.primary};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .selected-marker {
                background-color: ${Colors.secondary};
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            let map;
            let currentLocationMarker;
            let selectedLocationMarker;
            
            // Initialize map
            map = L.map('map').setView([0, 0], 2);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);
            
            // Handle map clicks
            map.on('click', function(e) {
                const { lat, lng } = e.latlng;
                
                // Remove existing selected marker
                if (selectedLocationMarker) {
                    map.removeLayer(selectedLocationMarker);
                }
                
                // Add new selected marker
                selectedLocationMarker = L.circleMarker([lat, lng], {
                    radius: 10,
                    fillColor: '${Colors.secondary}',
                    color: 'white',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map);
                
                // Send location to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'LOCATION_SELECTED',
                    data: { latitude: lat, longitude: lng }
                }));
            });
            
            // Listen for messages from React Native
            window.addEventListener('message', function(event) {
                const message = JSON.parse(event.data);
                
                switch (message.type) {
                    case 'SET_LOCATION':
                        const location = message.data;
                        
                        // Remove existing marker
                        if (currentLocationMarker) {
                            map.removeLayer(currentLocationMarker);
                        }
                        
                        // Add current location marker
                        currentLocationMarker = L.circleMarker([location.latitude, location.longitude], {
                            radius: 12,
                            fillColor: '${Colors.primary}',
                            color: 'white',
                            weight: 3,
                            opacity: 1,
                            fillOpacity: 0.8
                        }).addTo(map);
                        
                        // Center map on location
                        map.setView([location.latitude, location.longitude], 15);
                        break;
                        
                    case 'SET_SELECTED_LOCATION':
                        const selected = message.data;
                        
                        // Remove existing selected marker
                        if (selectedLocationMarker) {
                            map.removeLayer(selectedLocationMarker);
                        }
                        
                        // Add selected location marker
                        selectedLocationMarker = L.circleMarker([selected.latitude, selected.longitude], {
                            radius: 10,
                            fillColor: '${Colors.secondary}',
                            color: 'white',
                            weight: 3,
                            opacity: 1,
                            fillOpacity: 0.8
                        }).addTo(map);
                        
                        // Center map on location
                        map.setView([selected.latitude, selected.longitude], 15);
                        break;
                }
            });
            
            // Notify React Native that map is loaded
            setTimeout(() => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'MAP_LOADED'
                }));
            }, 1000);
        </script>
    </body>
    </html>
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Typography variant="h3" style={styles.headerTitle}>
            Share Location
          </Typography>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="clear" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <MaterialIcons name="search" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Interactive Map */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Typography variant="body2" style={styles.loadingText}>
                  Loading map...
                </Typography>
              </View>
            )}
          />

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Typography variant="body2" style={styles.loadingText}>
                Getting location...
              </Typography>
            </View>
          )}

          {/* Map Instruction */}
          <View style={styles.mapInstruction}>
            <Typography variant="caption" style={styles.instructionText}>
              Tap anywhere on the map to select a location
            </Typography>
          </View>
        </View>

        {/* Selected Location Info */}
        {selectedLocation && (
          <View style={styles.locationInfo}>
            <View style={styles.locationDetails}>
              <MaterialIcons 
                name={selectedLocation === currentLocation ? "my-location" : "place"} 
                size={20} 
                color={selectedLocation === currentLocation ? Colors.primary : Colors.secondary} 
              />
              <View style={styles.locationText}>
                <Typography variant="subtitle2" style={styles.locationName}>
                  {selectedLocation === currentLocation ? "Current Location" : selectedLocation.name}
                </Typography>
                <Typography variant="caption" style={styles.locationAddress}>
                  {selectedLocation.address}
                </Typography>
                <Typography variant="caption" style={styles.coordinates}>
                  {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </Typography>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.currentLocationButton]}
            onPress={handleShareCurrentLocation}
            disabled={!currentLocation || loading}
          >
            <MaterialIcons name="my-location" size={20} color={Colors.white} />
            <Typography variant="button" style={styles.buttonText}>
              Share Current Location
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.selectedLocationButton]}
            onPress={handleShareSelectedLocation}
            disabled={!selectedLocation || loading}
          >
            <MaterialIcons name="send" size={20} color={Colors.white} />
            <Typography variant="button" style={styles.buttonText}>
              Share Selected Location
            </Typography>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    flex: 1,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.textSecondary,
  },
  mapInstruction: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  instructionText: {
    color: Colors.white,
    textAlign: 'center',
    fontSize: 12,
  },
  locationInfo: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  locationDetails: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  locationText: {
    flex: 1,
  },
  locationName: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  locationAddress: {
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  coordinates: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  actionButtons: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  currentLocationButton: {
    backgroundColor: Colors.primary,
  },
  selectedLocationButton: {
    backgroundColor: Colors.secondary,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});