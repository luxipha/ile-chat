import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { ValidationError } from '../ui/ErrorMessage';
import { Avatar } from '../ui/Avatar';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { validateTextContent } from '../../utils/validation';

interface CreateMomentModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCreateMoment: (content: string, image?: string) => Promise<void>;
  currentUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export const CreateMomentModal: React.FC<CreateMomentModalProps> = ({
  isVisible,
  onClose,
  onCreateMoment,
  currentUser,
}) => {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const handleImageSelect = () => {
    if (selectedImage) {
      // Remove current image
      setSelectedImage(null);
      return;
    }

    // For web environment, use file input
    if (typeof window !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setSelectedImage(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // For mobile, would use expo-image-picker
      // Mock for now
      const mockImages = [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
        'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400',
        'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400',
        'https://images.unsplash.com/photo-1565402170291-8491f14678db?w=400',
      ];
      const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
      setSelectedImage(randomImage);
    }
  };

  const handlePost = async () => {
    console.log('📝 CreateMomentModal.handlePost() called');
    
    // Validate content
    const contentValidation = validateTextContent(content, 1, 500);
    if (!contentValidation.isValid) {
      setContentError(contentValidation.error || 'Content is required');
      return;
    }
    
    setContentError(null);
    setIsPosting(true);
    
    try {
      console.log('🔄 Calling onCreateMoment with real API...');
      await onCreateMoment(content, selectedImage || undefined);
      
      console.log('✅ Post created successfully, clearing form...');
      setContent('');
      setSelectedImage(null);
      setIsPosting(false);
      onClose();
    } catch (error) {
      console.error('❌ Failed to create post:', error);
      setContentError('Failed to create post. Please try again.');
      setIsPosting(false);
    }
  };

  const handleClose = () => {
    if (content.trim() || selectedImage) {
      // Check for actual web environment (window.confirm exists)
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        if (window.confirm('Discard Moment? Your moment will be lost if you go back now.')) {
          setContent('');
          setSelectedImage(null);
          setContentError(null);
          onClose();
        }
      } else {
        Alert.alert(
          'Discard Moment?',
          'Your moment will be lost if you go back now.',
          [
            { text: 'Keep Editing', style: 'cancel' },
            { 
              text: 'Discard', 
              style: 'destructive', 
              onPress: () => {
                setContent('');
                setSelectedImage(null);
                setContentError(null);
                onClose();
              }
            }
          ]
        );
      }
    } else {
      setContent('');
      setSelectedImage(null);
      setContentError(null);
      onClose();
    }
  };
  
  const handleContentChange = (text: string) => {
    setContent(text);
    // Clear error when user starts typing
    if (contentError && text.trim()) {
      setContentError(null);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Typography variant="body1" style={styles.cancelText}>
              Cancel
            </Typography>
          </TouchableOpacity>
          
          <Typography variant="h6" style={styles.title}>
            Create Moment
          </Typography>

          <Button
            title={isPosting ? 'Posting...' : 'Post'}
            onPress={handlePost}
            disabled={!content.trim() || isPosting}
            style={styles.postButton}
          />
        </View>

        <ScrollView style={styles.content}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <Avatar
              name={currentUser?.name || 'User'}
              imageUrl={undefined}
              size="medium"
              
            />
            <View style={styles.userDetails}>
              <Typography variant="h6" style={styles.userName}>
                {currentUser?.name || 'User'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sharing to your network
              </Typography>
            </View>
          </View>

          {/* Content Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.textInput,
                { minHeight: 120, textAlignVertical: 'top' },
                contentError && styles.inputError
              ]}
              onChangeText={handleContentChange}
              multiline
              placeholder="What's happening in your investment journey?"
              placeholderTextColor={Colors.gray400}
              value={content}
              maxLength={500}
            />
            
            {/* Character count */}
            <View style={styles.characterCount}>
              <Typography variant="caption" color="textSecondary">
                {content.length}/500
              </Typography>
            </View>
            
            {/* Validation error */}
            {contentError && (
              <ValidationError message={contentError} />
            )}
          </View>

          {/* Selected Image */}
          {selectedImage && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity 
                onPress={() => setSelectedImage(null)}
                style={styles.removeImageButton}
              >
                <MaterialIcons name="close" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Typography variant="h6" style={styles.quickActionsTitle}>
              Quick Actions
            </Typography>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                onPress={handleImageSelect}
                style={[
                  styles.actionButton,
                  selectedImage && styles.actionButtonSelected
                ]}
              >
                <MaterialIcons 
                  name="photo-camera" 
                  size={24} 
                  color={selectedImage ? Colors.primary : Colors.gray600} 
                />
                <Typography 
                  variant="body2" 
                  style={[
                    styles.actionButtonText,
                    selectedImage && styles.actionButtonTextSelected
                  ]}
                >
                  {selectedImage ? 'Remove Photo' : 'Add Photo'}
                </Typography>
              </TouchableOpacity>

            </View>
          </View>

        </ScrollView>
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
  cancelButton: {
    paddingVertical: Spacing.sm,
  },
  cancelText: {
    color: Colors.gray600,
  },
  title: {
    fontWeight: '600',
  },
  postButton: {
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    minWidth: 80,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  userDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    backgroundColor: Colors.error + '05',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
  },
  removeImageButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    marginBottom: Spacing.xl,
  },
  quickActionsTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  actionButtonText: {
    marginLeft: Spacing.sm,
    color: Colors.gray600,
  },
  actionButtonTextSelected: {
    color: Colors.primary,
  },
  suggestions: {
    marginBottom: Spacing.xl,
  },
  suggestionsTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  suggestionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    color: Colors.gray600,
    fontStyle: 'italic',
  },
});