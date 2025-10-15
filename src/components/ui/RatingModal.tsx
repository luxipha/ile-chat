import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  title?: string;
  subtitle?: string;
  userInfo?: {
    name: string;
    avatar?: string;
  };
  hideUserInfo?: boolean;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  onSubmit,
  title = 'Rate Trading Partner',
  subtitle = 'How was your trading experience?',
  userInfo,
  hideUserInfo = false,
}) => {
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (rating === 0) return;
    
    onSubmit(rating);
    setRating(0); // Reset for next time
    onClose();
  };

  const handleClose = () => {
    setRating(0); // Reset on close
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Typography variant="h3" style={styles.title}>
                  {title}
                </Typography>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={Colors.gray600} />
                </TouchableOpacity>
              </View>

              {/* User Info */}
              {userInfo && !hideUserInfo && (
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <MaterialIcons name="person" size={24} color={Colors.gray600} />
                  </View>
                  <Typography variant="body1" style={styles.userName}>
                    {userInfo.name}
                  </Typography>
                </View>
              )}

              {/* Subtitle */}
              <Typography 
                variant="body2" 
                color="textSecondary" 
                style={styles.subtitle}
              >
                {subtitle}
              </Typography>

              {/* Star Rating */}
              <View style={styles.ratingContainer}>
                <StarRating
                  initialRating={rating}
                  onRatingChange={setRating}
                  size={40}
                  showText={true}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={handleClose}
                  style={styles.cancelButton}
                />
                <Button
                  title="Submit Rating"
                  onPress={handleSubmit}
                  disabled={rating === 0}
                  style={styles.submitButton}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  userName: {
    fontWeight: '500',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});