import { StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  disabledSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    opacity: 0.7,
  },
  disabledText: {
    color: Colors.gray700,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  signupButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: Colors.background,
    fontWeight: '600',
  },
  disabledItem: {
    opacity: 0.5,
  },

  // Cards
  balanceCard: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['4xl'],
  },

  // Sections
  section: {
    marginBottom: Spacing['3xl'],
  },

  // Wallet Screen
  walletHeader: {
    marginBottom: Spacing['3xl'],
  },
  connectCard: {
    alignItems: 'center',
  },

  // Placeholder
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['4xl'],
  },

  // Chat
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  chatHeader: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  // Token row
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  tokenRowSpacing: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  // Contact row
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },

  // Enhanced Contact Styles
  contactsContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  enhancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addContactButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '10',
  },
  requestsButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '10',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  friendRequestsSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  friendRequestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  friendRequestAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  friendRequestInfo: {
    flex: 1,
  },
  pendingRequestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pendingRequestsTitle: {
    fontWeight: '600',
  },
  viewAllRequestsButton: {
    padding: Spacing.xs,
  },
  pendingIndicator: {
    backgroundColor: Colors.warning + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  pendingIndicatorText: {
    color: Colors.warning,
    fontWeight: '600',
    fontSize: 12,
  },
  sentIndicator: {
    backgroundColor: Colors.info + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  sentIndicatorText: {
    color: Colors.info,
    fontWeight: '600',
    fontSize: 12,
  },
  pendingRequestActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  acceptButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    fontSize: 16,
    color: Colors.gray700,
  },
  clearSearchButton: {
    padding: Spacing.xs,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  filterTab: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
    minWidth: 60,
    alignItems: 'center',
    height: 32,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    color: Colors.gray600,
    fontSize: 12,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: Colors.white,
    fontWeight: '600',
  },
  friendRequestList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  friendRequestItem: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: Spacing.xs,
  },
  friendRequestName: {
    fontWeight: '600',
  },
  friendRequestMessage: {
    color: Colors.gray500,
  },
  friendRequestTimestamp: {
    color: Colors.gray400,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  friendRequestBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  enhancedContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  enhancedContactInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  contactName: {
    fontWeight: '600',
  },
  trustBadge: {
    marginLeft: Spacing.xs,
  },
  contactRole: {
    marginTop: Spacing.xs,
  },
  contactStats: {
    marginTop: Spacing.xs,
  },
  contactActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '10',
  },

  // Device contacts
  deviceContactsPrompt: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  deviceContactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  deviceContactsTitle: {
    fontWeight: '600',
  },
  deviceContactsDescription: {
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  syncContactsButton: {
    width: '100%',
  },
  deviceContactsSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  deviceContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  inviteButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  avatarText: {
    color: Colors.gray600,
    fontWeight: '600',
  },

  // Contact profile
  contactProfileContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contactProfileHeader: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  contactProfileAvatar: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  contactProfileName: {
    fontWeight: '700',
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  contactProfileRole: {
    color: Colors.gray500,
  },
  contactProfileActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  contactProfileActionButton: {
    flex: 1,
  },
  contactProfileSection: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  contactProfileSectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  contactProfileStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  contactProfileFooter: {
    marginTop: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.md,
  },

  // Empty Contacts
  emptyContactsContainer: {
    marginTop: Spacing['3xl'],
  },
  emptyContactsText: {
    textAlign: 'center',
    color: Colors.gray500,
    marginTop: Spacing.md,
  },

  // Wallet Specific Styles
  walletActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  walletActionButton: {
    flex: 1,
  },
  walletActionCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  walletActionTitle: {
    fontWeight: '600',
  },
  walletActionDescription: {
    color: Colors.gray500,
  },
  walletSection: {
    marginTop: Spacing['2xl'],
  },
  walletSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  walletSectionTitle: {
    fontWeight: '600',
  },
  walletSectionAction: {
    color: Colors.primary,
  },
  walletTokensGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  walletTokenCard: {
    width: '48%',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  walletTokenName: {
    fontWeight: '600',
  },
  walletTokenBalance: {
    color: Colors.gray500,
  },
  walletTokenPercentage: {
    color: Colors.success,
  },

  // Moments
  momentsContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  momentsScrollView: {
    flex: 1,
  },
  momentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  refreshHint: {
    marginTop: Spacing.xs,
  },
  momentItem: {
    backgroundColor: Colors.background,
    marginBottom: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray200,
  },
  momentUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  momentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  momentUserDetails: {
    gap: 2,
  },
  momentUserName: {
    fontWeight: '600',
  },
  momentDeleteContainer: {
    position: 'relative',
  },
  momentDeleteButton: {
    padding: Spacing.xs,
  },
  deleteDropdown: {
    position: 'absolute',
    top: 28,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  deleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  deleteOptionText: {
    marginLeft: Spacing.xs,
  },
  momentPostContent: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  momentPostImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  momentActions: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  momentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xl,
  },
  momentActionText: {
    marginLeft: Spacing.xs,
    color: Colors.gray600,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  errorContainer: {
    marginBottom: Spacing.md,
  },
  pullToRefreshText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemSpacing: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  inviteBadge: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  inviteBadgeText: {
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },

  // Wallet Specific Styles
  backButton: {
    padding: Spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  portfolioSection: {
    marginBottom: Spacing.xl,
  },
  portfolioGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  portfolioItem: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    flex: 1,
  },
  portfolioLabel: {
    marginTop: Spacing.sm,
    fontWeight: '500',
    color: Colors.primary,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  serviceItem: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    width: '22%',
    minHeight: 80,
    justifyContent: 'center',
  },
  serviceLabel: {
    marginTop: Spacing.sm,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
    fontSize: 10,
  },

  // Device Contacts Empty
  deviceContactsEmpty: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
