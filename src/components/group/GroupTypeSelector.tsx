import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { GroupType, GROUP_TEMPLATES } from '../../types/groupTypes';

interface GroupTypeSelectorProps {
  visible: boolean;
  onClose: () => void;
  onTypeSelected: (type: GroupType) => void;
}

interface GroupTypeInfo {
  type: GroupType;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  color: string;
  features: string[];
  useCases: string[];
  complexity: 'Simple' | 'Medium' | 'Advanced';
  hasWallet: boolean;
  requiresKYC: boolean;
  memberRange: string;
}

const GROUP_TYPES: GroupTypeInfo[] = [
  {
    type: 'normal',
    title: 'Normal Group',
    description: 'Basic messaging and file sharing',
    longDescription: 'Perfect for family, friends, or simple team communication. Focus on messaging with basic collaboration features.',
    icon: 'chat',
    color: Colors.primary,
    features: ['Messaging', 'File Sharing', 'Voice/Video Calls', 'Message History'],
    useCases: ['Family Chat', 'Friend Groups', 'Study Groups', 'Social Clubs'],
    complexity: 'Simple',
    hasWallet: false,
    requiresKYC: false,
    memberRange: '2-500',
  },
  {
    type: 'contribution',
    title: 'Contribution Group',
    description: 'Regular pooled contributions with goal tracking',
    longDescription: 'Ideal for groups that want to save money together regularly. Features contribution tracking, goals, and basic wallet functionality.',
    icon: 'savings',
    color: Colors.success,
    features: ['Messaging', 'Regular Contributions', 'Goal Tracking', 'Analytics', 'Group Wallet'],
    useCases: ['Vacation Savings', 'Gift Funds', 'Event Planning', 'Emergency Funds'],
    complexity: 'Medium',
    hasWallet: true,
    requiresKYC: false,
    memberRange: '2-50',
  },
  {
    type: 'investment',
    title: 'Investment Group',
    description: 'Collaborative investing with proposals and voting',
    longDescription: 'Advanced investment club with proposal system, voting mechanism, and portfolio management. Perfect for serious investors.',
    icon: 'trending-up',
    color: ChatTheme.sendBubbleBackground,
    features: ['Messaging', 'Investment Proposals', 'Voting System', 'Portfolio Tracking', 'Yield Distribution', 'Multi-sig Wallet'],
    useCases: ['Real Estate Investment', 'Stock Clubs', 'Crypto Trading', 'Venture Capital'],
    complexity: 'Advanced',
    hasWallet: true,
    requiresKYC: true,
    memberRange: '3-20',
  },
  {
    type: 'savings',
    title: 'Savings Group',
    description: 'Goal-based saving with interest and penalties',
    longDescription: 'Structured savings group with interest earning, withdrawal penalties, and streak tracking. Great for disciplined saving.',
    icon: 'account-balance',
    color: Colors.warning,
    features: ['Messaging', 'Goal-based Saving', 'Interest Earning', 'Streak Tracking', 'Penalty System', 'Group Wallet'],
    useCases: ['Emergency Fund', 'House Down Payment', 'Education Fund', 'Retirement Savings'],
    complexity: 'Medium',
    hasWallet: true,
    requiresKYC: false,
    memberRange: '2-30',
  },
  {
    type: 'business',
    title: 'Business Group',
    description: 'Small business collaboration with financial tracking',
    longDescription: 'Complete business management solution with expense tracking, revenue management, invoicing, and tax reporting.',
    icon: 'business',
    color: Colors.info,
    features: ['Messaging', 'Expense Tracking', 'Revenue Management', 'Invoicing', 'Tax Reporting', 'Business Wallet'],
    useCases: ['Startup Teams', 'Freelancer Collectives', 'Small Business', 'Project Partnerships'],
    complexity: 'Advanced',
    hasWallet: true,
    requiresKYC: true,
    memberRange: '2-15',
  },
  {
    type: 'dao',
    title: 'DAO Group',
    description: 'Decentralized governance with treasury management',
    longDescription: 'Full DAO functionality with governance tokens, proposals, voting, treasury management, and decentralized decision making.',
    icon: 'account-tree',
    color: Colors.secondary,
    features: ['Messaging', 'Governance System', 'Token Management', 'Treasury', 'Proposal Voting', 'Multi-sig Wallet'],
    useCases: ['DeFi Protocols', 'NFT Communities', 'Investment DAOs', 'Social Impact Groups'],
    complexity: 'Advanced',
    hasWallet: true,
    requiresKYC: true,
    memberRange: '5-1000',
  },
];

