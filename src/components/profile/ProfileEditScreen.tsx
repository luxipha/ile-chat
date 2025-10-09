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
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { ErrorMessage, ValidationError } from '../ui/ErrorMessage';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import { Colors, Spacing, BorderRadius } from '../../theme';

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
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  const handleAvatarPress = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => {
          // TODO: Implement camera functionality
          Alert.alert('Camera', 'Camera functionality not yet implemented');
        }},
        { text: 'Gallery', onPress: () => {
          // TODO: Implement gallery functionality  
          Alert.alert('Gallery', 'Gallery functionality not yet implemented');
        }},
        { text: 'Remove', style: 'destructive', onPress: () => handleInputChange('avatar', '') },
      ]
    );
  };

  const genderOptions = ['Male', 'Female', 'Other'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Typography variant="h6" style={styles.headerTitle}>
          Edit Profile
        </Typography>
        <Button
          title="Save"
          onPress={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          size="sm"
          style={styles.saveButton}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Error */}
        {errors.general && (
          <ErrorMessage
            title="Save Failed"
            message={errors.general}
            onDismiss={() => setErrors(prev => ({ ...prev, general: undefined }))}
          />
        )}

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={40} color={Colors.gray400} />
              </View>
            )}
            <View style={styles.avatarEditIcon}>
              <MaterialIcons name="edit" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Typography variant="body2" color="textSecondary" style={styles.avatarHint}>
            Tap to change profile picture
          </Typography>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Name Field */}
          <View style={styles.field}>
            <Typography variant="h6" style={styles.label}>
              Full Name *
            </Typography>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={profile.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.gray400}
              maxLength={50}
            />
            {errors.name && <ValidationError message={errors.name} />}
          </View>

          {/* Email Field */}
          <View style={styles.field}>
            <Typography variant="h6" style={styles.label}>
              Email Address *
            </Typography>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
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
          <View style={styles.field}>
            <Typography variant="h6" style={styles.label}>
              Phone Number
            </Typography>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={profile.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.gray400}
              keyboardType="phone-pad"
            />
            {errors.phone && <ValidationError message={errors.phone} />}
          </View>

          {/* Gender Field */}
          <View style={styles.field}>
            <Typography variant="h6" style={styles.label}>
              Gender
            </Typography>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowGenderPicker(true)}
            >
              <Typography variant="body1" style={profile.gender ? styles.inputText : styles.placeholderText}>
                {profile.gender || 'Select gender'}
              </Typography>
              <MaterialIcons name="expand-more" size={24} color={Colors.gray400} />
            </TouchableOpacity>
          </View>

          {/* Date of Birth Field */}
          <View style={styles.field}>
            <Typography variant="h6" style={styles.label}>
              Date of Birth
            </Typography>
            <TextInput
              style={[styles.input, errors.dateOfBirth && styles.inputError]}
              value={profile.dateOfBirth}
              onChangeText={(value) => handleInputChange('dateOfBirth', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.gray400}
              maxLength={10}
            />
            {errors.dateOfBirth && <ValidationError message={errors.dateOfBirth} />}
          </View>

          {/* Location Field */}
          <View style={styles.field}>
            <Typography variant="h6" style={styles.label}>
              Location
            </Typography>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              value={profile.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="Enter your location"
              placeholderTextColor={Colors.gray400}
              maxLength={100}
            />
            {errors.location && <ValidationError message={errors.location} />}
          </View>

          {/* Bio Field */}
          <View style={styles.field}>
            <Typography variant="h6" style={styles.label}>
              Bio
            </Typography>
            <TextInput
              style={[styles.textArea, errors.bio && styles.inputError]}
              value={profile.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              placeholder="Tell us about yourself..."
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
            <View style={styles.charCount}>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h6">Select Gender</Typography>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <MaterialIcons name="close" size={24} color={Colors.gray600} />
              </TouchableOpacity>
            </View>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  handleInputChange('gender', option);
                  setShowGenderPicker(false);
                }}
              >
                <Typography variant="body1" style={styles.modalOptionText}>
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
        visible={isSaving}
        message="Saving profile..."
      />
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
    borderBottomColor: Colors.gray300,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarHint: {
    textAlign: 'center',
  },
  form: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.gray900,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputText: {
    color: Colors.gray900,
  },
  placeholderText: {
    color: Colors.gray400,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.gray900,
    backgroundColor: Colors.white,
    height: 100,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray300,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  modalOptionText: {
    flex: 1,
  },
});