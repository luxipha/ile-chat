import React, { useState } from 'react';
import { Modal, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { GameWebView } from './GameWebView';
import { Typography } from '../ui/Typography';
import { Colors, Spacing, Layout } from '../../theme';

interface GameModalProps {
  visible: boolean;
  onClose: () => void;
  gameUrl: string;
  gameTitle?: string;
}

export const GameModal: React.FC<GameModalProps> = ({
  visible,
  onClose,
  gameUrl,
  gameTitle = 'Game',
}) => {
  const [currentScore, setCurrentScore] = useState(0);
  const [totalBricks, setTotalBricks] = useState(0);

  const handleScore = (score: number) => {
    setCurrentScore(score);
  };

  const handleGameEnd = (data: { score: number; level?: number; time?: number }) => {
    console.log('Game ended with data:', data);
    // Game end logic is handled in GameWebView
  };

  const handleRewards = (bricks: number) => {
    setTotalBricks(prev => prev + bricks);
    // Here you would integrate with your actual brick/rewards system
    // e.g., call your backend API to award bricks to the user
    console.log(`Awarded ${bricks} bricks. Total session bricks: ${totalBricks + bricks}`);
  };

  const handleClose = () => {
    if (totalBricks > 0) {
      Alert.alert(
        'Game Session Complete',
        `You earned a total of ${totalBricks} Bricks this session!`,
        [
          { text: 'Play Again', onPress: () => setTotalBricks(0) },
          { text: 'Close', onPress: () => {
              setTotalBricks(0);
              setCurrentScore(0);
              onClose();
            }, style: 'default' }
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <View style={styles.container}>
        {/* Header - Fixed at top */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Typography variant="h3" color="primary">
              {gameTitle}
            </Typography>
            {currentScore > 0 && (
              <Typography variant="caption" color="textSecondary">
                Score: {currentScore}
              </Typography>
            )}
          </View>
          <View style={styles.headerRight}>
            {totalBricks > 0 && (
              <View style={styles.bricksContainer}>
                <MaterialIcons name="star" size={16} color={Colors.secondary} />
                <Typography variant="caption" color="primary">
                  {totalBricks} Bricks
                </Typography>
              </View>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
              testID="game-modal-close-button"
            >
              <MaterialIcons name="close" size={24} color={Colors.gray700} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Game Container - Fills remaining space */}
        <View style={styles.gameContainer}>
          <GameWebView
            gameUrl={gameUrl}
            onScore={handleScore}
            onGameEnd={handleGameEnd}
            onRewards={handleRewards}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 50, // Add padding for status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    height: 70,
    position: 'relative',
    zIndex: 1000,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bricksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.gray50,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: 0,
  },
});