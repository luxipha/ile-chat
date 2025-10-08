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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import authService from '../../services/authService';
import profileService from '../../services/profileService';

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
  const slideAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = await authService.getCachedUser();
      if (currentUser) {
        const profileResult = await profileService.getUserProfile(currentUser.id);
        if (profileResult.success && profileResult.profile) {
          setUserProfile({
            id: currentUser.id,
            name: profileResult.profile.name || currentUser.name || '',
            email: profileResult.profile.email || currentUser.email,
            phone: profileResult.profile.phone,
            gender: profileResult.profile.gender,
            dateOfBirth: profileResult.profile.dateOfBirth,
            region: profileResult.profile.region,
            address: profileResult.profile.address,
            bio: profileResult.profile.bio,
            avatar: profileResult.profile.avatar,
            bricks: currentUser.bricks || 0,
          });
        } else {
          // Fallback to basic user data
          setUserProfile({
            id: currentUser.id,
            name: currentUser.name || '',
            email: currentUser.email,
            bricks: currentUser.bricks || 0,
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

      // Update profile via service
      const updateData = { [updateField]: editValue };
      const result = await profileService.updateProfile(updateData);
      
      if (result.success) {
        // Update local state
        setUserProfile(prev => prev ? { ...prev, [updateField]: editValue } : null);
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

  const handleImagePicker = (type: 'camera' | 'gallery') => {
    // TODO: Implement actual image picker functionality
    console.log(`Selected ${type} for profile picture`);
    Alert.alert('Image Picker', `${type} functionality will be implemented here`);
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
          color={value ? "textPrimary" : "textSecondary"}
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
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
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
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
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
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
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
                <TouchableOpacity onPress={handleSaveField} disabled={updating}>
                  <Typography 
                    variant="h6" 
                    style={[styles.saveText, updating && styles.disabledText]}
                  >
                    {updating ? 'Saving...' : 'Save'}
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
                    
                    {/* Current Avatar Preview */}
                    <View style={styles.avatarPreviewContainer}>
                      <View style={styles.avatarPreview}>
                        {userProfile?.avatar ? (
                          <Image source={{ uri: userProfile.avatar }} style={styles.avatarPreviewImage} />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <MaterialIcons name="account-circle" size={80} color={Colors.gray400} />
                          </View>
                        )}
                      </View>
                      <Typography variant="body2" color="textSecondary" style={styles.avatarPreviewText}>
                        {userProfile?.avatar ? 'Current profile picture' : 'No profile picture set'}
                      </Typography>
                    </View>

                    {/* Upload Options */}
                    <View style={styles.uploadOptions}>
                      <TouchableOpacity 
                        style={styles.uploadOption} 
                        onPress={() => handleImagePicker('camera')}
                      >
                        <MaterialIcons name="camera-alt" size={24} color={Colors.primary} />
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
                        style={styles.uploadOption} 
                        onPress={() => handleImagePicker('gallery')}
                      >
                        <MaterialIcons name="photo-library" size={24} color={Colors.primary} />
                        <View style={styles.uploadOptionContent}>
                          <Typography variant="h6" style={styles.uploadOptionText}>
                            Choose from Gallery
                          </Typography>
                          <Typography variant="body2" color="textSecondary" style={styles.uploadOptionSubtext}>
                            Select an existing photo
                          </Typography>
                        </View>
                      </TouchableOpacity>

                      {userProfile?.avatar && (
                        <TouchableOpacity 
                          style={[styles.uploadOption, styles.removeOption]} 
                          onPress={() => {
                            Alert.alert(
                              'Remove Photo',
                              'Are you sure you want to remove your profile picture?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Remove', style: 'destructive', onPress: () => console.log('Remove photo') }
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
                  // Regular Text Input Interface
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
                    
                    {editField === 'Gender' && (
                      <View style={styles.genderOptions}>
                        {['Male', 'Female', 'Other'].map((gender) => (
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
    minHeight: 480,
    maxHeight: '90%',
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
    color: Colors.textSecondary,
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 18,
    color: Colors.textPrimary,
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
  },
  selectedGenderOptionText: {
    color: Colors.primary,
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
    borderColor: Colors.errorLight,
    backgroundColor: Colors.errorLight + '20',
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
});