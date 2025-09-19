import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../chat/Avatar';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface GroupProposalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onProposalCreated: (proposal: ProposalData) => void;
}

interface ProposalData {
  type: ProposalType;
  title: string;
  description: string;
  amount?: number;
  token?: string;
  votingDeadline: Date;
  requiredApprovals: number;
  details: any;
}

type ProposalType = 'investment' | 'withdrawal' | 'member_add' | 'member_remove' | 'settings' | 'loan';

interface Vote {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  vote: 'approve' | 'reject';
  timestamp: Date;
}

interface ExistingProposal {
  id: string;
  type: ProposalType;
  title: string;
  description: string;
  proposer: {
    name: string;
    avatar?: string;
  };
  amount?: number;
  token?: string;
  votingDeadline: Date;
  requiredApprovals: number;
  currentApprovals: number;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  votes: Vote[];
  createdAt: Date;
}

const PROPOSAL_TYPES = [
  {
    id: 'investment' as ProposalType,
    title: 'Investment Proposal',
    description: 'Propose a new investment opportunity',
    icon: 'trending-up',
    color: Colors.success,
  },
  {
    id: 'withdrawal' as ProposalType,
    title: 'Withdrawal Request',
    description: 'Request funds from group treasury',
    icon: 'account-balance-wallet',
    color: Colors.error,
  },
  {
    id: 'member_add' as ProposalType,
    title: 'Add Member',
    description: 'Propose adding a new group member',
    icon: 'person-add',
    color: ChatTheme.sendBubbleBackground,
  },
  {
    id: 'member_remove' as ProposalType,
    title: 'Remove Member',
    description: 'Propose removing a group member',
    icon: 'person-remove',
    color: Colors.warning,
  },
  {
    id: 'settings' as ProposalType,
    title: 'Group Settings',
    description: 'Change group rules or permissions',
    icon: 'settings',
    color: ChatTheme.textSecondary,
  },
  {
    id: 'loan' as ProposalType,
    title: 'Member Loan',
    description: 'Request a loan from group funds',
    icon: 'handshake',
    color: Colors.warning,
  },
];

