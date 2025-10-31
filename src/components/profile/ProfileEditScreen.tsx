import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { ErrorMessage, ValidationError } from '../ui/ErrorMessage';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { apiClient } from '../../services/api';
import { SimpleCameraScreen } from '../chat/SimpleCameraScreen';
import { styles } from '../../styles/appStyles';
import authService from '../../services/authService';

interface ProfileEditScreenProps {
  onBack: () => void;
  onSave: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  avatar?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: string;
  avatar?: string;
  general?: string;
}

export const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({
  onBack,
  onSave,
  initialProfile,
}) => {
  const [profile, setProfile] = useState<UserProfile>(
    initialProfile || {
      name: '',
      email: '',
      phone: '',
      bio: '',
      location: '',
      dateOfBirth: '',
      gender: '',
      avatar: undefined,
    }
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 50;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!profile.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!validateName(profile.name)) {
      newErrors.name = 'Name must be between 2 and 50 characters';
    }

    // Email validation
    if (!profile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(profile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional but if provided must be valid)
    if (profile.phone.trim() && !validatePhone(profile.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Bio validation (optional but limited length)
    if (profile.bio.length > 200) {
      newErrors.bio = 'Bio must be less than 200 characters';
    }

    // Location validation (optional but reasonable length)
    if (profile.location.length > 100) {
      newErrors.location = 'Location must be less than 100 characters';
    }

    // Date of birth validation (optional but must be valid date)
    if (profile.dateOfBirth.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(profile.dateOfBirth)) {
        newErrors.dateOfBirth = 'Please enter date in YYYY-MM-DD format';
      } else {
        const date = new Date(profile.dateOfBirth);
        const now = new Date();
        if (date > now) {
          newErrors.dateOfBirth = 'Date of birth cannot be in the future';
        }
        if (now.getFullYear() - date.getFullYear() > 120) {
          newErrors.dateOfBirth = 'Please enter a valid date of birth';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate random save failure for demo
      if (Math.random() < 0.1) {
        throw new Error('Failed to save profile. Please try again.');
      }
      
      onSave(profile);
      setHasUnsavedChanges(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to save profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onBack },
        ]
      );
    } else {
      onBack();
    }
  };

  // Request permissions for camera and media library
  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library access are required to upload profile pictures.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  // Upload profile picture to backend
  const uploadProfilePicture = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploadingAvatar(true);
      console.log('📸 [ProfileEdit] Starting profile picture upload...', {
        uri: imageAsset.uri,
        type: imageAsset.type,
        fileName: imageAsset.fileName
      });

      // Create FormData for file upload
      const formData = new FormData();
      
      // Create file object for upload
      const file = {
        uri: imageAsset.uri,
        type: imageAsset.mimeType || 'image/jpeg',
        name: imageAsset.fileName || `profile_${Date.now()}.jpg`,
      } as any;

      formData.append('image', file);

      console.log('📤 [ProfileEdit] Uploading to /api/firebase-auth/upload-image...');
      
      // Upload to backend using existing endpoint
      const response = await apiClient.post('/api/firebase-auth/upload-image', formData);

      if (response.success && (response.data as any)?.imageUrl) {
        console.log('✅ [ProfileEdit] Upload successful:', (response.data as any).imageUrl);
        
        const imageUrl = (response.data as any).imageUrl;
        
        // Update profile state with new avatar URL
        handleInputChange('avatar', imageUrl);
        
        // Also immediately save the avatar to the user's profile
        try {
          const currentUser = await authService.getCachedUser();
          if (currentUser?.id) {
            const profileUpdateResponse = await apiClient.put(`/api/users/profile/${currentUser.id}`, {
              avatar: imageUrl
            });
            
            if (profileUpdateResponse.success) {
              console.log('✅ [ProfileEdit] Profile avatar updated in database');
              Alert.alert('Success', 'Profile picture updated successfully!');
            } else {
              console.error('❌ [ProfileEdit] Failed to update profile:', profileUpdateResponse.error);
              Alert.alert('Warning', 'Image uploaded but failed to save to profile. Please save your profile manually.');
            }
          } else {
            console.error('❌ [ProfileEdit] Failed to get current user');
            Alert.alert('Warning', 'Image uploaded but failed to save to profile. Please save your profile manually.');
          }
        } catch (error) {
          console.error('❌ [ProfileEdit] Error updating profile:', error);
          Alert.alert('Warning', 'Image uploaded but failed to save to profile. Please save your profile manually.');
        }
      } else {
        throw new Error(response.error || 'Upload failed');
      }

    } catch (error) {
      console.error('❌ [ProfileEdit] Upload failed:', error);
      
      setErrors(prev => ({ 
        ...prev, 
        avatar: error instanceof Error ? error.message : 'Failed to upload profile picture' 
      }));
      
      Alert.alert(
        'Upload Failed', 
        'Failed to upload profile picture. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Launch camera to take photo using SimpleCameraScreen
  const takePhotoWithCamera = async () => {
    try {
      console.log('📷 [ProfileEdit] Opening camera screen...');
      setShowCamera(true);
    } catch (error) {
      console.error('❌ [ProfileEdit] Camera error:', error);
      Alert.alert('Camera Error', 'Failed to access camera. Please try again.');
    }
  };

  // Handle photo taken from camera
  const handlePhotoTaken = async (uri: string) => {
    try {
      console.log('📸 [ProfileEdit] Photo taken from camera:', uri);
      setShowCamera(false);
      
      // Convert URI to ImagePickerAsset format for uploadProfilePicture
      const imageAsset = {
        uri,
        type: 'image',
        fileName: `profile_${Date.now()}.jpg`,
        mimeType: 'image/jpeg'
      } as any;
      
      await uploadProfilePicture(imageAsset);
    } catch (error) {
      console.error('❌ [ProfileEdit] Error handling photo:', error);
      Alert.alert('Error', 'Failed to process photo. Please try again.');
    }
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      console.log('🖼️ [ProfileEdit] Opening gallery...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('🖼️ [ProfileEdit] Image selected:', result.assets[0].uri);
        await uploadProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('❌ [ProfileEdit] Gallery error:', error);
      Alert.alert('Gallery Error', 'Failed to access photo library. Please try again.');
    }
  };

  const handleAvatarPress = () => {
    if (isUploadingAvatar) {
      Alert.alert('Upload in Progress', 'Please wait for the current upload to complete.');
      return;
    }

    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: takePhotoWithCamera
        },
        { 
          text: 'Gallery', 
          onPress: pickImageFromGallery
        },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => {
            handleInputChange('avatar', '');
            // Clear any avatar-related errors
            setErrors(prev => ({ ...prev, avatar: undefined }));
          }
        },
      ]
    );
  };

  const genderOptions = ['Male', 'Female', 'Other'];

  return (
    <View style={styles.profileEditContainer}>
      {/* Header */}
      <View style={styles.profileEditHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.profileEditBackButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Typography variant="h6" style={styles.profileEditHeaderTitle}>
          Edit Profile
        </Typography>
        <Button
          title="Save"
          onPress={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          size="sm"
          style={styles.profileEditSaveButton}
        />
      </View>

      <ScrollView style={styles.profileEditContent} showsVerticalScrollIndicator={false}>
        {/* General Error */}
        {errors.general && (
          <ErrorMessage
            title="Save Failed"
            message={errors.general}
            onDismiss={() => setErrors(prev => ({ ...prev, general: undefined }))}
          />
        )}

        {/* Avatar Section */}
        <View style={styles.profileEditAvatarSection}>
          <TouchableOpacity 
            onPress={handleAvatarPress} 
            style={styles.profileEditAvatarContainer}
            disabled={isUploadingAvatar}
          >
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.profileEditAvatar} />
            ) : (
              <View style={styles.profileEditAvatarPlaceholder}>
                <MaterialIcons name="person" size={40} color={Colors.gray400} />
              </View>
            )}
            
            {/* Upload overlay */}
            {isUploadingAvatar && (
              <View style={styles.profileEditUploadOverlay}>
                <View style={styles.profileEditUploadSpinner}>
                  <Typography variant="caption" style={styles.profileEditUploadText}>
                    Uploading...
                  </Typography>
                </View>
              </View>
            )}
            
            <View style={[styles.profileEditAvatarEditIcon, isUploadingAvatar && styles.profileEditAvatarEditIconDisabled]}>
              <MaterialIcons 
                name={isUploadingAvatar ? "hourglass-empty" : "edit"} 
                size={16} 
                color={Colors.white} 
              />
            </View>
          </TouchableOpacity>
          
          <Typography variant="body2" color="textSecondary" style={styles.profileEditAvatarHint}>
            {isUploadingAvatar ? 'Uploading profile picture...' : 'Tap to change profile picture'}
          </Typography>
          
          {/* Avatar Error Message */}
          {errors.avatar && (
            <View style={styles.profileEditAvatarError}>
              <ValidationError message={errors.avatar} />
            </View>
          )}
        </View>

        {/* Form Fields */}
        <View style={styles.profileEditForm}>
          {/* Name Field */}
          <View style={styles.profileEditField}>
            <Typography variant="h6" style={styles.profileEditLabel}>
              Full Name *
            </Typography>
            <TextInput
              style={[styles.profileEditInput, errors.name && styles.profileEditInputError]}
              value={profile.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.gray400}
              maxLength={50}
            />
            {errors.name && <ValidationError message={errors.name} />}
          </View>

          {/* Email Field */}
          <View style={styles.profileEditField}>
            <Typography variant="h6" style={styles.profileEditLabel}>
              Email Address *
            </Typography>
            <TextInput
              style={[styles.profileEditInput, errors.email && styles.profileEditInputError]}
              value={profile.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email address"
              placeholderTextColor={Colors.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <ValidationError message={errors.email} />}
          </View>

          {/* Phone Field */}
          <View style={styles.profileEditField}>
            <Typography variant="h6" style={styles.profileEditLabel}>
              Phone Number
            </Typography>
            <TextInput
              style={[styles.profileEditInput, errors.phone && styles.profileEditInputError]}
              value={profile.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.gray400}
              keyboardType="phone-pad"
            />
            {errors.phone && <ValidationError message={errors.phone} />}
          </View>

          {/* Gender Field */}
          <View style={styles.profileEditField}>
            <Typography variant="h6" style={styles.profileEditLabel}>
              Gender
            </Typography>
            <TouchableOpacity
              style={styles.profileEditPickerInput}
              onPress={() => setShowGenderPicker(true)}
            >
              <Typography variant="body1" style={profile.gender ? styles.profileEditInputText : styles.profileEditPlaceholderText}>
                {profile.gender || 'Select gender'}
              </Typography>
              <MaterialIcons name="expand-more" size={24} color={Colors.gray400} />
            </TouchableOpacity>
          </View>

          {/* Date of Birth Field */}
          <View style={styles.profileEditField}>
            <Typography variant="h6" style={styles.profileEditLabel}>
              Date of Birth
            </Typography>
            <TextInput
              style={[styles.profileEditInput, errors.dateOfBirth && styles.profileEditInputError]}
              value={profile.dateOfBirth}
              onChangeText={(value) => handleInputChange('dateOfBirth', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.gray400}
              maxLength={10}
            />
            {errors.dateOfBirth && <ValidationError message={errors.dateOfBirth} />}
          </View>

          {/* Location Field */}
          <View style={styles.profileEditField}>
            <Typography variant="h6" style={styles.profileEditLabel}>
              Location
            </Typography>
            <TextInput
              style={[styles.profileEditInput, errors.location && styles.profileEditInputError]}
              value={profile.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="Enter your location"
              placeholderTextColor={Colors.gray400}
              maxLength={100}
            />
            {errors.location && <ValidationError message={errors.location} />}
          </View>

          {/* Bio Field */}
          <View style={styles.profileEditField}>
            <Typography variant="h6" style={styles.profileEditLabel}>
              Bio
            </Typography>
            <TextInput
              style={[styles.profileEditTextArea, errors.bio && styles.profileEditInputError]}
              value={profile.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              placeholder="Tell us about yourself..."
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
            <View style={styles.profileEditCharCount}>
              <Typography variant="caption" color="textSecondary">
                {profile.bio.length}/200
              </Typography>
            </View>
            {errors.bio && <ValidationError message={errors.bio} />}
          </View>
        </View>
      </ScrollView>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.profileEditModalOverlay}>
          <View style={styles.profileEditModalContent}>
            <View style={styles.profileEditModalHeader}>
              <Typography variant="h6">Select Gender</Typography>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <MaterialIcons name="close" size={24} color={Colors.gray600} />
              </TouchableOpacity>
            </View>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.profileEditModalOption}
                onPress={() => {
                  handleInputChange('gender', option);
                  setShowGenderPicker(false);
                }}
              >
                <Typography variant="body1" style={styles.profileEditModalOptionText}>
                  {option}
                </Typography>
                {profile.gender === option && (
                  <MaterialIcons name="check" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={isSaving || isUploadingAvatar}
        message={isUploadingAvatar ? "Uploading profile picture..." : "Saving profile..."}
      />

      {/* Camera Screen */}
      <SimpleCameraScreen
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onPhotoTaken={handlePhotoTaken}
      />
    </View>
  );
};

