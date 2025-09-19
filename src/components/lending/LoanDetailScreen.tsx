import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { LoanRequest, LoanOffer } from '../../types/lending';

interface LoanDetailScreenProps {
  loan: LoanRequest;
  onBack: () => void;
  onMakeOffer: (offer: Partial<LoanOffer>) => void;
  onFundLoan: (amount: number) => void;
  onContactBorrower: () => void;
}

export const LoanDetailScreen: React.FC<LoanDetailScreenProps> = ({
  loan,
  onBack,
  onMakeOffer,
  onFundLoan,
  onContactBorrower,
}) => {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState(loan.amount.toString());
  const [proposedAPR, setProposedAPR] = useState(loan.proposedAPR.toString());
  const [offerMessage, setOfferMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'borrower' | 'collateral' | 'terms'>('overview');

  const fundingProgress = loan.fundedAmount / loan.requestedAmount;
  const remainingAmount = loan.requestedAmount - loan.fundedAmount;
  const monthlyPayment = Math.round(loan.amount * (1 + loan.proposedAPR / 100) / loan.term);
  const totalRepayment = loan.amount * (1 + loan.proposedAPR / 100);

  const handleMakeOffer = () => {
    const offer: Partial<LoanOffer> = {
      loanRequestId: loan.id,
      offeredAmount: parseFloat(offerAmount),
      proposedAPR: parseFloat(proposedAPR),
      message: offerMessage,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'pending',
    };
    
    onMakeOffer(offer);
    setShowOfferModal(false);
    Alert.alert('Offer Submitted', 'Your lending offer has been sent to the borrower');
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return Colors.success;
      case 'medium': return Colors.warning;
      case 'high': return Colors.error;
      default: return Colors.gray500;
    }
  };

  const renderTrustBadge = (badge: string | null) => {
    if (!badge) return null;
    
    const badgeConfig = {
      verified: { icon: 'verified', color: Colors.success },
      premium: { icon: 'star', color: Colors.secondary },
      agent: { icon: 'business', color: Colors.primary },
    };
    
    const config = badgeConfig[badge as keyof typeof badgeConfig];
    if (!config) return null;
    
    return (
      <View style={[styles.trustBadge, { backgroundColor: config.color + '20' }]}>
        <MaterialIcons name={config.icon as any} size={16} color={config.color} />
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Typography variant="h3">Loan Details</Typography>
      <TouchableOpacity style={styles.moreButton}>
        <MaterialIcons name="more-vert" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  const renderLoanSummary = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.loanAmount}>
        <Typography variant="h2" style={styles.amountText}>
          ${loan.amount.toLocaleString()} {loan.currency}
        </Typography>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(loan.riskLevel) + '20' }]}>
          <Typography 
            variant="caption" 
            style={[styles.riskText, { color: getRiskColor(loan.riskLevel) }]}
          >
            {loan.riskLevel.toUpperCase()} RISK
          </Typography>
        </View>
      </View>
      
      <View style={styles.loanMeta}>
        <View style={styles.metaItem}>
          <Typography variant="caption" color="textSecondary">Term</Typography>
          <Typography variant="body1" style={styles.metaValue}>{loan.term} months</Typography>
        </View>
        <View style={styles.metaItem}>
          <Typography variant="caption" color="textSecondary">APR</Typography>
          <Typography variant="body1" style={styles.metaValue}>{loan.proposedAPR}%</Typography>
        </View>
        <View style={styles.metaItem}>
          <Typography variant="caption" color="textSecondary">Type</Typography>
          <Typography variant="body1" style={styles.metaValue}>
            {loan.type === 'collateralized' ? 'Secured' : 'Unsecured'}
          </Typography>
        </View>
      </View>

      <View style={styles.fundingProgress}>
        <View style={styles.fundingHeader}>
          <Typography variant="body2" color="textSecondary">Funding Progress</Typography>
          <Typography variant="body2" style={styles.fundingAmount}>
            ${loan.fundedAmount.toLocaleString()} / ${loan.requestedAmount.toLocaleString()}
          </Typography>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${Math.min(fundingProgress * 100, 100)}%` }]} 
          />
        </View>
        <Typography variant="caption" color="textSecondary">
          {Math.round(fundingProgress * 100)}% funded • ${remainingAmount.toLocaleString()} remaining
        </Typography>
      </View>
    </Card>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { key: 'overview', label: 'Overview' },
        { key: 'borrower', label: 'Borrower' },
        { key: 'collateral', label: 'Collateral' },
        { key: 'terms', label: 'Terms' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Typography 
            variant="body2" 
            style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}
          >
            {tab.label}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <View>
      <Card style={styles.sectionCard}>
        <Typography variant="h6" style={styles.sectionTitle}>Loan Purpose</Typography>
        <Typography variant="body1" style={styles.purposeText}>
          {loan.purpose}
        </Typography>
      </Card>

      <Card style={styles.sectionCard}>
        <Typography variant="h6" style={styles.sectionTitle}>Financial Details</Typography>
        <View style={styles.detailRow}>
          <Typography variant="body2" color="textSecondary">Monthly Payment</Typography>
          <Typography variant="body2" style={styles.detailValue}>
            ~${monthlyPayment.toLocaleString()}
          </Typography>
        </View>
        <View style={styles.detailRow}>
          <Typography variant="body2" color="textSecondary">Total Repayment</Typography>
          <Typography variant="body2" style={styles.detailValue}>
            ${totalRepayment.toLocaleString()}
          </Typography>
        </View>
        <View style={styles.detailRow}>
          <Typography variant="body2" color="textSecondary">Platform Fee</Typography>
          <Typography variant="body2" style={styles.detailValue}>
            {loan.platformFee}%
          </Typography>
        </View>
        <View style={styles.detailRow}>
          <Typography variant="body2" color="textSecondary">Created</Typography>
          <Typography variant="body2" style={styles.detailValue}>
            {loan.createdAt.toLocaleDateString()}
          </Typography>
        </View>
      </Card>

      {loan.type === 'collateralized' && loan.collateral && (
        <Card style={styles.sectionCard}>
          <Typography variant="h6" style={styles.sectionTitle}>Collateral Security</Typography>
          <View style={styles.collateralSummary}>
            <MaterialIcons name="security" size={24} color={Colors.success} />
            <View style={styles.collateralInfo}>
              <Typography variant="body1" style={styles.collateralName}>
                {loan.collateral.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {loan.collateral.amount} {loan.collateral.symbol} • ${loan.collateral.currentValue.toLocaleString()}
              </Typography>
            </View>
            <Typography variant="body2" color="success" style={styles.ltvRatio}>
              {(loan.collateral.ltvRatio * 100).toFixed(0)}% LTV
            </Typography>
          </View>
        </Card>
      )}
    </View>
  );

  const renderBorrowerTab = () => (
    <View>
      <Card style={styles.sectionCard}>
        <Typography variant="h6" style={styles.sectionTitle}>Borrower Profile</Typography>
        <View style={styles.borrowerProfile}>
          <View style={styles.borrowerHeader}>
            <View style={styles.borrowerAvatarContainer}>
              {loan.borrower.avatar ? (
                <Image source={{ uri: loan.borrower.avatar }} style={styles.borrowerAvatar} />
              ) : (
                <View style={styles.borrowerAvatar}>
                  <Typography variant="h6" style={styles.borrowerAvatarText}>
                    {loan.borrower.name.split(' ').map(n => n[0]).join('')}
                  </Typography>
                </View>
              )}
              {renderTrustBadge(loan.borrower.trustBadge)}
            </View>
            <View style={styles.borrowerInfo}>
              <Typography variant="h5" style={styles.borrowerName}>
                {loan.borrower.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {loan.borrower.region}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Member since {loan.borrower.joinDate}
              </Typography>
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Typography variant="h6" style={styles.sectionTitle}>Credit Profile</Typography>
        <View style={styles.creditStats}>
          <View style={styles.creditStatItem}>
            <Typography variant="h4" color="success">
              {loan.creditScore.trustPercentage}%
            </Typography>
            <Typography variant="caption" color="textSecondary">Trust Score</Typography>
          </View>
          <View style={styles.creditStatItem}>
            <Typography variant="h4" color="secondary">
              {loan.creditScore.bricksCount.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">Bricks Earned</Typography>
          </View>
          <View style={styles.creditStatItem}>
            <Typography variant="h4" color="primary">
              {loan.creditScore.totalLoansCount}
            </Typography>
            <Typography variant="caption" color="textSecondary">Past Loans</Typography>
          </View>
        </View>
        
        <View style={styles.creditDetails}>
          <View style={styles.detailRow}>
            <Typography variant="body2" color="textSecondary">KYC Level</Typography>
            <Typography variant="body2" color="primary" style={styles.detailValue}>
              {loan.creditScore.kycLevel}
            </Typography>
          </View>
          <View style={styles.detailRow}>
            <Typography variant="body2" color="textSecondary">Default Rate</Typography>
            <Typography variant="body2" color="success" style={styles.detailValue}>
              {(loan.creditScore.defaultRate * 100).toFixed(1)}%
            </Typography>
          </View>
          <View style={styles.detailRow}>
            <Typography variant="body2" color="textSecondary">Avg Repayment Time</Typography>
            <Typography variant="body2" style={styles.detailValue}>
              {loan.creditScore.avgRepaymentTime} days
            </Typography>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderCollateralTab = () => {
    if (loan.type === 'uncollateralized') {
      return (
        <Card style={styles.sectionCard}>
          <View style={styles.emptyState}>
            <MaterialIcons name="security" size={48} color={Colors.gray400} />
            <Typography variant="h6" style={styles.emptyTitle}>
              No Collateral Required
            </Typography>
            <Typography variant="body2" color="textSecondary" style={styles.emptyText}>
              This is an unsecured loan based on the borrower's credit profile
            </Typography>
          </View>
        </Card>
      );
    }

    if (!loan.collateral) return null;

    return (
      <View>
        <Card style={styles.sectionCard}>
          <Typography variant="h6" style={styles.sectionTitle}>Collateral Asset</Typography>
          <View style={styles.collateralDetail}>
            <View style={styles.collateralIcon}>
              <MaterialIcons name={loan.collateral.icon as any} size={32} color={Colors.primary} />
            </View>
            <View style={styles.collateralMetadata}>
              <Typography variant="h5" style={styles.collateralName}>
                {loan.collateral.name}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {loan.collateral.amount} {loan.collateral.symbol}
              </Typography>
              <Typography variant="h6" color="primary">
                ${loan.collateral.currentValue.toLocaleString()}
              </Typography>
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Typography variant="h6" style={styles.sectionTitle}>Risk Metrics</Typography>
          <View style={styles.riskMetrics}>
            <View style={styles.riskMetricItem}>
              <Typography variant="h4" color="primary">
                {(loan.collateral.ltvRatio * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="textSecondary">Loan-to-Value</Typography>
            </View>
            <View style={styles.riskMetricItem}>
              <Typography variant="h4" color="warning">
                {(loan.collateral.liquidationThreshold * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="textSecondary">Liquidation</Typography>
            </View>
            <View style={styles.riskMetricItem}>
              <Typography variant="h4" color="success">
                {((loan.collateral.currentValue - loan.amount) / loan.amount * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="textSecondary">Buffer</Typography>
            </View>
          </View>
          
          <Typography variant="body2" color="textSecondary" style={styles.riskNote}>
            If collateral value drops below liquidation threshold, it may be liquidated to protect lenders.
          </Typography>
        </Card>
      </View>
    );
  };

  const renderTermsTab = () => (
    <View>
      <Card style={styles.sectionCard}>
        <Typography variant="h6" style={styles.sectionTitle}>Repayment Terms</Typography>
        <View style={styles.termsGrid}>
          <View style={styles.termItem}>
            <Typography variant="caption" color="textSecondary">Loan Amount</Typography>
            <Typography variant="h6">${loan.amount.toLocaleString()}</Typography>
          </View>
          <View style={styles.termItem}>
            <Typography variant="caption" color="textSecondary">Interest Rate</Typography>
            <Typography variant="h6">{loan.proposedAPR}% APR</Typography>
          </View>
          <View style={styles.termItem}>
            <Typography variant="caption" color="textSecondary">Term Length</Typography>
            <Typography variant="h6">{loan.term} months</Typography>
          </View>
          <View style={styles.termItem}>
            <Typography variant="caption" color="textSecondary">Monthly Payment</Typography>
            <Typography variant="h6">${monthlyPayment.toLocaleString()}</Typography>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Typography variant="h6" style={styles.sectionTitle}>Platform Terms</Typography>
        <View style={styles.platformTerms}>
          <View style={styles.detailRow}>
            <Typography variant="body2" color="textSecondary">Platform Fee</Typography>
            <Typography variant="body2" style={styles.detailValue}>
              {loan.platformFee}% of interest
            </Typography>
          </View>
          <View style={styles.detailRow}>
            <Typography variant="body2" color="textSecondary">Late Payment Fee</Typography>
            <Typography variant="body2" style={styles.detailValue}>
              2% per month
            </Typography>
          </View>
          <View style={styles.detailRow}>
            <Typography variant="body2" color="textSecondary">Early Repayment</Typography>
            <Typography variant="body2" style={styles.detailValue}>
              Allowed with 7 days notice
            </Typography>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'borrower': return renderBorrowerTab();
      case 'collateral': return renderCollateralTab();
      case 'terms': return renderTermsTab();
      default: return renderOverviewTab();
    }
  };

  const renderActionButtons = () => (
    <View style={styles.actionSection}>
      <View style={styles.actionButtons}>
        <Button
          title="Contact Borrower"
          icon="message"
          variant="outline"
          onPress={onContactBorrower}
          style={styles.actionButton}
        />
        <Button
          title="Make Offer"
          icon="handshake"
          onPress={() => setShowOfferModal(true)}
          style={styles.actionButton}
        />
      </View>
      
      {remainingAmount > 0 && (
        <Button
          title={`Fund $${remainingAmount.toLocaleString()}`}
          icon="payment"
          onPress={() => onFundLoan(remainingAmount)}
          style={styles.fundButton}
        />
      )}
    </View>
  );

  const renderOfferModal = () => (
    <Modal visible={showOfferModal} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowOfferModal(false)}>
            <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Typography variant="h6" style={styles.modalTitle}>
            Make Lending Offer
          </Typography>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Typography variant="body1" style={styles.inputLabel}>Offer Amount</Typography>
            <TextInput
              style={styles.textInput}
              value={offerAmount}
              onChangeText={setOfferAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="body1" style={styles.inputLabel}>Proposed APR (%)</Typography>
            <TextInput
              style={styles.textInput}
              value={proposedAPR}
              onChangeText={setProposedAPR}
              placeholder="Enter interest rate"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="body1" style={styles.inputLabel}>Message (Optional)</Typography>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={offerMessage}
              onChangeText={setOfferMessage}
              placeholder="Add a personal message to the borrower..."
              multiline
              numberOfLines={4}
            />
          </View>

          <Card style={styles.offerSummary}>
            <Typography variant="h6" style={styles.summaryTitle}>Offer Summary</Typography>
            <View style={styles.summaryRow}>
              <Typography variant="body2" color="textSecondary">Loan Amount:</Typography>
              <Typography variant="body2" style={styles.summaryValue}>
                ${parseFloat(offerAmount || '0').toLocaleString()}
              </Typography>
            </View>
            <View style={styles.summaryRow}>
              <Typography variant="body2" color="textSecondary">Interest Rate:</Typography>
              <Typography variant="body2" style={styles.summaryValue}>
                {proposedAPR}% APR
              </Typography>
            </View>
            <View style={styles.summaryRow}>
              <Typography variant="body2" color="textSecondary">Monthly Return:</Typography>
              <Typography variant="body2" color="primary" style={styles.summaryValue}>
                ${Math.round(parseFloat(offerAmount || '0') * parseFloat(proposedAPR || '0') / 100 / 12).toLocaleString()}
              </Typography>
            </View>
          </Card>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            title="Submit Offer"
            onPress={handleMakeOffer}
            disabled={!offerAmount || !proposedAPR}
            style={styles.submitButton}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderLoanSummary()}
        {renderTabNavigation()}
        {renderTabContent()}
      </ScrollView>
      
      {renderActionButtons()}
      {renderOfferModal()}
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
  moreButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  loanAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  amountText: {
    fontWeight: '700',
    color: Colors.primary,
  },
  riskBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  riskText: {
    fontWeight: '600',
    fontSize: 10,
  },
  loanMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaValue: {
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  fundingProgress: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: Spacing.lg,
  },
  fundingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  fundingAmount: {
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  tabNavigation: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  sectionCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  purposeText: {
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  detailValue: {
    fontWeight: '500',
  },
  collateralSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collateralInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  collateralName: {
    fontWeight: '600',
  },
  ltvRatio: {
    fontWeight: '600',
  },
  borrowerProfile: {
    marginBottom: Spacing.md,
  },
  borrowerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  borrowerAvatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  borrowerAvatar: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowerAvatarText: {
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  trustBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  borrowerInfo: {
    flex: 1,
  },
  borrowerName: {
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  creditStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  creditStatItem: {
    alignItems: 'center',
  },
  creditDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: Spacing.md,
  },
  collateralDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collateralIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  collateralMetadata: {
    flex: 1,
  },
  riskMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  riskMetricItem: {
    alignItems: 'center',
  },
  riskNote: {
    fontStyle: 'italic',
    backgroundColor: Colors.gray100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  termsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  termItem: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  platformTerms: {
    gap: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    marginVertical: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
  },
  actionSection: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    backgroundColor: Colors.surface,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  fundButton: {
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    fontWeight: '600',
  },
  headerSpacer: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  offerSummary: {
    marginTop: Spacing.md,
  },
  summaryTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    fontWeight: '500',
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  submitButton: {
    width: '100%',
  },
});