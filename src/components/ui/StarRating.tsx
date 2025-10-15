import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Colors, Spacing } from '../../theme';

interface StarRatingProps {
  initialRating?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  showText?: boolean;
  maxRating?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  initialRating = 0,
  onRatingChange,
  readonly = false,
  size = 24,
  showText = true,
  maxRating = 5,
}) => {
  const [rating, setRating] = useState(initialRating);

  const handleStarPress = (selectedRating: number) => {
    if (readonly) return;
    
    setRating(selectedRating);
    onRatingChange?.(selectedRating);
  };

  const getRatingText = (rating: number) => {
    if (rating === 0) return 'No rating';
    if (rating === 1) return 'Poor';
    if (rating === 2) return 'Fair';
    if (rating === 3) return 'Good';
    if (rating === 4) return 'Very Good';
    if (rating === 5) return 'Excellent';
    return `${rating} stars`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= rating;
          
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleStarPress(starNumber)}
              disabled={readonly}
              style={styles.starButton}
            >
              <MaterialIcons
                name={isFilled ? 'star' : 'star-border'}
                size={size}
                color={isFilled ? Colors.warning : Colors.gray400}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      
      {showText && (
        <Typography 
          variant="caption" 
          style={[styles.ratingText, { marginLeft: Spacing.sm }]}
          color="textSecondary"
        >
          {getRatingText(rating)}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 2,
  },
  ratingText: {
    fontSize: 12,
  },
});