export const GroupTypeSelector: React.FC<GroupTypeSelectorProps> = ({
  visible,
  onClose,
  onTypeSelected,
}) => {
  const [selectedType, setSelectedType] = useState<GroupType | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleTypeSelect = (type: GroupType) => {
    setSelectedType(type);
    setShowDetails(true);
  };

  const handleConfirm = () => {
    if (selectedType) {
      onTypeSelected(selectedType);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setShowDetails(false);
    onClose();
  };

  const handleBack = () => {
    setShowDetails(false);
    setSelectedType(null);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={showDetails ? handleBack : handleClose}>
        <MaterialIcons 
          name={showDetails ? 'arrow-back' : 'close'} 
          size={24} 
          color={ChatTheme.textPrimary} 
        />
      </TouchableOpacity>
      <Typography variant="h6" style={styles.headerTitle}>
        {showDetails ? 'Group Type Details' : 'Choose Group Type'}
      </Typography>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderTypeCard = (typeInfo: GroupTypeInfo) => (
    <TouchableOpacity
      key={typeInfo.type}
      style={styles.typeCard}
      onPress={() => handleTypeSelect(typeInfo.type)}
    >
      <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
        <MaterialIcons name={typeInfo.icon as any} size={32} color={typeInfo.color} />
      </View>
      
      <View style={styles.typeContent}>
        <View style={styles.typeHeader}>
          <Typography variant="h5" style={styles.typeTitle}>
            {typeInfo.title}
          </Typography>
          <View style={[styles.complexityBadge, { backgroundColor: getComplexityColor(typeInfo.complexity) }]}>
            <Typography variant="caption" style={styles.complexityText}>
              {typeInfo.complexity}
            </Typography>
          </View>
        </View>
        
        <Typography variant="body2" color="textSecondary" style={styles.typeDescription}>
          {typeInfo.description}
        </Typography>
        
        <View style={styles.typeFeatures}>
          {typeInfo.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Typography variant="caption" style={styles.featureText}>
                {feature}
              </Typography>
            </View>
          ))}
          {typeInfo.features.length > 3 && (
            <View style={styles.featureTag}>
              <Typography variant="caption" style={styles.featureText}>
                +{typeInfo.features.length - 3} more
              </Typography>
            </View>
          )}
        </View>
        
        <View style={styles.typeMeta}>
          <View style={styles.metaItem}>
            <MaterialIcons 
              name={typeInfo.hasWallet ? 'account-balance-wallet' : 'chat'} 
              size={16} 
              color={ChatTheme.textSecondary} 
            />
            <Typography variant="caption" color="textSecondary">
              {typeInfo.hasWallet ? 'Has Wallet' : 'No Wallet'}
            </Typography>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="group" size={16} color={ChatTheme.textSecondary} />
            <Typography variant="caption" color="textSecondary">
              {typeInfo.memberRange} members
            </Typography>
          </View>
          {typeInfo.requiresKYC && (
            <View style={styles.metaItem}>
              <MaterialIcons name="verified-user" size={16} color={ChatTheme.textSecondary} />
              <Typography variant="caption" color="textSecondary">
                KYC Required
              </Typography>
            </View>
          )}
        </View>
      </View>
      
      <MaterialIcons name="chevron-right" size={24} color={ChatTheme.textSecondary} />
    </TouchableOpacity>
  );

  const renderTypeDetails = () => {
    const typeInfo = GROUP_TYPES.find(t => t.type === selectedType);
    if (!typeInfo) return null;

    const template = GROUP_TEMPLATES[selectedType!];

    return (
      <ScrollView style={styles.detailsContainer}>
        <Card style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={[styles.detailsIcon, { backgroundColor: typeInfo.color + '20' }]}>
              <MaterialIcons name={typeInfo.icon as any} size={40} color={typeInfo.color} />
            </View>
            <View style={styles.detailsInfo}>
              <Typography variant="h4" style={styles.detailsTitle}>
                {typeInfo.title}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {typeInfo.longDescription}
              </Typography>
            </View>
          </View>
        </Card>

        <Card style={styles.featuresCard}>
          <Typography variant="h6" style={styles.sectionTitle}>
            Key Features
          </Typography>
          <View style={styles.featuresList}>
            {typeInfo.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                <Typography variant="body2" style={styles.featureItemText}>
                  {feature}
                </Typography>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.useCasesCard}>
          <Typography variant="h6" style={styles.sectionTitle}>
            Perfect For
          </Typography>
          <View style={styles.useCasesList}>
            {typeInfo.useCases.map((useCase, index) => (
              <View key={index} style={styles.useCaseTag}>
                <Typography variant="body2" style={styles.useCaseText}>
                  {useCase}
                </Typography>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.requirementsCard}>
          <Typography variant="h6" style={styles.sectionTitle}>
            Requirements
          </Typography>
          
          <View style={styles.requirementItem}>
            <MaterialIcons name="group" size={20} color={ChatTheme.textSecondary} />
            <View style={styles.requirementText}>
              <Typography variant="body1">Member Count</Typography>
              <Typography variant="caption" color="textSecondary">
                {template.minimumMembers} - {template.maximumMembers || '∞'} members
              </Typography>
            </View>
          </View>

          {typeInfo.hasWallet && (
            <View style={styles.requirementItem}>
              <MaterialIcons name="account-balance-wallet" size={20} color={ChatTheme.textSecondary} />
              <View style={styles.requirementText}>
                <Typography variant="body1">Group Wallet</Typography>
                <Typography variant="caption" color="textSecondary">
                  Multi-signature wallet will be created
                </Typography>
              </View>
            </View>
          )}

          {typeInfo.requiresKYC && (
            <View style={styles.requirementItem}>
              <MaterialIcons name="verified-user" size={20} color={ChatTheme.textSecondary} />
              <View style={styles.requirementText}>
                <Typography variant="body1">Identity Verification</Typography>
                <Typography variant="caption" color="textSecondary">
                  KYC verification required for all members
                </Typography>
              </View>
            </View>
          )}

          <View style={styles.requirementItem}>
            <MaterialIcons name="assessment" size={20} color={ChatTheme.textSecondary} />
            <View style={styles.requirementText}>
              <Typography variant="body1">Complexity Level</Typography>
              <Typography variant="caption" color="textSecondary">
                {typeInfo.complexity} - {getComplexityDescription(typeInfo.complexity)}
              </Typography>
            </View>
          </View>
        </Card>
      </ScrollView>
    );
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return Colors.success;
      case 'Medium': return Colors.warning;
      case 'Advanced': return Colors.error;
      default: return ChatTheme.textSecondary;
    }
  };

  const getComplexityDescription = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return 'Easy to set up and use';
      case 'Medium': return 'Moderate setup with financial features';
      case 'Advanced': return 'Complex setup with governance features';
      default: return '';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        
        {!showDetails ? (
          <ScrollView style={styles.typesContainer}>
            <Typography variant="h4" style={styles.mainTitle}>
              What type of group would you like to create?
            </Typography>
            <Typography variant="body1" color="textSecondary" style={styles.subtitle}>
              Each type offers different features and capabilities
            </Typography>
            
            <View style={styles.typesList}>
              {GROUP_TYPES.map(renderTypeCard)}
            </View>
          </ScrollView>
        ) : (
          renderTypeDetails()
        )}
        
        {showDetails && (
          <View style={styles.footer}>
            <Button
              title={`Create ${GROUP_TYPES.find(t => t.type === selectedType)?.title}`}
              onPress={handleConfirm}
              style={styles.confirmButton}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatTheme.background1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSpacer: {
    width: 24,
  },
  typesContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  mainTitle: {
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  typesList: {
    gap: Spacing.md,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: ChatTheme.background1,
    borderWidth: 1,
    borderColor: ChatTheme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  typeContent: {
    flex: 1,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  typeTitle: {
    fontWeight: '600',
    flex: 1,
  },
  complexityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  complexityText: {
    color: 'white',
    fontWeight: '500',
  },
  typeDescription: {
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  typeFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  featureTag: {
    backgroundColor: ChatTheme.background3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  featureText: {
    fontSize: 10,
    color: ChatTheme.textSecondary,
  },
  typeMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  detailsContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  detailsCard: {
    marginBottom: Spacing.md,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  detailsInfo: {
    flex: 1,
  },
  detailsTitle: {
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  featuresCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  featuresList: {
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureItemText: {
    flex: 1,
  },
  useCasesCard: {
    marginBottom: Spacing.md,
  },
  useCasesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  useCaseTag: {
    backgroundColor: ChatTheme.background3,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  useCaseText: {
    color: ChatTheme.textPrimary,
  },
  requirementsCard: {
    marginBottom: Spacing.md,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  requirementText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
  },
  confirmButton: {
    width: '100%',
  },
});