const SAMPLE_PROPOSALS: ExistingProposal[] = [
  {
    id: '1',
    type: 'investment',
    title: 'Downtown Property Investment',
    description: 'Invest $5,000 in fractional ownership of downtown commercial property with 8% expected annual return.',
    proposer: { name: 'Sarah Anderson', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    amount: 5000,
    token: 'USDC',
    votingDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days
    requiredApprovals: 3,
    currentApprovals: 2,
    status: 'pending',
    votes: [
      {
        id: '1',
        memberId: '1',
        memberName: 'You',
        vote: 'approve',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: '2',
        memberId: '2',
        memberName: 'Michael Roberts',
        memberAvatar: 'https://randomuser.me/api/portraits/men/2.jpg',
        vote: 'approve',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: '2',
    type: 'withdrawal',
    title: 'Emergency Fund Withdrawal',
    description: 'Request $500 withdrawal for emergency home repairs.',
    proposer: { name: 'Emma Thompson', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    amount: 500,
    token: 'USDC',
    votingDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
    requiredApprovals: 3,
    currentApprovals: 1,
    status: 'pending',
    votes: [
      {
        id: '3',
        memberId: '3',
        memberName: 'David Chen',
        memberAvatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        vote: 'approve',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
];

export const GroupProposal: React.FC<GroupProposalProps> = ({
  visible,
  onClose,
  groupId,
  groupName,
  onProposalCreated,
}) => {
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [step, setStep] = useState<'type' | 'details' | 'voting' | 'review'>('type');
  const [selectedType, setSelectedType] = useState<ProposalType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('USDC');
  const [votingDays, setVotingDays] = useState('3');
  const [requiredApprovals, setRequiredApprovals] = useState('3');
  const [isLoading, setIsLoading] = useState(false);
  const [proposals] = useState<ExistingProposal[]>(SAMPLE_PROPOSALS);

  const handleClose = () => {
    setMode('list');
    setStep('type');
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setAmount('');
    setToken('USDC');
    setVotingDays('3');
    setRequiredApprovals('3');
    onClose();
  };

  const handleCreateProposal = () => {
    setMode('create');
    setStep('type');
  };

  const handleNext = () => {
    switch (step) {
      case 'type':
        if (selectedType) setStep('details');
        break;
      case 'details':
        if (title.trim() && description.trim()) setStep('voting');
        break;
      case 'voting':
        setStep('review');
        break;
      case 'review':
        handleSubmitProposal();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'details': setStep('type'); break;
      case 'voting': setStep('details'); break;
      case 'review': setStep('voting'); break;
      default: setMode('list'); break;
    }
  };

  const handleSubmitProposal = async () => {
    if (!selectedType || !title.trim() || !description.trim()) return;

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const proposalData: ProposalData = {
        type: selectedType,
        title: title.trim(),
        description: description.trim(),
        amount: amount ? parseFloat(amount) : undefined,
        token: amount ? token : undefined,
        votingDeadline: new Date(Date.now() + parseInt(votingDays) * 24 * 60 * 60 * 1000),
        requiredApprovals: parseInt(requiredApprovals),
        details: {},
      };

      onProposalCreated(proposalData);
      handleClose();
      Alert.alert('Success', 'Your proposal has been submitted for group voting!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create proposal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = (proposalId: string, vote: 'approve' | 'reject') => {
    Alert.alert(
      'Confirm Vote',
      `Are you sure you want to ${vote} this proposal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: vote === 'approve' ? 'Approve' : 'Reject',
          onPress: () => {
            // Handle vote submission
            Alert.alert('Vote Recorded', `Your ${vote} vote has been recorded.`);
          },
        },
      ]
    );
  };

  const formatTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={mode === 'list' ? handleClose : handleBack}>
        <MaterialIcons 
          name={mode === 'list' ? 'close' : 'arrow-back'} 
          size={24} 
          color={ChatTheme.textPrimary} 
        />
      </TouchableOpacity>
      <Typography variant="h6" style={styles.headerTitle}>
        {mode === 'list' ? 'Group Proposals' : 'Create Proposal'}
      </Typography>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderProposalItem = ({ item }: { item: ExistingProposal }) => {
    const proposalType = PROPOSAL_TYPES.find(t => t.id === item.type);
    const hasVoted = item.votes.some(vote => vote.memberName === 'You');
    const userVote = item.votes.find(vote => vote.memberName === 'You');

    return (
      <Card style={styles.proposalCard}>
        <View style={styles.proposalHeader}>
          <View style={[styles.proposalTypeIcon, { backgroundColor: proposalType?.color + '20' }]}>
            <MaterialIcons name={proposalType?.icon as any} size={20} color={proposalType?.color} />
          </View>
          <View style={styles.proposalInfo}>
            <Typography variant="h6" numberOfLines={1}>{item.title}</Typography>
            <Typography variant="caption" color="textSecondary">
              by {item.proposer.name} • {formatTimeRemaining(item.votingDeadline)}
            </Typography>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Typography variant="caption" style={styles.statusText}>
              {item.status}
            </Typography>
          </View>
        </View>

        <Typography variant="body2" style={styles.proposalDescription} numberOfLines={2}>
          {item.description}
        </Typography>

        {item.amount && (
          <View style={styles.proposalAmount}>
            <Typography variant="h6" style={styles.amountText}>
              {item.amount.toLocaleString()} {item.token}
            </Typography>
          </View>
        )}

        <View style={styles.votingProgress}>
          <View style={styles.progressInfo}>
            <Typography variant="caption" color="textSecondary">
              {item.currentApprovals}/{item.requiredApprovals} approvals needed
            </Typography>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(item.currentApprovals / item.requiredApprovals) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {item.status === 'pending' && !hasVoted && (
          <View style={styles.voteButtons}>
            <Button
              title="Reject"
              onPress={() => handleVote(item.id, 'reject')}
              variant="outline"
              size="small"
              style={[styles.voteButton, styles.rejectButton]}
            />
            <Button
              title="Approve"
              onPress={() => handleVote(item.id, 'approve')}
              size="small"
              style={styles.voteButton}
            />
          </View>
        )}

        {hasVoted && (
          <View style={styles.votedIndicator}>
            <MaterialIcons 
              name={userVote?.vote === 'approve' ? 'check-circle' : 'cancel'} 
              size={16} 
              color={userVote?.vote === 'approve' ? Colors.success : Colors.error} 
            />
            <Typography variant="caption" style={styles.votedText}>
              You voted to {userVote?.vote}
            </Typography>
          </View>
        )}
      </Card>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'approved': return Colors.success;
      case 'rejected': return Colors.error;
      case 'executed': return ChatTheme.sendBubbleBackground;
      default: return ChatTheme.textSecondary;
    }
  };

  const renderProposalsList = () => (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <Typography variant="h6">Active Proposals</Typography>
        <Button
          title="Create Proposal"
          onPress={handleCreateProposal}
          size="small"
        />
      </View>

      <FlatList
        data={proposals}
        renderItem={renderProposalItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.proposalsList}
      />
    </View>
  );

  const renderTypeStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Proposal Type
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        What would you like to propose to the group?
      </Typography>

      <View style={styles.typeGrid}>
        {PROPOSAL_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              selectedType === type.id && styles.selectedTypeCard
            ]}
            onPress={() => setSelectedType(type.id)}
          >
            <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
              <MaterialIcons name={type.icon as any} size={24} color={type.color} />
            </View>
            <View style={styles.typeInfo}>
              <Typography variant="h6">{type.title}</Typography>
              <Typography variant="caption" color="textSecondary">{type.description}</Typography>
            </View>
            {selectedType === type.id && (
              <MaterialIcons name="check-circle" size={20} color={ChatTheme.sendBubbleBackground} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderDetailsStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Proposal Details
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Provide details about your proposal
      </Typography>

      <Card style={styles.detailsCard}>
        <Typography variant="body1" style={styles.inputLabel}>Title</Typography>
        <TextInput
          style={styles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Brief title for your proposal"
        />

        <Typography variant="body1" style={styles.inputLabel}>Description</Typography>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Detailed description of your proposal"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {(selectedType === 'investment' || selectedType === 'withdrawal' || selectedType === 'loan') && (
          <>
            <Typography variant="body1" style={styles.inputLabel}>Amount</Typography>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              <View style={styles.tokenSelector}>
                <Typography variant="body1">{token}</Typography>
              </View>
            </View>
          </>
        )}
      </Card>
    </ScrollView>
  );

  const renderVotingStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Voting Settings
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Configure how the voting will work
      </Typography>

      <Card style={styles.votingCard}>
        <Typography variant="body1" style={styles.inputLabel}>Voting Period (days)</Typography>
        <TextInput
          style={styles.textInput}
          value={votingDays}
          onChangeText={setVotingDays}
          placeholder="3"
          keyboardType="numeric"
        />

        <Typography variant="body1" style={styles.inputLabel}>Required Approvals</Typography>
        <TextInput
          style={styles.textInput}
          value={requiredApprovals}
          onChangeText={setRequiredApprovals}
          placeholder="3"
          keyboardType="numeric"
        />
      </Card>
    </ScrollView>
  );

  const renderReviewStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Review Proposal
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Review your proposal before submitting
      </Typography>

      <Card style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <Typography variant="body1" color="textSecondary">Type</Typography>
          <Typography variant="body1">
            {PROPOSAL_TYPES.find(t => t.id === selectedType)?.title}
          </Typography>
        </View>

        <View style={styles.reviewRow}>
          <Typography variant="body1" color="textSecondary">Title</Typography>
          <Typography variant="body1">{title}</Typography>
        </View>

        {amount && (
          <View style={styles.reviewRow}>
            <Typography variant="body1" color="textSecondary">Amount</Typography>
            <Typography variant="body1">{amount} {token}</Typography>
          </View>
        )}

        <View style={styles.reviewRow}>
          <Typography variant="body1" color="textSecondary">Voting Period</Typography>
          <Typography variant="body1">{votingDays} days</Typography>
        </View>

        <View style={styles.reviewRow}>
          <Typography variant="body1" color="textSecondary">Required Approvals</Typography>
          <Typography variant="body1">{requiredApprovals}</Typography>
        </View>

        <View style={styles.descriptionSection}>
          <Typography variant="body1" color="textSecondary" style={styles.descriptionLabel}>
            Description
          </Typography>
          <Typography variant="body2">{description}</Typography>
        </View>
      </Card>
    </ScrollView>
  );

  const renderCreateFlow = () => {
    const canProceed = () => {
      switch (step) {
        case 'type': return selectedType !== null;
        case 'details': return title.trim().length > 0 && description.trim().length > 0;
        case 'voting': return votingDays && requiredApprovals;
        case 'review': return true;
        default: return false;
      }
    };

    const getStepTitle = () => {
      switch (step) {
        case 'type': return 'Next';
        case 'details': return 'Next';
        case 'voting': return 'Review';
        case 'review': return isLoading ? 'Creating...' : 'Create Proposal';
        default: return 'Next';
      }
    };

    const renderStepContent = () => {
      switch (step) {
        case 'type': return renderTypeStep();
        case 'details': return renderDetailsStep();
        case 'voting': return renderVotingStep();
        case 'review': return renderReviewStep();
        default: return renderTypeStep();
      }
    };

    return (
      <View style={styles.container}>
        {renderStepContent()}
        
        <View style={styles.footer}>
          <Button
            title={getStepTitle()}
            onPress={handleNext}
            disabled={!canProceed() || isLoading}
            style={styles.continueButton}
          />
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        {mode === 'list' ? renderProposalsList() : renderCreateFlow()}
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
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  proposalsList: {
    padding: Spacing.lg,
  },
  proposalCard: {
    marginBottom: Spacing.md,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  proposalTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  proposalInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    color: 'white',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  proposalDescription: {
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  proposalAmount: {
    marginBottom: Spacing.sm,
  },
  amountText: {
    color: ChatTheme.sendBubbleBackground,
    fontWeight: '600',
  },
  votingProgress: {
    marginBottom: Spacing.md,
  },
  progressInfo: {
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: ChatTheme.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ChatTheme.sendBubbleBackground,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  voteButton: {
    flex: 1,
  },
  rejectButton: {
    borderColor: Colors.error,
  },
  votedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  votedText: {
    marginLeft: Spacing.sm,
    color: ChatTheme.textSecondary,
  },
  stepContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  stepTitle: {
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  typeGrid: {
    gap: Spacing.sm,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ChatTheme.border,
    backgroundColor: ChatTheme.background1,
  },
  selectedTypeCard: {
    borderColor: ChatTheme.sendBubbleBackground,
    backgroundColor: ChatTheme.sendBubbleBackground + '10',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  typeInfo: {
    flex: 1,
  },
  detailsCard: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontWeight: '500',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: ChatTheme.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    backgroundColor: ChatTheme.background1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChatTheme.border,
    borderRadius: BorderRadius.md,
    backgroundColor: ChatTheme.background1,
  },
  amountInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 16,
  },
  tokenSelector: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: ChatTheme.border,
  },
  votingCard: {
    marginBottom: Spacing.md,
  },
  reviewCard: {
    marginBottom: Spacing.md,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  descriptionSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
  },
  descriptionLabel: {
    marginBottom: Spacing.sm,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ChatTheme.border,
  },
  continueButton: {
    width: '100%',
  },
});