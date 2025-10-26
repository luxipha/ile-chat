import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  Platform,
  PanResponder,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../theme';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DoodleCanvasProps {
  visible: boolean;
  onClose: () => void;
  onSendImage: (imageUri: string) => void;
}

interface DrawingPath {
  path: string;
  color: string;
  strokeWidth: number;
}

interface Point {
  x: number;
  y: number;
}

const COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#A52A2A', // Brown
  '#808080', // Gray
  '#90EE90', // Light Green
  '#FFB6C1', // Light Pink
  '#87CEEB', // Sky Blue
];

const STROKE_WIDTHS = [1, 3, 5, 8, 12, 20];


export const DoodleCanvas: React.FC<DoodleCanvasProps> = ({
  visible,
  onClose,
  onSendImage,
}) => {
  const canvasRef = useRef<View>(null);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(STROKE_WIDTHS[2]);
  const [isErasing, setIsErasing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(true);
  const currentPoints = useRef<Point[]>([]);

  // Convert points array to SVG path string
  const pointsToPath = (points: Point[]): string => {
    if (points.length === 0) return '';
    
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }
    return path;
  };

  // PanResponder for handling touch events
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      setIsDrawing(true);
      currentPoints.current = [{ x: locationX, y: locationY }];
      setCurrentPath(pointsToPath(currentPoints.current));
    },
    
    onPanResponderMove: (event) => {
      if (!isDrawing) return;
      
      const { locationX, locationY } = event.nativeEvent;
      currentPoints.current.push({ x: locationX, y: locationY });
      setCurrentPath(pointsToPath(currentPoints.current));
    },
    
    onPanResponderRelease: () => {
      if (!isDrawing || currentPoints.current.length === 0) return;
      
      const newDrawingPath: DrawingPath = {
        path: pointsToPath(currentPoints.current),
        color: isErasing ? '#FFFFFF' : selectedColor,
        strokeWidth: isErasing ? selectedStrokeWidth * 1.5 : selectedStrokeWidth,
      };
      
      setPaths(prev => [...prev, newDrawingPath]);
      setCurrentPath('');
      setIsDrawing(false);
      currentPoints.current = [];
    },
  });

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    setIsDrawing(false);
    currentPoints.current = [];
  };

  const handleImportImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [screenWidth, screenHeight],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setBackgroundImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error importing image:', error);
      Alert.alert('Error', 'Failed to import image');
    }
  };

  const handleClearBackground = () => {
    setBackgroundImage(null);
  };

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const handleSend = async () => {
    try {
      if (paths.length === 0 && currentPath === '') {
        Alert.alert('Empty Canvas', 'Please draw something before sending!');
        return;
      }

      // Hide tools temporarily for cleaner capture
      setShowTools(false);
      
      // Wait longer for UI to update and SVG to render properly
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture with specific options to ensure SVG is rendered
      const uri = await captureRef(canvasRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
        snapshotContentContainer: false,
        collapsable: false,
        // Platform specific optimizations
        ...(Platform.OS === 'ios' && { 
          pixelRatio: 2,
          handleGLSurfaceViewOnAndroid: true 
        }),
        ...(Platform.OS === 'android' && { 
          pixelRatio: 1,
          handleGLSurfaceViewOnAndroid: true 
        }),
      });

      // Show tools again
      setShowTools(true);

      // Send the image
      onSendImage(uri);
      
      // Reset canvas and close
      handleClear();
      onClose();
    } catch (error) {
      console.error('Error saving doodle:', error);
      Alert.alert('Error', 'Failed to save drawing');
      setShowTools(true); // Make sure tools show again on error
    }
  };

  const renderColorPicker = () => (
    <View style={styles.colorPicker}>
      {COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorButton,
            { backgroundColor: color },
            color === '#FFFFFF' && { borderColor: Colors.gray400, borderWidth: 1 },
            selectedColor === color && styles.selectedColorButton,
          ]}
          onPress={() => {
            setSelectedColor(color);
            setIsErasing(false);
          }}
        />
      ))}
    </View>
  );

  const renderEraserButton = () => (
    <View style={styles.eraserContainer}>
      <TouchableOpacity
        style={[
          styles.eraserButton,
          isErasing && styles.selectedEraserButton,
        ]}
        onPress={() => setIsErasing(!isErasing)}
      >
        <MaterialIcons 
          name="cleaning-services" 
          size={24} 
          color={isErasing ? Colors.white : Colors.gray600} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderStrokeWidthPicker = () => (
    <View style={styles.strokeWidthPicker}>
      {STROKE_WIDTHS.map((width) => (
        <TouchableOpacity
          key={width}
          style={[
            styles.strokeWidthButton,
            selectedStrokeWidth === width && styles.selectedStrokeWidthButton,
          ]}
          onPress={() => setSelectedStrokeWidth(width)}
        >
          <View
            style={[
              styles.strokeWidthPreview,
              {
                width: width,
                height: width,
                backgroundColor: selectedStrokeWidth === width ? Colors.white : Colors.gray600,
              },
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft}>
        <TouchableOpacity style={styles.topBarButton} onPress={onClose}>
          <MaterialIcons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBarButton} onPress={() => setShowTools(!showTools)}>
          <MaterialIcons name={showTools ? "visibility-off" : "visibility"} size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      <Typography variant="h3" style={styles.title}>
        Doodle
      </Typography>
      
      <View style={styles.topBarRight}>
        <TouchableOpacity style={styles.topBarButton} onPress={handleImportImage}>
          <MaterialIcons name="image" size={24} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBarButton} onPress={handleSend}>
          <MaterialIcons name="send" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBottomBar = () => (
    <View style={styles.bottomBar}>
      <TouchableOpacity style={styles.bottomButton} onPress={handleUndo}>
        <MaterialIcons name="undo" size={20} color={Colors.white} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.bottomButton} onPress={handleClear}>
        <MaterialIcons name="clear" size={20} color={Colors.white} />
      </TouchableOpacity>
      
      {backgroundImage && (
        <TouchableOpacity style={styles.bottomButton} onPress={handleClearBackground}>
          <MaterialIcons name="image-not-supported" size={20} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {renderTopBar()}
        
        <View style={styles.canvasContainer} ref={canvasRef} collapsable={false}>
          {/* Background Image */}
          {backgroundImage && (
            <Image 
              source={{ uri: backgroundImage }} 
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          )}
          
          {/* Only add white background if no image */}
          {!backgroundImage && <View style={styles.whiteBackground} />}
          
          <View style={styles.svgContainer} {...panResponder.panHandlers} collapsable={false}>
            <Svg 
              style={styles.canvas}
              width="100%" 
              height="100%"
            >
              {/* Render all completed paths */}
              {paths.map((drawingPath, index) => (
                <Path
                  key={index}
                  d={drawingPath.path}
                  stroke={drawingPath.color}
                  strokeWidth={drawingPath.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={drawingPath.color === '#FFFFFF' ? 0.9 : 1}
                />
              ))}
              
              {/* Render current path being drawn */}
              {currentPath !== '' && (
                <Path
                  d={currentPath}
                  stroke={isErasing ? '#FFFFFF' : selectedColor}
                  strokeWidth={isErasing ? selectedStrokeWidth * 1.5 : selectedStrokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={isErasing ? 0.9 : 1}
                />
              )}
            </Svg>
          </View>
        </View>

        {showTools && (
          <View style={styles.toolsContainer}>
            {renderColorPicker()}
            <View style={styles.bottomToolsRow}>
              {renderEraserButton()}
              {renderStrokeWidthPicker()}
            </View>
          </View>
        )}

        {showTools && renderBottomBar()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.black,
  },
  topBarLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  topBarButton: {
    padding: Spacing.sm,
  },
  title: {
    color: Colors.white,
    fontWeight: '600',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
  },
  whiteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
  },
  svgContainer: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  toolsContainer: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 2,
    borderWidth: 2,
    borderColor: Colors.gray600,
  },
  selectedColorButton: {
    borderColor: Colors.white,
    borderWidth: 3,
  },
  eraserButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray700,
    borderWidth: 2,
    borderColor: Colors.gray600,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedEraserButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.white,
    borderWidth: 3,
  },
  bottomToolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  eraserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strokeWidthPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
    marginLeft: Spacing.md,
  },
  strokeWidthButton: {
    width: 40,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray700,
    marginHorizontal: 2,
  },
  selectedStrokeWidthButton: {
    backgroundColor: Colors.primary,
  },
  strokeWidthPreview: {
    borderRadius: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.sm,
    backgroundColor: Colors.black,
  },
  bottomButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.gray800,
  },
});