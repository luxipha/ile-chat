import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface SendFeedbackScreenProps {
  onBack: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'compliment' | 'other';

export const SendFeedbackScreen: React.FC<SendFeedbackScreenProps> = ({
  onBack,
}) => {
  const [selectedType, setSelectedType] = useState<FeedbackType>('improvement');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const feedbackTypes = [
    {
      id: 'bug' as FeedbackType,
      title: 'Bug Report',
      description: 'Report a problem or issue',
      icon: 'bug-report',
      color: Colors.error,
    },
    {
      id: 'feature' as FeedbackType,
      title: 'Feature Request',
      description: 'Suggest a new feature',
      icon: 'lightbulb',
      color: Colors.secondary,
    },
    {
      id: 'improvement' as FeedbackType,
      title: 'Improvement',
      description: 'Suggest an enhancement',
      icon: 'trending-up',
      color: Colors.primary,
    },
    {
      id: 'compliment' as FeedbackType,
      title: 'Compliment',
      description: 'Share positive feedback',
      icon: 'favorite',
      color: Colors.success,
    },
    {
      id: 'other' as FeedbackType,
      title: 'Other',
      description: 'General feedback',
      icon: 'chat',
      color: Colors.warning,
    },
  ];

  const canSubmit = () => {
    return subject.trim().length > 0 && message.trim().length > 10;
  };

  const handleSubmitFeedback = async () => {
    if (!canSubmit()) return;

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Feedback Sent',
        'Thank you for your feedback! We\'ll review it and get back to you if needed.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSubject('');
              setMessage('');
              onBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFeedbackTypeCard = (type: typeof feedbackTypes[0]) => (
    <TouchableOpacity
      key={type.id}
      style={[
        styles.typeCard,
        selectedType === type.id && styles.selectedTypeCard
      ]}
      onPress={() => setSelectedType(type.id)}
    >
      <View style={styles.typeCardHeader}>
        <MaterialIcons
          name={type.icon as any}
          size={24}
          color={selectedType === type.id ? Colors.primary : type.color}
        />
        <Typography
          variant="h6"
          style={[
            styles.typeCardTitle,
            selectedType === type.id && styles.selectedTypeCardTitle
          ]}
        >
          {type.title}
        </Typography>
        {selectedType === type.id && (
          <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
        )}
      </View>
      <Typography variant="body2" color="textSecondary">
        {type.description}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Typography variant="h3">Send Feedback</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Typography variant="body1" color="textSecondary" style={styles.description}>
          Help us improve ilePay by sharing your thoughts, reporting bugs, or suggesting new features.
        </Typography>

        {/* Feedback Type Selection */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            What type of feedback do you have?
          </Typography>
          
          <View style={styles.typeCardsContainer}>
            {feedbackTypes.map(renderFeedbackTypeCard)}
          </View>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Typography variant="h6" style={styles.inputLabel}>
            Subject
          </Typography>
          <TextInput
            style={styles.subjectInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief description of your feedback"
            maxLength={100}
          />
          <Typography variant="caption" color="textSecondary" style={styles.characterCount}>
            {subject.length}/100
          </Typography>
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Typography variant="h6" style={styles.inputLabel}>
            Message
          </Typography>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder={
              selectedType === 'bug' 
                ? 'Please describe the issue you encountered, including steps to reproduce it...'
                : selectedType === 'feature'
                ? 'Describe the feature you\'d like to see and how it would help you...'
                : selectedType === 'improvement'
                ? 'Tell us what could be improved and your suggestions...'
                : selectedType === 'compliment'
                ? 'Share what you love about ilePay...'
                : 'Share your thoughts, ideas, or general feedback...'
            }
            multiline
            numberOfLines={8}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Typography variant="caption" color="textSecondary" style={styles.characterCount}>
            {message.length}/1000
          </Typography>
        </View>

        {/* Device Info Option */}
        <TouchableOpacity
          style={styles.deviceInfoOption}
          onPress={() => setIncludeDeviceInfo(!includeDeviceInfo)}
        >
          <View style={styles.deviceInfoCheckbox}>
            {includeDeviceInfo && (
              <MaterialIcons name="check" size={16} color={Colors.primary} />
            )}
          </View>
          <View style={styles.deviceInfoContent}>
            <Typography variant="body2" style={styles.deviceInfoTitle}>
              Include device information
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Help us debug issues by including your device model, OS version, and app version
            </Typography>
          </View>
        </TouchableOpacity>

        {/* Quick Feedback Options */}
        {selectedType === 'improvement' && (
          <Card style={styles.quickFeedbackCard}>
            <Typography variant="h6" style={styles.quickFeedbackTitle}>
              Quick suggestions
            </Typography>
            <Typography variant="caption" color="textSecondary" style={styles.quickFeedbackSubtitle}>
              Tap any to add to your message
            </Typography>
            
            <View style={styles.quickOptions}>
              {[
                'Improve app performance',
                'Better user interface',
                'More payment options',
                'Enhanced security',
                'Better notifications',
                'Improved search'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.quickOption}
                  onPress={() => {
                    const newMessage = message.length > 0 
                      ? `${message}\n\n${option}` 
                      : option;
                    setMessage(newMessage);
                  }}
                >
                  <Typography variant="caption" style={styles.quickOptionText}>
                    {option}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Contact Info */}
        <Card style={styles.contactCard}>
          <Typography variant="body2" style={styles.contactTitle}>
            Need immediate help?
          </Typography>
          <Typography variant="caption" color="textSecondary" style={styles.contactText}>
            For urgent issues, contact our support team at support@ilepay.com or through our help center.
          </Typography>
          <TouchableOpacity style={styles.helpCenterButton}>
            <MaterialIcons name="help-center" size={16} color={Colors.primary} />
            <Typography variant="caption" color="primary" style={styles.helpCenterText}>
              Visit Help Center
            </Typography>
          </TouchableOpacity>
        </Card>

        {/* Submit Button */}
        <Button
          title={isLoading ? 'Sending Feedback...' : 'Send Feedback'}
          onPress={handleSubmitFeedback}
          disabled={!canSubmit() || isLoading}
          style={styles.submitButton}
        />
      </ScrollView>
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
  description: {
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  typeCardsContainer: {
    gap: Spacing.md,
  },
  typeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  selectedTypeCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  typeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeCardTitle: {
    marginLeft: Spacing.md,
    flex: 1,
    fontWeight: '500',
  },
  selectedTypeCardTitle: {
    color: Colors.primary,
  },
  inputLabel: {
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  subjectInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 120,
  },
  characterCount: {
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  deviceInfoOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  deviceInfoCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  deviceInfoContent: {
    flex: 1,
  },
  deviceInfoTitle: {
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  quickFeedbackCard: {
    marginBottom: Spacing.xl,
  },
  quickFeedbackTitle: {
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  quickFeedbackSubtitle: {
    marginBottom: Spacing.md,
  },
  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
  },
  quickOptionText: {
    color: Colors.textPrimary,
  },
  contactCard: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.gray50,
  },
  contactTitle: {
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  contactText: {
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  helpCenterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpCenterText: {
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  submitButton: {
    marginBottom: Spacing.xl,
  },
});