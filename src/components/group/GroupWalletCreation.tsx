import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChatTheme, ChatSpacing } from '../../theme/chatTheme';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { GroupType, WalletCreationStatus, GROUP_TEMPLATES } from '../../types/groupTypes';

interface GroupWalletCreationProps {
  visible: boolean;
  onClose: () => void;
  groupType: GroupType;
  groupName: string;
  memberAddresses: string[];
  onWalletCreated: (walletConfig: WalletConfig) => void;
}

interface WalletConfig {
  contractAddress: string;
  signatories: string[];
  threshold: number;
  supportedTokens: string[];
  chainId: number;
}

interface BlockchainNetwork {
  id: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  gasPrice: string;
  deploymentCost: number;
  confirmationTime: number;
  icon: string;
}

const BLOCKCHAIN_NETWORKS: BlockchainNetwork[] = [
  {
    id: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    gasPrice: '25 gwei',
    deploymentCost: 0.045,
    confirmationTime: 120,
    icon: 'currency-eth',
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com/',
    explorerUrl: 'https://polygonscan.com',
    gasPrice: '30 gwei',
    deploymentCost: 0.12,
    confirmationTime: 30,
    icon: 'polygon',
  },
  {
    id: 295,
    name: 'Hedera Hashgraph',
    symbol: 'HBAR',
    rpcUrl: 'https://mainnet-public.mirrornode.hedera.com',
    explorerUrl: 'https://hashscan.io',
    gasPrice: '0.0001 HBAR',
    deploymentCost: 5,
    confirmationTime: 5,
    icon: 'h-square',
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    gasPrice: '0.1 gwei',
    deploymentCost: 0.008,
    confirmationTime: 60,
    icon: 'arbitrum',
  },
];

const WALLET_CREATION_STEPS = [
  {
    id: 'network',
    title: 'Select Network',
    description: 'Choose blockchain network for your group wallet',
    icon: 'public',
  },
  {
    id: 'configuration',
    title: 'Configure Wallet',
    description: 'Set up multi-signature requirements and permissions',
    icon: 'settings',
  },
  {
    id: 'verification',
    title: 'Verify Setup',
    description: 'Review wallet configuration and member permissions',
    icon: 'fact-check',
  },
  {
    id: 'deployment',
    title: 'Deploy Contract',
    description: 'Deploy multi-signature wallet smart contract',
    icon: 'rocket-launch',
  },
  {
    id: 'testing',
    title: 'Test Wallet',
    description: 'Verify wallet functionality and permissions',
    icon: 'bug-report',
  },
];

