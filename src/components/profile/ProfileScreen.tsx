import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { clearAvatarCache } from '../ui/Avatar';
import { Colors, Spacing, BorderRadius, Layout } from '../../theme';
import authService from '../../services/authService';
import profileService from '../../services/profileService';
import { API_BASE_URL } from '../../config/apiConfig';

interface ProfileScreenProps {
  onBack: () => void;
  onEditProfile: () => void;
}

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  region?: string;
  address?: string;
  bio?: string;
  avatar?: string;
  bricks?: number;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onEditProfile,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Date of birth separate inputs
  const [dobMonth, setDobMonth] = useState<string>('');
  const [dobDay, setDobDay] = useState<string>('');
  const [dobYear, setDobYear] = useState<string>('');
  
  // Image preview states
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  
  const slideAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async (forceRefresh = false) => {
    try {
      const currentUser = await authService.getCachedUser();
      if (currentUser) {
        const profileResult = await profileService.getUserProfile(currentUser.id, forceRefresh);
        if (profileResult.success && profileResult.profile) {
          console.log('🔄 Profile loaded from service:', profileResult.profile);
          console.log('🖼️ Avatar from profile service:', profileResult.profile.avatar);
          setUserProfile({
            id: currentUser.id,
            name: profileResult.profile.name || currentUser.name || '',
            email: currentUser.email, // Use email from Firebase auth
            phone: undefined, // Phone not available in ChatUserProfile
            gender: undefined, // Gender not available in ChatUserProfile
            dateOfBirth: undefined, // Date of birth not available in ChatUserProfile
            region: undefined, // Region not available in ChatUserProfile
            address: undefined, // Address not available in ChatUserProfile
            bio: undefined, // Bio not available in ChatUserProfile
            avatar: profileResult.profile.avatar,
            bricks: 0,
          });
        } else {
          // Fallback to basic user data
          setUserProfile({
            id: currentUser.id,
            name: currentUser.name || '',
            email: currentUser.email, // Use email from Firebase auth
            bricks: 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleEditField = (field: string, currentValue?: string) => {
    setEditField(field);
    setEditValue(currentValue || '');
    
    // Handle date of birth separately
    if (field === 'Date of Birth' && currentValue) {
      const dateParts = currentValue.split('-');
      if (dateParts.length === 3) {
        setDobYear(dateParts[0]);
        setDobMonth(dateParts[1]);
        setDobDay(dateParts[2]);
      } else {
        setDobMonth('');
        setDobDay('');
        setDobYear('');
      }
    } else if (field === 'Date of Birth') {
      setDobMonth('');
      setDobDay('');
      setDobYear('');
    }
    
    setShowEditModal(true);
    
    // Animate slide in
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseModal = () => {
    // Animate slide out
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowEditModal(false);
      setEditField('');
      setEditValue('');
      setSelectedImageUri(null); // Clear selected image when closing modal
      // Clear date of birth inputs
      setDobMonth('');
      setDobDay('');
      setDobYear('');
    });
  };

  const handleSaveField = async () => {
    if (!userProfile || !editField) return;
    
    setUpdating(true);
    try {
      // Map field names to profile update format
      const fieldMap: { [key: string]: string } = {
        'Name': 'name',
        'Email': 'email',
        'Phone Number': 'phone',
        'Gender': 'gender',
        'Date of Birth': 'dateOfBirth',
        'Region': 'region',
        'Address': 'address',
        'Bio': 'bio',
      };

      const updateField = fieldMap[editField];
      if (!updateField) {
        throw new Error('Invalid field');
      }

      let valueToSave = editValue;
      
      // Handle date of birth specially
      if (editField === 'Date of Birth') {
        if (dobMonth && dobDay && dobYear) {
          // Validate date components
          const month = parseInt(dobMonth);
          const day = parseInt(dobDay);
          const year = parseInt(dobYear);
          
          if (month < 1 || month > 12) {
            Alert.alert('Invalid Date', 'Month must be between 1 and 12');
            return;
          }
          
          if (day < 1 || day > 31) {
            Alert.alert('Invalid Date', 'Day must be between 1 and 31');
            return;
          }
          
          if (year < 1900 || year > new Date().getFullYear()) {
            Alert.alert('Invalid Date', 'Please enter a valid year');
            return;
          }
          
          // Format as YYYY-MM-DD
          valueToSave = `${year}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
          
          // Validate the complete date
          const date = new Date(valueToSave);
          if (date.toISOString().split('T')[0] !== valueToSave) {
            Alert.alert('Invalid Date', 'Please enter a valid date');
            return;
          }
        } else {
          valueToSave = '';
        }
      }

      // Update profile via service
      const updateData = { [updateField]: valueToSave };
      const result = await profileService.updateProfile(updateData);
      
      if (result.success) {
        // Update local state
        setUserProfile(prev => prev ? { ...prev, [updateField]: valueToSave } : null);
        handleCloseModal();
        Alert.alert('Success', `${editField} updated successfully`);
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSpecialFieldEdit = (field: string) => {
    if (field === 'Profile Picture') {
      setEditField(field);
      setEditValue('');
      setShowEditModal(true);
      
      // Animate slide in
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (field === 'Bricks') {
      Alert.alert('Bricks', `You have ${userProfile?.bricks || 0} bricks.\n\nView earning history and manage your rewards.`);
    } else {
      handleEditField(field, getFieldValue(field));
    }
  };

  // Image compression utility function
  const compressImage = async (imageUri: string): Promise<string> => {
    console.log('🔄 Starting image compression for URI:', imageUri);
    
    try {
      // Get image info first
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );
      
      console.log('📏 Original image info:', imageInfo);
      
      // If image is already small enough, return as is
      if (imageInfo.width <= 600 && imageInfo.height <= 600) {
        console.log('✅ Image already optimized, no compression needed');
        return imageUri;
      }
      
      // Calculate new dimensions while maintaining aspect ratio
      const maxDimension = 600; // Reduced from 800 to prevent memory issues
      const aspectRatio = imageInfo.width / imageInfo.height;
      let newWidth, newHeight;
      
      if (imageInfo.width > imageInfo.height) {
        newWidth = maxDimension;
        newHeight = maxDimension / aspectRatio;
      } else {
        newHeight = maxDimension;
        newWidth = maxDimension * aspectRatio;
      }
      
      console.log('🔄 Compressing image to dimensions:', { newWidth, newHeight });
      
      // Compress the image
      const compressedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: newWidth, height: newHeight } }],
        { 
          compress: 0.7, // Reduced to 70% quality for better performance
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      
      console.log('✅ Image compressed successfully:', compressedImage);
      return compressedImage.uri;
    } catch (error) {
      console.error('❌ Error compressing image:', error);
      // Return original URI if compression fails
      return imageUri;
    }
  };

  const handleImagePicker = async (type: 'camera' | 'gallery') => {
    try {
      console.log('🖼️ Starting image picker with type:', type);
      
      // Request permissions
      if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        console.log('📷 Camera permission status:', status);
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('📱 Gallery permission status:', status);
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
          return;
        }
      }

      // Launch image picker
       let result;
       if (type === 'camera') {
         console.log('📷 Launching camera...');
         result = await ImagePicker.launchCameraAsync({
           mediaTypes: "images",
           allowsEditing: true,
           aspect: [1, 1],
           quality: 0.8,
         });
       } else {
         console.log('📱 Launching image library...');
         result = await ImagePicker.launchImageLibraryAsync({
           mediaTypes: "images",
           allowsEditing: true,
           aspect: [1, 1],
           quality: 0.8,
         });
       }

      console.log('🖼️ Image picker result:', result);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('❌ Image picker was canceled or no assets');
        return;
      }

      const imageUri = result.assets[0].uri;
      console.log('✅ Selected image URI:', imageUri);
      
      // Compress the image before setting it for preview
      console.log('🔄 Compressing image before preview...');
      const compressedUri = await compressImage(imageUri);
      console.log('✅ Image compression completed, using URI:', compressedUri);
      
      // Set selected image for preview in the same modal
      console.log('🔄 Setting selectedImageUri to:', compressedUri);
      setSelectedImageUri(compressedUri);
      console.log('✅ Image selected and set for preview in modal');
      
    } catch (error) {
      console.error('❌ Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleSaveProfilePicture = async () => {
    console.log('🔄 handleSaveProfilePicture started');
    if (!selectedImageUri) {
      console.log('❌ No selectedImageUri, returning');
      return;
    }
    
    try {
      console.log('🔄 Setting uploadingImage to true');
      setUploadingImage(true);
      
      console.log('🔄 About to call uploadProfilePicture with URI:', selectedImageUri);
      await uploadProfilePicture(selectedImageUri);
      
      console.log('✅ uploadProfilePicture completed successfully');
      console.log('🔄 Clearing selectedImageUri and closing modal');
      setSelectedImageUri(null);
      setShowEditModal(false);
      
      // Force refresh profile to ensure UI reflects the updated avatar
      console.log('🔄 Force refreshing profile to reflect updated avatar');
      await loadUserProfile(true);
      
      console.log('✅ handleSaveProfilePicture completed successfully');
    } catch (error) {
      console.error('❌ Error in handleSaveProfilePicture:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      console.log('🔄 Setting uploadingImage to false in finally block');
      setUploadingImage(false);
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    console.log('📤 uploadProfilePicture started with URI:', imageUri);
    
    try {
      console.log('📷 Starting profile picture upload...', { imageUri });

      console.log('🔄 Creating FormData object');
      // Create FormData for image upload
      const formData = new FormData();
      
      console.log('🔄 Appending image to FormData');
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      } as any);

      console.log('🔄 Getting current user');
      // Get auth token
      const currentUser = await authService.getCachedUser();
      if (!currentUser) {
        console.log('❌ No current user found');
        Alert.alert('Error', 'Please log in to upload profile picture.');
        return;
      }

      console.log('🔄 Getting auth token');
      const token = await authService.getToken();
      if (!token) {
        console.log('❌ No auth token found');
        Alert.alert('Error', 'Authentication required for image upload.');
        return;
      }

      // Upload image to backend using the same endpoint as chat
      console.log('📤 Uploading profile picture to backend...');
      const uploadUrl = `${API_BASE_URL}/api/firebase-auth/upload-image`;
      
      console.log('🔄 Creating AbortController for timeout');
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Request timeout triggered');
        controller.abort();
      }, 30000); // 30 second timeout
      
      console.log('🔄 Making fetch request to upload endpoint');
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      });
      
      console.log('📡 Fetch response received, status:', uploadResponse.status);
      clearTimeout(timeoutId);

      if (!uploadResponse.ok) {
        console.log('❌ Response not ok, status:', uploadResponse.status);
        const errorText = await uploadResponse.text();
        console.error('❌ Profile picture upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error: errorText
        });
        Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
        return;
      }

      console.log('🔄 Parsing response JSON');
      const uploadData = await uploadResponse.json();
      console.log('✅ Upload response data:', uploadData);
      
      if (!uploadData.success) {
        console.error('❌ Profile picture upload failed:', uploadData.error);
        Alert.alert('Error', uploadData.error || 'Failed to upload profile picture.');
        return;
      }

      const imageUrl = uploadData.imageUrl || uploadData.url;
      if (!imageUrl) {
        console.error('❌ No image URL returned from upload');
        Alert.alert('Error', 'Failed to get uploaded image URL.');
        return;
      }

      console.log('✅ Profile picture uploaded successfully:', imageUrl);

      console.log('🔄 Updating user profile with new image URL:', imageUrl);
      // Update user profile with new avatar using the correct API endpoint
      if (!userProfile?.id) {
        throw new Error('User profile ID not found');
      }
      const updateResult = await profileService.updateUserProfile(userProfile.id, { avatar: imageUrl });
      
      if (updateResult.success && updateResult.profile) {
        console.log('✅ User profile updated successfully');
        // Update local state
        setUserProfile(prev => prev ? { ...prev, avatar: imageUrl } : null);
        
        // Clear avatar cache so all Avatar components update immediately
        clearAvatarCache(userProfile.id);
        
        Alert.alert('Success', 'Profile picture updated successfully!');
        setShowEditModal(false);
      } else {
        console.error('❌ Failed to update profile with new avatar:', updateResult.error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }

    } catch (error) {
      console.error('❌ Error in uploadProfilePicture:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏰ Request was aborted due to timeout');
        Alert.alert('Timeout', 'Upload timed out. Please check your connection and try again.');
      } else {
        console.log('❌ General upload error');
        Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
      }
    }
  };

  const removeProfilePicture = async () => {
    try {
      setUploadingImage(true);
      
      // Update profile with empty avatar
      await authService.updateProfile({ avatar: '' });
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, avatar: '' } : null);
      
      Alert.alert('Success', 'Profile picture removed successfully');
    } catch (error) {
      console.error('Error removing profile picture:', error);
      Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const getFieldValue = (field: string): string => {
    if (!userProfile) return '';
    
    switch (field) {
      case 'Name': return userProfile.name;
      case 'Email': return userProfile.email || '';
      case 'Phone Number': return userProfile.phone || '';
      case 'Gender': return userProfile.gender || '';
      case 'Date of Birth': return userProfile.dateOfBirth || '';
      case 'Region': return userProfile.region || '';
      case 'Address': return userProfile.address || '';
      case 'Bio': return userProfile.bio || '';
      default: return '';
    }
  };

  const getFieldType = (field: string): 'text' | 'email' | 'phone' | 'multiline' => {
    switch (field) {
      case 'Email': return 'email';
      case 'Phone Number': return 'phone';
      case 'Bio': return 'multiline';
      default: return 'text';
    }
  };

  const renderProfileItem = (
    icon: string,
    title: string,
    value?: string,
    onPress?: () => void,
    showVerificationStatus: boolean = false,
    isVerified: boolean = false,
    isRequired: boolean = false
  ) => (
    <TouchableOpacity 
      style={styles.profileItem} 
      onPress={onPress || (() => handleSpecialFieldEdit(title))}
    >
      <MaterialIcons name={icon as any} size={24} color={Colors.primary} />
      <View style={styles.profileContent}>
        <Typography variant="h6" style={styles.profileTitle}>
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color={value ? "text" : "textSecondary"}
          style={styles.profileValue}
        >
          {value || 'Not set'}
        </Typography>
      </View>
      
      {showVerificationStatus && (
        <View style={styles.verificationStatus}>
          {isVerified ? (
            <MaterialIcons name="check-circle" size={16} color={Colors.success} />
          ) : isRequired ? (
            <MaterialIcons name="error" size={16} color={Colors.error} />
          ) : (
            <MaterialIcons name="schedule" size={16} color={Colors.warning} />
          )}
        </View>
      )}
      
      <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Typography variant="h3">Profile</Typography>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Typography variant="body1" color="textSecondary">Loading profile...</Typography>
        </View>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Typography variant="h3">Profile</Typography>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Typography variant="body1" color="textSecondary">Profile not found</Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Typography variant="h3">Profile</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture */}
        {renderProfileItem(
          'account-circle',
          'Profile Picture',
          userProfile.avatar ? 'Set' : undefined
        )}

        {/* Username */}
        {renderProfileItem(
          'person',
          'Name',
          userProfile.name
        )}

        {/* Email */}
        {renderProfileItem(
          'email',
          'Email',
          userProfile.email,
          undefined,
          true,
          !!userProfile.email,
          false
        )}

        {/* Phone */}
        {renderProfileItem(
          'phone',
          'Phone Number',
          userProfile.phone,
          undefined,
          true,
          !!userProfile.phone,
          false
        )}

        {/* Gender */}
        {renderProfileItem(
          'wc',
          'Gender',
          userProfile.gender
        )}

        {/* Date of Birth */}
        {renderProfileItem(
          'cake',
          'Date of Birth',
          userProfile.dateOfBirth,
          undefined,
          true,
          !!userProfile.dateOfBirth,
          true
        )}

        {/* Region */}
        {renderProfileItem(
          'location-on',
          'Region',
          userProfile.region
        )}

        {/* Address */}
        {renderProfileItem(
          'home',
          'Address',
          userProfile.address,
          undefined,
          true,
          !!userProfile.address,
          true
        )}

        {/* Bio */}
        {renderProfileItem(
          'description',
          'Bio',
          userProfile.bio
        )}

        {/* Bricks */}
        {renderProfileItem(
          'grain',
          'Bricks',
          userProfile.bricks ? `${userProfile.bricks.toLocaleString()} Bricks` : '0 Bricks'
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.editModal,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <SafeAreaView style={styles.editModalContent}>
              {/* Header */}
              <View style={styles.editModalHeader}>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Typography variant="h6" style={styles.cancelText}>Cancel</Typography>
                </TouchableOpacity>
                <Typography variant="h5" style={styles.editModalTitle}>
                  Edit {editField}
                </Typography>
                <TouchableOpacity 
                  onPress={editField === 'Profile Picture' ? handleSaveProfilePicture : handleSaveField} 
                  disabled={editField === 'Profile Picture' ? (uploadingImage || !selectedImageUri) : updating}
                >
                  <Typography 
                    variant="h6" 
                    style={[
                      styles.saveText, 
                      (editField === 'Profile Picture' ? (uploadingImage || !selectedImageUri) : updating) && styles.disabledText
                    ]}
                  >
                    {editField === 'Profile Picture' ? 
                      (uploadingImage ? 'Uploading...' : 'Save Photo') : 
                      (updating ? 'Saving...' : 'Save')
                    }
                  </Typography>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.editModalBody}>
                {editField === 'Profile Picture' ? (
                  // Profile Picture Upload Interface
                  <>
                    <Typography variant="body1" style={styles.fieldLabel}>
                      Profile Picture
                    </Typography>
                    
                    {/* Current/Selected Avatar Preview */}
                    <View style={styles.avatarPreviewContainer}>
                      <View style={styles.avatarPreview}>
                        {selectedImageUri ? (
                          <Image 
                            source={{ uri: selectedImageUri }} 
                            style={styles.avatarPreviewImage}
                            onLoadStart={() => console.log('🔄 Preview image load started')}
                            onLoad={() => console.log('✅ Preview image loaded successfully')}
                            onError={(error) => console.log('❌ Preview image load error:', error)}
                          />
                        ) : userProfile?.avatar ? (
                          <Image source={{ uri: userProfile.avatar }} style={styles.avatarPreviewImage} />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <MaterialIcons name="account-circle" size={80} color={Colors.gray400} />
                          </View>
                        )}
                      </View>
                      <Typography variant="body2" color="textSecondary" style={styles.avatarPreviewText}>
                        {selectedImageUri ? 'Selected image - click Save Photo to upload' : 
                         userProfile?.avatar ? 'Current profile picture' : 'No profile picture set'}
                      </Typography>
                    </View>

                    {/* Upload Options */}
                    <View style={styles.uploadOptions}>
                      <TouchableOpacity 
                        style={[styles.uploadOption, uploadingImage && styles.disabledOption]} 
                        onPress={() => handleImagePicker('camera')}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                          <MaterialIcons name="camera-alt" size={24} color={Colors.primary} />
                        )}
                        <View style={styles.uploadOptionContent}>
                          <Typography variant="h6" style={styles.uploadOptionText}>
                            Take Photo
                          </Typography>
                          <Typography variant="body2" color="textSecondary" style={styles.uploadOptionSubtext}>
                            Use camera to take a new photo
                          </Typography>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.uploadOption, uploadingImage && styles.disabledOption]} 
                        onPress={() => handleImagePicker('gallery')}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                          <MaterialIcons name="photo-library" size={24} color={Colors.primary} />
                        )}
                        <View style={styles.uploadOptionContent}>
                          <Typography variant="h6" style={styles.uploadOptionText}>
                            Choose from Gallery
                          </Typography>
                          <Typography variant="body2" color="textSecondary" style={styles.uploadOptionSubtext}>
                            Select an existing photo
                          </Typography>
                        </View>
                      </TouchableOpacity>

                      {selectedImageUri && (
                        <TouchableOpacity 
                          style={[styles.uploadOption, styles.clearOption]} 
                          onPress={() => {
                            setSelectedImageUri(null);
                            console.log('🔄 Cleared selected image');
                          }}
                        >
                          <MaterialIcons name="clear" size={24} color={Colors.warning} />
                          <View style={styles.uploadOptionContent}>
                            <Typography variant="h6" style={[styles.uploadOptionText, { color: Colors.warning }]}>
                              Clear Selection
                            </Typography>
                            <Typography variant="body2" color="textSecondary" style={styles.uploadOptionSubtext}>
                              Remove selected image
                            </Typography>
                          </View>
                        </TouchableOpacity>
                      )}

                      {userProfile?.avatar && !selectedImageUri && (
                        <TouchableOpacity 
                          style={[styles.uploadOption, styles.removeOption]} 
                          onPress={() => {
                            Alert.alert(
                              'Remove Photo',
                              'Are you sure you want to remove your profile picture?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Remove', style: 'destructive', onPress: removeProfilePicture }
                              ]
                            );
                          }}
                        >
                          <MaterialIcons name="delete" size={24} color={Colors.error} />
                          <View style={styles.uploadOptionContent}>
                            <Typography variant="h6" style={[styles.uploadOptionText, { color: Colors.error }]}>
                              Remove Photo
                            </Typography>
                            <Typography variant="body2" color="textSecondary" style={styles.uploadOptionSubtext}>
                              Delete current profile picture
                            </Typography>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    {editField === 'Gender' ? (
                      <>
                        <Typography variant="body1" style={styles.fieldLabel}>
                          {editField}
                        </Typography>
                        <View style={styles.genderOptions}>
                          {['Male', 'Female'].map((gender) => (
                            <TouchableOpacity
                              key={gender}
                              style={[
                                styles.genderOption,
                                editValue === gender && styles.selectedGenderOption
                              ]}
                              onPress={() => setEditValue(gender)}
                            >
                              <Typography 
                                variant="body1" 
                                style={[
                                  styles.genderOptionText,
                                  editValue === gender && styles.selectedGenderOptionText
                                ]}
                              >
                                {gender}
                              </Typography>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    ) : editField === 'Date of Birth' ? (
                      <>
                        <Typography variant="body1" style={styles.fieldLabel}>
                          {editField}
                        </Typography>
                        <View style={styles.dateInputContainer}>
                          <View style={styles.dateInputGroup}>
                            <Typography variant="body2" style={styles.dateInputLabel}>
                              Month
                            </Typography>
                            <TextInput
                              style={[styles.textInput, styles.dateInput]}
                              value={dobMonth}
                              onChangeText={setDobMonth}
                              placeholder="MM"
                              placeholderTextColor={Colors.gray400}
                              keyboardType="numeric"
                              maxLength={2}
                              autoFocus={true}
                            />
                          </View>
                          <View style={styles.dateInputGroup}>
                            <Typography variant="body2" style={styles.dateInputLabel}>
                              Day
                            </Typography>
                            <TextInput
                              style={[styles.textInput, styles.dateInput]}
                              value={dobDay}
                              onChangeText={setDobDay}
                              placeholder="DD"
                              placeholderTextColor={Colors.gray400}
                              keyboardType="numeric"
                              maxLength={2}
                            />
                          </View>
                          <View style={styles.dateInputGroup}>
                            <Typography variant="body2" style={styles.dateInputLabel}>
                              Year
                            </Typography>
                            <TextInput
                              style={[styles.textInput, styles.dateInput]}
                              value={dobYear}
                              onChangeText={setDobYear}
                              placeholder="YYYY"
                              placeholderTextColor={Colors.gray400}
                              keyboardType="numeric"
                              maxLength={4}
                            />
                          </View>
                        </View>
                      </>
                    ) : (
                      <>
                        <Typography variant="body1" style={styles.fieldLabel}>
                          {editField}
                        </Typography>
                        <TextInput
                          style={[
                            styles.textInput,
                            getFieldType(editField) === 'multiline' && styles.multilineInput
                          ]}
                          value={editValue}
                          onChangeText={setEditValue}
                          placeholder={`Enter your ${editField.toLowerCase()}`}
                          placeholderTextColor={Colors.gray400}
                          keyboardType={
                            getFieldType(editField) === 'email' ? 'email-address' :
                            getFieldType(editField) === 'phone' ? 'phone-pad' : 'default'
                          }
                          multiline={getFieldType(editField) === 'multiline'}
                          numberOfLines={getFieldType(editField) === 'multiline' ? 4 : 1}
                          autoFocus={true}
                        />
                      </>
                    )}
                  </>
                )}
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

    </View>
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
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  profileContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  profileValue: {
    fontSize: 14,
  },
  verificationStatus: {
    marginRight: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    ...Layout.modal.standard,
  },
  editModalContent: {
    flex: 1,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  editModalTitle: {
    fontWeight: '600',
  },
  cancelText: {
    color: Colors.gray600,
  },
  saveText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  disabledText: {
    color: Colors.gray400,
  },
  editModalBody: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xl * 1.5,
  },
  fieldLabel: {
    marginBottom: Spacing.lg,
    fontWeight: '500',
    color: Colors.gray600,
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 18,
    color: Colors.gray900,
    backgroundColor: Colors.background,
    minHeight: 50,
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  genderOptions: {
    marginTop: Spacing.xl,
  },
  genderOption: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
    minHeight: 55,
    justifyContent: 'center',
  },
  selectedGenderOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  genderOptionText: {
    textAlign: 'center',
    color: Colors.gray900,
  },
  selectedGenderOptionText: {
    color: Colors.white,
    fontWeight: '600',
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewText: {
    textAlign: 'center',
  },
  uploadOptions: {
    marginTop: Spacing.lg,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  removeOption: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '20',
  },
  clearOption: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warning + '20',
  },
  uploadOptionContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  uploadOptionText: {
    fontWeight: '500',
    marginBottom: 2,
  },
  uploadOptionSubtext: {
    fontSize: 12,
  },
  disabledOption: {
    opacity: 0.6,
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  dateInputGroup: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  dateInputLabel: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
    color: Colors.gray600,
    fontSize: 14,
    textAlign: 'center',
  },
  dateInput: {
    textAlign: 'center',
    flex: 1,
  },
});