export const GroupWalletCreation: React.FC<GroupWalletCreationProps> = ({
  visible,
  onClose,
  groupType,
  groupName,
  memberAddresses,
  onWalletCreated,
}) => {
  const [currentStep, setCurrentStep] = useState<'network' | 'configuration' | 'verification' | 'deployment' | 'testing'>('network');
  const [selectedNetwork, setSelectedNetwork] = useState<BlockchainNetwork | null>(null);
  const [threshold, setThreshold] = useState('3');
  const [selectedTokens, setSelectedTokens] = useState<string[]>(['USDC', 'ETH']);
  const [creationStatus, setCreationStatus] = useState<WalletCreationStatus | null>(null);
  const [deploymentProgress] = useState(new Animated.Value(0));

  const template = GROUP_TEMPLATES[groupType];
  const walletConfig = template.walletConfig!;

  useEffect(() => {
    // Set default threshold based on group type
    setThreshold(walletConfig.defaultThreshold.toString());
  }, [groupType]);

  const handleClose = () => {
    setCurrentStep('network');
    setSelectedNetwork(null);
    setThreshold('3');
    setSelectedTokens(['USDC', 'ETH']);
    setCreationStatus(null);
    onClose();
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'network':
        if (selectedNetwork) setCurrentStep('configuration');
        break;
      case 'configuration':
        setCurrentStep('verification');
        break;
      case 'verification':
        setCurrentStep('deployment');
        startWalletDeployment();
        break;
      case 'deployment':
        setCurrentStep('testing');
        startWalletTesting();
        break;
      case 'testing':
        completeWalletCreation();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'configuration': setCurrentStep('network'); break;
      case 'verification': setCurrentStep('configuration'); break;
      case 'deployment': setCurrentStep('verification'); break;
      case 'testing': setCurrentStep('deployment'); break;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'network': return selectedNetwork !== null;
      case 'configuration': 
        return parseInt(threshold) >= walletConfig.minimumThreshold && 
               parseInt(threshold) <= walletConfig.maximumThreshold &&
               selectedTokens.length > 0;
      case 'verification': return true;
      case 'deployment': return creationStatus?.step === 'completed';
      case 'testing': return creationStatus?.step === 'completed';
      default: return false;
    }
  };

  const startWalletDeployment = async () => {
    const steps = [
      { step: 'initializing', message: 'Initializing wallet deployment...', progress: 10 },
      { step: 'deploying', message: 'Deploying multi-signature contract...', progress: 40 },
      { step: 'configuring', message: 'Configuring signatories and threshold...', progress: 70 },
      { step: 'completed', message: 'Wallet deployment completed!', progress: 100 },
    ];

    for (const stepData of steps) {
      setCreationStatus({
        step: stepData.step as any,
        progress: stepData.progress,
        message: stepData.message,
        txHash: stepData.step === 'deploying' ? generateMockTxHash() : undefined,
        contractAddress: stepData.step === 'completed' ? generateMockAddress() : undefined,
        estimatedTime: stepData.step === 'deploying' ? selectedNetwork?.confirmationTime : undefined,
      });

      // Animate progress
      Animated.timing(deploymentProgress, {
        toValue: stepData.progress,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const startWalletTesting = async () => {
    setCreationStatus({
      step: 'testing',
      progress: 50,
      message: 'Testing wallet functionality...',
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    setCreationStatus({
      step: 'completed',
      progress: 100,
      message: 'Wallet testing completed successfully!',
    });
  };

  const completeWalletCreation = () => {
    const walletConfig: WalletConfig = {
      contractAddress: creationStatus?.contractAddress || generateMockAddress(),
      signatories: memberAddresses,
      threshold: parseInt(threshold),
      supportedTokens: selectedTokens,
      chainId: selectedNetwork?.id || 1,
    };

    onWalletCreated(walletConfig);
    handleClose();
    Alert.alert('Success', 'Group wallet has been created successfully!');
  };

  const generateMockTxHash = (): string => {
    return '0x' + Math.random().toString(16).substr(2, 64);
  };

  const generateMockAddress = (): string => {
    return '0x' + Math.random().toString(16).substr(2, 40);
  };

  const toggleToken = (token: string) => {
    setSelectedTokens(prev => 
      prev.includes(token) 
        ? prev.filter(t => t !== token)
        : [...prev, token]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={currentStep === 'network' ? handleClose : handleBack}>
        <MaterialIcons 
          name={currentStep === 'network' ? 'close' : 'arrow-back'} 
          size={24} 
          color={ChatTheme.textPrimary} 
        />
      </TouchableOpacity>
      <Typography variant="h6" style={styles.headerTitle}>
        Create Group Wallet
      </Typography>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {WALLET_CREATION_STEPS.map((step, index) => (
        <View key={step.id} style={styles.progressStep}>
          <View style={[
            styles.progressIcon,
            WALLET_CREATION_STEPS.findIndex(s => s.id === currentStep) >= index && styles.progressIconActive
          ]}>
            <MaterialIcons 
              name={step.icon as any} 
              size={16} 
              color={WALLET_CREATION_STEPS.findIndex(s => s.id === currentStep) >= index ? 'white' : ChatTheme.textSecondary} 
            />
          </View>
          {index < WALLET_CREATION_STEPS.length - 1 && (
            <View style={[
              styles.progressLine,
              WALLET_CREATION_STEPS.findIndex(s => s.id === currentStep) > index && styles.progressLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderNetworkStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Select Blockchain Network
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Choose the blockchain network where your group wallet will be deployed
      </Typography>

      <View style={styles.networkList}>
        {BLOCKCHAIN_NETWORKS.map((network) => (
          <TouchableOpacity
            key={network.id}
            style={[
              styles.networkCard,
              selectedNetwork?.id === network.id && styles.selectedNetworkCard
            ]}
            onPress={() => setSelectedNetwork(network)}
          >
            <View style={styles.networkIcon}>
              <MaterialIcons name="public" size={24} color={ChatTheme.sendBubbleBackground} />
            </View>
            <View style={styles.networkInfo}>
              <Typography variant="h6">{network.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                Deploy Cost: {network.deploymentCost} {network.symbol}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Confirmation: ~{network.confirmationTime}s
              </Typography>
            </View>
            <View style={styles.networkMeta}>
              <Typography variant="body2" style={styles.gasPrice}>
                {network.gasPrice}
              </Typography>
              {selectedNetwork?.id === network.id && (
                <MaterialIcons name="check-circle" size={20} color={ChatTheme.sendBubbleBackground} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderConfigurationStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Configure Wallet
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Set up multi-signature requirements and supported tokens
      </Typography>

      <Card style={styles.configCard}>
        <Typography variant="h6" style={styles.configTitle}>
          Multi-Signature Threshold
        </Typography>
        <Typography variant="body2" color="textSecondary" style={styles.configDescription}>
          Number of signatures required to approve transactions
        </Typography>
        
        <View style={styles.thresholdContainer}>
          <TextInput
            style={styles.thresholdInput}
            value={threshold}
            onChangeText={setThreshold}
            keyboardType="numeric"
            maxLength={2}
          />
          <Typography variant="body1" style={styles.thresholdText}>
            out of {memberAddresses.length} members
          </Typography>
        </View>

        <Typography variant="caption" color="textSecondary">
          Recommended: {walletConfig.defaultThreshold} signatures
          (Range: {walletConfig.minimumThreshold}-{walletConfig.maximumThreshold})
        </Typography>
      </Card>

      <Card style={styles.configCard}>
        <Typography variant="h6" style={styles.configTitle}>
          Supported Tokens
        </Typography>
        <Typography variant="body2" color="textSecondary" style={styles.configDescription}>
          Select which tokens this wallet can hold
        </Typography>

        <View style={styles.tokenGrid}>
          {walletConfig.supportedTokens.map((token) => (
            <TouchableOpacity
              key={token}
              style={[
                styles.tokenChip,
                selectedTokens.includes(token) && styles.selectedTokenChip
              ]}
              onPress={() => toggleToken(token)}
            >
              <Typography variant="body2" style={[
                styles.tokenChipText,
                selectedTokens.includes(token) && styles.selectedTokenChipText
              ]}>
                {token}
              </Typography>
              {selectedTokens.includes(token) && (
                <MaterialIcons name="check" size={16} color="white" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </ScrollView>
  );

  const renderVerificationStep = () => (
    <ScrollView style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Verify Configuration
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Review your wallet configuration before deployment
      </Typography>

      <Card style={styles.verificationCard}>
        <View style={styles.verificationRow}>
          <Typography variant="body1" color="textSecondary">Network</Typography>
          <Typography variant="body1">{selectedNetwork?.name}</Typography>
        </View>
        
        <View style={styles.verificationRow}>
          <Typography variant="body1" color="textSecondary">Threshold</Typography>
          <Typography variant="body1">{threshold} of {memberAddresses.length}</Typography>
        </View>
        
        <View style={styles.verificationRow}>
          <Typography variant="body1" color="textSecondary">Deployment Cost</Typography>
          <Typography variant="body1">
            {selectedNetwork?.deploymentCost} {selectedNetwork?.symbol}
          </Typography>
        </View>
        
        <View style={styles.verificationRow}>
          <Typography variant="body1" color="textSecondary">Supported Tokens</Typography>
          <Typography variant="body1">{selectedTokens.join(', ')}</Typography>
        </View>
      </Card>

      <Card style={styles.warningCard}>
        <View style={styles.warningHeader}>
          <MaterialIcons name="warning" size={20} color={Colors.warning} />
          <Typography variant="h6" style={styles.warningTitle}>
            Important Notice
          </Typography>
        </View>
        <Typography variant="body2" color="textSecondary">
          Once deployed, the wallet configuration cannot be changed. Ensure all details are correct before proceeding.
        </Typography>
      </Card>
    </ScrollView>
  );

  const renderDeploymentStep = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Deploying Wallet
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Your group wallet smart contract is being deployed
      </Typography>

      <Card style={styles.deploymentCard}>
        <View style={styles.deploymentIcon}>
          <MaterialIcons name="rocket-launch" size={48} color={ChatTheme.sendBubbleBackground} />
        </View>

        {creationStatus && (
          <>
            <Typography variant="h6" style={styles.deploymentStatus}>
              {creationStatus.message}
            </Typography>

            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  { width: deploymentProgress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  })}
                ]} 
              />
            </View>

            <Typography variant="body2" color="textSecondary" style={styles.progressText}>
              {creationStatus.progress}% Complete
            </Typography>

            {creationStatus.txHash && (
              <View style={styles.txHashContainer}>
                <Typography variant="caption" color="textSecondary">
                  Transaction Hash:
                </Typography>
                <Typography variant="caption" style={styles.txHash}>
                  {creationStatus.txHash}
                </Typography>
              </View>
            )}

            {creationStatus.estimatedTime && (
              <Typography variant="caption" color="textSecondary">
                Estimated completion: {creationStatus.estimatedTime} seconds
              </Typography>
            )}
          </>
        )}
      </Card>
    </View>
  );

  const renderTestingStep = () => (
    <View style={styles.stepContainer}>
      <Typography variant="h4" style={styles.stepTitle}>
        Testing Wallet
      </Typography>
      <Typography variant="body1" color="textSecondary" style={styles.stepDescription}>
        Verifying wallet functionality and permissions
      </Typography>

      <Card style={styles.testingCard}>
        <View style={styles.testingIcon}>
          <MaterialIcons name="verified" size={48} color={Colors.success} />
        </View>

        <Typography variant="h6" style={styles.testingStatus}>
          {creationStatus?.message || 'Testing in progress...'}
        </Typography>

        <View style={styles.testResults}>
          <View style={styles.testResult}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Typography variant="body2">Multi-signature functionality verified</Typography>
          </View>
          <View style={styles.testResult}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Typography variant="body2">Token support configured</Typography>
          </View>
          <View style={styles.testResult}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Typography variant="body2">Member permissions set</Typography>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'network': return renderNetworkStep();
      case 'configuration': return renderConfigurationStep();
      case 'verification': return renderVerificationStep();
      case 'deployment': return renderDeploymentStep();
      case 'testing': return renderTestingStep();
      default: return renderNetworkStep();
    }
  };

  const getButtonTitle = () => {
    switch (currentStep) {
      case 'network': return 'Continue';
      case 'configuration': return 'Continue';
      case 'verification': return 'Deploy Wallet';
      case 'deployment': return canProceed() ? 'Test Wallet' : 'Deploying...';
      case 'testing': return canProceed() ? 'Complete Setup' : 'Testing...';
      default: return 'Continue';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderHeader()}
        {renderProgressIndicator()}
        {renderStepContent()}
        
        <View style={styles.footer}>
          <Button
            title={getButtonTitle()}
            onPress={handleNext}
            disabled={!canProceed()}
            style={styles.continueButton}
          />
        </View>
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: ChatTheme.background2,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ChatTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIconActive: {
    backgroundColor: ChatTheme.sendBubbleBackground,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: ChatTheme.border,
    marginHorizontal: Spacing.sm,
  },
  progressLineActive: {
    backgroundColor: ChatTheme.sendBubbleBackground,
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
  networkList: {
    gap: Spacing.md,
  },
  networkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ChatTheme.border,
    backgroundColor: ChatTheme.background1,
  },
  selectedNetworkCard: {
    borderColor: ChatTheme.sendBubbleBackground,
    backgroundColor: ChatTheme.sendBubbleBackground + '10',
  },
  networkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ChatTheme.background3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  networkInfo: {
    flex: 1,
  },
  networkMeta: {
    alignItems: 'flex-end',
  },
  gasPrice: {
    fontSize: 12,
    color: ChatTheme.textSecondary,
    marginBottom: Spacing.xs,
  },
  configCard: {
    marginBottom: Spacing.md,
  },
  configTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  configDescription: {
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  thresholdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  thresholdInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: ChatTheme.border,
    borderRadius: BorderRadius.sm,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginRight: Spacing.md,
  },
  thresholdText: {
    flex: 1,
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: ChatTheme.border,
    backgroundColor: ChatTheme.background3,
  },
  selectedTokenChip: {
    backgroundColor: ChatTheme.sendBubbleBackground,
    borderColor: ChatTheme.sendBubbleBackground,
  },
  tokenChipText: {
    marginRight: Spacing.xs,
  },
  selectedTokenChipText: {
    color: 'white',
  },
  verificationCard: {
    marginBottom: Spacing.md,
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ChatTheme.border,
  },
  warningCard: {
    backgroundColor: Colors.warning + '10',
    borderColor: Colors.warning + '30',
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  warningTitle: {
    marginLeft: Spacing.sm,
    color: Colors.warning,
  },
  deploymentCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  deploymentIcon: {
    marginBottom: Spacing.lg,
  },
  deploymentStatus: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: ChatTheme.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: ChatTheme.sendBubbleBackground,
  },
  progressText: {
    marginBottom: Spacing.md,
  },
  txHashContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  txHash: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: ChatTheme.textSecondary,
  },
  testingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  testingIcon: {
    marginBottom: Spacing.lg,
  },
  testingStatus: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  testResults: {
    gap: Spacing.md,
    width: '100%',
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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